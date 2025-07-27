import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Calendar, MapPin, Clock, Phone } from 'lucide-react';
import axios from 'axios';
import InquiryFormModal from './InquiryFormModal';

const API_URL = 'http://localhost:8000';

const Packages = () => {
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [showInquiryForm, setShowInquiryForm] = useState(false);
  const [buttonType, setButtonType] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState({});
  const [language, setLanguage] = useState('en');
  const [isVisible, setIsVisible] = useState(false);
  const [packages, setPackages] = useState([]);
  const [uiContent, setUiContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastClickTime, setLastClickTime] = useState(0);

  const translations = {
    en: {
      duration: 'Dauer',
      included: "Was ist enthalten",
      notIncluded: 'Nicht enthalten',
      expiresOn: 'Läuft ab am',
      bookNow: 'Buchen Sie per E-Mail',
      offerNumber: 'Angebots nummer',
      resort: 'Resort',
      activities: 'Aktivitäten',
      noPackages: 'Derzeit sind keine vorbereiteten Pakete verfügbar, wir arbeiten daran, aber Sie können uns jederzeit für individuelle Pakete kontaktieren.',
      noContent: 'Keine Inhalte verfügbar. Bitte kontaktieren Sie den Support.',
    },
  };

  const t = translations[language];

  // Check if package is expired
  const isExpired = (expiryDate) => {
    return new Date() > new Date(expiryDate);
  };

  // Filter active packages
  const activePackages = packages.filter((pkg) => !isExpired(pkg.expiryDate));

  useEffect(() => {
    const fetchData = async () => {
      try {
        const uiContentResponse = await axios.get(`${API_URL}/api/ui-content/packages`);
        setUiContent(uiContentResponse.data);

        // Fetch packages
        const packagesResponse = await axios.get(`${API_URL}/api/packages`);
        const mappedPackages = packagesResponse.data.map((pkg) => ({
          _id: pkg._id,
          title: pkg.title,
          price: `$${pkg.price.toLocaleString()}`,
          originalPrice: null,
          duration: `${pkg.nights + 1} Tage / ${pkg.nights} Nächte`,
          shortDescription: pkg.description || '',
          images: pkg.images.length > 0 ? pkg.images : ['https://via.placeholder.com/800'],
          included: pkg.included_items || [],
          activities: pkg.activities || [],
          notIncluded: pkg.excluded_items?.join(', ') || '',
          expiryDate: pkg.expiry_date,
          offerNumber: pkg.offer_number || `${pkg.title.slice(0, 3).toUpperCase()}2025`,
          resort: pkg.resort || '',
        }));
        setPackages(mappedPackages);
        const initialIndices = {};
        mappedPackages.forEach((pkg) => {
          initialIndices[pkg._id] = 0;
        });
        setCurrentImageIndex(initialIndices);
        setLoading(false);
        setTimeout(() => setIsVisible(true), 100);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(t.noContent);
        setLoading(false);
      }
    };
    fetchData();
  }, [t.noContent]);

  // Image carousel
  useEffect(() => {
    const intervals = packages.map((pkg) => {
      return setInterval(() => {
        setCurrentImageIndex((prev) => ({
          ...prev,
          [pkg._id]: (prev[pkg._id] + 1) % pkg.images.length,
        }));
      }, 4000);
    });
    return () => intervals.forEach((interval) => clearInterval(interval));
  }, [packages]);

  const handleInquiryForm = useCallback(
    (packageItem, type) => {
      const now = Date.now();
      if (showInquiryForm || now - lastClickTime < 500) {
        console.log('Inquiry form open or click debounced, ignoring');
        return;
      }
      if (!packageItem) {
        console.warn('No package selected, cannot open inquiry form');
        return;
      }
      console.log('Opening inquiry form with buttonType:', type, 'package:', packageItem);
      setSelectedPackage(packageItem);
      setButtonType(type);
      setShowInquiryForm(true);
      setLastClickTime(now);
    },
    [showInquiryForm, lastClickTime]
  );

  const handleSubmitInquiry = async (formData) => {
    try {
      const response = await axios.post(`${API_URL}/api/inquiries`, {
        ...formData,
        buttonType,
      });
      console.log('Anfrage erfolgreich abgeschickt:', response.data);
      setShowInquiryForm(false);
      setSelectedPackage(null);
      setButtonType(null);
    } catch (err) {
      console.error('Fehler beim Absenden der Anfrage:', err);
      throw err;
    }
  };

  const nextImage = (packageId) => {
    setCurrentImageIndex((prev) => ({
      ...prev,
      [packageId]: (prev[packageId] + 1) % packages.find((p) => p._id === packageId).images.length,
    }));
  };

  const prevImage = (packageId) => {
    const pkg = packages.find((p) => p._id === packageId);
    setCurrentImageIndex((prev) => ({
      ...prev,
      [packageId]: (prev[packageId] - 1 + pkg.images.length) % pkg.images.length,
    }));
  };

  const scrollToPackages = () => {
    document.getElementById('packages-section').scrollIntoView({ behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center" style={{ fontFamily: 'Comic Sans MS, cursive' }}>
        <p className="text-2xl max-sm:text-lg text-[#074a5b]">Inhalt wird geladen...</p>
      </div>
    );
  }

  if (error || !uiContent) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center" style={{ fontFamily: 'Comic Sans MS, cursive' }}>
        <p className="text-2xl max-sm:text-lg text-[#074a5b]">{error || t.noContent}</p>
      </div>
    );
  }

  // Get Hero and Packages section content
  const heroContent = uiContent.sections?.find((s) => s.sectionId === 'hero')?.content;
  const packagesOverviewContent = uiContent.sections?.find((s) => s.sectionId === 'packages-overview')?.content;

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: 'Comic Sans MS, cursive' }}>
      {/* Hero Section */}
      {heroContent && (
        <section className="relative h-[70vh] max-sm:h-[50vh] overflow-hidden">
          {heroContent.imageUrl && (
            <img
              src={heroContent.imageUrl}
              alt="Hero Image"
              className="w-full h-full object-cover"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/50 to-[#074a5b]/90"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className={`text-center text-white px-4 max-sm:px-2 max-w-5xl max-sm:max-w-3xl transition-all duration-1000 ease-out ${
                isVisible ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-8'
              }`}
            >
              <div className="animate-fade-in-up">
                {heroContent.title && (
                  <h1 className="text-4xl md:text-5xl lg:text-6xl max-sm:text-2xl font-bold mb-4 max-sm:mb-2 text-white leading-tight">
                    {heroContent.title}
                  </h1>
                )}
                {heroContent.description && (
                  <p className="text-lg md:text-xl lg:text-2xl max-sm:text-base text-white/90 max-w-3xl max-sm:max-w-2xl mx-auto leading-relaxed mb-8 max-sm:mb-4">
                    {heroContent.description}
                  </p>
                )}
                {heroContent.buttonText && (
                  <button
                    onClick={scrollToPackages}
                    className="group bg-gradient-to-r from-[#085966] to-[#22a0c4] hover:from-[#074a5b] hover:to-[#1e809b] text-white px-8 py-3 md:px-10 md:py-4 max-sm:px-4 max-sm:py-2 rounded-full text-lg md:text-xl max-sm:text-sm font-semibold transition-all duration-300 transform hover:scale-105 shadow-2xl hover:shadow-cyan-500/25"
                  >
                    <span className="flex items-center">
                      {heroContent.buttonText}
                      <ChevronRight className="ml-2 w-5 h-5 md:w-6 md:h-6 max-sm:w-4 max-sm:h-4 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Packages Section */}
      {packagesOverviewContent && (
        <section id="packages-section" className="py-16 max-sm:py-8 px-4 max-sm:px-2 border-t-2" style={{ borderColor: '#074a5b' }}>
          <div className="max-w-7xl max-sm:max-w-4xl mx-auto">
            <div className="text-center mb-12 max-sm:mb-8">
              {packagesOverviewContent.title && (
                <h2 className="text-4xl md:text-5xl max-sm:text-2xl font-bold mb-4 max-sm:mb-2" style={{ color: '#074a5b' }}>
                  {packagesOverviewContent.title}
                </h2>
              )}
              {packagesOverviewContent.description && (
                <p className="text-lg md:text-xl max-sm:text-base max-w-3xl max-sm:max-w-2xl mx-auto text-gray-600 leading-relaxed">
                  {packagesOverviewContent.description}
                </p>
              )}
            </div>

            {activePackages.length === 0 ? (
              <div className="text-center py-20 max-sm:py-10">
                <div className="max-w-2xl max-sm:max-w-xl mx-auto">
                  <div className="bg-white rounded-3xl p-12 max-sm:p-6 shadow-xl border-2" style={{ borderColor: '#074a5b' }}>
                    <h3 className="text-2xl md:text-3xl max-sm:text-lg font-bold mb-6 max-sm:mb-4" style={{ color: '#074a5b' }}>
                      {t.noPackages}
                    </h3>
                    <div className="flex flex-col sm:flex-row gap-4 max-sm:gap-2 justify-center">
                      <button
                        onClick={() => handleInquiryForm({ _id: 'CUSTOM', offerNumber: 'CUSTOM', title: 'Custom Package' }, 'whatsapp')}
                        className="flex items-center justify-center px-8 py-4 max-sm:px-4 max-sm:py-2 bg-green-500 hover:bg-green-600 text-white rounded-full font-bold text-base max-sm:text-sm transition-all duration-300 transform hover:scale-105 shadow-lg"
                        disabled={showInquiryForm}
                      >
                        <Phone size={20} className="mr-2 max-sm:w-4 max-sm:h-4 max-sm:mr-1" />
                        Buchen Sie über WhatsApp
                      </button>
                      <button
                        onClick={() => handleInquiryForm({ _id: 'CUSTOM', offerNumber: 'CUSTOM', title: 'Custom Package' }, 'bookNow')}
                        className="flex items-center justify-center px-8 py-4 max-sm:px-4 max-sm:py-2 text-white rounded-full font-bold text-base max-sm:text-sm transition-all duration-300 transform hover:scale-105 shadow-lg"
                        style={{ background: 'linear-gradient(45deg, #074a5b, #1e809b)' }}
                        disabled={showInquiryForm}
                      >
                        <Calendar size={20} className="mr-2 max-sm:w-4 max-sm:h-4 max-sm:mr-1" />
                        {t.bookNow}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-8 max-sm:space-y-6">
                {activePackages.map((packageItem) => (
                  <div
                    key={packageItem._id}
                    className="bg-white rounded-2xl shadow-xl border-4 max-sm:border-2 overflow-hidden transition-all duration-300 hover:shadow-2xl max-sm:flex max-sm:flex-col"
                    style={{ borderColor: '#074a5b' }}
                  >
                    <div className="px-8 py-4 max-sm:px-4 max-sm:py-2 border-b-4 max-sm:border-b-2" style={{ borderColor: '#074a5b', backgroundColor: '#074a5b0a' }}>
                      <h3 className="text-3xl max-sm:text-xl font-bold truncate" style={{ color: '#074a5b' }}>
                        {packageItem.title}
                      </h3>
                    </div>
                    <div className="flex max-sm:flex-col">
                      <div className="w-80 max-sm:w-full flex-shrink-0">
                        <div className="relative h-96 max-sm:h-48 overflow-hidden">
                          {packageItem.images.map((image, index) => (
                            <img
                              key={index}
                              src={image}
                              alt={packageItem.title}
                              className={`absolute inset-0 w-full h-full object-cover transition-all duration-1000 ${
                                index === (currentImageIndex[packageItem._id] || 0) ? 'opacity-100 scale-105' : 'opacity-0 scale-100'
                              }`}
                            />
                          ))}
                          <button
                            onClick={() => prevImage(packageItem._id)}
                            className="absolute left-2 max-sm:left-1 top-1/2 transform -translate-y-1/2 bg-white/90 p-2 max-sm:p-1 rounded-full hover:bg-white shadow-lg transition-all"
                          >
                            <ChevronLeft size={20} style={{ color: '#074a5b' }} className="max-sm:w-4 max-sm:h-4" />
                          </button>
                          <button
                            onClick={() => nextImage(packageItem._id)}
                            className="absolute right-2 max-sm:right-1 top-1/2 transform -translate-y-1/2 bg-white/90 p-2 max-sm:p-1 rounded-full hover:bg-white shadow-lg transition-all"
                          >
                            <ChevronRight size={20} style={{ color: '#074a5b' }} className="max-sm:w-4 max-sm:h-4" />
                          </button>
                          <div className="absolute bottom-2 max-sm:bottom-1 left-1/2 transform -translate-x-1/2 flex space-x-1 max-sm:space-x-0.5">
                            {packageItem.images.map((_, index) => (
                              <button
                                key={index}
                                onClick={() => setCurrentImageIndex((prev) => ({ ...prev, [packageItem._id]: index }))}
                                className="w-2 h-2 max-sm:w-1.5 max-sm:h-1.5 rounded-full transition-all duration-300"
                                style={{
                                  backgroundColor: index === (currentImageIndex[packageItem._id] || 0) ? '#074a5b' : 'white/60',
                                  transform: index === (currentImageIndex[packageItem._id] || 0) ? 'scale(1.25)' : 'scale(1)',
                                }}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="flex-1 p-8 max-sm:p-4">
                        <div className="mb-6 max-sm:mb-4">
                          {packageItem.shortDescription && (
                            <p className="text-gray-700 text-lg max-sm:text-sm leading-relaxed mb-4 max-sm:mb-2">
                              {packageItem.shortDescription}
                            </p>
                          )}
                          <div className="grid grid-cols-2 max-sm:grid-cols-1 gap-4 max-sm:gap-2 mb-6 max-sm:mb-4">
                            {packageItem.duration && (
                              <div className="flex items-center">
                                <Clock size={18} className="mr-2 max-sm:mr-1 max-sm:w-4 max-sm:h-4" style={{ color: '#1e809b' }} />
                                <span className="font-bold max-sm:text-sm" style={{ color: '#074a5b' }}>
                                  {packageItem.duration}
                                </span>
                              </div>
                            )}
                            {packageItem.resort && (
                              <div className="flex items-center">
                                <MapPin size={18} className="mr-2 max-sm:mr-1 max-sm:w-4 max-sm:h-4" style={{ color: '#1e809b' }} />
                                <span className="font-bold max-sm:text-sm" style={{ color: '#074a5b' }}>
                                  {packageItem.resort}
                                </span>
                              </div>
                            )}
                          </div>
                          {packageItem.included.length > 0 && (
                            <div className="mb-4 max-sm:mb-2">
                              <h4 className="font-bold mb-2 max-sm:mb-1 max-sm:text-sm" style={{ color: '#074a5b' }}>
                                {t.included}:
                              </h4>
                              <div className="grid grid-cols-2 max-sm:grid-cols-1 gap-1 max-sm:gap-0.5">
                                {packageItem.included.map((item, index) => (
                                  <div key={index} className="flex items-start text-sm max-sm:text-xs">
                                    <div
                                      className="w-1.5 h-1.5 max-sm:w-1 max-sm:h-1 rounded-full mr-2 max-sm:mr-1 mt-2 max-sm:mt-1.5 flex-shrink-0"
                                      style={{ backgroundColor: '#1e809b' }}
                                    ></div>
                                    <span className="text-gray-600">{item}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          {packageItem.activities.length > 0 && (
                            <div className="mb-4 max-sm:mb-2">
                              <h4 className="font-bold mb-2 max-sm:mb-1 max-sm:text-sm" style={{ color: '#074a5b' }}>
                                {t.activities}:
                              </h4>
                              <div className="grid grid-cols-2 max-sm:grid-cols-1 gap-1 max-sm:gap-0.5">
                                {packageItem.activities.map((item, index) => (
                                  <div key={index} className="flex items-start text-sm max-sm:text-xs">
                                    <div
                                      className="w-1.5 h-1.5 max-sm:w-1 max-sm:h-1 rounded-full mr-2 max-sm:mr-1 mt-2 max-sm:mt-1.5 flex-shrink-0"
                                      style={{ backgroundColor: '#1e809b' }}
                                    ></div>
                                    <span className="text-gray-600">{item}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          {packageItem.notIncluded && (
                            <div className="text-sm max-sm:text-xs">
                              <span className="font-bold" style={{ color: '#074a5b' }}>
                                {t.notIncluded}:{' '}
                              </span>
                              <span className="text-gray-600 italic">{packageItem.notIncluded}</span>
                            </div>
                          )}
                        </div>
                        {packageItem.expiryDate && (
                          <div className="border-t-2 pt-4 max-sm:pt-2" style={{ borderColor: '#074a5b' }}>
                            <div className="flex items-center">
                              <Calendar size={16} className="mr-2 max-sm:mr-1 max-sm:w-4 max-sm:h-4" style={{ color: '#1e809b' }} />
                              <span className="text-lg max-sm:text-sm font-bold" style={{ color: '#074a5b' }}>
                                {t.expiresOn}: {new Date(packageItem.expiryDate).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="w-72 max-sm:w-full flex-shrink-0 border-l-4 max-sm:border-l-0 max-sm:border-t-2" style={{ borderColor: '#074a5b' }}>
                        {packageItem.offerNumber && (
                          <div className="p-6 max-sm:p-4 text-center border-b-4 max-sm:border-b-2" style={{ borderColor: '#074a5b', backgroundColor: '#074a5b' }}>
                            <div className="text-white">
                              <div className="text-sm max-sm:text-xs font-bold mb-1 max-sm:mb-0.5">Angebot nr.</div>
                              <div className="text-2xl max-sm:text-lg font-bold">{packageItem.offerNumber}</div>
                            </div>
                          </div>
                        )}
                        <div className="p-6 max-sm:p-4 text-center" style={{ backgroundColor: '#074a5b0a' }}>
                          {packageItem.price && (
                            <div className="mb-4 max-sm:mb-2">
                              <div className="text-4xl max-sm:text-2xl font-bold mb-1 max-sm:mb-0.5" style={{ color: '#074a5b' }}>
                                {packageItem.price}
                              </div>
                              {packageItem.originalPrice && (
                                <div className="text-xl max-sm:text-sm line-through text-gray-500">{packageItem.originalPrice}</div>
                              )}
                              <div className="text-sm max-sm:text-xs text-gray-600 font-medium">pro Paket</div>
                            </div>
                          )}
                        </div>
                        <div className="p-6 max-sm:p-4 space-y-4 max-sm:space-y-2">
                          <button
                            onClick={() => handleInquiryForm(packageItem, 'whatsapp')}
                            className="w-full flex items-center justify-center px-4 py-3 max-sm:px-2 max-sm:py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold text-base max-sm:text-xs transition-all duration-300 transform hover:scale-105 shadow-lg"
                            disabled={showInquiryForm || !packageItem}
                          >
                            <Phone size={18} className="mr-2 max-sm:w-4 max-sm:h-4 max-sm:mr-1" />
                            Buchen Sie über WhatsApp
                          </button>
                          <button
                            onClick={() => handleInquiryForm(packageItem, 'bookNow')}
                            className="w-full flex items-center justify-center px-4 py-3 max-sm:px-2 max-sm:py-1.5 text-white rounded-xl font-bold text-base max-sm:text-xs transition-all duration-300 transform hover:scale-105 shadow-lg"
                            style={{ background: 'linear-gradient(45deg, #074a5b, #1e809b)' }}
                            disabled={showInquiryForm || !packageItem}
                          >
                            <Calendar size={18} className="mr-2 max-sm:w-4 max-sm:h-4 max-sm:mr-1" />
                            {t.bookNow}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Inquiry Form Modal */}
      <InquiryFormModal
        isOpen={showInquiryForm}
        onClose={() => {
          setShowInquiryForm(false);
          setSelectedPackage(null);
          setButtonType(null);
        }}
        item={selectedPackage}
        onSubmit={handleSubmitInquiry}
        language={language}
        buttonType={buttonType}
      />
    </div>
  );
};

export default Packages;