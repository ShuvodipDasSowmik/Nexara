package com.nxt.nxt.service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.nxt.nxt.dto.ChatResponse;
import com.nxt.nxt.dto.ExamGenerationRequest;
import com.nxt.nxt.entity.Exam;
import com.nxt.nxt.entity.Question;
import com.nxt.nxt.entity.Student;
import com.nxt.nxt.repositories.ExamRepository;
import com.nxt.nxt.repositories.QuestionRepository;
import com.nxt.nxt.repositories.StudentRepository;

@Service
public class ExamService {
    private final OpenRouterService openRouterService;
    private final ExamRepository examRepository;
    private final QuestionRepository questionRepository;
    private final StudentRepository studentRepository;
    private final ObjectMapper objectMapper;

    public ExamService(OpenRouterService openRouterService, 
                      ExamRepository examRepository, 
                      QuestionRepository questionRepository,
                      StudentRepository studentRepository) {
        this.openRouterService = openRouterService;
        this.examRepository = examRepository;
        this.questionRepository = questionRepository;
        this.studentRepository = studentRepository;
        this.objectMapper = new ObjectMapper();
    }

    public Integer generateExam(ExamGenerationRequest request) {
        // Build prompt for question generation
        String prompt = createPrompt(request.getInputText());
        String model = "deepseek/deepseek-chat-v3-0324:free";

        // 2. Call AI service
        ChatResponse aiResponse = openRouterService.callOpenRouter(prompt, model);
        
        // 3. Parse AI response into questions
        List<Question> questions = parseQuestions(aiResponse);
        
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
        
       // Save questions
        System.out.println("Parsed " + questions.size() + " questions from AI response");
        for (int i = 0; i < questions.size(); i++) {
            Question question = questions.get(i);
            System.out.println("Question " + (i+1) + ": " + question.getQuestionText());
            System.out.println("Options: " + question.getOptions());
            System.out.println("Answer: " + question.getCorrectAnswer());
            // ID will be generated automatically by Db
            question.setExamId(exam.getId().longValue());
            try {
                questionRepository.save(question);
                System.out.println("Successfully saved question " + (i+1));
            } catch (Exception e) {
                System.out.println("Error saving question " + (i+1) + ": " + e.getMessage());
                e.printStackTrace();
            }
        }
        
        return exam.getId();
    }

    private String createPrompt(String inputText) {
        return String.format("""
            Generate 5 multiple choice questions about: %s
            
            Format your response as JSON array with this exact structure:
            [
              {
                "questionText": "What is...",
                "options": ["Option A", "Option B", "Option C", "Option D"],
                "correctAnswer": "Option A"
              }
            ]
            
            Requirements:
            - Each question must have exactly 4 options
            - Mark the correct answer clearly
            - Questions should test understanding, not just memorization
            - Use clear, concise language
            - Return ONLY the JSON array, no additional text
            """, inputText);
    }

    private List<Question> parseQuestions(ChatResponse aiResponse) {
        List<Question> questions = new ArrayList<>();
        
        try {
            // Extract the content from the ChatResponse
            String content = extractContentFromResponse(aiResponse);
            
            // Clean the content to extract just the JSON array
            String jsonContent = cleanJsonContent(content);
            
            // Parse JSON array
            JsonNode questionsArray = objectMapper.readTree(jsonContent);
            
            if (questionsArray.isArray()) {
                for (JsonNode questionNode : questionsArray) {
                    Question question = new Question();
                    question.setQuestionText(questionNode.get("questionText").asText());
                    
                    // Convert options array to comma-separated string
                    JsonNode optionsNode = questionNode.get("options");
                    List<String> optionsList = new ArrayList<>();
                    for (JsonNode option : optionsNode) {
                        optionsList.add(option.asText());
                    }
                    question.setOptions(String.join(",", optionsList));
                    
                    // Convert full text answer to option letter (A, B, C, D)
                    String fullAnswer = questionNode.get("correctAnswer").asText();
                    String optionLetter = convertAnswerToOptionLetter(fullAnswer, optionsList);
                    question.setCorrectAnswer(optionLetter);
                    
                    questions.add(question);
                }
            }
        } catch (Exception e) {
            System.err.println("Error parsing AI response: " + e.getMessage());
            // Return fallback questions if parsing fails
            questions = createFallbackQuestions();
        }
        
        return questions;
    }

    private String extractContentFromResponse(ChatResponse response) {
        try {
            if (response.getChoices() != null && !response.getChoices().isEmpty()) {
                return response.getChoices().get(0).getMessage().getContent();
            }
        } catch (Exception e) {
            System.err.println("Error extracting content: " + e.getMessage());
        }
        return "";
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

    private List<Question> createFallbackQuestions() {
        List<Question> fallbackQuestions = new ArrayList<>();
        
        // Create a few sample questions as fallback
        Question q1 = new Question();
        q1.setQuestionText("What is the primary benefit of object-oriented programming?");
        q1.setOptions("Code reusability,Faster execution,Smaller file size,Better graphics");
        q1.setCorrectAnswer("A");
        fallbackQuestions.add(q1);
        
        Question q2 = new Question();
        q2.setQuestionText("Which keyword is used to inherit a class in Java?");
        q2.setOptions("implements,extends,inherits,super");
        q2.setCorrectAnswer("B");
        fallbackQuestions.add(q2);
        
        Question q3 = new Question();
        q3.setQuestionText("What does polymorphism allow in Java?");
        q3.setOptions("Multiple inheritance,Method overloading,Dynamic method binding,All of the above");
        q3.setCorrectAnswer("D");
        fallbackQuestions.add(q3);
        
        return fallbackQuestions;
    }
    
    private UUID getOrCreateTestStudent() {
        // Try to find existing test student
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
            // If all else fails, try to find any existing student and use their ID
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
    
    private String convertAnswerToOptionLetter(String fullAnswer, List<String> options) {
        // Try to match the full answer with one of the options
        for (int i = 0; i < options.size(); i++) {
            String option = options.get(i).trim();
            String answer = fullAnswer.trim();
            
            // Direct match
            if (option.equalsIgnoreCase(answer)) {
                return String.valueOf((char)('A' + i));
            }
            
            // Check if the answer contains the option or vice versa
            if (option.toLowerCase().contains(answer.toLowerCase()) || 
                answer.toLowerCase().contains(option.toLowerCase())) {
                return String.valueOf((char)('A' + i));
            }
        }
        
        // If no match found, try some common patterns
        String lowerAnswer = fullAnswer.toLowerCase();
        if (lowerAnswer.contains("all of the above") || lowerAnswer.contains("all")) {
            // Usually the last option
            return String.valueOf((char)('A' + options.size() - 1));
        }
        
        // Default to 'A' if no match found
        System.err.println("Could not match answer '" + fullAnswer + "' to any option, defaulting to 'A'");
        return "A";
    }
}
