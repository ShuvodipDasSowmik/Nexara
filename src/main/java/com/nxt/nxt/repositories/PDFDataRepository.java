package com.nxt.nxt.repositories;

import java.util.List;
import java.util.Optional;

import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.BeanPropertyRowMapper;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

import com.nxt.nxt.entity.PdfData;

import java.sql.PreparedStatement;
import java.sql.Statement;

@Repository
public class PDFDataRepository {
    
    private final JdbcTemplate jdbc;

    public PDFDataRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public Long insertPDFData(PdfData pdfData) {
        KeyHolder keyHolder = new GeneratedKeyHolder();
        
        jdbc.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(
                "INSERT INTO pdf_data (title, author, subject, keywords, full_text, total_pages, username) VALUES (?, ?, ?, ?, ?, ?, ?)",
                Statement.RETURN_GENERATED_KEYS
            );
            ps.setString(1, pdfData.getTitle());
            ps.setString(2, pdfData.getAuthor());
            ps.setString(3, pdfData.getSubject());
            ps.setString(4, pdfData.getKeywords());
            ps.setString(5, pdfData.getFullText());
            ps.setInt(6, pdfData.getTotalPages());
            ps.setString(7, pdfData.getUsername());
            return ps;
        }, keyHolder);

        // Fix: get the primary key from the returned keys map
        Number idNum = (Number) keyHolder.getKeys().get("id");
        Long pdfId = idNum != null ? idNum.longValue() : null;
        pdfData.setId(pdfId);

        return pdfId;
    }

    public Optional<PdfData> findById(Long id) {
        try {
            PdfData pdfData = jdbc.queryForObject(
                "SELECT * FROM pdf_data WHERE id = ?",
                new BeanPropertyRowMapper<>(PdfData.class),
                id
            );
            
            return Optional.ofNullable(pdfData);
        }
        catch (EmptyResultDataAccessException e) {
            return Optional.empty();
        }
    }

    public List<PdfData> findAll() {
        List<PdfData> pdfDataList = jdbc.query(
            "SELECT * FROM pdf_data",
            new BeanPropertyRowMapper<>(PdfData.class)
        );
        
        return pdfDataList;
    }

    public Optional<PdfData> findByTitle(String title) {
        try {
            PdfData pdfData = jdbc.queryForObject(
                "SELECT * FROM pdf_data WHERE title = ?",
                new BeanPropertyRowMapper<>(PdfData.class),
                title
            );
            
            return Optional.ofNullable(pdfData);
        }
        catch (EmptyResultDataAccessException e) {
            return Optional.empty();
        }
    }

    public void deleteById(Long id) {
        jdbc.update("DELETE FROM pdf_data WHERE id = ?", id);
    }

    public void updatePDFData(PdfData pdfData) {
        jdbc.update(
            "UPDATE pdf_data SET title = ?, author = ?, subject = ?, keywords = ?, full_text = ?, total_pages = ?, username = ? WHERE id = ?",
            pdfData.getTitle(), pdfData.getAuthor(), pdfData.getSubject(), 
            pdfData.getKeywords(), pdfData.getFullText(), pdfData.getTotalPages(), pdfData.getUsername(), pdfData.getId()
        );
    }

    public List<PdfData> getPDFByUsername(String username) {
        return jdbc.query(
            "SELECT * FROM pdf_data WHERE username = ?",
            new BeanPropertyRowMapper<>(PdfData.class),
            username
        );
    }
}