import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const DashboardIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
    </svg>
);

const SalesIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
);

const ProductsIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
);

const SellersIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
);
const PredictiveIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
);

const CategoryIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
    </svg>
);

const ReportsIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
);

const ProfileIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
);

const LogoutIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
);
const SunIcon = () => (
    <svg className="w-5 h-5 stroke-gray-700 dark:stroke-white" fill="none" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
);
const MoonIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
    </svg>
);

const AnalystLayout: React.FC = () => {
    const { logout, user } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [sidebarOpen] = useState(true);
    const [isDark, setIsDark] = useState(true);
    const [showMobileSearch, setShowMobileSearch] = useState(false);

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

    const navItems = [
        { path: '/analyst', label: 'Dashboard', icon: <DashboardIcon />, exact: true },
        { path: '/analyst/sales', label: 'Sales Analytics', icon: <SalesIcon /> },
        { path: '/analyst/products', label: 'Product Analytics', icon: <ProductsIcon /> },
        { path: '/analyst/sellers', label: 'Seller Performance', icon: <SellersIcon /> },
        { path: '/analyst/categories', label: 'Category Analysis', icon: <CategoryIcon /> },
        { path: '/analyst/reports', label: 'Reports & Export', icon: <ReportsIcon /> },
        { path: '/analyst/predictions', label: 'Analyse Prédictive', icon:  <PredictiveIcon /> },
    ];

    const isActive = (path: string, exact?: boolean) => {
        if (exact) return location.pathname === path;
        return location.pathname.startsWith(path);
    };

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-950 flex">
            <aside
                className={`fixed lg:static inset-y-0 left-0 z-50 ${
                    sidebarOpen ?  'w-64' : 'w-20'
                } bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transition-all duration-300 flex flex-col h-screen`}
            >
                <div className="h-16 flex items-center justify-center border-b border-gray-200 dark:border-gray-800 px-4">
                    <Link to="/analyst" className="flex items-center gap-2">
                        <img
                            src="/images/logo/logo.png"
                            alt="Logo"
                            className="w-10 h-10"
                        />
                        {sidebarOpen && (
                            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                MouadVision
                            </span>
                        )}
                    </Link>
                </div>

                <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                    <div className="mb-4">
                        {sidebarOpen && (
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-3">
                                Analytics
                            </p>
                        )}
                        {navItems.map((item) => (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                                    location.pathname === item.path
                                        ? 'text-blue-600 dark:text-blue-400'
                                        : 'text-gray-700 dark:text-neutral-300 hover:bg-gray-100 dark:hover:bg-neutral-800 hover:text-gray-900 dark:hover:text-white'
                                }`}
                            >
                                <span>{item.label}</span>
                            </Link>
                        ))}
                    </div>

                    <div className="border-t border-gray-200 dark:border-gray-800 pt-4">
                        {sidebarOpen && (
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-3">
                                Settings
                            </p>
                        )}
                        <Link
                            to="/analyst/profile"
                            className={`flex items-center ${sidebarOpen ? 'gap-3' : 'justify-center'} px-3 py-2.5 rounded-lg transition-all ${
                                isActive('/analyst/profile')
                                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                            }`}
                            title={!sidebarOpen ? 'Profile' : undefined}
                        >
                            <ProfileIcon />
                            {sidebarOpen && <span className="font-medium">Profile</span>}
                        </Link>
                    </div>
                </nav>

            </aside>

            <div className="flex-1 flex flex-col min-h-screen">
                <header className="h-auto min-h-[4rem] bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-40">
                    <div className="flex items-center justify-between px-6 py-3 gap-4">
                        <div className="flex items-center gap-4">
                            {user?.role === 'ADMIN' && (
                                <Link
                                    to="/admin"
                                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-500/20 transition-colors text-sm font-medium"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                    </svg>
                                    Back to Admin
                                </Link>
                            )}
                            <div className="hidden sm:block">
                                <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    Analytics Dashboard
                                </h1>
                                <p className="text-xs text-gray-500">
                                    Data-driven insights for smarter decisions
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setShowMobileSearch(!showMobileSearch)}
                                className="md:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </button>

                            <button
                                onClick={() => setIsDark(!isDark)}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                            >
                                {isDark ? <SunIcon /> : <MoonIcon />}
                            </button>

                            <div className="flex items-center gap-3 ml-2 pl-3 border-l border-gray-200 dark:border-gray-800">
                                <button
                                    onClick={handleLogout}
                                    className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                    title="Logout"
                                >
                                    <LogoutIcon />
                                    <span className="hidden sm:inline">Logout</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {showMobileSearch && (
                        <div className="md:hidden px-6 pb-3">
                        </div>
                    )}
                </header>

                <main className="flex-1 p-6 overflow-auto">
                    <Outlet />
                </main>

                <footer className="h-12 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 flex items-center justify-center">
                    <p className="text-sm text-gray-500">
                        © 2025 MouadVision Analytics.All rights reserved.
                    </p>
                </footer>
            </div>
        </div>
    );
};

export default AnalystLayout;