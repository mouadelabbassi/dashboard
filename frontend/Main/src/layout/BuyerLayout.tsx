import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

const BuyerLayout: React.FC = () => {
    const { logout } = useAuth();
    const { getItemCount } = useCart();
    const location = useLocation();
    const navigate = useNavigate();
    const [isDark, setIsDark] = useState(false);
    const itemCount = getItemCount();

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
        { path: '/shop', label: 'Shop', icon: '🛍️' },
        { path: '/shop/orders', label: 'Orders', icon: '📦' },
        { path: '/shop/my-reviews', label: 'Reviews', icon: '⭐' },
        { path: '/shop/profile', label: 'Profile', icon: '👤' },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-shop-50 dark:from-neutral-900 dark:to-neutral-800 flex flex-col">
            <header className="sticky top-0 z-50 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-800 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-20 gap-4">
                        <Link to="/shop" className="flex items-center gap-3 flex-shrink-0 group">
                            <div className="w-12 h-12 bg-gradient-to-br from-shop-500 to-shop-600 rounded-xl flex items-center justify-center shadow-shop transform group-hover:scale-105 transition-transform">
                                <img src="/images/logo/logo.png" alt="Logo" className="h-8 w-auto" />
                                <span className="font-bold text-lg bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
                                    MouadVision
                                </span>
                            </div>
                        </Link>

                        <nav className="hidden lg:flex items-center gap-1">
                            {navLinks.map(link => (
                                <Link
                                    key={link. path}
                                    to={link. path}
                                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                                        location. pathname === link.path
                                            ? 'text-blue-600 dark:text-blue-400'
                                            : 'text-gray-700 dark:text-neutral-300 hover:bg-gray-100 dark:hover:bg-neutral-800 hover:text-gray-900 dark:hover:text-white'
                                    }`}
                                >
                                    <span>{link.label}</span>
                                </Link>
                            ))}
                        </nav>

                        <div className="flex items-center gap-2">
                            <Link
                                to="/shop/cart"
                                className="relative flex items-center justify-center w-11 h-11 rounded-xl bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-neutral-300 hover:bg-gray-200 dark:hover:bg-neutral-700 border border-gray-200 dark:border-neutral-700 transition-all"
                                title="Shopping Cart"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                                {itemCount > 0 && (
                                    <span className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                                        {itemCount > 99 ? '99+' : itemCount}
                                    </span>
                                )}
                            </Link>


                            <button
                                onClick={() => setIsDark(!isDark)}
                                className="hidden sm:flex items-center justify-center w-11 h-11 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
                            >
                                {isDark ? (
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                                    </svg>
                                ) : (
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                                    </svg>
                                )}
                            </button>


                            <button
                                onClick={handleLogout}
                                className="hidden sm:flex items-center gap-2 px-4 py-2.5 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 text-sm font-semibold rounded-xl transition-all"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                                <span>Logout</span>
                            </button>


                            <button className="lg:hidden flex items-center justify-center w-11 h-11 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>

                <nav className="lg:hidden border-t border-neutral-200 dark:border-neutral-800 px-2 py-2 flex justify-around bg-white dark:bg-neutral-900">
                    {navLinks.map(link => (
                        <Link
                            key={link.path}
                            to={link.path}
                            className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                                location.pathname === link.path
                                    ? 'text-shop-600 dark:text-shop-400 bg-shop-50 dark:bg-shop-900/20'
                                    : 'text-neutral-600 dark:text-neutral-400 hover:text-shop-600 dark:hover:text-shop-400'
                            }`}
                        >
                            <span className="text-xl">{link.icon}</span>
                            <span>{link.label}</span>
                        </Link>
                    ))}
                </nav>
            </header>
            <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <Outlet />
            </main>
            <footer className="bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800 mt-auto">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-neutral-200 dark:border-neutral-800">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-shop-500 to-shop-600 rounded-xl flex items-center justify-center shadow-shop transform group-hover:scale-105 transition-transform">
                                <img src="/images/logo/logo.png" alt="Logo" className="h-8 w-auto" />
                                <span className="font-bold text-lg bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
                                    MouadVision
                                </span>
                            </div>
                        </div>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">
                            © 2025 MouadVision. All rights reserved.
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default BuyerLayout;