import { BrowserRouter as Router, Routes, Route } from "react-router";
import SignIn from "./pages/AuthPages/SignIn";
import SignUp from "./pages/AuthPages/SignUp";
import NotFound from "./pages/OtherPage/NotFound";
import UserProfiles from "./pages/UserProfiles";
import AppLayout from "./layout/AppLayout";
import { ScrollToTop } from "./components/common/ScrollToTop";
import Home from "./pages/Dashboard/Home";
import ProductsPage from "./pages/Dashboard/ProductsPage"; // NEW

export default function App() {
    return (
        <>
            <Router>
                <ScrollToTop />
                <Routes>
                    {/* Dashboard Layout */}
                    <Route element={<AppLayout />}>
                        <Route index path="/" element={<Home />} />

                        {/* NEW: Products Page */}
                        <Route path="/products" element={<ProductsPage />} />

                        {/* Others Page */}
                        <Route path="/profile" element={<UserProfiles />} />
                    </Route>

                    {/* Auth Layout */}
                    <Route path="/signin" element={<SignIn />} />
                    <Route path="/signup" element={<SignUp />} />

                    {/* Fallback Route */}
                    <Route path="*" element={<NotFound />} />
                </Routes>
            </Router>
        </>
    );
}