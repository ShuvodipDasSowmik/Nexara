package com.nxt.nxt.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class TestRoute {

    @GetMapping("/")
    public String Hello() {
        return "Hello, this is a test route!";
    }
}
