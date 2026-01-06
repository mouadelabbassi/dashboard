package com.dashboard.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;

@Configuration
public class MLServiceConfig {

    @Value("${ml.service.url:http://localhost:5001}")
    private String mlServiceUrl;

    @Value("${ml.service.timeout:30}")
    private int timeout;

    @Bean
    public RestTemplate mlRestTemplate(RestTemplateBuilder builder) {
        return builder
                .rootUri(mlServiceUrl)
                .setConnectTimeout(Duration.ofSeconds(timeout))
                .setReadTimeout(Duration.ofSeconds(timeout))
                .build();
    }

    public String getMlServiceUrl() {
        return mlServiceUrl;
    }
}