package com.nxt.nxt.entity;

import java.time.LocalDateTime;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "essay_evaluations")
public class EssayEvaluation {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "student_id", nullable = false)
    private UUID studentId;
    
    @Column(name = "question_id", nullable = false)
    private Integer questionId;
    
    @Column(name = "essay_text", columnDefinition = "TEXT")
    private String essayText;
    
    @Column(name = "topic", length = 500)
    private String topic;
    
    @Column(name = "score", nullable = false)
    private Integer score; // 0-100 scale
    
    @Column(name = "grade", length = 2)
    private String grade; // A, B, C, D, F
    
    @Column(name = "feedback", columnDefinition = "TEXT")
    private String feedback;
    
    @Column(name = "strengths", columnDefinition = "TEXT")
    private String strengths;
    
    @Column(name = "improvements", columnDefinition = "TEXT")
    private String improvements;
    
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "evaluation_method", length = 20)
    private String evaluationMethod; // "AI" or "LOCAL"
    
    // Constructors
    public EssayEvaluation() {
        this.createdAt = LocalDateTime.now();
    }
    
    public EssayEvaluation(UUID studentId, Integer questionId, String essayText, String topic, 
                          Integer score, String grade, String feedback, String strengths, 
                          String improvements, String evaluationMethod) {
        this();
        this.studentId = studentId;
        this.questionId = questionId;
        this.essayText = essayText;
        this.topic = topic;
        this.score = score;
        this.grade = grade;
        this.feedback = feedback;
        this.strengths = strengths;
        this.improvements = improvements;
        this.evaluationMethod = evaluationMethod;
    }
    
    // Getters and Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public UUID getStudentId() {
        return studentId;
    }
    
    public void setStudentId(UUID studentId) {
        this.studentId = studentId;
    }
    
    public Integer getQuestionId() {
        return questionId;
    }
    
    public void setQuestionId(Integer questionId) {
        this.questionId = questionId;
    }
    
    public String getEssayText() {
        return essayText;
    }
    
    public void setEssayText(String essayText) {
        this.essayText = essayText;
    }
    
    public String getTopic() {
        return topic;
    }
    
    public void setTopic(String topic) {
        this.topic = topic;
    }
    
    public Integer getScore() {
        return score;
    }
    
    public void setScore(Integer score) {
        this.score = score;
    }
    
    public String getGrade() {
        return grade;
    }
    
    public void setGrade(String grade) {
        this.grade = grade;
    }
    
    public String getFeedback() {
        return feedback;
    }
    
    public void setFeedback(String feedback) {
        this.feedback = feedback;
    }
    
    public String getStrengths() {
        return strengths;
    }
    
    public void setStrengths(String strengths) {
        this.strengths = strengths;
    }
    
    public String getImprovements() {
        return improvements;
    }
    
    public void setImprovements(String improvements) {
        this.improvements = improvements;
    }
    
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
    
    public String getEvaluationMethod() {
        return evaluationMethod;
    }
    
    public void setEvaluationMethod(String evaluationMethod) {
        this.evaluationMethod = evaluationMethod;
    }
}
