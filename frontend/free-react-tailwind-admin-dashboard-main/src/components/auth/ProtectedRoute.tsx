import { Navigate, useLocation } from 'react-router';
import { useAuth } from '../../context/AuthContext';

interface ProtectedRouteProps {
    children: React.ReactNode;
    requireAdmin?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
                                                                  children,
                                                                  requireAdmin = false
                                                              }) => {
    const { isAuthenticated, user, isLoading } = useAuth();
    const location = useLocation();

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!isAuthenticated) {
        // Redirect to signin with return URL
        return <Navigate to="/signin" state={{ from: location }} replace />;
    }

    if (requireAdmin && user?.role !== 'ADMIN') {
        // User is not admin, redirect to dashboard
        return <Navigate to="/" replace />;
    }

    return <>{children}</>;
};