package com.nxt.nxt.dto;

import java.util.UUID;

public class ExamGenerationRequest {
    private String inputText;
    private UUID studentId;
    private String title;
    private String description;

    public String getInputText() { return inputText; }
    public void setInputText(String inputText) { this.inputText = inputText; }

    public UUID getStudentId() { return studentId; }
    public void setStudentId(UUID studentId) { this.studentId = studentId; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public ExamGenerationRequest() {}

    public ExamGenerationRequest(String inputText, UUID studentId, String title, String description) {
        this.inputText = inputText;
        this.studentId = studentId;
        this.title = title;
        this.description = description;
    }
}
