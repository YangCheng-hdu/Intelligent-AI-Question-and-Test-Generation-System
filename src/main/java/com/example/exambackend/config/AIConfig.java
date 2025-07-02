package com.example.exambackend.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import lombok.Data;

@Configuration
@Data
public class AIConfig {
    
    @Value("${ai.zhipu.api.key:54feee71b7a24522a656162c30699efe.gC7LHwHgI0ypmtnG}")
    private String apiKey;
    
    @Value("${ai.zhipu.api.url:https://open.bigmodel.cn/api/paas/v4/chat/completions}")
    private String apiUrl;
    
    @Value("${ai.zhipu.model:glm-4-plus}")
    private String model;
} 