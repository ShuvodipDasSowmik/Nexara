package com.nxt.nxt.repositories;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.BeanPropertyRowMapper;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import com.nxt.nxt.entity.Comment;

@Repository
public class CommentRepository {

    private final JdbcTemplate jdbc;

    public CommentRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public void save(Comment comment) {
        jdbc.update(
            "INSERT INTO comments (id, post_id, student_id, parent_id, content, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
            comment.getId(), comment.getPostId(), comment.getStudentId(), comment.getParentId(), 
            comment.getContent(), comment.getCreatedAt(), comment.getUpdatedAt()
        );
    }

    public Optional<Comment> findById(UUID id) {
        try {
            return Optional.ofNullable(
                jdbc.queryForObject(
                    "SELECT * FROM comments WHERE id = ?",
                    new BeanPropertyRowMapper<>(Comment.class),
                    id
                )
            );
        }
        catch (EmptyResultDataAccessException e) {
            return Optional.empty();
        }
    }

    public List<Comment> findByPostId(UUID postId) {
        return jdbc.query(
            "SELECT * FROM comments WHERE post_id = ? ORDER BY created_at ASC",
            new BeanPropertyRowMapper<>(Comment.class),
            postId
        );
    }

    public List<Comment> findTopLevelCommentsByPostId(UUID postId) {
        return jdbc.query(
            "SELECT * FROM comments WHERE post_id = ? AND parent_id IS NULL ORDER BY created_at ASC",
            new BeanPropertyRowMapper<>(Comment.class),
            postId
        );
    }

    public List<Comment> findRepliesByParentId(UUID parentId) {
        return jdbc.query(
            "SELECT * FROM comments WHERE parent_id = ? ORDER BY created_at ASC",
            new BeanPropertyRowMapper<>(Comment.class),
            parentId
        );
    }

    public void update(Comment comment) {
        jdbc.update(
            "UPDATE comments SET content = ?, updated_at = ? WHERE id = ?",
            comment.getContent(), comment.getUpdatedAt(), comment.getId()
        );
    }

    public void deleteById(UUID id) {
        jdbc.update("DELETE FROM comments WHERE id = ?", id);
    }

    public int countByPostId(UUID postId) {
        Integer count = jdbc.queryForObject(
            "SELECT COUNT(*) FROM comments WHERE post_id = ?",
            Integer.class,
            postId
        );
        return count != null ? count : 0;
    }
}
