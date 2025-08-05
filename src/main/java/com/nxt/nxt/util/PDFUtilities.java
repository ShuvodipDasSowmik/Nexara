package com.nxt.nxt.util;

import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDDocumentInformation;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.text.PDFTextStripper;

import com.nxt.nxt.entity.PageInfo;
import com.nxt.nxt.entity.PdfData;

public class PDFUtilities {

    public PdfData PDFProcessor(InputStream is) throws Exception {
        PdfData pdfData = new PdfData();

        try (PDDocument document = PDDocument.load(is)) {
            PDDocumentInformation info = document.getDocumentInformation();

            pdfData.setTitle(info.getTitle());
            pdfData.setAuthor(info.getAuthor());
            pdfData.setSubject(info.getSubject());
            pdfData.setKeywords(info.getKeywords());

            // Extract full text
            PDFTextStripper textStripper = new PDFTextStripper();
            String fullText = textStripper.getText(document);
            pdfData.setFullText(fullText);

            // Set total pages
            int totalPages = document.getNumberOfPages();
            pdfData.setTotalPages(totalPages);

            // Extract per page info
            List<PageInfo> pages = new ArrayList<>();
            for (int i = 0; i < totalPages; i++) {
                PDPage page = document.getPage(i);

                PageInfo pageInfo = new PageInfo();
                pageInfo.setPageNumber(i + 1); // 1-based page numbering

                // Page size in points (1 point = 1/72 inch)
                pageInfo.setWidth(page.getMediaBox().getWidth());
                pageInfo.setHeight(page.getMediaBox().getHeight());

                pageInfo.setRotation(page.getRotation());

                // Extract text for this page
                PDFTextStripper pageStripper = new PDFTextStripper();
                pageStripper.setStartPage(i + 1);
                pageStripper.setEndPage(i + 1);
                String pageText = pageStripper.getText(document);
                pageInfo.setText(pageText);

                // Link pageInfo back to pdfData
                pageInfo.setPdfData(pdfData);
                pages.add(pageInfo);
            }
            pdfData.setPages(pages);
        }

        return pdfData;
    }
}
