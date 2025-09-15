package com.nxt.nxt.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.nxt.nxt.dto.EvaluationResultDTO;
import com.nxt.nxt.dto.ExamGenerationRequest;
import com.nxt.nxt.dto.ExamSummaryDTO;
import com.nxt.nxt.dto.QuestionDTO;
import com.nxt.nxt.dto.SubmitAnswerDTO;
import com.nxt.nxt.repositories.StudentRepository;
import com.nxt.nxt.service.ExamService;

@RestController
@RequestMapping("/api/exam")
public class ExamController {
    private final ExamService examService;
    private final StudentRepository studentRepository;

    public ExamController(ExamService examService, StudentRepository studentRepository) {
        this.examService = examService;
        this.studentRepository = studentRepository;
    }

    @PostMapping("/generate")
    public ResponseEntity<?> generateExam(@RequestBody ExamGenerationRequest request) {
        try {
            Integer examId = examService.generateExam(request);
            return ResponseEntity.ok(new ExamGenerationResponse(examId));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                .body("Error generating exam: " + e.getMessage());
        }
    }

    @GetMapping("/{examId}/questions")
    public ResponseEntity<List<QuestionDTO>> getExamQuestions(@PathVariable Integer examId) {
        List<QuestionDTO> questions = examService.getExamQuestions(examId);
        return ResponseEntity.ok(questions);
    }

    @PostMapping("/{examId}/submit")
    public ResponseEntity<?> submitExam(
        @PathVariable Integer examId,
        @RequestBody List<SubmitAnswerDTO> answers
    ) {
        // Get current authenticated user
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        String username = auth.getName();
        com.nxt.nxt.entity.Student student = studentRepository.findByUsername(username).orElse(null);
        
        if (student == null) {
            return ResponseEntity.status(401).body("User not found");
        }
        
        // Find the exam
        com.nxt.nxt.entity.Exam exam = examService.getExamById(examId);
        if (exam == null) {
            return ResponseEntity.badRequest().body("Exam not found");
        }
        
        java.util.UUID studentId = student.getId();
        EvaluationResultDTO result = examService.evaluateExam(examId, answers, studentId);
        if (result == null) {
            return ResponseEntity.status(403).body("You have already taken this exam. You cannot retake it.");
        }
        return ResponseEntity.ok(result);
    }

    @GetMapping("/{examId}/summary")
    public ResponseEntity<?> getExamSummary(@PathVariable Integer examId) {
        try {
            // Get current authenticated user
            org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
            String username = auth.getName();
            com.nxt.nxt.entity.Student student = studentRepository.findByUsername(username).orElse(null);
            
            if (student == null) {
                return ResponseEntity.status(401).body("User not found");
            }
            
            com.nxt.nxt.entity.Exam exam = examService.getExamById(examId);
            if (exam == null) {
                return ResponseEntity.badRequest().body("Exam not found");
            }
            
            java.util.UUID studentId = student.getId();
            ExamSummaryDTO summary = examService.getExamSummary(examId, studentId);
            if (summary == null) {
                return ResponseEntity.badRequest().body("No summary available. Exam may not have been completed yet.");
            }
            return ResponseEntity.ok(summary);
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                .body("Error retrieving exam summary: " + e.getMessage());
        }
    }
    
    @PostMapping("/evaluate-essay")
    public ResponseEntity<?> evaluateEssay(@RequestBody EssayEvaluationRequest request) {
        try {
            EssayEvaluationResponse evaluation = examService.evaluateEssay(request);
            return ResponseEntity.ok(evaluation);
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                .body("Error evaluating essay: " + e.getMessage());
        }
    }

    // Response DTO for exam generation
    public static class ExamGenerationResponse {
        private Integer examId;

        public ExamGenerationResponse(Integer examId) {
            this.examId = examId;
        }

        public Integer getExamId() { return examId; }
        public void setExamId(Integer examId) { this.examId = examId; }
    }
    
    // Request DTO for essay evaluation
    public static class EssayEvaluationRequest {
        private String topic;
        private String essay;
        private String criteria;
        private String studentId; // Add student ID
        private Integer questionId; // Add question ID for database storage
        
        public String getTopic() { return topic; }
        public void setTopic(String topic) { this.topic = topic; }
        
        public String getEssay() { return essay; }
        public void setEssay(String essay) { this.essay = essay; }
        
        public String getCriteria() { return criteria; }
        public void setCriteria(String criteria) { this.criteria = criteria; }
        
        public String getStudentId() { return studentId; }
        public void setStudentId(String studentId) { this.studentId = studentId; }
        
        public Integer getQuestionId() { return questionId; }
        public void setQuestionId(Integer questionId) { this.questionId = questionId; }
    }
    
    // Response DTO for essay evaluation
    public static class EssayEvaluationResponse {
        private Integer score;
        private Integer maxScore;
        private String feedback;
        private String grade;
        private String strengths;
        private String improvements;
        
        public Integer getScore() { return score; }
        public void setScore(Integer score) { this.score = score; }
        
        public Integer getMaxScore() { return maxScore; }
        public void setMaxScore(Integer maxScore) { this.maxScore = maxScore; }
        
        public String getFeedback() { return feedback; }
        public void setFeedback(String feedback) { this.feedback = feedback; }
        
        public String getGrade() { return grade; }
        public void setGrade(String grade) { this.grade = grade; }
        
        public String getStrengths() { return strengths; }
        public void setStrengths(String strengths) { this.strengths = strengths; }
        
        public String getImprovements() { return improvements; }
        public void setImprovements(String improvements) { this.improvements = improvements; }
    }
}
