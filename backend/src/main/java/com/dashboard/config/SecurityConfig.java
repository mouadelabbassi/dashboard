package com.dashboard.config;

import com.dashboard.security.JwtAuthenticationFilter;
import com.dashboard.security. UserDetailsServiceImpl;
import lombok.RequiredArgsConstructor;
import org.springframework.context. annotation.Bean;
import org.springframework. context.annotation.Configuration;
import org. springframework.http.HttpMethod;
import org.springframework. security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security. authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config. annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security. config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation. web.builders.HttpSecurity;
import org.springframework.security.config.annotation. web.configuration.EnableWebSecurity;
import org.springframework. security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org. springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org. springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security. web.SecurityFilterChain;
import org.springframework.security. web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web. cors.CorsConfigurationSource;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthFilter;
    private final UserDetailsServiceImpl userDetailsService;
    private final CorsConfigurationSource corsConfigurationSource; // Inject from CorsConfig

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(cors -> cors. configurationSource(corsConfigurationSource)) // Use injected bean
                .authorizeHttpRequests(auth -> auth
                        // Public endpoints
                        .requestMatchers("/api/auth/**").permitAll()
                        . requestMatchers("/api/public/**").permitAll()
                        .requestMatchers("/swagger-ui/**", "/v3/api-docs/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/products/**").permitAll()
                        .requestMatchers(HttpMethod. GET, "/api/categories/**").permitAll()

                        // Seller endpoints
                        .requestMatchers("/api/seller/**"). hasRole("SELLER")

                        // Admin endpoints
                        .requestMatchers("/api/admin/**"). hasRole("ADMIN")

                        // Authenticated endpoints
                        .anyRequest(). authenticated()
                )
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authenticationProvider(authenticationProvider())
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
        authProvider.setUserDetailsService(userDetailsService);
        authProvider.setPasswordEncoder(passwordEncoder());
        return authProvider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}