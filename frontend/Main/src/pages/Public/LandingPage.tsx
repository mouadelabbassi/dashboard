import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const LandingPage: React.FC = () => {
    const navigate = useNavigate();
    const { isAuthenticated, user } = useAuth();
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleGetStarted = () => {
        if (isAuthenticated && user) {
            switch (user.role) {
                case 'ADMIN':
                    navigate('/admin');
                    break;
                case 'SELLER':
                    navigate('/seller/dashboard');
                    break;
                case 'BUYER':
                    navigate('/shop');
                    break;
                default:
                    navigate('/signin');
            }
        } else {
            navigate('/signup');
        }
    };

    return (
        <div className="min-h-screen bg-[#0a0a0f] text-white overflow-x-hidden">
            <div className="fixed inset-0 z-0 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a0f] via-[#0d1025] to-[#0a0a0f]" />

                <div className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute top-[20%] right-[-10%] w-[600px] h-[600px] bg-blue-500/15 rounded-full blur-[150px] animate-pulse" style={{ animationDelay: '1s' }} />
                <div className="absolute bottom-[-10%] left-[30%] w-[700px] h-[700px] bg-blue-700/10 rounded-full blur-[180px] animate-pulse" style={{ animationDelay: '2s' }} />
                <div className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-radial from-blue-500/5 to-transparent rounded-full blur-[100px]" />
                <div
                    className="absolute inset-0 opacity-[0.02]"
                    style={{
                        backgroundImage: `linear-gradient(rgba(59, 130, 246, 0.5) 1px, transparent 1px), 
                                          linear-gradient(90deg, rgba(59, 130, 246, 0.5) 1px, transparent 1px)`,
                        backgroundSize: '50px 50px'
                    }}
                />
            </div>

            <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
                isScrolled
                    ? 'bg-[#050508]/95 backdrop-blur-xl border-b border-blue-500/10'
                    : 'bg-transparent'
            }`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-20">
                        {/* Logo */}
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
                        <div className="hidden md:flex items-center gap-8">
                            <Link to="/" className="text-white font-medium hover:text-blue-400 transition-colors">
                                Home
                            </Link>
                            <Link to="/explore" className="text-blue-100/60 hover:text-white transition-colors">
                                Explore Shop
                            </Link>
                            <Link to="/about" className="text-blue-100/60 hover:text-white transition-colors">
                                About Us
                            </Link>
                        </div>
                        <div className="flex items-center gap-3">
                            {isAuthenticated ? (
                                <button
                                    onClick={handleGetStarted}
                                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-all"
                                >
                                    Dashboard →
                                </button>
                            ) : (
                                <>
                                    <Link to="/signin" className="px-5 py-2.5 text-blue-100/70 hover:text-white font-medium transition-colors">
                                        Sign In
                                    </Link>
                                    <Link
                                        to="/signup"
                                        className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-all"
                                    >
                                        Get Started
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </nav>
            <section className="relative z-10 min-h-screen flex items-center justify-center pt-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg: px-8 text-center">
                    {/* Live Badge */}
                    <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-500/10 border border-blue-500/20 rounded-full mb-10 backdrop-blur-sm">
                        <span className="relative flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-400"></span>
                        </span>
                        <span className="text-blue-200 text-sm font-medium">Start Shopping Today!</span>
                    </div>

                    <h1 className="text-6xl md:text-7xl lg:text-8xl font-black mb-8 leading-[1.1] tracking-tight">
                        <span className="text-white">Discover</span>
                        <br />
                        <span className="bg-gradient-to-r from-blue-400 via-blue-300 to-cyan-400 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(59,130,246,0.5)]">
                            MouadVision Store
                        </span>
                    </h1>
                    <p className="text-xl md:text-2xl text-blue-100/60 max-w-3xl mx-auto mb-14 leading-relaxed font-light">
                        Your one-stop marketplace for quality electronics, fashion, and more.
                        <br />
                        <span className="text-white font-medium">Join thousands of happy customers</span>
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
                        <Link
                            to="/explore"
                            className="group px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-500 text-white font-bold text-lg rounded-2xl hover:shadow-2xl hover:shadow-blue-500/40 transition-all transform hover:scale-105 flex items-center gap-3 border border-blue-400/30"
                        >
                            Explore Products
                            <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                            </svg>
                        </Link>
                        <Link
                            to="/about"
                            className="px-8 py-4 bg-white/5 border border-blue-500/20 text-white font-semibold text-lg rounded-2xl hover:bg-blue-500/10 hover:border-blue-500/40 transition-all flex items-center gap-3 backdrop-blur-sm"
                        >
                            Learn More
                        </Link>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 max-w-4xl mx-auto">
                        {[
                            { value: '+1K', label: 'Products', color: 'from-blue-500 to-blue-600' },
                            { value: '+400', label:  'Happy Customers', color:  'from-blue-400 to-blue-500' },
                            { value: '+50', label: 'Verified Sellers', color:  'from-blue-500 to-cyan-500' },
                            { value:  '4.3', label: 'Average Rating', color: 'from-cyan-500 to-blue-500' },
                        ].map((stat) => (
                            <div
                                className="group relative p-6 bg-gradient-to-br from-blue-500/5 to-blue-600/5 rounded-2xl border border-blue-500/10 hover:border-blue-500/30 transition-all hover:scale-105 backdrop-blur-sm"
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover: opacity-100 rounded-2xl transition-opacity" />
                                <div className="relative">
                                    <div className="text-3xl font-black text-white mb-1">{stat.value}</div>
                                    <div className="text-blue-300/60 text-sm font-medium">{stat.label}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

            </section>
            <section className="relative z-10 py-32">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <span className="inline-block px-4 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-300 text-sm font-medium mb-4">
                            Why Choose Us
                        </span>
                        <h2 className="text-4xl md: text-5xl font-bold text-white mb-4">
                            The <span className="text-blue-400">MouadVision</span> Advantage
                        </h2>
                        <p className="text-blue-100/50 text-lg max-w-2xl mx-auto">
                            We provide the best shopping experience with premium features and unmatched quality
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6">
                        {[
                            {
                                title: 'Secure Shopping',
                                gradient: 'from-blue-600 to-blue-700',
                            },
                            {
                                title: 'Fast Delivery',
                                gradient: 'from-blue-500 to-blue-600',
                            },
                            {
                                title: 'Quality Products',
                                gradient: 'from-blue-500 to-cyan-600',
                            },
                            {
                                title: 'Best Prices',
                                gradient: 'from-cyan-600 to-blue-600',
                            },
                            {
                                title: 'Trusted Sellers',
                                gradient: 'from-blue-600 to-blue-500',
                            },
                            {
                                title: '24/7 Support',
                                gradient: 'from-blue-500 to-blue-600',
                            },
                        ].map((feature, i) => (
                            <div
                                key={i}
                                className="group relative p-8 bg-gradient-to-br from-[#0f1029] to-[#0a0a15] rounded-3xl border border-blue-500/10 hover:border-blue-500/30 transition-all hover: scale-[1.02] overflow-hidden"
                            >
                                {/* Hover glow effect */}
                                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="relative">
                                    <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* How It Works Section */}
            <section className="relative z-10 py-32 bg-gradient-to-b from-transparent via-blue-900/5 to-transparent">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <span className="inline-block px-4 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-300 text-sm font-medium mb-4">
                            Simple & Easy
                        </span>
                        <h2 className="text-4xl md: text-5xl font-bold text-white mb-4">
                            How It Works
                        </h2>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8 relative">


                        {[
                            { step: '01', title: 'Create Account', desc: 'Sign up in seconds with just your email' },
                            { step: '02', title: 'Browse & Shop', desc: 'Explore thousands of quality products'},
                            { step: '03', title: 'Checkout & Enjoy', desc: 'Secure payment and fast delivery' },
                        ].map((item, i) => (
                            <div key={i} className="relative text-center">
                                <span className="text-blue-400 font-mono text-sm font-bold mb-2 block">{item.step}</span>
                                <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
                                <p className="text-blue-100/50">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="relative z-10 py-32">
                <div className="max-w-4xl mx-auto px-4 sm: px-6 lg:px-8 text-center">
                    <div className="relative p-12 md:p-16 bg-gradient-to-br from-[#0f1029] to-[#0a0a15] rounded-3xl border border-blue-500/20 overflow-hidden">
                        {/* Background glow */}
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-transparent to-blue-500/10" />
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[100px]" />

                        <div className="relative">
                            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                                Ready to Start Shopping?
                            </h2>
                            <p className="text-xl text-blue-100/60 mb-10 max-w-xl mx-auto">
                                Join MouadVision today and discover amazing products from verified sellers worldwide.
                            </p>
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                                <Link
                                    to="/signup"
                                    className="px-8 py-4 bg-white text-[#0a0a0f] font-bold text-lg rounded-2xl hover:shadow-2xl hover:shadow-white/20 transition-all transform hover:scale-105"
                                >
                                    Create Free Account
                                </Link>
                                <Link
                                    to="/explore"
                                    className="px-8 py-4 border-2 border-blue-500/50 text-white font-semibold text-lg rounded-2xl hover:bg-blue-500/10 hover:border-blue-400 transition-all"
                                >
                                    Browse as Guest
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="relative z-10 py-12 border-t border-blue-500/10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-3">
                            <img
                                src="/images/logo/logo.png"
                                alt="MouadVision"
                                className="h-10 w-auto"
                                onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                }}
                            />
                            <span className="text-xl font-bold text-white">
                                Mouad<span className="text-blue-400">Vision</span>
                            </span>
                        </div>
                        <div className="flex items-center gap-8 text-blue-100/50">
                            <Link to="/about" className="hover:text-white transition-colors">About</Link>
                            <Link to="/explore" className="hover: text-white transition-colors">Shop</Link>
                        </div>
                        <p className="text-blue-100/30 text-sm">
                            © 2025 MouadVision. All rights reserved.
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;