import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Toaster } from 'sonner';
import { SettingsProvider } from './context/SettingsContext';
import { CartProvider } from './context/CartContext';
import { UserAuthProvider, RequireUserAuth } from './context/UserAuthContext';
import { WishlistProvider } from './context/WishlistContext';
import { AdminAuthProvider, RequireAuth } from './admin/AdminAuth';
import AdminLayout from './admin/AdminLayout';
import { lazy, Suspense, useEffect } from 'react';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

function AdaptiveToaster() {
  const { pathname } = useLocation();
  const isAdmin = pathname.startsWith('/admin');
  return (
    <Toaster
      position={isAdmin ? 'bottom-right' : 'bottom-left'}
      richColors
      closeButton
      expand
      visibleToasts={3}
    />
  );
}

const HomePage     = lazy(() => import('./pages/HomePage'));
const CatalogPage  = lazy(() => import('./pages/CatalogPage'));
const ProductPage  = lazy(() => import('./pages/ProductPage'));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'));
const LoginPage    = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const NotFoundPage  = lazy(() => import('./pages/NotFoundPage'));
const AboutPage     = lazy(() => import('./pages/AboutPage'));
const ContactPage   = lazy(() => import('./pages/ContactPage'));
const ProfilePage   = lazy(() => import('./pages/ProfilePage'));

const AdminLogin     = lazy(() => import('./admin/pages/AdminLogin'));
const AdminDashboard = lazy(() => import('./admin/pages/AdminDashboard'));
const AdminOrders    = lazy(() => import('./admin/pages/AdminOrders'));
const AdminProducts  = lazy(() => import('./admin/pages/AdminProducts'));
const AdminBanners   = lazy(() => import('./admin/pages/AdminBanners'));
const AdminSettings  = lazy(() => import('./admin/pages/AdminSettings'));

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-orange border-t-transparent" />
    </div>
  );
}

export default function App() {
  // Provider order matters: Cart is auth-independent (intentional — cart persists across login/logout).
  // UserAuth must wrap Wishlist because WishlistContext reads the auth user to sync with Supabase.
  return (
    <SettingsProvider>
    <CartProvider>
      <UserAuthProvider>
      <WishlistProvider>
      <BrowserRouter>
        <AdminAuthProvider>
          <AdaptiveToaster />
          <ScrollToTop />
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/"                  element={<HomePage />} />
              <Route path="/shop"              element={<CatalogPage />} />
              <Route path="/collections/:slug" element={<CatalogPage />} />
              <Route path="/brands/:brand"     element={<CatalogPage />} />
              <Route path="/products/:slug"    element={<ProductPage />} />
              <Route path="/checkout"          element={<CheckoutPage />} />
              <Route path="/about"             element={<AboutPage />} />
              <Route path="/contact"           element={<ContactPage />} />
              <Route path="/login"             element={<LoginPage />} />
              <Route path="/register"          element={<RegisterPage />} />
              <Route path="/profile"           element={<RequireUserAuth><ProfilePage /></RequireUserAuth>} />
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin" element={<RequireAuth><AdminLayout><AdminDashboard /></AdminLayout></RequireAuth>} />
              <Route path="/admin/orders" element={<RequireAuth><AdminLayout><AdminOrders /></AdminLayout></RequireAuth>} />
              <Route path="/admin/products" element={<RequireAuth><AdminLayout><AdminProducts /></AdminLayout></RequireAuth>} />
              <Route path="/admin/banners" element={<RequireAuth><AdminLayout><AdminBanners /></AdminLayout></RequireAuth>} />
              <Route path="/admin/settings" element={<RequireAuth><AdminLayout><AdminSettings /></AdminLayout></RequireAuth>} />
              <Route path="*"                  element={<NotFoundPage />} />
            </Routes>
          </Suspense>
        </AdminAuthProvider>
      </BrowserRouter>
      </WishlistProvider>
      </UserAuthProvider>
    </CartProvider>
    </SettingsProvider>
  );
}
