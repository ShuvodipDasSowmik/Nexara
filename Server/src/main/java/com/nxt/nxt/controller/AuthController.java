package com.nxt.nxt.controller;

import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import org.springframework.http.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import com.nxt.nxt.entity.Student;
import com.nxt.nxt.repositories.StudentRepository;
import com.nxt.nxt.security.JWTUtil;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
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
        if (student.getId() == null) {
            student.setId(UUID.randomUUID());
        }
        student.setPassword(encoder.encode(student.getPassword()));

        repo.save(student);
        return ResponseEntity.ok("Signed up");
    }

    @PostMapping("/signin")
    public ResponseEntity<?> signin(@RequestBody Map<String, String> credentials, HttpServletResponse response) {
        // System.out.println("Received signin request with credentials: " +
        // credentials);
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

            Cookie refreshCookie = new Cookie("refreshToken", refreshToken);
            refreshCookie.setHttpOnly(true);
            refreshCookie.setSecure(false);
            refreshCookie.setPath("/");
            refreshCookie.setMaxAge(60 * 60 * 24 * 7);

            response.addCookie(refreshCookie);

            Cookie accessCookie = new Cookie("accessToken", accessToken);
            accessCookie.setHttpOnly(true);
            accessCookie.setSecure(false);
            accessCookie.setPath("/");
            accessCookie.setMaxAge(60 * 60);

            response.addCookie(accessCookie);

            Map<String, Object> result = Map.of(
                    "user", userOpt.get());

            return ResponseEntity.ok(result);
        }

        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid credentials");
    }

    @PostMapping("/signout")
    public ResponseEntity<String> signout(HttpServletResponse response) {

        System.out.println("Signing out user, clearing cookies");
        
        Cookie cookie = new Cookie("refreshToken", null);
        cookie.setHttpOnly(true);
        cookie.setSecure(false);
        cookie.setPath("/");
        cookie.setMaxAge(0);
        response.addCookie(cookie);

        Cookie accessCookie = new Cookie("accessToken", null);
        accessCookie.setHttpOnly(true);
        accessCookie.setSecure(false);
        accessCookie.setPath("/");
        accessCookie.setMaxAge(0);
        response.addCookie(accessCookie);

        return ResponseEntity.ok("Signed out");
    }

    @PostMapping("/refresh")
    public ResponseEntity<?> refresh(HttpServletRequest request, HttpServletResponse response) {
        
        Cookie[] cookies = request.getCookies();
        String refreshToken = null;

        if (cookies != null) {
            for (Cookie cookie : cookies) {
                if ("refreshToken".equals(cookie.getName())) {
                    refreshToken = cookie.getValue();
                    break;
                }
            }
        }

        if (refreshToken != null && jwtUtil.isValidToken(refreshToken, jwtUtil.extractUsername(refreshToken))) {
            String username = jwtUtil.extractUsername(refreshToken);
            String newAccessToken = jwtUtil.generateAccessToken(username);

            Cookie accessCookie = new Cookie("accessToken", newAccessToken);
            accessCookie.setHttpOnly(true);
            accessCookie.setSecure(false);
            accessCookie.setPath("/");
            accessCookie.setMaxAge(60 * 15);
            response.addCookie(accessCookie);

            return ResponseEntity.ok(Map.of("status", "refreshed"));
        }

        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid refresh token");
    }


    @GetMapping("/me")
    public ResponseEntity<Student> getCurrentUser(HttpServletRequest request) {
        Cookie[] cookies = request.getCookies();
        String accessToken = null;

        if (cookies != null) {
            for (Cookie cookie : cookies) {
                if ("accessToken".equals(cookie.getName())) {
                    accessToken = cookie.getValue();
                    break;
                }
            }
        }

        if (accessToken == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        try {
            // parse username once and validate token; parsing can throw if token invalid/expired
            String username = jwtUtil.extractUsername(accessToken);
            
            if (!jwtUtil.isValidToken(accessToken, username)) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }

            Optional<Student> userOpt = repo.findByUsername(username);
            return userOpt.map(ResponseEntity::ok)
                    .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).build());
        }
        
        catch (Exception e) {
            // token parsing/validation failed
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
    }
}
