package com.nxt.nxt.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.nxt.nxt.entity.PageInfo;
import com.nxt.nxt.entity.PdfData;
import com.nxt.nxt.repositories.PDFDataRepository;
import com.nxt.nxt.util.EmbeddingAPI;
import com.nxt.nxt.util.PDFUtilities;
import com.nxt.nxt.util.VectorDB;

@RestController
@RequestMapping("/api/tools")
public class ToolsController {

    PDFUtilities pdfUtilities = new PDFUtilities();
    PDFDataRepository pdfDataRepository;

    @Autowired
    EmbeddingAPI embeddingAPI;

    @Autowired
    VectorDB vectorDB;

    public ToolsController(PDFDataRepository pdfDataRepository) {
        this.pdfDataRepository = pdfDataRepository;
    }

    @PostMapping("/pdf-parser")
    public ResponseEntity<?> PDFParser(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body("No file uploaded");
        }

        try {
            // Extract username from JWT token via SecurityContext
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String username = authentication.getName();

            PdfData pdfData = pdfUtilities.PDFProcessor(file.getInputStream());
            pdfData.setUsername(username);

            // Ensure the title is the file name
            pdfData.setTitle(file.getOriginalFilename());

            System.out.println("PDF Data: " + pdfData.getTitle() + ", Author: " + pdfData.getAuthor()
                    + ", Total Pages: " + pdfData.getTotalPages() + ", Username: " + pdfData.getUsername());

            pdfDataRepository.insertPDFData(pdfData);

            // Insert embeddings into vectorDB for each page
            List<PageInfo> pages = pdfData.getPages();
            if (pages != null) {
                for (PageInfo page : pages) {
                    Long pointId = System.currentTimeMillis() + page.getPageNumber();
                    List<Double> pageEmbedding = embeddingAPI.getTextEmbedding(page.getText());
                    vectorDB.upsertData(pointId, pageEmbedding, page.getText(), username);
                }
            }

            // Optionally, insert embedding for full PDF text
            // List<Double> embedding = embeddingAPI.getTextEmbedding(pdfData.getFullText());
            // vectorDB.upsertData(System.currentTimeMillis(), embedding);

            return ResponseEntity.ok(pdfData);
        }
        catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Error processing file: " + e.getMessage());
        }
    }
}
