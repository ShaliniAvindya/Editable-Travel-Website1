import React, { useState, useEffect, useContext } from 'react';
import { X, Gift, Calendar, MapPin, Plane } from 'lucide-react';
import { AuthContext } from './context/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';

const PromotionPopup = ({ promotion: propPromotion, onClose }) => {
  const { api } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();
  const [promotion, setPromotion] = useState(propPromotion || null);
  const [isVisible, setIsVisible] = useState(false);
  const [timeLeft, setTimeLeft] = useState('');

  const isHomePage = location.pathname === '/' || location.pathname === '/home';

  useEffect(() => {
    // Only show popup on home page
    if (!isHomePage) {
      setIsVisible(false);
      return;
    }

    if (propPromotion) {
      setPromotion(propPromotion);
      setIsVisible(true);
    } else {
      checkForActivePromotion();
    }
  }, [propPromotion, isHomePage]);

  useEffect(() => {
    if (promotion && isVisible) {
      const updateCountdown = () => {
        const endDate = new Date(promotion.validUntil).getTime();
        const now = Date.now();
        const difference = endDate - now;

        if (difference <= 0) {
          setIsVisible(false);
          setTimeLeft('Expired');
          return;
        }

        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));

        if (days > 0) {
          setTimeLeft(`${days}d ${hours}h ${minutes}m`);
        } else if (hours > 0) {
          setTimeLeft(`${hours}h ${minutes}m`);
        } else {
          setTimeLeft(`${minutes}m`);
        }
      };

      updateCountdown();
      const interval = setInterval(updateCountdown, 60000);
      return () => clearInterval(interval);
    }
  }, [promotion, isVisible]);

  const checkForActivePromotion = async () => {
    // Only check for promotions on home page
    if (!isHomePage) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await api.get('/api/promotions', {
        headers: { 'x-auth-token': token },
      });
      
      if (response.data && response.data.length > 0) {
        const currentDate = new Date();
        const activePromotion = response.data.find(
          (p) =>
            p.isPopup &&
            new Date(p.validFrom) <= currentDate &&
            new Date(p.validUntil).setHours(23, 59, 59, 999) >= currentDate.getTime()
        );
        
        if (activePromotion) {
          setPromotion(activePromotion);
          setIsVisible(true);
        }
      }
    } catch (error) {
      console.error('Error fetching active promotions:', error);
    }
  };

  const handleClose = () => {
    setIsVisible(false);
    if (onClose) {
      onClose();
    }
  };

  const handleCTAClick = () => {
    if (promotion.buttonLink) {
      if (promotion.buttonLink.startsWith('http')) {
        window.open(promotion.buttonLink, '_blank', 'noopener,noreferrer');
      } else {
        window.open(window.location.origin + promotion.buttonLink, '_blank', 'noopener,noreferrer'); 
      }
    }
    handleClose();
  };

  if (!isVisible || !promotion) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4">
      <div 
        className="relative bg-white rounded-2xl max-w-3xl w-full shadow-2xl overflow-hidden border-0" 
        style={{ fontFamily: 'Comic Sans MS, cursive' }}
      >
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 z-20 bg-gray-800 bg-opacity-80 backdrop-blur-sm rounded-full p-2 shadow-lg hover:bg-opacity-90"
          style={{ fontFamily: 'Comic Sans MS, cursive' }}
          aria-label="Close promotion popup"
        >
          <X className="w-5 h-5 text-white" />
        </button>

        {/* Main Content Layout */}
        <div className="flex flex-col lg:flex-row min-h-[580px]">
          {/* Left Side - Image */}
          <div className="lg:w-2/5 relative">
            {promotion.imageUrl ? (
              <div className="relative h-72 lg:h-full overflow-hidden">
                <img
                  src={promotion.imageUrl}
                  alt={promotion.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-r from-[#074a5b]/20 to-[#1e809b]/20"></div>
              </div>
            ) : null}
            <div className="hidden w-full h-72 lg:h-full bg-gradient-to-br from-[#074a5b] via-[#1e809b] to-[#074a5b] items-center justify-center relative">
              <Plane className="w-24 h-24 text-white opacity-30" />
              <div className="absolute inset-0 bg-black bg-opacity-10"></div>
            </div>
          </div>

          {/* Right Side - Content */}
          <div className="lg:w-3/5 p-6 lg:p-8 flex flex-col justify-center bg-gradient-to-br from-gray-50 to-white">
            <div className="mb-6">
              <div className="flex items-start mb-3">
                <div className="bg-gradient-to-r from-[#074a5b] to-[#1e809b] rounded-2xl p-3 mr-4 shadow-lg">
                  <Gift className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl lg:text-3xl font-bold text-[#074a5b] leading-tight mb-2" style={{ fontFamily: 'Comic Sans MS, cursive' }}>
                    {promotion.title}
                  </h2>
                  <div className="w-12 h-1 bg-gradient-to-r from-[#074a5b] to-[#1e809b] rounded-full"></div>
                </div>
              </div>
              
              <p className="text-gray-600 leading-relaxed" style={{ fontFamily: 'Comic Sans MS, cursive' }}>
                {promotion.description}
              </p>
            </div>

            {/* Countdown Section */}
            <div className="mb-6">
              <div className="bg-white rounded-2xl p-5 shadow-lg border-2 border-gradient-to-r border-[#1e809b]/20">
                <div className="flex items-center justify-center mb-3">
                  <div className="bg-gradient-to-r from-[#074a5b] to-[#1e809b] rounded-full p-2 mr-3">
                    <Calendar className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-base font-bold text-[#074a5b] uppercase tracking-wide">
                    {promotion.countdownLabel}
                  </span>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold bg-gradient-to-r from-[#074a5b] to-[#1e809b] bg-clip-text text-transparent mb-2">
                    {timeLeft ? `${timeLeft} left` : 'Loading...'}
                  </div>
                  <div className="flex items-center justify-center text-sm text-gray-600">
                    <MapPin className="w-4 h-4 mr-2 text-[#1e809b]" />
                    Valid until: {new Date(promotion.validUntil).toLocaleDateString('de-DE', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* CTA Button */}
            <div className="mb-4">
              <button
                onClick={handleCTAClick}
                className="w-full bg-gradient-to-r from-[#074a5b] to-[#1e809b] hover:from-[#074a5b]/90 hover:to-[#1e809b]/90 text-white font-bold py-4 px-6 rounded-2xl flex items-center justify-center space-x-3 shadow-lg hover:shadow-xl"
                style={{ fontFamily: 'Comic Sans MS, cursive' }}
              >
                <Gift className="w-5 h-5" />
                <span>{promotion.buttonText}</span>
              </button>
            </div>

            {/* Trust Indicators */}
            <div className="flex items-center justify-center space-x-6 text-sm text-gray-500">
              <span className="flex items-center bg-white px-3 py-1 rounded-full shadow-sm">
                <div className="w-2 h-2 bg-gradient-to-r from-[#074a5b] to-[#1e809b] rounded-full mr-2"></div>
                {promotion.trustIndicator1}
              </span>
              <span className="flex items-center bg-white px-3 py-1 rounded-full shadow-sm">
                <div className="w-2 h-2 bg-gradient-to-r from-[#1e809b] to-[#074a5b] rounded-full mr-2"></div>
                {promotion.trustIndicator2}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PromotionPopup;