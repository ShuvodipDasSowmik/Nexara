package com.nxt.nxt.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;

public class PageInfo {

    private Long id;
    private int pageNumber;
    private float width;
    private float height;
    private int rotation;
    private String text; // Field for the page's text content
    @JsonIgnore
    private PdfData pdfData;

    // Constructors
    public PageInfo() {}

    public PageInfo(int pageNumber, float width, float height, int rotation) {
        this.pageNumber = pageNumber;
        this.width = width;
        this.height = height;
        this.rotation = rotation;
    }

    // Getters and Setters

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public int getPageNumber() { return pageNumber; }
    public void setPageNumber(int pageNumber) { this.pageNumber = pageNumber; }

    public float getWidth() { return width; }
    public void setWidth(float width) { this.width = width; }

    public float getHeight() { return height; }
    public void setHeight(float height) { this.height = height; }

    public int getRotation() { return rotation; }
    public void setRotation(int rotation) { this.rotation = rotation; }

    public String getText() { return text; } // Getter for text
    public void setText(String text) { this.text = text; } // Setter for text

    public PdfData getPdfData() { return pdfData; }
    public void setPdfData(PdfData pdfData) { this.pdfData = pdfData; }
}
