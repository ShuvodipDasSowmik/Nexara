package com.nxt.nxt.util;

import java.util.List;

public class PostRankScorer {
    double likeCoefficient = 0.3;
    double commentCoefficient = 0.7;

    double timeCoefficient = 0.01;
    
    double similarityCoefficient = 0.8;
    double recencyCoefficient = 0.195;
    double engagementCoefficient = 0.00005;

    public double engagementScore(int likes, int comments){
        return (likes * likeCoefficient) + (comments * commentCoefficient);
    }

    public double recencyScore(int postAgeInHours){
        return Math.exp(-timeCoefficient * postAgeInHours);
    }

    public double similarityScore(List<Double> postVector, List<Double> userVector){
        double score = 0;
        double normA = 0;
        double normB = 0;

        for (int i = 0; i < postVector.size(); i++) {
            score += postVector.get(i) * userVector.get(i);
            normA += Math.pow(postVector.get(i), 2);
            normB += Math.pow(userVector.get(i), 2);
        }

        normA = Math.sqrt(normA);
        normB = Math.sqrt(normB);
        
        if (normA != 0 && normB != 0) {
            score /= (normA * normB);
        }

        return score;
    }

    public double overallScore(int likes, int comments, int postAgeInHours, List<Double> postVector, List<Double> userVector) {
        double engagement = engagementScore(likes, comments);
        double recency = recencyScore(postAgeInHours);
        double similarity = similarityScore(postVector, userVector);

        double score = (engagement * engagementCoefficient) + (recency * recencyCoefficient) + (similarity * similarityCoefficient);

        System.out.println("\nEngagement Score: " + engagement + "\nRecency Score: " + recency + "\nSimilarity Score: " + similarity + "\nOverall score: " + score);

        return score;
    }

}
