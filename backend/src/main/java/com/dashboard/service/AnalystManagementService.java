package com.dashboard.service;

import com.dashboard.dto.request.AnalystRequest;
import com.dashboard.dto.request.AnalystUpdateRequest;
import com.dashboard.dto.response.AnalystResponse;
import com.dashboard.entity.User;
import com.dashboard.exception.BadRequestException;
import com.dashboard.exception.ResourceNotFoundException;
import com.dashboard.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AnalystManagementService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    /**
     * Get current admin user
     */
    private User getCurrentAdmin() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Admin not found"));
    }

    /**
     * Verify current user is admin
     */
    private void verifyAdmin() {
        User admin = getCurrentAdmin();
        if (admin.getRole() != User.Role.ADMIN) {
            throw new BadRequestException("Only admins can manage analysts");
        }
    }

    /**
     * Get all analysts with pagination
     */
    @Transactional(readOnly = true)
    public Page<AnalystResponse> getAllAnalysts(Pageable pageable) {
        verifyAdmin();
        log.info("Fetching all analysts with pagination");

        Page<User> analysts = userRepository.findByRole(User.Role.ANALYST, pageable);
        return analysts.map(this::convertToResponse);
    }

    /**
     * Get all analysts (no pagination)
     */
    @Transactional(readOnly = true)
    public List<AnalystResponse> getAllAnalysts() {
        verifyAdmin();
        log.info("Fetching all analysts");

        List<User> analysts = userRepository.findAllByRole(User.Role.ANALYST);
        return analysts.stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Get analyst by ID
     */
    @Transactional(readOnly = true)
    public AnalystResponse getAnalystById(Long analystId) {
        verifyAdmin();
        log.info("Fetching analyst with ID: {}", analystId);

        User analyst = userRepository.findById(analystId)
                .orElseThrow(() -> new ResourceNotFoundException("Analyst", "id", analystId));

        if (analyst.getRole() != User.Role.ANALYST) {
            throw new BadRequestException("User is not an analyst");
        }

        return convertToResponse(analyst);
    }

    /**
     * Create new analyst
     */
    @Transactional
    public AnalystResponse createAnalyst(AnalystRequest request) {
        verifyAdmin();
        User admin = getCurrentAdmin();

        log.info("Admin {} creating new analyst with email: {}", admin.getEmail(), request.getEmail());

        // Check if email already exists
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new BadRequestException("Email already registered");
        }

        // Create analyst user
        User analyst = User.builder()
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName())
                .phone(request.getPhone())
                .bio(request.getBio())
                .role(User.Role.ANALYST)
                .isActive(request.getIsActive() != null ? request.getIsActive() : true)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        analyst = userRepository.save(analyst);

        log.info("Analyst created successfully: {} (ID: {})", analyst.getEmail(), analyst.getId());

        return convertToResponse(analyst);
    }

    /**
     * Update analyst
     */
    @Transactional
    public AnalystResponse updateAnalyst(Long analystId, AnalystUpdateRequest request) {
        verifyAdmin();
        User admin = getCurrentAdmin();

        log.info("Admin {} updating analyst ID: {}", admin.getEmail(), analystId);

        User analyst = userRepository.findById(analystId)
                .orElseThrow(() -> new ResourceNotFoundException("Analyst", "id", analystId));

        if (analyst.getRole() != User.Role.ANALYST) {
            throw new BadRequestException("User is not an analyst");
        }

        // Update fields if provided
        if (request.getEmail() != null && !request.getEmail().equals(analyst.getEmail())) {
            // Check if new email is already taken
            if (userRepository.findByEmail(request.getEmail()).isPresent()) {
                throw new BadRequestException("Email already in use");
            }
            analyst.setEmail(request.getEmail());
        }

        if (request.getPassword() != null && !request.getPassword().isEmpty()) {
            analyst.setPassword(passwordEncoder.encode(request.getPassword()));
        }

        if (request.getFullName() != null) {
            analyst.setFullName(request.getFullName());
        }

        if (request.getPhone() != null) {
            analyst.setPhone(request.getPhone());
        }

        if (request.getBio() != null) {
            analyst.setBio(request.getBio());
        }

        if (request.getIsActive() != null) {
            analyst.setIsActive(request.getIsActive());
        }

        if (request.getProfileImage() != null) {
            analyst.setProfileImage(request.getProfileImage());
        }

        analyst.setUpdatedAt(LocalDateTime.now());
        analyst = userRepository.save(analyst);

        log.info("Analyst updated successfully: {}", analyst.getEmail());

        return convertToResponse(analyst);
    }

    /**
     * Delete analyst
     */
    @Transactional
    public void deleteAnalyst(Long analystId) {
        verifyAdmin();
        User admin = getCurrentAdmin();

        log.info("Admin {} deleting analyst ID: {}", admin.getEmail(), analystId);

        User analyst = userRepository.findById(analystId)
                .orElseThrow(() -> new ResourceNotFoundException("Analyst", "id", analystId));

        if (analyst.getRole() != User.Role.ANALYST) {
            throw new BadRequestException("User is not an analyst");
        }

        userRepository.delete(analyst);

        log.info("Analyst deleted successfully: {}", analyst.getEmail());
    }

    /**
     * Toggle analyst active status
     */
    @Transactional
    public AnalystResponse toggleAnalystStatus(Long analystId) {
        verifyAdmin();
        User admin = getCurrentAdmin();

        log.info("Admin {} toggling status for analyst ID: {}", admin.getEmail(), analystId);

        User analyst = userRepository.findById(analystId)
                .orElseThrow(() -> new ResourceNotFoundException("Analyst", "id", analystId));

        if (analyst.getRole() != User.Role.ANALYST) {
            throw new BadRequestException("User is not an analyst");
        }

        analyst.setIsActive(!analyst.getIsActive());
        analyst.setUpdatedAt(LocalDateTime.now());
        analyst = userRepository.save(analyst);

        log.info("Analyst status toggled: {} -> {}", analyst.getEmail(), analyst.getIsActive());

        return convertToResponse(analyst);
    }

    /**
     * Get analyst statistics
     */
    @Transactional(readOnly = true)
    public AnalystResponse getAnalystStatistics(Long analystId) {
        verifyAdmin();

        User analyst = userRepository.findById(analystId)
                .orElseThrow(() -> new ResourceNotFoundException("Analyst", "id", analystId));

        if (analyst.getRole() != User.Role.ANALYST) {
            throw new BadRequestException("User is not an analyst");
        }

        // TODO: Calculate actual statistics from analyst activities
        // For now, return basic info
        return convertToResponse(analyst);
    }

    /**
     * Convert User entity to AnalystResponse DTO
     */
    private AnalystResponse convertToResponse(User analyst) {
        return AnalystResponse.builder()
                .id(analyst.getId())
                .email(analyst.getEmail())
                .fullName(analyst.getFullName())
                .phone(analyst.getPhone())
                .bio(analyst.getBio())
                .profileImage(analyst.getProfileImage())
                .isActive(analyst.getIsActive())
                .createdAt(analyst.getCreatedAt())
                .updatedAt(analyst.getUpdatedAt())
                // TODO: Add actual statistics
                .totalReportsGenerated(0)
                .totalExportsCreated(0)
                .lastActivityAt(analyst.getUpdatedAt())
                .build();
    }
}