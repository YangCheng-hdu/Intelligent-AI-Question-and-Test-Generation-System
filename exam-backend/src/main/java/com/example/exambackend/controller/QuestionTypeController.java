package com.example.exambackend.controller;

import com.example.exambackend.entity.QuestionType;
import com.example.exambackend.repository.QuestionTypeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/question-types")
@CrossOrigin(origins = "*")
public class QuestionTypeController {
    
    @Autowired
    private QuestionTypeRepository questionTypeRepository;
    
    @GetMapping
    public ResponseEntity<List<QuestionType>> getAllQuestionTypes() {
        List<QuestionType> questionTypes = questionTypeRepository.findAll();
        return ResponseEntity.ok(questionTypes);
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<QuestionType> getQuestionTypeById(@PathVariable Long id) {
        return questionTypeRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
} 