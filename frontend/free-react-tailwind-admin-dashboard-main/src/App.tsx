import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Context Providers
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';

// Layouts
import AppLayout from './layout/AppLayout';
import BuyerLayout from './layout/BuyerLayout';
import SellerLayout from './layout/SellerLayout';

// Auth Pages
import SignIn from './pages/AuthPages/SignIn';
import SignUp from './pages/AuthPages/SignUp';
import ForgotPassword from './pages/AuthPages/ForgotPassword';
import AdminOrdersPage from './pages/Admin/AdminOrdersPage';

import AnalystLayout from './layout/AnalystLayout';
import AnalystDashboard from './pages/Analyst/AnalystDashboard';
import SalesAnalytics from './pages/Analyst/SalesAnalytics';
import ProductAnalytics from './pages/Analyst/ProductAnalytics';
import SellerAnalytics from './pages/Analyst/SellerAnalytics';
import CategoryAnalysis from './pages/Analyst/CategoryAnalysis';
import Reports from './pages/Analyst/Reports'
import SellerStockManagement from './pages/Seller/SellerStockManagement';
import AdminStockManagement from './pages/Admin/AdminStockManagement';
import SearchResultsPage from './pages/SearchResultsPage';




// Admin Pages
import Home from './pages/Dashboard/Home';
import ProductsPage from './pages/Dashboard/ProductsPage';
import ProductApprovals from './pages/Admin/ProductApprovals';
import NotificationsPage from './pages/NotificationsPage';
import UserProfiles from './pages/UserProfiles';

// Seller Pages
import SellerDashboard from './pages/Seller/SellerDashboard';
import SellerProducts from './pages/Seller/SellerProducts';
import SellerProductForm from './pages/Seller/SellerProductForm';
import SellerOrders from './pages/Seller/SellerOrders';
import SellerReviews from './pages/Seller/SellerReviews';
import SellerProfile from './pages/Seller/SellerProfile';

// Buyer Pages
import ShopPage from './pages/Buyer/ShopPage';
import ProductDetailPage from './pages/Buyer/ProductDetailPage';
import CartPage from './pages/Buyer/CartPage';
import CheckoutPage from './pages/Buyer/CheckoutPage';
import OrderHistoryPage from './pages/Buyer/OrderHistoryPage';
import BuyerProfilePage from './pages/Buyer/BuyerProfilePage';
import MyReviewsPage from './pages/Buyer/MyReviewsPage';

import SellerManagement from './pages/Admin/SellerManagement';

// Other Pages
import NotFound from './pages/OtherPage/NotFound';

// Auth Guard
interface PrivateRouteProps {
    children: React.ReactNode;
    allowedRoles: string[];
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children, allowedRoles }) => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');

    if (! token || !user) {
        return <Navigate to="/signin" replace />;
    }

    const userData = JSON.parse(user);
    if (! allowedRoles.includes(userData.role)) {
        switch (userData.role) {
            case 'ADMIN':
                return <Navigate to="/admin" replace />;
            case 'SELLER':
                return <Navigate to="/seller/dashboard" replace />;
            case 'BUYER':
                return <Navigate to="/shop" replace />;
            default:
                return <Navigate to="/signin" replace />;
        }
    }

    return <>{children}</>;
};

function App() {
    return (
        <AuthProvider>
            <CartProvider>
                <Router>
                    <Routes>
                        {/* Public Auth Routes */}
                        <Route path="/signin" element={<SignIn />} />
                        <Route path="/signup" element={<SignUp />} />
                        <Route path="/forgot-password" element={<ForgotPassword />} />

                        <Route
                            path="/analyst"
                            element={
                                <PrivateRoute allowedRoles={['ANALYST', 'ADMIN']}>
                                    <AnalystLayout />
                                </PrivateRoute>
                            }
                        >
                            <Route index element={<AnalystDashboard />} />
                            <Route path="sales" element={<SalesAnalytics />} />
                            <Route path="products" element={<ProductAnalytics />} />
                            <Route path="sellers" element={<SellerAnalytics />} />
                            <Route path="categories" element={<CategoryAnalysis />} />
                            <Route path="search" element={<SearchResultsPage />} />
                            <Route path="reports" element={<Reports />} />
                            <Route path="profile" element={<UserProfiles />} />
                        </Route>

                        {/* Admin Routes */}
                        <Route
                            path="/admin"
                            element={
                                <PrivateRoute allowedRoles={['ADMIN']}>
                                    <AppLayout />
                                </PrivateRoute>
                            }
                        >
                            <Route index element={<Home />} />
                            <Route path="products" element={<ProductsPage />} />
                            <Route path="product-approvals" element={<ProductApprovals />} />
                            <Route path="notifications" element={<NotificationsPage />} />
                            <Route path="orders" element={<AdminOrdersPage />} />
                            <Route path="stock" element={<AdminStockManagement />} />
                            <Route path="profile" element={<UserProfiles />} />
                            <Route path="search" element={<SearchResultsPage />} />
                            <Route path="sellers" element={<SellerManagement />} />
                        </Route>

                        {/* Seller Routes - Including Shop Access */}
                        <Route
                            path="/seller"
                            element={
                                <PrivateRoute allowedRoles={['SELLER']}>
                                    <SellerLayout />
                                </PrivateRoute>
                            }
                        >
                            <Route index element={<Navigate to="/seller/dashboard" replace />} />
                            <Route path="dashboard" element={<SellerDashboard />} />
                            <Route path="products" element={<SellerProducts />} />
                            <Route path="products/new" element={<SellerProductForm />} />
                            <Route path="products/:asin/edit" element={<SellerProductForm />} />
                            <Route path="stock" element={<SellerStockManagement />} />
                            <Route path="orders" element={<SellerOrders />} />
                            <Route path="reviews" element={<SellerReviews />} />
                            <Route path="search" element={<SearchResultsPage />} />
                            <Route path="profile" element={<SellerProfile />} />
                            <Route path="notifications" element={<NotificationsPage />} />

                            {/* ✅ NEW: Seller can shop as buyer */}
                            <Route path="shop" element={<ShopPage />} />
                            <Route path="shop/product/:asin" element={<ProductDetailPage />} />
                            <Route path="shop/cart" element={<CartPage />} />
                            <Route path="shop/checkout" element={<CheckoutPage />} />
                            <Route path="shop/orders" element={<OrderHistoryPage />} />
                            <Route path="shop/my-reviews" element={<MyReviewsPage />} />
                        </Route>

                        {/* Buyer Routes */}
                        <Route
                            path="/shop"
                            element={
                                <PrivateRoute allowedRoles={['BUYER']}>
                                    <BuyerLayout />
                                </PrivateRoute>
                            }
                        >
                            <Route index element={<ShopPage />} />
                            <Route path="product/:asin" element={<ProductDetailPage />} />
                            <Route path="cart" element={<CartPage />} />
                            <Route path="checkout" element={<CheckoutPage />} />
                            <Route path="orders" element={<OrderHistoryPage />} />
                            <Route path="profile" element={<BuyerProfilePage />} />
                            <Route path="my-reviews" element={<MyReviewsPage />} />
                            <Route path="search" element={<SearchResultsPage />} />
                            <Route path="notifications" element={<NotificationsPage />} />
                        </Route>

                        {/* Root redirect */}
                        <Route path="/" element={<Navigate to="/signin" replace />} />

                        {/* 404 */}
                        <Route path="*" element={<NotFound />} />
                    </Routes>
                </Router>
            </CartProvider>
        </AuthProvider>
    );
}

export default App;