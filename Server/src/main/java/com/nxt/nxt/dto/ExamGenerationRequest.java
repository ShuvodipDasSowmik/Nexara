package com.nxt.nxt.dto;

import java.util.UUID;

public class ExamGenerationRequest {
    private String inputText;
    private UUID studentId;
    private String title;
    private String description;
    private Integer questionCount;
    private String examType; // "multiple_choice" or "subjective"

    public String getInputText() { return inputText; }
    public void setInputText(String inputText) { this.inputText = inputText; }

    public UUID getStudentId() { return studentId; }
    public void setStudentId(UUID studentId) { this.studentId = studentId; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public Integer getQuestionCount() { return questionCount; }
    public void setQuestionCount(Integer questionCount) { this.questionCount = questionCount; }

    public String getExamType() { return examType; }
    public void setExamType(String examType) { this.examType = examType; }

    public ExamGenerationRequest() {}

    public ExamGenerationRequest(String inputText, UUID studentId, String title, String description, Integer questionCount, String examType) {
        this.inputText = inputText;
        this.studentId = studentId;
        this.title = title;
        this.description = description;
        this.questionCount = questionCount;
        this.examType = examType;
    }
}
