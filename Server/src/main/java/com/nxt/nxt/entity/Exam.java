package com.nxt.nxt.entity;
import java.time.LocalDateTime;
import java.util.UUID;

public class Exam {
    private Integer id;
    private String title;
    private String description;
    private String inputText;
    private LocalDateTime createdAt;
    private UUID studentId;

    // Getters & Setters
    public Integer getId() {
        return id;
    }
    public void setId(Integer id) {
        this.id = id;
    }
    public String getTitle() {
        return title;
    }
    public void setTitle(String title) {
        this.title = title;
    }
    public String getDescription() {
        return description;
    }
    public void setDescription(String description) {
        this.description = description;
    }
    public UUID getStudentId() {
        return studentId;
    }
    public void setStudentId(UUID studentId) {
        this.studentId = studentId;
    }

    public String getInputText() {
        return inputText;
    }

    public void setInputText(String inputText) {
        this.inputText = inputText;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    @Override
    public String toString() {
        return "Exam{" +
                "id=" + id +
                ", title='" + title + '\'' +
                ", description='" + description + '\'' +
                ", inputText='" + inputText + '\'' +
                ", createdAt=" + createdAt +
                ", studentId=" + studentId +
                '}';
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Exam)) return false;
        Exam exam = (Exam) o;
        return id != null ? id.equals(exam.id) : exam.id == null;
    }

    @Override
    public int hashCode() {
        return id != null ? id.hashCode() : 0;
    }

    public Exam(Integer id, String title, String description, String inputText, LocalDateTime createdAt, UUID studentId) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.inputText = inputText;
        this.createdAt = createdAt;
        this.studentId = studentId;
    }

    public Exam() {
        // Default constructor
    }
}
