package com.example.exambackend.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "questions")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Question {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne
    @JoinColumn(name = "subject_id", nullable = false)
    private Subject subject;
    
    @ManyToOne
    @JoinColumn(name = "question_type_id", nullable = false)
    private QuestionType questionType;
    
    @Column(columnDefinition = "TEXT", nullable = false)
    private String content;
    
    @Column(columnDefinition = "TEXT")
    private String answer;
    
    @Column(columnDefinition = "TEXT")
    private String analysis;
    
    private Integer difficulty; // 1-5 难度等级
    
    private Boolean isInBank = false; // 是否在题库中
    
    private Boolean isInExam = false; // 是否在待生成试卷中
    
    private LocalDateTime createdAt;
    
    private LocalDateTime updatedAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
} 