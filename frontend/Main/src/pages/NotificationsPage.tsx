import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { notificationService } from '../service/notificationService';
import { Notification } from '../types/notification';
import PredictionNotifications from '../components/seller/PredictionNotifications';

const NotificationsPage:React.FC = () => {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [activeTab, setActiveTab] = useState<'all' | 'predictions'>('all');
    const [filter, setFilter] = useState<'all' | 'unread' | 'predictions'>('all');

    useEffect(() => {
        fetchNotifications();
    }, [currentPage, filter]);

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const data = await notificationService.getNotifications(currentPage, 20);

            let filteredNotifications = data.content;

            if (filter === 'unread') {
                filteredNotifications = filteredNotifications.filter(n => !n.isRead);
            } else if (filter === 'predictions') {
                filteredNotifications = filteredNotifications.filter(n =>
                    n.type === 'PREDICTION_BESTSELLER' || n.type === 'PREDICTION_PRICE'
                );
            }

            setNotifications(filteredNotifications);
            setTotalPages(data.totalPages);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAsRead = async (id:number) => {
        try {
            await notificationService.markAsRead(id);
            setNotifications((prev) =>
                prev.map((n) => (n.id === id ? { ...n, isRead:true } :n))
            );
        } catch (error) {
            console.error('Error marking as read:', error);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await notificationService.markAllAsRead();
            setNotifications((prev) => prev.map((n) => ({ ...n, isRead:true })));
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    };

    const getNotificationIcon = (type:string) => {
        const icons: Record<string, { icon:string; bg:string; gradient?: string }> = {
            PRODUCT_APPROVED:{ icon:'✅', bg:'bg-green-100 dark:bg-green-900/30' },
            PRODUCT_REJECTED:{ icon:'❌', bg:'bg-red-100 dark:bg-red-900/30' },
            PRODUCT_PURCHASED:{ icon:'💰', bg:'bg-yellow-100 dark:bg-yellow-900/30' },
            REVIEW_RECEIVED:{ icon:'⭐', bg:'bg-purple-100 dark:bg-purple-900/30' },
            RATING_RECEIVED:{ icon:'🌟', bg:'bg-amber-100 dark:bg-amber-900/30' },
            ORDER_CONFIRMED:{ icon:'📦', bg:'bg-blue-100 dark:bg-blue-900/30' },
            ORDER_SHIPPED:{ icon:'🚚', bg:'bg-cyan-100 dark:bg-cyan-900/30' },
            ORDER_DELIVERED:{ icon: '✔️', bg:'bg-emerald-100 dark:bg-emerald-900/30' },
            NEW_ORDER: { icon:'🛒', bg:'bg-indigo-100 dark:bg-indigo-900/30' },
            NEW_SELLER_PRODUCT:{ icon:'🆕', bg:'bg-indigo-100 dark:bg-indigo-900/30' },
            NEW_SELLER_REGISTRATION:{ icon:'👤', bg:'bg-violet-100 dark:bg-violet-900/30' },
            STOCK_ALERT:{ icon:'📊', bg:'bg-orange-100 dark:bg-orange-900/30' },
            SYSTEM: { icon:'🔔', bg:'bg-gray-100 dark:bg-gray-700' },
            PROMOTION:{ icon:'🎉', bg:'bg-pink-100 dark:bg-pink-900/30' },
            PREDICTION_BESTSELLER:{
                icon:'🔮',
                bg:'bg-gradient-to-br from-yellow-100 to-orange-100 dark:from-yellow-900/30 dark:to-orange-900/30',
                gradient:'from-yellow-500 to-orange-500'
            },
            PREDICTION_PRICE:{
                icon:'💹',
                bg:'bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30',
                gradient:'from-blue-500 to-purple-500'
            },
        };
        return icons[type] || icons.SYSTEM;
    };

    const formatDate = (dateString:string) => {
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
            day:'2-digit',
            month: 'short',
            year: 'numeric',
        });
    };

    const isPredictionNotification = (type: string) => {
        return type === 'PREDICTION_BESTSELLER' || type === 'PREDICTION_PRICE';
    };

    const predictionNotificationsCount = notifications.filter(n => isPredictionNotification(n.type)).length;
    const unreadCount = notifications.filter(n => !n.isRead).length;

    const isSeller = user?.role === 'SELLER';
    const sellerId = user?.id;

    return (
        <div className="p-6 max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        Notifications
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        {unreadCount > 0 ?  `${unreadCount} Unread` :'All Notifications'}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {notifications.some((n) => !n.isRead) && (
                        <button
                            onClick={handleMarkAllAsRead}
                            className="px-4 py-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition font-medium text-sm"
                        >
                            ✓ Mark all as read
                        </button>
                    )}
                </div>
            </div>

            {/* Tabs for Sellers */}
            {isSeller && (
                <div className="flex gap-2 mb-6 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
                    <button
                        onClick={() => setActiveTab('all')}
                        className={`flex-1 px-4 py-2.5 rounded-lg font-medium text-sm transition-all ${
                            activeTab === 'all'
                                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                                :'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                        }`}
                    >
                        All Notifications
                    </button>
                    <button
                        onClick={() => setActiveTab('predictions')}
                        className={`flex-1 px-4 py-2.5 rounded-lg font-medium text-sm transition-all flex items-center justify-center gap-2 ${
                            activeTab === 'predictions'
                                ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-sm'
                                :'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                        }`}
                    >
                        Predictive Alerts
                        {predictionNotificationsCount > 0 && (
                            <span className={`px-2 py-0.5 rounded-full text-xs ${
                                activeTab === 'predictions'
                                    ? 'bg-white/20 text-white'
                                    :'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                            }`}>
                                {predictionNotificationsCount}
                            </span>
                        )}
                    </button>
                </div>
            )}

            {/* Filter Pills */}
            {activeTab === 'all' && (
                <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                    {[
                        { key:'all', label:'All'},
                        { key:'unread', label:'Unread' },
                        { key: 'predictions', label:'Predections' },
                    ].map((f) => (
                        <button
                            key={f.key}
                            onClick={() => setFilter(f.key as typeof filter)}
                            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                                filter === f.key
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                                    :'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 shadow'
                            }`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>
            )}

            {activeTab === 'predictions' && isSeller && sellerId ?  (
                <PredictionNotifications sellerId={sellerId} />
            ) :loading ? (
                <div className="flex flex-col items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mb-4"></div>
                    <p className="text-gray-500 dark:text-gray-400">Chargement des notifications...</p>
                </div>
            ) :notifications.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-12 text-center">
                    <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                        <span className="text-4xl">📭</span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        No Notification at the moment
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 mt-2">
                        {filter === 'unread'
                            ? 'You have read all notifications.'
                            :filter === 'predictions'
                                ? 'No predictive alerts at the moment.'
                                :'You don\'t have any notifications yet.'}
                    </p>
                </div>
            ) :(
                <div className="space-y-3">
                    {notifications.map((notification) => {
                        const iconInfo = getNotificationIcon(notification.type);
                        const isPrediction = isPredictionNotification(notification.type);

                        return (
                            <div
                                key={notification.id}
                                className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden transition-all hover:shadow-xl cursor-pointer ${
                                    ! notification.isRead ?  'ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-gray-900' :''
                                } ${isPrediction ? 'border-l-4 border-l-orange-500' :''}`}
                                onClick={() => !notification.isRead && handleMarkAsRead(notification.id)}
                            >
                                {/* Prediction Badge */}
                                {isPrediction && (
                                    <div className={`px-4 py-1.5 bg-gradient-to-r ${iconInfo.gradient} text-white text-xs font-medium`}>
                                        Predictive Alerts
                                    </div>
                                )}

                                <div className="p-4">
                                    <div className="flex gap-4">
                                        <div
                                            className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 ${iconInfo.bg}`}
                                        >
                                            {iconInfo.icon}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="flex-1">
                                                    <h4 className="font-semibold text-gray-900 dark:text-white">
                                                        {notification.title}
                                                    </h4>
                                                    <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm">
                                                        {notification.message}
                                                    </p>
                                                </div>
                                                <div className="flex flex-col items-end gap-1">
                                                    <span className="text-xs text-gray-500 whitespace-nowrap">
                                                        {formatDate(notification.createdAt)}
                                                    </span>
                                                    {! notification.isRead && (
                                                        <span className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Action URL */}
                                            {notification.actionUrl && (
                                                <a
                                                    href={notification.actionUrl}
                                                    className={`inline-flex items-center gap-1 mt-3 text-sm font-medium transition-colors ${
                                                        isPrediction
                                                            ? 'text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300'
                                                            :'text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300'
                                                    }`}
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    See Details
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                    </svg>
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex justify-center mt-8 gap-2">
                            <button
                                onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                                disabled={currentPage === 0}
                                className="px-4 py-2 rounded-xl bg-white dark:bg-gray-800 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                            >
                                ← Précédent
                            </button>
                            <span className="px-4 py-2 text-gray-600 dark:text-gray-400 font-medium">
                                Page {currentPage + 1} sur {totalPages}
                            </span>
                            <button
                                onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
                                disabled={currentPage >= totalPages - 1}
                                className="px-4 py-2 rounded-xl bg-white dark:bg-gray-800 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                            >
                                Suivant →
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default NotificationsPage;