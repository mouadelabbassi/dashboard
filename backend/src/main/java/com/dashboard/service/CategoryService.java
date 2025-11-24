package com.dashboard.service;

import com.dashboard.dto.response.CategoryResponse;
import com.dashboard.dto.response.CategoryStatsResponse;
import com.dashboard.entity.Category;
import com.dashboard.exception.DuplicateResourceException;
import com.dashboard.exception.ResourceNotFoundException;
import com.dashboard.repository.CategoryRepository;
import com.dashboard.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;

    @Transactional(readOnly = true)
    public List<CategoryResponse> getAllCategories() {
        log.debug("Fetching all categories");

        return categoryRepository.findAll().stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public CategoryResponse getCategoryById(Long id) {
        log.debug("Fetching category with id: {}", id);

        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category", "id", id));

        return convertToResponse(category);
    }

    @Transactional(readOnly = true)
    public List<CategoryResponse> getCategoriesWithProducts() {
        log.debug("Fetching categories with products");

        return categoryRepository.findCategoriesWithProducts().stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public CategoryResponse createCategory(String name, String description) {
        log.info("Creating new category: {}", name);

        if (categoryRepository.existsByName(name)) {
            throw new DuplicateResourceException("Category already exists: " + name);
        }

        Category category = Category.builder()
                .name(name)
                .description(description)
                .productCount(0)
                .build();

        category = categoryRepository.save(category);
        log.info("Category created successfully: {}", category.getName());

        return convertToResponse(category);
    }

    @Transactional
    public CategoryResponse updateCategory(Long id, String name, String description) {
        log.info("Updating category with id: {}", id);

        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category", "id", id));

        if (name != null && !name.equals(category.getName())) {
            if (categoryRepository.existsByName(name)) {
                throw new DuplicateResourceException("Category name already exists: " + name);
            }
            category.setName(name);
        }

        if (description != null) {
            category.setDescription(description);
        }

        category = categoryRepository.save(category);
        log.info("Category updated successfully: {}", category.getName());

        return convertToResponse(category);
    }

    @Transactional
    public void deleteCategory(Long id) {
        log.info("Deleting category with id: {}", id);

        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category", "id", id));

        categoryRepository.delete(category);
        log.info("Category deleted successfully: {}", category.getName());
    }

    @Transactional(readOnly = true)
    public CategoryStatsResponse getCategoryStats(Long id) {
        log.debug("Fetching statistics for category: {}", id);

        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category", "id", id));

        // This is a simplified version - you can enhance with actual aggregated data
        return CategoryStatsResponse.builder()
                .categoryName(category.getName())
                .productCount((long) category.getProductCount())
                .totalRevenue(BigDecimal.ZERO) // Can be calculated from sales
                .avgPrice(BigDecimal.ZERO) // Can be calculated from products
                .avgRating(BigDecimal.ZERO) // Can be calculated from products
                .build();
    }

    private CategoryResponse convertToResponse(Category category) {
        return CategoryResponse.builder()
                .id(category.getId())
                .name(category.getName())
                .description(category.getDescription())
                .productCount(category.getProductCount())
                .createdAt(category.getCreatedAt())
                .updatedAt(category.getUpdatedAt())
                .build();
    }
}