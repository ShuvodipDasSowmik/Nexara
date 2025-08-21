package com.nxt.nxt.repositories;

import java.util.Optional;
import java.util.UUID;

import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.BeanPropertyRowMapper;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import com.nxt.nxt.entity.PostVote;

@Repository
public class PostVoteRepository {

    private final JdbcTemplate jdbc;

    public PostVoteRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public void save(PostVote vote) {
        jdbc.update(
            "INSERT INTO post_votes (id, student_id, post_id, vote_type, created_at) VALUES (?, ?, ?, ?, ?)",
            vote.getId(), vote.getStudentId(), vote.getPostId(), vote.getVoteType(), vote.getCreatedAt()
        );
    }

    public Optional<PostVote> findByStudentIdAndPostId(UUID studentId, UUID postId) {
        try {
            return Optional.ofNullable(
                jdbc.queryForObject(
                    "SELECT * FROM post_votes WHERE student_id = ? AND post_id = ?",
                    new BeanPropertyRowMapper<>(PostVote.class),
                    studentId, postId
                )
            );
        }
        catch (EmptyResultDataAccessException e) {
            return Optional.empty();
        }
    }

    public void update(PostVote vote) {
        jdbc.update(
            "UPDATE post_votes SET vote_type = ? WHERE student_id = ? AND post_id = ?",
            vote.getVoteType(), vote.getStudentId(), vote.getPostId()
        );
    }

    public void deleteByStudentIdAndPostId(UUID studentId, UUID postId) {
        jdbc.update("DELETE FROM post_votes WHERE student_id = ? AND post_id = ?", studentId, postId);
    }

    public int getVoteCountByPostId(UUID postId) {
        Integer count = jdbc.queryForObject(
            "SELECT COALESCE(SUM(vote_type), 0) FROM post_votes WHERE post_id = ?",
            Integer.class,
            postId
        );
        return count != null ? count : 0;
    }
}
