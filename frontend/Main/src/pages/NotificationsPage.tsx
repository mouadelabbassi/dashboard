import React, { useEffect, useState } from 'react';
import { notificationService } from '../service/notificationService';
import { Notification } from '../types/notification';

const NotificationsPage: React.FC = () => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    useEffect(() => {
        fetchNotifications();
    }, [currentPage]);

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const data = await notificationService.getNotifications(currentPage, 20);
            setNotifications(data.content);
            setTotalPages(data.totalPages);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAsRead = async (id: number) => {
        try {
            await notificationService.markAsRead(id);
            setNotifications((prev) =>
                prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
            );
        } catch (error) {
            console.error('Error marking as read:', error);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await notificationService.markAllAsRead();
            setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    };

    const getNotificationIcon = (type: string) => {
        const icons: Record<string, { icon: string; bg: string }> = {
            PRODUCT_APPROVED: { icon: '✅', bg: 'bg-green-100 dark:bg-green-900' },
            PRODUCT_REJECTED: { icon: '❌', bg: 'bg-red-100 dark:bg-red-900' },
            PRODUCT_PURCHASED: { icon: '💰', bg: 'bg-yellow-100 dark:bg-yellow-900' },
            REVIEW_RECEIVED: { icon: '⭐', bg: 'bg-purple-100 dark:bg-purple-900' },
            ORDER_CONFIRMED: { icon: '📦', bg: 'bg-blue-100 dark:bg-blue-900' },
            NEW_SELLER_PRODUCT: { icon: '🆕', bg: 'bg-indigo-100 dark:bg-indigo-900' },
            SYSTEM: { icon: '🔔', bg: 'bg-gray-100 dark:bg-gray-700' },
        };
        return icons[type] || icons.SYSTEM;
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'À l\'instant';
        if (diffMins < 60) return `Il y a ${diffMins} min`;
        if (diffHours < 24) return `Il y a ${diffHours} h`;
        if (diffDays < 7) return `Il y a ${diffDays} j`;
        return date.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    };

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Notifications</h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Toutes vos notifications
                    </p>
                </div>
                {notifications.some((n) => ! n.isRead) && (
                    <button
                        onClick={handleMarkAllAsRead}
                        className="px-4 py-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition"
                    >
                        Tout marquer comme lu
                    </button>
                )}
            </div>

            {loading ?  (
                <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            ) : notifications.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-12 text-center">
                    <svg
                        className="w-16 h-16 mx-auto text-gray-400 mb-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                        />
                    </svg>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                        Aucune notification
                    </h3>
                    <p className="text-gray-500 mt-2">
                        Vous n'avez pas encore de notifications.
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {notifications.map((notification) => {
                        const iconInfo = getNotificationIcon(notification.type);
                        return (
                            <div
                                key={notification.id}
                                className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 transition cursor-pointer hover:shadow-xl ${
                                    ! notification.isRead ?  'border-l-4 border-blue-600' : ''
                                }`}
                                onClick={() => ! notification.isRead && handleMarkAsRead(notification.id)}
                            >
                                <div className="flex gap-4">
                                    <div
                                        className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${iconInfo.bg}`}
                                    >
                                        {iconInfo.icon}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <h4 className="font-semibold text-gray-900 dark:text-white">
                                                    {notification.title}
                                                </h4>
                                                <p className="text-gray-600 dark:text-gray-400 mt-1">
                                                    {notification.message}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500 whitespace-nowrap">
                          {formatDate(notification.createdAt)}
                        </span>
                                                {! notification.isRead && (
                                                    <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                                                )}
                                            </div>
                                        </div>
                                        {notification.actionUrl && (
                                            <a
                                                href={notification.actionUrl}
                                                className="inline-block mt-2 text-sm text-blue-600 hover:underline"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                Voir les détails →
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex justify-center mt-6 gap-2">
                            <button
                                onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                                disabled={currentPage === 0}
                                className="px-4 py-2 rounded-lg bg-white dark:bg-gray-800 shadow disabled:opacity-50"
                            >
                                Précédent
                            </button>
                            <span className="px-4 py-2 text-gray-600 dark:text-gray-400">
                Page {currentPage + 1} sur {totalPages}
              </span>
                            <button
                                onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
                                disabled={currentPage >= totalPages - 1}
                                className="px-4 py-2 rounded-lg bg-white dark:bg-gray-800 shadow disabled:opacity-50"
                            >
                                Suivant
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default NotificationsPage;
