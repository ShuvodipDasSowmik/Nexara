package com.nxt.nxt.controller;

import java.io.ByteArrayOutputStream;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
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
import com.nxt.nxt.util.StringFormatter;
import com.nxt.nxt.util.VectorDB;
import com.itextpdf.text.Document;
import com.itextpdf.text.pdf.PdfWriter;
import com.itextpdf.tool.xml.XMLWorkerHelper;
import com.itextpdf.text.BaseColor;
import com.itextpdf.text.Font;
import com.itextpdf.text.FontFactory;
import com.itextpdf.text.Rectangle;
import com.itextpdf.text.pdf.PdfPageEventHelper;
import com.itextpdf.text.pdf.PdfContentByte;

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
                    // Debug: print the raw PageInfo and text length
                    System.out.println("PageInfo: " + page);
                    System.out.println("Page " + page.getPageNumber() + " text length: " + (page.getText() != null ? page.getText().length() : 0));
                    
                    Long pointId = System.currentTimeMillis() + page.getPageNumber();
                    List<Double> pageEmbedding = embeddingAPI.getTextEmbedding(page.getText());
                    // Debug: print the text being inserted
                    System.out.println("Inserting to VectorDB - page " + page.getPageNumber() + ": " + page.getText());
                    Map<String, String> payload = new HashMap<>();
                    payload.put("pdfdata", "TRUE");
                    payload.put("text", page.getText());
                    vectorDB.upsertWithKeywords(pointId, pageEmbedding, username, payload);
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

    // Nexara watermark event
    static class NexaraWatermark extends PdfPageEventHelper {
        Font watermarkFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 14, Font.NORMAL, new BaseColor(100, 100, 100));
        @Override
        public void onEndPage(PdfWriter writer, Document document) {
            Rectangle pageSize = document.getPageSize();
            PdfContentByte cb = writer.getDirectContent();
            cb.saveState();
            cb.beginText();
            cb.setFontAndSize(watermarkFont.getBaseFont(), watermarkFont.getSize());
            cb.setColorFill(watermarkFont.getColor());
            // Header watermark
            cb.showTextAligned(PdfContentByte.ALIGN_CENTER, "Nexara", pageSize.getWidth() / 2, pageSize.getTop() - 20, 0);
            // Footer watermark
            cb.showTextAligned(PdfContentByte.ALIGN_CENTER, "Generated by Nexara", pageSize.getWidth() / 2, pageSize.getBottom() + 20, 0);
            cb.endText();
            cb.restoreState();
        }
    }

    @PostMapping("/generate-pdf")
    public ResponseEntity<?> generatePDF(@RequestParam("content") String content) {
        try {
            // Format content to HTML (no <head> or <meta>)
            String html = "<html><body>" +
                StringFormatter.format(content) +
                "</body></html>";

            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            Document document = new Document();
            PdfWriter writer = PdfWriter.getInstance(document, baos);
            writer.setPageEvent(new NexaraWatermark()); // Add watermark
            document.open();
            XMLWorkerHelper.getInstance().parseXHtml(
                writer, document, new java.io.StringReader(html)
            );
            document.close();

            byte[] pdfBytes = baos.toByteArray();

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDispositionFormData("attachment", "summary.pdf");
            headers.setContentLength(pdfBytes.length);

            return ResponseEntity.ok()
                .headers(headers)
                .body(pdfBytes);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Error generating PDF: " + e.getMessage());
        }
    }

}
