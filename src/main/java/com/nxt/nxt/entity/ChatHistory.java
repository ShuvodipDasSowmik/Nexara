package com.nxt.nxt.entity;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

public class ChatHistory {
    private static final DateTimeFormatter DB_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss.SSSSSS");
    private Integer ch_id;
    private String username;
    private Integer ct_id;
    private String user_msg;
    private LocalDateTime user_msg_time;
    private String api_response;    
    private LocalDateTime api_response_time;

    public ChatHistory() {}

    public ChatHistory(Integer ct_id, String username, String user_msg, String api_response) {
        this.username = username;
        this.ct_id = ct_id;
        this.user_msg = user_msg;
        this.user_msg_time = LocalDateTime.now();
        this.api_response = api_response;
        this.api_response_time = LocalDateTime.now();
    }

    public ChatHistory(Integer ch_id, String username, Integer ct_id, String user_msg, String api_response) {
        this.ch_id = ch_id;
        this.username = username;
        this.ct_id = ct_id;
        this.user_msg = user_msg;
        this.user_msg_time = LocalDateTime.now();
        this.api_response = api_response;
        this.api_response_time = LocalDateTime.now();
    }

    public ChatHistory(Integer ch_id, String username, Integer ct_id, String user_msg, String api_response, String user_msg_time, String api_response_time) {
        this.ch_id = ch_id;
        this.username = username;
        this.ct_id = ct_id;
        this.user_msg = user_msg;
        this.user_msg_time = LocalDateTime.parse(user_msg_time, DB_FORMATTER);
        this.api_response = api_response;
        this.api_response_time = LocalDateTime.parse(api_response_time, DB_FORMATTER
        );
    }

    public Integer getCh_id() {
        return ch_id;
    }

    public void setCh_id(Integer ch_id) {
        this.ch_id = ch_id;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public Integer getCt_id() {
        return ct_id;
    }

    public void setCt_id(Integer ct_id) {
        this.ct_id = ct_id;
    }

    public String getUser_msg() {
        return user_msg;
    }

    public void setUser_msg(String user_msg) {
        this.user_msg = user_msg;
    }

    public LocalDateTime getUser_msg_time() {
        return user_msg_time;
    }

    public void setUser_msg_time(LocalDateTime user_msg_time) {
        this.user_msg_time = user_msg_time;
    }

    public String getApi_response() {
        return api_response;
    }

    public void setApi_response(String api_response) {
        this.api_response = api_response;
    }

    public LocalDateTime getApi_response_time() {
        return api_response_time;
    }

    public void setApi_response_time(LocalDateTime api_response_time) {
        this.api_response_time = api_response_time;
    }

    @Override
    public String toString() {
        return "ChatHistory{" +
                "ch_id=" + ch_id +
                ", username='" + username + '\'' +
                ", ct_id=" + ct_id +
                ", user_msg='" + user_msg + '\'' +
                ", user_msg_time=" + user_msg_time +
                ", api_response='" + api_response + '\'' +
                ", api_response_time=" + api_response_time +
                '}';
    }
}
