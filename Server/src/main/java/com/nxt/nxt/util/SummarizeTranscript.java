package com.nxt.nxt.util;

import com.nxt.nxt.service.OpenAIService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.List;
import java.net.HttpURLConnection;
import java.net.URL;
import java.io.OutputStream;
import java.io.InputStreamReader;
import java.io.BufferedReader;
import java.nio.charset.StandardCharsets;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

@Component
public class SummarizeTranscript {

    @Value("${youtube.transcript.api.key}")
    private String supaDataApiKey;

    private final OpenAIService openAIService;

    @Autowired
    public SummarizeTranscript(OpenAIService openAIService) {
        this.openAIService = openAIService;
    }

    /**
     * Gets the transcript from a YouTube video URL.
     * Returns the transcript as a single string.
     */
    public String getYoutubeTranscript(String videoUrl) {
        try {
            String apiUrl = "https://api.supadata.ai/v1/transcript?url=" + java.net.URLEncoder.encode(videoUrl, java.nio.charset.StandardCharsets.UTF_8);
            URL url = new URL(apiUrl);
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("GET");
            conn.setRequestProperty("x-api-key", supaDataApiKey);

            int code = conn.getResponseCode();
            if (code != 200) {
                throw new RuntimeException("Failed to fetch transcript: HTTP " + code);
            }

            StringBuilder response = new StringBuilder();
            try (BufferedReader br = new BufferedReader(
                    new InputStreamReader(conn.getInputStream(), StandardCharsets.UTF_8))) {
                String line;
                while ((line = br.readLine()) != null) {
                    response.append(line);
                }
            }

            ObjectMapper mapper = new ObjectMapper();
            JsonNode root = mapper.readTree(response.toString());
            JsonNode contentArray = root.get("content");
            
            if (contentArray == null || !contentArray.isArray() || contentArray.size() == 0) return "";

            StringBuilder transcriptText = new StringBuilder();
            for (JsonNode item : contentArray) {
                JsonNode textNode = item.get("text");
                if (textNode != null && !textNode.isNull()) {
                    transcriptText.append(textNode.asText()).append(" ");
                }
            }

            return transcriptText.toString().trim();
        } catch (Exception e) {
            System.out.println("Error fetching transcript: " + e.getMessage());
            return "";
        }
    }

    /**
     * Summarizes the transcript using OpenAI.
     */
    public String summarizeTranscript(String transcript) {
        String prompt = "Summarize the following transcript in clear, concise bullet points for a high school student:\n\n" + transcript;
        
        return openAIService.getChatCompletion(prompt);
    }

    /**
     * Utility to extract video ID from YouTube URL.
     */
    private String extractVideoId(String url) {
        // Simple extraction for common YouTube URL formats
        try {
            if (url.contains("youtube.com")) {
                int idx = url.indexOf("v=");

                if (idx != -1) {
                    String id = url.substring(idx + 2);
                    int amp = id.indexOf('&');

                    return amp != -1 ? id.substring(0, amp) : id;
                }
            }
            else if (url.contains("youtu.be/")) {
                int idx = url.indexOf("youtu.be/");
                String id = url.substring(idx + 9);
                int q = id.indexOf('?');

                return q != -1 ? id.substring(0, q) : id;
            }
        } catch (Exception e) {
            // Ignore and return null
        }
        return null;
    }
}
