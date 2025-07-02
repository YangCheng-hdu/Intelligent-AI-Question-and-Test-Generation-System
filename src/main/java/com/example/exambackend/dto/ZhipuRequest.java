package com.example.exambackend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ZhipuRequest {
    
    @JsonProperty("model")
    private String model;
    
    @JsonProperty("messages")
    private List<Message> messages;
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Message {
        @JsonProperty("role")
        private String role;
        
        @JsonProperty("content")
        private String content;
    }
} 