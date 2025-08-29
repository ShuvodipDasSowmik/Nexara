package com.nxt.nxt.service;

import com.theokanning.openai.service.OpenAiService;
import com.theokanning.openai.completion.chat.ChatCompletionRequest;
import com.theokanning.openai.completion.chat.ChatMessage;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Duration;

@Service
public class OpenAIService {

    @Value("${openai.api.key}")
    private String apiKey;

    public String getChatCompletion(String prompt) {
        // Set a timeout of 30 seconds for OpenAI requests
        OpenAiService service = new OpenAiService(apiKey, Duration.ofSeconds(30));

        // Hardcoded system message describing Nexara's role
        ChatMessage systemMessage = new ChatMessage("system",
            "You are Nexara, an education-related chat assistant. You help students learn and explore more." + "Always respond in a friendly and encouraging manner." + "Focus on providing clear, step-by-step explanations suitable for high school students." + "If you are unsure about an answer, admit it and suggest ways to find out more." + "Never provide medical, legal, or personal advice.");

        ChatMessage userMessage = new ChatMessage("user", prompt);

        ChatCompletionRequest request = ChatCompletionRequest.builder()
                .model("gpt-4o-mini")
                .messages(java.util.Arrays.asList(systemMessage, userMessage))
                .maxTokens(1000)
                .build();

        try {
            String response = service.createChatCompletion(request)
                    .getChoices()
                    .get(0)
                    .getMessage()
                    .getContent();

            System.out.println("OpenAI response: " + response);
            return response;
        }
        catch (Exception ex) {
            System.out.println("OpenAIService error: " + ex.getMessage());
            // Return a friendly error message for the user
            return "Sorry, I couldn't process your request due to a technical issue. Please try again later.";
        }
    }
}
