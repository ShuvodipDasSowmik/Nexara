package com.nxt.nxt.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.nxt.nxt.entity.PdfData;
import com.nxt.nxt.entity.Student;
import com.nxt.nxt.repositories.PDFDataRepository;
import com.nxt.nxt.repositories.StudentRepository;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;

import org.springframework.security.core.Authentication;
import org.springframework.http.ResponseEntity;

// DTO for dashboard response
class DashboardResponse {
    private Student student;
    private List<PdfData> pdfDataList;

    public DashboardResponse(Student student, List<PdfData> pdfDataList) {
        this.student = student;
        this.pdfDataList = pdfDataList;
    }

    public Student getStudent() { return student; }
    public void setStudent(Student student) { this.student = student; }

    public List<PdfData> getPdfDataList() { return pdfDataList; }
    public void setPdfDataList(List<PdfData> pdfDataList) { this.pdfDataList = pdfDataList; }
}

@RestController
@RequestMapping("/api/users")
public class UserController {

    StudentRepository studentRepo;
    PDFDataRepository pdfDataRepo;

    public UserController(StudentRepository studentRepo, PDFDataRepository pdfDataRepo) {
        this.studentRepo = studentRepo;
        this.pdfDataRepo = pdfDataRepo;
    }
    
    @GetMapping("/dashboard")
    public ResponseEntity<DashboardResponse> getDashboardData() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth.getName();

        List<PdfData> pdfDataList = pdfDataRepo.getPDFByUsername(username);
        Student student = studentRepo.findByUsername(username).orElse(null);

        System.out.println("Fetching dashboard data for user: " + username);

        DashboardResponse response = new DashboardResponse(student, pdfDataList);
        return ResponseEntity.ok(response);
    }


}