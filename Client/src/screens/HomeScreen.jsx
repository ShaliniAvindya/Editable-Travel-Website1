import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, MapPin, Calendar } from 'lucide-react';
import GoogleReviews from './GoogleReviewsSection';
import Newsletter from './Newsletter';
import axios from 'axios'; 

const HomeScreen = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [currentContentSlide, setCurrentContentSlide] = useState(0);
  const [currentItemIndex, setCurrentItemIndex] = useState(3);
  const [welcomeVisible, setWelcomeVisible] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [accommodations, setAccommodations] = useState([]);
  const [activities, setActivities] = useState([]);
  const [packages, setPackages] = useState([]);
  const [blogs, setBlogs] = useState([]);
  const [uiContent, setUIContent] = useState(null);
  const navigate = useNavigate();

  // Fetch UI content and data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [uiContentRes, accommodationsRes, activitiesRes, packagesRes, blogsRes] = await Promise.all([
          axios.get('https://editable-travel-website1-rpfv.vercel.app/api/ui-content/home'),
          axios.get('https://editable-travel-website1-rpfv.vercel.app/api/resorts'),
          axios.get('https://editable-travel-website1-rpfv.vercel.app/api/activities'),
          axios.get('https://editable-travel-website1-rpfv.vercel.app/api/packages'),
          axios.get('https://editable-travel-website1-rpfv.vercel.app/api/blogs')
        ]);

        setUIContent(uiContentRes.data);

        const transformedAccommodations = accommodationsRes.data
          .map(item => {
            let price = null;
            if (item.rooms?.length > 0) {
              const validPrices = item.rooms
                .map(room => room.price_per_night)
                .filter(p => p !== null && p !== undefined && p !== '' && !isNaN(p) && Number(p) > 0 && isFinite(p));
              if (validPrices.length > 0) {
                const minPrice = Math.min(...validPrices.map(Number));
                price = String(minPrice).startsWith('$') ? String(minPrice) : `$${minPrice}`;
              }
            }
            return {
              id: item._id,
              type: item.type,
              name: item.name,
              image: item.cover_image || item.images?.[0] || 'https://via.placeholder.com/400',
              location: `${item.atoll?.name || 'Maldives'} Island, ${item.island}`,
              price
            };
          });

        const transformedActivities = activitiesRes.data
          .map(item => {
            let price = null;
            if (
              item.price !== null &&
              item.price !== undefined &&
              item.price !== '' &&
              !isNaN(item.price) &&
              isFinite(item.price)
            ) {
              price = String(item.price).startsWith('$') ? String(item.price) : `$${item.price}`;
            }
            return {
              id: item._id,
              name: item.name,
              description: item.description || 'No description available',
              image: item.media?.[0] || 'https://via.placeholder.com/400',
              rating: 5,
              location: item.atolls || 'Various Locations',
              tags: item.tags || [],
              price
            };
          });

        const transformedPackages = packagesRes.data
          .map(item => ({
            id: item._id,
            name: item.title,
            image: item.images?.[0] || 'https://via.placeholder.com/400',
            price: `$${item.price}`
          }));

        const transformedBlogs = blogsRes.data
          .map(blog => ({
            id: blog._id.toString(),
            title: blog.title,
            excerpt: blog.content[0]?.text?.slice(0, 150) + (blog.content[0]?.text?.length > 150 ? '...' : '') || 'No excerpt available',
            image: blog.images[0] || 'https://via.placeholder.com/800',
            date: new Date(blog.publish_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
            author: blog.author || 'Unknown Author'
          }));

        setAccommodations(transformedAccommodations);
        setActivities(transformedActivities);
        setPackages(transformedPackages);
        setBlogs(transformedBlogs);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load content');
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const heroSection = uiContent?.sections.find(s => s.sectionId === 'hero')?.content?.slides || [];
  const welcomeSection = uiContent?.sections.find(s => s.sectionId === 'welcome')?.content || {};
  const offeringsSection = uiContent?.sections.find(s => s.sectionId === 'offerings')?.content || {};
  const blogSection = uiContent?.sections.find(s => s.sectionId === 'blog')?.content || {};

  // Hero slider navigation
  const prevSlide = () => {
    setCurrentSlide((prev) => (prev === 0 ? heroSection.length - 1 : prev - 1));
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % heroSection.length);
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSection.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [heroSection.length]);

  const contentSlides = [
    { key: 'accommodations', title: 'Unterkunft', items: accommodations },
    { key: 'activities', title: 'Wasseraktivitäten', items: activities },
    { key: 'packages', title: 'Urlaubspakete', items: packages }
  ];

  const handleExploreParadise = (link) => {
    sessionStorage.setItem('scrollPosition', '0');
    navigate(link || '/accommodations');
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    const handleScroll = () => {
      const section = document.getElementById('welcome-section');
      if (section) {
        const rect = section.getBoundingClientRect();
        const isVisible = rect.top < window.innerHeight && rect.bottom >= 0;
        setWelcomeVisible(isVisible);
      }
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleBeforeUnload = () => {
      sessionStorage.setItem('scrollPosition', window.pageYOffset.toString());
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    const savedPosition = sessionStorage.getItem('scrollPosition');
    if (savedPosition) {
      window.scrollTo(0, parseInt(savedPosition, 10));
      sessionStorage.removeItem('scrollPosition');
    } else {
      window.scrollTo(0, 0);
    }

    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  const handleViewDetails = (item) => {
    sessionStorage.setItem('scrollPosition', '0');
    const currentTab = contentSlides[currentContentSlide].key;
    switch (currentTab) {
      case 'accommodations':
        navigate('/accommodations');
        break;
      case 'activities':
        navigate('/activities');
        break;
      case 'packages':
        navigate('/packageoffers');
        break;
      default:
        break;
    }
  };

  const handleBlogClick = (blogId) => {
    sessionStorage.setItem('scrollPosition', '0');
    navigate(`/blogs/${blogId}`);
  };

  const getExtendedItems = (items) => {
    return items.length >= 3 ? [...items, ...items, ...items] : items;
  };

  useEffect(() => {
    const originalItems = contentSlides[currentContentSlide].items;
    setCurrentItemIndex(0);
    setIsTransitioning(false);
    setTimeout(() => setIsTransitioning(true), 50);
  }, [currentContentSlide]);

  const nextItem = () => {
    const originalItems = contentSlides[currentContentSlide].items;
    if (originalItems.length < 3) return;
    setCurrentItemIndex((prev) => {
      const newIndex = prev + 1;
      if (newIndex >= originalItems.length * 2) {
        setIsTransitioning(false);
        setTimeout(() => {
          setCurrentItemIndex(originalItems.length);
          setTimeout(() => setIsTransitioning(true), 50);
        }, 50);
        return prev;
      }
      return newIndex;
    });
  };

  const prevItem = () => {
    const originalItems = contentSlides[currentContentSlide].items;
    if (originalItems.length < 3) return;
    setCurrentItemIndex((prev) => {
      const newIndex = prev - 1;
      if (newIndex < originalItems.length) {
        setIsTransitioning(false);
        setTimeout(() => {
          setCurrentItemIndex(originalItems.length * 2 - 1);
          setTimeout(() => setIsTransitioning(true), 50);
        }, 50);
        return prev;
      }
      return newIndex;
    });
  };

  const currentItems = getExtendedItems(contentSlides[currentContentSlide].items);
  const originalItemsLength = contentSlides[currentContentSlide].items.length;

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center" style={{ fontFamily: "'Comic Sans MS', 'Comic Neue'" }}>
        <p className="text-lg sm:text-xl md:text-2xl text-[#074a5b]">Inhalt wird geladen...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center" style={{ fontFamily: "'Comic Sans MS', 'Comic Neue'" }}>
        <p className="text-lg sm:text-xl md:text-2xl text-[#074a5b]">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ fontFamily: "'Comic Sans MS', 'Comic Neue'" }}>
      {/* Hero Section */}
      <section className="relative h-[60vh] sm:h-[80vh] md:h-screen overflow-hidden">
        {heroSection.map((slide, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-all duration-[1500ms] ease-in-out ${
              index === currentSlide ? 'opacity-100 scale-105' : 'opacity-0 scale-100'
            }`}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-black/40 to-black/60 z-10"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-cyan/70 via-black/30 to-black/40 z-10"></div>
            <img
              src={slide.imageUrl || 'https://via.placeholder.com/1200'}
              alt={slide.title}
              className="w-full h-full object-cover transition-transform duration-[10000ms] ease-out"
            />
            <div className="absolute inset-0 flex items-center justify-center z-20">
              <div className="text-center text-white px-2 sm:px-4 max-w-3xl">
                <div
                  className={`transition-all duration-1000 ease-out ${
                    index === currentSlide ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                  }`}
                >
                  <h1
                    className={`text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 md:mb-10 leading-tight drop-shadow-2xl ${
                      index === currentSlide ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                    }`}
                  >
                    <span className="text-white drop-shadow-2xl">{slide.title}</span>
                  </h1>
                  <p
                    className={`text-base sm:text-lg md:text-xl lg:text-2xl mb-6 sm:mb-10 md:mb-20 text-white leading-relaxed drop-shadow-xl ${
                      index === currentSlide ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                    }`}
                  >
                    {slide.description}
                  </p>
                </div>
              </div>
            </div>
            <div
              className={`absolute inset-0 pointer-events-none transition-opacity duration-1000 ${
                index === currentSlide ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <div className="absolute top-1/4 left-1/4 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white/80 rounded-full animate-pulse drop-shadow-lg"></div>
              <div
                className="absolute top-3/4 right-1/3 w-1 h-1 sm:w-1.5 sm:h-1.5 bg-cyan-300/90 rounded-full animate-pulse drop-shadow-lg"
                style={{ animationDelay: '1s' }}
              ></div>
              <div
                className="absolute top-1/2 left-1/6 w-0.5 h-0.5 sm:w-1 sm:h-1 bg-blue-300/80 rounded-full animate-pulse drop-shadow-lg"
                style={{ animationDelay: '2s' }}
              ></div>
            </div>
          </div>
        ))}
        <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none">
          <div className="text-center text-white px-2 sm:px-4 max-w-3xl">
            <div className="flex flex-col items-center">
              <div className="h-24 sm:h-32 md:h-48"></div>
              <div className="h-28 sm:h-12 md:h-20"></div>
              <div className="pointer-events-auto">
                <button
                  onClick={() => handleExploreParadise(heroSection[currentSlide]?.buttonLink)}
                  className="group relative px-4 py-3 sm:px-6 sm:py-3 md:px-8 md:py-4 text-sm sm:text-base md:text-lg font-semibold rounded-full overflow-hidden transition-all duration-500 hover:scale-105 hover:shadow-2xl bg-gradient-to-r from-[#1e809b] to-[#074a5b] text-white border-2 border-transparent hover:border-white/30 drop-shadow-xl"
                >
                  <span className="relative z-10 flex items-center">
                    {heroSection[currentSlide]?.buttonText || 'Explore Paradise'}
                    <svg
                      className="ml-1 sm:ml-2 w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-300 group-hover:translate-x-1"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                </button>
              </div>
            </div>
          </div>
        </div>
        <button
          onClick={prevSlide}
          className="absolute left-2 sm:left-4 md:left-6 top-1/2 transform -translate-y-1/2 z-30 group bg-white/10 backdrop-blur-md hover:bg-white/20 p-2 sm:p-3 md:p-4 rounded-full transition-all duration-300 border border-white/20 hover:border-white/40"
        >
          <ChevronLeft className="text-white group-hover:scale-110 transition-transform duration-300 w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
        </button>
        <button
          onClick={nextSlide}
          className="absolute right-2 sm:right-4 md:right-6 top-1/2 transform -translate-y-1/2 z-30 group bg-white/10 backdrop-blur-md hover:bg-white/20 p-2 sm:p-3 md:p-4 rounded-full transition-all duration-300 border border-white/20 hover:border-white/40"
        >
          <ChevronRight className="text-white group-hover:scale-110 transition-transform duration-300 w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
        </button>
        <div className="absolute bottom-4 sm:bottom-6 md:bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-2 sm:space-x-3 md:space-x-4 z-30">
          {heroSection.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`relative transition-all duration-500 ${
                index === currentSlide
                  ? 'w-8 sm:w-10 md:w-12 h-2 sm:h-2.5 md:h-3 bg-white rounded-full'
                  : 'w-2 sm:w-2.5 md:w-3 h-2 sm:h-2.5 md:h-3 bg-white/50 hover:bg-white/70 rounded-full'
              }`}
            >
              {index === currentSlide && (
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-400 rounded-full animate-pulse"></div>
              )}
            </button>
          ))}
        </div>
      </section>

      {/* Welcome Section */}
      <section id="welcome-section" className="py-10 sm:py-16 md:py-20 px-2 sm:px-4 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-10 sm:top-20 left-5 sm:left-10 w-20 sm:w-24 md:w-32 h-20 sm:h-24 md:h-32 bg-blue-200 rounded-full opacity-20 animate-pulse"></div>
          <div
            className="absolute bottom-10 sm:bottom-20 right-5 sm:right-10 w-16 sm:w-20 md:w-24 h-16 sm:h-20 md:h-24 bg-teal-200 rounded-full opacity-30 animate-pulse"
            style={{ animationDelay: '1s' }}
          ></div>
          <div
            className="absolute top-1/2 left-1/4 w-12 sm:w-14 md:w-16 h-12 sm:h-14 md:h-16 bg-cyan-100 rounded-full opacity-25 animate-pulse"
            style={{ animationDelay: '2s' }}
          ></div>
        </div>
        <div className="max-w-4xl sm:max-w-5xl md:max-w-6xl mx-auto text-center relative z-10">
          <h2
            className={`text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6 md:mb-8 transition-all duration-1000 ${
              welcomeVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
            }`}
            style={{ color: '#074a5b' }}
          >
            {welcomeSection.title || 'Welcome to Paradise'}
          </h2>
          <div className="relative">
            <p
              className={`text-base sm:text-lg md:text-xl lg:text-2xl leading-relaxed max-w-2xl sm:max-w-3xl md:max-w-4xl mx-auto transition-all duration-1000 ${
                welcomeVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
              }`}
              style={{ color: '#1e809b', transitionDelay: '300ms' }}
            >
              {welcomeSection.description || 'Discover the ultimate tropical escape in the Maldives.'}
            </p>
          </div>
          <div
            className={`absolute top-0 left-0 w-full h-full pointer-events-none transition-opacity duration-1000 ${
              welcomeVisible ? 'opacity-100' : 'opacity-0'
            }`}
            style={{ transitionDelay: '1000ms' }}
          >
            <div
              className="absolute top-1/4 left-1/4 w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full animate-bounce"
              style={{ backgroundColor: '#1e809b', opacity: 0.4, animationDelay: '0s' }}
            ></div>
            <div
              className="absolute top-3/4 right-1/4 w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full animate-bounce"
              style={{ backgroundColor: '#074a5b', opacity: 0.3, animationDelay: '1s' }}
            ></div>
            <div
              className="absolute top-1/2 right-1/3 w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full animate-bounce"
              style={{ backgroundColor: '#1e809b', opacity: 0.5, animationDelay: '2s' }}
            ></div>
          </div>
        </div>
      </section>

      {/* Explore Our Offerings Section */}
      <section className="py-10 sm:py-16 md:py-20 pb-16 sm:pb-24 md:pb-32">
        <div className="max-w-4xl sm:max-w-5xl md:max-w-6xl lg:max-w-7xl mx-auto px-2 sm:px-4">
          <div className="text-center mb-8 sm:mb-12 md:mb-16">
            <h2
              className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-2 sm:mb-3 md:mb-4"
              style={{ color: '#074a5b' }}
            >
              {offeringsSection.title || 'Explore Our Offerings'}
            </h2>
            <p className="text-base sm:text-lg md:text-xl" style={{ color: '#1e809b' }}>
              {offeringsSection.description || 'Indulge in luxury designed to make your Maldives escape unforgettable.'}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row justify-center mb-6 sm:mb-8 md:mb-12 gap-2 sm:gap-4">
            <div className="relative bg-white/80 backdrop-blur-xl rounded-2xl p-1 sm:p-2 shadow-xl border border-white/20">
              <div className="flex flex-col sm:flex-row gap-1 sm:gap-2">
                {contentSlides.map((slide, index) => (
                  <button
                    key={slide.key}
                    onClick={() => setCurrentContentSlide(index)}
                    className={`relative flex items-center px-4 py-2 sm:px-5 sm:py-2.5 md:px-6 md:py-3 rounded-xl font-semibold text-sm sm:text-base md:text-lg transition-all duration-500 transform ${
                      index === currentContentSlide
                        ? 'text-white scale-105'
                        : 'text-gray-600 hover:text-[#1e809b] hover:bg-white/50'
                    }`}
                  >
                    {index === currentContentSlide && (
                      <div className="absolute inset-0 bg-[#1e809b] rounded-xl shadow-lg"></div>
                    )}
                    <div className="relative flex items-center z-10">
                      {slide.key === 'Unterkunft' && <MapPin size={16} className="mr-2 sm:mr-3" />}
                      {slide.key === 'Wasseraktivitäten' && <Calendar size={16} className="mr-2 sm:mr-3" />}
                      {slide.key === 'Urlaubspakete' && <Calendar size={16} className="mr-2 sm:mr-3" />}
                      <div>{slide.title}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="relative">
            <div className="overflow-hidden">
              <div
                className={`flex ${isTransitioning ? 'transition-transform duration-500 ease-in-out' : ''}`}
                style={{ transform: `translateX(-${currentItemIndex * (100 / (window.innerWidth < 640 ? 1 : Math.min(3, contentSlides[currentContentSlide].items.length)))}%)` }}
              >
                {currentItems.map((item, index) => (
                  <div key={`${item.id}-${index}`} className="w-full sm:w-1/3 flex-shrink-0 px-2 sm:px-4 pb-4">
                    <div className="group bg-white/70 backdrop-blur-sm rounded-3xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-3 border border-white/20">
                      <div className="relative overflow-hidden aspect-[4/3]">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                      </div>
                      <div className="p-4 sm:p-6">
                        <h3 className="text-base sm:text-lg md:text-xl font-bold mb-2" style={{ color: '#074a5b' }}>
                          {item.name}
                        </h3>
                        {contentSlides[currentContentSlide].key === 'activities' && (
                          <>
                            <p className="text-gray-600 mb-4 line-clamp-2">{item.description}</p>
                            <div className="space-y-2 mb-4">
                              <div className="flex flex-wrap gap-2">
                                {item.tags?.slice(0, 3).map((tag, idx) => (
                                  <span
                                    key={idx}
                                    className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded-full font-medium"
                                  >
                                    {tag.charAt(0).toUpperCase() + tag.slice(1).replace(/-/g, ' ')}
                                  </span>
                                ))}
                                {item.tags?.length > 3 && (
                                  <span className="px-3 py-1 bg-[#1e809b]/10 text-[#1e809b] text-xs rounded-full font-medium">
                                    +{item.tags.length - 3} more
                                  </span>
                                )}
                              </div>
                            </div>
                          </>
                        )}
                        {contentSlides[currentContentSlide].key === 'accommodations' && (
                          <p className="text-gray-600 mb-4 flex items-center text-sm sm:text-base">
                            <MapPin size={14} className="mr-2" />
                            {item.location}
                          </p>
                        )}
                        <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
                          {contentSlides[currentContentSlide].key === 'activities' && (
                            item.price ? (
                              <div className="absolute bottom-4 right-4 bg-[#1e809b] text-white px-4 py-2 rounded-full shadow-lg">
                                <span className="font-bold text-lg">{item.price}</span>
                              </div>
                            ) : null
                          )}
                          {(contentSlides[currentContentSlide].key === 'accommodations' || contentSlides[currentContentSlide].key === 'packages') && (
                            item.price ? (
                              <span className="text-lg sm:text-xl md:text-2xl font-bold text-[#1e809b] max-w-[50%] truncate">
                                {item.price}
                              </span>
                            ) : null
                          )}
                          <button
                            onClick={() => handleViewDetails(item)}
                            className="bg-[#1e809b] hover:bg-[#074a5b] text-white px-4 sm:px-6 py-1.5 sm:py-2 rounded-full font-semibold text-sm sm:text-base transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl w-full sm:w-auto min-w-[100px] sm:min-w-[120px] text-center"
                          >
                            {contentSlides[currentContentSlide].key === 'accommodations'
                              ? 'Details anzeigen'
                              : contentSlides[currentContentSlide].key === 'activities'
                              ? 'Jetzt ansehen'
                              : 'Buchpaket'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <button
              onClick={prevItem}
              className="absolute left-0 top-1/3 transform -translate-y-1/2 bg-white/80 rounded-r-full p-2 sm:p-3 shadow-xl transition-all duration-300 hover:scale-110 z-20"
            >
              <ChevronLeft className="text-[#1e809b] w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <button
              onClick={nextItem}
              className="absolute right-0 top-1/3 transform -translate-y-1/2 bg-white/80 rounded-l-full p-2 sm:p-3 shadow-xl transition-all duration-300 hover:scale-110 z-20"
            >
              <ChevronRight className="text-[#1e809b] w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <div className="flex justify-center mt-4 sm:mt-6 md:mt-8 space-x-2 sm:space-x-3">
              {contentSlides[currentContentSlide].items.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentItemIndex(index + originalItemsLength)}
                  className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full transition-all duration-300 ${
                    ((currentItemIndex - originalItemsLength) % originalItemsLength) === index
                      ? 'bg-[#1e809b] scale-125'
                      : 'bg-gray-300 hover:bg-gray-400'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      <GoogleReviews />

      {/* Blog Section */}
      <section className="py-10 sm:py-16 md:py-20">
        <div className="max-w-4xl sm:max-w-5xl md:max-w-6xl mx-auto px-2 sm:px-4">
          <div className="text-center mb-8 sm:mb-12 md:mb-16">
            <h2
              className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-2 sm:mb-3 md:mb-4"
              style={{ color: '#074a5b' }}
            >
              {blogSection.title || 'Latest from Our Blog'}
            </h2>
            <p className="text-base sm:text-lg md:text-xl" style={{ color: '#1e809b' }}>
              {blogSection.description || 'Tips, guides, and inspiration for your Maldives adventure'}
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
            {blogs.slice(0, 3).map((post, index) => (
              <article
                key={index}
                className="bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-xl transition-all duration-300"
              >
                <div className="h-32 sm:h-40 md:h-48 overflow-hidden">
                  <img
                    src={post.image}
                    alt={post.title}
                    className="w-full h-full object-cover transition-transform duration-200 hover:scale-110"
                  />
                </div>
                <div className="p-4 sm:p-6">
                  <div className="flex items-center mb-2 sm:mb-3 text-xs sm:text-sm" style={{ color: '#1e809b' }}>
                    <Calendar size={14} className="mr-2" />
                    {post.date}
                  </div>
                  <h3
                    className="text-base sm:text-lg md:text-xl font-bold mb-2 sm:mb-3"
                    style={{ color: '#074a5b' }}
                  >
                    {post.title}
                  </h3>
                  <p className="text-gray-600 mb-2 sm:mb-4 text-sm sm:text-base">{post.excerpt}</p>
                  <button
                    onClick={() => handleBlogClick(post.id)}
                    className="text-sm sm:text-lg font-semibold hover:underline"
                    style={{ color: '#1e809b' }}
                  >
                    Lesen Sie mehr →
                  </button>
                </div>
              </article>
            ))}
          </div>
          <div className="text-center mt-6 sm:mt-8 md:mt-12">
            <button
              onClick={() => navigate(blogSection.buttonLink || '/blogs')}
              className="inline-flex items-center px-4 sm:px-6 md:px-8 py-2 sm:py-3 md:py-4 text-sm sm:text-base md:text-lg font-bold text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              style={{ background: 'linear-gradient(135deg, #1e809b 0%, #074a5b 100%)', border: 'none' }}
            >
              <span>{blogSection.buttonText || 'Alle Blogs Anzeigen'}</span>
              <svg
                className="ml-1 sm:ml-2 w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-300 group-hover:translate-x-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </button>
          </div>
        </div>
      </section>
        <Newsletter />
    </div>
  );
};

export default HomeScreen;




