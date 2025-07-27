import React from 'react';
import { Routes, Route, Outlet, useLocation } from 'react-router-dom';
import Navigation from './screens/Navigation';
import HomeScreen from './screens/HomeScreen';
import Accommodations from './screens/Accommodations';
import Contact from './screens/Contact';
import Footer from './screens/Footer';
import ResortProfile from './screens/ResortProfile';
import Activities from './screens/Activities';
import ActivitiesProfile from './screens/ActivitiesProfile';
import Packages from './screens/Packages';
import Blogs from './screens/Blogs';
import BlogPage from './screens/BlogPage';
import ScrollRestoration from './screens/ScrollRestoration';
import AdminPanel from './components/AdminPanel';
import LogoFaviconManagement from './components/admin/LogoFaviconManagement';
import Login from './screens/Login';
import Register from './screens/Register';
import PromotionPopup from './components/PromotionPopup'; 
import { AuthProvider } from './components/context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

const Layout = () => {
  const location = useLocation();
  const isContactPage = location.pathname === '/contact';
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';
  const isAdminPage = location.pathname.startsWith('/admin') || location.pathname === '/logo-favicon';

  return (
    <>
      <Navigation />
      <Outlet />
      {!isContactPage && !isAuthPage && !isAdminPage && <PromotionPopup />}
      {!isContactPage && !isAuthPage && <Contact />}
      <Footer />
    </>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <div className="App">
        <ScrollRestoration />
        <Routes>
          <Route element={<Layout />}>
            {/* Public Routes */}
            <Route path="/" element={<HomeScreen />} />
            <Route path="/accommodations" element={<Accommodations />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/resort/:type/:id" element={<ResortProfile />} />
            <Route path="/activities" element={<Activities />} />
            <Route path="/activity/:activityId" element={<ActivitiesProfile />} />
            <Route path="/packageoffers" element={<Packages />} />
            <Route path="/blogs" element={<Blogs />} />
            <Route path="/blogs/:blogId" element={<BlogPage onBack={() => window.history.back()} />} />
            
            {/* Auth Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected Routes */}
            <Route path="/admin/*" element={
              <ProtectedRoute>
                <AdminPanel />
              </ProtectedRoute>
            } />
            <Route path="/logo-favicon" element={
              <ProtectedRoute>
                <LogoFaviconManagement />
              </ProtectedRoute>
            } />
          </Route>
        </Routes>
      </div>
    </AuthProvider>
  );
};

export default App;