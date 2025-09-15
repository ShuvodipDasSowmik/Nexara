package com.nxt.nxt.repositories;

import java.sql.PreparedStatement;
import java.sql.Statement;
import java.sql.Timestamp;
import java.util.Optional;

import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.BeanPropertyRowMapper;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

import com.nxt.nxt.entity.Exam;

@Repository
public class ExamRepository {

    private final JdbcTemplate jdbc;

    public ExamRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public void save(Exam exam) {
        try {
            if (exam.getId() == null) {
                // Insert new exam and get the generated ID
                KeyHolder keyHolder = new GeneratedKeyHolder();
                jdbc.update(connection -> {
                    PreparedStatement ps = connection.prepareStatement(
                        "INSERT INTO exam (title, description, input_text, created_at, student_id) VALUES (?, ?, ?, ?, ?)",
                        Statement.RETURN_GENERATED_KEYS);
                    ps.setString(1, exam.getTitle());
                    ps.setString(2, exam.getDescription());
                    ps.setString(3, exam.getInputText());
                    ps.setTimestamp(4, Timestamp.valueOf(exam.getCreatedAt()));
                    ps.setObject(5, exam.getStudentId());
                    return ps;
                }, keyHolder);
                
                // Extract the ID from the generated keys
                Number generatedId = (Number) keyHolder.getKeys().get("id");
                if (generatedId != null) {
                    exam.setId(generatedId.intValue());
                    System.out.println("Successfully saved exam with generated ID: " + exam.getId());
                } else {
                    throw new RuntimeException("Failed to get generated ID from database");
                }
            } else {
                // Update exam
                jdbc.update(
                    "UPDATE exam SET title = ?, description = ?, input_text = ?, created_at = ?, student_id = ? WHERE id = ?",
                    exam.getTitle(), exam.getDescription(), exam.getInputText(), exam.getCreatedAt(), exam.getStudentId(), exam.getId()
                );
                System.out.println("Successfully updated exam with ID: " + exam.getId());
            }
        } catch (Exception e) {
            System.err.println("Error saving exam: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }

    public Optional<Exam> findById(Integer id) {
        try {
            return Optional.ofNullable(
                jdbc.queryForObject(
                    "SELECT * FROM exam WHERE id = ?",
                    new BeanPropertyRowMapper<>(Exam.class),
                    id
                )
            );
        }
        catch (EmptyResultDataAccessException e) {
            return Optional.empty();
        }
    }

    public java.util.List<Exam> findAllById(java.util.Set<Integer> ids) {
        if (ids == null || ids.isEmpty()) {
            return java.util.Collections.emptyList();
        }
        
        String placeholders = ids.stream()
            .map(id -> "?")
            .collect(java.util.stream.Collectors.joining(","));
        
        String sql = "SELECT * FROM exam WHERE id IN (" + placeholders + ")";
        
        return jdbc.query(sql, new BeanPropertyRowMapper<>(Exam.class), ids.toArray());
    }

    public void deleteById(Integer id) {
        jdbc.update("DELETE FROM exam WHERE id = ?", id);
    }
}
