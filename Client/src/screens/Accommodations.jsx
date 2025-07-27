import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Coffee, Waves, Camera, Filter, Search, ChevronDown } from 'lucide-react';
import axios from 'axios';

const Accommodations = () => {
  const [activeSection, setActiveSection] = useState('hotel');
  const [searchTerm, setSearchTerm] = useState('');
  const [priceFilter, setPriceFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [visibleItems, setVisibleItems] = useState({});
  const [isVisible, setIsVisible] = useState(false);
  const [resorts, setResorts] = useState([]);
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Fetch resorts 
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [resortsResponse, contentResponse] = await Promise.all([
          axios.get('/api/resorts'),
          axios.get('/api/ui-content/accommodations'),
        ]);
        console.log('API Response (Resorts):', resortsResponse.data);
        console.log('API Response (Content):', contentResponse.data);
        setResorts(resortsResponse.data);
        setContent(contentResponse.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(`Failed to load data: ${err.response?.data?.msg || err.message}`);
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    setTimeout(() => setIsVisible(true), 100);
  }, []);

  // Intersection Observer for animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.getAttribute('data-id');
            setVisibleItems((prev) => ({ ...prev, [id]: true }));
          }
        });
      },
      { threshold: 0.1 }
    );

    const elements = document.querySelectorAll('[data-animate]');
    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [resorts, activeSection]);

  // Filter resorts
  const getFilteredData = () => {
    const currentData = resorts.filter((item) => item.type === activeSection);
    return currentData.filter((item) => {
      const matchesSearch =
        item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.island?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.atoll?.name?.toLowerCase().includes(searchTerm.toLowerCase());

      const lowestPrice =
        item.rooms && item.rooms.length > 0
          ? Math.min(...item.rooms.map((room) => room.price_per_night || Infinity))
          : Infinity;
      const matchesPrice =
        priceFilter === 'all' ||
        (priceFilter === 'budget' && lowestPrice < 200) ||
        (priceFilter === 'mid' && lowestPrice >= 200 && lowestPrice < 800) ||
        (priceFilter === 'luxury' && lowestPrice >= 800);

      return matchesSearch && matchesPrice;
    });
  };

  // Get section title, description, and imageUrl from content
  const getSectionContent = (sectionId) => {
    const section = content?.sections.find((s) => s.sectionId === sectionId);
    return {
      title: section?.content?.title || '',
      description: section?.content?.description || '',
      imageUrl: section?.content?.imageUrl || '',
    };
  };

  const handleViewDetails = (item) => {
    navigate(`/resort/${item.type}/${item._id}`, { state: { item } });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl text-[#074a5b]" style={{ fontFamily: 'Comic Sans MS, cursive' }}>
          Unterkünfte werden geladen...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl text-red-600" style={{ fontFamily: 'Comic Sans MS, cursive' }}>
          {error}
        </p>
      </div>
    );
  }

  const heroContent = getSectionContent('hero');
  const hotelContent = getSectionContent('hotel');
  const resortContent = getSectionContent('resort');
  const adventureContent = getSectionContent('adventure');

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: 'Comic Sans MS, cursive' }}>
      {/* Hero Section */}
      {heroContent.imageUrl && heroContent.title && heroContent.description && (
        <section className="relative h-[68vh] overflow-hidden">
          <img
            src={heroContent.imageUrl}
            alt="Accommodations Hero"
            className="w-full h-full object-cover"
            onError={(e) => {
              console.warn('Hero image failed to load:', heroContent.imageUrl);
              e.target.style.display = 'none'; // Hide broken image
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/50 to-[#074a5b]/90"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className={`text-center text-white px-4 max-w-4xl transition-all duration-1000 ease-out ${
                isVisible ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-8'
              }`}
            >
              <h1 className="text-5xl md:text-6xl font-bold mb-10 drop-shadow-2xl">{heroContent.title}</h1>
              <p className="text-xl md:text-2xl leading-relaxed drop-shadow-xl">{heroContent.description}</p>
            </div>
          </div>
        </section>
      )}

      {/* Navigation Tabs */}
      {(hotelContent.title || resortContent.title || adventureContent.title) && (
        <section className="sticky top-0 z-50 bg-white/95 backdrop-blur-lg shadow-lg border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex flex-wrap justify-center gap-4">
              {[
                { key: 'hotel', label: hotelContent.title, icon: Coffee },
                { key: 'resort', label: resortContent.title, icon: Waves },
                { key: 'adventure', label: adventureContent.title, icon: Camera },
              ]
                .filter(({ label }) => label) // Only show tabs with titles
                .map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    onClick={() => setActiveSection(key)}
                    className={`flex items-center px-6 py-3 rounded-full font-semibold transition-all duration-300 transform hover:scale-105 ${
                      activeSection === key
                        ? 'bg-[#1e809b] text-white shadow-lg scale-105'
                        : 'bg-gray-100 text-[#074a5b] hover:bg-gray-200'
                    }`}
                  >
                    <Icon size={20} className="mr-2" />
                    {label}
                  </button>
                ))}
            </div>
          </div>
        </section>
      )}

      {/* Search and Filters */}
      <section className="py-8 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex flex-wrap gap-4 items-center justify-between">
              <div className="flex-1 min-w-64">
                <div className="relative">
                  <Search
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    size={20}
                  />
                  <input
                    type="text"
                    placeholder="Suchunterkünfte ..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1e809b] focus:border-transparent outline-none transition-all duration-300"
                  />
                </div>
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center px-4 py-3 bg-[#1e809b] text-white rounded-xl hover:bg-[#074a5b] transition-all duration-300"
              >
                <Filter size={20} className="mr-2" />
                Filter
                <ChevronDown
                  size={16}
                  className={`ml-2 transform transition-transform ${showFilters ? 'rotate-180' : ''}`}
                />
              </button>
            </div>
            {showFilters && (
              <div className="mt-6 pt-6 border-t border-gray-200 grid grid-cols-1 md:grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-[#074a5b] mb-2">Preisklasse</label>
                  <select
                    value={priceFilter}
                    onChange={(e) => setPriceFilter(e.target.value)}
                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1e809b] focus:border-transparent outline-none"
                  >
                    <option value="all">Alle Preise</option>
                    <option value="budget">Budget (unter $200)</option>
                    <option value="mid">Mittelklasse ($200-$800)</option>
                    <option value="luxury">Luxus ($800+)</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Accommodations Grid */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          {getSectionContent(activeSection).title && (
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-bold mb-4 text-[#074a5b]">
                {getSectionContent(activeSection).title}
              </h2>
              {getSectionContent(activeSection).description && (
                <p className="text-xl text-[#1e809b] max-w-3xl mx-auto">
                  {getSectionContent(activeSection).description}
                </p>
              )}
              <div className="mt-4 text-gray-600">{getFilteredData().length} Optionen verfügbar</div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {getFilteredData().map((item, index) => (
              <div
                key={`${item.type}-${item._id}`}
                data-animate
                data-id={`${item.type}-${item._id}`}
                className={`group bg-white rounded-3xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-gray-100 ${
                  visibleItems[`${item.type}-${item._id}`]
                    ? 'opacity-100 transform translate-y-0'
                    : 'opacity-0 transform translate-y-8'
                }`}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                {(item.mainImage || item.images?.[0]) && (
                  <div className="relative h-64 overflow-hidden">
                    <img
                      src={item.mainImage || item.images[0]}
                      alt={item.name || 'Accommodation'}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      onError={(e) => {
                        console.warn(`Failed to load image for ${item.name}: ${item.mainImage || item.images[0]}`);
                        e.target.style.display = 'none'; // Hide broken image
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="absolute top-4 left-4 bg-[#1e809b]/90 backdrop-blur-sm px-3 py-1 rounded-full shadow-lg">
                      <span className="text-white text-sm font-semibold">
                        {item.rooms?.length > 0
                          ? `$${Math.min(...item.rooms.map((room) => room.price_per_night || Infinity))}/nacht`
                          : 'Price N/A'}
                      </span>
                    </div>
                  </div>
                )}
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-2 text-[#074a5b] group-hover:text-[#1e809b] transition-colors duration-300">
                    {item.name || ''}
                  </h3>
                  {(item.island || item.atoll?.name) && (
                    <p className="text-gray-600 mb-3 flex items-center">
                      <MapPin size={16} className="mr-2 text-[#1e809b]" />
                      {item.island || ''} Insel, {item.atoll?.name || ''}
                    </p>
                  )}
                  {item.description && (
                    <p className="text-gray-700 mb-4 text-sm leading-relaxed">{item.description}</p>
                  )}
                  {item.amenities?.length > 0 && (
                    <div className="mb-6">
                      <div className="flex flex-wrap gap-2">
                        {item.amenities.slice(0, 3).map((amenity, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded-full font-medium"
                          >
                            {amenity}
                          </span>
                        ))}
                        {item.amenities.length > 3 && (
                          <span className="px-3 py-1 bg-[#1e809b]/10 text-[#1e809b] text-xs rounded-full font-medium">
                            +{item.amenities.length - 3} mehr
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleViewDetails(item)}
                      className="flex-1 bg-[#1e809b] hover:bg-[#074a5b] text-white px-4 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg"
                    >
                     Details Anzegen
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {getFilteredData().length === 0 && (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">🏝️</div>
              <h3 className="text-2xl font-bold text-[#074a5b] mb-2">Keine Unterkünfte gefunden</h3>
              <p className="text-gray-600 mb-3">Versuchen Sie, Ihre Such- oder Filterkriterien anzupassen</p>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setPriceFilter('all');
                }}
                className="px-6 py-3 bg-[#1e809b] text-white rounded-xl hover:bg-[#074a5b] transition-all duration-300"
              >
                Filter löschen
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Accommodations;