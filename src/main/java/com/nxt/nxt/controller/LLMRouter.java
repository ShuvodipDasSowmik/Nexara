package com.nxt.nxt.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.reactive.function.client.WebClient;

import com.nxt.nxt.dto.ChatResponse;
import com.nxt.nxt.entity.ChatHistory;
import com.nxt.nxt.entity.ChatTopic;
import com.nxt.nxt.repositories.ChatHistoryRepository;
import com.nxt.nxt.repositories.ChatTopicRepository;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/llm")
public class LLMRouter {

    ChatTopicRepository ctRepository;
    ChatHistoryRepository chRepository;

    public LLMRouter(ChatTopicRepository ctRepository, ChatHistoryRepository chRepository) {
        this.ctRepository = ctRepository;
        this.chRepository = chRepository;
    }

    @Value("${api.deepseek.key}")
    String apiKey;

    @Value("${api.openrouter.chat_url}")
    String URL;

    private final WebClient webClient = WebClient.builder().build();

    @PostMapping("/chat")
    public ResponseEntity<Map<String, String>> chatCompletion(@RequestBody Map<String, Object> requestBody) {
        // System.out.println("Received request for chat completion: " + requestBody);
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth.getName();

        int chatTopicId = Integer.MIN_VALUE;

        if(requestBody.get("ct_id") == null) {
            chatTopicId = logChatTopic(username, requestBody.getOrDefault("message", "").toString());
        }
        else{
            chatTopicId = Integer.parseInt(requestBody.get("ct_id").toString());
        }

        Map<String, Object> data = Map.of(
                "model", "deepseek/deepseek-chat-v3-0324:free",
                "messages", List.of(
                        Map.of(
                                "role", "user",
                                "content", requestBody.getOrDefault("message", "Hello"))));

        ChatResponse response = webClient.post()
                .uri(URL)
                .header("Authorization", "Bearer " + apiKey)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(data)
                .retrieve()
                .bodyToMono(ChatResponse.class)
                .block();

        Map<String, String> result = new HashMap<>();
        if (response == null || response.getChoices() == null || response.getChoices().isEmpty()) {
            result.put("message", "");
        }
        
        else {
            String msg = response.getChoices().get(0).getMessage().getContent();
            // System.out.println("Response from LLM API: " + response.getChoices().get(0).getMessage().getContent());
            result.put("message", msg);

            if(chatTopicId != Integer.MIN_VALUE) {
                result.put("ct_id", Integer.toString(chatTopicId));
            }

            if(chatTopicId != Integer.MIN_VALUE && !msg.isEmpty()) {
                logChatHistory(username, chatTopicId, requestBody.getOrDefault("message", "").toString(), msg);
            }
        }

        // System.out.println(result);
        return ResponseEntity.ok(result);
    }


    // ------------ LOGS CHAT TOPIC AND RETURNS ID ----------------

    public int logChatTopic(String username, String message) {
        System.out.println("Received request for chat: " + message);

        Map<String, Object> data = Map.of(
                "model", "deepseek/deepseek-chat-v3-0324:free",
                "messages", List.of(
                        Map.of(
                                "role", "user",
                                "content","Give This message a topic name in max 3 words in plain string, No punctuation or Quotation Mark, But ensure Capitalization for Each word: " + message)));


        ChatResponse response = webClient.post()
                .uri(URL)
                .header("Authorization", "Bearer " + apiKey)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(data)
                .retrieve()
                .bodyToMono(ChatResponse.class)
                .block();

        String topic = response.getChoices().get(0).getMessage().getContent();
        ChatTopic chatTopic = new ChatTopic(username, topic);

        int chatTopicId = ctRepository.createChatTopic(chatTopic);

        return chatTopicId;
    }


    // ------------ LOG CHAT HISTORY ----------------

    public void logChatHistory(String username, Integer chatTopicId, String userMsg, String apiResponse) {
        System.out.println("Logging chat history: " + userMsg + " | " + apiResponse);

        ChatHistory chatHistory = new ChatHistory(chatTopicId, username, userMsg, apiResponse);
        chRepository.saveChatHistory(chatHistory);
    }

    @GetMapping("/chat/topics")
    public ResponseEntity<List<ChatTopic>> getChatTopics() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth.getName();

        // System.out.println("Retrieving chat topics for user: " + username);

        List<ChatTopic> chatTopics = ctRepository.getChatTopicsByUsername(username);
        // System.out.println("Retrieved chat topics for user " + username + ": " + chatTopics);

        return ResponseEntity.ok(chatTopics);
    }


    @GetMapping("/chat/history")
    public ResponseEntity<List<ChatHistory>> getChatHistory(@RequestParam("ct_id") Integer ctId) {
        System.out.println("chat topic id: " + ctId);
        List<ChatHistory> chatHistory = chRepository.getChatHistoryByChatTopicId(ctId);

        System.out.println("ChatHistory: " + chatHistory);

        return ResponseEntity.ok(chatHistory);
    }
}