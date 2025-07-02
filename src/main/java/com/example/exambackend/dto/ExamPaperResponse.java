package com.example.exambackend.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ExamPaperResponse {
    private String title;
    private String subject;
    private Integer totalScore;
    private Integer duration;
    private List<ExamQuestion> questions;

} 