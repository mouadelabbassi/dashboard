package com.dashboard.repository;

import com.dashboard.entity. User;
import org.springframework. data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework. data.jpa.repository. Modifying;
import org.springframework.data.jpa.repository. Query;
import org.springframework. data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    Optional<User> findByEmailAndIsActiveTrue(String email);

    boolean existsByEmail(String email);

    Page<User> findByRole(User.Role role, Pageable pageable);

    List<User> findByRoleAndIsActiveTrue(User.Role role);

    List<User> findAllByRole(User.Role role);

    Long countByRole(User.Role role);

    List<User> findByRole(User.Role role);

    Page<User> findByRoleAndIsActiveTrue(User.Role role, Pageable pageable);

    Page<User> findByRoleAndIsVerifiedSellerAndIsActiveTrue(User.Role role, Boolean isVerifiedSeller, Pageable pageable);

}