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
      const response = await api.get('https://editable-travel-website1-rpfv.vercel.app/api/promotions', {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-2 sm:p-4">
      <div 
        className="relative bg-white rounded-xl sm:rounded-2xl max-w-xs xs:max-w-sm sm:max-w-md md:max-w-lg lg:max-w-2xl xl:max-w-3xl w-full shadow-2xl overflow-hidden border-0 mx-2" 
        style={{ fontFamily: "'Comic Sans MS', 'Comic Neue'" }}
      >
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-2 right-2 sm:top-3 sm:right-3 z-20 bg-gray-800 bg-opacity-80 backdrop-blur-sm rounded-full p-1.5 sm:p-2 shadow-lg hover:bg-opacity-90"
          style={{ fontFamily: "'Comic Sans MS', 'Comic Neue'" }}
          aria-label="Close promotion popup"
        >
          <X className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
        </button>

        {/* Main Content Layout */}
        <div className="flex flex-col sm:flex-row">
          {/* Left Side - Image (Mobile: Top, Desktop: Left) */}
          <div className="sm:w-2/5 relative promo-img-col">
            {promotion.imageUrl ? (
              <div className="relative h-40 xs:h-44 sm:h-full min-h-[160px] sm:min-h-0 overflow-hidden promo-img-container">
                <img
                  src={promotion.imageUrl}
                  alt={promotion.title}
                  className="w-full h-full object-cover promo-img"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-r from-[#074a5b]/20 to-[#1e809b]/20"></div>
              </div>
            ) : null}
            <div className="hidden w-full h-40 xs:h-44 sm:h-full bg-gradient-to-br from-[#074a5b] via-[#1e809b] to-[#074a5b] items-center justify-center relative">
              <Plane className="w-14 h-14 sm:w-18 sm:h-18 lg:w-24 lg:h-24 text-white opacity-30" />
              <div className="absolute inset-0 bg-black bg-opacity-10"></div>
            </div>
          </div>
      {/* Desktop image full height adjustment */}
      <style>{`
        @media (min-width: 640px) {
          .promo-img-col {
            height: 100%;
            min-height: 320px;
            display: flex;
            flex-direction: column;
          }
          .promo-img-container {
            height: 100%;
            min-height: 320px;
          }
          .promo-img {
            height: 100% !important;
            min-height: 520px;
            object-fit: cover;
          }
        }
      `}</style>

          {/* Right Side - Content */}
          <div className="sm:w-3/5 p-4 xs:p-5 sm:p-5 md:p-6 lg:p-7 flex flex-col justify-center bg-gradient-to-br from-gray-50 to-white">
            {/* Title Section */}
            <div className="mb-4 sm:mb-5">
              <div className="flex items-start mb-3">
                <div className="bg-gradient-to-r from-[#074a5b] to-[#1e809b] rounded-xl sm:rounded-2xl p-2 sm:p-2.5 mr-3 sm:mr-4 shadow-lg">
                  <Gift className="w-4 h-4 xs:w-5 xs:h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h2 className="text-base xs:text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-[#074a5b] leading-tight mb-2" style={{ fontFamily: "'Comic Sans MS', 'Comic Neue'" }}>
                    {promotion.title}
                  </h2>
                  <div className="w-10 sm:w-12 h-1 sm:h-1 bg-gradient-to-r from-[#074a5b] to-[#1e809b] rounded-full"></div>
                </div>
              </div>
              
              <p className="text-sm xs:text-sm sm:text-base text-gray-600 leading-relaxed"style={{ fontFamily: "'Comic Sans MS', 'Comic Neue'" }}>
                {promotion.description}
              </p>
            </div>

            {/* Countdown Section */}
            <div className="mb-4 sm:mb-5">
              <div className="bg-white rounded-xl sm:rounded-2xl p-4 xs:p-4 sm:p-5 shadow-lg border-2 border-gradient-to-r border-[#1e809b]/20">
                <div className="flex items-center justify-center mb-2 sm:mb-3">
                  <div className="bg-gradient-to-r from-[#074a5b] to-[#1e809b] rounded-full p-1.5 sm:p-2 mr-2 sm:mr-3">
                    <Calendar className="w-3.5 h-3.5 xs:w-4 xs:h-4 sm:w-4 sm:h-4 text-white" />
                  </div>
                  <span className="text-sm xs:text-sm sm:text-base font-bold text-[#074a5b] uppercase tracking-wide">
                    {promotion.countdownLabel}
                  </span>
                </div>
                <div className="text-center">
                  <div className="text-xl xs:text-2xl sm:text-3xl font-bold bg-gradient-to-r from-[#074a5b] to-[#1e809b] bg-clip-text text-transparent mb-2">
                    {timeLeft ? `${timeLeft} left` : 'Loading...'}
                  </div>
                  <div className="flex items-center justify-center text-sm sm:text-sm text-gray-600">
                    <MapPin className="w-3.5 h-3.5 xs:w-4 xs:h-4 mr-2 text-[#1e809b]" />
                    Valid until: {new Date(promotion.validUntil).toLocaleDateString('de-DE', {
                      weekday: 'short',
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* CTA Button */}
            <div className="mb-3 sm:mb-4">
              <button
                onClick={handleCTAClick}
                className="w-full bg-gradient-to-r from-[#074a5b] to-[#1e809b] hover:from-[#074a5b]/90 hover:to-[#1e809b]/90 text-white font-bold py-3 xs:py-3.5 sm:py-4 px-4 xs:px-5 sm:px-6 rounded-xl sm:rounded-2xl flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl text-sm xs:text-base sm:text-base"
                style={{ fontFamily: "'Comic Sans MS', 'Comic Neue'" }}
              >
                <Gift className="w-4 h-4 xs:w-5 xs:h-5 sm:w-5 sm:h-5" />
                <span>{promotion.buttonText}</span>
              </button>
            </div>

            {/* Trust Indicators */}
            <div className="flex items-center justify-center space-x-3 xs:space-x-4 sm:space-x-6 text-sm sm:text-sm text-gray-500">
              <span className="flex items-center bg-white px-3 xs:px-3 py-1 xs:py-1 rounded-full shadow-sm">
                <div className="w-2 h-2 bg-gradient-to-r from-[#074a5b] to-[#1e809b] rounded-full mr-2 xs:mr-2"></div>
                <span className="text-xs sm:text-sm">{promotion.trustIndicator1}</span>
              </span>
              <span className="flex items-center bg-white px-3 xs:px-3 py-1 xs:py-1 rounded-full shadow-sm">
                <div className="w-2 h-2 bg-gradient-to-r from-[#1e809b] to-[#074a5b] rounded-full mr-2 xs:mr-2"></div>
                <span className="text-xs sm:text-sm">{promotion.trustIndicator2}</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PromotionPopup;
