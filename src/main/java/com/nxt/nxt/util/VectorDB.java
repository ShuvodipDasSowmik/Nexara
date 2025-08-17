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

    private String collectionName = "nexara_pdf_data";

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

        } catch (Exception e) {
            System.err.println("Failed to initialize Qdrant client: " + e.getMessage());
            e.printStackTrace();
        }
    }

    public void upsertData(Long pointId, List<Double> vector, String text, String username) {
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
                                                            vector(floatVector))))
                                    .putAllPayload(Map.of(
                                            "text", io.qdrant.client.ValueFactory.value(text),
                                            "username", io.qdrant.client.ValueFactory.value(username)))
                                    .build()))
                    .get();

            System.out.println("Upsert response: " + response);
        } catch (Exception e) {
            System.out.println("Error during upsert: " + e.getMessage());
        }
    }

    public List<String> getSimilarTexts(List<Double> queryVector, int k) {
        try {
            List<Float> floatVector = queryVector.stream()
                    .map(Double::floatValue)
                    .toList();

            SearchPoints searchRequest = SearchPoints.newBuilder()
                    .setCollectionName(collectionName)
                    .setVectorName("text")
                    .addAllVector(floatVector)
                    .setLimit(k)
                    .setWithPayload(WithPayloadSelector.newBuilder().setEnable(true).build())
                    .build();

            var searchResponse = client.searchAsync(searchRequest).get();

            List<String> similarTexts = new ArrayList<>();
            for (ScoredPoint point : searchResponse) {
                if (point.getPayloadMap().containsKey("text")) {
                    String text = point.getPayloadMap().get("text").getStringValue();
                    similarTexts.add(text);
                }
            }

            return similarTexts;
        } catch (Exception e) {
            System.out.println("Error during search: " + e.getMessage());
            e.printStackTrace();
            return new ArrayList<>();
        }
    }

    public List<String> getSimilarTextsForUser(List<Double> queryVector, String username, int k) {
        try {
            // convert List<Double> -> List<Float>
            List<Float> floatList = queryVector.stream()
                    .map(Double::floatValue)
                    .toList();

            // Use SearchPoints (like getSimilarTexts) and apply a filter for username.
            SearchPoints searchRequest = SearchPoints.newBuilder()
                    .setCollectionName(collectionName)
                    .setVectorName("text")
                    .addAllVector(floatList)
                    .setFilter(Filter.newBuilder()
                            .addMust(matchKeyword("username", username))
                            .build())
                    .setParams(SearchParams.newBuilder().setExact(false).setHnswEf(128).build())
                    .setLimit(k)
                    .setWithPayload(WithPayloadSelector.newBuilder().setEnable(true).build())
                    .build();

            var searchResponse = client.searchAsync(searchRequest).get();

            List<String> similarTexts = new ArrayList<>();
            for (ScoredPoint point : searchResponse) {
                if (point.getPayloadMap().containsKey("text")) {
                    String text = point.getPayloadMap().get("text").getStringValue();
                    similarTexts.add(text);
                }
            }

            return similarTexts;
        } catch (Exception e) {
            System.out.println("Error during user-filtered search: " + e.getMessage());
            e.printStackTrace();
            return new ArrayList<>();
        }
    }

}