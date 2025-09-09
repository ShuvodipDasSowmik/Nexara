package com.nxt.nxt.dto;

public class AdminSigninRequest {
    
    private String usernameOrEmail;
    private String password;

    // Constructors
    public AdminSigninRequest() {}

    public AdminSigninRequest(String usernameOrEmail, String password) {
        this.usernameOrEmail = usernameOrEmail;
        this.password = password;
    }

    // Getters and Setters
    public String getUsernameOrEmail() {
        return usernameOrEmail;
    }

    public void setUsernameOrEmail(String usernameOrEmail) {
        this.usernameOrEmail = usernameOrEmail;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    @Override
    public String toString() {
        return "AdminSigninRequest{" +
                "usernameOrEmail='" + usernameOrEmail + '\'' +
                '}';
    }
}
