package com.example.exambackend.dto;

import lombok.Data;

/**
 * 题目编辑请求DTO
 */
@Data
public class QuestionEditRequest {
    
    /**
     * 题目ID
     */
    private Long id;
    
    /**
     * 题目内容
     */
    private String content;
    
    /**
     * 答案
     */
    private String answer;
    
    /**
     * 解析
     */
    private String analysis;
    
    /**
     * 难度等级 (1-5)
     */
    private Integer difficulty;
    
    /**
     * 科目ID
     */
    private Long subjectId;
    
    /**
     * 题型ID
     */
    private Long questionTypeId;
}
