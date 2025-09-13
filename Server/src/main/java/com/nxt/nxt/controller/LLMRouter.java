package com.nxt.nxt.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.nxt.nxt.entity.ChatHistory;
import com.nxt.nxt.entity.ChatTopic;
import com.nxt.nxt.repositories.ChatHistoryRepository;
import com.nxt.nxt.repositories.ChatTopicRepository;
import com.nxt.nxt.service.OpenAIService;
import com.nxt.nxt.util.EmbeddingAPI;
import com.nxt.nxt.util.VectorDB;

@RestController
@RequestMapping("/api/llm")
public class LLMRouter {

    ChatTopicRepository ctRepository;
    ChatHistoryRepository chRepository;
    private final EmbeddingAPI embeddingAPI;
    private final VectorDB vectorDB;
    private final OpenAIService openAIService;

    @Autowired
    public LLMRouter(ChatTopicRepository ctRepository,
                     ChatHistoryRepository chRepository,
                     EmbeddingAPI embeddingAPI,
                     VectorDB vectorDB,
                     OpenAIService openAIService) {
        this.ctRepository = ctRepository;
        this.chRepository = chRepository;
        this.embeddingAPI = embeddingAPI;
        this.vectorDB = vectorDB;
        this.openAIService = openAIService;
    }

    @PostMapping("/chat")
    public ResponseEntity<Map<String, String>> chatCompletion(@RequestBody Map<String, Object> requestBody) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth.getName();

        int chatTopicId = Integer.MIN_VALUE;

        if(requestBody.get("ct_id") == null) {
            chatTopicId = logChatTopic(username, requestBody.getOrDefault("message", "").toString());
        }
        else{
            chatTopicId = Integer.parseInt(requestBody.get("ct_id").toString());
        }

        String userMessage = requestBody.getOrDefault("message", "Hello").toString();

        Map<String, String> result = new HashMap<>();
        try {
            String msg = openAIService.getChatCompletion(userMessage);
            result.put("message", msg);

            if(chatTopicId != Integer.MIN_VALUE) {
                result.put("ct_id", Integer.toString(chatTopicId));
            }

            if(chatTopicId != Integer.MIN_VALUE && !msg.isEmpty()) {
                logChatHistory(username, chatTopicId, userMessage, msg);
            }

            // Insert combined user message and response into VectorDB with "chat" as payload keyword
            try {
                long timestamp = System.currentTimeMillis();
                String combinedText = "Request Msg: " + userMessage + "\nResponse Msg: " + msg;

                List<Double> combinedEmbedding = embeddingAPI.getTextEmbedding(combinedText);

                Map<String, String> combinedPayload = new HashMap<>();
                combinedPayload.put("chat", "TRUE");
                combinedPayload.put("text", combinedText);

                vectorDB.upsertWithKeywords(timestamp, combinedEmbedding, username, combinedPayload);
            }
            catch (Exception ex) {
                System.out.println("Error inserting chat texts into VectorDB: " + ex.getMessage());
                ex.printStackTrace();
            }
        } catch (Exception e) {
            System.out.println("Server error in /chat endpoint:");
            e.printStackTrace();
            System.out.println("Request body: " + requestBody);
            result.put("error", "Server error: " + e.getMessage());
            return ResponseEntity.status(500).body(result);
        }

        return ResponseEntity.ok(result);
    }


    // ------------ LOGS CHAT TOPIC AND RETURNS ID ----------------

    public int logChatTopic(String username, String message) {
        System.out.println("Received request for chat: " + message);

        // Use OpenAI to generate topic name
        String topicPrompt = "Give This message a topic name in max 3 words in plain string, No punctuation or Quotation Mark, But ensure Capitalization for Each word: " + message;
        String topic = openAIService.getChatCompletion(topicPrompt);

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

    // New: context-aware chat endpoint
    @PostMapping("/context-aware-chat")
    public ResponseEntity<Map<String, String>> contextAwareChat(@RequestBody Map<String, Object> requestBody) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth.getName();

        String userMessage = requestBody.getOrDefault("message", "").toString();

        int chatTopicId = Integer.MIN_VALUE;

        if (requestBody.get("ct_id") == null) {
            chatTopicId = logChatTopic(username, userMessage);
        }
        else {
            chatTopicId = Integer.parseInt(requestBody.get("ct_id").toString());
        }

        Map<String, String> result = new HashMap<>();
        try {
            List<Double> embedding = embeddingAPI.getTextEmbedding(userMessage);

            // Always search for both "chat" and "pdfdata" similarity
            List<String> chatContexts = vectorDB.getSimilar(embedding, username, "chat", 2);
            List<String> pdfContexts = vectorDB.getSimilar(embedding, username, "pdfdata", 2);

            StringBuilder contextBuilder = new StringBuilder();
            int idx = 1;
            if (chatContexts != null && !chatContexts.isEmpty()) {
                contextBuilder.append("Contextual excerpts from your chat history:\n");
                for (String ctx : chatContexts) {
                    contextBuilder.append("Chat Excerpt ").append(idx++).append(": ").append(ctx).append("\n\n");
                }
            }
            idx = 1;
            if (pdfContexts != null && !pdfContexts.isEmpty()) {
                contextBuilder.append("Contextual excerpts from your PDF documents:\n");
                for (String ctx : pdfContexts) {
                    contextBuilder.append("PDF Excerpt ").append(idx++).append(": ").append(ctx).append("\n\n");
                }
            }

            String systemContent = contextBuilder.length() > 0
                    ? contextBuilder.toString()
                    : "No additional context available.";

            // Compose prompt with context and user message
            String prompt = systemContent + "\nUser Message: " + userMessage;
            String msg = openAIService.getChatCompletion(prompt);

            result.put("message", msg);

            if (chatTopicId != Integer.MIN_VALUE) {
                result.put("ct_id", Integer.toString(chatTopicId));
            }

            if (chatTopicId != Integer.MIN_VALUE && !msg.isEmpty()) {
                logChatHistory(username, chatTopicId, userMessage, msg);
            }

            // Insert combined user message and response into VectorDB with "chat" keyword
            try {
                long timestamp = System.currentTimeMillis();
                String combinedText = "Request Msg: " + userMessage + "\nResponse Msg: " + msg;

                List<Double> combinedEmbedding = embeddingAPI.getTextEmbedding(combinedText);

                Map<String, String> combinedPayload = new HashMap<>();
                combinedPayload.put("chat", "TRUE");
                combinedPayload.put("text", combinedText);

                vectorDB.upsertWithKeywords(timestamp, combinedEmbedding, username, combinedPayload);
            }
            catch (Exception ex) {
                System.out.println("Error inserting chat texts into VectorDB: " + ex.getMessage());
                ex.printStackTrace();
            }
        }
        catch (Exception e) {
            System.out.println("Server error in /context-aware-chat endpoint:");
            e.printStackTrace();
            System.out.println("Request body: " + requestBody);
            result.put("error", "Server error: " + e.getMessage());
            return ResponseEntity.status(500).body(result);
        }

        return ResponseEntity.ok(result);
    }
}