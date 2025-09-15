package com.nxt.nxt.util;

import java.util.ArrayList;
import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import com.cohere.api.Cohere;
import com.cohere.api.resources.v2.requests.V2EmbedRequest;
import com.cohere.api.types.EmbedByTypeResponse;
import com.cohere.api.types.EmbedInputType;
import com.cohere.api.types.EmbeddingType;

@Component
public class EmbeddingAPI {

    @Value("${cohere.api.key}")
    private String cohereApiKey;

    public List<Double> getTextEmbedding(String text) {
        try {
            Cohere cohere = Cohere.builder()
                    .token(cohereApiKey)
                    .clientName("Nexara")
                    .build();

            System.out.println("Generating embedding for text length: " + text.length());

            V2EmbedRequest request = V2EmbedRequest.builder()
                    .model("embed-english-v3.0")
                    .inputType(EmbedInputType.SEARCH_DOCUMENT)
                    .texts(List.of(text))
                    .embeddingTypes(List.of(EmbeddingType.FLOAT))
                    .build();

            EmbedByTypeResponse response = cohere.v2().embed(request);

            if (response != null && 
                response.getEmbeddings() != null && 
                response.getEmbeddings().getFloat().isPresent() &&
                !response.getEmbeddings().getFloat().get().isEmpty()) {
                
                return response.getEmbeddings().getFloat().get().get(0);
            }
            
            else {
                System.err.println("Invalid response from Cohere API");
                return new ArrayList<>();
            }
            
        }
        
        catch (Exception e) {
            String errorMsg = e.getMessage();
            
            // Handle specific rate limit errors more gracefully
            if (errorMsg != null && errorMsg.contains("TooManyRequestsError")) {
                System.err.println("Cohere API rate limit exceeded - Trial key limit reached (1000 calls/month)");
                System.err.println("Consider upgrading to Production key at https://dashboard.cohere.com/api-keys");
            } else if (errorMsg != null && errorMsg.contains("429")) {
                System.err.println("Cohere API rate limit exceeded");
            } else {
                System.err.println("Error calling Cohere API: " + errorMsg);
            }

            return new ArrayList<>();
        }
    }
}