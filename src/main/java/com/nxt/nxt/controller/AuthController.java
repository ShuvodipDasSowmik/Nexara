package com.nxt.nxt.controller;

import java.util.Map;
import java.util.Optional;

import org.springframework.http.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import com.nxt.nxt.entity.Student;
import com.nxt.nxt.repositories.StudentRepository;
import com.nxt.nxt.security.JWTUtil;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;


@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final StudentRepository repo;
    private final PasswordEncoder encoder;
    private final JWTUtil jwtUtil;

    public AuthController(StudentRepository repo, PasswordEncoder encoder, JWTUtil jwtUtil) {
        this.repo = repo;
        this.encoder = encoder;
        this.jwtUtil = jwtUtil;
    }

    @PostMapping("/signup")
    public ResponseEntity<String> signup(@RequestBody Student student) {
        // System.out.println("Received signup request for: " + student);
        student.setPassword(encoder.encode(student.getPassword()));

        repo.save(student);
        return ResponseEntity.ok("Signed up");
    }

    @PostMapping("/signin")
    public ResponseEntity<?> signin(@RequestBody Map<String, String> credentials, HttpServletResponse response) {
        // System.out.println("Received signin request with credentials: " + credentials);
        Optional<Student> userOpt = Optional.empty();

        if (credentials.containsKey("username")) {
            userOpt = repo.findByUsername(credentials.get("username"));
        }

        if (userOpt.isEmpty() && credentials.containsKey("email")) {
            userOpt = repo.findByEmail(credentials.get("email"));
        }

        if (userOpt.isPresent() && encoder.matches(credentials.get("password"), userOpt.get().getPassword())) {

            String accessToken = jwtUtil.generateAccessToken(userOpt.get().getUsername());
            String refreshToken = jwtUtil.generateRefreshToken(userOpt.get().getUsername());

            Cookie cookie = new Cookie("refreshToken", refreshToken);
            cookie.setHttpOnly(true);
            cookie.setSecure(false);
            cookie.setPath("/");
            cookie.setMaxAge(60 * 60 * 24 * 7);
            response.addCookie(cookie);

            Map<String, Object> result = Map.of(
                "accessToken", accessToken,
                "refreshToken", refreshToken,
                "user", userOpt.get()
            );

            return ResponseEntity.ok(result);
        }

        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid credentials");
    }

    @PostMapping("/signout")
    public ResponseEntity<String> signout(HttpServletResponse response) {
        Cookie cookie = new Cookie("refreshToken", null);
        cookie.setHttpOnly(true);
        cookie.setSecure(false);
        cookie.setPath("/");
        cookie.setMaxAge(0); // Expire the cookie
        response.addCookie(cookie);

        return ResponseEntity.ok("Signed out");
    }


    @PostMapping("/refresh")
    public ResponseEntity<?> refresh(@CookieValue(value = "refreshToken", required = false) String refreshToken) {
        if (refreshToken == null || refreshToken.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Refresh token is missing");
        }

        String username = jwtUtil.extractUsername(refreshToken);
        if (username == null || !jwtUtil.isValidToken(refreshToken, username)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid refresh token");
        }

        String newAccessToken = jwtUtil.generateAccessToken(username);
        return ResponseEntity.ok(Map.of("accessToken", newAccessToken));
    }
    
}
