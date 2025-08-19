import React, { useEffect, useState, useContext } from 'react';
import { Routes, Route, Outlet, useLocation } from 'react-router-dom';
import Navigation from './screens/Navigation';
import HomeScreen from './screens/HomeScreen';
import Accommodations from './screens/Accommodations';
import Contact from './screens/Contact';
import Footer from './screens/Footer'; 
import WhatsappFloatingButton from './components/WhatsappFloatingButton';
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
import { AuthProvider, AuthContext } from './components/context/AuthContext';
import MaintenancePage from './components/MaintenancePage';
import ProtectedRoute from './components/ProtectedRoute';
import CookieConsentComponent from './components/CookieConsentComponent';

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

const AppContent = () => {
  const { user } = useContext(AuthContext);
  const [maintenance, setMaintenance] = useState(false);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    fetch('/api/ui-content/maintenance-status')
      .then(res => res.json())
      .then(data => {
        setMaintenance(data.maintenanceMode || false);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching maintenance status:', err);
        setMaintenance(false);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cyan-50 to-blue-100">
        <div className="text-center">
          <p className="text-lg text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  const isAdminOrAuthPage = location.pathname.startsWith('/admin') || location.pathname === '/login' || location.pathname === '/register';
  if (maintenance && !isAdminOrAuthPage && (!user || !user.isAdmin)) {
    return <MaintenancePage />;
  }

  return (
    <div className="App">
      <ScrollRestoration />
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<HomeScreen />} />
          <Route path="/accommodations" element={<Accommodations />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/resort/:type/:id" element={<ResortProfile />} />
          <Route path="/activities" element={<Activities />} />
          <Route path="/activity/:activityId" element={<ActivitiesProfile />} />
          <Route path="/packageoffers" element={<Packages />} />
          <Route path="/blogs" element={<Blogs />} />
          <Route path="/blogs/:blogId" element={<BlogPage onBack={() => window.history.back()} />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
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
      <WhatsappFloatingButton />
      <CookieConsentComponent />
    </div>
  );
};

const App = () => (
  <AuthProvider>
    <AppContent />
  </AuthProvider>
);

export default App;

