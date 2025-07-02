package com.example.exambackend.repository;

import com.example.exambackend.entity.Question;
import com.example.exambackend.entity.Subject;
import com.example.exambackend.entity.QuestionType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface QuestionRepository extends JpaRepository<Question, Long> {
    
    List<Question> findBySubject(Subject subject);
    
    List<Question> findByQuestionType(QuestionType questionType);
    
    List<Question> findBySubjectAndQuestionType(Subject subject, QuestionType questionType);
    
    List<Question> findByIsInBankTrue();
    
    List<Question> findByIsInExamTrue();
    
    @Query("SELECT q FROM Question q WHERE q.subject = :subject AND q.questionType = :questionType AND q.isInBank = true")
    List<Question> findBankQuestionsBySubjectAndType(@Param("subject") Subject subject, @Param("questionType") QuestionType questionType);

    // 按题干、科目、题型模糊搜索
    @Query("SELECT q FROM Question q WHERE (:subjectId IS NULL OR q.subject.id = :subjectId) AND (:questionTypeId IS NULL OR q.questionType.id = :questionTypeId) AND (:keyword IS NULL OR q.content LIKE %:keyword%) AND q.isInBank = true")
    List<Question> searchBankQuestions(@Param("subjectId") Long subjectId, @Param("questionTypeId") Long questionTypeId, @Param("keyword") String keyword);

    // 按科目分组查询题库题目
    @Query("SELECT q FROM Question q WHERE q.isInBank = true ORDER BY q.subject.id, q.questionType.id")
    List<Question> findBankQuestionsGroupedBySubject();
} 