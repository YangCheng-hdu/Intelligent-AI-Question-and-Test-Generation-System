package com.example.exambackend.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ExamPaperGenerationRequest {
    private String title;
    private String subject;
    private Integer totalScore;
    private Integer duration; // 考试时长（分钟）
    private List<QuestionTypeScore> questionTypeScores; // 题型分数设置
}