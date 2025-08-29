package com.nxt.nxt.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;

import com.nxt.nxt.service.OpenAIService;
import com.nxt.nxt.repositories.ChatHistoryRepository;
import com.nxt.nxt.entity.ChatHistory;

import java.util.List;

@RestController
@RequestMapping("/api/openai")
public class OpenAIController {

    @Autowired
    private OpenAIService openAIService;

    @Autowired
    private ChatHistoryRepository chatHistoryRepository;

    // Accept ct_id and length as request params
    @GetMapping("/summarize")
    @ResponseBody
    public String summarize(@RequestParam("ct_id") Integer ct_id,
                            @RequestParam(value = "length", defaultValue = "moderate") String length) {
        // Fetch chat history for the given ct_id
        List<ChatHistory> history = chatHistoryRepository.getChatHistoryByChatTopicId(ct_id);

        // Build prompt from chat history
        StringBuilder prompt = new StringBuilder();
        for (ChatHistory ch : history) {
            prompt.append("User: ").append(ch.getUser_msg()).append("\n");
            prompt.append("AI: ").append(ch.getApi_response()).append("\n");
        }

        // Customize summary instruction based on length
        String summaryInstruction;
        switch (length.toLowerCase()) {
            case "short":
                summaryInstruction = "Summarize AI Responses in Maximum 5 short sentences. Make sure to focus on key points, formulas, resources and important concepts. Use Bullet points.";
                break;
            case "detailed":
                summaryInstruction = "Summarize AI Responses in a minimum 60 and maximum 80 sentences. Make sure to focus on key points, formulas, resources and important concepts. Explain the key points and important points a bit in detail. If there are too many key concepts, prioritize the most important ones, short notes on less important ones. Use Bullet points, headings etc. properly.";
                break;
            case "moderate":
            default:
                summaryInstruction = "Summarize AI Responses in a minimum 10 to maximum 15 sentences. Make sure to focus on key points, formulas, resources and important concepts. Use Headings and bullet points wherever applicable.";
                break;
        }

        summaryInstruction += "\nDon't use any System messages like Sure! Here’s a concise summary of the chat history, or Let me know if I can Help you with anything else.";

        prompt.append("\n").append(summaryInstruction);

        // Get summary from OpenAI
        return openAIService.getChatCompletion(prompt.toString());
    }
}

