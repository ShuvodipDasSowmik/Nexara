package com.nxt.nxt.controller;

import java.util.Map;
import java.util.Optional;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.nxt.nxt.entity.Student;
import com.nxt.nxt.repositories.StudentRepository;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final StudentRepository repo;

    public AuthController(StudentRepository repo) {
        this.repo = repo;
    }

    @PostMapping("/signup")
    public ResponseEntity<String> signup(@RequestBody Student student) {
        // System.out.println("Received signup request for: " + student);
        repo.save(student);
        return ResponseEntity.ok("Signed up");
    }

    @PostMapping("/signin")
    public ResponseEntity<?> signin(@RequestBody Map<String, String> credentials) {
        System.out.println("Received signin request with credentials: " + credentials);
        Optional<Student> userOpt = Optional.empty();

        if (credentials.containsKey("username")) {
            userOpt = repo.findByUsername(credentials.get("username"));
        }
        if (userOpt.isEmpty() && credentials.containsKey("email")) {
            userOpt = repo.findByEmail(credentials.get("email"));
        }

        if (userOpt.isPresent() && userOpt.get().getPassword().equals(credentials.get("password"))) {
            return ResponseEntity.ok(userOpt.get());
        }

        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid credentials");
    }
}
