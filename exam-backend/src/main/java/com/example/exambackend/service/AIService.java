package com.example.exambackend.service;

import java.util.List;

public interface AIService {
    
    /**
     * 根据要求生成题目
     * @param prompt 生成题目的提示词
     * @return 生成的题目内容列表
     */
    List<String> generateQuestions(String prompt);
    
    /**
     * 根据修改要求重新生成题目
     * @param originalQuestion 原题目内容
     * @param modificationRequest 修改要求
     * @return 修改后的题目内容
     */
    String modifyQuestion(String originalQuestion, String modificationRequest);
    

} 