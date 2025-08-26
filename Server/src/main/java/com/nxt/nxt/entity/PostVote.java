package com.nxt.nxt.entity;

import java.time.LocalDateTime;
import java.util.UUID;

public class PostVote {
    private UUID id;
    private UUID studentId;
    private UUID postId;
    private Short voteType; // 1 = upvote, -1 = downvote
    private LocalDateTime createdAt;

    public PostVote() {}

    public PostVote(UUID id, UUID studentId, UUID postId, Short voteType, LocalDateTime createdAt) {
        this.id = id;
        this.studentId = studentId;
        this.postId = postId;
        this.voteType = voteType;
        this.createdAt = createdAt;
    }

    public PostVote(UUID studentId, UUID postId, Short voteType) {
        this.studentId = studentId;
        this.postId = postId;
        this.voteType = voteType;
        this.createdAt = LocalDateTime.now();
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public UUID getStudentId() {
        return studentId;
    }

    public void setStudentId(UUID studentId) {
        this.studentId = studentId;
    }

    public UUID getPostId() {
        return postId;
    }

    public void setPostId(UUID postId) {
        this.postId = postId;
    }

    public Short getVoteType() {
        return voteType;
    }

    public void setVoteType(Short voteType) {
        this.voteType = voteType;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    @Override
    public String toString() {
        return "PostVote{" +
                "id=" + id +
                ", studentId=" + studentId +
                ", postId=" + postId +
                ", voteType=" + voteType +
                ", createdAt=" + createdAt +
                '}';
    }
}
