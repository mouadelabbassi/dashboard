package com.dashboard.controller;

import com.dashboard.dto.request.LoginRequest;
import com.dashboard.dto.request.RegisterRequest;
import com.dashboard.dto.response.ApiResponse;
import com.dashboard.dto.response.AuthResponse;
import com.dashboard.entity.User;
import com.dashboard.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "Authentication and user management endpoints")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    @Operation(summary = "Register a new user", description = "Creates a new user account with role and security question")
    public ResponseEntity<ApiResponse<AuthResponse>> register(@Valid @RequestBody RegisterRequest request) {
        AuthResponse authResponse = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("User registered successfully", authResponse));
    }

    @PostMapping("/login")
    @Operation(summary = "User login", description = "Authenticates user and returns JWT token")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse authResponse = authService.login(request);
        return ResponseEntity.ok(ApiResponse.success("Login successful", authResponse));
    }

    @PostMapping("/forgot-password")
    @Operation(summary = "Get security question", description = "Returns security question for password reset")
    public ResponseEntity<ApiResponse<Map<String, String>>> forgotPassword(@RequestParam String email) {
        Map<String, String> response = authService.getSecurityQuestion(email);
        return ResponseEntity.ok(ApiResponse.success("Security question retrieved", response));
    }

    @PostMapping("/reset-password")
    @Operation(summary = "Reset password", description = "Resets password after verifying security answer")
    public ResponseEntity<ApiResponse<String>> resetPassword(
            @RequestParam String email,
            @RequestParam String securityAnswer,
            @RequestParam String newPassword) {

        authService.resetPassword(email, securityAnswer, newPassword);
        return ResponseEntity.ok(ApiResponse.success("Password reset successful",
                "You can now login with your new password"));
    }

    @PostMapping("/refresh")
    @Operation(summary = "Refresh JWT token", description = "Generates a new JWT token for authenticated user")
    public ResponseEntity<ApiResponse<AuthResponse>> refreshToken() {
        AuthResponse authResponse = authService.refreshToken();
        return ResponseEntity.ok(ApiResponse.success("Token refreshed successfully", authResponse));
    }

    @GetMapping("/me")
    @Operation(summary = "Get current user", description = "Returns the currently authenticated user's information")
    public ResponseEntity<ApiResponse<User>> getCurrentUser() {
        User user = authService.getCurrentUser();
        return ResponseEntity.ok(ApiResponse.success("User retrieved successfully", user));
    }

    @GetMapping("/roles")
    @Operation(summary = "Get available roles", description = "Returns list of available user roles with descriptions")
    public ResponseEntity<ApiResponse<Map<String, String>>> getAvailableRoles() {
        Map<String, String> roles = Map.of(
                "BUYER", User.Role.BUYER.getDescription(),
                "ANALYST", User.Role.ANALYST.getDescription(),
                "ADMIN", User.Role.ADMIN.getDescription()
        );
        return ResponseEntity.ok(ApiResponse.success("Roles retrieved successfully", roles));
    }
}