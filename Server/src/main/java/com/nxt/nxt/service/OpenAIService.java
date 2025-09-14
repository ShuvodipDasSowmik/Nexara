package com.nxt.nxt.service;

import java.time.Duration;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.theokanning.openai.completion.chat.ChatCompletionRequest;
import com.theokanning.openai.completion.chat.ChatMessage;
import com.theokanning.openai.service.OpenAiService;

@Service
public class OpenAIService {

    @Value("${openai.api.key}")
    private String apiKey;

    public String getChatCompletion(String prompt) {
        return getChatCompletion(prompt, false);
    }
    
    public String getExamGeneration(String prompt) {
        return getChatCompletion(prompt, true);
    }
    
    private String getChatCompletion(String prompt, boolean isExamGeneration) {
        // Set a timeout of 30 seconds for OpenAI requests
        OpenAiService service = new OpenAiService(apiKey, Duration.ofSeconds(30));

        ChatMessage systemMessage;
        if (isExamGeneration) {
            // System message specifically for exam generation
            systemMessage = new ChatMessage("system",
                "You are an AI assistant specialized in generating educational exam questions. " +
                "Your task is to create well-structured questions based on the given topic and requirements. " +
                "Always follow the exact format and count specifications provided in the user prompt. " +
                "Return only valid JSON arrays as requested, with no additional text or explanation. " +
                "Ensure questions are educationally sound and test comprehension of the given topic.");
        } else {
            // Hardcoded system message describing Nexara's role for general chat
            systemMessage = new ChatMessage("system",
                "You are Nexara, an education-related chat assistant. You help students learn and explore more." +
                "Always respond in a friendly and encouraging manner." + 
                "Never make up answers or stories. If you don't know something, just say you don't know." +
                "Focus on providing clear, step-by-step explanations suitable for high school students." + 
                "If you are unsure about an answer, admit it and suggest ways to find out more. But if it's provided in the system prompt, you can use it." + 
                "Never provide medical, legal, or personal advice.");
        }

        ChatMessage userMessage = new ChatMessage("user", prompt);

        ChatCompletionRequest request = ChatCompletionRequest.builder()
                .model("gpt-4o-mini")
                .messages(java.util.Arrays.asList(systemMessage, userMessage))
                .maxTokens(isExamGeneration ? 2000 : 1000)  // More tokens for exam generation
                .temperature(0.7)  // Add some creativity but keep it controlled
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
            ex.printStackTrace();
            // Return a friendly error message for the user
            return "Sorry, I couldn't process your request due to a technical issue. Please try again later.";
        }
    }
}
