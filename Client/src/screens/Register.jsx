import React, { useState, useEffect } from 'react';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User } from 'lucide-react';
import { API_BASE_URL } from '../components/apiConfig';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarType, setSnackbarType] = useState('');
  const [loading, setLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [errors, setErrors] = useState({});
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationType, setNotificationType] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    setIsVisible(true);
  }, []);

  useEffect(() => {
    if (openSnackbar) {
      const timer = setTimeout(() => setOpenSnackbar(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [openSnackbar]);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'E-Mail ist ungültig';
    }
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Das Passwort muss mindestens 6 Zeichen lang sein';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSnackbarMessage('');
    setSnackbarType('');
    setLoading(true);

    const config = {
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true
    };

    try {
      const response = await axios.post(
        `${API_BASE_URL}/users/register`,
        {
          name: formData.name,
          email: formData.email,
          password: formData.password,
          isAdmin: true
        },
        config
      );
      console.log('Registration response:', response);

      showPopupNotification('Admin-Konto erfolgreich erstellt! Bitte melden Sie sich an.', 'success');

      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (error) {
      console.error('Registration error:', error);
      showPopupNotification(error.response?.data?.message || 'Die Administratorregistrierung ist fehlgeschlagen. Bitte versuchen Sie es erneut.', 'error');
    } finally {
      setLoading(false);
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
                <h1 className="text-5xl font-bold text-gray-800 mb-4">Erstellen Sie Ihr Admin-Konto</h1>
                <p className="text-gray-600">Registrieren Sie sich als Admin, um das System zu verwalten</p>
              </div>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Vollständiger Name</label>
                  <div className="relative">
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 pl-11 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all duration-200 ${
                        errors.name ? 'border-red-500' : 'border-gray-300'
                      } bg-gray-50 focus:bg-white hover:border-gray-400 hover:shadow-md`}
                      placeholder="Enter your full name"
                    />
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  </div>
                  {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">E-Mail-Adresse</label>
                  <div className="relative">
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 pl-11 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all duration-200 ${
                        errors.email ? 'border-red-500' : 'border-gray-300'
                      } bg-gray-50 focus:bg-white hover:border-gray-400 hover:shadow-md`}
                      placeholder="Geben Sie Ihre E-Mail ein"
                    />
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  </div>
                  {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Passwort</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 pl-11 pr-12 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all duration-200 ${
                        errors.password ? 'border-red-500' : 'border-gray-300'
                      } bg-gray-50 focus:bg-white hover:border-gray-400 hover:shadow-md`}
                      placeholder="Erstellen Sie ein Passwort"
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
                        viewBox="0 0 24 24"
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
                      Erstellen eines Admin-Kontos...
                    </div>
                  ) : (
                    'Admin-Konto erstellen'
                  )}
                </button>
                <div className="text-center pt-4">
                  <p className="text-gray-600">
                    Hast du schon ein Konto?{' '}
                    <Link
                      to="/login"
                      onClick={scrollToTop}
                      className="text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200 hover:underline"
                    >
                      Hier einloggen
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

export default Register;
