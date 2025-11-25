package com.dashboard.controller;

import com.dashboard.dto.request.UpdateProfileRequest;
import com.dashboard.dto.response.ApiResponse;
import com.dashboard.entity.User;
import com.dashboard.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@Tag(name = "User", description = "User profile management endpoints")
public class UserController {

    private final UserService userService;

    @GetMapping("/profile")
    @Operation(summary = "Get current user profile", description = "Returns the profile of the authenticated user")
    public ResponseEntity<ApiResponse<User>> getProfile() {
        User user = userService.getCurrentUserProfile();
        return ResponseEntity.ok(ApiResponse.success("Profile retrieved successfully", user));
    }

    @PutMapping("/profile")
    @Operation(summary = "Update user profile", description = "Updates the profile information (name, phone, bio)")
    public ResponseEntity<ApiResponse<User>> updateProfile(@Valid @RequestBody UpdateProfileRequest request) {
        User user = userService.updateProfile(request);
        return ResponseEntity.ok(ApiResponse.success("Profile updated successfully", user));
    }
}