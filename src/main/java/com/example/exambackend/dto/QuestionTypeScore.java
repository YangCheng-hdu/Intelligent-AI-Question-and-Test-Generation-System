package com.example.exambackend.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class QuestionTypeScore {
    private String questionType;  // 题型名称
    private Integer questionCount; // 该题型的题目数量
    private Integer scorePerQuestion; // 每题分数
    private Integer totalScore; // 该题型总分
}
