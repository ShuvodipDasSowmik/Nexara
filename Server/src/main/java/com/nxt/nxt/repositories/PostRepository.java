package com.nxt.nxt.repositories;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.BeanPropertyRowMapper;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import com.nxt.nxt.entity.Post;

@Repository
public class PostRepository {

    private final JdbcTemplate jdbc;

    public PostRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public void save(Post post) {
        jdbc.update(
            "INSERT INTO posts (id, student_id, title, content, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
            post.getId(), post.getStudentId(), post.getTitle(), post.getContent(), post.getCreatedAt(), post.getUpdatedAt()
        );
    }

    public Optional<Post> findById(UUID id) {
        try {
            return Optional.ofNullable(
                jdbc.queryForObject(
                    "SELECT * FROM posts WHERE id = ?",
                    new BeanPropertyRowMapper<>(Post.class),
                    id
                )
            );
        }
        catch (EmptyResultDataAccessException e) {
            return Optional.empty();
        }
    }

    public List<Post> findAll() {
        return jdbc.query(
            "SELECT * FROM posts ORDER BY created_at DESC",
            new BeanPropertyRowMapper<>(Post.class)
        );
    }

    public List<Post> findByStudentId(UUID studentId) {
        return jdbc.query(
            "SELECT * FROM posts WHERE student_id = ? ORDER BY created_at DESC",
            new BeanPropertyRowMapper<>(Post.class),
            studentId
        );
    }

    public void update(Post post) {
        jdbc.update(
            "UPDATE posts SET title = ?, content = ?, updated_at = ? WHERE id = ?",
            post.getTitle(), post.getContent(), post.getUpdatedAt(), post.getId()
        );
    }

    public void deleteById(UUID id) {
        jdbc.update("DELETE FROM posts WHERE id = ?", id);
    }
}
