package com.dashboard.repository;

import com.dashboard.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Long> {

    Optional<Category> findByName(String name);

    Boolean existsByName(String name);

    @Query("SELECT c FROM Category c ORDER BY c.productCount DESC")
    List<Category> findAllOrderByProductCountDesc();

    @Query("SELECT c FROM Category c WHERE c.productCount > 0 ORDER BY c.name")
    List<Category> findCategoriesWithProducts();
}