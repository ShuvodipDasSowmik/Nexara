package com.nxt.nxt.dto;

import java.util.List;

public class ExamSummaryDTO {
    private Integer examId;
    private String title;
    private String description;
    private Integer totalQuestions;
    private Integer score;
    private Double percentage;
    private String overallGrade; // Overall letter grade for the exam
    private List<QuestionSummaryDTO> questions;

    public ExamSummaryDTO() {}

    public ExamSummaryDTO(Integer examId, String title, String description, Integer totalQuestions, Integer score, Double percentage, String overallGrade, List<QuestionSummaryDTO> questions) {
        this.examId = examId;
        this.title = title;
        this.description = description;
        this.totalQuestions = totalQuestions;
        this.score = score;
        this.percentage = percentage;
        this.overallGrade = overallGrade;
        this.questions = questions;
    }

    // Getters and Setters
    public Integer getExamId() { return examId; }
    public void setExamId(Integer examId) { this.examId = examId; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public Integer getTotalQuestions() { return totalQuestions; }
    public void setTotalQuestions(Integer totalQuestions) { this.totalQuestions = totalQuestions; }

    public Integer getScore() { return score; }
    public void setScore(Integer score) { this.score = score; }

    public Double getPercentage() { return percentage; }
    public void setPercentage(Double percentage) { this.percentage = percentage; }

    public String getOverallGrade() { return overallGrade; }
    public void setOverallGrade(String overallGrade) { this.overallGrade = overallGrade; }

    public List<QuestionSummaryDTO> getQuestions() { return questions; }
    public void setQuestions(List<QuestionSummaryDTO> questions) { this.questions = questions; }
}
