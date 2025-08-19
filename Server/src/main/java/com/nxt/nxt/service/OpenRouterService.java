package com.nxt.nxt.service;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import com.nxt.nxt.dto.ChatResponse;

@Service
public class OpenRouterService {
    @Value("${api.deepseek.key}")
    private String apiKey;

    @Value("${api.openrouter.chat_url}")
    private String chatUrl;

    private final WebClient webClient = WebClient.builder().build();

    public ChatResponse callOpenRouter(String prompt, String model) {
        Map<String, Object> data = Map.of(
            "model", model,
            "messages", List.of(Map.of("role", "user", "content", prompt))
        );

        return webClient.post()
            .uri(chatUrl)
            .header("Authorization", "Bearer " + apiKey)
            .contentType(MediaType.APPLICATION_JSON)
            .bodyValue(data)
            .retrieve()
            .bodyToMono(ChatResponse.class)
            .block();
    }
}
