package com.nxt.nxt.repositories;

import java.sql.PreparedStatement;
import java.sql.Statement;
import java.util.List;
import java.util.Optional;

import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.BeanPropertyRowMapper;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

import com.nxt.nxt.entity.Question;

@Repository
public class QuestionRepository {

    private final JdbcTemplate jdbc;

    public QuestionRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public void save(Question question) {
        if (question.getId() == null) {
            // Create new question
            KeyHolder keyHolder = new GeneratedKeyHolder();
            jdbc.update(connection -> {
                PreparedStatement ps = connection.prepareStatement(
                    "INSERT INTO question (exam_id, question_text, option_a, option_b, option_c, option_d, correct_answer, question_type) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                    Statement.RETURN_GENERATED_KEYS
                );
                ps.setLong(1, question.getExamId());
                ps.setString(2, question.getQuestionText());
                ps.setString(3, question.getOptionA());
                ps.setString(4, question.getOptionB());
                ps.setString(5, question.getOptionC());
                ps.setString(6, question.getOptionD());
                ps.setString(7, question.getCorrectAnswer());
                ps.setString(8, question.getQuestionType() != null ? question.getQuestionType() : "multiple_choice");
                return ps;
            }, keyHolder);
            
            // Extract the ID from the generated keys
            Number generatedId = (Number) keyHolder.getKeys().get("id");
            if (generatedId != null) {
                question.setId(generatedId.intValue());
                System.out.println("Successfully saved question with generated ID: " + question.getId());
            } else {
                throw new RuntimeException("Failed to get generated ID for question");
            }
        } else {
            // Update question
            jdbc.update(
                "UPDATE question SET exam_id = ?, question_text = ?, option_a = ?, option_b = ?, option_c = ?, option_d = ?, correct_answer = ? WHERE id = ?",
                question.getExamId(), question.getQuestionText(), question.getOptionA(), question.getOptionB(), question.getOptionC(), question.getOptionD(), question.getCorrectAnswer(), question.getId()
            );
        }
    }

    public Optional<Question> findById(Integer id) {
        try {
            return Optional.ofNullable(
                jdbc.queryForObject(
                    "SELECT * FROM question WHERE id = ?",
                    new BeanPropertyRowMapper<>(Question.class),
                    id
                )
            );
        }
        catch (EmptyResultDataAccessException e) {
            return Optional.empty();
        }
    }

    public List<Question> findByExamId(Integer examId) {
        return jdbc.query(
            "SELECT * FROM question WHERE exam_id = ?",
            new BeanPropertyRowMapper<>(Question.class),
            examId
        );
    }

    public void deleteById(Integer id) {
        jdbc.update("DELETE FROM question WHERE id = ?", id);
    }
}
