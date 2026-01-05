package com.dashboard.repository;

import com.dashboard.entity.BannedEmail;
import org.springframework.data.jpa.repository. JpaRepository;
import org. springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface BannedEmailRepository extends JpaRepository<BannedEmail, Long> {

    boolean existsByEmail(String email);

    Optional<BannedEmail> findByEmail(String email);
}