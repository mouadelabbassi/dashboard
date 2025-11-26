package com.dashboard.controller;

import com. dashboard.dto.response.ApiResponse;
import com.dashboard.dto. response.NotificationResponse;
import com. dashboard.service.NotificationService;
import io.swagger.v3. oas.annotations.Operation;
import io. swagger.v3. oas.annotations. Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain. PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security. access.prepost. PreAuthorize;
import org.springframework.web.bind. annotation.*;

import java.util.List;
import java.util. Map;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'ANALYST')")
@Tag(name = "Notifications", description = "Notification management endpoints for admins")
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    @Operation(summary = "Get all notifications", description = "Returns all notifications for admins")
    public ResponseEntity<ApiResponse<List<NotificationResponse>>> getAllNotifications() {
        List<NotificationResponse> notifications = notificationService.getAllNotifications();
        return ResponseEntity.ok(ApiResponse.success("Notifications retrieved successfully", notifications));
    }

    @GetMapping("/paged")
    @Operation(summary = "Get notifications paginated", description = "Returns paginated notifications")
    public ResponseEntity<ApiResponse<Page<NotificationResponse>>> getNotificationsPaged(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        Page<NotificationResponse> notifications = notificationService
                .getAllNotificationsPaged(PageRequest.of(page, size));
        return ResponseEntity.ok(ApiResponse.success("Notifications retrieved successfully", notifications));
    }

    @GetMapping("/unread")
    @Operation(summary = "Get unread notifications", description = "Returns all unread notifications")
    public ResponseEntity<ApiResponse<List<NotificationResponse>>> getUnreadNotifications() {
        List<NotificationResponse> notifications = notificationService. getUnreadNotifications();
        return ResponseEntity.ok(ApiResponse.success("Unread notifications retrieved successfully", notifications));
    }

    @GetMapping("/unread/count")
    @Operation(summary = "Get unread count", description = "Returns the count of unread notifications")
    public ResponseEntity<ApiResponse<Map<String, Long>>> getUnreadCount() {
        Long count = notificationService.getUnreadCount();
        return ResponseEntity.ok(ApiResponse.success("Count retrieved successfully", Map.of("count", count)));
    }

    @PatchMapping("/{id}/read")
    @Operation(summary = "Mark as read", description = "Marks a notification as read")
    public ResponseEntity<ApiResponse<NotificationResponse>> markAsRead(
            @Parameter(description = "Notification ID") @PathVariable Long id) {

        NotificationResponse notification = notificationService.markAsRead(id);
        return ResponseEntity. ok(ApiResponse. success("Notification marked as read", notification));
    }

    @PatchMapping("/read-all")
    @Operation(summary = "Mark all as read", description = "Marks all notifications as read")
    public ResponseEntity<ApiResponse<Void>> markAllAsRead() {
        notificationService.markAllAsRead();
        return ResponseEntity. ok(ApiResponse. success("All notifications marked as read", null));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete notification", description = "Deletes a notification")
    public ResponseEntity<ApiResponse<Void>> deleteNotification(
            @Parameter(description = "Notification ID") @PathVariable Long id) {

        notificationService.deleteNotification(id);
        return ResponseEntity.ok(ApiResponse.success("Notification deleted successfully", null));
    }
}