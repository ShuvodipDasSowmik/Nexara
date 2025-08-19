package com.nxt.nxt.entity;

public class Question {
    private Integer id;  // Changed to Integer to match database auto-increment
    private Long examId;  // Changed to Long to match database bigint type
    private String questionText;
    private String optionA;
    private String optionB;
    private String optionC;
    private String optionD;
    private String correctAnswer;

    // Getters & Setters
    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public Long getExamId() { return examId; }
    public void setExamId(Long examId) { this.examId = examId; }

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

    // Helper method to set options from comma-separated string (for AI parsing)
    public void setOptions(String options) {
        if (options != null && !options.trim().isEmpty()) {
            String[] opts = options.split(",");
            if (opts.length >= 1) this.optionA = opts[0].trim();
            if (opts.length >= 2) this.optionB = opts[1].trim();
            if (opts.length >= 3) this.optionC = opts[2].trim();
            if (opts.length >= 4) this.optionD = opts[3].trim();
        }
    }

    // Helper method to get options as comma-separated string
    public String getOptions() {
        return String.join(",", 
            optionA != null ? optionA : "",
            optionB != null ? optionB : "",
            optionC != null ? optionC : "",
            optionD != null ? optionD : ""
        );
    }

    @Override
    public String toString() {
        return "Question{" +
                "id=" + id +
                ", examId=" + examId +
                ", questionText='" + questionText + '\'' +
                ", optionA='" + optionA + '\'' +
                ", optionB='" + optionB + '\'' +
                ", optionC='" + optionC + '\'' +
                ", optionD='" + optionD + '\'' +
                ", correctAnswer='" + correctAnswer + '\'' +
                '}';
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Question)) return false;
        Question question = (Question) o;
        return id != null ? id.equals(question.id) : question.id == null;
    }

    @Override
    public int hashCode() {
        return id != null ? id.hashCode() : 0;
    }

    public Question(Integer id, Long examId, String questionText, String optionA, String optionB, String optionC, String optionD, String correctAnswer) {
        this.id = id;
        this.examId = examId;
        this.questionText = questionText;
        this.optionA = optionA;
        this.optionB = optionB;
        this.optionC = optionC;
        this.optionD = optionD;
        this.correctAnswer = correctAnswer;
    }

    public Question() {
        // Default constructor
    }
}
