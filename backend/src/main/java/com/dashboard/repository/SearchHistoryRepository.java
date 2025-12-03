package com.dashboard.repository;

import com.dashboard.entity.SearchHistory;
import com.dashboard.entity.User;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface SearchHistoryRepository extends JpaRepository<SearchHistory, Long> {

    List<SearchHistory> findByUserOrderByCreatedAtDesc(User user, Pageable pageable);

    @Query("SELECT sh.query FROM SearchHistory sh WHERE sh.user = :user GROUP BY sh.query ORDER BY MAX(sh.createdAt) DESC")
    List<String> findRecentQueriesByUser(@Param("user") User user, Pageable pageable);

    @Query("SELECT sh.query FROM SearchHistory sh WHERE sh.createdAt > :since GROUP BY sh.query ORDER BY COUNT(sh) DESC")
    List<String> findTrendingQueries(@Param("since") LocalDateTime since, Pageable pageable);

    @Query("SELECT sh.query FROM SearchHistory sh WHERE LOWER(sh.query) LIKE LOWER(CONCAT(:prefix, '%')) GROUP BY sh.query ORDER BY COUNT(sh) DESC")
    List<String> findSuggestionsByPrefix(@Param("prefix") String prefix, Pageable pageable);

    void deleteByUserAndCreatedAtBefore(User user, LocalDateTime before);
}