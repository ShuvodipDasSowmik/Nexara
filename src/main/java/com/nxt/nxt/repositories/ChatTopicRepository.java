package com.nxt.nxt.repositories;

import java.util.List;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import com.nxt.nxt.entity.ChatTopic;

@Repository
public class ChatTopicRepository  {
    
    private final JdbcTemplate jdbc;

    public ChatTopicRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public int createChatTopic(ChatTopic ct) {
        String sql = "INSERT INTO CHAT_TOPIC (username, chat_topic) VALUES (?, ?) RETURNING ct_id";
        return jdbc.queryForObject(sql, Integer.class, ct.getUsername(), ct.getChat_topic());
    }

    public List<ChatTopic> getChatTopicsByUsername(String username) {
        String sql = "SELECT * FROM CHAT_TOPIC WHERE username = ?";
        return jdbc.query(sql, (rs, rowNum) -> new ChatTopic(rs.getInt("ct_id"), rs.getString("username"), rs.getString("chat_topic")), username);
    }
}
