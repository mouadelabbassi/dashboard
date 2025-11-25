import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router";
import SignIn from "./pages/AuthPages/SignIn";
import SignUp from "./pages/AuthPages/SignUp";
import ForgotPassword from "./pages/AuthPages/ForgotPassword";
import NotFound from "./pages/OtherPage/NotFound";
import UserProfiles from "./pages/UserProfiles";
import AppLayout from "./layout/AppLayout";
import BuyerLayout from "./layout/BuyerLayout";
import { ScrollToTop } from "./components/common/ScrollToTop";
import Home from "./pages/Dashboard/Home";
import ProductsPage from "./pages/Dashboard/ProductsPage";
import ShopPage from "./pages/Buyer/ShopPage";
import ProductDetailPage from "./pages/Buyer/ProductDetailPage";
import MyReviewsPage from "./pages/Buyer/MyReviewsPage";
import BuyerProfilePage from "./pages/Buyer/BuyerProfilePage";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";

// Component to redirect based on role
const RoleBasedRedirect: React.FC = () => {
    const { user } = useAuth();

    if (user?.role === 'BUYER') {
        return <Navigate to="/shop" replace />;
    }
    return <Navigate to="/dashboard" replace />;
};

// Protected route for Admin/Analyst only
const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();

    if (user?.role === 'BUYER') {
        return <Navigate to="/shop" replace />;
    }
    return <>{children}</>;
};

// Protected route for Buyers only
const BuyerRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();

    if (user?.role !== 'BUYER') {
        return <Navigate to="/dashboard" replace />;
    }
    return <>{children}</>;
};

export default function App() {
    return (
        <AuthProvider>
            <Router>
                <ScrollToTop />
                <Routes>
                    {/* Public Routes - Auth Pages */}
                    <Route path="/signin" element={<SignIn />} />
                    <Route path="/signup" element={<SignUp />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />

                    {/* Role-based redirect for root */}
                    <Route path="/" element={
                        <ProtectedRoute>
                            <RoleBasedRedirect />
                        </ProtectedRoute>
                    } />

                    {/* Admin/Analyst Routes - Dashboard Layout */}
                    <Route element={
                        <ProtectedRoute>
                            <AdminRoute>
                                <AppLayout />
                            </AdminRoute>
                        </ProtectedRoute>
                    }>
                        <Route path="/dashboard" element={<Home />} />
                        <Route path="/products" element={<ProductsPage />} />
                        <Route path="/profile" element={<UserProfiles />} />
                    </Route>

                    {/* Buyer Routes - Buyer Layout */}
                    <Route element={
                        <ProtectedRoute>
                            <BuyerRoute>
                                <BuyerLayout />
                            </BuyerRoute>
                        </ProtectedRoute>
                    }>
                        <Route path="/shop" element={<ShopPage />} />
                        <Route path="/product/:asin" element={<ProductDetailPage />} />
                        <Route path="/my-reviews" element={<MyReviewsPage />} />
                        <Route path="/buyer-profile" element={<BuyerProfilePage />} />
                    </Route>

                    {/* Fallback Route */}
                    <Route path="*" element={<NotFound />} />
                </Routes>
            </Router>
        </AuthProvider>
    );
}