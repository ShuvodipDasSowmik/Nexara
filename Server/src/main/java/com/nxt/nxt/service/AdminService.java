package com.nxt.nxt.service;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.nxt.nxt.dto.AdminSigninRequest;
import com.nxt.nxt.dto.AdminSignupRequest;
import com.nxt.nxt.entity.User;
import com.nxt.nxt.repositories.UserRepository;

@Service
public class AdminService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    
    @Value("${admin.registration.key:NEXARA_ADMIN_2024}")
    private String adminRegistrationKey;

    public AdminService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public User createAdmin(AdminSignupRequest request) throws Exception {
        // Validate admin key
        if (!adminRegistrationKey.equals(request.getAdminKey())) {
            throw new Exception("Invalid admin registration key");
        }

        // Validate input
        if (request.getUsername() == null || request.getUsername().trim().isEmpty()) {
            throw new Exception("Username is required");
        }
        
        if (request.getPassword() == null || request.getPassword().length() < 6) {
            throw new Exception("Password must be at least 6 characters");
        }
        
        if (request.getEmail() == null || request.getEmail().trim().isEmpty()) {
            throw new Exception("Email is required");
        }

        // Check if username already exists
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new Exception("Username already exists");
        }

        // Check if email already exists
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new Exception("Email already exists");
        }

        // Create new admin user
        User admin = new User();
        admin.setId(UUID.randomUUID());
        admin.setUsername(request.getUsername().trim());
        admin.setPassword(passwordEncoder.encode(request.getPassword()));
        admin.setEmail(request.getEmail().trim().toLowerCase());
        admin.setRole("admin");

        userRepository.save(admin);
        
        System.out.println("Successfully created admin user: " + admin.getUsername());
        return admin;
    }

    public User authenticateAdmin(AdminSigninRequest request) throws Exception {
        String identifier = request.getUsernameOrEmail();
        String password = request.getPassword();

        if (identifier == null || identifier.trim().isEmpty()) {
            throw new Exception("Username or email is required");
        }

        if (password == null || password.trim().isEmpty()) {
            throw new Exception("Password is required");
        }

        Optional<User> userOpt = Optional.empty();

        // Try to find by username first
        if (!identifier.contains("@")) {
            userOpt = userRepository.findByUsername(identifier);
        }

        // If not found and looks like email, try finding by email
        if (userOpt.isEmpty() && identifier.contains("@")) {
            userOpt = userRepository.findByEmail(identifier.toLowerCase());
        }

        if (userOpt.isEmpty()) {
            throw new Exception("Invalid credentials");
        }

        User user = userOpt.get();

        // Check if user is admin
        if (!"admin".equals(user.getRole())) {
            throw new Exception("Access denied: Admin privileges required");
        }

        // Verify password
        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new Exception("Invalid credentials");
        }

        System.out.println("Admin successfully authenticated: " + user.getUsername());
        return user;
    }

    public List<User> getAllAdmins() {
        return userRepository.findAllAdmins();
    }

    public List<User> getAllStudents() {
        return userRepository.findAllStudents();
    }

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public long getAdminCount() {
        return userRepository.countByRole("admin");
    }

    public long getStudentCount() {
        return userRepository.countByRole("student");
    }

    public Optional<User> getUserById(UUID id) {
        return userRepository.findById(id);
    }

    public Optional<User> getUserByUsername(String username) {
        return userRepository.findByUsername(username);
    }

    public void deleteUser(UUID id) throws Exception {
        Optional<User> userOpt = userRepository.findById(id);
        if (userOpt.isEmpty()) {
            throw new Exception("User not found");
        }

        User user = userOpt.get();
        
        // Prevent deletion of the last admin
        if ("admin".equals(user.getRole()) && getAdminCount() <= 1) {
            throw new Exception("Cannot delete the last admin user");
        }

        userRepository.deleteById(id);
        System.out.println("Successfully deleted user: " + user.getUsername());
    }

    public User updateUserRole(UUID userId, String newRole) throws Exception {
        if (!"admin".equals(newRole) && !"student".equals(newRole)) {
            throw new Exception("Invalid role. Must be 'admin' or 'student'");
        }

        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) {
            throw new Exception("User not found");
        }

        User user = userOpt.get();
        String oldRole = user.getRole();

        // Prevent removing admin role from the last admin
        if ("admin".equals(oldRole) && !"admin".equals(newRole) && getAdminCount() <= 1) {
            throw new Exception("Cannot remove admin role from the last admin user");
        }

        user.setRole(newRole);
        userRepository.save(user);

        System.out.println("Successfully updated user role: " + user.getUsername() + " from " + oldRole + " to " + newRole);
        return user;
    }

    public boolean isValidAdminKey(String key) {
        return adminRegistrationKey.equals(key);
    }
}
