package com.nxt.nxt.util;

import static io.qdrant.client.PointIdFactory.id;
import static io.qdrant.client.VectorFactory.vector;
import static io.qdrant.client.VectorsFactory.namedVectors;

import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;
import io.qdrant.client.grpc.Points.PointStruct;
import jakarta.annotation.PostConstruct;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class VectorDB {

    private QdrantClient client;

    @Value("${qdrant.api.url}")
    private String qdrantApiUrl;

    @Value("${qdrant.api.key}")
    private String qdrantApiKey;

    @Value("${qdrant.api.port}")
    private int qdrantPort;

    @Value("${qdrant.api.tls}")
    private boolean useTls;

    private String collectionName = "nexara_text_data";

    @PostConstruct
    public void initClient() {
        try {
            System.out.println("Initializing Qdrant client with URL: " + qdrantApiUrl);
            
            QdrantGrpcClient.Builder builder = QdrantGrpcClient.newBuilder(
                    qdrantApiUrl, 
                    qdrantPort,
                    useTls);
            
            if (qdrantApiKey != null && !qdrantApiKey.trim().isEmpty()) {
                builder.withApiKey(qdrantApiKey);
                System.out.println("Using API key for authentication");
            }
            
            this.client = new QdrantClient(builder.build());
            System.out.println("Qdrant client initialized successfully");
            
        }
        catch (Exception e) {
            System.err.println("Failed to initialize Qdrant client: " + e.getMessage());
            e.printStackTrace();
        }
    }

    public void upsertData(Long pointId, List<Double> vector) {
        try {

            List<Float> floatVector = vector.stream()
                    .map(Double::floatValue)
                    .toList();
            
            var response = client.upsertAsync(
                    collectionName,
                    List.of(
                        PointStruct.newBuilder()
                            .setId(id(pointId))
                            .setVectors(
                                    namedVectors(
                                        Map.of("text",
                                            vector(floatVector)
                                        )
                                    )
                                )
                            .build()
                        )
                    )
                    .get();

            System.out.println("Upsert response: " + response);
        }
        catch (Exception e) {
            System.out.println("Error during upsert: " + e.getMessage());
        }
    }

    
}
