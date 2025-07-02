package com.example.exambackend.service;

import com.example.exambackend.entity.Subject;
import com.example.exambackend.entity.QuestionType;
import com.example.exambackend.repository.SubjectRepository;
import com.example.exambackend.repository.QuestionTypeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.List;

@Service
public class DataInitService implements CommandLineRunner {

    @Autowired
    private SubjectRepository subjectRepository;

    @Autowired
    private QuestionTypeRepository questionTypeRepository;

    @Override
    public void run(String... args) throws Exception {
        initSubjects();
        initQuestionTypes();
    }

    private void initSubjects() {
        if (subjectRepository.count() == 0) {
            List<Subject> subjects = Arrays.asList(
                new Subject(null, "数学", "数学科目"),
                new Subject(null, "语文", "语文科目"),
                new Subject(null, "英语", "英语科目"),
                new Subject(null, "物理", "物理科目"),
                new Subject(null, "化学", "化学科目"),
                new Subject(null, "生物", "生物科目"),
                new Subject(null, "历史", "历史科目"),
                new Subject(null, "地理", "地理科目"),
                new Subject(null, "政治", "政治科目")
            );
            subjectRepository.saveAll(subjects);
        }
    }

    private void initQuestionTypes() {
        if (questionTypeRepository.count() == 0) {
            List<QuestionType> questionTypes = Arrays.asList(
                new QuestionType(null, "选择题", "单选题或多选题"),
                new QuestionType(null, "填空题", "填空题"),
                new QuestionType(null, "简答题", "简答题"),
                new QuestionType(null, "计算题", "计算题"),
                new QuestionType(null, "论述题", "论述题"),
                new QuestionType(null, "判断题", "判断题")
            );
            questionTypeRepository.saveAll(questionTypes);
        }
    }
}