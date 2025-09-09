package com.nxt.nxt.util;

import static io.qdrant.client.PointIdFactory.id;
import static io.qdrant.client.VectorFactory.vector;
import static io.qdrant.client.VectorsFactory.namedVectors;
import static io.qdrant.client.ConditionFactory.matchKeyword;
import static io.qdrant.client.QueryFactory.nearest;

import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;
import io.qdrant.client.grpc.Points.PointStruct;
import io.qdrant.client.grpc.Points.SearchPoints;
import io.qdrant.client.grpc.Points.ScoredPoint;
import io.qdrant.client.grpc.Points.WithPayloadSelector;
import io.qdrant.client.grpc.Points.Filter;
import io.qdrant.client.grpc.Points.QueryPoints;
import io.qdrant.client.grpc.Points.SearchParams;
import jakarta.annotation.PostConstruct;

import java.util.ArrayList;
import java.util.HashMap;
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

    private String collectionName = "nexara";

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

    /**
     * Upsert data with username and one keyword (text, post, chat, pdfdata).
     * Always insert the data in "text", and set the keyword for that TRUE.
     */
    public void upsertData(Long pointId, List<Double> vector, String keyword, String keywordValue, String username) {
        try {
            List<Float> floatVector = vector.stream()
                    .map(Double::floatValue)
                    .toList();

            Map<String, io.qdrant.client.grpc.JsonWithInt.Value> payload = new HashMap<>();
            payload.put("username", io.qdrant.client.ValueFactory.value(username));
            payload.put("text", io.qdrant.client.ValueFactory.value(keywordValue));
            payload.put(keyword, io.qdrant.client.ValueFactory.value("TRUE"));

            var response = client.upsertAsync(
                    collectionName,
                    List.of(
                            PointStruct.newBuilder()
                                    .setId(id(pointId))
                                    .setVectors(
                                            namedVectors(
                                                    Map.of("text",
                                                            vector(floatVector))))
                                    .putAllPayload(payload)
                                    .build()))
                    .get();

            System.out.println("Upsert response: " + response);
        }
        catch (Exception e) {
            System.out.println("Error during upsert: " + e.getMessage());
        }
    }

    /**
     * General upsert function: insert with username and any combination of other keywords.
     * Always insert the data in "text", and set each keyword to TRUE.
     */
    public void upsertWithKeywords(Long pointId, List<Double> vector, String username, Map<String, String> keywordPayload) {
        try {
            List<Float> floatVector = vector.stream()
                    .map(Double::floatValue)
                    .toList();

            Map<String, io.qdrant.client.grpc.JsonWithInt.Value> payload = new HashMap<>();
            payload.put("username", io.qdrant.client.ValueFactory.value(username));
            // Always insert content in "text"
            if (keywordPayload.containsKey("text")) {
                String textValue = keywordPayload.get("text");
                System.out.println("VectorDB upsertWithKeywords: text=" + textValue);
                payload.put("text", io.qdrant.client.ValueFactory.value(textValue));
            }
            // Set keywords to TRUE or blank only
            for (String key : keywordPayload.keySet()) {
                if (!key.equals("text")) {
                    String value = keywordPayload.get(key);
                    payload.put(key, io.qdrant.client.ValueFactory.value(
                        "TRUE".equalsIgnoreCase(value) ? "TRUE" : ""
                    ));
                }
            }

            var response = client.upsertAsync(
                    collectionName,
                    List.of(
                            PointStruct.newBuilder()
                                    .setId(id(pointId))
                                    .setVectors(
                                            namedVectors(
                                                    Map.of("text",
                                                            vector(floatVector))))
                                    .putAllPayload(payload)
                                    .build()))
                    .get();

            System.out.println("General upsert response: " + response);
        }
        catch (Exception e) {
            System.out.println("Error during general upsert: " + e.getMessage());
        }
    }

    /**
     * Search for similar items by keyword and username.
     * Only search for similarity in "text" where keyword is TRUE.
     */
    public List<String> getSimilar(List<Double> queryVector, String username, String keyword, int k) {
        try {
            List<Float> floatVector = queryVector.stream()
                    .map(Double::floatValue)
                    .toList();

            // Only filter by username and keyword (never "text")
            if ("text".equals(keyword)) {
                throw new IllegalArgumentException("Do not use 'text' as a filter keyword. Use a domain keyword like 'chat' or 'pdfdata'.");
            }

            SearchPoints searchRequest = SearchPoints.newBuilder()
                    .setCollectionName(collectionName)
                    .setVectorName("text")
                    .addAllVector(floatVector)
                    .setFilter(Filter.newBuilder()
                            .addMust(matchKeyword("username", username))
                            .addMust(matchKeyword(keyword, "TRUE"))
                            .build())
                    .setLimit(k)
                    .setWithPayload(WithPayloadSelector.newBuilder().setEnable(true).build())
                    .build();

            var searchResponse = client.searchAsync(searchRequest).get();

            List<String> results = new ArrayList<>();

            // Iterate directly over searchResponse
            for (ScoredPoint point : searchResponse) {
                if (point.getPayloadMap().containsKey("text")) {
                    String value = point.getPayloadMap().get("text").getStringValue();
                    results.add(value);
                }
            }

            return results;
        }
        catch (Exception e) {
            System.out.println("Error during keyword+user search: " + e.getMessage());
            return new ArrayList<>();
        }
    }

    /**
     * Search for similar items by keyword only (no username filtering).
     * Only search for similarity in "text" where keyword is TRUE.
     */
    public List<String> getSimilarByKeyword(List<Double> queryVector, String keyword, int k) {
        try {
            List<Float> floatVector = queryVector.stream()
                    .map(Double::floatValue)
                    .toList();

            // Only filter by keyword (never "text")
            if ("text".equals(keyword)) {
                throw new IllegalArgumentException("Do not use 'text' as a filter keyword. Use a domain keyword like 'chat' or 'pdfdata'.");
            }

            SearchPoints searchRequest = SearchPoints.newBuilder()
                    .setCollectionName(collectionName)
                    .setVectorName("text")
                    .addAllVector(floatVector)
                    .setFilter(Filter.newBuilder()
                            .addMust(matchKeyword(keyword, "TRUE"))
                            .build())
                    .setLimit(k)
                    .setWithPayload(WithPayloadSelector.newBuilder().setEnable(true).build())
                    .build();

            var searchResponse = client.searchAsync(searchRequest).get();

            List<String> results = new ArrayList<>();

            // Iterate directly over searchResponse
            for (ScoredPoint point : searchResponse) {
                if (point.getPayloadMap().containsKey("text")) {
                    String value = point.getPayloadMap().get("text").getStringValue();
                    results.add(value);
                }
            }

            return results;
        }
        catch (Exception e) {
            System.out.println("Error during keyword-only search: " + e.getMessage());
            return new ArrayList<>();
        }
    }

}