package com.nxt.nxt.dto;

public class AdminSignupRequest {
    
    private String username;
    private String password;
    private String email;
    private String adminKey; // Special key for admin registration

    // Constructors
    public AdminSignupRequest() {}

    public AdminSignupRequest(String username, String password, String email, String adminKey) {
        this.username = username;
        this.password = password;
        this.email = email;
        this.adminKey = adminKey;
    }

    // Getters and Setters
    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getAdminKey() {
        return adminKey;
    }

    public void setAdminKey(String adminKey) {
        this.adminKey = adminKey;
    }

    @Override
    public String toString() {
        return "AdminSignupRequest{" +
                "username='" + username + '\'' +
                ", email='" + email + '\'' +
                ", adminKey='[PROTECTED]'" +
                '}';
    }
}
