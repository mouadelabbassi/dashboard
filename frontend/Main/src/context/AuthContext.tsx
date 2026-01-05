import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

interface User {
    id: number;
    email:  string;
    fullName: string;
    role: string;
    phone?:  string;
    bio?: string;
    isVerifiedSeller?: boolean;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    login: (email: string, password:  string) => Promise<void>;
    register: (
        email: string,
        password: string,
        fullName:  string,
        role: string,
        securityQuestion: string,
        securityAnswer: string,
        storeName?:  string
    ) => Promise<void>;
    logout: () => void;
    updateUserProfile: (fullName: string, phone?:  string, bio?: string) => Promise<void>;
    refreshUserData: () => Promise<void>;
    isAuthenticated: boolean;
    isLoading: boolean;
    isVerifiedSeller: boolean;
    handleDeactivation: (message: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEACTIVATION_MESSAGE = 'Your account has been deactivated for violating platform policies.';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const storedToken = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');

        if (storedToken && storedUser) {
            setToken(storedToken);
            setUser(JSON.parse(storedUser));
            axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
        }
        setIsLoading(false);
    }, []);

    useEffect(() => {
        const interceptor = axios.interceptors.response.use(
            (response) => response,
            (error) => {
                if (error.response?.status === 403) {
                    const message = error.response?.data?.message || '';
                    if (message.includes('deactivated') || message.includes('violating')) {
                        handleDeactivation(message);
                    }
                }
                return Promise.reject(error);
            }
        );

        return () => {
            axios.interceptors.response.eject(interceptor);
        };
    }, []);

    const handleDeactivation = (message: string) => {
        setUser(null);
        setToken(null);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.setItem('deactivation_message', message || DEACTIVATION_MESSAGE);
        delete axios.defaults.headers.common['Authorization'];
        window.location.href = '/signin? deactivated=true';
    };

    const login = async (email: string, password: string) => {
        try {
            const response = await axios.post('http://localhost:8080/api/auth/login', {
                email,
                password
            });

            if (response.data.success) {
                const { token:  authToken, id, email: userEmail, fullName, role, isVerifiedSeller } = response.data.data;

                const userData:  User = { id, email:  userEmail, fullName, role, isVerifiedSeller };

                setToken(authToken);
                setUser(userData);

                localStorage.setItem('token', authToken);
                localStorage.setItem('user', JSON.stringify(userData));
                localStorage.removeItem('deactivation_message');
                axios.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
            } else {
                throw new Error(response.data.message || 'Login failed');
            }
        } catch (error:  any) {
            const message = error.response?.data?.message || 'Login failed';
            if (message.includes('deactivated') || message.includes('violating')) {
                localStorage.setItem('deactivation_message', message);
                throw new Error(message);
            }
            throw new Error(message);
        }
    };

    const register = async (
        email: string,
        password: string,
        fullName: string,
        role: string,
        securityQuestion: string,
        securityAnswer: string,
        storeName?: string
    ) => {
        try {
            const response = await axios.post('http://localhost:8080/api/auth/register', {
                email,
                password,
                fullName,
                role,
                securityQuestion,
                securityAnswer,
                storeName
            });

            if (response.data.success) {
                const { token: authToken, id, email: userEmail, fullName:  userName, role:  userRole, isVerifiedSeller } = response.data.data;

                const userData: User = { id, email: userEmail, fullName: userName, role: userRole, isVerifiedSeller };

                setToken(authToken);
                setUser(userData);

                localStorage.setItem('token', authToken);
                localStorage.setItem('user', JSON.stringify(userData));
                axios.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
            } else {
                throw new Error(response.data.message || 'Registration failed');
            }
        } catch (error: any) {
            const message = error.response?.data?.message || 'Registration failed';
            if (message.includes('deactivated') || message.includes('violating')) {
                throw new Error(message);
            }
            throw new Error(message);
        }
    };

    const updateUserProfile = async (fullName:  string, phone?: string, bio?:  string) => {
        try {
            const response = await axios.put('http://localhost:8080/api/users/profile', {
                fullName,
                phone,
                bio
            });

            if (response.data.success) {
                const updatedUser = response.data.data;
                const userData: User = {
                    id: updatedUser.id,
                    email: updatedUser.email,
                    fullName: updatedUser.fullName,
                    role:  updatedUser.role,
                    phone: updatedUser.phone,
                    bio: updatedUser.bio,
                    isVerifiedSeller: updatedUser.isVerifiedSeller
                };

                setUser(userData);
                localStorage.setItem('user', JSON.stringify(userData));
            } else {
                throw new Error(response.data.message || 'Update failed');
            }
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Update failed');
        }
    };

    const refreshUserData = async () => {
        try {
            const response = await axios.get('http://localhost:8080/api/users/profile');

            if (response.data.success) {
                const updatedUser = response.data.data;
                const userData: User = {
                    id: updatedUser.id,
                    email: updatedUser.email,
                    fullName: updatedUser.fullName,
                    role: updatedUser.role,
                    phone: updatedUser.phone,
                    bio: updatedUser.bio,
                    isVerifiedSeller: updatedUser.isVerifiedSeller
                };

                setUser(userData);
                localStorage.setItem('user', JSON.stringify(userData));
            }
        } catch (error: any) {
            if (error.response?.status === 403) {
                const message = error.response?.data?.message || DEACTIVATION_MESSAGE;
                handleDeactivation(message);
            }
        }
    };

    const logout = () => {
        setUser(null);
        setToken(null);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        delete axios.defaults.headers.common['Authorization'];
    };

    const isVerifiedSeller = user?.role === 'SELLER' && user?.isVerifiedSeller === true;

    const value = {
        user,
        token,
        login,
        register,
        logout,
        updateUserProfile,
        refreshUserData,
        isAuthenticated: !!token,
        isLoading,
        isVerifiedSeller,
        handleDeactivation
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};