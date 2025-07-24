package com.nxt.nxt.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.nxt.nxt.entity.Student;
import com.nxt.nxt.repositories.StudentRepository;
import org.springframework.security.core.context.SecurityContextHolder;

import org.springframework.security.core.Authentication;

@RestController
@RequestMapping("/api/users")
public class UserController {

    StudentRepository studentRepo;

    public UserController(StudentRepository studentRepo) {
        this.studentRepo = studentRepo;
    }
    
    @GetMapping("/dashboard")
    public Student getDashboardData() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth.getName();

        System.out.println("Fetching dashboard data for user: " + username);

        return studentRepo.findByUsername(username).orElse(null);
    }


}