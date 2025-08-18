package com.nxt.nxt.entity;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

@Entity
@Table(name = "student_best_score", uniqueConstraints = @UniqueConstraint(columnNames = {"student_id", "exam_id"}))
public class StudentBestScore {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "student_id", nullable = false)
    private UUID studentId;

    @Column(name = "exam_id", nullable = false)
    private Integer examId;

    @Column(name = "best_percentage", nullable = false, precision = 5, scale = 2)
    private BigDecimal bestPercentage;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    public StudentBestScore() {}

    public StudentBestScore(UUID studentId, Integer examId, BigDecimal bestPercentage) {
        this.studentId = studentId;
        this.examId = examId;
        this.bestPercentage = bestPercentage;
    }

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    // Getters and setters
    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }
    public UUID getStudentId() { return studentId; }
    public void setStudentId(UUID studentId) { this.studentId = studentId; }
    public Integer getExamId() { return examId; }
    public void setExamId(Integer examId) { this.examId = examId; }
    public BigDecimal getBestPercentage() { return bestPercentage; }
    public void setBestPercentage(BigDecimal bestPercentage) { this.bestPercentage = bestPercentage; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
