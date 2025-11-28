import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Existing Layouts
import AppLayout from './layout/AppLayout';
import BuyerLayout from './layout/BuyerLayout';
// New Layout
import SellerLayout from './layout/SellerLayout';

// Existing Auth Pages
import SignIn from './pages/AuthPages/SignIn';
import SignUp from './pages/AuthPages/SignUp';
// Auth Context
import { AuthProvider } from './context/AuthContext';

// Existing Dashboard Pages (Admin)
import Home from './pages/Dashboard/Home';
import ProductsPage from './pages/Dashboard/ProductsPage';
// New Admin Page
import ProductApprovals from './pages/Admin/ProductApprovals';

// New Seller Pages
import SellerDashboard from './pages/Seller/SellerDashboard';
import SellerProducts from './pages/Seller/SellerProducts';
import SellerProductForm from './pages/Seller/SellerProductForm';
import SellerOrders from './pages/Seller/SellerOrders';
import SellerReviews from './pages/Seller/SellerReviews';
import SellerProfile from './pages/Seller/SellerProfile';

// Existing Buyer Pages
import ShopPage from './pages/Buyer/ShopPage';
import ProductDetailPage from './pages/Buyer/ProductDetailPage';
import CartPage from './pages/Buyer/CartPage';
import CheckoutPage from './pages/Buyer/CheckoutPage';
import OrderHistoryPage from './pages/Buyer/OrderHistoryPage';
import BuyerProfilePage from './pages/Buyer/BuyerProfilePage';
import MyReviewsPage from './pages/Buyer/MyReviewsPage';

// Existing Other Pages
import NotFound from './pages/OtherPage/NotFound';
// New Page
import NotificationsPage from './pages/NotificationsPage';

// Auth Guard
interface PrivateRouteProps {
    children: React. ReactNode;
    allowedRoles: string[];
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children, allowedRoles }) => {
    const token = localStorage. getItem('token');
    const user = localStorage.getItem('user');

    if (!token || !user) {
        return <Navigate to="/signin" replace />;
    }

    const userData = JSON.parse(user);
    if (! allowedRoles. includes(userData.role)) {
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
            <Router>
                <Routes>
                    {/* Public Auth Routes */}
                    <Route path="/signin" element={<SignIn />} />
                    <Route path="/signup" element={<SignUp />} />

                    {/* Admin Routes - using existing AppLayout */}
                    <Route
                        path="/admin"
                        element={
                            <PrivateRoute allowedRoles={['ADMIN']}>
                                <AppLayout />
                            </PrivateRoute>
                        }
                    >
                        <Route index element={<Home/>} />
                        <Route path="/admin/products" element={<ProductsPage/>} />
                        <Route path="/admin/product-approvals" element={<ProductApprovals/>} />
                        <Route path="/admin/notifications" element={<NotificationsPage/>} />
                    </Route>

                    {/* Seller Routes - using new SellerLayout */}
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
                        <Route path="orders" element={<SellerOrders />} />
                        <Route path="reviews" element={<SellerReviews />} />
                        <Route path="profile" element={<SellerProfile />} />
                        <Route path="notifications" element={<NotificationsPage />} />
                    </Route>

                    {/* Buyer Routes - using existing BuyerLayout */}
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
                        <Route path="notifications" element={<NotificationsPage />} />
                    </Route>

                    {/* Root redirect */}
                    <Route path="/" element={<Navigate to="/signin" replace />} />

                    {/* 404 */}
                    <Route path="*" element={<NotFound />} />
                </Routes>
            </Router>
        </AuthProvider>
    );
}

export default App;
