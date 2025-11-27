package com.dashboard. controller;

import com.dashboard.dto. response.ApiResponse;
import com.dashboard.dto. response.NotificationResponse;
import com. dashboard.service.NotificationService;
import io.swagger.v3.oas. annotations.Operation;
import io.swagger. v3.oas.annotations.security. SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain. Pageable;
import org.springframework. data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util. Map;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Notifications", description = "Notification management endpoints")
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    @Operation(summary = "Get my notifications", description = "Returns paginated list of notifications")
    public ResponseEntity<ApiResponse<Page<NotificationResponse>>> getMyNotifications(
            @PageableDefault(size = 20) Pageable pageable) {
        Page<NotificationResponse> notifications = notificationService.getMyNotifications(pageable);
        return ResponseEntity.ok(ApiResponse.success("Notifications retrieved", notifications));
    }

    @GetMapping("/unread")
    @Operation(summary = "Get unread notifications", description = "Returns all unread notifications")
    public ResponseEntity<ApiResponse<List<NotificationResponse>>> getUnreadNotifications() {
        List<NotificationResponse> notifications = notificationService.getMyUnreadNotifications();
        return ResponseEntity.ok(ApiResponse.success("Unread notifications retrieved", notifications));
    }

    @GetMapping("/unread/count")
    @Operation(summary = "Get unread count", description = "Returns count of unread notifications")
    public ResponseEntity<ApiResponse<Map<String, Long>>> getUnreadCount() {
        Long count = notificationService.getUnreadCount();
        return ResponseEntity.ok(ApiResponse.success("Unread count retrieved", Map.of("count", count)));
    }

    @PutMapping("/{id}/read")
    @Operation(summary = "Mark as read", description = "Marks a notification as read")
    public ResponseEntity<ApiResponse<String>> markAsRead(@PathVariable Long id) {
        notificationService.markAsRead(id);
        return ResponseEntity.ok(ApiResponse.success("Notification marked as read", "Success"));
    }

    @PutMapping("/read-all")
    @Operation(summary = "Mark all as read", description = "Marks all notifications as read")
    public ResponseEntity<ApiResponse<String>> markAllAsRead() {
        notificationService.markAllAsRead();
        return ResponseEntity.ok(ApiResponse.success("All notifications marked as read", "Success"));
    }

    @PutMapping("/read-multiple")
    @Operation(summary = "Mark multiple as read", description = "Marks selected notifications as read")
    public ResponseEntity<ApiResponse<String>> markMultipleAsRead(@RequestBody List<Long> ids) {
        notificationService.markMultipleAsRead(ids);
        return ResponseEntity.ok(ApiResponse.success("Notifications marked as read", "Success"));
    }
}