import React from 'react';
import { Link } from 'react-router-dom';

const AboutPage: React.FC = () => {
    return (
        <div className="min-h-screen bg-slate-950 text-white">
            {/* Navigation */}
            <nav className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-xl sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <Link to="/" className="flex items-center gap-2">
                            <img src="/images/logo/logo.png" alt="MouadVision" className="h-8 w-auto" />
                            <span className="text-lg font-semibold">MouadVision</span>
                        </Link>

                        <div className="hidden md:flex items-center gap-8">
                            <Link to="/" className="text-sm text-slate-400 hover:text-white transition-colors">
                                Home
                            </Link>
                            <Link to="/explore" className="text-sm text-slate-400 hover:text-white transition-colors">
                                Shop
                            </Link>
                            <Link to="/about" className="text-sm font-medium hover:text-blue-400 transition-colors">
                                About
                            </Link>
                        </div>

                        <div className="flex items-center gap-3">
                            <Link to="/signin" className="text-sm font-medium hover:text-blue-400 transition-colors">
                                Sign In
                            </Link>
                            <Link
                                to="/signup"
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                            >
                                Get Started
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="pt-20 pb-16 px-4 border-b border-slate-800">
                <div className="max-w-4xl mx-auto text-center">
                    <h1 className="text-4xl md:text-5xl font-bold mb-6">
                        About MouadVision
                    </h1>
                    <p className="text-xl text-slate-400 leading-relaxed">
                        An e-commerce platform connecting Moroccan buyers with verified sellers.
                        Built as a university project to demonstrate full-stack development and
                        analytics capabilities.
                    </p>
                </div>
            </section>

            {/* Mission & Story */}
            <section className="py-20 px-4">
                <div className="max-w-7xl mx-auto">
                    <div className="grid md:grid-cols-2 gap-12 items-start">
                        <div className="space-y-6">
                            <h2 className="text-2xl font-bold">The Project</h2>
                            <p className="text-slate-400 leading-relaxed">
                                MouadVision started as a Mini Projet JEE 2025 at ENSA Khouribga.
                                The goal was to build a complete e-commerce platform with advanced
                                analytics and machine learning capabilities.
                            </p>
                            <p className="text-slate-400 leading-relaxed">
                                The platform currently manages 546 products from 8 verified sellers,
                                with 2,829 completed orders. It includes predictive analytics for
                                product ranking, bestseller detection, and price optimization.
                            </p>
                            <p className="text-slate-400 leading-relaxed">
                                Built with Spring Boot, React TypeScript, MySQL, and Python ML services.
                                The system demonstrates enterprise-level architecture and real-world
                                business intelligence integration.
                            </p>
                        </div>

                        <div className="space-y-4">
                            <div className="p-6 bg-slate-900 border border-slate-800 rounded-lg">
                                <h3 className="font-semibold mb-2">Technology Stack</h3>
                                <p className="text-sm text-slate-400">
                                    Spring Boot, React, TypeScript, MySQL, Python, Flask ML Services
                                </p>
                            </div>

                            <div className="p-6 bg-slate-900 border border-slate-800 rounded-lg">
                                <h3 className="font-semibold mb-2">Key Features</h3>
                                <p className="text-sm text-slate-400">
                                    Product management, Order processing, Analytics dashboard, ML predictions
                                </p>
                            </div>

                            <div className="p-6 bg-slate-900 border border-slate-800 rounded-lg">
                                <h3 className="font-semibold mb-2">Current Stats</h3>
                                <p className="text-sm text-slate-400">
                                    546 products • 2,829 orders • 8 sellers • 4.3★ rating
                                </p>
                            </div>

                            <div className="p-6 bg-slate-900 border border-slate-800 rounded-lg">
                                <h3 className="font-semibold mb-2">Project Type</h3>
                                <p className="text-sm text-slate-400">
                                    Academic project (Mini Projet JEE 2025) • ENSA Khouribga
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Technical Highlights */}
            <section className="py-20 px-4 bg-slate-900/30">
                <div className="max-w-7xl mx-auto">
                    <h2 className="text-2xl font-bold mb-12 text-center">Technical Capabilities</h2>
                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="space-y-3">
                            <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center">
                                <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-semibold">Analytics Dashboard</h3>
                            <p className="text-sm text-slate-400">
                                Real-time sales tracking, revenue trends, category analysis, and seller performance metrics.
                            </p>
                        </div>

                        <div className="space-y-3">
                            <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center">
                                <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-semibold">Machine Learning</h3>
                            <p className="text-sm text-slate-400">
                                Predictive models for product rankings, bestseller detection, and optimal pricing recommendations.
                            </p>
                        </div>

                        <div className="space-y-3">
                            <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center">
                                <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-semibold">Full-Stack Platform</h3>
                            <p className="text-sm text-slate-400">
                                Complete admin panel, seller dashboard, buyer interface, and analyst tools with role-based access.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Founder Section */}
            <section className="py-20 px-4">
                <div className="max-w-4xl mx-auto">
                    <h2 className="text-2xl font-bold mb-12 text-center">Founder & Developer</h2>
                    <div className="flex flex-col md:flex-row items-center gap-8 p-8 bg-slate-900 border border-slate-800 rounded-lg">
                        <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-5xl flex-shrink-0">
                            👨‍💻
                        </div>
                        <div className="flex-1 text-center md:text-left">
                            <h3 className="text-2xl font-bold mb-2">Mouad El Abbassi</h3>
                            <p className="text-blue-400 mb-4">Founder & Full-Stack Developer</p>
                            <p className="text-slate-400 leading-relaxed">
                                Computer Science student at ENSA Khouribga specializing in full-stack development,
                                data science, and machine learning. Built MouadVision as a demonstration of
                                enterprise-level software architecture and business intelligence integration.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Project Goals */}
            <section className="py-20 px-4 bg-slate-900/30">
                <div className="max-w-4xl mx-auto">
                    <h2 className="text-2xl font-bold mb-8 text-center">Project Objectives</h2>
                    <div className="space-y-4">
                        <div className="p-6 bg-slate-900 border border-slate-800 rounded-lg">
                            <h3 className="font-semibold mb-2">✓ Full-Stack E-commerce Platform</h3>
                            <p className="text-sm text-slate-400">
                                Complete marketplace with product management, order processing, and multi-role access control.
                            </p>
                        </div>

                        <div className="p-6 bg-slate-900 border border-slate-800 rounded-lg">
                            <h3 className="font-semibold mb-2">✓ Advanced Analytics Dashboard</h3>
                            <p className="text-sm text-slate-400">
                                Real-time business intelligence with sales tracking, revenue analysis, and performance metrics.
                            </p>
                        </div>

                        <div className="p-6 bg-slate-900 border border-slate-800 rounded-lg">
                            <h3 className="font-semibold mb-2">✓ Machine Learning Integration</h3>
                            <p className="text-sm text-slate-400">
                                Predictive models for product rankings, bestseller detection, and price optimization using Python ML services.
                            </p>
                        </div>

                        <div className="p-6 bg-slate-900 border border-slate-800 rounded-lg">
                            <h3 className="font-semibold mb-2">✓ Enterprise Architecture</h3>
                            <p className="text-sm text-slate-400">
                                Microservices design, RESTful APIs, secure authentication, and scalable database architecture.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-20 px-4">
                <div className="max-w-3xl mx-auto text-center">
                    <h2 className="text-3xl font-bold mb-6">Explore the Platform</h2>
                    <p className="text-xl text-slate-400 mb-8">
                        Browse products or create an account to see the full system in action.
                    </p>
                    <div className="flex flex-wrap gap-4 justify-center">
                        <Link
                            to="/explore"
                            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                        >
                            Browse Products
                        </Link>
                        <Link
                            to="/signup"
                            className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-lg transition-colors"
                        >
                            Create Account
                        </Link>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-slate-800 py-8 px-4">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                            <img src="/images/logo/logo.png" alt="MouadVision" className="h-8 w-auto" />
                            <span className="font-semibold">MouadVision</span>
                        </div>
                        <div className="flex items-center gap-6 text-sm text-slate-400">
                            <Link to="/" className="hover:text-white transition-colors">Home</Link>
                            <Link to="/explore" className="hover:text-white transition-colors">Shop</Link>
                            <Link to="/about" className="hover:text-white transition-colors">About</Link>
                        </div>
                        <p className="text-sm text-slate-500">
                            © 2025 MouadVision
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default AboutPage;