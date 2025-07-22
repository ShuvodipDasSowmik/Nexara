package com.nxt.nxt;

import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
public class DbConnectionTest implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;

    public DbConnectionTest(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(String... args) {
        Integer result = jdbcTemplate.queryForObject("SELECT 1", Integer.class);
        System.out.println("\n\nServer Successfully Connected to Database: " + result);
    }
}
