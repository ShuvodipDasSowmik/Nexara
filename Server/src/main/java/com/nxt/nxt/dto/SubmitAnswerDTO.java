package com.nxt.nxt.dto;

public class SubmitAnswerDTO {
    private Integer questionId;
    private String selected; // 'A' | 'B' | 'C' | 'D'

    public SubmitAnswerDTO() {}

    public SubmitAnswerDTO(Integer questionId, String selected) {
        this.questionId = questionId;
        this.selected = selected;
    }

    public Integer getQuestionId() { return questionId; }
    public void setQuestionId(Integer questionId) { this.questionId = questionId; }

    public String getSelected() { return selected; }
    public void setSelected(String selected) { this.selected = selected; }
}
