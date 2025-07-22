package com.nxt.nxt.repositories;

import org.springframework.jdbc.core.JdbcTemplate;

import com.nxt.nxt.entity.ChatTopic;

public class ChatTopicRepository  {
    
    private final JdbcTemplate jdbc;

    public ChatTopicRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public void createChatTopic(ChatTopic ct) {
        String sql = "INSERT INTO CHAT_TOPIC (username, chat_topic) VALUES (?, ?)";
        jdbc.update(sql, ct.getUsername(), ct.getChat_topic()); 
    }
}
