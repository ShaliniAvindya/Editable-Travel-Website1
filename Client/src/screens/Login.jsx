import React, { useState, useEffect, useContext } from 'react';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import axios from 'axios';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock } from 'lucide-react';
import { AuthContext } from '../components/context/AuthContext';

const api = axios.create({
  baseURL: 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json'
  }
});

const Login = () => {
  const { user, login, redirectPath, setRedirectPath } = useContext(AuthContext);
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarType, setSnackbarType] = useState('');
  const [loading, setLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationType, setNotificationType] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Redirect authenticated admins
    if (user && user.isAdmin) {
      navigate('/admin', { replace: true });
      return;
    }
    if (!user && !location.state?.from?.pathname?.startsWith('/admin')) {
      navigate('/', { replace: true });
      return;
    }

    setIsVisible(true);
    if (location.state?.message) {
      setSnackbarType('info');
      setSnackbarMessage(location.state.message);
      setOpenSnackbar(true);
      navigate(location.pathname, { replace: true, state: {} });
    }
    // Set redirect path if coming from admin route
    if (location.state?.from) {
      setRedirectPath(location.state.from.pathname);
    }
  }, [location, navigate, setRedirectPath, user]);

  useEffect(() => {
    if (openSnackbar) {
      const timer = setTimeout(() => setOpenSnackbar(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [openSnackbar]);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    if (!formData.password) {
      newErrors.password = 'Password is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setSnackbarMessage('');
    setSnackbarType('');
    setLoading(true);
    try {
      const response = await api.post('/api/users/login', {
        email: formData.email,
        password: formData.password
      });
      
      const { token, user, message } = response.data;
      
      // Check if user is admin
      if (!user.isAdmin) {
        setLoading(false);
        showPopupNotification('Zugriff verweigert. Nur Admin!', 'error');
        return;
      }

      // Login first
      await login({ token, user });
      showPopupNotification('Login erfolgreich!!', 'success');
      navigate('/admin');
      
    } catch (error) {
      setLoading(false);
      const errorMessage = error.response?.data?.message || 'Login fehlgeschlagen';
      showPopupNotification(errorMessage, 'error');
      console.error('Login error:', error);
    }
  };

  const handleSnackbarClose = () => {
    setOpenSnackbar(false);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const showPopupNotification = (message, type) => {
    setNotificationMessage(message);
    setNotificationType(type);
    setShowNotification(true);
    setTimeout(() => {
      setShowNotification(false);
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-slate-800 to-blue-800">
      <div className="h-20"></div>
      <div className="flex items-center justify-center px-4 py-8">
        <div
          className={`w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden transform transition-all duration-1000 ${
            isVisible ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-10 opacity-0 scale-95'
          }`}
        >
          <div className="flex items-center justify-center p-8">
            <div className="w-full">
              <div className="text-center mb-10">
                <h1 className="text-5xl font-bold text-gray-800 mb-4">Willkommen Zurück</h1>
                <p className="text-gray-600">Bitte melden Sie sich bei Ihrem Konto an</p>
              </div>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">E-Mail-Adresse</label>
                  <div className="relative">
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="Geben Sie Ihre E-Mail ein"
                      className={`w-full px-4 py-3 pl-11 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all duration-200 ${
                        errors.email ? 'border-red-500' : 'border-gray-300'
                      } bg-gray-50 focus:bg-white hover:border-gray-400 hover:shadow-md`}
                      required
                    />
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  </div>
                  {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Passwort</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Geben Sie Ihr Passwort ein"
                      className={`w-full px-4 py-3 pl-11 pr-12 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all duration-200 ${
                        errors.password ? 'border-red-500' : 'border-gray-300'
                      } bg-gray-50 focus:bg-white hover:border-gray-400 hover:shadow-md`}
                      required
                    />
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                    </button>
                  </div>
                  {errors.password && <p className="text-sm text-red-500">{errors.password}</p>}
                </div>
                <div className="text-right">
                  <Link
                    to="/forgot-password"
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200 hover:underline"
                  >
                    Passwort vergessen?
                  </Link>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-900 to-slate-800 hover:from-blue-800 hover:to-slate-700 text-white font-semibold py-3.5 px-6 rounded-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Login...
                    </div>
                  ) : (
                    'Login'
                  )}
                </button>
                <div className="text-center pt-4">
                  <p className="text-gray-600">
                    Sie haben noch kein Konto?{' '}
                    <Link
                      to="/register"
                      onClick={scrollToTop}
                      className="text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200 hover:underline"
                    >
                      Konto erstellen
                    </Link>
                  </p>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
      {/* Notification Popup */}
      {showNotification && (
        <div className={`fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 ${
          notificationType === 'error' ? 'bg-red-500' : 
          notificationType === 'warning' ? 'bg-yellow-500' : 'bg-green-500'
        } text-white px-8 py-6 rounded-xl shadow-2xl flex flex-col items-center transition-all duration-300 animate-fadeIn min-w-[300px]`}>
          <p className="text-lg font-semibold text-center">{notificationMessage}</p>
          <div className="mt-4 w-full bg-white/20 h-1 rounded-full overflow-hidden">
            <div className="h-full bg-white animate-timer origin-left"></div>
          </div>
        </div>
      )}

      <style>{`
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
      `}</style>
    </div>
  );
};

export default Login;