package com.example.exambackend.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class QuestionGenerationRequest {
    private String subject;
    private String questionType;
    private Integer questionCount;
    private String domainLimit; // 领域限制，如：立体几何、线性代数
} 