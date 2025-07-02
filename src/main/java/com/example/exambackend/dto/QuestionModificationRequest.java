package com.example.exambackend.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class QuestionModificationRequest {
    private Long questionId;
    private String modificationRequest;
} 