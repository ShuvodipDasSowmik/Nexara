package com.nxt.nxt.util;

import com.cohere.api.Cohere;
import com.cohere.api.resources.v2.requests.V2EmbedRequest;
import com.cohere.api.types.EmbedByTypeResponse;
import com.cohere.api.types.EmbedInputType;
import com.cohere.api.types.EmbeddingType;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

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
            System.err.println("Error calling Cohere API: " + e.getMessage());
            e.printStackTrace();

            return new ArrayList<>();
        }
    }
}