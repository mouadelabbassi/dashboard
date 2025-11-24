import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

interface User {
    id: number;
    email: string;
    fullName: string;
    role: string;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    login: (email: string, password: string) => Promise<void>;
    register: (email: string, password: string, fullName: string, role: string, securityQuestion: string, securityAnswer: string) => Promise<void>;
    logout: () => void;
    isAuthenticated: boolean;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Check for stored token on mount
    useEffect(() => {
        const storedToken = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');

        if (storedToken && storedUser) {
            setToken(storedToken);
            setUser(JSON.parse(storedUser));
            // Set axios default header
            axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
        }
        setIsLoading(false);
    }, []);

    const login = async (email: string, password: string) => {
        try {
            const response = await axios.post('http://localhost:8080/api/auth/login', {
                email,
                password
            });

            if (response.data.success) {
                const { token: authToken, id, email: userEmail, fullName, role } = response.data.data;

                const userData: User = { id, email: userEmail, fullName, role };

                setToken(authToken);
                setUser(userData);

                // Store in localStorage
                localStorage.setItem('token', authToken);
                localStorage.setItem('user', JSON.stringify(userData));

                // Set axios default header
                axios.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
            } else {
                throw new Error(response.data.message || 'Login failed');
            }
        } catch (error: any) {
            console.error('Login error:', error);
            throw new Error(error.response?.data?.message || 'Login failed');
        }
    };

    const register = async (
        email: string,
        password: string,
        fullName: string,
        role: string,
        securityQuestion: string,
        securityAnswer: string
    ) => {
        try {
            const response = await axios.post('http://localhost:8080/api/auth/register', {
                email,
                password,
                fullName,
                role,
                securityQuestion,
                securityAnswer
            });

            if (response.data.success) {
                const { token: authToken, id, email: userEmail, fullName: userName, role: userRole } = response.data.data;

                const userData: User = { id, email: userEmail, fullName: userName, role: userRole };

                setToken(authToken);
                setUser(userData);

                // Store in localStorage
                localStorage.setItem('token', authToken);
                localStorage.setItem('user', JSON.stringify(userData));

                // Set axios default header
                axios.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
            } else {
                throw new Error(response.data.message || 'Registration failed');
            }
        } catch (error: any) {
            console.error('Registration error:', error);
            throw new Error(error.response?.data?.message || 'Registration failed');
        }
    };

    const logout = () => {
        setUser(null);
        setToken(null);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        delete axios.defaults.headers.common['Authorization'];
    };

    const value = {
        user,
        token,
        login,
        register,
        logout,
        isAuthenticated: !!token,
        isLoading
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