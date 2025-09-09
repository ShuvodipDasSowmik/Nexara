
package com.nxt.nxt.controller;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.nxt.nxt.entity.PdfData;
import com.nxt.nxt.entity.Post;
import com.nxt.nxt.entity.Student;
import com.nxt.nxt.repositories.ChatHistoryRepository;
import com.nxt.nxt.repositories.PDFDataRepository;
import com.nxt.nxt.repositories.PostRepository;
import com.nxt.nxt.repositories.PostVoteRepository;
import com.nxt.nxt.repositories.CommentRepository;
import com.nxt.nxt.repositories.StudentBestScoreRepository;
import com.nxt.nxt.repositories.StudentRepository;
import com.nxt.nxt.util.EmbeddingAPI;
import com.nxt.nxt.util.VectorDB;
import com.nxt.nxt.util.PostRankScorer;


@RestController
@RequestMapping("/api/users")
public class UserController {

    private final StudentRepository studentRepo;
    private final PDFDataRepository pdfDataRepo;
    private final StudentBestScoreRepository studentBestScoreRepo;
    // private final ChatHistoryRepository chatHistoryRepo; // For future use
    private final PostRepository postRepo;
    private final PostVoteRepository postVoteRepo;
    private final CommentRepository commentRepo;

    @Autowired
    private EmbeddingAPI embeddingAPI;

    @Autowired
    private VectorDB vectorDB;

    public UserController(StudentRepository studentRepo, PDFDataRepository pdfDataRepo, 
                         StudentBestScoreRepository studentBestScoreRepo, ChatHistoryRepository chatHistoryRepo,
                         PostRepository postRepo, PostVoteRepository postVoteRepo, CommentRepository commentRepo) {
        this.studentRepo = studentRepo;
        this.pdfDataRepo = pdfDataRepo;
        this.studentBestScoreRepo = studentBestScoreRepo;
        // this.chatHistoryRepo = chatHistoryRepo; // For future use
        this.postRepo = postRepo;
        this.postVoteRepo = postVoteRepo;
        this.commentRepo = commentRepo;
    }

    // DTO for personalized post result
    public static class PersonalizedPostResult {
        private final Post post;
        private final String studentName;
        private final double score;
        private final int voteCount;
        private final int commentCount;

        public PersonalizedPostResult(Post post, String studentName, double score, int voteCount, int commentCount) {
            this.post = post;
            this.studentName = studentName;
            this.score = score;
            this.voteCount = voteCount;
            this.commentCount = commentCount;
        }

        public Post getPost() { return post; }
        public String getStudentName() { return studentName; }
        public double getScore() { return score; }
        public int getVoteCount() { return voteCount; }
        public int getCommentCount() { return commentCount; }
    }

    @GetMapping("/personalized-posts")
    public ResponseEntity<List<PersonalizedPostResult>> getPersonalizedPosts() {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String username = auth.getName();

            System.out.println("Getting personalized posts for user: " + username);

            // Create dummy vector for getting all entries by keyword (Cohere embed-english-v3.0 is 1024-dimensional)
            List<Double> dummyVector = new ArrayList<>();
            for (int i = 0; i < 1024; i++) {
                dummyVector.add(0.0);
            }

            // Step 1: Get all user's data from VectorDB and calculate average embedding
            List<String> userPostTexts = vectorDB.getSimilar(dummyVector, username, "post", 1000);
            List<String> userPdfTexts = vectorDB.getSimilar(dummyVector, username, "pdfdata", 1000);
            List<String> userChatTexts = vectorDB.getSimilar(dummyVector, username, "chat", 1000);

            List<String> allUserTexts = new ArrayList<>();
            allUserTexts.addAll(userPostTexts);
            allUserTexts.addAll(userPdfTexts);
            allUserTexts.addAll(userChatTexts);

            if (allUserTexts.isEmpty()) {
                System.out.println("No user data found in VectorDB for user: " + username);
                return ResponseEntity.ok(new ArrayList<>());
            }

            // Calculate average embedding from all user's data
            List<Double> userAverageEmbedding = calculateAverageEmbedding(allUserTexts);

            if (userAverageEmbedding.isEmpty()) {
                System.out.println("Failed to calculate average embedding for user: " + username);
                return ResponseEntity.ok(new ArrayList<>());
            }

            // Step 2: Get all posts from VectorDB with "post" = TRUE
            List<String> allPostTexts = vectorDB.getSimilarByKeyword(dummyVector, "post", 1000); // Use new function for all posts

            // Step 3: Score and rank posts
            List<PersonalizedPostResult> rankedPosts = new ArrayList<>();
            PostRankScorer scorer = new PostRankScorer();

            for (String postText : allPostTexts) {
                try {
                    // Find matching posts from database
                    List<Post> matchingPosts = postRepo.findByContentContaining(postText.trim());
                    
                    for (Post post : matchingPosts) {
                        // Get post embedding
                        List<Double> postEmbedding = embeddingAPI.getTextEmbedding(post.getContent());
                        
                        // Calculate post age in hours
                        long hoursAgo = ChronoUnit.HOURS.between(post.getCreatedAt(), LocalDateTime.now());
                        
                        // Get vote count and comment count
                        int voteCount = postVoteRepo.getVoteCountByPostId(post.getId());
                        int commentCount = commentRepo.countByPostId(post.getId());
                        
                        // Calculate overall score using PostRankScorer
                        double overallScore = scorer.overallScore(voteCount, commentCount, (int)hoursAgo, postEmbedding, userAverageEmbedding);
                        
                        // Get student name
                        String studentName = studentRepo.findById(post.getStudentId())
                                .map(Student::getFullName)
                                .orElse("Unknown User");
                        
                        rankedPosts.add(new PersonalizedPostResult(post, studentName, overallScore, voteCount, commentCount));
                    }
                } catch (Exception e) {
                    System.err.println("Error processing post text: " + postText + " - " + e.getMessage());
                }
            }

            // Sort by score descending
            rankedPosts.sort((a, b) -> Double.compare(b.getScore(), a.getScore()));

            // Limit to top 20 posts
            if (rankedPosts.size() > 20) {
                rankedPosts = rankedPosts.subList(0, 20);
            }

            System.out.println("Returning " + rankedPosts.size() + " personalized posts for user: " + username);
            return ResponseEntity.ok(rankedPosts);

        } catch (Exception e) {
            System.err.println("Error getting personalized posts: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.ok(new ArrayList<>());
        }
    }

    private List<Double> calculateAverageEmbedding(List<String> texts) {
        if (texts.isEmpty()) {
            return new ArrayList<>();
        }

        try {
            List<List<Double>> embeddings = new ArrayList<>();
            
            // Get embeddings for all texts
            for (String text : texts) {
                if (text != null && !text.trim().isEmpty()) {
                    List<Double> embedding = embeddingAPI.getTextEmbedding(text.trim());
                    if (!embedding.isEmpty()) {
                        embeddings.add(embedding);
                    }
                }
            }

            if (embeddings.isEmpty()) {
                return new ArrayList<>();
            }

            // Calculate average
            int embeddingSize = embeddings.get(0).size();
            List<Double> averageEmbedding = new ArrayList<>(Collections.nCopies(embeddingSize, 0.0));

            for (List<Double> embedding : embeddings) {
                for (int i = 0; i < embeddingSize; i++) {
                    averageEmbedding.set(i, averageEmbedding.get(i) + embedding.get(i));
                }
            }

            // Divide by count to get average
            for (int i = 0; i < embeddingSize; i++) {
                averageEmbedding.set(i, averageEmbedding.get(i) / embeddings.size());
            }

            return averageEmbedding;
        } catch (Exception e) {
            System.err.println("Error calculating average embedding: " + e.getMessage());
            return new ArrayList<>();
        }
    }

    // DTO for dashboard response with percentage
    public static class DashboardStudent {
        private final String fullName;
        private final String username;
        private final String email;
        private final String institute;
        private final String educationLevel;
        private final BigDecimal averageLastFive;
        private final String progressLabel;

        public DashboardStudent(Student student, BigDecimal averageLastFive, String progressLabel) {
            this.fullName = student.getFullName();
            this.username = student.getUsername();
            this.email = student.getEmail();
            this.institute = student.getInstitute();
            this.educationLevel = student.getEducationLevel();
            this.averageLastFive = averageLastFive;
            this.progressLabel = progressLabel;
        }
        public String getFullName() { return fullName; }
        public String getUsername() { return username; }
        public String getEmail() { return email; }
        public String getInstitute() { return institute; }
        public String getEducationLevel() { return educationLevel; }
        public BigDecimal getAverageLastFive() { return averageLastFive; }
        public String getProgressLabel() { return progressLabel; }
    }

    public static class DashboardResponse {
        private final DashboardStudent student;
        private final List<PdfData> pdfDataList;

        public DashboardResponse(DashboardStudent student, List<PdfData> pdfDataList) {
            this.student = student;
            this.pdfDataList = pdfDataList;
        }

        public DashboardStudent getStudent() { return student; }
        public List<PdfData> getPdfDataList() { return pdfDataList; }
    }

    public static class ScoreDTO {
        private final Integer examId;
        private final BigDecimal percentage;
        private final LocalDateTime date;

        public ScoreDTO(Integer examId, BigDecimal percentage, LocalDateTime date) {
            this.examId = examId;
            this.percentage = percentage;
            this.date = date;
        }

        public Integer getExamId() { return examId; }
        public BigDecimal getPercentage() { return percentage; }
        public LocalDateTime getDate() { return date; }
    }

    @GetMapping("/last-five-scores")
    public ResponseEntity<List<ScoreDTO>> getLastFiveScores() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth.getName();
        Student student = studentRepo.findByUsername(username).orElse(null);

        if (student == null) return ResponseEntity.ok(Collections.emptyList());

        Pageable pageable = PageRequest.of(0, 5);
        List<com.nxt.nxt.entity.StudentBestScore> scores = studentBestScoreRepo.findLast5ByStudentIdOrderByCreatedAtDesc(student.getId(), pageable);

        List<ScoreDTO> result = scores.stream()
            .map(s -> new ScoreDTO(s.getExamId(), s.getBestPercentage(), s.getCreatedAt()))
            .collect(Collectors.toList());

        // Pad with zero bars if less than 5
        int missing = 5 - result.size();

        for (int i = 0; i < missing; i++) {
            result.add(new ScoreDTO(null, BigDecimal.ZERO, null));
        }

        return ResponseEntity.ok(result);
    }

    @GetMapping("/dashboard")
    public ResponseEntity<DashboardResponse> getDashboardData() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth.getName();

        List<PdfData> pdfDataList = pdfDataRepo.getPDFByUsername(username);
        Student student = studentRepo.findByUsername(username).orElse(null);

        // Calculate average of last 5 scores
        BigDecimal averageLastFive = BigDecimal.ZERO;
        String progressLabel = "No exam data yet.";

        if (student != null) {
            Pageable pageable = PageRequest.of(0, 5);
            List<com.nxt.nxt.entity.StudentBestScore> scores = studentBestScoreRepo.findLast5ByStudentIdOrderByCreatedAtDesc(student.getId(), pageable);

            if (!scores.isEmpty()) {
                BigDecimal sum = BigDecimal.ZERO;
                int count = 0;

                for (com.nxt.nxt.entity.StudentBestScore s : scores) {
                    sum = sum.add(s.getBestPercentage());
                    count++;
                }
                averageLastFive = sum.divide(BigDecimal.valueOf(count), 2, RoundingMode.HALF_UP);

                if (averageLastFive.compareTo(BigDecimal.valueOf(90)) >= 0) {
                    progressLabel = "Excellent! Your average score for the last 5 exams is outstanding.";
                }
                else if (averageLastFive.compareTo(BigDecimal.valueOf(75)) >= 0) {
                    progressLabel = "Great job! Your recent performance is strong.";
                }
                else if (averageLastFive.compareTo(BigDecimal.valueOf(50)) >= 0) {
                    progressLabel = "Good effort! Keep practicing to improve your average.";
                }
                else {
                    progressLabel = "You can do better! Review your mistakes and try again.";
                }
            }
        }
        DashboardStudent dashboardStudent = new DashboardStudent(student, averageLastFive, progressLabel);
        DashboardResponse response = new DashboardResponse(dashboardStudent, pdfDataList);

        return ResponseEntity.ok(response);
    }

}