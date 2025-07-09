package com.nxt.nxt.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.reactive.function.client.WebClient;

import com.nxt.nxt.dto.ChatResponse;

import reactor.core.publisher.Mono;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/llm")
public class LLMRouter {
    @Value("${api.deepseek.key}")
    String apiKey;

    @Value("${api.openrouter.chat_url}")
    String URL;

    private final WebClient webClient = WebClient.builder().build();

    @PostMapping("/chat")
    public Mono<Map<String, String>> chatCompletion(@RequestBody Map<String, Object> requestBody) {

        Map<String, Object> data = Map.of(
            "model", "deepseek/deepseek-chat-v3-0324:free",
            "messages", List.of(
                Map.of(
                    "role", "user",
                    "content", requestBody.getOrDefault("message", "Hello")
                )
            )
        );

        return webClient.post()
            .uri(URL)
            .header("Authorization", "Bearer " + apiKey)
            .contentType(MediaType.APPLICATION_JSON)
            .bodyValue(data)
            .retrieve()
            .bodyToMono(ChatResponse.class)
            .map(response -> {
                Map<String, String> result = new HashMap<>();
                result.put("message", response.getChoices().get(0).getMessage().getContent());
                return result;
            });
    }
}