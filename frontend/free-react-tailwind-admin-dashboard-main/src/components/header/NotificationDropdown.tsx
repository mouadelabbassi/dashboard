import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { notificationService } from '../../service/notificationService';
import { Notification } from '../../types/notification';

const NotificationDropdown: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchUnreadCount();
        const interval = setInterval(fetchUnreadCount, 30000); // Poll every 30 seconds
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (isOpen) {
            fetchNotifications();
        }
    }, [isOpen]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document. removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchUnreadCount = async () => {
        try {
            const count = await notificationService.getUnreadCount();
            setUnreadCount(count);
        } catch (error) {
            console.error('Error fetching unread count:', error);
        }
    };

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const unread = await notificationService.getUnreadNotifications();
            setNotifications(unread. slice(0, 10));
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAsRead = async (id: number) => {
        try {
            await notificationService.markAsRead(id);
            setNotifications((prev) => prev.filter((n) => n. id !== id));
            setUnreadCount((prev) => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Error marking as read:', error);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await notificationService.markAllAsRead();
            setNotifications([]);
            setUnreadCount(0);
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    };

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'PRODUCT_APPROVED':
                return '✅';
            case 'PRODUCT_REJECTED':
                return '❌';
            case 'PRODUCT_PURCHASED':
                return '💰';
            case 'REVIEW_RECEIVED':
                return '⭐';
            case 'ORDER_CONFIRMED':
                return '📦';
            case 'NEW_SELLER_PRODUCT':
                return '🆕';
            default:
                return '🔔';
        }
    };

    const getTimeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const seconds = Math.floor((now. getTime() - date.getTime()) / 1000);

        if (seconds < 60) return 'À l\'instant';
        if (seconds < 3600) return `Il y a ${Math.floor(seconds / 60)} min`;
        if (seconds < 86400) return `Il y a ${Math.floor(seconds / 3600)} h`;
        return `Il y a ${Math.floor(seconds / 86400)} j`;
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Bell Button */}
            <button
                onClick={() => setIsOpen(! isOpen)}
                className="relative p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition"
            >
                <svg
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path
                        d="M10 2C10.5523 2 11 2.44772 11 3V3.09199C13.8377 3.55399 16 6.02757 16 9V13L17.2929 14.2929C17.9229 14.9229 17.4767 16 16.5858 16H3.41421C2.52331 16 2.07714 14.9229 2.70711 14.2929L4 13V9C4 6.02757 6.16229 3.55399 9 3.09199V3C9 2.44772 9.44772 2 10 2ZM10 5C7.79086 5 6 6.79086 6 9V13.4142L5.41421 14H14.5858L14 13.4142V9C14 6.79086 12.2091 5 10 5ZM8 17C8 18.1046 8.89543 19 10 19C11.1046 19 12 18.1046 12 17H8Z"
                    />
                </svg>
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
                )}
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border dark:border-gray-700 z-50">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                            Notifications
                        </h3>
                        {notifications.length > 0 && (
                            <button
                                onClick={handleMarkAllAsRead}
                                className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400"
                            >
                                Tout marquer comme lu
                            </button>
                        )}
                    </div>

                    {/* Notifications List */}
                    <div className="max-h-96 overflow-y-auto">
                        {loading ? (
                            <div className="flex justify-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                            </div>
                        ) : notifications. length === 0 ? (
                            <div className="py-8 text-center text-gray-500">
                                <svg className="w-12 h-12 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                                </svg>
                                <p>Aucune nouvelle notification</p>
                            </div>
                        ) : (
                            notifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    className="p-4 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition cursor-pointer"
                                    onClick={() => handleMarkAsRead(notification.id)}
                                >
                                    <div className="flex gap-3">
                                        <span className="text-2xl">{getNotificationIcon(notification.type)}</span>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-gray-900 dark:text-white text-sm">
                                                {notification.title}
                                            </p>
                                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                                                {notification.message}
                                            </p>
                                            <p className="text-xs text-gray-400 mt-1">
                                                {getTimeAgo(notification.createdAt)}
                                            </p>
                                        </div>
                                        {! notification.isRead && (
                                            <span className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-2"></span>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-3 border-t dark:border-gray-700">
                        <Link
                            to="/admin/notifications"
                            className="block text-center text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 font-medium"
                            onClick={() => setIsOpen(false)}
                        >
                            Voir toutes les notifications
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationDropdown;
