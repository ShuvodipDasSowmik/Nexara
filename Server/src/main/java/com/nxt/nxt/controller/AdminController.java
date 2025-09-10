package com.nxt.nxt.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.nxt.nxt.dto.AdminSigninRequest;
import com.nxt.nxt.dto.AdminSignupRequest;
import com.nxt.nxt.entity.User;
import com.nxt.nxt.repositories.UserRepository;
import com.nxt.nxt.security.JWTUtil;
import com.nxt.nxt.service.AdminService;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final AdminService adminService;
    private final UserRepository userRepository;
    private final JWTUtil jwtUtil;

    public AdminController(AdminService adminService, UserRepository userRepository, JWTUtil jwtUtil) {
        this.adminService = adminService;
        this.userRepository = userRepository;
        this.jwtUtil = jwtUtil;
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

    @PostMapping("/signup")
    public ResponseEntity<Map<String, Object>> adminSignup(@RequestBody AdminSignupRequest request) {
        try {
            System.out.println("Received admin signup request for: " + request.getUsername());
            
            User admin = adminService.createAdmin(request);
            
            Map<String, Object> response = new HashMap<>();

            response.put("success", true);
            response.put("message", "Admin user created successfully");
            response.put("admin", Map.of(
                "id", admin.getId(),
                "username", admin.getUsername(),
                "email", admin.getEmail(),
                "role", admin.getRole(),
                "createdAt", admin.getCreatedAt()
            ));
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            System.err.println("Error during admin signup: " + e.getMessage());
            
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());
            
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
        }
    }

    @PostMapping("/signin")
    public ResponseEntity<?> adminSignin(@RequestBody AdminSigninRequest request, HttpServletResponse response) {
        try {
            System.out.println("Received admin signin request for: " + request.getUsernameOrEmail());
            
            User admin = adminService.authenticateAdmin(request);
            
            // Generate JWT tokens
            String accessToken = jwtUtil.generateAccessToken(admin.getUsername());
            String refreshToken = jwtUtil.generateRefreshToken(admin.getUsername());

            // Set cookies
            setCookie(response, "refreshToken", refreshToken, 60 * 60 * 24 * 7); // 7 days
            setCookie(response, "accessToken", accessToken, 60 * 60); // 1 hour

            Map<String, Object> result = Map.of(
                "user", Map.of(
                    "id", admin.getId(),
                    "username", admin.getUsername(),
                    "email", admin.getEmail(),
                    "role", admin.getRole(),
                    "createdAt", admin.getCreatedAt()
                ),
                "message", "Admin signed in successfully"
            );
            
            return ResponseEntity.ok(result);
            
        }
        catch (Exception e) {
            System.err.println("Error during admin signin: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        }
    }

    @GetMapping("/users")
    public ResponseEntity<?> getAllUsers(HttpServletRequest request) {
        try {
            // Verify admin access
            if (!isAdminAuthenticated(request)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of(
                    "success", false,
                    "message", "Admin access required"
                ));
            }

            List<User> users = adminService.getAllUsers();
            
            // Remove password from response
            List<Map<String, Object>> userList = users.stream().map(user -> {
                Map<String, Object> userMap = new HashMap<>();
                userMap.put("id", user.getId());
                userMap.put("username", user.getUsername());
                userMap.put("email", user.getEmail());
                userMap.put("role", user.getRole());
                userMap.put("createdAt", user.getCreatedAt());
                userMap.put("updatedAt", user.getUpdatedAt());
                return userMap;
            }).collect(Collectors.toList());

            return ResponseEntity.ok(Map.of(
                "success", true,
                "users", userList,
                "totalUsers", users.size(),
                "adminCount", adminService.getAdminCount(),
                "studentCount", adminService.getStudentCount()
            ));
            
        }
        catch (Exception e) {
            System.err.println("Error fetching users: " + e.getMessage());

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                "success", false,
                "message", "Error fetching users"
            ));
        }
    }

    @DeleteMapping("/users/{userId}")
    public ResponseEntity<?> deleteUser(@PathVariable UUID userId, HttpServletRequest request) {
        try {
            // Verify admin access
            if (!isAdminAuthenticated(request)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of(
                    "success", false,
                    "message", "Admin access required"
                ));
            }

            adminService.deleteUser(userId);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "User deleted successfully"
            ));
            
        }
        catch (Exception e) {
            System.err.println("Error deleting user: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        }
    }

    @PutMapping("/users/{userId}/role")
    public ResponseEntity<?> updateUserRole(@PathVariable UUID userId, @RequestBody Map<String, String> roleUpdate, HttpServletRequest request) {
        try {
            // Verify admin access
            if (!isAdminAuthenticated(request)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of(
                    "success", false,
                    "message", "Admin access required"
                ));
            }

            String newRole = roleUpdate.get("role");
            User updatedUser = adminService.updateUserRole(userId, newRole);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "User role updated successfully",
                "user", Map.of(
                    "id", updatedUser.getId(),
                    "username", updatedUser.getUsername(),
                    "email", updatedUser.getEmail(),
                    "role", updatedUser.getRole(),
                    "updatedAt", updatedUser.getUpdatedAt()
                )
            ));
            
        }
        catch (Exception e) {
            System.err.println("Error updating user role: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        }
    }

    @GetMapping("/stats")
    public ResponseEntity<?> getAdminStats(HttpServletRequest request) {
        try {
            // Verify admin access
            if (!isAdminAuthenticated(request)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of(
                    "success", false,
                    "message", "Admin access required"
                ));
            }

            return ResponseEntity.ok(Map.of(
                "success", true,
                "stats", Map.of(
                    "totalUsers", adminService.getAllUsers().size(),
                    "adminCount", adminService.getAdminCount(),
                    "studentCount", adminService.getStudentCount()
                )
            ));
            
        }
        catch (Exception e) {
            System.err.println("Error fetching admin stats: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                "success", false,
                "message", "Error fetching statistics"
            ));
        }
    }

    private boolean isAdminAuthenticated(HttpServletRequest request) {
        try {
            String accessToken = null;
            
            if (request.getCookies() != null) {
                for (Cookie cookie : request.getCookies()) {
                    if ("accessToken".equals(cookie.getName())) {
                        accessToken = cookie.getValue();
                        break;
                    }
                }
            }

            if (accessToken == null) {
                return false;
            }

            String username = jwtUtil.extractUsername(accessToken);
            if (!jwtUtil.isValidToken(accessToken, username)) {
                return false;
            }

            Optional<User> userOpt = userRepository.findByUsername(username);
            return userOpt.isPresent() && "admin".equals(userOpt.get().getRole());
            
        }
        catch (Exception e) {
            System.err.println("Error verifying admin authentication: " + e.getMessage());
            return false;
        }
    }
}
