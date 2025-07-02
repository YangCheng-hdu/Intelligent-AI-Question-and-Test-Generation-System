package com.example.exambackend.controller;

import com.example.exambackend.dto.QuestionGenerationRequest;
import com.example.exambackend.dto.QuestionModificationRequest;
import com.example.exambackend.dto.QuestionEditRequest;
import com.example.exambackend.entity.Question;
import com.example.exambackend.service.QuestionService;
import com.example.exambackend.service.AIService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/questions")
@CrossOrigin(origins = "*")
public class QuestionController {
    
    private static final Logger logger = LoggerFactory.getLogger(QuestionController.class);
    
    @Autowired
    private QuestionService questionService;
    
    @Autowired
    private AIService aiService;
    
    /**
     * 生成题目
     */
    @PostMapping("/generate")
    public ResponseEntity<?> generateQuestions(@RequestBody QuestionGenerationRequest request) {
        try {
            List<Question> questions = questionService.generateQuestions(request);
            return ResponseEntity.ok(questions);
        } catch (Exception e) {
            logger.error("生成题目失败: {}", e.getMessage(), e);
            Map<String, String> error = new HashMap<>();
            error.put("error", "生成题目失败: " + e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
    
    /**
     * 保存题目到题库
     */
    @PostMapping("/{id}/save-to-bank")
    public ResponseEntity<?> saveToBank(@PathVariable Long id) {
        try {
            Question question = questionService.saveToBank(id);
            return ResponseEntity.ok(question);
        } catch (Exception e) {
            logger.error("保存到题库失败: {}", e.getMessage(), e);
            Map<String, String> error = new HashMap<>();
            error.put("error", "保存到题库失败: " + e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
    
    /**
     * 从题库中移除题目
     */
    @PostMapping("/{id}/remove-from-bank")
    public ResponseEntity<?> removeFromBank(@PathVariable Long id) {
        try {
            Question question = questionService.removeFromBank(id);
            return ResponseEntity.ok(question);
        } catch (Exception e) {
            logger.error("从题库移除失败: {}", e.getMessage(), e);
            Map<String, String> error = new HashMap<>();
            error.put("error", "从题库移除失败: " + e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
    
    /**
     * 添加题目到待生成试卷
     */
    @PostMapping("/{id}/add-to-exam")
    public ResponseEntity<?> addToExam(@PathVariable Long id) {
        try {
            Question question = questionService.addToExam(id);
            return ResponseEntity.ok(question);
        } catch (Exception e) {
            logger.error("加入试卷失败: {}", e.getMessage(), e);
            Map<String, String> error = new HashMap<>();
            error.put("error", "加入试卷失败: " + e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
    
    /**
     * 从待生成试卷中移除题目
     */
    @PostMapping("/{id}/remove-from-exam")
    public ResponseEntity<?> removeFromExam(@PathVariable Long id) {
        try {
            Question question = questionService.removeFromExam(id);
            return ResponseEntity.ok(question);
        } catch (Exception e) {
            logger.error("从试卷移除失败: {}", e.getMessage(), e);
            Map<String, String> error = new HashMap<>();
            error.put("error", "从试卷移除失败: " + e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
    
    /**
     * 修改题目
     */
    @PostMapping("/modify")
    public ResponseEntity<?> modifyQuestion(@RequestBody QuestionModificationRequest request) {
        try {
            Question question = questionService.modifyQuestion(request);
            return ResponseEntity.ok(question);
        } catch (Exception e) {
            logger.error("修改题目失败: {}", e.getMessage(), e);
            Map<String, String> error = new HashMap<>();
            error.put("error", "修改题目失败: " + e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    /**
     * 编辑题目
     */
    @PutMapping("/edit")
    public ResponseEntity<?> editQuestion(@RequestBody QuestionEditRequest request) {
        try {
            Question question = questionService.editQuestion(request);
            return ResponseEntity.ok(question);
        } catch (Exception e) {
            logger.error("编辑题目失败: {}", e.getMessage(), e);
            Map<String, String> error = new HashMap<>();
            error.put("error", "编辑题目失败: " + e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
    
    /**
     * 删除题目
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteQuestion(@PathVariable Long id) {
        try {
            questionService.deleteQuestion(id);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            logger.error("删除题目失败: {}", e.getMessage(), e);
            Map<String, String> error = new HashMap<>();
            error.put("error", "删除题目失败: " + e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
    
    /**
     * 获取题库中的所有题目
     */
    @GetMapping("/bank")
    public ResponseEntity<?> getBankQuestions() {
        try {
            List<Question> questions = questionService.getBankQuestions();
            return ResponseEntity.ok(questions);
        } catch (Exception e) {
            logger.error("获取题库失败: {}", e.getMessage(), e);
            Map<String, String> error = new HashMap<>();
            error.put("error", "获取题库失败: " + e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
    
    /**
     * 获取待生成试卷中的所有题目
     */
    @GetMapping("/exam")
    public ResponseEntity<?> getExamQuestions() {
        try {
            List<Question> questions = questionService.getExamQuestions();
            return ResponseEntity.ok(questions);
        } catch (Exception e) {
            logger.error("获取试卷失败: {}", e.getMessage(), e);
            Map<String, String> error = new HashMap<>();
            error.put("error", "获取试卷失败: " + e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
    
    /**
     * 根据ID获取题目
     */
    @GetMapping("/{id}")
    public ResponseEntity<?> getQuestionById(@PathVariable Long id) {
        try {
            Question question = questionService.getQuestionById(id);
            return ResponseEntity.ok(question);
        } catch (Exception e) {
            logger.error("获取题目失败: {}", e.getMessage(), e);
            Map<String, String> error = new HashMap<>();
            error.put("error", "获取题目失败: " + e.getMessage());
            return ResponseEntity.notFound().build();
        }
    }
    

    
    /**
     * 题库搜索接口
     */
    @GetMapping("/bank/search")
    public ResponseEntity<?> searchBankQuestions(@RequestParam(required = false) Long subjectId,
                                                 @RequestParam(required = false) Long questionTypeId,
                                                 @RequestParam(required = false) String keyword) {
        try {
            List<Question> questions = questionService.searchBankQuestions(subjectId, questionTypeId, keyword);
            return ResponseEntity.ok(questions);
        } catch (Exception e) {
            logger.error("题库搜索失败: {}", e.getMessage(), e);
            Map<String, String> error = new HashMap<>();
            error.put("error", "题库搜索失败: " + e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    /**
     * 按科目分组获取题库题目
     */
    @GetMapping("/bank/grouped")
    public ResponseEntity<?> getBankQuestionsGroupedBySubject() {
        try {
            List<Question> questions = questionService.getBankQuestionsGroupedBySubject();
            return ResponseEntity.ok(questions);
        } catch (Exception e) {
            logger.error("获取分组题库失败: {}", e.getMessage(), e);
            Map<String, String> error = new HashMap<>();
            error.put("error", "获取分组题库失败: " + e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
} 