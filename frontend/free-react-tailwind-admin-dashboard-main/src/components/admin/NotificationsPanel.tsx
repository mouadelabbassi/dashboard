import React, { useEffect, useState, useRef } from 'react';

interface NotificationItem {
    id: number;
    type: string;
    title: string;
    message: string;
    buyerName: string;
    buyerEmail: string;
    orderTotal: string;
    itemsCount: number;
    isRead: boolean;
    createdAt: string;
}

const NotificationsPanel: React.FC = () => {
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const panelRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchNotifications();
        fetchUnreadCount();

        const interval = setInterval(() => {
            fetchUnreadCount();
        }, 30000);

        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document. addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const getAuthHeaders = () => {
        const token = localStorage.getItem('token');
        return {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };
    };

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const response = await fetch('http://localhost:8080/api/notifications', {
                headers: getAuthHeaders()
            });

            if (response.ok) {
                const data = await response.json();
                setNotifications(data. data || []);
            }
        } catch (err) {
            console.error('Error fetching notifications:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchUnreadCount = async () => {
        try {
            const response = await fetch('http://localhost:8080/api/notifications/unread/count', {
                headers: getAuthHeaders()
            });

            if (response.ok) {
                const data = await response.json();
                setUnreadCount(data.data?. count || 0);
            }
        } catch (err) {
            console. error('Error fetching unread count:', err);
        }
    };

    const markAsRead = async (id: number) => {
        try {
            const response = await fetch(`http://localhost:8080/api/notifications/${id}/read`, {
                method: 'PATCH',
                headers: getAuthHeaders()
            });

            if (response.ok) {
                setNotifications(prev =>
                    prev. map(n => n.id === id ?  { ...n, isRead: true } : n)
                );
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
        } catch (err) {
            console. error('Error marking as read:', err);
        }
    };

    const markAllAsRead = async () => {
        try {
            const response = await fetch('http://localhost:8080/api/notifications/read-all', {
                method: 'PATCH',
                headers: getAuthHeaders()
            });

            if (response.ok) {
                setNotifications(prev => prev.map(n => ({ ... n, isRead: true })));
                setUnreadCount(0);
            }
        } catch (err) {
            console.error('Error marking all as read:', err);
        }
    };

    const formatTimeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now. getTime() - date.getTime();

        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;
        return date.toLocaleDateString();
    };

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'NEW_ORDER': return '🛒';
            case 'ORDER_CONFIRMED': return '✅';
            case 'ORDER_CANCELLED': return '❌';
            default: return '🔔';
        }
    };

    return (
        <div className="relative" ref={panelRef}>
            {/* Bell Button */}
            <button
                onClick={() => {
                    setIsOpen(! isOpen);
                    if (! isOpen) fetchNotifications();
                }}
                className="relative flex items-center justify-center w-11 h-11 text-gray-500 bg-white rounded-full border border-gray-200 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
            >
                <svg
                    className="w-5 h-5 fill-current"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M5.25 10.5C5.25 6.77208 8.27208 3.75 12 3.75C15.7279 3.75 18.75 6.77208 18.75 10.5V11.8276C18.75 12.7109 19.0168 13.5732 19.5134 14.2977L20.5765 15.8484C21.4957 17.1895 20.5372 19 18.9154 19H5.08456C3.46276 19 2. 50428 17.1895 3.42353 15.8484L4.48658 14.2977C4.98322 13.5732 5.25 12.7109 5.25 11.8276V10.5ZM12 5.25C9.10051 5.25 6.75 7.60051 6.75 10.5V11.8276C6.75 13.0341 6.38497 14.2108 5.70588 15.2017L4.64282 16.7524C4.41001 17.0919 4.66066 17.5 5.08456 17.5H18.9154C19.3393 17.5 19.59 17.0919 19.3572 16.7524L18.2941 15.2017C17.615 14.2108 17.25 13.0341 17.25 11.8276V10.5C17. 25 7.60051 14.8995 5.25 12 5.25ZM9.5 19.75C9.5 19.3358 9.83579 19 10.25 19H13.75C14. 1642 19 14. 5 19.3358 14.5 19.75C14.5 21.1307 13.3807 22. 25 12 22. 25C10.6193 22.25 9.5 21.1307 9.5 19.75ZM11.5 20.5C11.2613 20.8589 11 20.9687 11 20.75C11 21.3023 11.4477 21.75 12 21.75C12.5523 21.75 13 21.3023 13 20.75C13 20. 9687 12. 7387 20.8589 12. 5 20.5H11.5Z"
                        fill="currentColor"
                    />
                </svg>

                {/* Unread Badge */}
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[20px] h-5 px-1 text-xs font-bold text-white bg-gradient-to-r from-red-500 to-pink-500 rounded-full shadow-lg animate-pulse">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown Panel */}
            {isOpen && (
                <div
                    className="absolute right-0 mt-3 w-[400px] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
                    style={{ zIndex: 999999 }}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-blue-600 to-purple-600">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                                <span className="text-xl">🔔</span>
                            </div>
                            <div>
                                <h3 className="font-bold text-white text-lg">Notifications</h3>
                                {unreadCount > 0 && (
                                    <p className="text-white/80 text-sm">{unreadCount} unread</p>
                                )}
                            </div>
                        </div>
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllAsRead}
                                className="px-3 py-1. 5 bg-white/20 hover:bg-white/30 text-white text-sm font-medium rounded-lg transition-colors"
                            >
                                Mark all read
                            </button>
                        )}
                    </div>

                    {/* Content */}
                    <div className="max-h-[400px] overflow-y-auto">
                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-500 border-t-transparent"></div>
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="py-16 text-center">
                                <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <span className="text-4xl">📭</span>
                                </div>
                                <p className="text-gray-500 dark:text-gray-400 font-medium">No notifications yet</p>
                                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                                    New orders will appear here
                                </p>
                            </div>
                        ) : (
                            notifications. map((notification) => (
                                <div
                                    key={notification.id}
                                    onClick={() => ! notification.isRead && markAsRead(notification. id)}
                                    className={`px-5 py-4 border-b border-gray-100 dark:border-gray-700 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer ${
                                        ! notification.isRead ?  'bg-blue-50/50 dark:bg-blue-900/10' : ''
                                    }`}
                                >
                                    <div className="flex gap-4">
                                        {/* Icon */}
                                        <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${
                                            ! notification.isRead
                                                ?  'bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/50 dark:to-purple-900/50'
                                                : 'bg-gray-100 dark:bg-gray-700'
                                        }`}>
                                            {getNotificationIcon(notification.type)}
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <p className={`font-semibold text-sm leading-tight ${
                                                    ! notification.isRead
                                                        ? 'text-gray-900 dark:text-white'
                                                        : 'text-gray-600 dark:text-gray-400'
                                                }`}>
                                                    {notification.title}
                                                </p>
                                                {! notification.isRead && (
                                                    <span className="w-2. 5 h-2.5 bg-blue-500 rounded-full flex-shrink-0 animate-pulse"></span>
                                                )}
                                            </div>

                                            {/* Order Details */}
                                            {notification.type === 'NEW_ORDER' && notification.buyerName && (
                                                <div className="mt-2 p-3 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 rounded-xl">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                                                            {notification.buyerName. charAt(0).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                                                                {notification.buyerName}
                                                            </p>
                                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                                {notification.buyerEmail}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-200 dark:border-gray-500">
                                                        <span className="text-xs text-gray-500 dark:text-gray-400">
                                                            📦 {notification.itemsCount} item(s)
                                                        </span>
                                                        <span className="text-sm font-bold text-green-600 dark:text-green-400">
                                                            {notification.orderTotal}
                                                        </span>
                                                    </div>
                                                </div>
                                            )}

                                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 flex items-center gap-1">
                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                {formatTimeAgo(notification.createdAt)}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Footer */}
                    {notifications.length > 0 && (
                        <div className="px-5 py-3 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700">
                            <button
                                onClick={() => setIsOpen(false)}
                                className="w-full py-2 text-center text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default NotificationsPanel;