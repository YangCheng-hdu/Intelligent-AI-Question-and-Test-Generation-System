package com.example.exambackend.repository;

import com.example.exambackend.entity.QuestionType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface QuestionTypeRepository extends JpaRepository<QuestionType, Long> {
    QuestionType findByName(String name);
} 