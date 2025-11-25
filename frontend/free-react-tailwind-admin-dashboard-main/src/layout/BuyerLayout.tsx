import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';

const BuyerLayout: React.FC = () => {
    const { logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [isDark, setIsDark] = useState(true);

    // Theme toggle
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
        { path: '/shop', label:'Shop'},
        { path: '/my-reviews', label:'My Reviews'},
        { path: '/buyer-profile', label:'Profile'},
    ];

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-950">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Single Row Header */}
                    <div className="flex items-center justify-between h-16">
                        {/* Logo */}
                        <Link to="/shop" className="flex items-center gap-3">
                            <img
                                src="/logo.png"
                                alt="MouadVision"
                                className="h-10 w-auto"
                            />
                            <span className="text-xl font-bold text-gray-900 dark:text-white">
                                MouadVision
                            </span>
                        </Link>

                        {/* Navigation - Center */}
                        <nav className="flex items-center gap-1">
                            {navLinks.map(link => (
                                <Link
                                    key={link.path}
                                    to={link.path}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                        location.pathname === link.path
                                            ? 'bg-blue-500 text-white'
                                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                                    }`}
                                >
                                    <span>{link.label}</span>
                                </Link>
                            ))}
                        </nav>

                        {/* Right Section */}
                        <div className="flex items-center gap-4">
                            {/* Theme Toggle */}
                            <button
                                onClick={() => setIsDark(!isDark)}
                                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                                title={isDark ? 'Light Mode' : 'Dark Mode'}
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

                            {/* Logout Button */}
                            <button
                                onClick={handleLogout}
                                className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-lg transition-colors"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                                <span>Logout</span>
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <Outlet />
            </main>

            {/* Footer */}
            <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 mt-auto">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                            <img src="/logo.png" alt="MouadVision" className="h-8 w-auto" />
                            <span className="font-semibold text-gray-900 dark:text-white">MouadVision</span>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            © 2025 MouadVision. All rights reserved.
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default BuyerLayout;