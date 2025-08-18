
package com.nxt.nxt.controller;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.nxt.nxt.entity.PdfData;
import com.nxt.nxt.entity.Student;
import com.nxt.nxt.repositories.PDFDataRepository;
import com.nxt.nxt.repositories.StudentBestScoreRepository;
import com.nxt.nxt.repositories.StudentRepository;


@RestController
@RequestMapping("/api/users")
public class UserController {

    private final StudentRepository studentRepo;
    private final PDFDataRepository pdfDataRepo;
    private final StudentBestScoreRepository studentBestScoreRepo;

    public UserController(StudentRepository studentRepo, PDFDataRepository pdfDataRepo, StudentBestScoreRepository studentBestScoreRepo) {
        this.studentRepo = studentRepo;
        this.pdfDataRepo = pdfDataRepo;
        this.studentBestScoreRepo = studentBestScoreRepo;
    }

    // DTO for dashboard response with percentage
    public static class DashboardStudent {
        private final String fullName;
        private final String username;
        private final String email;
        private final String institute;
        private final String educationLevel;
        private final BigDecimal averageLastFive;
        private final String progressLabel;

        public DashboardStudent(Student student, BigDecimal averageLastFive, String progressLabel) {
            this.fullName = student.getFullName();
            this.username = student.getUsername();
            this.email = student.getEmail();
            this.institute = student.getInstitute();
            this.educationLevel = student.getEducationLevel();
            this.averageLastFive = averageLastFive;
            this.progressLabel = progressLabel;
        }
        public String getFullName() { return fullName; }
        public String getUsername() { return username; }
        public String getEmail() { return email; }
        public String getInstitute() { return institute; }
        public String getEducationLevel() { return educationLevel; }
        public BigDecimal getAverageLastFive() { return averageLastFive; }
        public String getProgressLabel() { return progressLabel; }
    }

    public static class DashboardResponse {
        private final DashboardStudent student;
        private final List<PdfData> pdfDataList;
        public DashboardResponse(DashboardStudent student, List<PdfData> pdfDataList) {
            this.student = student;
            this.pdfDataList = pdfDataList;
        }
        public DashboardStudent getStudent() { return student; }
        public List<PdfData> getPdfDataList() { return pdfDataList; }
    }

    public static class ScoreDTO {
        private final Integer examId;
        private final BigDecimal percentage;
        private final LocalDateTime date;

        public ScoreDTO(Integer examId, BigDecimal percentage, LocalDateTime date) {
            this.examId = examId;
            this.percentage = percentage;
            this.date = date;
        }
        public Integer getExamId() { return examId; }
        public BigDecimal getPercentage() { return percentage; }
        public LocalDateTime getDate() { return date; }
    }

    @GetMapping("/last-five-scores")
    public ResponseEntity<List<ScoreDTO>> getLastFiveScores() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth.getName();
        Student student = studentRepo.findByUsername(username).orElse(null);
        if (student == null) return ResponseEntity.ok(Collections.emptyList());

        Pageable pageable = PageRequest.of(0, 5);
        List<com.nxt.nxt.entity.StudentBestScore> scores = studentBestScoreRepo.findLast5ByStudentIdOrderByCreatedAtDesc(student.getId(), pageable);

        List<ScoreDTO> result = scores.stream()
            .map(s -> new ScoreDTO(s.getExamId(), s.getBestPercentage(), s.getCreatedAt()))
            .collect(Collectors.toList());

        // Pad with zero bars if less than 5
        int missing = 5 - result.size();
        for (int i = 0; i < missing; i++) {
            result.add(new ScoreDTO(null, BigDecimal.ZERO, null));
        }
        return ResponseEntity.ok(result);
    }

    @GetMapping("/dashboard")
    public ResponseEntity<DashboardResponse> getDashboardData() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth.getName();

        List<PdfData> pdfDataList = pdfDataRepo.getPDFByUsername(username);
        Student student = studentRepo.findByUsername(username).orElse(null);

        // Calculate average of last 5 scores
        BigDecimal averageLastFive = BigDecimal.ZERO;
        String progressLabel = "No exam data yet.";
        if (student != null) {
            Pageable pageable = PageRequest.of(0, 5);
            List<com.nxt.nxt.entity.StudentBestScore> scores = studentBestScoreRepo.findLast5ByStudentIdOrderByCreatedAtDesc(student.getId(), pageable);
            if (!scores.isEmpty()) {
                BigDecimal sum = BigDecimal.ZERO;
                int count = 0;
                for (com.nxt.nxt.entity.StudentBestScore s : scores) {
                    sum = sum.add(s.getBestPercentage());
                    count++;
                }
                averageLastFive = sum.divide(BigDecimal.valueOf(count), 2, BigDecimal.ROUND_HALF_UP);
                if (averageLastFive.compareTo(BigDecimal.valueOf(90)) >= 0) {
                    progressLabel = "Excellent! Your average score for the last 5 exams is outstanding.";
                } else if (averageLastFive.compareTo(BigDecimal.valueOf(75)) >= 0) {
                    progressLabel = "Great job! Your recent performance is strong.";
                } else if (averageLastFive.compareTo(BigDecimal.valueOf(50)) >= 0) {
                    progressLabel = "Good effort! Keep practicing to improve your average.";
                } else {
                    progressLabel = "You can do better! Review your mistakes and try again.";
                }
            }
        }
        DashboardStudent dashboardStudent = new DashboardStudent(student, averageLastFive, progressLabel);
        DashboardResponse response = new DashboardResponse(dashboardStudent, pdfDataList);
        return ResponseEntity.ok(response);
    }

}