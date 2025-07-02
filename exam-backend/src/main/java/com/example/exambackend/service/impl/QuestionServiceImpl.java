package com.example.exambackend.service.impl;

import com.example.exambackend.dto.QuestionGenerationRequest;
import com.example.exambackend.dto.QuestionModificationRequest;
import com.example.exambackend.dto.QuestionEditRequest;
import com.example.exambackend.dto.ExamPaperGenerationRequest;
import com.example.exambackend.dto.ExamPaperResponse;
import com.example.exambackend.dto.ExamQuestion;
import com.example.exambackend.dto.QuestionTypeScore;
import com.example.exambackend.entity.Question;
import com.example.exambackend.entity.Subject;
import com.example.exambackend.entity.QuestionType;
import com.example.exambackend.repository.QuestionRepository;
import com.example.exambackend.repository.SubjectRepository;
import com.example.exambackend.repository.QuestionTypeRepository;
import com.example.exambackend.service.QuestionService;
import com.example.exambackend.service.AIService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.ArrayList;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Transactional
public class QuestionServiceImpl implements QuestionService {
    
    private static final Logger logger = LoggerFactory.getLogger(QuestionServiceImpl.class);
    
    @Autowired
    private QuestionRepository questionRepository;
    
    @Autowired
    private SubjectRepository subjectRepository;
    
    @Autowired
    private QuestionTypeRepository questionTypeRepository;
    
    @Autowired
    private AIService aiService;
    
    @Override
    public List<Question> generateQuestions(QuestionGenerationRequest request) {
        // 获取科目和题型
        Subject subject = subjectRepository.findByName(request.getSubject());
        QuestionType questionType = questionTypeRepository.findByName(request.getQuestionType());
        
        if (subject == null || questionType == null) {
            throw new RuntimeException("科目或题型不存在");
        }
        
        // 构建AI提示词
        String prompt = buildGenerationPrompt(request.getSubject(), request.getQuestionType(), request.getQuestionCount(), request.getDomainLimit());
        
        // 记录构建的提示词
        logger.info("=== 构建的AI提示词 ===");
        logger.info("科目: {}", request.getSubject());
        logger.info("题型: {}", request.getQuestionType());
        logger.info("数量: {}", request.getQuestionCount());
        logger.info("领域限制: {}", request.getDomainLimit());
        logger.info("完整提示词:\n{}", prompt);
        
        // 调用AI服务生成题目
        List<String> generatedContents = aiService.generateQuestions(prompt);
        
        logger.info("AI生成了 {} 道题目", generatedContents.size());
        
        // 保存生成的题目
        List<Question> questions = new ArrayList<>();
        for (String content : generatedContents) {
            // 解析题目内容，分离题目、答案和解析
            QuestionContent parsedContent = parseQuestionContent(content);
            
            Question question = new Question();
            question.setSubject(subject);
            question.setQuestionType(questionType);
            question.setContent(parsedContent.getQuestionContent());
            question.setAnswer(parsedContent.getAnswer());
            question.setAnalysis(parsedContent.getAnalysis());
            question.setDifficulty(3); // 默认难度
            question.setIsInBank(false);
            question.setIsInExam(false);
            
            questions.add(questionRepository.save(question));
        }
        
        return questions;
    }
    
    @Override
    public Question saveToBank(Long questionId) {
        Question question = getQuestionById(questionId);
        question.setIsInBank(true);
        return questionRepository.save(question);
    }
    
    @Override
    public Question removeFromBank(Long questionId) {
        Question question = getQuestionById(questionId);
        question.setIsInBank(false);
        return questionRepository.save(question);
    }
    
    @Override
    public Question addToExam(Long questionId) {
        Question question = getQuestionById(questionId);
        question.setIsInExam(true);
        return questionRepository.save(question);
    }
    
    @Override
    public Question removeFromExam(Long questionId) {
        Question question = getQuestionById(questionId);
        question.setIsInExam(false);
        return questionRepository.save(question);
    }
    
    @Override
    public Question modifyQuestion(QuestionModificationRequest request) {
        Question question = getQuestionById(request.getQuestionId());

        // 调用AI服务修改题目，传入原题目和修改要求
        String modifiedContent = aiService.modifyQuestion(question.getContent(), request.getModificationRequest());

        // 更新题目内容，不保存修改要求
        question.setContent(modifiedContent);

        return questionRepository.save(question);
    }

    @Override
    public Question editQuestion(QuestionEditRequest request) {
        // 获取要编辑的题目
        Question question = getQuestionById(request.getId());

        // 获取科目和题型
        Subject subject = subjectRepository.findById(request.getSubjectId())
                .orElseThrow(() -> new RuntimeException("科目不存在"));
        QuestionType questionType = questionTypeRepository.findById(request.getQuestionTypeId())
                .orElseThrow(() -> new RuntimeException("题型不存在"));

        // 更新题目信息
        question.setContent(request.getContent());
        question.setAnswer(request.getAnswer());
        question.setAnalysis(request.getAnalysis());
        question.setDifficulty(request.getDifficulty());
        question.setSubject(subject);
        question.setQuestionType(questionType);

        // 保存并返回
        return questionRepository.save(question);
    }
    
    @Override
    public void deleteQuestion(Long questionId) {
        questionRepository.deleteById(questionId);
    }
    
    @Override
    public List<Question> getBankQuestions() {
        return questionRepository.findByIsInBankTrue();
    }
    
    @Override
    public List<Question> getExamQuestions() {
        return questionRepository.findByIsInExamTrue();
    }
    
    @Override
    public Question getQuestionById(Long questionId) {
        return questionRepository.findById(questionId)
                .orElseThrow(() -> new RuntimeException("题目不存在"));
    }
    
    private String buildGenerationPrompt(String subject, String questionType, Integer questionCount, String domainLimit) {
        StringBuilder prompt = new StringBuilder();
        
        // 构建基础提示词
        if (domainLimit != null && !domainLimit.trim().isEmpty()) {
            prompt.append(String.format("请生成%d道%s科目的%s类型题目，题目内容必须限定在%s领域内。\n\n", 
                questionCount, subject, questionType, domainLimit.trim()));
        } else {
            prompt.append(String.format("请生成%d道%s科目的%s类型题目，每道题目必须包含答案和解析。\n\n", 
                questionCount, subject, questionType));
        }
        
        // 根据题型提供具体的格式要求
        switch (questionType) {
            case "选择题":
                prompt.append("选择题格式要求：\n");
                prompt.append("- 每道题目包含题干和4个选项（A、B、C、D）\n");
                prompt.append("- 题干要清晰明确\n");
                prompt.append("- 选项要合理，只有一个正确答案\n");
                prompt.append("- 格式示例：\n");
                prompt.append("1. [题干内容]\n");
                prompt.append("   A. [选项A内容]\n");
                prompt.append("   B. [选项B内容]\n");
                prompt.append("   C. [选项C内容]\n");
                prompt.append("   D. [选项D内容]\n");
                prompt.append("   答案：A\n");
                prompt.append("   解析：[详细解析内容]\n\n");
                break;
                
            case "填空题":
                prompt.append("填空题格式要求：\n");
                prompt.append("- 每道题目包含题干，用下划线或括号表示填空位置\n");
                prompt.append("- 题干要明确填空的要求\n");
                prompt.append("- 格式示例：\n");
                prompt.append("1. [题干内容，用_____表示填空位置]\n");
                prompt.append("   答案：[填空答案]\n");
                prompt.append("   解析：[详细解析内容]\n\n");
                break;
                
            case "判断题":
                prompt.append("判断题格式要求：\n");
                prompt.append("- 每道题目包含题干和判断要求\n");
                prompt.append("- 题干要明确，便于判断对错\n");
                prompt.append("- 格式示例：\n");
                prompt.append("1. [题干内容]（判断对错）\n");
                prompt.append("   答案：对/错\n");
                prompt.append("   解析：[详细解析内容]\n\n");
                break;
                
            case "简答题":
                prompt.append("简答题格式要求：\n");
                prompt.append("- 每道题目包含题干和答题要求\n");
                prompt.append("- 题干要明确答题要点\n");
                prompt.append("- 格式示例：\n");
                prompt.append("1. [题干内容]\n");
                prompt.append("   要求：[答题要求]\n");
                prompt.append("   答案：[标准答案]\n");
                prompt.append("   解析：[详细解析内容]\n\n");
                break;
                
            case "计算题":
                prompt.append("计算题格式要求：\n");
                prompt.append("- 每道题目包含题干和计算要求\n");
                prompt.append("- 题干要提供必要的数值和条件\n");
                prompt.append("- 格式示例：\n");
                prompt.append("1. [题干内容，包含计算条件]\n");
                prompt.append("   要求：[计算要求]\n");
                prompt.append("   答案：[计算结果]\n");
                prompt.append("   解析：[详细解析内容，包含计算步骤]\n\n");
                break;
                
            case "论述题":
                prompt.append("论述题格式要求：\n");
                prompt.append("- 每道题目包含题干和论述要求\n");
                prompt.append("- 题干要明确论述的主题和范围\n");
                prompt.append("- 格式示例：\n");
                prompt.append("1. [题干内容]\n");
                prompt.append("   要求：[论述要求，如字数、要点等]\n");
                prompt.append("   答案：[标准答案要点]\n");
                prompt.append("   解析：[详细解析内容]\n\n");
                break;
                
            default:
                prompt.append("题目格式要求：\n");
                prompt.append("- 每道题目要完整、清晰\n");
                prompt.append("- 符合教学大纲要求\n");
                prompt.append("- 难度适中\n");
                prompt.append("- 格式示例：\n");
                prompt.append("1. [题干内容]\n");
                prompt.append("   答案：[标准答案]\n");
                prompt.append("   解析：[详细解析内容]\n\n");
                break;
        }
        
        // 添加领域限制的具体要求
        if (domainLimit != null && !domainLimit.trim().isEmpty()) {
            prompt.append("领域限制要求：\n");
            prompt.append("- 所有题目必须严格限定在" + domainLimit.trim() + "领域内\n");
            prompt.append("- 题目内容、概念、公式都必须属于该领域\n");
            prompt.append("- 不能涉及其他领域的内容\n");
            prompt.append("- 确保题目的专业性和准确性\n\n");
        }
        
        prompt.append("请严格按照以下要求：\n");
        prompt.append("- 必须生成" + questionCount + "道题目，不能多也不能少\n");
        prompt.append("- 每道题目都要有序号（1. 2. 3. 等）\n");
        prompt.append("- 题目内容要符合" + subject + "科目的教学要求\n");
        prompt.append("- 题目难度要适中，适合学生水平\n");
        prompt.append("- 每道题目必须包含答案和解析部分\n");
        prompt.append("- 答案要准确、简洁\n");
        prompt.append("- 解析要详细、清晰，帮助学生理解\n");
        prompt.append("- 每道题目之间用空行分隔\n");
        prompt.append("- 严格按照上述格式要求生成题目\n");
        
        return prompt.toString();
    }
    
    /**
     * 解析AI生成的题目内容，分离题目、答案和解析
     */
    private QuestionContent parseQuestionContent(String content) {
        QuestionContent result = new QuestionContent();
        
        // 查找答案和解析部分
        String[] parts = content.split("答案：");
        if (parts.length >= 2) {
            result.setQuestionContent(parts[0].trim());
            
            String answerAndAnalysis = parts[1];
            String[] answerParts = answerAndAnalysis.split("解析：");
            
            if (answerParts.length >= 2) {
                result.setAnswer(answerParts[0].trim());
                result.setAnalysis(answerParts[1].trim());
            } else {
                // 只有答案，没有解析
                result.setAnswer(answerAndAnalysis.trim());
                result.setAnalysis("");
            }
        } else {
            // 没有找到答案部分，整个内容作为题目
            result.setQuestionContent(content.trim());
            result.setAnswer("");
            result.setAnalysis("");
        }
        
        return result;
    }
    
    @Override
    public ExamPaperResponse generateExamPaper(ExamPaperGenerationRequest request) {
        // 获取待生成试卷的题目
        List<Question> examQuestions = getExamQuestions();

        if (examQuestions.isEmpty()) {
            throw new RuntimeException("没有题目可以生成试卷");
        }

        // 构建试卷题目列表
        List<ExamQuestion> examQuestionList = new ArrayList<>();

        // 如果有题型分数设置，按题型分配分数
        if (request.getQuestionTypeScores() != null && !request.getQuestionTypeScores().isEmpty()) {
            examQuestionList = generateExamWithTypeScores(examQuestions, request.getQuestionTypeScores());
        } else {
            // 传统方式：平均分配分数
            examQuestionList = generateExamWithEqualScores(examQuestions, request.getTotalScore());
        }



        // 构建试卷响应
        ExamPaperResponse response = new ExamPaperResponse();
        response.setTitle(request.getTitle());
        response.setSubject(request.getSubject());
        response.setTotalScore(request.getTotalScore());
        response.setDuration(request.getDuration());
        response.setQuestions(examQuestionList);


        // 清空所有待生成试卷的题目
        for (Question q : examQuestions) {
            q.setIsInExam(false);
            questionRepository.save(q);
        }

        return response;
    }

    // 按题型分数生成试卷
    private List<ExamQuestion> generateExamWithTypeScores(List<Question> examQuestions, List<QuestionTypeScore> typeScores) {
        List<ExamQuestion> examQuestionList = new ArrayList<>();

        // 创建题型分数映射
        Map<String, QuestionTypeScore> typeScoreMap = typeScores.stream()
                .collect(Collectors.toMap(QuestionTypeScore::getQuestionType, ts -> ts));

        // 按题型分组
        Map<String, List<Question>> questionsByType = examQuestions.stream()
                .collect(Collectors.groupingBy(q -> q.getQuestionType().getName()));

        // 为每个题型的题目分配分数
        for (Map.Entry<String, List<Question>> entry : questionsByType.entrySet()) {
            String questionType = entry.getKey();
            List<Question> questions = entry.getValue();

            QuestionTypeScore typeScore = typeScoreMap.get(questionType);
            if (typeScore != null) {
                int scorePerQuestion = typeScore.getScorePerQuestion();

                for (Question question : questions) {
                    ExamQuestion examQuestion = new ExamQuestion();
                    examQuestion.setId(question.getId());
                    examQuestion.setQuestionType(question.getQuestionType().getName());
                    examQuestion.setContent(question.getContent());
                    examQuestion.setScore(scorePerQuestion);

                    examQuestionList.add(examQuestion);
                }
            } else {
                // 如果没有设置该题型的分数，使用默认分数1分
                for (Question question : questions) {
                    ExamQuestion examQuestion = new ExamQuestion();
                    examQuestion.setId(question.getId());
                    examQuestion.setQuestionType(question.getQuestionType().getName());
                    examQuestion.setContent(question.getContent());
                    examQuestion.setScore(1);

                    examQuestionList.add(examQuestion);
                }
            }
        }

        return examQuestionList;
    }

    // 传统方式：平均分配分数
    private List<ExamQuestion> generateExamWithEqualScores(List<Question> examQuestions, int totalScore) {
        List<ExamQuestion> examQuestionList = new ArrayList<>();

        int questionCount = examQuestions.size();
        int baseScore = totalScore / questionCount;
        int remainder = totalScore % questionCount;

        for (int i = 0; i < examQuestions.size(); i++) {
            Question question = examQuestions.get(i);

            // 计算该题分值（前remainder道题多1分）
            int score = baseScore + (i < remainder ? 1 : 0);

            ExamQuestion examQuestion = new ExamQuestion();
            examQuestion.setId(question.getId());
            examQuestion.setQuestionType(question.getQuestionType().getName());
            examQuestion.setContent(question.getContent());
            examQuestion.setScore(score);

            examQuestionList.add(examQuestion);
        }

        return examQuestionList;
    }
    

    
    /**
     * 内部类，用于存储解析后的题目内容
     */
    private static class QuestionContent {
        private String questionContent;
        private String answer;
        private String analysis;
        
        public String getQuestionContent() { return questionContent; }
        public void setQuestionContent(String questionContent) { this.questionContent = questionContent; }
        public String getAnswer() { return answer; }
        public void setAnswer(String answer) { this.answer = answer; }
        public String getAnalysis() { return analysis; }
        public void setAnalysis(String analysis) { this.analysis = analysis; }
    }
    
    @Override
    public List<Question> searchBankQuestions(Long subjectId, Long questionTypeId, String keyword) {
        return questionRepository.searchBankQuestions(subjectId, questionTypeId, keyword);
    }

    @Override
    public List<Question> getBankQuestionsGroupedBySubject() {
        return questionRepository.findBankQuestionsGroupedBySubject();
    }

    @Override
    public List<QuestionTypeScore> analyzeQuestionTypes() {
        List<Question> examQuestions = getExamQuestions();

        if (examQuestions.isEmpty()) {
            return new ArrayList<>();
        }

        // 按题型分组统计
        Map<String, List<Question>> questionsByType = examQuestions.stream()
                .collect(Collectors.groupingBy(q -> q.getQuestionType().getName()));

        List<QuestionTypeScore> result = new ArrayList<>();
        for (Map.Entry<String, List<Question>> entry : questionsByType.entrySet()) {
            String questionType = entry.getKey();
            int questionCount = entry.getValue().size();

            QuestionTypeScore typeScore = new QuestionTypeScore();
            typeScore.setQuestionType(questionType);
            typeScore.setQuestionCount(questionCount);
            typeScore.setScorePerQuestion(1); // 默认每题1分
            typeScore.setTotalScore(questionCount); // 默认总分等于题目数量

            result.add(typeScore);
        }

        return result;
    }
} 