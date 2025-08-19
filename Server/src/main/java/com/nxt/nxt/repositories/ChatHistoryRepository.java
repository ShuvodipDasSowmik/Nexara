package com.nxt.nxt.repositories;
import java.util.List;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;
import com.nxt.nxt.entity.ChatHistory;

@Repository
public class ChatHistoryRepository {

    private final JdbcTemplate jdbc;

    public ChatHistoryRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public void saveChatHistory(ChatHistory CH) {
        String sql = "INSERT INTO chat_history (username, ct_id, user_msg, user_msg_time, api_response, api_response_time) VALUES (?, ?, ?, ?, ?, ?)";
        
        jdbc.update(sql, CH.getUsername(), CH.getCt_id(), CH.getUser_msg(), CH.getUser_msg_time(), CH.getApi_response(), CH.getApi_response_time());
    }

    public List<ChatHistory> getChatHistoryByChatTopicId(Integer ct_id) {
        String sql = "SELECT * FROM chat_history WHERE ct_id = ?";

        return jdbc.query(sql, (rs, rowNum) -> new ChatHistory(
                rs.getInt("ch_id"),
                rs.getString("username"),
                rs.getInt("ct_id"),
                rs.getString("user_msg"),
                rs.getString("api_response"),
                rs.getString("user_msg_time"),
                rs.getString("api_response_time")
        ), ct_id);
    }
}
