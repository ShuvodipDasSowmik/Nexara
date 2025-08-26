package com.nxt.nxt.entity;
import java.time.LocalDateTime;

public class ChatTopic {
    private Integer ct_id;
    private String username;
    private String chat_topic;
    private LocalDateTime started_at;

    public ChatTopic() {}

    public ChatTopic(Integer ct_id, String username, String chat_topic, LocalDateTime started_at) {
        this.ct_id = ct_id;
        this.username = username;
        this.chat_topic = chat_topic;
        this.started_at = started_at;
    }

    public ChatTopic(Integer ct_id, String username, String chat_topic) {
        this.ct_id = ct_id;
        this.username = username;
        this.chat_topic = chat_topic;
        this.started_at = LocalDateTime.now();
    }

    
    public ChatTopic(String username, String chat_topic) {
        this.username = username;
        this.chat_topic = chat_topic;
        this.started_at = LocalDateTime.now();
    }

    public Integer getCt_id() {
        return ct_id;
    }

    public void setCt_id(Integer ct_id) {
        this.ct_id = ct_id;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getChat_topic() {
        return chat_topic;
    }

    public void setChat_topic(String chat_topic) {
        this.chat_topic = chat_topic;
    }

    public LocalDateTime getStarted_at() {
        return started_at;
    }

    public void setStarted_at(LocalDateTime started_at) {
        this.started_at = started_at;
    }

    @Override
    public String toString() {
        return "ChatTopic{" +
                "ct_id=" + ct_id +
                ", username='" + username + '\'' +
                ", chat_topic='" + chat_topic + '\'' +
                ", started_at=" + started_at +
                '}';
    }
}
