import React from 'react';
import { Link } from 'react-router-dom';

const AboutPage: React.FC = () => {
    return (
        <div className="min-h-screen bg-gray-950">
            {/* Navbar */}
            <nav className="sticky top-0 z-50 bg-gray-900/95 backdrop-blur-lg border-b border-white/10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <Link to="/" className="flex items-center gap-3">
                            <img
                                src="/images/logo/logo.png"
                                alt="MouadVision"
                                className="h-10 w-auto"
                            />
                            <span className="text-xl font-bold text-white hidden sm:block">
                                Mouad<span className="text-blue-400">Vision</span>
                            </span>
                        </Link>
                        <div className="hidden md:flex items-center gap-6">
                            <Link to="/" className="text-gray-300 hover: text-white transition-colors">Home</Link>
                            <Link to="/explore" className="text-gray-300 hover:text-white transition-colors">Shop</Link>
                            <Link to="/about" className="text-white font-medium">About</Link>
                        </div>
                        <div className="flex items-center gap-4">
                            <Link to="/signin" className="text-gray-300 hover: text-white transition-colors">Sign In</Link>
                            <Link to="/signup" className="px-5 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-xl">
                                Get Started
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            <section className="py-20 bg-gradient-to-b from-blue-600/10 to-transparent">
                <div className="max-w-4xl mx-auto px-4 text-center">
                    <h1 className="text-5xl font-bold text-white mb-6">
                        About <span className="text-blue-400">MouadVision</span>
                    </h1>
                    <p className="text-xl text-gray-400 leading-relaxed">
                        We are an online marketplace dedicated to connecting buyers with quality products
                        from verified sellers around the world.
                    </p>
                </div>
            </section>
            <section className="py-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg: px-8">
                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        <div>
                            <h2 className="text-3xl font-bold text-white mb-6">Our Mission</h2>
                            <p className="text-gray-400 text-lg leading-relaxed mb-6">
                                At MouadVision, we believe everyone deserves access to quality products at fair prices.
                                Our platform empowers sellers to reach a global audience while providing buyers with
                                a secure shopping experience.
                            </p>
                            <p className="text-gray-400 text-lg leading-relaxed">
                                We're committed to innovation and customer satisfaction. Every feature
                                we build is designed with you in mind.
                            </p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            {[
                                { title: 'Our Vision', desc: 'To be the most trusted marketplace globally' },
                                { title: 'Innovation', desc: 'AI-powered search and recommendations' },
                                { title: 'Trust', desc: 'Verified sellers and secure payments' },
                                { title: 'Global', desc: 'Connecting buyers and sellers worldwide' },
                            ].map((item, i) => (
                                <div key={i} className="p-6 bg-gray-900/50 rounded-2xl border border-white/10">
                                    <h3 className="text-white font-semibold mb-2">{item.title}</h3>
                                    <p className="text-gray-500 text-sm">{item.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>
            <section className="py-20 bg-gray-900/30">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h2 className="text-3xl font-bold text-white mb-12">The Founder</h2>
                    <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
                        {[
                            { name: 'Mouad El Abbassi', role: 'Founder & CEO', avatar: '👨‍💻' },
                        ].map((member, i) => (
                            <div key={i} className="p-8 bg-gray-900/50 rounded-2xl border border-white/10 hover:border-blue-500/50 transition-all">
                                <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 text-4xl">
                                    {member.avatar}
                                </div>
                                <h3 className="text-xl font-semibold text-white mb-1">{member.name}</h3>
                                <p className="text-gray-500">{member.role}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
            <section className="py-20">
                <div className="max-w-3xl mx-auto px-4 text-center">
                    <h2 className="text-3xl font-bold text-white mb-6">Ready to Get Started?</h2>
                    <p className="text-gray-400 text-lg mb-8">
                        Join thousands of happy customers and start shopping today!
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link
                            to="/explore"
                            className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold rounded-2xl hover:shadow-lg transition-all"
                        >
                            Start Shopping
                        </Link>
                        <Link
                            to="/signup"
                            className="px-8 py-4 border-2 border-white/20 text-white font-semibold rounded-2xl hover: bg-white/10 transition-all"
                        >
                            Create Account
                        </Link>
                    </div>
                </div>
            </section>
            <footer className="border-t border-white/10 py-8">
                <div className="max-w-7xl mx-auto px-4 text-center text-gray-500">
                    © 2025 MouadVision. All rights reserved.
                </div>
            </footer>
        </div>
    );
};

export default AboutPage;