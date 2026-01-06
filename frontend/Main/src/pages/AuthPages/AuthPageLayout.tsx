import React from "react";
import GridShape from "../../components/common/GridShape";
import { Link } from "react-router-dom";
import ThemeTogglerTwo from "../../components/common/ThemeTogglerTwo";

export default function AuthLayout({
                                       children,
                                   }: {
    children: React.ReactNode;
}) {
    return (
        <div className="relative p-6 bg-white z-1 dark:bg-gray-900 sm:p-0">
            <div className="relative flex flex-col justify-center w-full h-screen lg:flex-row dark:bg-gray-900 sm:p-0">

                {children}

                <div className="items-center hidden w-full h-full lg:w-1/2 bg-brand-950 dark:bg-white/5 lg:flex relative">
                    <div className="relative flex items-center justify-center z-1 w-full h-full">
                        <GridShape />

                        <div className="flex flex-col items-center justify-center px-8">

                            <div className="relative mb-6">
                                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 blur-3xl rounded-full scale-150"></div>
                                <Link to="/" className="relative block">
                                    <img
                                        width={231}
                                        height={48}
                                        src="/images/logo/MouadVision.png"
                                        alt="Logo"
                                    />
                                </Link>
                            </div>

                            <p className="text-center text-gray-400 dark:text-white/60 max-w-sm mb-10">
                                Your all-in-one e-commerce platform for sellers, buyers, and analytics.
                                Empowering businesses to grow smarter.
                            </p>

                            <div className="flex flex-col gap-4 mb-10">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                                        <span className="text-lg">📊</span>
                                    </div>
                                    <div>
                                        <p className="text-white font-medium text-sm">Real-time Analytics</p>
                                        <p className="text-gray-500 text-xs">Track sales & performance instantly</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                                        <span className="text-lg">🛒</span>
                                    </div>
                                    <div>
                                        <p className="text-white font-medium text-sm">Seamless Marketplace</p>
                                        <p className="text-gray-500 text-xs">Buy & sell with confidence</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                                        <span className="text-lg">🚀</span>
                                    </div>
                                    <div>
                                        <p className="text-white font-medium text-sm">Scale Your Business</p>
                                        <p className="text-gray-500 text-xs">Tools to grow faster</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-8 pt-6 border-t border-gray-700/50">
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-white">10K+</p>
                                    <p className="text-gray-500 text-xs">Products</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-white">5K+</p>
                                    <p className="text-gray-500 text-xs">Sellers</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-white">50K+</p>
                                    <p className="text-gray-500 text-xs">Orders</p>
                                </div>
                            </div>
                        </div>

                        <div className="absolute bottom-6 left-0 right-0 text-center">
                            <p className="text-gray-600 dark:text-gray-500 text-xs">
                                © 2025 MouadVision. All rights reserved.
                            </p>
                            <div className="flex justify-center gap-4 mt-2">
                                <a href="#" className="text-gray-500 hover:text-white text-xs transition-colors">
                                    Privacy Policy
                                </a>
                                <span className="text-gray-700">•</span>
                                <a href="#" className="text-gray-500 hover:text-white text-xs transition-colors">
                                    Terms of Service
                                </a>
                                <span className="text-gray-700">•</span>
                                <a href="#" className="text-gray-500 hover:text-white text-xs transition-colors">
                                    Contact
                                </a>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="fixed z-50 hidden bottom-6 right-6 sm:block">
                    <ThemeTogglerTwo />
                </div>
            </div>
        </div>
    );
}