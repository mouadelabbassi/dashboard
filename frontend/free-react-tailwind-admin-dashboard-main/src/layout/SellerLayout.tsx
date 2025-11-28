import React, { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import SellerSidebar from '../components/seller/SellerSidebar';
import NotificationDropdown from '../components/header/NotificationDropdown';

const SellerLayout: React.FC = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const navigate = useNavigate();

    const user = JSON.parse(localStorage. getItem('user') || '{}');

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/signin');
    };

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
            {/* Sidebar */}
            <SellerSidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

            {/* Main Content */}
            <div className="lg:ml-64">
                {/* Header */}
                <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-30">
                    <div className="flex items-center justify-between px-4 py-3">
                        {/* Mobile Menu Button */}
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                            <svg className="w-6 h-6 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>

                        {/* Search Bar */}
                        <div className="hidden md:flex flex-1 max-w-md ml-4">
                            <div className="relative w-full">
                                <input
                                    type="text"
                                    placeholder="Rechercher..."
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                                />
                                <svg className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                        </div>

                        {/* Right Actions */}
                        <div className="flex items-center gap-4">
                            {/* Notifications */}
                            <NotificationDropdown />

                            {/* User Menu */}
                            <div className="relative group">
                                <button className="flex items-center gap-2">
                                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 dark:text-blue-400 font-semibold">
                      {user. fullName?. charAt(0). toUpperCase() || 'S'}
                    </span>
                                    </div>
                                    <div className="hidden sm:block text-left">
                                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                                            {user.fullName}
                                        </p>
                                        <p className="text-xs text-gray-500">Vendeur</p>
                                    </div>
                                </button>

                                {/* Dropdown */}
                                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border dark:border-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                                    <div className="py-1">
                                        <a href="/seller/profile" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                                            Mon Profil
                                        </a>
                                        <a href="/seller/settings" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                                            Paramètres
                                        </a>
                                        <hr className="my-1 dark:border-gray-700" />
                                        <button
                                            onClick={handleLogout}
                                            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                                        >
                                            Déconnexion
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="min-h-[calc(100vh-64px)]">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default SellerLayout;
