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
import CartPage from "./pages/Buyer/CartPage";
import CheckoutPage from "./pages/Buyer/CheckoutPage";
import OrderHistoryPage from "./pages/Buyer/OrderHistoryPage";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";

const RoleBasedRedirect: React. FC = () => {
    const { user } = useAuth();
    if (user?.role === 'BUYER') {
        return <Navigate to="/shop" replace />;
    }
    return <Navigate to="/dashboard" replace />;
};

const AdminRoute: React. FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    if (user?.role === 'BUYER') {
        return <Navigate to="/shop" replace />;
    }
    return <>{children}</>;
};

const BuyerRoute: React. FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    if (user?.role !== 'BUYER') {
        return <Navigate to="/dashboard" replace />;
    }
    return <>{children}</>;
};

export default function App() {
    return (
        <AuthProvider>
            <CartProvider>
                <Router>
                    <ScrollToTop />
                    <Routes>
                        {/* Public Routes */}
                        <Route path="/signin" element={<SignIn />} />
                        <Route path="/signup" element={<SignUp />} />
                        <Route path="/forgot-password" element={<ForgotPassword />} />

                        {/* Role-based redirect */}
                        <Route path="/" element={
                            <ProtectedRoute>
                                <RoleBasedRedirect />
                            </ProtectedRoute>
                        } />

                        {/* Admin/Analyst Routes */}
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

                        {/* Buyer Routes */}
                        <Route element={
                            <ProtectedRoute>
                                <BuyerRoute>
                                    <BuyerLayout />
                                </BuyerRoute>
                            </ProtectedRoute>
                        }>
                            <Route path="/shop" element={<ShopPage />} />
                            <Route path="/product/:asin" element={<ProductDetailPage />} />
                            <Route path="/cart" element={<CartPage />} />
                            <Route path="/checkout" element={<CheckoutPage />} />
                            <Route path="/my-orders" element={<OrderHistoryPage />} />
                            <Route path="/my-reviews" element={<MyReviewsPage />} />
                            <Route path="/buyer-profile" element={<BuyerProfilePage />} />
                        </Route>

                        {/* Fallback */}
                        <Route path="*" element={<NotFound />} />
                    </Routes>
                </Router>
            </CartProvider>
        </AuthProvider>
    );
}