package com.nxt.nxt.jobs;

public class UserEmbeddingEntry {
    private String userId;
    private String embedding;

    public UserEmbeddingEntry(String userId, String embedding) {
        this.userId = userId;
        this.embedding = embedding;
    }

    public String getUserId() {
        return userId;
    }

    public String getEmbedding() {
        return embedding;
    }
}
