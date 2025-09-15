package com.nxt.nxt.service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
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
import com.nxt.nxt.entity.EssayEvaluation;
import com.nxt.nxt.repositories.ExamRepository;
import com.nxt.nxt.repositories.QuestionRepository;
import com.nxt.nxt.repositories.StudentRepository;
import com.nxt.nxt.repositories.StudentBestScoreRepository;
import com.nxt.nxt.repositories.StudentAnswerRepository;
import com.nxt.nxt.repositories.EssayEvaluationRepository;

@Service
public class ExamService {
    private final OpenAIService openAIService;
    private final ExamRepository examRepository;
    private final QuestionRepository questionRepository;
    private final StudentRepository studentRepository;
    private final StudentBestScoreRepository studentBestScoreRepository;
    private final StudentAnswerRepository studentAnswerRepository;
    private final EssayEvaluationRepository essayEvaluationRepository;
    private final ObjectMapper objectMapper;
    
    @Value("${ai.evaluation.enabled:false}")
    private boolean aiEvaluationEnabled;
    
    @Value("${ai.evaluation.rate.limit.seconds:25}")
    private int rateLimitSeconds;

    public ExamService(OpenAIService openAIService, 
                      ExamRepository examRepository, 
                      QuestionRepository questionRepository,
                      StudentRepository studentRepository,
                      StudentBestScoreRepository studentBestScoreRepository,
                      StudentAnswerRepository studentAnswerRepository,
                      EssayEvaluationRepository essayEvaluationRepository) {
        this.openAIService = openAIService;
        this.examRepository = examRepository;
        this.questionRepository = questionRepository;
        this.studentRepository = studentRepository;
        this.studentBestScoreRepository = studentBestScoreRepository;
        this.studentAnswerRepository = studentAnswerRepository;
        this.essayEvaluationRepository = essayEvaluationRepository;
        this.objectMapper = new ObjectMapper();
    }

    public Integer generateExam(ExamGenerationRequest request) {
        // Build prompt for question generation
        String prompt = createPrompt(request.getInputText(), request.getQuestionCount(), request.getExamType());
        // Model is now handled inside OpenAIService

        // 2. Call AI service
        String aiResponseContent = openAIService.getExamGeneration(prompt);
        
        // Check if AI service returned an error
        if (aiResponseContent != null && aiResponseContent.startsWith("ERROR:")) {
            throw new RuntimeException("Exam generation failed: " + aiResponseContent.substring(7));
        }

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
    // Use a fixed denominator: every question is scored out of 10
    int maxPossibleScore = questions.size() * 10;
        
        for (SubmitAnswerDTO ans : answers) {
            Question q = questionById.get(ans.getQuestionId());
            if (q == null) continue;
            
            boolean isCorrect = false;
            String correctAnswer = "";
            String userAnswer = ans.getSelected() != null ? ans.getSelected() : "";
            
            if ("subjective".equals(q.getQuestionType())) {
                // Check if this is an essay answer that contains a pre-evaluated score
                String actualUserAnswer = userAnswer;
                int subjectiveScore = -1; // -1 means not pre-evaluated
                
                // Handle legacy data format if present
                if (userAnswer != null && userAnswer.startsWith("SUBJECTIVE:")) {
                    // Extract original answer if it's in legacy format
                    if (userAnswer.contains(" [Score:")) {
                        actualUserAnswer = userAnswer.substring(0, userAnswer.indexOf(" [Score:"));
                        actualUserAnswer = actualUserAnswer.replace("SUBJECTIVE:", "").trim();
                        if (actualUserAnswer.contains("%")) {
                            actualUserAnswer = actualUserAnswer.substring(actualUserAnswer.indexOf("%") + 1).trim();
                        }
                    } else {
                        // If it's just "SUBJECTIVE:50.0%" without actual answer, we can't evaluate
                        actualUserAnswer = "";
                    }
                }
                
                // Check if the answer already contains a pre-evaluated score from essay evaluation
                if (userAnswer != null && userAnswer.contains("\"score\":")) {
                    try {
                        // Parse JSON structure to extract pre-evaluated scores
                        // First check for scaledScore (preferred)
                        String scaledScorePattern = "\"scaledScore\":\\s*(\\d+)";
                        java.util.regex.Pattern scaledPattern = java.util.regex.Pattern.compile(scaledScorePattern);
                        java.util.regex.Matcher scaledMatcher = scaledPattern.matcher(userAnswer);
                        
                        if (scaledMatcher.find()) {
                            // Use the already-scaled score (0-10)
                            subjectiveScore = Integer.parseInt(scaledMatcher.group(1));
                            System.out.println("Using pre-calculated scaled score: " + subjectiveScore + "/10");
                        } else {
                            // Fallback to raw score and convert
                            String scorePattern = "\"score\":\\s*(\\d+)";
                            java.util.regex.Pattern pattern = java.util.regex.Pattern.compile(scorePattern);
                            java.util.regex.Matcher matcher = pattern.matcher(userAnswer);
                            if (matcher.find()) {
                                int rawScore = Integer.parseInt(matcher.group(1));
                                // Convert from 0-100 scale to 0-10 scale
                                subjectiveScore = rawScore > 10 ? (int) Math.round(rawScore / 10.0) : rawScore;
                                System.out.println("Using converted raw score: " + subjectiveScore + "/10 (raw: " + rawScore + ")");
                            }
                        }
                        
                        // Extract the actual essay text if it's in the JSON structure
                        String essayPattern = "\"essay\":\\s*\"([^\"]+)\"";
                        java.util.regex.Pattern essayPatternCompiled = java.util.regex.Pattern.compile(essayPattern);
                        java.util.regex.Matcher essayMatcher = essayPatternCompiled.matcher(userAnswer);
                        if (essayMatcher.find()) {
                            actualUserAnswer = essayMatcher.group(1);
                        }
                        
                        System.out.println("SCORE DEBUG: Question " + ans.getQuestionId() + 
                                         " - Final score: " + subjectiveScore + "/10, Essay: '" + 
                                         (actualUserAnswer.length() > 50 ? actualUserAnswer.substring(0, 50) + "..." : actualUserAnswer) + "'");
                        
                    } catch (Exception e) {
                        System.out.println("Error parsing pre-evaluated score, will re-evaluate: " + e.getMessage());
                        subjectiveScore = -1; // Fall back to re-evaluation
                    }
                }
                
                // If no pre-evaluated score found, check database for saved essay evaluation using smart matching
                if (subjectiveScore == -1) {
                    try {
                        // First try exact match by student and question
                        var exactMatch = essayEvaluationRepository.findByStudentIdAndQuestionId(studentId, ans.getQuestionId());
                        if (exactMatch.isPresent()) {
                            EssayEvaluation evaluation = exactMatch.get();
                            Integer rawScore = evaluation.getScore();
                            if (rawScore != null) {
                                subjectiveScore = rawScore > 10 ? 
                                                (int) Math.round(rawScore / 10.0) : 
                                                rawScore;
                                System.out.println("ESSAY DB: Found exact match with score " + subjectiveScore + 
                                                 "/10 (raw: " + rawScore + ") for student " + studentId + 
                                                 ", question " + ans.getQuestionId() + " [Method: " + evaluation.getEvaluationMethod() + "]");
                            }
                        } else {
                            // Try smart matching by topic and essay content for placeholder entries
                            List<EssayEvaluation> candidateEvaluations = essayEvaluationRepository.findAll();
                            EssayEvaluation bestMatch = null;
                            
                            for (EssayEvaluation eval : candidateEvaluations) {
                                // Check if this is a placeholder entry (temp student ID)
                                if (eval.getStudentId().toString().equals("00000000-0000-0000-0000-000000000000")) {
                                    // Match by topic similarity and essay content
                                    String evalTopic = eval.getTopic();
                                    String evalEssay = eval.getEssayText();
                                    String questionTopic = q.getQuestionText();
                                    
                                    // Improved matching: check if topics are similar OR essay content matches
                                    boolean topicMatches = false;
                                    boolean contentMatches = false;
                                    
                                    if (evalTopic != null && questionTopic != null) {
                                        // More flexible topic matching
                                        String evalTopicLower = evalTopic.toLowerCase();
                                        String questionTopicLower = questionTopic.toLowerCase();
                                        topicMatches = evalTopicLower.contains(questionTopicLower.substring(0, Math.min(questionTopicLower.length(), 20))) ||
                                                      questionTopicLower.contains(evalTopicLower.substring(0, Math.min(evalTopicLower.length(), 20)));
                                    }
                                    
                                    if (evalEssay != null && actualUserAnswer != null) {
                                        // Exact content match
                                        contentMatches = evalEssay.trim().equals(actualUserAnswer.trim());
                                    }
                                    
                                    if (topicMatches && contentMatches) {
                                        bestMatch = eval;
                                        break; // Found a good match
                                    }
                                }
                            }
                            
                            if (bestMatch != null) {
                                Integer rawScore = bestMatch.getScore();
                                if (rawScore != null) {
                                    subjectiveScore = rawScore > 10 ? 
                                                    (int) Math.round(rawScore / 10.0) : 
                                                    rawScore;
                                    System.out.println("ESSAY DB: Found smart match with score " + subjectiveScore + 
                                                     "/10 (raw: " + rawScore + ") for question " + ans.getQuestionId() + 
                                                     " [Method: " + bestMatch.getEvaluationMethod() + "]");
                                    
                                    // Update the evaluation with correct student and question IDs
                                    try {
                                        bestMatch.setStudentId(studentId);
                                        bestMatch.setQuestionId(ans.getQuestionId());
                                        essayEvaluationRepository.save(bestMatch);
                                        System.out.println("ESSAY DB: Updated evaluation with correct IDs");
                                    } catch (Exception updateError) {
                                        System.err.println("Error updating evaluation IDs: " + updateError.getMessage());
                                    }
                                }
                            } else {
                                System.out.println("ESSAY DB: No smart match found for question " + ans.getQuestionId() + 
                                                 ". Looking for any recent evaluations...");
                                
                                // Fallback: look for the most recent evaluation by this student regardless of topic
                                List<EssayEvaluation> recentEvaluations = essayEvaluationRepository.findAll()
                                    .stream()
                                    .filter(eval -> eval.getStudentId().toString().equals("00000000-0000-0000-0000-000000000000"))
                                    .sorted((e1, e2) -> e2.getCreatedAt().compareTo(e1.getCreatedAt()))
                                    .limit(5) // Check last 5 evaluations
                                    .toList();
                                
                                for (EssayEvaluation eval : recentEvaluations) {
                                    if (eval.getEssayText() != null && actualUserAnswer != null && 
                                        eval.getEssayText().trim().equals(actualUserAnswer.trim())) {
                                        Integer rawScore = eval.getScore();
                                        if (rawScore != null) {
                                            subjectiveScore = rawScore > 10 ? 
                                                            (int) Math.round(rawScore / 10.0) : 
                                                            rawScore;
                                            System.out.println("ESSAY DB: Found fallback match with score " + subjectiveScore + 
                                                             "/10 (raw: " + rawScore + ") for question " + ans.getQuestionId());
                                            
                                            // Update with correct IDs
                                            eval.setStudentId(studentId);
                                            eval.setQuestionId(ans.getQuestionId());
                                            essayEvaluationRepository.save(eval);
                                            break;
                                        }
                                    }
                                }
                            }
                        }
                    } catch (Exception e) {
                        System.err.println("Error retrieving essay evaluation from database: " + e.getMessage());
                    }
                }
                
                // If still no score found, fail the submission with proper error message
                if (subjectiveScore == -1) {
                    System.out.println("ESSAY DB: No saved evaluation found and AI evaluation unavailable for question " + ans.getQuestionId());
                    throw new RuntimeException("Essay evaluation failed. Please evaluate your answers individually before submitting the complete exam, or try again later when AI evaluation is available.");
                }
                
                totalScore += subjectiveScore;
                
                System.out.println("SCORE DEBUG: Question " + ans.getQuestionId() + 
                                 " scored " + subjectiveScore + "/10. Running total: " + totalScore + "/" + maxPossibleScore);
                
                // Consider it "correct" if score is 7 or above (for statistics)
                isCorrect = subjectiveScore >= 7;
                correctAnswer = String.valueOf(subjectiveScore) + "/10";
                
                // Safely format the answer with score and truncate if needed
                String answerWithScore = actualUserAnswer + " [Score: " + subjectiveScore + "/10]";
                String safeAnswer = safeTruncateText(answerWithScore, 250); // Leave some margin under 255
                
                StudentAnswer studentAnswer = new StudentAnswer(
                    studentId, examId, ans.getQuestionId(), 
                    safeAnswer, 
                    isCorrect
                );
                // Persist numeric per-question score (0-10)
                studentAnswer.setQuestionScore(subjectiveScore);
                
                // Ensure the student answer is saved properly
                try {
                    StudentAnswer savedAnswer = studentAnswerRepository.save(studentAnswer);
                    if (savedAnswer != null && savedAnswer.getId() != null) {
                        System.out.println("SUBMISSION DB: Successfully saved student answer for question " + 
                                         ans.getQuestionId() + " with score " + subjectiveScore + "/10");
                    } else {
                        System.err.println("SUBMISSION DB: Student answer save may have failed for question " + ans.getQuestionId());
                    }
                } catch (Exception e) {
                    System.err.println("CRITICAL ERROR: Failed to save student answer for question " + ans.getQuestionId() + ": " + e.getMessage());
                    throw new RuntimeException("Failed to save your answer. Please try submitting again.", e);
                }
                
            } else {
                // Handle multiple choice questions - also use partial scoring for consistency
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
                // Multiple choice: 10 points if correct, 0 if wrong (same as subjective max)
                int mcScore = isCorrect ? 10 : 0;
                totalScore += mcScore;
                correctAnswer = correctNorm;
                userAnswer = selectedNorm;
                
                StudentAnswer studentAnswer = new StudentAnswer(
                    studentId, examId, ans.getQuestionId(), 
                    selectedNorm != null ? selectedNorm : ans.getSelected(), 
                    isCorrect
                );
                // Persist numeric per-question score for MCQ
                studentAnswer.setQuestionScore(mcScore);
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
        
        // Store the scores in the StudentBestScore table with verification
        com.nxt.nxt.entity.StudentBestScore bestScore = new com.nxt.nxt.entity.StudentBestScore(studentId, examId, java.math.BigDecimal.valueOf(percentage));
        
        try {
            com.nxt.nxt.entity.StudentBestScore savedBestScore = studentBestScoreRepository.save(bestScore);
            if (savedBestScore != null && savedBestScore.getId() != null) {
                System.out.println("SUBMISSION DB: Successfully saved best score with percentage " + percentage + "% for student " + studentId + " on exam " + examId);
            } else {
                System.err.println("SUBMISSION DB: Best score save may have failed for student " + studentId + " on exam " + examId);
            }
        } catch (Exception e) {
            System.err.println("CRITICAL ERROR: Failed to save best score for student " + studentId + " on exam " + examId + ": " + e.getMessage());
            throw new RuntimeException("Failed to save your exam score. Please try submitting again.", e);
        }

        System.out.println("SUBMISSION DEBUG: Total score: " + totalScore + "/" + maxPossibleScore + " = " + percentage + "%");

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
                throw new RuntimeException("Exam generation failed due to invalid AI response format. Please try again later.");
            }
        } catch (Exception e) {
            System.err.println("Error parsing AI response: " + e.getMessage());
            System.err.println("AI response content: " + aiResponseContent);
            throw new RuntimeException("Exam generation failed due to AI service unavailable. Please try again later or contact support if the issue persists.", e);
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

    private static long lastApiCall = 0;
    
    /**
     * Evaluate subjective answer with rate limiting to prevent API quota issues
     */
    private int evaluateSubjectiveAnswerWithRateLimit(String question, String studentAnswer, String expectedAnswer) {
        // If AI evaluation is disabled, throw an error instead of using local evaluation
        if (!aiEvaluationEnabled) {
            System.out.println("AI evaluation disabled");
            throw new RuntimeException("AI evaluation is currently disabled. Please try again later.");
        }
        
        // For very short answers, throw an error to encourage proper answers
        if (studentAnswer == null || studentAnswer.trim().length() < 30) {
            throw new RuntimeException("Please provide a more detailed answer (at least 30 characters) for proper evaluation.");
        }
        
        // Calculate rate limit interval in milliseconds
        long rateLimitInterval = rateLimitSeconds * 1000L;
        
        // Check if we need to wait to avoid rate limiting
        long currentTime = System.currentTimeMillis();
        long timeSinceLastCall = currentTime - lastApiCall;
        
        if (timeSinceLastCall < rateLimitInterval) {
            long waitTime = rateLimitInterval - timeSinceLastCall;
            System.out.println("Rate limiting: would need to wait " + waitTime + "ms before next API call");
            throw new RuntimeException("AI evaluation is temporarily rate limited. Please wait a moment and try again, or evaluate your answers individually first.");
        }
        
        // Try AI evaluation, but fail on error instead of falling back
        lastApiCall = System.currentTimeMillis();
        try {
            // Call OpenAI API directly here with better error handling
            String prompt = String.format(
                "Score this answer on a scale of 0-10.\n\nQuestion: %s\n\nExpected Answer: %s\n\nStudent Answer: %s\n\nProvide only the numeric score (0-10):",
                question, expectedAnswer, studentAnswer
            );
            
            String response = openAIService.getChatCompletion(prompt);
            int score = parseScoreFromResponse(response);
            
            if (score >= 0 && score <= 10) {
                return score;
            } else {
                throw new RuntimeException("AI evaluation returned an invalid score. Please try again.");
            }
        } catch (Exception e) {
            System.out.println("OpenAIService error: " + e.getMessage());
            if (e.getMessage().contains("Rate limit reached") || e.getMessage().contains("HTTP 429")) {
                throw new RuntimeException("AI evaluation service is temporarily unavailable due to rate limits. Please evaluate your answers individually first, then submit.");
            } else {
                throw new RuntimeException("AI evaluation failed due to a technical issue. Please try again later.");
            }
        }
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
                return evaluateAnswerBasedOnLength(studentAnswer); // Use length-based scoring instead of fixed 5
            }
        } catch (Exception e) {
            System.err.println("Error during AI evaluation: " + e.getMessage());
            return evaluateAnswerBasedOnLength(studentAnswer); // Use length-based scoring instead of fixed 5
        }
    }
    
    /**
     * Evaluate answer based on length and basic content analysis when AI is not available
     */
    private int evaluateAnswerBasedOnLength(String answer) {
        if (answer == null || answer.trim().isEmpty()) {
            return 0; // No answer
        }
        
        String trimmed = answer.trim();
        int length = trimmed.length();
        int wordCount = trimmed.split("\\s+").length;
        
        // More generous scoring for subjective answers
        // Very short answers (likely incomplete)
        if (length < 20 || wordCount < 5) {
            return 3; // Give some credit for attempting
        }
        // Short but potentially valid answers
        else if (length < 50 || wordCount < 15) {
            return 5; // Half credit
        }
        // Medium length answers (likely reasonable effort)
        else if (length < 150 || wordCount < 50) {
            return 7; // Good effort
        }
        // Longer answers (good effort)
        else if (length < 300 || wordCount < 100) {
            return 8; // Very good
        }
        // Very comprehensive answers
        else {
            return 9; // Excellent effort (reserve 10 for perfect AI scores)
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
        int totalScore = 0; // Track actual total score for subjective exams
        
        for (Question question : questions) {
            StudentAnswer studentAnswer = answerMap.get(question.getId());
            String userAnswer = studentAnswer != null ? studentAnswer.getSelectedAnswer() : null;
            Boolean isCorrect = studentAnswer != null ? studentAnswer.getIsCorrect() : Boolean.FALSE;
            
            // Clean up user answer for display (remove score information for subjective questions)
            String displayAnswer = userAnswer;
            int questionScore = 0; // Track individual question score

            // Use stored numeric score if present (authoritative)
            if (studentAnswer != null && studentAnswer.getQuestionScore() != null) {
                questionScore = studentAnswer.getQuestionScore();
            } else {
                // Fallback: for legacy rows, treat isCorrect as 10/0
                questionScore = isCorrect ? 10 : 0;
            }
            totalScore += questionScore;

            // Clean display answer (remove any embedded score text) but do not parse it for scoring
            if (displayAnswer != null && displayAnswer.contains("[Score: ")) {
                displayAnswer = displayAnswer.substring(0, displayAnswer.indexOf(" [Score: ")).trim();
            }
            if (displayAnswer != null && displayAnswer.startsWith("SUBJECTIVE:")) {
                displayAnswer = displayAnswer.replace("SUBJECTIVE:", "").trim();
                if (displayAnswer.contains("%")) {
                    displayAnswer = displayAnswer.substring(displayAnswer.indexOf("%") + 1).trim();
                }
            }
            displayAnswer = cleanDisplayAnswer(displayAnswer);
            
            // For subjective questions, if display answer is empty or just artifacts, show the score instead
            if ("subjective".equals(question.getQuestionType()) && 
                (displayAnswer == null || displayAnswer.trim().isEmpty() || displayAnswer.equals("s"))) {
                displayAnswer = "Score: " + questionScore + "/10";
            }
            
            QuestionSummaryDTO questionSummary = new QuestionSummaryDTO(
                question.getId(),
                question.getQuestionText(),
                question.getOptionA(),
                question.getOptionB(),
                question.getOptionC(),
                question.getOptionD(),
                question.getCorrectAnswer(),
                displayAnswer, // Use cleaned answer instead of raw userAnswer
                isCorrect,
                question.getQuestionType()
            );
            questionSummary.setQuestionScore(questionScore); // Set individual question score
            questionSummary.setQuestionGrade(calculateGradeFromScore(questionScore)); // Set per-question grade
            questionSummaries.add(questionSummary);
        }

        // Use the actual percentage from StudentBestScore - this is the authoritative value
        // The percentage was calculated accurately during exam submission when AI scoring was performed
        double percentage = bestScore.get().getBestPercentage().doubleValue();
        
        // For verification purposes only - don't change the percentage based on this
        int maxScore = questions.size() * 10;
        double calculatedPercentage = maxScore > 0 ? (totalScore * 100.0 / maxScore) : 0.0;
        
        System.out.println("SUMMARY DEBUG: Authoritative percentage: " + percentage + "%");
        System.out.println("SUMMARY DEBUG: Recalculated from parsing: " + calculatedPercentage + "% (total: " + totalScore + "/" + maxScore + ")");
        
        // Log discrepancies for debugging but use stored percentage consistently
        if (Math.abs(percentage - calculatedPercentage) > 1.0) {
            System.out.println("INFO: Score parsing discrepancy detected in summary (this is expected for subjective exams):");
            System.out.println("Authoritative percentage (from submission): " + percentage);
            System.out.println("Recalculated percentage (from answer parsing): " + calculatedPercentage);
            System.out.println("Using authoritative percentage: " + percentage);
        }

        return new ExamSummaryDTO(
            examId,
            exam.getTitle(),
            exam.getDescription(),
            questions.size(),
            (int) Math.round(percentage * questions.size() / 10.0), // Calculate total score from stored percentage for consistency
            percentage,
            calculateGrade(percentage), // Add overall grade
            questionSummaries
        );
    }
    
    public com.nxt.nxt.controller.ExamController.EssayEvaluationResponse evaluateEssay(
            com.nxt.nxt.controller.ExamController.EssayEvaluationRequest request) {
        
        try {
            String evaluationPrompt = createEssayEvaluationPrompt(
                request.getTopic(), 
                request.getEssay(), 
                request.getCriteria()
            );
            
            String aiResponse = openAIService.getExamGeneration(evaluationPrompt);
            
            // Check for AI service error responses
            if (aiResponse != null && aiResponse.startsWith("ERROR:")) {
                throw new RuntimeException("AI evaluation service is currently unavailable. Please try again later or contact support.");
            }
            
            com.nxt.nxt.controller.ExamController.EssayEvaluationResponse response = parseEssayEvaluation(aiResponse);
            
            // Save the evaluation to database for retrieval during exam submission
            // This is CRITICAL for ensuring consistent scoring across views
            try {
                // Create a temporary evaluation entry that can be matched during exam submission
                EssayEvaluation evaluation = new EssayEvaluation(
                    UUID.fromString("00000000-0000-0000-0000-000000000000"), // Temporary placeholder
                    -1, // Temporary placeholder for question ID
                    request.getEssay(),
                    request.getTopic(),
                    response.getScore(),
                    response.getGrade(),
                    response.getFeedback(),
                    response.getStrengths(),
                    response.getImprovements(),
                    "AI"
                );
                
                // Ensure the save operation completes successfully
                EssayEvaluation savedEvaluation = essayEvaluationRepository.save(evaluation);
                if (savedEvaluation != null && savedEvaluation.getId() != null) {
                    System.out.println("ESSAY DB: Successfully saved AI evaluation with ID " + savedEvaluation.getId() + 
                                     " and score " + response.getScore() + " for topic: " + request.getTopic());
                } else {
                    System.err.println("ESSAY DB: Save operation completed but evaluation may not have been persisted properly");
                }
                
            } catch (Exception e) {
                System.err.println("CRITICAL ERROR: Failed to save essay evaluation to database: " + e.getMessage());
                e.printStackTrace();
                // Don't fail the entire evaluation if just the database save fails
                // The user still gets their evaluation, but it won't be reused during submission
                System.err.println("WARNING: Essay evaluation will not be reused during submission due to database save failure");
            }
            
            return response;
        } catch (Exception e) {
            System.err.println("Error during essay evaluation: " + e.getMessage());
            
            // Check if it's a rate limit error
            if (e.getMessage().contains("Rate limit reached") || e.getMessage().contains("HTTP 429")) {
                throw new RuntimeException("AI evaluation service is temporarily unavailable due to rate limits. Please try again later or contact support.", e);
            } else {
                throw new RuntimeException("Essay evaluation failed due to a technical issue. Please try again later or contact support.", e);
            }
        }
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
            System.err.println("AI Response that failed to parse: " + aiResponse);
            throw new RuntimeException("AI evaluation service returned an invalid response. Please try again later or contact support if the issue persists.", e);
        }
        
        return response;
    }
    
    /**
     * Safely truncate text to fit database field constraints
     * This is a temporary solution until the database schema is updated
     */
    private String safeTruncateText(String text, int maxLength) {
        if (text == null) return null;
        if (text.length() <= maxLength) return text;
        
        // Truncate and add indicator
        return text.substring(0, maxLength - 5) + "[...]";
    }
    
    private int parseScoreFromResponse(String response) {
        if (response == null || response.trim().isEmpty()) return -1;

        String trimmed = response.trim();

        // 1) Try JSON parsing: look for { "score": X, "maxScore": Y }
        try {
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            com.fasterxml.jackson.databind.JsonNode root = mapper.readTree(trimmed);
            if (root != null && root.has("score")) {
                double score = root.get("score").asDouble(0.0);
                double max = 100.0;
                if (root.has("maxScore")) max = root.get("maxScore").asDouble(100.0);
                else if (root.has("max_score")) max = root.get("max_score").asDouble(100.0);

                // Scale to 0-10 range
                double scaled = (max > 0) ? (score * 10.0 / max) : score;
                int intScore = (int) Math.round(scaled);
                return Math.max(0, Math.min(10, intScore));
            }
        } catch (Exception ex) {
            // Not JSON or parse failed - fall through to numeric extraction
        }

        // 2) Extract first numeric token using regex (safer than strip all digits which can concatenate numbers)
        java.util.regex.Matcher m = java.util.regex.Pattern.compile("(\\d+\\.?\\d*)").matcher(trimmed);
        if (m.find()) {
            try {
                double num = Double.parseDouble(m.group(1));
                // If AI returned a 0-100 score, scale down to 0-10
                if (num > 10 && num <= 100) {
                    num = num / 10.0;
                }
                // If it's already 0-10, keep as is. If it's larger than 100, treat as invalid.
                if (num < 0 || num > 10) return -1;
                int intScore = (int) Math.round(num);
                return Math.max(0, Math.min(10, intScore));
            } catch (Exception e) {
                return -1;
            }
        }

        return -1;
    }
    
    private String cleanDisplayAnswer(String answer) {
        if (answer == null || answer.trim().isEmpty()) {
            return "";
        }
        
        // Remove any remaining artifacts or unwanted characters
        String cleaned = answer.trim();
        
        // Remove any leftover score patterns that might have been missed
        cleaned = cleaned.replaceAll("\\[Score:.*?\\]", "").trim();
        
        // Remove SUBJECTIVE: prefix if still present
        if (cleaned.startsWith("SUBJECTIVE:")) {
            cleaned = cleaned.substring("SUBJECTIVE:".length()).trim();
        }
        
        // Remove percentage patterns like "50.0%"
        cleaned = cleaned.replaceAll("^\\d+\\.?\\d*%\\s*", "").trim();
        
        // Remove isolated single characters that are likely artifacts (except meaningful letters/words)
        if (cleaned.length() == 1) {
            char c = cleaned.charAt(0);
            // Keep meaningful single characters like A, B, C, D (for multiple choice) but remove artifacts
            if (!Character.isLetterOrDigit(c) || (Character.isLetter(c) && !("ABCD".contains(cleaned.toUpperCase())))) {
                cleaned = "";
            }
        }
        
        // Remove common artifacts that appear due to parsing issues
        cleaned = cleaned.replaceAll("^[sS]\\s*$", "").trim(); // Remove standalone 's' character
        cleaned = cleaned.replaceAll("^[0-9.]+\\s*$", "").trim(); // Remove standalone numbers
        
        return cleaned;
    }
    
    /**
     * Calculate letter grade from percentage using consistent thresholds
     */
    private String calculateGrade(double percentage) {
        if (percentage >= 90) return "A";
        if (percentage >= 80) return "B"; 
        if (percentage >= 70) return "C";
        if (percentage >= 60) return "D";
        return "F";
    }
    
    /**
     * Calculate letter grade from numeric score out of 10
     */
    private String calculateGradeFromScore(int score) {
        double percentage = (score / 10.0) * 100.0;
        return calculateGrade(percentage);
    }
}
         