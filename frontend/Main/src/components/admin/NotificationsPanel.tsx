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
        fetchUnreadCount();
        const interval = setInterval(fetchUnreadCount, 30000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document. removeEventListener('mousedown', handleClickOutside);
    }, []);

    const getAuthHeaders = (): HeadersInit => {
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
                setNotifications(data.data || []);
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
            if (response. ok) {
                const data = await response.json();
                setUnreadCount(data.data?. count || 0);
            }
        } catch (err) {
        }
    };

    const markAsRead = async (id: number) => {
        try {
            await fetch(`http://localhost:8080/api/notifications/${id}/read`, {
                method: 'PATCH',
                headers: getAuthHeaders()
            });
            setNotifications(prev => prev.map(n => n.id === id ?  { ...n, isRead: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (err) {
            console.error('Error marking as read:', err);
        }
    };

    const markAllAsRead = async () => {
        try {
            await fetch('http://localhost:8080/api/notifications/read-all', {
                method: 'PATCH',
                headers: getAuthHeaders()
            });
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);
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
        return `${days}d ago`;
    };

    const handleToggle = () => {
        const newState = !isOpen;
        setIsOpen(newState);
        if (newState) {
            fetchNotifications();
        }
    };

    return (
        <div className="relative" ref={panelRef}>
            <button
                onClick={handleToggle}
                type="button"
                aria-label="Notifications"
                className="relative flex h-11 w-11 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
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
                    <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[11px] font-bold text-white">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div
                    className="absolute right-0 mt-2 w-80 origin-top-right rounded-xl border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-800 sm:w-96"
                    style={{ zIndex: 99999 }}
                >
                    <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-700">
                        <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-gray-900 dark:text-white">
                                Notifications
                            </h3>
                            {unreadCount > 0 && (
                                <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-600 dark:bg-red-900/30 dark:text-red-400">
                                    {unreadCount} new
                                </span>
                            )}
                        </div>
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllAsRead}
                                className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                            >
                                Mark all read
                            </button>
                        )}
                    </div>

                    <div className="max-h-80 overflow-y-auto">
                        {loading ? (
                            <div className="flex items-center justify-center py-8">
                                <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="py-12 text-center">
                                <span className="text-4xl">📭</span>
                                <p className="mt-2 text-gray-500 dark:text-gray-400">
                                    No notifications yet
                                </p>
                            </div>
                        ) : (
                            notifications.map((n) => (
                                <div
                                    key={n. id}
                                    onClick={() => ! n.isRead && markAsRead(n.id)}
                                    className={`cursor-pointer border-b border-gray-100 p-4 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700/50 ${
                                        ! n.isRead ?  'bg-blue-50/50 dark:bg-blue-900/10' : ''
                                    }`}
                                >
                                    <div className="flex gap-3">
                                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-xl dark:bg-blue-900/30">
                                            🛒
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-start justify-between gap-2">
                                                <p
                                                    className={`text-sm font-medium ${
                                                        ! n.isRead
                                                            ?  'text-gray-900 dark:text-white'
                                                            : 'text-gray-600 dark:text-gray-400'
                                                    }`}
                                                >
                                                    {n. title}
                                                </p>
                                                {!n.isRead && (
                                                    <span className="h-2 w-2 flex-shrink-0 rounded-full bg-blue-500"></span>
                                                )}
                                            </div>
                                            {n.buyerName && (
                                                <div className="mt-2 rounded-lg bg-gray-100 p-2 text-xs dark:bg-gray-700">
                                                    <p className="font-medium text-gray-700 dark:text-gray-300">
                                                        {n.buyerName}
                                                    </p>
                                                    <p className="text-gray-500 dark:text-gray-400">
                                                        {n.buyerEmail}
                                                    </p>
                                                    <p className="mt-1 font-bold text-green-600 dark:text-green-400">
                                                        {n.orderTotal} • {n.itemsCount} item(s)
                                                    </p>
                                                </div>
                                            )}
                                            <p className="mt-1 text-xs text-gray-400">
                                                {formatTimeAgo(n.createdAt)}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="border-t border-gray-200 p-3 dark:border-gray-700">
                        <button
                            onClick={() => setIsOpen(false)}
                            className="w-full text-center text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationsPanel;
