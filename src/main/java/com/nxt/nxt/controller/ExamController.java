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
import com.nxt.nxt.dto.QuestionDTO;
import com.nxt.nxt.dto.SubmitAnswerDTO;
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

    @GetMapping("/{examId}/questions")
    public ResponseEntity<List<QuestionDTO>> getExamQuestions(@PathVariable Integer examId) {
        List<QuestionDTO> questions = examService.getExamQuestions(examId);
        return ResponseEntity.ok(questions);
    }

    @PostMapping("/{examId}/submit")
    public ResponseEntity<EvaluationResultDTO> submitExam(
        @PathVariable Integer examId,
        @RequestBody List<SubmitAnswerDTO> answers
    ) {
        EvaluationResultDTO result = examService.evaluateExam(examId, answers);
        return ResponseEntity.ok(result);
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
