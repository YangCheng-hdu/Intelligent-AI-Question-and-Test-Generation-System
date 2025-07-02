package com.example.exambackend.controller;

import com.example.exambackend.dto.ExamPaperGenerationRequest;
import com.example.exambackend.dto.ExamPaperResponse;
import com.example.exambackend.dto.QuestionTypeScore;
import com.example.exambackend.service.QuestionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/exam-paper")
@CrossOrigin(origins = "*")
public class ExamPaperController {
    
    @Autowired
    private QuestionService questionService;
    
    /**
     * 生成试卷
     */
    @PostMapping("/generate")
    public ResponseEntity<ExamPaperResponse> generateExamPaper(@RequestBody ExamPaperGenerationRequest request) {
        try {
            ExamPaperResponse response = questionService.generateExamPaper(request);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    /**
     * 分析待生成试卷中的题型分布
     */
    @GetMapping("/analyze-question-types")
    public ResponseEntity<List<QuestionTypeScore>> analyzeQuestionTypes() {
        try {
            List<QuestionTypeScore> typeScores = questionService.analyzeQuestionTypes();
            return ResponseEntity.ok(typeScores);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }


    

} 