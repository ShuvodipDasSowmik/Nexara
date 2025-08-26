package com.nxt.nxt.controller;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.nxt.nxt.entity.Post;
import com.nxt.nxt.entity.PostVote;
import com.nxt.nxt.entity.Comment;
import com.nxt.nxt.entity.Student;
import com.nxt.nxt.repositories.PostRepository;
import com.nxt.nxt.repositories.PostVoteRepository;
import com.nxt.nxt.repositories.CommentRepository;
import com.nxt.nxt.repositories.StudentRepository;
import com.nxt.nxt.util.EmbeddingAPI;
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
                Long pointId = System.currentTimeMillis();
                String postText = post.getContent();
                List<Double> postEmbedding = embeddingAPI.getTextEmbedding(postText);

                Map<String, String> payload = new HashMap<>();
                payload.put("post", "TRUE");
                payload.put("text", postText);

                vectorDB.upsertWithKeywords(pointId, postEmbedding, post.getStudentId().toString(), payload);
            } catch (Exception ex) {
                System.out.println("Error inserting post into VectorDB: " + ex.getMessage());
                ex.printStackTrace();
            }

            return ResponseEntity.status(HttpStatus.CREATED).body(post);
        } catch (Exception e) {
            System.err.println("Error creating post: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Error creating post: " + e.getMessage());
        }
    }

    @GetMapping
    public ResponseEntity<List<PostWithStudentName>> getAllPosts() {
        try {
            List<Post> posts = postRepository.findAll();
            List<PostWithStudentName> postsWithNames = posts.stream()
                .map(post -> {
                    Optional<Student> student = studentRepository.findById(post.getStudentId());
                    String studentName = student.map(Student::getFullName).orElse("Unknown User");
                    return new PostWithStudentName(post, studentName);
                })
                .toList();
            return ResponseEntity.ok(postsWithNames);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<Post> getPostById(@PathVariable UUID id) {
        try {
            Optional<Post> post = postRepository.findById(id);
            return post.map(ResponseEntity::ok)
                      .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/student/{studentId}")
    public ResponseEntity<List<Post>> getPostsByStudentId(@PathVariable UUID studentId) {
        try {
            List<Post> posts = postRepository.findByStudentId(studentId);
            return ResponseEntity.ok(posts);
        } catch (Exception e) {
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
        } catch (Exception e) {
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
        } catch (Exception e) {
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
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/{postId}/vote")
    public ResponseEntity<Integer> getVoteForStudent(@PathVariable UUID postId, @RequestParam UUID studentId) {
        try {
            Optional<PostVote> vote = postVoteRepository.findByStudentIdAndPostId(studentId, postId);
            int voteType = vote.map(v -> (int) v.getVoteType()).orElse(0);
            return ResponseEntity.ok(voteType);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // COMMENT CRUD OPERATIONS

    @PostMapping("/{postId}/comments")
    public ResponseEntity<CommentWithStudentName> createComment(@PathVariable UUID postId, @RequestBody Comment comment) {
        try {
            comment.setId(UUID.randomUUID());
            comment.setPostId(postId);
            comment.setCreatedAt(LocalDateTime.now());
            comment.setUpdatedAt(LocalDateTime.now());
            commentRepository.save(comment);

            // Fetch student name
            String studentName = studentRepository.findById(comment.getStudentId())
                .map(Student::getFullName)
                .orElse("Unknown User");

            CommentWithStudentName dto = new CommentWithStudentName(comment, studentName);
            return ResponseEntity.status(HttpStatus.CREATED).body(dto);
        } catch (Exception e) {
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
                        .map(Student::getFullName)
                        .orElse("Unknown User");
                    return new CommentWithStudentName(c, studentName);
                })
                .toList();
            return ResponseEntity.ok(dtos);
        } catch (Exception e) {
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
                        .map(Student::getFullName)
                        .orElse("Unknown User");
                    return new CommentWithStudentName(c, studentName);
                })
                .toList();
            return ResponseEntity.ok(dtos);
        } catch (Exception e) {
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
                        .map(Student::getFullName)
                        .orElse("Unknown User");
                    return new CommentWithStudentName(c, studentName);
                })
                .toList();
            return ResponseEntity.ok(dtos);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/comments/{id}")
    public ResponseEntity<CommentWithStudentName> getCommentById(@PathVariable UUID id) {
        try {
            Optional<Comment> comment = commentRepository.findById(id);
            if (comment.isPresent()) {
                String studentName = studentRepository.findById(comment.get().getStudentId())
                    .map(Student::getFullName)
                    .orElse("Unknown User");
                CommentWithStudentName dto = new CommentWithStudentName(comment.get(), studentName);
                return ResponseEntity.ok(dto);
            }
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
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
        } catch (Exception e) {
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
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/{postId}/comments/count")
    public ResponseEntity<Integer> getCommentCount(@PathVariable UUID postId) {
        try {
            int commentCount = commentRepository.countByPostId(postId);
            return ResponseEntity.ok(commentCount);
        } catch (Exception e) {
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
                } else {
                    // Different vote type, update the vote
                    vote.setVoteType(voteType);
                    postVoteRepository.update(vote);
                    return ResponseEntity.ok("Vote updated");
                }
            } else {
                // No existing vote, create new one
                PostVote newVote = new PostVote(studentId, postId, voteType);
                newVote.setId(UUID.randomUUID());
                postVoteRepository.save(newVote);
                return ResponseEntity.ok("Vote added");
            }
        } catch (Exception e) {
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

        public UUID getId() { return post.getId(); }
        public String getTitle() { return post.getTitle(); }
        public String getContent() { return post.getContent(); }
        public UUID getStudentId() { return post.getStudentId(); }
        public LocalDateTime getCreatedAt() { return post.getCreatedAt(); }
        public LocalDateTime getUpdatedAt() { return post.getUpdatedAt(); }
        public String getStudentName() { return studentName; }
    }

    // Helper class to include student name with comment
    public static class CommentWithStudentName {
        private final Comment comment;
        private final String studentName;

        public CommentWithStudentName(Comment comment, String studentName) {
            this.comment = comment;
            this.studentName = studentName;
        }

        public UUID getId() { return comment.getId(); }
        public UUID getPostId() { return comment.getPostId(); }
        public UUID getStudentId() { return comment.getStudentId(); }
        public String getContent() { return comment.getContent(); }
        public LocalDateTime getCreatedAt() { return comment.getCreatedAt(); }
        public LocalDateTime getUpdatedAt() { return comment.getUpdatedAt(); }
        public UUID getParentId() { return comment.getParentId(); }
        public String getStudentName() { return studentName; }
    }
}