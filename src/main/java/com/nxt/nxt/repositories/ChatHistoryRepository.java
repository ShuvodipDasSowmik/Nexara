package com.nxt.nxt.repositories;

import org.springframework.jdbc.core.JdbcTemplate;

import com.nxt.nxt.entity.ChatHistory;

public class ChatHistoryRepository {

    private final JdbcTemplate jdbc;

    public ChatHistoryRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public void saveChatHistory(ChatHistory CH) {
        String sql = "INSERT INTO chat_history (user_msg, user_msg_time, api_response, api_response_time) VALUES (?, ?, ?, ?)";
        jdbc.update(sql, CH.getUser_msg(), CH.getUser_msg_time(), CH.getApi_response(), CH.getApi_response_time());
    }
}
