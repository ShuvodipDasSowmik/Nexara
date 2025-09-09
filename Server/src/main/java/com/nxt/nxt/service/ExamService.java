package com.nxt.nxt.service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.nxt.nxt.dto.EvaluationDetailDTO;
import com.nxt.nxt.dto.EvaluationResultDTO;
import com.nxt.nxt.dto.ExamGenerationRequest;
import com.nxt.nxt.dto.ExamSummaryDTO;
import com.nxt.nxt.dto.QuestionDTO;
import com.nxt.nxt.dto.QuestionSummaryDTO;
import com.nxt.nxt.dto.SubmitAnswerDTO;
import com.nxt.nxt.entity.Exam;
import com.nxt.nxt.entity.Question;
import com.nxt.nxt.entity.Student;
import com.nxt.nxt.entity.StudentAnswer;
import com.nxt.nxt.repositories.ExamRepository;
import com.nxt.nxt.repositories.QuestionRepository;
import com.nxt.nxt.repositories.StudentRepository;
import com.nxt.nxt.repositories.StudentBestScoreRepository;
import com.nxt.nxt.repositories.StudentAnswerRepository;

@Service
public class ExamService {
    private final OpenAIService openAIService;
    private final ExamRepository examRepository;
    private final QuestionRepository questionRepository;
    private final StudentRepository studentRepository;
    private final StudentBestScoreRepository studentBestScoreRepository;
    private final StudentAnswerRepository studentAnswerRepository;
    private final ObjectMapper objectMapper;

    public ExamService(OpenAIService openAIService, 
                      ExamRepository examRepository, 
                      QuestionRepository questionRepository,
                      StudentRepository studentRepository,
                      StudentBestScoreRepository studentBestScoreRepository,
                      StudentAnswerRepository studentAnswerRepository) {
        this.openAIService = openAIService;
        this.examRepository = examRepository;
        this.questionRepository = questionRepository;
        this.studentRepository = studentRepository;
        this.studentBestScoreRepository = studentBestScoreRepository;
        this.studentAnswerRepository = studentAnswerRepository;
        this.objectMapper = new ObjectMapper();
    }

    public Integer generateExam(ExamGenerationRequest request) {
        // Build prompt for question generation
        String prompt = createPrompt(request.getInputText(), request.getQuestionCount(), request.getExamType());
        // Model is now handled inside OpenAIService

        // 2. Call AI service
        String aiResponseContent = openAIService.getExamGeneration(prompt);

        // 3. Parse AI response into questions
        List<Question> questions = parseQuestionsFromString(aiResponseContent, request.getQuestionCount(), request.getExamType());
        
        // 4. Save exam to database
        Exam exam = new Exam();
        // ID will be generated automatically by db
        exam.setTitle(request.getTitle() != null ? request.getTitle() : "AI Generated Exam");
        exam.setDescription(request.getDescription() != null ? request.getDescription() : "Auto-generated exam based on: " + request.getInputText());
        exam.setInputText(request.getInputText());
        exam.setCreatedAt(LocalDateTime.now());
        
       // Set student for exam
        UUID studentId = request.getStudentId();
        if (studentId == null) {
            studentId = getOrCreateTestStudent();
        }
        exam.setStudentId(studentId);
        
        examRepository.save(exam);
        
        for (int i = 0; i < questions.size(); i++) {
            Question question = questions.get(i);
            question.setExamId(exam.getId().longValue());
            try {
                questionRepository.save(question);
                System.out.println("Successfully saved question " + (i+1));
            }
            catch (Exception e) {
                e.printStackTrace();
            }
        }
        
        return exam.getId();
    }

    public List<QuestionDTO> getExamQuestions(Integer examId) {
        // Fetching questions and maping to DTOs hiding correct answers
        List<Question> questions = questionRepository.findByExamId(examId);
        List<QuestionDTO> result = new ArrayList<>(questions.size());
        for (Question q : questions) {
            result.add(new QuestionDTO(
                q.getId(),
                q.getQuestionText(),
                q.getOptionA(),
                q.getOptionB(),
                q.getOptionC(),
                q.getOptionD(),
                q.getQuestionType()
            ));
        }
        return result;
    }

    public EvaluationResultDTO evaluateExam(Integer examId, List<SubmitAnswerDTO> answers, UUID studentId) {
        // Check if student already took this exam
        if (studentBestScoreRepository.findByStudentIdAndExamId(studentId, examId).isPresent()) {
            // Already taken, do not allow again
            return null;
        }

        // Load questions for exam
        List<Question> questions = questionRepository.findByExamId(examId);
        if (answers == null) {
            answers = java.util.Collections.emptyList();
        }
        // Maps for lookup
        var correctById = new java.util.HashMap<Integer, String>();
        var questionById = new java.util.HashMap<Integer, Question>();
        for (Question q : questions) {
            correctById.put(q.getId(), q.getCorrectAnswer());
            questionById.put(q.getId(), q);
        }

        List<EvaluationDetailDTO> details = new ArrayList<>();
        int totalScore = 0;
        int maxPossibleScore = 0;
        
        for (SubmitAnswerDTO ans : answers) {
            Question q = questionById.get(ans.getQuestionId());
            if (q == null) continue;
            
            boolean isCorrect = false;
            String correctAnswer = "";
            String userAnswer = ans.getSelected() != null ? ans.getSelected() : "";
            
            if ("subjective".equals(q.getQuestionType())) {
                // Evaluate subjective answer using AI
                int subjectiveScore = evaluateSubjectiveAnswer(
                    q.getQuestionText(), 
                    userAnswer, 
                    q.getSubjectiveAnswer()
                );
                totalScore += subjectiveScore;
                maxPossibleScore += 10; // Subjective questions are scored out of 10
                
                // Consider it "correct" if score is 7 or above (for statistics)
                isCorrect = subjectiveScore >= 7;
                correctAnswer = String.valueOf(subjectiveScore) + "/10";
                
                StudentAnswer studentAnswer = new StudentAnswer(
                    studentId, examId, ans.getQuestionId(), 
                    userAnswer + " [Score: " + subjectiveScore + "/10]", 
                    isCorrect
                );
                studentAnswerRepository.save(studentAnswer);
                
            } else {
                // Handle multiple choice questions
                String correct = correctById.get(ans.getQuestionId());
                String correctNorm = normalizeAnswer(correct);
                String selectedNorm = normalizeAnswer(ans.getSelected());

                //  if selected is not a clean letter, trying to resolve from option text
                if (selectedNorm == null && q != null && ans.getSelected() != null) {
                    String sel = ans.getSelected().trim();
                    if (sel.equalsIgnoreCase(q.getOptionA())) selectedNorm = "A";
                    else if (sel.equalsIgnoreCase(q.getOptionB())) selectedNorm = "B";
                    else if (sel.equalsIgnoreCase(q.getOptionC())) selectedNorm = "C";
                    else if (sel.equalsIgnoreCase(q.getOptionD())) selectedNorm = "D";
                }
                
                isCorrect = correctNorm != null && correctNorm.equals(selectedNorm);
                if (isCorrect) totalScore += 10; // Multiple choice questions worth 10 points each
                maxPossibleScore += 10;
                correctAnswer = correctNorm;
                userAnswer = selectedNorm;
                
                StudentAnswer studentAnswer = new StudentAnswer(
                    studentId, examId, ans.getQuestionId(), 
                    selectedNorm != null ? selectedNorm : ans.getSelected(), 
                    isCorrect
                );
                studentAnswerRepository.save(studentAnswer);
            }
            
            details.add(new EvaluationDetailDTO(
                ans.getQuestionId(),
                isCorrect,
                correctAnswer,
                userAnswer
            ));
        }

        double percentage = maxPossibleScore > 0 ? (totalScore * 100.0 / maxPossibleScore) : 0.0;
        com.nxt.nxt.entity.StudentBestScore bestScore = new com.nxt.nxt.entity.StudentBestScore(studentId, examId, java.math.BigDecimal.valueOf(percentage));
        studentBestScoreRepository.save(bestScore);

        // For the result, calculate how many questions were "correct" (for display purposes)
        int correctCount = (int) details.stream().filter(EvaluationDetailDTO::isCorrect).count();
        EvaluationResultDTO result = new EvaluationResultDTO(correctCount, questions.size(), details);
        return result;
    }

    private String normalizeAnswer(String s) {
        if (s == null) return null;
        s = s.trim();
        if (s.isEmpty()) return null;
        // Only keep first letter A-D if longer strings accidentally stored
        char c = Character.toUpperCase(s.charAt(0));
        if (c >= 'A' && c <= 'D') return String.valueOf(c);
        String up = s.toUpperCase();
        if (up.startsWith("OPTION A") || up.equals("A")) return "A";
        if (up.startsWith("OPTION B") || up.equals("B")) return "B";
        if (up.startsWith("OPTION C") || up.equals("C")) return "C";
        if (up.startsWith("OPTION D") || up.equals("D")) return "D";
        return s.length() == 1 ? String.valueOf(c) : null;
    }

    private int resolveCorrectIndex(String fullAnswer, List<String> options) {
        if (options == null || options.isEmpty()) return 0;
        if (fullAnswer == null || fullAnswer.trim().isEmpty()) return 0;
        String norm = normalizeAnswer(fullAnswer);
        if (norm != null) {
            char c = norm.charAt(0);
            int idx = c - 'A';
            if (idx >= 0 && idx < options.size()) return idx;
        }
        // Try exact text match
        for (int i = 0; i < options.size(); i++) {
            if (options.get(i) != null && options.get(i).equalsIgnoreCase(fullAnswer)) return i;
        }
        // Try contains either way
        String faLower = fullAnswer.toLowerCase();
        for (int i = 0; i < options.size(); i++) {
            String opt = options.get(i);
            if (opt == null) continue;
            String ol = opt.toLowerCase();
            if (ol.contains(faLower) || faLower.contains(ol)) return i;
        }
        return 0;
    }
    private String createPrompt(String inputText, Integer questionCount, String examType) {
        int numQuestions = questionCount != null ? questionCount : 5;
        String type = examType != null ? examType : "multiple_choice";
        
        if ("subjective".equals(type)) {
            return String.format("""
                CRITICAL INSTRUCTION: You must generate EXACTLY %d subjective questions. Count them carefully!
                
                Topic: %s
                
                REQUIRED COUNT: %d questions (no more, no less)
                
                Format your response as a valid JSON array with this exact structure:
                [
                  {
                    "questionText": "Explain in detail...",
                    "questionType": "subjective",
                    "subjectiveAnswer": "A comprehensive answer should include: key points about..., explanation of..., examples such as..., and conclusion that..."
                  }
                ]
                
                STRICT REQUIREMENTS:
                - Generate EXACTLY %d questions (verify count before responding)
                - Each question should be open-ended and require detailed explanations
                - Questions should test deep understanding and analytical thinking
                - Include a detailed expected answer guide in 'subjectiveAnswer' field
                - Use clear, academic language
                - Questions should encourage critical thinking and detailed responses
                - Return ONLY the JSON array, no additional text or explanation
                - Double-check that your array contains exactly %d questions
                """, numQuestions, inputText, numQuestions, numQuestions, numQuestions);
        } else {
            return String.format("""
                CRITICAL INSTRUCTION: You must generate EXACTLY %d multiple choice questions. Count them carefully!
                
                Topic: %s
                
                REQUIRED COUNT: %d questions (no more, no less)
                
                Format your response as a valid JSON array with this exact structure:
                [
                  {
                    "questionText": "What is...",
                    "questionType": "multiple_choice",
                    "options": ["Option A", "Option B", "Option C", "Option D"],
                    "correctAnswer": "Option A"
                  }
                ]
                
                STRICT REQUIREMENTS:
                - Generate EXACTLY %d questions (verify count before responding)
                - Each question must have exactly 4 options
                - Mark the correct answer clearly (must match one of the options exactly)
                - Questions should test understanding, not just memorization
                - Use clear, concise language
                - Return ONLY the JSON array, no additional text or explanation
                - Double-check that your array contains exactly %d questions
                """, numQuestions, inputText, numQuestions, numQuestions, numQuestions);
        }
    }

    private List<Question> parseQuestionsFromString(String aiResponseContent, Integer requestedQuestionCount, String examType) {
        List<Question> questions = new ArrayList<>();
        int questionCount = requestedQuestionCount != null ? requestedQuestionCount : 5;
        String questionType = examType != null ? examType : "multiple_choice";
        
        try {
            System.out.println("AI Response received: " + aiResponseContent);
            System.out.println("AI Response length: " + aiResponseContent.length());
            
            String jsonContent = cleanJsonContent(aiResponseContent);
            System.out.println("Cleaned JSON content: " + jsonContent);
            
            JsonNode questionsArray = objectMapper.readTree(jsonContent);
            if (questionsArray.isArray()) {
                System.out.println("Successfully parsed JSON array with " + questionsArray.size() + " questions");
                
                for (JsonNode questionNode : questionsArray) {
                    Question question = new Question();
                    question.setQuestionText(questionNode.get("questionText").asText());
                    
                    // Check if it's a subjective question
                    JsonNode questionTypeNode = questionNode.get("questionType");
                    String currentQuestionType = questionTypeNode != null ? questionTypeNode.asText() : "multiple_choice";
                    question.setQuestionType(currentQuestionType);
                    
                    if ("subjective".equals(currentQuestionType)) {
                        // Handle subjective questions
                        JsonNode subjectiveAnswerNode = questionNode.get("subjectiveAnswer");
                        if (subjectiveAnswerNode != null) {
                            question.setSubjectiveAnswer(subjectiveAnswerNode.asText());
                        }
                        // For subjective questions, we don't set options
                        question.setOptionA("");
                        question.setOptionB("");
                        question.setOptionC("");
                        question.setOptionD("");
                        question.setCorrectAnswer("S"); // Single character for subjective questions
                    } else {
                        // Handle multiple choice questions
                        question.setQuestionType("multiple_choice");
                        JsonNode optionsNode = questionNode.get("options");
                        List<String> optionsList = new ArrayList<>();
                        for (JsonNode option : optionsNode) {
                            optionsList.add(option.asText());
                        }
                        String fullAnswer = questionNode.get("correctAnswer").asText();
                        int correctIndexOriginal = resolveCorrectIndex(fullAnswer, optionsList);
                        if (correctIndexOriginal < 0 || correctIndexOriginal >= optionsList.size()) {
                            correctIndexOriginal = 0;
                        }
                        String correctOptionText = optionsList.get(correctIndexOriginal);
                        java.util.Collections.shuffle(optionsList);
                        question.setOptions(String.join(",", optionsList));
                        int newIndex = 0;
                        for (int i = 0; i < optionsList.size(); i++) {
                            if (optionsList.get(i).equalsIgnoreCase(correctOptionText)) {
                                newIndex = i;
                                break;
                            }
                        }
                        question.setCorrectAnswer(String.valueOf((char)('A' + newIndex)));
                    }
                    questions.add(question);
                }
                System.out.println("Successfully parsed " + questions.size() + " questions");
                
                // Validate question count
                if (questions.size() != questionCount) {
                    System.err.println("WARNING: AI generated " + questions.size() + " questions but " + questionCount + " were requested");
                    // If AI generated fewer questions than requested, we'll use what we got
                    // If AI generated more questions than requested, truncate to requested count
                    if (questions.size() > questionCount) {
                        System.out.println("Truncating to " + questionCount + " questions as requested");
                        questions = questions.subList(0, questionCount);
                    }
                }
            } else {
                System.err.println("AI response is not a valid JSON array");
                System.err.println("Response content: " + aiResponseContent);
            }
        } catch (Exception e) {
            System.err.println("Error parsing AI response: " + e.getMessage());
            System.err.println("AI response content: " + aiResponseContent);
            e.printStackTrace();
            System.err.println("Falling back to default questions");
            questions = createFallbackQuestions(questionCount, questionType);
        }
        return questions;
    }

    private String cleanJsonContent(String content) {
        // Remove any text before the first '[' and after the last ']'
        int startIndex = content.indexOf('[');
        int endIndex = content.lastIndexOf(']');
        
        if (startIndex != -1 && endIndex != -1 && endIndex > startIndex) {
            return content.substring(startIndex, endIndex + 1);
        }
        
        return content;
    }

    private List<Question> createFallbackQuestions(int requestedCount) {
        return createFallbackQuestions(requestedCount, "multiple_choice");
    }
    
    private List<Question> createFallbackQuestions(int requestedCount, String questionType) {
        List<Question> fallbackQuestions = new ArrayList<>();
        
        if ("subjective".equals(questionType)) {
            // Subjective fallback questions
            String[] subjectiveQuestions = {
                "Explain the concept of object-oriented programming and its key principles.",
                "Discuss the advantages and disadvantages of using inheritance in software design.",
                "Analyze the role of polymorphism in creating flexible and maintainable code.",
                "Describe the differences between abstract classes and interfaces, providing examples.",
                "Explain the importance of encapsulation in software development.",
                "Discuss the concept of design patterns and their benefits in software engineering.",
                "Analyze the trade-offs between different data structures for specific use cases.",
                "Explain the principles of SOLID design and their practical applications.",
                "Describe the importance of unit testing in software development lifecycle.",
                "Discuss the challenges and benefits of concurrent programming.",
                "Explain the concept of software architecture and its impact on system design.",
                "Analyze the role of algorithms in problem-solving and computational efficiency.",
                "Describe the importance of code documentation and maintainability.",
                "Discuss the evolution of programming languages and their paradigms.",
                "Explain the concept of software versioning and its best practices.",
                "Analyze the impact of cloud computing on modern software development.",
                "Describe the principles of database design and normalization.",
                "Discuss the importance of security considerations in software development.",
                "Explain the concept of software testing methodologies and their applications.",
                "Analyze the role of continuous integration and deployment in modern development."
            };
            
            String[] subjectiveAnswers = {
                "A comprehensive answer should cover the four main principles: encapsulation, inheritance, polymorphism, and abstraction, with examples and benefits.",
                "Discussion should include code reusability benefits, complexity issues, tight coupling problems, and alternatives like composition.",
                "Answer should explain runtime polymorphism, method overriding, interface implementation, and how it enables flexible design patterns.",
                "Comparison should cover constructors, multiple inheritance, default methods, and practical use cases for each approach.",
                "Explanation should include data hiding, access modifiers, getter/setter methods, and benefits for maintainability and security.",
                "Answer should cover common patterns like Singleton, Factory, Observer, and their benefits in solving recurring design problems.",
                "Analysis should compare arrays, linked lists, trees, hash tables, and their time/space complexity for different operations.",
                "Discussion should cover Single Responsibility, Open/Closed, Liskov Substitution, Interface Segregation, and Dependency Inversion principles.",
                "Answer should explain test-driven development, test coverage, automated testing, and benefits for code quality and maintenance.",
                "Discussion should cover threading, synchronization, deadlocks, race conditions, and modern concurrent programming models.",
                "Explanation should cover architectural patterns, scalability, maintainability, and the role of architecture in system design.",
                "Analysis should cover algorithm complexity, optimization techniques, and the importance of choosing appropriate algorithms.",
                "Answer should discuss code comments, documentation tools, naming conventions, and their impact on team collaboration.",
                "Discussion should cover procedural, object-oriented, functional paradigms, and how languages have evolved to meet different needs.",
                "Explanation should cover semantic versioning, branching strategies, release management, and compatibility considerations.",
                "Analysis should cover scalability, distributed systems, microservices, and how cloud platforms change development practices.",
                "Answer should cover entity-relationship modeling, normalization forms, indexing, and database optimization techniques.",
                "Discussion should cover secure coding practices, authentication, authorization, encryption, and common security vulnerabilities.",
                "Explanation should cover unit testing, integration testing, system testing, and agile testing methodologies.",
                "Analysis should cover automation benefits, deployment pipelines, version control integration, and DevOps practices."
            };
            
            int questionsToGenerate = Math.min(requestedCount, subjectiveQuestions.length);
            for (int i = 0; i < questionsToGenerate; i++) {
                Question question = new Question();
                question.setQuestionText(subjectiveQuestions[i]);
                question.setQuestionType("subjective");
                question.setSubjectiveAnswer(subjectiveAnswers[i]);
                question.setOptionA("");
                question.setOptionB("");
                question.setOptionC("");
                question.setOptionD("");
                question.setCorrectAnswer("S");
                fallbackQuestions.add(question);
            }
        } else {
            // Multiple choice fallback questions (existing logic)
            String[] questionTexts = {
                "What is the primary benefit of object-oriented programming?",
                "Which keyword is used to inherit a class in Java?",
                "What does polymorphism allow in Java?",
                "What is the difference between abstract class and interface?",
                "Which design principle promotes loose coupling?",
                "What is the purpose of the 'final' keyword in Java?",
                "Which collection type maintains insertion order?",
                "What is the main advantage of using generics?",
                "Which keyword is used for exception handling?",
                "What is the purpose of the 'static' keyword?",
                "Which principle suggests a class should have only one reason to change?",
                "What is the difference between overloading and overriding?",
                "Which data structure follows Last In First Out principle?",
                "What is the purpose of garbage collection?",
                "Which keyword prevents method overriding?",
                "What is the main benefit of using interfaces?",
                "Which loop is guaranteed to execute at least once?",
                "What is the difference between == and equals() method?",
                "Which keyword is used to create a constant in Java?",
                "What is the purpose of the 'this' keyword?"
            };
            
            String[][] options = {
                {"Code reusability", "Faster execution", "Smaller file size", "Better graphics"},
                {"implements", "extends", "inherits", "super"},
                {"Multiple inheritance", "Method overloading", "Dynamic method binding", "All of the above"},
                {"Abstract class can have constructors", "Interface can have method implementation", "Both are same", "Abstract class is faster"},
                {"Dependency Injection", "Singleton Pattern", "Factory Pattern", "Observer Pattern"},
                {"Makes variable constant", "Prevents inheritance", "Prevents overriding", "All of the above"},
                {"LinkedList", "ArrayList", "HashSet", "TreeSet"},
                {"Type safety", "Performance", "Code reusability", "All of the above"},
                {"try", "catch", "throw", "All of the above"},
                {"Creates instance variables", "Belongs to class not instance", "Used for inheritance", "None of the above"},
                {"Single Responsibility", "Open/Closed", "Liskov Substitution", "Interface Segregation"},
                {"Same method name different parameters vs same signature different implementation", "Both are same", "Overloading is faster", "Overriding is compile time"},
                {"Stack", "Queue", "LinkedList", "ArrayList"},
                {"Automatic memory management", "Faster execution", "Better security", "Code optimization"},
                {"final", "static", "private", "protected"},
                {"Multiple inheritance", "Loose coupling", "Code contracts", "All of the above"},
                {"for", "while", "do-while", "foreach"},
                {"== compares references, equals() compares values", "Both are same", "== is faster", "equals() compares references"},
                {"final", "static", "const", "immutable"},
                {"Reference to current object", "Reference to parent class", "Reference to static members", "None of the above"}
            };
            
            String[] correctAnswers = {"A", "B", "D", "A", "A", "D", "A", "D", "D", "B", "A", "A", "A", "A", "A", "D", "C", "A", "A", "A"};
            
            // Generate the requested number of questions
            int questionsToGenerate = Math.min(requestedCount, questionTexts.length);
            for (int i = 0; i < questionsToGenerate; i++) {
                Question question = new Question();
                question.setQuestionText(questionTexts[i]);
                question.setOptions(String.join(",", options[i]));
                question.setCorrectAnswer(correctAnswers[i]);
                question.setQuestionType("multiple_choice");
                fallbackQuestions.add(question);
            }
        }
        
        System.out.println("Generated " + fallbackQuestions.size() + " fallback " + questionType + " questions (requested: " + requestedCount + ")");
        return fallbackQuestions;
    }
    
    private UUID getOrCreateTestStudent() {
        UUID testStudentId = UUID.fromString("550e8400-e29b-41d4-a716-446655440000");
        
        try {
            // Check if test student exists by ID
            if (studentRepository.findById(testStudentId).isPresent()) {
                System.out.println("Found existing test student with ID: " + testStudentId);
                return testStudentId;
            }
            
            // Check if a student with username "teststudent" already exists
            var existingStudent = studentRepository.findByUsername("teststudent");
            if (existingStudent.isPresent()) {
                System.out.println("Found existing student with username 'teststudent', using their ID: " + existingStudent.get().getId());
                return existingStudent.get().getId();
            }
            
            // Create new test student
            Student testStudent = new Student();
            testStudent.setId(testStudentId);
            testStudent.setFullName("Test Student");
            testStudent.setUsername("teststudent");
            testStudent.setPassword("testpass");
            testStudent.setEmail("test@example.com");
            testStudent.setInstitute("Test Institute");
            testStudent.setEducationLevel("Undergraduate");
            studentRepository.save(testStudent);
            System.out.println("Created new test student with ID: " + testStudentId);
            return testStudentId;
            
        } catch (Exception e) {
            System.err.println("Error creating/finding test student: " + e.getMessage());
            try {
                var anyStudent = studentRepository.findByUsername("teststudent");
                if (anyStudent.isPresent()) {
                    System.out.println("Using existing student ID as fallback: " + anyStudent.get().getId());
                    return anyStudent.get().getId();
                }
            } catch (Exception e2) {
                System.err.println("Fallback also failed: " + e2.getMessage());
            }
            // Last resort - return the intended UUID anyway
            return testStudentId;
        }
    }
    
    public Exam getExamById(Integer examId) {
        return examRepository.findById(examId).orElse(null);
    }

    private int evaluateSubjectiveAnswer(String question, String studentAnswer, String expectedAnswer) {
        try {
            String prompt = String.format("""
                You are an expert examiner evaluating a subjective answer. Please evaluate the following student's answer and give a score out of 10.
                
                Question: %s
                
                Expected Answer Guide: %s
                
                Student's Answer: %s
                
                Evaluation Criteria:
                - Accuracy and correctness of content (40%%)
                - Depth of understanding demonstrated (30%%)
                - Clarity and organization of response (20%%)
                - Use of relevant examples or details (10%%)
                
                Please respond with ONLY a number between 0 and 10, where:
                - 9-10: Excellent, comprehensive answer
                - 7-8: Good answer with minor gaps
                - 5-6: Satisfactory answer with some issues
                - 3-4: Poor answer with significant problems
                - 0-2: Very poor or completely incorrect answer
                
                Score:
                """, question, expectedAnswer, studentAnswer);

            String response = openAIService.getChatCompletion(prompt);
            
            try {
                String trimmedResponse = response.trim();
                java.util.regex.Pattern pattern = java.util.regex.Pattern.compile("\\b([0-9]|10)\\b");
                java.util.regex.Matcher matcher = pattern.matcher(trimmedResponse);
                if (matcher.find()) {
                    return Integer.parseInt(matcher.group(1));
                }
                double score = Double.parseDouble(trimmedResponse.replaceAll("[^0-9.]", ""));
                return Math.max(0, Math.min(10, (int) Math.round(score)));
            } catch (NumberFormatException e) {
                System.err.println("Could not parse AI evaluation score: " + response);
                return 5; // Default middle score if parsing fails
            }
        } catch (Exception e) {
            System.err.println("Error during AI evaluation: " + e.getMessage());
            return 5; // Default middle score on error
        }
    }

    public ExamSummaryDTO getExamSummary(Integer examId, UUID studentId) {
        // Check if student has taken this exam
        var bestScore = studentBestScoreRepository.findByStudentIdAndExamId(studentId, examId);
        if (bestScore.isEmpty()) {
            return null; // Student hasn't taken this exam
        }

        // Get exam details
        Exam exam = examRepository.findById(examId).orElse(null);
        if (exam == null) {
            return null;
        }

        // Get all questions for this exam
        List<Question> questions = questionRepository.findByExamId(examId);
        
        // Get student's answers
        List<StudentAnswer> studentAnswers = studentAnswerRepository.findByStudentIdAndExamId(studentId, examId);
        
        // Create a map for quick lookup of student answers
        var answerMap = new java.util.HashMap<Integer, StudentAnswer>();
        for (StudentAnswer answer : studentAnswers) {
            answerMap.put(answer.getQuestionId(), answer);
        }

        // Build question summaries
        List<QuestionSummaryDTO> questionSummaries = new ArrayList<>();
        int correctCount = 0;
        
        for (Question question : questions) {
            StudentAnswer studentAnswer = answerMap.get(question.getId());
            String userAnswer = studentAnswer != null ? studentAnswer.getSelectedAnswer() : null;
            Boolean isCorrect = studentAnswer != null ? studentAnswer.getIsCorrect() : Boolean.FALSE;
            
            if (isCorrect) {
                correctCount++;
            }
            
            QuestionSummaryDTO questionSummary = new QuestionSummaryDTO(
                question.getId(),
                question.getQuestionText(),
                question.getOptionA(),
                question.getOptionB(),
                question.getOptionC(),
                question.getOptionD(),
                question.getCorrectAnswer(),
                userAnswer,
                isCorrect,
                question.getQuestionType()
            );
            questionSummaries.add(questionSummary);
        }

        double percentage = !questions.isEmpty() ? (correctCount * 100.0 / questions.size()) : 0.0;

        return new ExamSummaryDTO(
            examId,
            exam.getTitle(),
            exam.getDescription(),
            questions.size(),
            correctCount,
            percentage,
            questionSummaries
        );
    }
    
    public com.nxt.nxt.controller.ExamController.EssayEvaluationResponse evaluateEssay(
            com.nxt.nxt.controller.ExamController.EssayEvaluationRequest request) {
        
        String evaluationPrompt = createEssayEvaluationPrompt(
            request.getTopic(), 
            request.getEssay(), 
            request.getCriteria()
        );
        
        String aiResponse = openAIService.getExamGeneration(evaluationPrompt);
        return parseEssayEvaluation(aiResponse);
    }
    
    private String createEssayEvaluationPrompt(String topic, String essay, String criteria) {
        String defaultCriteria = criteria != null && !criteria.trim().isEmpty() ? criteria :
            "Content relevance and accuracy, Writing clarity and organization, Grammar and language use, " +
            "Critical thinking and analysis, Use of examples and evidence";
            
        return String.format("""
            You are an expert teacher evaluating a student's essay. Please evaluate the following essay and provide detailed feedback.
            
            Topic: %s
            
            Essay to evaluate:
            %s
            
            Evaluation Criteria: %s
            
            Please provide your evaluation in the following JSON format:
            {
                "score": [score out of 100],
                "maxScore": 100,
                "grade": "[letter grade A-F]",
                "feedback": "[overall feedback paragraph]",
                "strengths": "[what the student did well]",
                "improvements": "[specific areas for improvement]"
            }
            
            Evaluation Guidelines:
            - Score from 0-100 based on the criteria
            - Provide constructive, specific feedback
            - Highlight both strengths and areas for improvement
            - Be encouraging while being honest about weaknesses
            - Focus on content, organization, and writing quality
            - Return ONLY the JSON object, no additional text
            """, topic, essay, defaultCriteria);
    }
    
    private com.nxt.nxt.controller.ExamController.EssayEvaluationResponse parseEssayEvaluation(String aiResponse) {
        com.nxt.nxt.controller.ExamController.EssayEvaluationResponse response = 
            new com.nxt.nxt.controller.ExamController.EssayEvaluationResponse();
        
        try {
            String jsonContent = cleanJsonContent(aiResponse);
            JsonNode evaluationNode = objectMapper.readTree(jsonContent);
            
            response.setScore(evaluationNode.get("score").asInt());
            response.setMaxScore(evaluationNode.get("maxScore").asInt());
            response.setGrade(evaluationNode.get("grade").asText());
            response.setFeedback(evaluationNode.get("feedback").asText());
            response.setStrengths(evaluationNode.get("strengths").asText());
            response.setImprovements(evaluationNode.get("improvements").asText());
            
        } catch (Exception e) {
            System.err.println("Error parsing essay evaluation: " + e.getMessage());
            // Provide fallback evaluation
            response.setScore(75);
            response.setMaxScore(100);
            response.setGrade("B");
            response.setFeedback("Your essay shows good understanding of the topic with clear writing. Continue to develop your arguments with more specific examples and evidence.");
            response.setStrengths("Clear writing style and good topic understanding.");
            response.setImprovements("Add more specific examples and develop arguments further.");
        }
        
        return response;
    }
}
         