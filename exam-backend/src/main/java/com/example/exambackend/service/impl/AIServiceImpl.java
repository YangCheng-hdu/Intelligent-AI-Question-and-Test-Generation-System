package com.example.exambackend.service.impl;

import com.example.exambackend.config.AIConfig;
import com.example.exambackend.dto.ZhipuRequest;
import com.example.exambackend.dto.ZhipuResponse;
import com.example.exambackend.service.AIService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.List;
import java.util.ArrayList;
import java.util.Arrays;

@Service
public class AIServiceImpl implements AIService {
    
    private static final Logger logger = LoggerFactory.getLogger(AIServiceImpl.class);
    
    @Autowired
    private AIConfig aiConfig;
    
    @Autowired
    private WebClient.Builder webClientBuilder;
    
    private final ObjectMapper objectMapper = new ObjectMapper();
    
    @Override
    public List<String> generateQuestions(String prompt) {
        try {
            logger.info("=== 开始生成题目 ===");
            logger.info("提示词: {}", prompt);
            
            // 构建更详细的提示词
            String enhancedPrompt = buildQuestionGenerationPrompt(prompt);
            
            // 调用AI接口
            String aiResponse = callZhipuAI(enhancedPrompt);
            
            // 解析AI响应，提取题目
            return parseQuestionsFromResponse(aiResponse);
            
        } catch (Exception e) {
            logger.error("AI题目生成失败: {}", e.getMessage(), e);
            // 返回模拟数据作为备用
            return Arrays.asList(
                "模拟生成的题目1: " + prompt,
                "模拟生成的题目2: " + prompt
            );
        }
    }
    
    @Override
    public String modifyQuestion(String originalQuestion, String modificationRequest) {
        try {
            logger.info("=== 开始修改题目 ===");
            logger.info("原题目: {}", originalQuestion);
            logger.info("修改要求: {}", modificationRequest);
            
            // 构建修改题目的提示词
            String prompt = buildQuestionModificationPrompt(originalQuestion, modificationRequest);
            logger.info("构建的提示词: {}", prompt);
            
            // 调用AI接口
            logger.info("正在调用智谱AI接口...");
            String aiResponse = callZhipuAI(prompt);
            logger.info("AI响应: {}", aiResponse);
            
            // 返回修改后的题目
            String result = aiResponse.trim();
            logger.info("修改后的题目: {}", result);
            return result;
            
        } catch (Exception e) {
            logger.error("AI题目修改失败: {}", e.getMessage(), e);
            // 返回模拟数据作为备用
            return "修改后的题目: " + originalQuestion + " (修改要求: " + modificationRequest + ")";
        }
    }
    

    
    /**
     * 调用智谱AI服务
     */
    private String callZhipuAI(String prompt) {
        try {
            logger.info("=== 调用智谱AI服务 ===");
            logger.info("API URL: {}", aiConfig.getApiUrl());
            logger.info("模型: {}", aiConfig.getModel());
            
            // 构建请求消息
            ZhipuRequest.Message message = new ZhipuRequest.Message("user", prompt);
            List<ZhipuRequest.Message> messages = Arrays.asList(message);
            
            ZhipuRequest request = new ZhipuRequest(
                aiConfig.getModel(),
                messages
            );
            
            logger.info("发送请求到智谱AI服务...");
            logger.info("请求内容: {}", request);
            
            // 发送请求
            ZhipuResponse response = webClientBuilder.build()
                .post()
                .uri(aiConfig.getApiUrl())
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + aiConfig.getApiKey())
                .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .bodyValue(request)
                .retrieve()
                .bodyToMono(ZhipuResponse.class)
                .block();
            
            logger.info("收到智谱AI响应: {}", response);
            logger.info("响应ID: {}", response != null ? response.getId() : "null");
            logger.info("响应模型: {}", response != null ? response.getModel() : "null");
            
            if (response != null && response.getChoices() != null && 
                !response.getChoices().isEmpty()) {
                String content = response.getChoices().get(0).getMessage().getContent();
                logger.info("提取的内容: {}", content);
                return content;
            } else {
                throw new RuntimeException("智谱AI服务响应异常: 没有找到有效内容");
            }
        } catch (Exception e) {
            logger.error("智谱AI服务调用失败: {}", e.getMessage(), e);
            throw e;
        }
    }
    
    /**
     * 构建题目生成提示词
     */
    private String buildQuestionGenerationPrompt(String originalPrompt) {
        return originalPrompt + "\n\n" +
               "请严格按照以下格式返回题目：\n" +
               "1. [题目内容]\n" +
               "   [题目内容继续...]\n" +
               "   [选项A] [选项B] [选项C] [选项D]（如果是选择题）\n\n" +
               "2. [题目内容]\n" +
               "   [题目内容继续...]\n" +
               "   [选项A] [选项B] [选项C] [选项D]（如果是选择题）\n\n" +
               "3. [题目内容]\n" +
               "   [题目内容继续...]\n" +
               "   [选项A] [选项B] [选项C] [选项D]（如果是选择题）\n\n" +
               "重要要求：\n" +
               "- 每道题目都必须有序号（1. 2. 3. 等）\n" +
               "- 严格按照提示词中要求的题型格式生成题目\n" +
               "- 严格按照提示词中要求的题目数量生成，不能多也不能少\n" +
               "- 每道题目都是完整的，包含题目描述和必要的选项或要求\n" +
               "- 题目内容可以跨多行\n" +
               "- 每道题目之间用空行分隔\n" +
               "- 确保题目内容符合指定科目的教学要求";
    }
    
    /**
     * 构建题目修改提示词
     */
    private String buildQuestionModificationPrompt(String originalQuestion, String modificationRequest) {
        return String.format(
            "你是一个专业的题目修改助手。请根据修改要求重新生成这道题目。\n\n" +
            "原题目：%s\n\n" +
            "修改要求：%s\n\n" +
            "请重新生成一个符合修改要求的新题目，保持题目的完整性和专业性。直接返回新题目内容，不要包含解释。",
            originalQuestion, modificationRequest
        );
    }
    

    
    /**
     * 从AI响应中解析题目
     */
    private List<String> parseQuestionsFromResponse(String aiResponse) {
        List<String> questions = new ArrayList<>();
        
        logger.info("开始解析AI响应: {}", aiResponse);
        
        // 按行分割响应
        String[] lines = aiResponse.split("\n");
        StringBuilder currentQuestion = new StringBuilder();
        boolean inQuestion = false;
        
        for (String line : lines) {
            line = line.trim();
            
            // 跳过空行
            if (line.isEmpty()) {
                // 如果当前正在构建题目，空行表示题目结束
                if (inQuestion && currentQuestion.length() > 0) {
                    String question = currentQuestion.toString().trim();
                    if (!question.isEmpty()) {
                        questions.add(question);
                        logger.info("解析到题目: {}", question);
                    }
                    currentQuestion = new StringBuilder();
                    inQuestion = false;
                }
                continue;
            }
            
            // 检查是否是新题目的开始（以数字和点开头）
            if (line.matches("^\\d+\\..*")) {
                // 如果之前有题目在构建中，先保存它
                if (inQuestion && currentQuestion.length() > 0) {
                    String question = currentQuestion.toString().trim();
                    if (!question.isEmpty()) {
                        questions.add(question);
                        logger.info("解析到题目: {}", question);
                    }
                }
                
                // 开始新题目
                currentQuestion = new StringBuilder();
                // 移除序号，只保留题目内容
                String questionContent = line.replaceFirst("^\\d+\\.\\s*", "");
                currentQuestion.append(questionContent);
                inQuestion = true;
            } else if (inQuestion) {
                // 如果已经在题目中，继续添加内容
                if (currentQuestion.length() > 0) {
                    currentQuestion.append("\n");
                }
                currentQuestion.append(line);
            } else if (!line.isEmpty()) {
                // 如果不是序号行但内容不为空，且不在题目中，作为独立题目
                questions.add(line);
                logger.info("解析到独立题目: {}", line);
            }
        }
        
        // 处理最后一个题目
        if (inQuestion && currentQuestion.length() > 0) {
            String question = currentQuestion.toString().trim();
            if (!question.isEmpty()) {
                questions.add(question);
                logger.info("解析到最后一个题目: {}", question);
            }
        }
        
        // 如果没有解析到题目，返回原始响应
        if (questions.isEmpty()) {
            logger.warn("没有解析到题目，返回原始响应");
            questions.add(aiResponse);
        }
        
        logger.info("总共解析到 {} 道题目", questions.size());
        return questions;
    }
} 