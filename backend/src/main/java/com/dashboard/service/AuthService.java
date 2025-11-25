package com.dashboard.service;

import com.dashboard.dto.request.LoginRequest;
import com.dashboard.dto.request.RegisterRequest;
import com.dashboard.dto.response.AuthResponse;
import com.dashboard.entity.User;
import com.dashboard.exception.BadRequestException;
import com.dashboard.exception.DuplicateResourceException;
import com.dashboard.repository.UserRepository;
import com.dashboard.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider tokenProvider;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        log.info("Registering new user with email: {}", request.getEmail());

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateResourceException("Email already exists: " + request.getEmail());
        }

        User.Role role;
        try {
            role = User.Role.valueOf(request.getRole().toUpperCase());
        } catch (IllegalArgumentException e) {
            // Default to BUYER instead of USER (which doesn't exist)
            role = User.Role.BUYER;
        }

        User user = User.builder()
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName())
                .role(role)
                .securityQuestion(request.getSecurityQuestion())
                .securityAnswer(passwordEncoder.encode(request.getSecurityAnswer()))
                .isActive(true)
                .build();

        user = userRepository.save(user);
        log.info("User registered successfully: {}", user.getEmail());

        // Auto login after registration
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        String token = tokenProvider.generateToken(authentication);

        return AuthResponse.builder()
                .token(token)
                .id(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole().name())
                .build();
    }

    public AuthResponse login(LoginRequest request) {
        log.info("User login attempt: {}", request.getEmail());

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String token = tokenProvider.generateToken(authentication);

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new BadRequestException("User not found"));

        log.info("User logged in successfully: {}", user.getEmail());

        return AuthResponse.builder()
                .token(token)
                .id(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole().name())
                .build();
    }

    /**
     * Get security question for password reset
     */
    public Map<String, String> getSecurityQuestion(String email) {
        log.info("Getting security question for email: {}", email);

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BadRequestException("User not found with email: " + email));

        if (user.getSecurityQuestion() == null || user.getSecurityQuestion().isEmpty()) {
            throw new BadRequestException("No security question set for this account");
        }

        Map<String, String> response = new HashMap<>();
        response.put("email", user.getEmail());
        response.put("securityQuestion", user.getSecurityQuestion());

        return response;
    }

    /**
     * Reset password after verifying security answer
     */
    @Transactional
    public void resetPassword(String email, String securityAnswer, String newPassword) {
        log.info("Password reset attempt for email: {}", email);

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BadRequestException("User not found with email: " + email));

        if (user.getSecurityAnswer() == null) {
            throw new BadRequestException("No security answer set for this account");
        }

        // Verify security answer
        if (!passwordEncoder.matches(securityAnswer, user.getSecurityAnswer())) {
            throw new BadRequestException("Incorrect security answer");
        }

        // Validate new password
        if (newPassword == null || newPassword.length() < 6) {
            throw new BadRequestException("Password must be at least 6 characters long");
        }

        // Update password
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        log.info("Password reset successfully for user: {}", email);
    }

    public AuthResponse refreshToken() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BadRequestException("User not found"));

        String token = tokenProvider.generateTokenFromUsername(email);

        return AuthResponse.builder()
                .token(token)
                .id(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole().name())
                .build();
    }

    public User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();

        return userRepository.findByEmail(email)
                .orElseThrow(() -> new BadRequestException("User not found"));
    }
}