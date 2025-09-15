package com.nxt.nxt.controller;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.nxt.nxt.entity.Student;
import com.nxt.nxt.entity.User;
import com.nxt.nxt.repositories.StudentRepository;
import com.nxt.nxt.repositories.UserRepository;
import com.nxt.nxt.security.JWTUtil;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserRepository userRepo;
    private final StudentRepository studentRepo;
    private final PasswordEncoder encoder;
    private final JWTUtil jwtUtil;

    public AuthController(UserRepository userRepo, StudentRepository studentRepo, PasswordEncoder encoder, JWTUtil jwtUtil) {
        this.userRepo = userRepo;
        this.studentRepo = studentRepo;
        this.encoder = encoder;
        this.jwtUtil = jwtUtil;
    }

    @PostMapping("/signup")
    public ResponseEntity<Map<String, Object>> signup(@RequestBody Student studentRequest) {
        try {
            System.out.println("Received signup request for: " + studentRequest.getUsername());
            
            // Generate a unique ID for the user
            UUID userId = UUID.randomUUID();
            
            String encodedPassword = encoder.encode(studentRequest.getPassword());
            
            // Create User record first (primary table)
            User user = new User();
            user.setId(userId);
            user.setUsername(studentRequest.getUsername());
            user.setPassword(encodedPassword);
            user.setEmail(studentRequest.getEmail());
            user.setRole("student");

            userRepo.save(user);
            System.out.println("Successfully saved user: " + user.getUsername());
            
            // Create Student record with reference to user (foreign key)
            Student student = new Student();
            student.setId(UUID.randomUUID()); // Student table can have its own ID
            student.setUserId(userId); // Reference to users table
            student.setFullName(studentRequest.getFullName());
            student.setUsername(studentRequest.getUsername());
            student.setPassword(encodedPassword);
            student.setEmail(studentRequest.getEmail());
            student.setInstitute(studentRequest.getInstitute());
            student.setEducationLevel(studentRequest.getEducationLevel());
            
            studentRepo.save(student);
            System.out.println("Successfully saved student: " + student.getUsername());
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "User created successfully");
            response.put("username", user.getUsername());
            
            return ResponseEntity.ok(response);
            
        }
        catch (org.springframework.dao.DuplicateKeyException e) {
            System.err.println("Duplicate key error: " + e.getMessage());
            
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            
            // Check if it's a username or email duplicate
            if (e.getMessage().contains("users_username_key") || e.getMessage().contains("students_username_key")) {
                errorResponse.put("message", "Username already exists. Please choose a different username.");
            } else if (e.getMessage().contains("users_email_key") || e.getMessage().contains("students_email_key")) {
                errorResponse.put("message", "Email already exists. Please use a different email address.");
            } else {
                errorResponse.put("message", "User with this information already exists.");
            }
            
            return ResponseEntity.status(HttpStatus.CONFLICT).body(errorResponse);
            
        } catch (Exception e) {
            System.err.println("Error during signup: " + e.getMessage());
            e.printStackTrace();
            
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Error creating user. Please try again.");
            
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    private void setCookie(HttpServletResponse response, String name, String value, int maxAge) {
        String env = System.getProperty("NEXARA_ENV", "dev");
        String cookieStr;

        if ("prod".equalsIgnoreCase(env)) {
            cookieStr = String.format("%s=%s; Max-Age=%d; Path=/; Domain=%s; HttpOnly; Secure; SameSite=None",
                    name, value, maxAge, "nexara-mhfy.onrender.com");
        }
        else {
            cookieStr = String.format("%s=%s; Max-Age=%d; Path=/; HttpOnly", name, value, maxAge);
        }

        response.addHeader("Set-Cookie", cookieStr);
    }

    @PostMapping("/signin")
    public ResponseEntity<?> signin(@RequestBody Map<String, String> credentials, HttpServletResponse response) {
        Optional<User> userOpt = Optional.empty();

        // Check by username first
        if (credentials.containsKey("username")) {
            userOpt = userRepo.findByUsername(credentials.get("username"));
        }

        // If not found and email provided, check by email
        if (userOpt.isEmpty() && credentials.containsKey("email")) {
            userOpt = userRepo.findByEmail(credentials.get("email"));
        }

        // Authenticate user
        if (userOpt.isPresent() && encoder.matches(credentials.get("password"), userOpt.get().getPassword())) {
            User user = userOpt.get();
            String accessToken = jwtUtil.generateAccessToken(user.getUsername());
            String refreshToken = jwtUtil.generateRefreshToken(user.getUsername());

            setCookie(response, "refreshToken", refreshToken, 60 * 60 * 24 * 7);
            setCookie(response, "accessToken", accessToken, 60 * 60);

            Map<String, Object> result = Map.of("user", user);
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

        setCookie(response, "refreshToken", null, 0);
        setCookie(response, "accessToken", null, 0);

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

            setCookie(response, "accessToken", newAccessToken, 60 * 15);

            return ResponseEntity.ok(Map.of("status", "refreshed"));
        }

        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid refresh token");
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(HttpServletRequest request) {
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
            String username = jwtUtil.extractUsername(accessToken);

            if (!jwtUtil.isValidToken(accessToken, username)) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }

            Optional<User> userOpt = userRepo.findByUsername(username);
            if (userOpt.isPresent()) {
                User user = userOpt.get();
                
                // Get the corresponding student information using the user ID relationship
                Optional<Student> studentOpt = studentRepo.findByUserId(user.getId());
                
                // Create a response with both user and student information
                Map<String, Object> response = new HashMap<>();
                response.put("id", user.getId());
                response.put("username", user.getUsername());
                response.put("email", user.getEmail());
                response.put("role", user.getRole());
                response.put("createdAt", user.getCreatedAt());
                response.put("updatedAt", user.getUpdatedAt());
                
                if (studentOpt.isPresent()) {
                    response.put("studentId", studentOpt.get().getId());
                }
                else {
                    response.put("studentId", null);
                }
                
                return ResponseEntity.ok(response);
            }

            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }

        catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
    }
}