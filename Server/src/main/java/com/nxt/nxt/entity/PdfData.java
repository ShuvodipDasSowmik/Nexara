package com.nxt.nxt.entity;

import java.util.ArrayList;
import java.util.List;

public class PdfData {

    private Long id;
    private String title;
    private String author;
    private String subject;
    private String keywords;
    private String fullText;
    private int totalPages;
    private String username; // Foreign key to students table
    private List<PageInfo> pages = new ArrayList<>();

    // Constructors
    public PdfData() {}

    public PdfData(String title, String author, String subject, String keywords, String fullText, int totalPages, String username) {
        this.title = title;
        this.author = author;
        this.subject = subject;
        this.keywords = keywords;
        this.fullText = fullText;
        this.totalPages = totalPages;
        this.username = username;
    }

    // Getters and Setters

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getAuthor() { return author; }
    public void setAuthor(String author) { this.author = author; }

    public String getSubject() { return subject; }
    public void setSubject(String subject) { this.subject = subject; }

    public String getKeywords() { return keywords; }
    public void setKeywords(String keywords) { this.keywords = keywords; }

    public String getFullText() { return fullText; }
    public void setFullText(String fullText) { this.fullText = fullText; }

    public int getTotalPages() { return totalPages; }
    public void setTotalPages(int totalPages) { this.totalPages = totalPages; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public List<PageInfo> getPages() { return pages; }
    public void setPages(List<PageInfo> pages) {
        this.pages = pages;
        for (PageInfo page : pages) {
            page.setPdfData(this);
        }
    }

    public void addPage(PageInfo page) {
        pages.add(page);
        page.setPdfData(this);
    }

    public void removePage(PageInfo page) {
        pages.remove(page);
        page.setPdfData(null);
    }
}