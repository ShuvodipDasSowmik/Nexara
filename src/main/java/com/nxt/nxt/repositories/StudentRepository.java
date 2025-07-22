package com.nxt.nxt.repositories;

import java.util.Optional;
import java.util.UUID;

import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.BeanPropertyRowMapper;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import com.nxt.nxt.entity.Student;

@Repository
public class StudentRepository {

    private final JdbcTemplate jdbc;

    public StudentRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public void save(Student s) {
        jdbc.update(
            "INSERT INTO students (id, full_name, username, password, institute, education_level, email) VALUES (?, ?, ?, ?, ?, ?, ?)",
            UUID.randomUUID(), s.getFullName(), s.getUsername(), s.getPassword(), s.getInstitute(), s.getEducationLevel(), s.getEmail()
        );
    }

    public Optional<Student> findByUsername(String username) {
        try {
            return Optional.ofNullable(
                jdbc.queryForObject(
                    "SELECT * FROM students WHERE username = ?",
                    new BeanPropertyRowMapper<>(Student.class),
                    username
                )
            );
        }
        catch (EmptyResultDataAccessException e) {
            return Optional.empty();
        }
    }

    public Optional<Student> findById(UUID id) {
        try {
            return Optional.ofNullable(
                jdbc.queryForObject(
                    "SELECT * FROM students WHERE id = ?",
                    new BeanPropertyRowMapper<>(Student.class),
                    id
                )
            );
        }
        catch (EmptyResultDataAccessException e) {
            return Optional.empty();
        }
    }

    public void deleteById(UUID id) {
        jdbc.update("DELETE FROM students WHERE id = ?", id);
    }

    public Optional<Student> findByEmail(String email) {
        try {
            return Optional.ofNullable(
                jdbc.queryForObject(
                    "SELECT * FROM students WHERE email = ?",
                    new BeanPropertyRowMapper<>(Student.class),
                    email
                )
            );
        }
        catch (EmptyResultDataAccessException e) {
            return Optional.empty();
        }
    }
}


// Optional Class:
// - A container object which may or may not contain a non-null value
// - Used to avoid null checks and NullPointerExceptions
// - Provides methods like isPresent(), get(), orElse(), etc. to handle the value safely
// - ofNullable(): Returns an Optional describing the specified value, if non-null, otherwise returns an empty Optional
// - of(): Returns an Optional with the specified non-null value
// - empty(): Returns an empty Optional

// BeanPropertyRowMapper Class:
// - Maps rows of a ResultSet to Java Object [beans] properties
// - Used in Spring's JDBC to convert database rows into Java objects
// - Automatically maps columns to fields based on naming conventions

// JdbcTemplate Class:
// - Spring's JDBC abstraction for executing SQL queries and updates
// - Provides methods for querying, updating, and batch processing
// - Simplifies error handling and resource management
// - Supports various data access operations like queryForObject(), query(), update(), etc.
