package com.example.exambackend.service;

import com.example.exambackend.dto.QuestionGenerationRequest;
import com.example.exambackend.dto.QuestionModificationRequest;
import com.example.exambackend.dto.QuestionEditRequest;
import com.example.exambackend.dto.ExamPaperGenerationRequest;
import com.example.exambackend.dto.ExamPaperResponse;
import com.example.exambackend.dto.QuestionTypeScore;
import com.example.exambackend.entity.Question;
import java.util.List;

public interface QuestionService {
    
    /**
     * 根据要求生成题目
     * @param request 题目生成请求
     * @return 生成的题目列表
     */
    List<Question> generateQuestions(QuestionGenerationRequest request);
    
    /**
     * 保存题目到题库
     * @param questionId 题目ID
     * @return 更新后的题目
     */
    Question saveToBank(Long questionId);
    
    /**
     * 从题库中移除题目
     * @param questionId 题目ID
     * @return 更新后的题目
     */
    Question removeFromBank(Long questionId);
    
    /**
     * 添加题目到待生成试卷
     * @param questionId 题目ID
     * @return 更新后的题目
     */
    Question addToExam(Long questionId);
    
    /**
     * 从待生成试卷中移除题目
     * @param questionId 题目ID
     * @return 更新后的题目
     */
    Question removeFromExam(Long questionId);
    
    /**
     * 修改题目
     * @param request 修改请求
     * @return 修改后的题目
     */
    Question modifyQuestion(QuestionModificationRequest request);

    /**
     * 编辑题目
     * @param request 编辑请求
     * @return 编辑后的题目
     */
    Question editQuestion(QuestionEditRequest request);
    
    /**
     * 删除题目
     * @param questionId 题目ID
     */
    void deleteQuestion(Long questionId);
    
    /**
     * 获取题库中的所有题目
     * @return 题库题目列表
     */
    List<Question> getBankQuestions();
    
    /**
     * 获取待生成试卷中的所有题目
     * @return 待生成试卷题目列表
     */
    List<Question> getExamQuestions();
    
    /**
     * 根据ID获取题目
     * @param questionId 题目ID
     * @return 题目
     */
    Question getQuestionById(Long questionId);
    
    /**
     * 生成试卷
     * @param request 试卷生成请求
     * @return 生成的试卷
     */
    ExamPaperResponse generateExamPaper(ExamPaperGenerationRequest request);
    

    
    /**
     * 题库搜索
     */
    List<Question> searchBankQuestions(Long subjectId, Long questionTypeId, String keyword);

    /**
     * 按科目分组获取题库题目
     */
    List<Question> getBankQuestionsGroupedBySubject();

    /**
     * 分析待生成试卷中的题型分布
     * @return 题型分布信息
     */
    List<QuestionTypeScore> analyzeQuestionTypes();
} 