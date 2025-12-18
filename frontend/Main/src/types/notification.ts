export interface Notification {
    id: number;
    type: string;
    typeDescription: string;
    title: string;
    message: string;
    referenceId: string;
    referenceType: string;
    actionUrl: string;
    isRead: boolean;
    readAt: string | null;
    createdAt: string;
}

export interface NotificationState {
    notifications: Notification[];
    unreadCount: number;
    loading: boolean;
    error: string | null;
}