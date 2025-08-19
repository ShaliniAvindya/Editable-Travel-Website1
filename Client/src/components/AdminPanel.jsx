import React, { useState, useEffect, useContext } from 'react';
import { Tabs, Spin, Input, message } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import ResortManagement from './admin/ResortManagement';
import AtollManagement from './admin/AtollManagement';
import ActivityManagement from './admin/ActivityManagement';
import PackageManagement from './admin/PackageManagement';
import BlogManagement from './admin/BlogManagement';
import InquiryManagement from './admin/InquiryManagement';
import UserManagement from './admin/UserManagement';
import UIContentManagement from './admin/UIContentManagement';
import PageContentManagement from './admin/PageContentManagement';
import PromotionManagement from './admin/PromotionManagement'; 
import LogoFaviconManagement from './admin/LogoFaviconManagement';
import { AuthContext } from './context/AuthContext';
import { useNavigate } from 'react-router-dom';

const customTabStyle = {
  tabBarStyle: {
    background: 'linear-gradient(135deg, #0e7490 0%, #1e3a8a 100%)',
    fontWeight: '600',
    fontSize: '16px',
    padding: '0 1rem',
    height: '4rem',
    margin: '0',
    borderRadius: '12px 12px 0 0',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  },
  inkBarStyle: {
    background: '#ffffff',
    height: '3px',
    borderRadius: '2px',
  },
};

const { TabPane } = Tabs;

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState('1');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationType, setNotificationType] = useState('');
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const { user, logout, api, loading: authLoading } = useContext(AuthContext);
  const navigate = useNavigate();

  // Fetch maintenance status
  useEffect(() => {
    api.get('/api/ui-content/maintenance-status')
      .then(response => {
        setMaintenanceMode(response.data.maintenanceMode || false);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching maintenance status:', err);
        message.error('Failed to fetch maintenance status');
        setMaintenanceMode(false);
        setLoading(false);
      });
  }, [api]);

  const handleToggleMaintenance = () => {
    const newMode = !maintenanceMode;
    api.post('/api/ui-content/maintenance-status', { maintenanceMode: newMode })
      .then(response => {
        setMaintenanceMode(response.data.maintenanceMode);
        message.success(`Maintenance mode ${response.data.maintenanceMode ? 'enabled' : 'disabled'}.`);
      })
      .catch(err => {
        console.error('Error toggling maintenance mode:', err);
        if (err.response?.status === 401) {
          message.error('Unauthorized: Please log in again.');
          logout('Session expired. Please log in again.');
        } else if (err.response?.status === 403) {
          message.error('Access denied: Admin privileges required.');
          logout('Admin access required.');
        } else {
          message.error('Failed to toggle maintenance mode');
        }
      });
  };

  // Authentication check
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        message.error('Please login to access this page.');
        setTimeout(() => navigate('/login'), 2000);
      } else if (!user.isAdmin) {
        message.warning('Access denied. This page is for administrators only.');
        setTimeout(() => navigate('/'), 2000);
      }
    }
  }, [user, authLoading, navigate, logout]);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  const handleTabChange = (key) => {
    setActiveTab(key);
  };

  const handleSearch = (value) => {
    setSearchTerm(value);
  };

  const handleLogout = () => {
    logout();
    message.success('Logged out successfully');
    navigate('/login');
  };

  const getTabName = (key) => {
    const tabNames = {
      '1': 'Resorts',
      '2': 'Islands',
      '3': 'Activities',
      '4': 'Packages',
      '5': 'Blogs',
      '6': 'Inquiries',
      '7': 'Users',
      '8': 'HomeUI',
      '9': 'PageContent',
      '10': 'Promotions',
      '11': 'Logo',
    };
    return tabNames[key] || 'Unknown';
  };

  const menuItems = [
    { key: '1', label: 'Resorts', component: <ResortManagement searchTerm={searchTerm} /> },
    { key: '2', label: 'Islands', component: <AtollManagement searchTerm={searchTerm} /> },
    { key: '3', label: 'Activities', component: <ActivityManagement searchTerm={searchTerm} /> },
    { key: '4', label: 'Packages', component: <PackageManagement searchTerm={searchTerm} /> },
    { key: '5', label: 'Blogs', component: <BlogManagement searchTerm={searchTerm} /> },
    { key: '6', label: 'Inquiries', component: <InquiryManagement searchTerm={searchTerm} /> },
    { key: '7', label: 'Users', component: <UserManagement searchTerm={searchTerm} /> },
    { key: '8', label: 'HomeUI', component: <UIContentManagement searchTerm={searchTerm} /> },
    { key: '9', label: 'PageContent', component: <PageContentManagement searchTerm={searchTerm} /> },
    { key: '10', label: 'Promotions', component: <PromotionManagement searchTerm={searchTerm} /> },
    { key: '11', label: 'Logo', component: <LogoFaviconManagement /> },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cyan-50 to-blue-100">
        <div className="text-center">
          <Spin size="large" />
          <p className="mt-4 text-lg text-gray-600 font-medium">Loading Admin Panel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-blue-50 flex flex-col">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-cyan-800 via-cyan-900 to-blue-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="relative container mx-auto px-4 py-16 md:py-24 text-center">
          <h1 className="text-3xl md:text-5xl font-bold mb-4 leading-tight">
            Admin Control Center
          </h1>
          <p className="text-lg md:text-xl max-w-3xl mx-auto opacity-90 mb-8">
            Efficiently manage resorts, Islands, activities, packages, blogs, inquiries, and users. Your centralized hub for seamless operations.
          </p>
          <button
            onClick={handleLogout}
            className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white font-semibold py-3 px-8 rounded-lg backdrop-blur-sm transition-all duration-200 border border-white border-opacity-30 hover:scale-105"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ margin: '2rem auto 0', maxWidth: '700px', padding: '1rem', background: '#fff', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.07)' }}>
        <label style={{ fontWeight: 'bold', fontSize: '1.1rem', marginRight: '1rem' }}>Maintenance Mode:</label>
        <button
          onClick={handleToggleMaintenance}
          style={{
            background: maintenanceMode ? '#e53e3e' : '#38a169',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            padding: '0.5rem 1.2rem',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '1rem',
            marginRight: '1rem',
            transition: 'background 0.2s',
          }}
        >
          {maintenanceMode ? 'Turn OFF' : 'Turn ON'}
        </button>
        <span style={{ color: maintenanceMode ? '#e53e3e' : '#38a169', fontWeight: 'bold', fontSize: '1.1rem' }}>
          {maintenanceMode ? 'ON' : 'OFF'}
        </span>
      </div>

      <div className="flex-grow container mx-auto px-4 py-8 flex justify-center">
        <div className="flex-grow bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 max-w-7xl w-full">
          <div className="p-6 md:p-8">
            {/* Tabs */}
            <Tabs
              activeKey={activeTab}
              onChange={handleTabChange}
              {...customTabStyle}
              className="w-full admin-tabs reduce-tab-gap"
              size="large"
              centered
            >
              {menuItems.map((item) => (
                <TabPane tab={item.label} key={item.key}>
                  <div className="p-4 min-h-[600px]">{item.component}</div>
                </TabPane>
              ))}
            </Tabs>
          </div>
        </div>
      </div>

      {/* Notification Popup */}
      {showNotification && (
        <div
          className={`fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 ${
            notificationType === 'error'
              ? 'bg-red-500'
              : notificationType === 'warning'
              ? 'bg-yellow-500'
              : 'bg-green-500'
          } text-white px-8 py-6 rounded-xl shadow-2xl flex flex-col items-center transition-all duration-300 animate-fadeIn min-w-[300px]`}
        >
          <p className="text-lg font-semibold text-center">{notificationMessage}</p>
          <div className="mt-4 w-full bg-white/20 h-1 rounded-full overflow-hidden">
            <div className="h-full bg-white animate-timer origin-left"></div>
          </div>
        </div>
      )}

      {/* Custom Styles */}
      <style>
        {`
          .admin-tabs .ant-tabs-tab {
            color: rgba(255, 255, 255, 0.9) !important;
            font-weight: 600 !important;
            padding: 0 16px !important;
            height: 3rem !important;
            display: flex !important;
            align-items: center !important;
            border-radius: 8px 8px 0 0 !important;
            margin-right: 2px !important;
            transition: all 0.3s ease !important;
            font-size: 0.9rem !important;
          }
          
          .admin-tabs .ant-tabs-tab:hover {
            color: rgb(255, 255, 255) !important;
          }
          
          .admin-tabs .ant-tabs-tab-active {
            color: #000000 !important;
            background: rgb(212, 214, 232) !important;
            font-weight: 700 !important;
          }
          
          .admin-tabs .ant-tabs-nav {
            margin-bottom: 1rem !important;
            display: flex !important;
            justify-content: center !important;
            width: 100% !important;
          }

          .admin-tabs .ant-tabs-nav-list {
            width: auto !important;
          }
          
          .admin-tabs .ant-tabs-content-holder {
            background: transparent !important;
          }
          
          .admin-tabs .ant-tabs-tabpane {
            background: transparent !important;
          }

          .ant-input-search-custom .ant-input {
            border-radius: 8px !important;
            border: 1px solid #e5e7eb !important;
          }

          .ant-input-search-custom .ant-btn {
            background: #1e3a8a !important;
            border-color: #1e3a8a !important;
            color: #ffffff !important;
            border-radius: 0 8px 8px 0 !important;
          }

          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translate(-50%, -60%);
            }
            to {
              opacity: 1;
              transform: translate(-50%, -50%);
            }
          }

          @keyframes timer {
            from {
              width: 100%;
            }
            to {
              width: 0%;
            }
          }

          .animate-fadeIn {
            animation: fadeIn 0.3s ease-out;
          }

          .animate-timer {
            animation: timer 3s linear;
          }

          .admin-tabs.reduce-tab-gap .ant-tabs-tab {
            margin-right: 0px !important;
            padding-left: 8px !important;
            padding-right: 8px !important;
          }

          @media (max-width: 600px) {
            .container {
              padding-left: 8px;
              padding-right: 8px;
            }

            .relative.container {
              padding: 2rem 1rem !important;
            }

            h1.text-3xl {
              font-size: 1.8rem !important;
              line-height: 1.3 !important;
              margin-bottom: 8px !important;
            }

            p.text-lg {
              font-size: 0.875rem !important;
              max-width: 100% !important;
              margin-bottom: 16px !important;
            }

            button.bg-white.bg-opacity-20 {
              padding: 0.5rem 1.5rem !important;
              font-size: 0.875rem !important;
            }

            .flex-grow.container {
              padding: 0.5rem !important;
            }

            .bg-white {
              margin: 0 !important;
              border-radius: 8px !important;
            }

            .p-6 {
              padding: 1rem !important;
            }

            .p-4 {
              padding: 0.5rem !important;
              min-height: auto !important;
            }

            .admin-tabs .ant-tabs-tab {
              font-size: 0.7rem !important;
              padding: 0 8px !important;
              height: 2.5rem !important;
              margin-right: 1px !important;
            }

            .admin-tabs ul {
              padding: 0 !important;
            }

            .admin-tabs .ant-tabs-nav {
              flex-wrap: wrap !important;
              padding: 0 0.5rem !important;
              height: auto !important;
            }

            .admin-tabs .ant-tabs-tab-active {
              font-size: 0.75rem !important;
            }

            .fixed.top-1/2 {
              min-width: 80vw !important;
              padding: 1rem !important;
              font-size: 0.875rem !important;
            }

            .admin-tabs .tabBarStyle {
              font-size: 14px !important;
              padding: 0 1rem !important;
              height: 3rem !important;
              border-radius: 8px 8px 0 !important;
            }
          }

          @media (max-width: 400px) {
            .admin-tabs .ant-tabs-tab {
              font-size: 0.65rem !important;
              padding: 0 6px !important;
            }

            .fixed.top-1/2 {
              min-width: 90vw !important;
              padding: 0.75rem !important;
              font-size: 0.8rem !important;
            }
          }
        `}
      </style>
    </div>
  );
};

export default AdminPanel;

