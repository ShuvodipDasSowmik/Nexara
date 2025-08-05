package com.nxt.nxt.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.nxt.nxt.entity.PdfData;
import com.nxt.nxt.util.EmbeddingAPI;
import com.nxt.nxt.util.PDFUtilities;

@RestController
@RequestMapping("/api/tools")
public class ToolsController {

    PDFUtilities pdfUtilities = new PDFUtilities();

    @Autowired
    EmbeddingAPI embeddingAPI;

    @PostMapping("/pdf-parser")
    public ResponseEntity<?> PDFParser(@RequestParam("file") MultipartFile file){
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body("No file uploaded");
        }

        try{
            PdfData pdfData = pdfUtilities.PDFProcessor(file.getInputStream());

            System.out.println("PDF Data: " + pdfData.getTitle() + ", Author: " + pdfData.getAuthor() + ", Total Pages: " + pdfData.getTotalPages());

            List<Double> embedding = embeddingAPI.getTextEmbedding(pdfData.getFullText());
            System.out.println("PDF embedding: " + embedding);

            return ResponseEntity.ok(pdfData);
        }
        catch (Exception e) {
            return ResponseEntity.status(500).body("Error processing file: " + e.getMessage());
        }
    }
}
