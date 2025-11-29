import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

const SellerLayout: React.FC = () => {
    const { user, logout } = useAuth();
    const { items } = useCart();
    const location = useLocation();
    const navigate = useNavigate();
    const [isDark, setIsDark] = useState(true);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    useEffect(() => {
        if (isDark) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [isDark]);

    const handleLogout = () => {
        logout();
        navigate('/signin');
    };

    const navLinks = [
        { path: '/seller/dashboard', label: 'Dashboard' },
        { path: '/seller/products', label: 'My Products' },
        { path: '/seller/orders', label: 'Orders'},
        { path: '/seller/reviews', label: 'Reviews' },
        { path: '/seller/profile', label: 'Profile' },
        { path: '/seller/notifications', label: 'Notifications' },
    ];

    const shopLinks = [
        { path: '/seller/shop', label: 'Shop' },
        { path: '/seller/shop/orders', label: 'My Purchases' },
    ];

    const isActive = (path: string) => location.pathname === path;

    const cartItemCount = items.reduce((sum, item) => sum + item.quantity, 0);

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-950 flex">
            {/* Sidebar */}
            <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transform transition-transform duration-300 lg:translate-x-0 ${isSidebarOpen ?  'translate-x-0' : '-translate-x-full'}`}>
                <div className="flex flex-col h-full">
                    {/* Logo */}
                    <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 dark:border-gray-800">
                        <Link to="/seller/dashboard" className="flex items-center gap-2">
                            <img src="/images/logo/logo.png" alt="Logo" className="h-8 w-auto" />
                            <span className="font-bold text-lg bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
                                Seller Portal
                            </span>
                        </Link>
                        <button
                            onClick={() => setIsSidebarOpen(false)}
                            className="lg:hidden text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                        >
                            ✕
                        </button>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
                        {/* Seller Section */}
                        <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                            Seller
                        </p>
                        {navLinks.map(link => (
                            <Link
                                key={link.path}
                                to={link.path}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                                    isActive(link.path)
                                        ?  'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/25'
                                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                                }`}
                            >
                                <span>{link.label}</span>
                            </Link>
                        ))}

                        {/* Divider */}
                        <div className="my-4 border-t border-gray-200 dark:border-gray-700"></div>

                        {/* Shop Section - Seller as Buyer */}
                        <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                            Shop as Buyer
                        </p>
                        {shopLinks.map(link => (
                            <Link
                                key={link.path}
                                to={link.path}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                                    isActive(link.path) || location.pathname.startsWith(link.path)
                                        ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/25'
                                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                                }`}
                            >
                                <span>{link.label}</span>
                            </Link>
                        ))}
                    </nav>

                    {/* User Info */}
                    <div className="p-4 border-t border-gray-200 dark:border-gray-800">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                                {user?.fullName?.charAt(0) || 'S'}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                    {user?.fullName || 'Seller'}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                    {user?.email}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            Logout
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 lg:ml-64">
                {/* Header */}
                <header className="sticky top-0 z-40 h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-4 lg:px-6">
                    <button
                        onClick={() => setIsSidebarOpen(true)}
                        className="lg:hidden text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>

                    <div className="flex items-center gap-4">
                        {/* Cart Icon */}
                        <Link
                            to="/seller/shop/cart"
                            className="relative p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            {cartItemCount > 0 && (
                                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                                    {cartItemCount}
                                </span>
                            )}
                        </Link>

                        <button
                            onClick={() => setIsDark(!isDark)}
                            className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                        >
                            {isDark ? '☀️' : '🌙'}
                        </button>
                    </div>
                </header>

                {/* Page Content */}
                <main className="p-4 lg:p-6">
                    <Outlet />
                </main>
            </div>

            {/* Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/50 lg:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}
        </div>
    );
};

export default SellerLayout;