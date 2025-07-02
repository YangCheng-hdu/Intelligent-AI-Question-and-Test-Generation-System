package com.example.exambackend.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ExamQuestion {
    private Long id;
    private String questionType;
    private String content;
    private Integer score; // 该题分值
} 