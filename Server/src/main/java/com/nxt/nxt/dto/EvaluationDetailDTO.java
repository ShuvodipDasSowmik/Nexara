package com.nxt.nxt.dto;

public class EvaluationDetailDTO {
    private Integer questionId;
    private boolean isCorrect;
    private String correctAnswer;
    private String selected;

    public EvaluationDetailDTO() {}

    public EvaluationDetailDTO(Integer questionId, boolean isCorrect, String correctAnswer, String selected) {
        this.questionId = questionId;
        this.isCorrect = isCorrect;
        this.correctAnswer = correctAnswer;
        this.selected = selected;
    }

    public Integer getQuestionId() { return questionId; }
    public void setQuestionId(Integer questionId) { this.questionId = questionId; }

    public boolean isCorrect() { return isCorrect; }
    public void setCorrect(boolean correct) { isCorrect = correct; }

    public String getCorrectAnswer() { return correctAnswer; }
    public void setCorrectAnswer(String correctAnswer) { this.correctAnswer = correctAnswer; }

    public String getSelected() { return selected; }
    public void setSelected(String selected) { this.selected = selected; }
}
