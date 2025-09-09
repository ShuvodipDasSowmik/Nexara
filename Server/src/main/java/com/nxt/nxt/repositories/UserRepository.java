package com.nxt.nxt.repositories;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import com.nxt.nxt.entity.User;

@Repository
public class UserRepository {

    private final JdbcTemplate jdbc;

    public UserRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    private static class UserRowMapper implements RowMapper<User> {
        @Override
        public User mapRow(ResultSet rs, int rowNum) throws SQLException {
            User user = new User();
            user.setId(UUID.fromString(rs.getString("id")));
            user.setUsername(rs.getString("username"));
            user.setPassword(rs.getString("password"));
            user.setEmail(rs.getString("email"));
            user.setRole(rs.getString("role"));
            
            Timestamp createdAt = rs.getTimestamp("created_at");
            if (createdAt != null) {
                user.setCreatedAt(createdAt.toLocalDateTime());
            }
            
            Timestamp updatedAt = rs.getTimestamp("updated_at");
            if (updatedAt != null) {
                user.setUpdatedAt(updatedAt.toLocalDateTime());
            }
            
            return user;
        }
    }

    public void save(User user) {
        if (user.getId() == null) {
            user.setId(UUID.randomUUID());
        }
        
        String sql = """
            INSERT INTO users (id, username, password, email, role, created_at, updated_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT (id) DO UPDATE SET
                username = EXCLUDED.username,
                password = EXCLUDED.password,
                email = EXCLUDED.email,
                role = EXCLUDED.role,
                updated_at = EXCLUDED.updated_at
            """;
            
        jdbc.update(sql,
            user.getId(),
            user.getUsername(),
            user.getPassword(),
            user.getEmail(),
            user.getRole(),
            Timestamp.valueOf(user.getCreatedAt()),
            Timestamp.valueOf(LocalDateTime.now())
        );
    }

    public Optional<User> findByUsername(String username) {
        try {
            String sql = "SELECT * FROM users WHERE username = ?";
            User user = jdbc.queryForObject(sql, new UserRowMapper(), username);
            return Optional.of(user);
        } catch (EmptyResultDataAccessException e) {
            return Optional.empty();
        }
    }

    public Optional<User> findByEmail(String email) {
        try {
            String sql = "SELECT * FROM users WHERE email = ?";
            User user = jdbc.queryForObject(sql, new UserRowMapper(), email);
            return Optional.of(user);
        } catch (EmptyResultDataAccessException e) {
            return Optional.empty();
        }
    }

    public Optional<User> findById(UUID id) {
        try {
            String sql = "SELECT * FROM users WHERE id = ?";
            User user = jdbc.queryForObject(sql, new UserRowMapper(), id);
            return Optional.of(user);
        } catch (EmptyResultDataAccessException e) {
            return Optional.empty();
        }
    }

    public List<User> findByRole(String role) {
        String sql = "SELECT * FROM users WHERE role = ?";
        return jdbc.query(sql, new UserRowMapper(), role);
    }

    public List<User> findAllAdmins() {
        return findByRole("admin");
    }

    public List<User> findAllStudents() {
        return findByRole("student");
    }

    public boolean existsByUsername(String username) {
        String sql = "SELECT COUNT(*) FROM users WHERE username = ?";
        Integer count = jdbc.queryForObject(sql, Integer.class, username);
        return count != null && count > 0;
    }

    public boolean existsByEmail(String email) {
        String sql = "SELECT COUNT(*) FROM users WHERE email = ?";
        Integer count = jdbc.queryForObject(sql, Integer.class, email);
        return count != null && count > 0;
    }

    public void deleteById(UUID id) {
        String sql = "DELETE FROM users WHERE id = ?";
        jdbc.update(sql, id);
    }

    public List<User> findAll() {
        String sql = "SELECT * FROM users ORDER BY created_at DESC";
        return jdbc.query(sql, new UserRowMapper());
    }

    public long countByRole(String role) {
        String sql = "SELECT COUNT(*) FROM users WHERE role = ?";
        Integer count = jdbc.queryForObject(sql, Integer.class, role);
        return count != null ? count : 0;
    }
}
