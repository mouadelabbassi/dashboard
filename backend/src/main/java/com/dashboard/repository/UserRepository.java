package com.dashboard. repository;

import com.dashboard.entity. User;
import org.springframework.data. domain.Page;
import org.springframework. data.domain. Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository. query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util. Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    Optional<User> findByEmailAndIsActiveTrue(String email);

    boolean existsByEmail(String email);

    Page<User> findByRole(User.Role role, Pageable pageable);

    List<User> findByRoleAndIsActiveTrue(User.Role role);

    Long countByRole(User. Role role);

    Long countByRoleAndIsActiveTrue(User.Role role);

    @Query("SELECT u FROM User u WHERE u.role = 'SELLER' AND u.isVerifiedSeller = true ORDER BY u.createdAt DESC")
    List<User> findVerifiedSellers(Pageable pageable);

    @Query("SELECT u FROM User u WHERE u.role = 'SELLER' ORDER BY u.createdAt DESC")
    Page<User> findAllSellers(Pageable pageable);

    @Query("SELECT COUNT(u) FROM User u WHERE u.role = 'SELLER'")
    Long countSellers();

    @Query("SELECT COUNT(u) FROM User u WHERE u.role = 'BUYER'")
    Long countBuyers();

    @Query("SELECT u FROM User u WHERE LOWER(u.fullName) LIKE LOWER(CONCAT('%', :query, '%')) OR LOWER(u. email) LIKE LOWER(CONCAT('%', :query, '%'))")
    Page<User> searchUsers(@Param("query") String query, Pageable pageable);
}