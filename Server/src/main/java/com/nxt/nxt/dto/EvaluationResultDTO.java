package com.nxt.nxt.dto;

import java.util.List;

public class EvaluationResultDTO {
    private int score;
    private int total;
    private List<EvaluationDetailDTO> details;

    public EvaluationResultDTO() {}

    public EvaluationResultDTO(int score, int total, List<EvaluationDetailDTO> details) {
        this.score = score;
        this.total = total;
        this.details = details;
    }

    public int getScore() { return score; }
    public void setScore(int score) { this.score = score; }

    public int getTotal() { return total; }
    public void setTotal(int total) { this.total = total; }

    public List<EvaluationDetailDTO> getDetails() { return details; }
    public void setDetails(List<EvaluationDetailDTO> details) { this.details = details; }
}
