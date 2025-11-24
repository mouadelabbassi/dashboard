package com.dashboard;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@SpringBootApplication
@EnableJpaAuditing
public class DashboardApplication {

    public static void main(String[] args) {
        SpringApplication.run(DashboardApplication.class, args);
        System.out.println("\n" +
                "========================================\n" +
                "  Amazon Dashboard Backend Started! \n" +
                "========================================\n" +
                "  Swagger UI: http://localhost:8080/swagger-ui.html\n" +
                "  API Docs:   http://localhost:8080/api-docs\n" +
                "========================================\n");
    }
}