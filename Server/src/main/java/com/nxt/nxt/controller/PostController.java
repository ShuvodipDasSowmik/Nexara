package com.nxt.nxt.controller;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.nxt.nxt.entity.Comment;
import com.nxt.nxt.entity.Post;
import com.nxt.nxt.entity.PostVote;
import com.nxt.nxt.entity.Student;
import com.nxt.nxt.repositories.CommentRepository;
import com.nxt.nxt.repositories.PostRepository;
import com.nxt.nxt.repositories.PostVoteRepository;
import com.nxt.nxt.repositories.StudentRepository;
import com.nxt.nxt.util.EmbeddingAPI;
import com.nxt.nxt.util.PostRankScorer;
import com.nxt.nxt.util.VectorDB;

@RestController
@RequestMapping("/api/posts")
public class PostController {

    private final PostRepository postRepository;
    private final PostVoteRepository postVoteRepository;
    private final CommentRepository commentRepository;
    private final StudentRepository studentRepository;

    @Autowired
    EmbeddingAPI embeddingAPI;

    @Autowired
    VectorDB vectorDB;

    // Remove circular dependency
    // @Autowired 
    // UserController userController;

    public PostController(PostRepository postRepository, PostVoteRepository postVoteRepository,
            CommentRepository commentRepository, StudentRepository studentRepository) {
        this.postRepository = postRepository;
        this.postVoteRepository = postVoteRepository;
        this.commentRepository = commentRepository;
        this.studentRepository = studentRepository;
    }

    // POST CRUD OPERATIONS

    @PostMapping
    public ResponseEntity<?> createPost(@RequestBody Post post) {
        try {
            // Add validation
            if (post.getTitle() == null || post.getTitle().trim().isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body("Post title is required");
            }

            if (post.getContent() == null || post.getContent().trim().isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body("Post content is required");
            }

            if (post.getStudentId() == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body("Student ID is required");
            }

            // Set server-side fields
            post.setId(UUID.randomUUID());
            post.setCreatedAt(LocalDateTime.now());
            post.setUpdatedAt(LocalDateTime.now());

            // Log for debugging
            System.out.println("Creating post: " + post.toString());

            postRepository.save(post);

            System.out.println("Post created successfully with ID: " + post.getId());

            // Insert post into VectorDB with "post" keyword TRUE and content in "text"
            try {
                // Get username from authentication context
                Authentication auth = SecurityContextHolder.getContext().getAuthentication();
                String username = auth.getName();
                
                Long pointId = System.currentTimeMillis();
                String postText = post.getContent();
                List<Double> postEmbedding = embeddingAPI.getTextEmbedding(postText);

                Map<String, String> payload = new HashMap<>();
                payload.put("post", "TRUE");
                payload.put("text", postText);

                vectorDB.upsertWithKeywords(pointId, postEmbedding, username, payload);
            }
            catch (Exception ex) {
                System.out.println("Error inserting post into VectorDB: " + ex.getMessage());
                ex.printStackTrace();
            }

            return ResponseEntity.status(HttpStatus.CREATED).body(post);
        }
        catch (Exception e) {
            System.err.println("Error creating post: " + e.getMessage());
            
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error creating post: " + e.getMessage());
        }
    }

    @GetMapping
    public ResponseEntity<List<PostWithStudentName>> getAllPosts() {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String username = auth.getName();

            System.out.println("Getting posts for user: " + username);

            // Quick fallback: If embedding API is failing, just return all posts
            // This prevents API rate limiting from breaking the entire feature
            try {
                // Test if embedding API is working with a small test
                List<Double> testEmbedding = embeddingAPI.getTextEmbedding("test");
                if (testEmbedding.isEmpty()) {
                    throw new RuntimeException("Embedding API is not available");
                }
            } catch (Exception e) {
                String errorMessage = e.getMessage();
                if (errorMessage != null && errorMessage.contains("TooManyRequestsError")) {
                    System.out.println("Cohere API rate limit reached - serving posts without personalization");
                } else {
                    System.out.println("Embedding API unavailable - serving posts without personalization: " + errorMessage);
                }
                return getAllPostsWithoutPersonalization();
            }

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

            // If no user data found, return all posts in chronological order
            if (allUserTexts.isEmpty()) {
                System.out.println("No user data found in VectorDB for user: " + username + ", returning all posts");
                return getAllPostsWithoutPersonalization();
            }

            // Calculate average embedding from all user's data
            List<Double> userAverageEmbedding = calculateAverageEmbedding(allUserTexts);

            System.out.println("User Average Embedding Calculation Done, Length: " + userAverageEmbedding.size());

            if (userAverageEmbedding.isEmpty()) {
                System.out.println("Failed to calculate average embedding for user: " + username + ", returning all posts");
                return getAllPostsWithoutPersonalization();
            }

            // Step 2: Get all posts from VectorDB with "post" = TRUE
            List<String> allPostTexts = vectorDB.getSimilarByKeyword(dummyVector, "post", 1000); // Use new function for all posts

            System.out.println("All Post Texts Retrieved: " + allPostTexts.size());
            // Step 3: Score and rank posts
            List<PostWithScore> scoredPosts = new ArrayList<>();
            PostRankScorer scorer = new PostRankScorer();

            for (String postText : allPostTexts) {
                try {
                    // Find matching posts from database
                    List<Post> matchingPosts = postRepository.findByContentContaining(postText.trim());

                    System.out.println("Found matching posts: " + matchingPosts.size());

                    for (Post post : matchingPosts) {
                        System.out.println("Processing post: " + post.getId());
                        // Get post embedding
                        List<Double> postEmbedding = embeddingAPI.getTextEmbedding(post.getContent());
                        
                        // Calculate post age in hours
                        long hoursAgo = java.time.temporal.ChronoUnit.HOURS.between(post.getCreatedAt(), LocalDateTime.now());
                        
                        // Get vote count and comment count
                        int voteCount = postVoteRepository.getVoteCountByPostId(post.getId());
                        int commentCount = commentRepository.countByPostId(post.getId());
                        
                        // Calculate overall score using PostRankScorer
                        double overallScore = scorer.overallScore(voteCount, commentCount, (int)hoursAgo, postEmbedding, userAverageEmbedding);
                        
                        // Get student name
                        String studentName = studentRepository.findById(post.getStudentId())
                                .map(Student::getUsername)
                                .orElse("Unknown User");
                        
                        scoredPosts.add(new PostWithScore(post, studentName, overallScore));
                    }
                }
                catch (Exception e) {
                    System.err.println("Error processing post text: " + postText + " - " + e.getMessage());
                }
            }

            // If no posts found through VectorDB, return all posts
            if (scoredPosts.isEmpty()) {
                List<Post> posts = postRepository.findAll();
                List<PostWithStudentName> postsWithNames = posts.stream()
                        .map(post -> {
                            Optional<Student> student = studentRepository.findById(post.getStudentId());
                            String studentName = student.map(Student::getUsername).orElse("Unknown User");
                            return new PostWithStudentName(post, studentName);
                        })
                        .toList();
                return ResponseEntity.ok(postsWithNames);
            }

            // Sort by score descending (highest score first)
            scoredPosts.sort((a, b) -> Double.compare(b.getScore(), a.getScore()));

            // Convert to PostWithStudentName and limit to top 20 posts
            List<PostWithStudentName> rankedPosts = scoredPosts.stream()
                    .limit(20)
                    .map(scoredPost -> new PostWithStudentName(scoredPost.getPost(), scoredPost.getStudentName()))
                    .toList();

            System.out.println("Returning " + rankedPosts.size() + " personalized posts for user: " + username);
            return ResponseEntity.ok(rankedPosts);

        } catch (Exception e) {
            System.err.println("Error getting personalized posts: " + e.getMessage());
            e.printStackTrace();
            // Fallback to regular posts
            try {
                List<Post> posts = postRepository.findAll();
                List<PostWithStudentName> postsWithNames = posts.stream()
                        .map(post -> {
                            Optional<Student> student = studentRepository.findById(post.getStudentId());
                            String studentName = student.map(Student::getUsername).orElse("Unknown User");
                            return new PostWithStudentName(post, studentName);
                        })
                        .toList();
                return ResponseEntity.ok(postsWithNames);
            } catch (Exception fallbackError) {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
            }
        }
    }

    private ResponseEntity<List<PostWithStudentName>> getAllPostsWithoutPersonalization() {
        List<Post> posts = postRepository.findAll();
        List<PostWithStudentName> postsWithNames = posts.stream()
                .map(post -> {
                    Optional<Student> student = studentRepository.findById(post.getStudentId());
                    String studentName = student.map(Student::getUsername).orElse("Unknown User");
                    return new PostWithStudentName(post, studentName);
                })
                .toList();
        
        // Add header to indicate personalization is disabled
        return ResponseEntity.ok()
                .header("X-Personalization-Status", "disabled")
                .header("X-Personalization-Reason", "API rate limit reached")
                .body(postsWithNames);
    }

    private List<Double> calculateAverageEmbedding(List<String> texts) {
        if (texts.isEmpty()) {
            return new ArrayList<>();
        }

        try {
            List<List<Double>> embeddings = new ArrayList<>();
            int successfulEmbeddings = 0;
            int totalTexts = texts.size();
            
            // Get embeddings for all texts with better error handling
            for (String text : texts) {
                if (text != null && !text.trim().isEmpty()) {
                    try {
                        List<Double> embedding = embeddingAPI.getTextEmbedding(text.trim());
                        if (!embedding.isEmpty()) {
                            embeddings.add(embedding);
                            successfulEmbeddings++;
                        }
                    } catch (Exception e) {
                        System.err.println("Failed to get embedding for text, skipping: " + e.getMessage());
                        // Continue with other texts
                    }
                }
                
                // If too many failures, abort to prevent endless API calls
                if (successfulEmbeddings == 0 && embeddings.size() > totalTexts / 2) {
                    System.err.println("Too many embedding failures, aborting average calculation");
                    return new ArrayList<>();
                }
            }

            if (embeddings.isEmpty()) {
                System.err.println("No successful embeddings generated");
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

            System.out.println("Successfully calculated average embedding from " + embeddings.size() + " texts");
            return averageEmbedding;
        } catch (Exception e) {
            System.err.println("Error calculating average embedding: " + e.getMessage());
            return new ArrayList<>();
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<Post> getPostById(@PathVariable UUID id) {
        try {
            Optional<Post> post = postRepository.findById(id);
            return post.map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
        }
        catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/student/{studentId}")
    public ResponseEntity<List<Post>> getPostsByStudentId(@PathVariable UUID studentId) {
        try {
            List<Post> posts = postRepository.findByStudentId(studentId);
            return ResponseEntity.ok(posts);
        }
        catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<Post> updatePost(@PathVariable UUID id, @RequestBody Post post) {
        try {
            Optional<Post> existingPost = postRepository.findById(id);

            if (existingPost.isPresent()) {
                post.setId(id);
                post.setUpdatedAt(LocalDateTime.now());
                postRepository.update(post);
                return ResponseEntity.ok(post);
            }

            return ResponseEntity.notFound().build();
        }
        catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePost(@PathVariable UUID id) {
        try {
            Optional<Post> post = postRepository.findById(id);

            if (post.isPresent()) {
                postRepository.deleteById(id);
                return ResponseEntity.noContent().build();
            }

            return ResponseEntity.notFound().build();
        }
        catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // VOTING OPERATIONS

    @PostMapping("/{postId}/upvote")
    public ResponseEntity<String> upvotePost(@PathVariable UUID postId, @RequestParam UUID studentId) {
        return handleVote(postId, studentId, (short) 1);
    }

    @PostMapping("/{postId}/downvote")
    public ResponseEntity<String> downvotePost(@PathVariable UUID postId, @RequestParam UUID studentId) {
        return handleVote(postId, studentId, (short) -1);
    }

    @DeleteMapping("/{postId}/vote")
    public ResponseEntity<String> removeVote(@PathVariable UUID postId, @RequestParam UUID studentId) {
        try {
            postVoteRepository.deleteByStudentIdAndPostId(studentId, postId);
            return ResponseEntity.ok("Vote removed successfully");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error removing vote");
        }
    }

    @GetMapping("/{postId}/votes")
    public ResponseEntity<Integer> getVoteCount(@PathVariable UUID postId) {
        try {
            int voteCount = postVoteRepository.getVoteCountByPostId(postId);
            return ResponseEntity.ok(voteCount);
        }
        catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/{postId}/vote")
    public ResponseEntity<Integer> getVoteForStudent(@PathVariable UUID postId, @RequestParam UUID studentId) {
        try {
            Optional<PostVote> vote = postVoteRepository.findByStudentIdAndPostId(studentId, postId);
            int voteType = vote.map(v -> (int) v.getVoteType()).orElse(0);
            return ResponseEntity.ok(voteType);
        }
        catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // COMMENT CRUD OPERATIONS

    @PostMapping("/{postId}/comments")
    public ResponseEntity<CommentWithStudentName> createComment(@PathVariable UUID postId,
            @RequestBody Comment comment) {
        try {
            System.out.println("Creating comment for post: " + postId);
            System.out.println("Received comment: " + comment);
            
            // Validate that studentId is provided
            if (comment.getStudentId() == null) {
                System.err.println("Student ID is required for creating a comment");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
            }
            
            // Validate content
            if (comment.getContent() == null || comment.getContent().trim().isEmpty()) {
                System.err.println("Comment content is null or empty");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
            }
            
            comment.setId(UUID.randomUUID());
            comment.setPostId(postId);
            comment.setCreatedAt(LocalDateTime.now());
            comment.setUpdatedAt(LocalDateTime.now());
            
            System.out.println("Saving comment with student ID: " + comment.getStudentId());
            commentRepository.save(comment);
            System.out.println("Comment saved successfully with ID: " + comment.getId());

            // Fetch student name
            String studentName = studentRepository.findById(comment.getStudentId())
                    .map(Student::getUsername)
                    .orElse("Unknown User");

            CommentWithStudentName dto = new CommentWithStudentName(comment, studentName);

            return ResponseEntity.status(HttpStatus.CREATED).body(dto);
        }
        catch (Exception e) {
            System.err.println("Error creating comment: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/{postId}/comments")
    public ResponseEntity<List<CommentWithStudentName>> getCommentsByPostId(@PathVariable UUID postId) {
        try {
            List<Comment> comments = commentRepository.findByPostId(postId);
            List<CommentWithStudentName> dtos = comments.stream()
                    .map(c -> {
                        String studentName = studentRepository.findById(c.getStudentId())
                                .map(Student::getUsername)
                                .orElse("Unknown User");
                        return new CommentWithStudentName(c, studentName);
                    })
                    .toList();

            return ResponseEntity.ok(dtos);
        }
        catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/{postId}/comments/top-level")
    public ResponseEntity<List<CommentWithStudentName>> getTopLevelComments(@PathVariable UUID postId) {
        try {
            List<Comment> comments = commentRepository.findTopLevelCommentsByPostId(postId);
            List<CommentWithStudentName> dtos = comments.stream()
                    .map(c -> {
                        String studentName = studentRepository.findById(c.getStudentId())
                                .map(Student::getUsername)
                                .orElse("Unknown User");
                        return new CommentWithStudentName(c, studentName);
                    })
                    .toList();
            return ResponseEntity.ok(dtos);
        }
        catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/comments/{commentId}/replies")
    public ResponseEntity<List<CommentWithStudentName>> getReplies(@PathVariable UUID commentId) {
        try {
            List<Comment> replies = commentRepository.findRepliesByParentId(commentId);
            List<CommentWithStudentName> dtos = replies.stream()
                    .map(c -> {
                        String studentName = studentRepository.findById(c.getStudentId())
                                .map(Student::getUsername)
                                .orElse("Unknown User");
                        return new CommentWithStudentName(c, studentName);
                    })
                    .toList();
            return ResponseEntity.ok(dtos);
        }
        catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/comments/{id}")
    public ResponseEntity<CommentWithStudentName> getCommentById(@PathVariable UUID id) {
        try {
            Optional<Comment> comment = commentRepository.findById(id);
            
            if (comment.isPresent()) {
                String studentName = studentRepository.findById(comment.get().getStudentId())
                        .map(Student::getUsername)
                        .orElse("Unknown User");
                CommentWithStudentName dto = new CommentWithStudentName(comment.get(), studentName);
                return ResponseEntity.ok(dto);
            }

            return ResponseEntity.notFound().build();
        }
        catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PutMapping("/comments/{id}")
    public ResponseEntity<Comment> updateComment(@PathVariable UUID id, @RequestBody Comment comment) {
        try {
            Optional<Comment> existingComment = commentRepository.findById(id);
            if (existingComment.isPresent()) {
                comment.setId(id);
                comment.setUpdatedAt(LocalDateTime.now());
                commentRepository.update(comment);
                return ResponseEntity.ok(comment);
            }
            return ResponseEntity.notFound().build();
        }
        catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @DeleteMapping("/comments/{id}")
    public ResponseEntity<Void> deleteComment(@PathVariable UUID id) {
        try {
            Optional<Comment> comment = commentRepository.findById(id);
            if (comment.isPresent()) {
                commentRepository.deleteById(id);
                return ResponseEntity.noContent().build();
            }
            return ResponseEntity.notFound().build();
        }
        catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/{postId}/comments/count")
    public ResponseEntity<Integer> getCommentCount(@PathVariable UUID postId) {
        try {
            int commentCount = commentRepository.countByPostId(postId);
            return ResponseEntity.ok(commentCount);
        }
        catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // HELPER METHODS

    private ResponseEntity<String> handleVote(UUID postId, UUID studentId, short voteType) {
        try {
            Optional<PostVote> existingVote = postVoteRepository.findByStudentIdAndPostId(studentId, postId);

            if (existingVote.isPresent()) {
                PostVote vote = existingVote.get();

                if (vote.getVoteType().equals(voteType)) {
                    // Same vote type, remove the vote
                    postVoteRepository.deleteByStudentIdAndPostId(studentId, postId);
                    return ResponseEntity.ok("Vote removed");
                }
                else {
                    // Different vote type, update the vote
                    vote.setVoteType(voteType);
                    postVoteRepository.update(vote);
                    return ResponseEntity.ok("Vote updated");
                }
            }
            else {
                // No existing vote, create new one
                PostVote newVote = new PostVote(studentId, postId, voteType);
                newVote.setId(UUID.randomUUID());
                postVoteRepository.save(newVote);
                return ResponseEntity.ok("Vote added");
            }
        }
        catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error processing vote");
        }
    }

    // Helper class to include student name with post
    public static class PostWithStudentName {
        private final Post post;
        private final String studentName;

        public PostWithStudentName(Post post, String studentName) {
            this.post = post;
            this.studentName = studentName;
        }

        public UUID getId() {
            return post.getId();
        }

        public String getTitle() {
            return post.getTitle();
        }

        public String getContent() {
            return post.getContent();
        }

        public UUID getStudentId() {
            return post.getStudentId();
        }

        public LocalDateTime getCreatedAt() {
            return post.getCreatedAt();
        }

        public LocalDateTime getUpdatedAt() {
            return post.getUpdatedAt();
        }

        public String getStudentName() {
            return studentName;
        }
    }

    // Helper class to include student name with comment
    public static class CommentWithStudentName {
        private final Comment comment;
        private final String studentName;

        public CommentWithStudentName(Comment comment, String studentName) {
            this.comment = comment;
            this.studentName = studentName;
        }

        public UUID getId() {
            return comment.getId();
        }

        public UUID getPostId() {
            return comment.getPostId();
        }

        public UUID getStudentId() {
            return comment.getStudentId();
        }

        public String getContent() {
            return comment.getContent();
        }

        public LocalDateTime getCreatedAt() {
            return comment.getCreatedAt();
        }

        public LocalDateTime getUpdatedAt() {
            return comment.getUpdatedAt();
        }

        public UUID getParentId() {
            return comment.getParentId();
        }

        public String getStudentName() {
            return studentName;
        }
    }

    // Helper class for scoring posts
    private static class PostWithScore {
        private final Post post;
        private final String studentName;
        private final double score;

        public PostWithScore(Post post, String studentName, double score) {
            this.post = post;
            this.studentName = studentName;
            this.score = score;
        }

        public Post getPost() { return post; }
        public String getStudentName() { return studentName; }
        public double getScore() { return score; }
    }
}