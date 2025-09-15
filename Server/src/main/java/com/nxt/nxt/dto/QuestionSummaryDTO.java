package com.nxt.nxt.dto;

public class QuestionSummaryDTO {
    private Integer questionId;
    private String questionText;
    private String optionA;
    private String optionB;
    private String optionC;
    private String optionD;
    private String correctAnswer;
    private String userAnswer;
    private Boolean isCorrect;
    private String questionType;
    private Integer questionScore; // Individual question score (especially useful for subjective questions)
    private String questionGrade; // Letter grade for this question (A, B, C, D, F)

    public QuestionSummaryDTO() {}

    public QuestionSummaryDTO(Integer questionId, String questionText, String optionA, String optionB, 
                             String optionC, String optionD, String correctAnswer, String userAnswer, Boolean isCorrect) {
        this.questionId = questionId;
        this.questionText = questionText;
        this.optionA = optionA;
        this.optionB = optionB;
        this.optionC = optionC;
        this.optionD = optionD;
        this.correctAnswer = correctAnswer;
        this.userAnswer = userAnswer;
        this.isCorrect = isCorrect;
        this.questionType = "multiple_choice"; // default
    }

    public QuestionSummaryDTO(Integer questionId, String questionText, String optionA, String optionB, 
                             String optionC, String optionD, String correctAnswer, String userAnswer, 
                             Boolean isCorrect, String questionType) {
        this.questionId = questionId;
        this.questionText = questionText;
        this.optionA = optionA;
        this.optionB = optionB;
        this.optionC = optionC;
        this.optionD = optionD;
        this.correctAnswer = correctAnswer;
        this.userAnswer = userAnswer;
        this.isCorrect = isCorrect;
        this.questionType = questionType;
    }

    // Getters and Setters
    public Integer getQuestionId() { return questionId; }
    public void setQuestionId(Integer questionId) { this.questionId = questionId; }

    public String getQuestionText() { return questionText; }
    public void setQuestionText(String questionText) { this.questionText = questionText; }

    public String getOptionA() { return optionA; }
    public void setOptionA(String optionA) { this.optionA = optionA; }

    public String getOptionB() { return optionB; }
    public void setOptionB(String optionB) { this.optionB = optionB; }

    public String getOptionC() { return optionC; }
    public void setOptionC(String optionC) { this.optionC = optionC; }

    public String getOptionD() { return optionD; }
    public void setOptionD(String optionD) { this.optionD = optionD; }

    public String getCorrectAnswer() { return correctAnswer; }
    public void setCorrectAnswer(String correctAnswer) { this.correctAnswer = correctAnswer; }

    public String getUserAnswer() { return userAnswer; }
    public void setUserAnswer(String userAnswer) { this.userAnswer = userAnswer; }

    public Boolean getIsCorrect() { return isCorrect; }
    public void setIsCorrect(Boolean isCorrect) { this.isCorrect = isCorrect; }

    public String getQuestionType() { return questionType; }
    public void setQuestionType(String questionType) { this.questionType = questionType; }

    public Integer getQuestionScore() { return questionScore; }
    public void setQuestionScore(Integer questionScore) { this.questionScore = questionScore; }
    
    public String getQuestionGrade() { return questionGrade; }
    public void setQuestionGrade(String questionGrade) { this.questionGrade = questionGrade; }
}
