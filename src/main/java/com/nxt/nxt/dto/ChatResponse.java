package com.nxt.nxt.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.util.List;

// Ignores any JSON fields that are not defined in this class
// If ignnored, it will not throw an error for unknown fields in the JSON response

@JsonIgnoreProperties(ignoreUnknown = true)
public class ChatResponse {

    // Maps to the "choices" field in the JSON response
    private List<Choice> choices;

    public List<Choice> getChoices() {
        return choices;
    }

    public void setChoices(List<Choice> choices) {
        this.choices = choices;
    }

    // Inner class to represent each choice in the response
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Choice {
        private Message message;

        public Message getMessage() {
            return message;
        }

        public void setMessage(Message message) {
            this.message = message;
        }

        // Message class nested inside Choice since it's only used here
        @JsonIgnoreProperties(ignoreUnknown = true)
        public static class Message {
            private String content;

            public String getContent() {
                return content;
            }

            public void setContent(String content) {
                this.content = content;
            }
        }
    }
}