package com.nxt.nxt.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.nxt.nxt.dto.ExamGenerationRequest;
import com.nxt.nxt.service.ExamService;

@RestController
@RequestMapping("/api/exam")
public class ExamController {
    private final ExamService examService;

    public ExamController(ExamService examService) {
        this.examService = examService;
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

    // Response DTO for exam generation
    public static class ExamGenerationResponse {
        private Integer examId;

        public ExamGenerationResponse(Integer examId) {
            this.examId = examId;
        }

        public Integer getExamId() { return examId; }
        public void setExamId(Integer examId) { this.examId = examId; }
    }
}
