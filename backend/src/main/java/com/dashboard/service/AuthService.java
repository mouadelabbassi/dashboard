package com.dashboard.service;

import com.dashboard.dto.request.LoginRequest;
import com.dashboard.dto.request.RegisterRequest;
import com.dashboard.dto.request.SellerRegisterRequest;
import com.dashboard.dto.response.AuthResponse;
import com. dashboard.entity.User;
import com.dashboard.exception.BadRequestException;
import com.dashboard.repository.UserRepository;
import com.dashboard.security.JwtTokenProvider;
import lombok. RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security. authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core. Authentication;
import org.springframework.security. core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation. Transactional;

import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider jwtTokenProvider;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request. getEmail())) {
            throw new BadRequestException("Email already in use");
        }

        User. Role role;
        try {
            role = User.Role.valueOf(request.getRole().toUpperCase());
        } catch (IllegalArgumentException e) {
            role = User.Role. BUYER;
        }

        // Prevent direct admin registration
        if (role == User.Role. ADMIN) {
            throw new BadRequestException("Cannot register as admin");
        }

        User user = User.builder()
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName())
                .role(role)
                .securityQuestion(request.getSecurityQuestion())
                .securityAnswer(passwordEncoder.encode(request.getSecurityAnswer(). toLowerCase()))
                .build();

        user = userRepository.save(user);
        log.info("User registered: {} with role {}", user.getEmail(), user.getRole());

        String token = jwtTokenProvider.generateToken(user. getEmail(), user.getRole(). name());

        return AuthResponse.builder()
                .token(token)
                . type("Bearer")
                .id(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user. getRole(). name())
                . build();
    }

    @Transactional
    public AuthResponse registerSeller(SellerRegisterRequest request) {
        if (userRepository.existsByEmail(request. getEmail())) {
            throw new BadRequestException("Email already in use");
        }

        User user = User.builder()
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName())
                . phone(request.getPhone())
                .role(User.Role. SELLER)
                .storeName(request.getStoreName())
                .storeDescription(request.getStoreDescription())
                .businessAddress(request.getBusinessAddress())
                . securityQuestion(request. getSecurityQuestion())
                .securityAnswer(passwordEncoder. encode(request.getSecurityAnswer().toLowerCase()))
                .isVerifiedSeller(false)
                .build();

        user = userRepository.save(user);
        log.info("Seller registered: {} - Store: {}", user. getEmail(), user.getStoreName());

        String token = jwtTokenProvider.generateToken(user.getEmail(), user.getRole(). name());

        return AuthResponse.builder()
                .token(token)
                . type("Bearer")
                .id(user.getId())
                .email(user. getEmail())
                .fullName(user.getFullName())
                .role(user.getRole(). name())
                . storeName(user.getStoreName())
                .build();
    }

    public AuthResponse login(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        SecurityContextHolder. getContext().setAuthentication(authentication);

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new BadRequestException("User not found"));

        String token = jwtTokenProvider.generateToken(user.getEmail(), user.getRole(). name());

        log.info("User logged in: {}", user.getEmail());

        return AuthResponse.builder()
                .token(token)
                .type("Bearer")
                .id(user. getId())
                . email(user.getEmail())
                . fullName(user. getFullName())
                .role(user.getRole().name())
                .storeName(user.getStoreName())
                .build();
    }

    public Map<String, String> getSecurityQuestion(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BadRequestException("User not found with this email"));

        return Map.of("securityQuestion", user.getSecurityQuestion());
    }

    @Transactional
    public void resetPassword(String email, String securityAnswer, String newPassword) {
        User user = userRepository.findByEmail(email)
                . orElseThrow(() -> new BadRequestException("User not found"));

        if (! passwordEncoder.matches(securityAnswer. toLowerCase(), user.getSecurityAnswer())) {
            throw new BadRequestException("Incorrect security answer");
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        log. info("Password reset for user: {}", email);
    }

    public AuthResponse refreshToken() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BadRequestException("User not found"));

        String token = jwtTokenProvider. generateToken(user.getEmail(), user.getRole().name());

        return AuthResponse.builder()
                .token(token)
                .type("Bearer")
                .id(user. getId())
                . email(user.getEmail())
                . fullName(user. getFullName())
                .role(user.getRole().name())
                .storeName(user.getStoreName())
                .build();
    }

    public User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext(). getAuthentication();
        String email = authentication.getName();

        return userRepository.findByEmail(email)
                .orElseThrow(() -> new BadRequestException("User not found"));
    }
}