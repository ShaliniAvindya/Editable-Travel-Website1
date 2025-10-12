import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, ChevronDown, Home } from 'lucide-react';
import axios from 'axios';
import TranslationWidget from '../components/TranslationWidget';
import AdminTranslationWidget from '../components/AdminTranslationWidget';
import { API_BASE_URL } from '../components/apiConfig';

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState({
    accommodations: false,
    hotels: false,
    resorts: false,
    adventures: false,
    activities: false,
    packageoffers: false,
    admin: false,
  });
  const [hotels, setHotels] = useState([]);
  const [resorts, setResorts] = useState([]);
  const [adventures, setAdventures] = useState([]);
  const [activities, setActivities] = useState([]);
  const [logoUrl, setLogoUrl] = useState(null);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [mobileLangDropdownOpen, setMobileLangDropdownOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('German');
  const [isLangReady, setIsLangReady] = useState(false);
  const langInitialized = useRef(false);
  const languages = [
    { code: 'de', name: 'German' },
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Spanish' },
    { code: 'it', name: 'Italian' },
    { code: 'fr', name: 'French' },
    { code: 'pt', name: 'Portuguese' },
    { code: 'ru', name: 'Russian' },
  ];
  const navigate = useNavigate();
  const location = useLocation();
  const isAdminPanel = location.pathname.startsWith('/admin');

  useEffect(() => {
    if (isAdminPanel) return;
    document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=' + window.location.hostname;
    document.cookie = `googtrans=/de/de; path=/; domain=${window.location.hostname}`;
    setSelectedLanguage('German');
    setTimeout(() => {
      const translateElement = document.querySelector('.goog-te-combo');
      if (translateElement && translateElement.value !== 'de') {
        translateElement.value = 'de';
        translateElement.dispatchEvent(new Event('change', { bubbles: true }));
        translateElement.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }, 500);
  }, [isAdminPanel]);

  useEffect(() => {
    if (isAdminPanel) return;
    if (selectedLanguage !== 'German') {
      const found = languages.find(l => l.name === selectedLanguage);
      if (found) {
        document.cookie = `googtrans=/de/${found.code}; path=/; domain=${window.location.hostname}`;
        setTimeout(() => {
          const translateElement = document.querySelector('.goog-te-combo');
          if (translateElement && translateElement.value !== found.code) {
            translateElement.value = found.code;
            translateElement.dispatchEvent(new Event('change', { bubbles: true }));
            translateElement.dispatchEvent(new Event('input', { bubbles: true }));
          }
        }, 500);
      }
    }
  }, [selectedLanguage, isAdminPanel]);

  const translateContent = (langCode) => {
    const translateElement = document.querySelector('.goog-te-combo');
    if (translateElement && translateElement.value !== langCode) {
      translateElement.value = langCode;
      translateElement.dispatchEvent(new Event('change', { bubbles: true }));
      translateElement.dispatchEvent(new Event('input', { bubbles: true }));
    }
  };

  useEffect(() => {
    if (!isAdminPanel) {
      document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=' + window.location.hostname;
    }
    const fetchDropdownData = async () => {
      try {
        const [hotelsRes, resortsRes, adventuresRes, activitiesRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/resorts?type=hotel`),
          axios.get(`${API_BASE_URL}/resorts?type=resort`),
          axios.get(`${API_BASE_URL}/resorts?type=adventure`),
          axios.get(`${API_BASE_URL}/activities`),
        ]);

        const hotelsData = (hotelsRes.data || [])
          .filter((item) => item._id && item.name && item.type === 'hotel')
          .map((item) => ({
            id: item._id.toString(),
            name: item.name,
            type: item.type,
          }));
        const resortsData = (resortsRes.data || [])
          .filter((item) => item._id && item.name && item.type === 'resort')
          .map((item) => ({
            id: item._id.toString(),
            name: item.name,
            type: item.type,
          }));
        const adventuresData = (adventuresRes.data || [])
          .filter((item) => item._id && item.name && item.type === 'adventure')
          .map((item) => ({
            id: item._id.toString(),
            name: item.name,
            type: item.type,
          }));
        const activitiesData = (activitiesRes.data || [])
          .filter((item) => item._id && item.name)
          .map((item) => ({
            id: item._id.toString(),
            name: item.name,
            category: 'activity',
          }));

        setHotels(hotelsData);
        setResorts(resortsData);
        setAdventures(adventuresData);
        setActivities(activitiesData);

        if (!isAdminPanel && langInitialized.current) {
          let langCode = 'de';
          const match = document.cookie.match(/googtrans=\/de\/([a-z]{2})/);
          if (match && match[1]) {
            langCode = match[1];
          } else if (selectedLanguage) {
            const found = languages.find(l => l.name === selectedLanguage);
            if (found) langCode = found.code;
          }
          const widget = document.getElementById('google_translate_element');
          if (widget) widget.innerHTML = '';
          const script = document.getElementById('google-translate-script');
          if (script) script.remove();
          const newScript = document.createElement('script');
          newScript.id = 'google-translate-script';
          newScript.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
          newScript.async = true;
          document.body.appendChild(newScript);
          setTimeout(() => translateContent(langCode), 1200);
        }
      } catch (err) {
        console.error('Error fetching dropdown data:', err);
        setHotels([]);
        setResorts([]);
        setAdventures([]);
        setActivities([]);
      }
    };

    fetchDropdownData();
  }, [isAdminPanel]);

  useEffect(() => {
    const fetchLogo = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/ui-content/logo-favicon`);
        const logoSection = response.data?.sections?.find((s) => s.sectionId === 'logo');
        setLogoUrl(logoSection?.content?.imageUrl || null);
      } catch (err) {
        console.error('Error fetching logo:', err);
        setLogoUrl(null);
      }
    };
    fetchLogo();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        !event.target.closest('.dropdown-container') &&
        !event.target.closest('.notranslate') &&
        !event.target.closest('.google-translate-container')
      ) {
        closeAllDropdowns();
        setLangDropdownOpen(false);
        setMobileLangDropdownOpen(false);
      }
    };

    const handleEscapeKey = (event) => {
      if (event.key === 'Escape') {
        closeAllDropdowns();
        setMobileMenuOpen(false);
        setLangDropdownOpen(false);
        setMobileLangDropdownOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    document.addEventListener('keydown', handleEscapeKey);
    return () => {
      document.removeEventListener('click', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, []);

  const closeAllDropdowns = () => {
    setDropdownOpen({
      accommodations: false,
      hotels: false,
      resorts: false,
      adventures: false,
      activities: false,
      packageoffers: false,
      admin: false,
    });
  };

  const toggleDropdown = (dropdown, e) => {
    e.stopPropagation();
    setDropdownOpen((prev) => ({
      ...prev,
      [dropdown]: !prev[dropdown],
    }));
  };

  const handleNavigation = (item, skipNavigation = false) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setMobileMenuOpen(false);
    closeAllDropdowns();
    if (item && !skipNavigation) {
      if (item.category) {
        navigate(`/activity/${item.id}`, { state: { item } });
      } else {
        navigate(`/resort/${item.type}/${item.id}`, { state: { item } });
      }
    }
  };

  const isParentActive = (parentPath, currentPath) => {
    if (parentPath === '/accommodations') {
      return currentPath.startsWith('/resort/') || currentPath === '/accommodations';
    }
    if (parentPath === '/activities') {
      return currentPath.startsWith('/activity/') || currentPath === '/activities';
    }
    if (parentPath === '/packageoffers') {
      return currentPath.startsWith('/packageoffers') && currentPath !== '/packageoffers';
    }
     if (parentPath === '/admin') {
      return currentPath.startsWith('/admin') && currentPath !== '/admin';
    }
    return false;
  };

  const navigationItems = [
    { name: '', href: '/', hasDropdown: false, icon: <Home className="w-6 h-6" aria-label="Home" /> },
    {
      name: 'Unterkunft',
      href: '/accommodations',
      hasDropdown: true,
      subDropdowns: [
        { name: 'Local Hotels', key: 'hotels', items: hotels },
        { name: 'Luxury Resorts', key: 'resorts', items: resorts },
        { name: 'Liveaboard', key: 'adventures', items: adventures },
      ],
    },
    {
      name: 'Aktivitäten',
      href: '/activities',
      hasDropdown: true,
      dropdownItems: activities,
    },
    { name: 'Paketangebote', href: '/packageoffers', hasDropdown: false },
    { name: 'Blogs', href: '/blogs', hasDropdown: false },
    { name: 'Admin', href: '/admin', hasDropdown: false },
  ];

  useEffect(() => {
    if (isAdminPanel) return;
    const addGoogleTranslateScript = () => {
      if (!document.getElementById('google-translate-script')) {
        const script = document.createElement('script');
        script.id = 'google-translate-script';
        script.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
        script.async = true;
        script.onload = () => {
          langInitialized.current = true;
        };
        document.body.appendChild(script);
      }
    };

    const waitForCombo = (cb, retries = 20) => {
      const combo = document.querySelector('.goog-te-combo');
      if (combo) {
        setIsLangReady(true);
        cb && cb();
      } else if (retries > 0) {
        setTimeout(() => waitForCombo(cb, retries - 1), 300);
      } else {
        setIsLangReady(false);
        document.cookie = `googtrans=/de/de; path=/; domain=${window.location.hostname}`;
        setSelectedLanguage('German');
      }
    };

    window.googleTranslateElementInit = () => {
      new window.google.translate.TranslateElement(
        {
          pageLanguage: 'de',
          includedLanguages: 'de,en,es,it,fr,pt,ru',
          autoDisplay: false,
        },
        'google_translate_element'
      );
      langInitialized.current = true;
      document.cookie = `googtrans=/de/de; path=/; domain=${window.location.hostname}`;
      setSelectedLanguage('German');
      setTimeout(() => {
        const translateElement = document.querySelector('.goog-te-combo');
        if (translateElement && translateElement.value !== 'de') {
          translateElement.value = 'de';
          translateElement.dispatchEvent(new Event('change', { bubbles: true }));
          translateElement.dispatchEvent(new Event('input', { bubbles: true }));
        }
      }, 500);
      waitForCombo();
    };

    addGoogleTranslateScript();

    return () => {
      const script = document.getElementById('google-translate-script');
      if (script) script.remove();
      langInitialized.current = false;
      setIsLangReady(false);
    };
  }, [isAdminPanel]);

  const handleLanguageSelect = (langCode, langName) => {
    setLangDropdownOpen(false);
    setMobileLangDropdownOpen(false);
    setSelectedLanguage(langName);

    const attemptTranslate = (langCode, attempts = 20, delay = 100) => {
      const translateElement = document.querySelector('.goog-te-combo');
      if (translateElement) {
        document.cookie = `googtrans=/de/${langCode}; path=/; domain=${window.location.hostname}`;
        translateContent(langCode);
      } else if (attempts > 0) {
        setTimeout(() => attemptTranslate(langCode, attempts - 1, delay), delay);
      } else {
        document.cookie = `googtrans=/de/${langCode}; path=/; domain=${window.location.hostname}`;
      }
    };

    attemptTranslate(langCode);
  };

  return (
    <header
      className={`fixed top-0 w-full z-50 transition-all duration-500 ${
        scrolled ? 'backdrop-blur-md shadow-lg' : 'bg-transparent'
      }`}
      style={{
        backgroundColor: scrolled ? 'rgba(7, 74, 91, 0.95)' : 'transparent',
        fontFamily: 'Comic Sans MS',
      }}
    >
      <style>{`
        .goog-te-banner-frame, .skiptranslate, .goog-te-spinner-pos, .goog-te-menu-frame, .goog-te-menu-value, .goog-te-gadget, .goog-te-combo, .goog-te-spinner-animation, .goog-te-spinner, .goog-te-spinner-pos, .goog-te-spinner-icon {
          display: none !important;
          visibility: hidden !important;
        }
        body { top: 0 !important; }
        .notranslate { translate: no; }
      `}</style>
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6">
        <div className="flex justify-between items-center py-2 sm:py-3">
          <NavLink
            to="/"
            className="text-lg sm:text-xl font-bold text-white drop-shadow-lg hover:text-cyan-200 transition-colors duration-200 flex items-center gap-1 sm:gap-2"
            onClick={() => {
              handleNavigation(null);
              closeAllDropdowns();
            }}
            style={{ minHeight: '48px' }}
          >
            {logoUrl ? (
              <img
                src={logoUrl}
                alt="Traveliccted Logo"
                style={{
                  height: '48px',
                  width: '100px',
                  maxWidth: '120px',
                  objectFit: 'contain',
                }}
                className="notranslate"
              />
            ) : (
              <span className="notranslate">Traveliccted</span>
            )}
          </NavLink>
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Mobile Language Menu */}
            <div className="md:hidden relative notranslate">
              {isAdminPanel ? (
                <AdminTranslationWidget />
              ) : (
                <div>
                  <button
                    onClick={() => setMobileLangDropdownOpen((prev) => !prev)}
                    className="flex items-center justify-between px-2 py-1 rounded-lg bg-cyan-800 text-white hover:bg-cyan-700 transition-colors duration-200 text-xs focus:outline-none focus:ring-2 focus:ring-cyan-300"
                    aria-expanded={mobileLangDropdownOpen}
                    aria-haspopup="true"
                    aria-label="Toggle language selection"
                    disabled={!isLangReady}
                    style={{ opacity: isLangReady ? 1 : 0.5, cursor: isLangReady ? 'pointer' : 'not-allowed' }}
                  >
                    <span>{isLangReady ? selectedLanguage : 'Loading...'}</span>
                    <ChevronDown
                      size={12}
                      className={`ml-1 transition-transform duration-200 ${mobileLangDropdownOpen ? 'rotate-180' : ''}`}
                    />
                  </button>
                  {mobileLangDropdownOpen && isLangReady && (
                    <div className="absolute top-full right-0 mt-1 w-28 bg-white rounded-lg shadow-xl border border-gray-100 py-1 animate-in fade-in-0 zoom-in-95 duration-200 z-50">
                      {languages.map((lang) => (
                        <button
                          key={lang.code}
                          onClick={() => handleLanguageSelect(lang.code, lang.name)}
                          className="block w-full text-left px-3 py-1 text-gray-700 hover:bg-cyan-50 hover:text-cyan-700 transition-colors duration-200 text-xs focus:outline-none focus:bg-cyan-50 focus:text-cyan-700"
                        >
                          {lang.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
            {/* Desktop Navigation and Language Menu */}
            <nav className="hidden md:flex items-center space-x-1">
              {navigationItems.map((item) => (
                <div key={item.name} className="relative dropdown-container">
                  {item.hasDropdown ? (
                    <div className="flex items-center">
                      <NavLink
                        to={item.href}
                        className={({ isActive }) => {
                          const shouldBeActive = isActive || isParentActive(item.href, location.pathname);
                          return `px-2 sm:px-3 py-1 sm:py-2 rounded-l-lg transition-all duration-300 font-medium text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-cyan-300 focus:ring-offset-2 focus:ring-offset-transparent ${
                            shouldBeActive
                              ? 'bg-cyan-700 text-white shadow-lg'
                              : 'text-white hover:text-cyan-300 hover:bg-white/10'
                          }`;
                        }}
                        onClick={() => handleNavigation(null, true)}
                      >
                        {item.name}
                      </NavLink>
                      <button
                        onClick={(e) => toggleDropdown(item.name.toLowerCase(), e)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            toggleDropdown(item.name.toLowerCase(), e);
                          }
                        }}
                        className={`px-1 sm:px-2 py-1 sm:py-2 rounded-r-lg border-l border-white/20 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-cyan-300 focus:ring-offset-2 focus:ring-offset-transparent ${
                          dropdownOpen[item.name.toLowerCase()]
                            ? 'bg-cyan-700 text-white border-white'
                            : 'text-white hover:text-cyan-300 hover:bg-white/10'
                        }`}
                        aria-expanded={dropdownOpen[item.name.toLowerCase()]}
                        aria-haspopup="true"
                        aria-label={`Toggle ${item.name} menu`}
                      >
                        <ChevronDown
                          size={14}
                          className={`transition-transform duration-200 ${
                            dropdownOpen[item.name.toLowerCase()] ? 'rotate-180' : ''
                          }`}
                        />
                      </button>
                    </div>
                  ) : (
                    <NavLink
                      to={item.href}
                      className={({ isActive }) => {
                        return `block px-2 sm:px-4 py-1 sm:py-2 rounded-lg transition-all duration-300 font-medium text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-cyan-300 focus:ring-offset-2 focus:ring-offset-transparent ${
                          isActive && (item.href === '/' ? location.pathname === '/' : true)
                            ? 'bg-cyan-700 text-white shadow-lg'
                            : 'text-white hover:text-cyan-300 hover:bg-white/10'
                        }`;
                      }}
                      onClick={() => handleNavigation(null, true)}
                    >
                      {item.icon ? item.icon : item.name}
                    </NavLink>
                  )}
                  {item.hasDropdown && dropdownOpen[item.name.toLowerCase()] && item.name === 'Unterkunft' && (
                    <div className="absolute top-full left-0 mt-1 w-48 sm:w-56 bg-white rounded-lg shadow-xl border border-gray-100 py-2 animate-in fade-in-0 zoom-in-95 duration-200">
                      {item.subDropdowns.map((sub) => (
                        <div key={sub.key} className="relative group/sub">
                          <button
                            onClick={(e) => toggleDropdown(sub.key, e)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                toggleDropdown(sub.key, e);
                              }
                            }}
                            className="flex items-center justify-between w-full px-3 sm:px-4 py-2 sm:py-3 text-gray-700 hover:bg-cyan-50 hover:text-cyan-700 transition-colors duration-200 font-medium text-sm focus:outline-none focus:bg-cyan-50 focus:text-cyan-700"
                            aria-expanded={dropdownOpen[sub.key]}
                            aria-haspopup="true"
                          >
                            <span>{sub.name}</span>
                            <span className="text-xs text-gray-500 ml-2">({sub.items.length})</span>
                            <ChevronDown
                              size={12}
                              className={`ml-2 transition-transform duration-200 ${dropdownOpen[sub.key] ? 'rotate-180' : ''}`}
                            />
                          </button>
                          {dropdownOpen[sub.key] && (
                            <div className="absolute top-0 left-full ml-1 w-56 sm:w-64 bg-white rounded-lg shadow-xl border border-gray-100 py-2 animate-in fade-in-0 zoom-in-95 duration-200 max-h-80 overflow-y-auto">
                              {sub.items.length > 0 ? (
                                sub.items.map((subItem) => (
                                  <NavLink
                                    key={subItem.id}
                                    to={`/resort/${subItem.type}/${subItem.id}`}
                                    className="block px-3 sm:px-4 py-2 text-gray-700 hover:bg-cyan-50 hover:text-cyan-700 transition-colors duration-200 text-sm focus:outline-none focus:bg-cyan-50 focus:text-cyan-700"
                                    onClick={() => handleNavigation(subItem)}
                                  >
                                    {subItem.name}
                                  </NavLink>
                                ))
                              ) : (
                                <div className="px-3 sm:px-4 py-2 text-gray-500 text-sm italic">
                                  No {sub.name.toLowerCase()} available
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  {item.hasDropdown && dropdownOpen[item.name.toLowerCase()] && item.name === 'Aktivitäten' && (
                    <div className="absolute top-full left-0 mt-1 w-56 sm:w-64 bg-white rounded-lg shadow-xl border border-gray-100 py-2 animate-in fade-in-0 zoom-in-95 duration-200 max-h-80 overflow-y-auto">
                      {item.dropdownItems.length > 0 ? (
                        item.dropdownItems.map((dropdownItem) => (
                          <NavLink
                            key={dropdownItem.id}
                            to={`/activity/${dropdownItem.id}`}
                            className="block px-3 sm:px-4 py-2 text-gray-700 hover:bg-cyan-50 hover:text-cyan-700 transition-colors duration-200 text-sm focus:outline-none focus:bg-cyan-50 focus:text-cyan-700"
                            onClick={() => handleNavigation(dropdownItem)}
                          >
                            {dropdownItem.name}
                          </NavLink>
                        ))
                      ) : (
                        <div className="px-3 sm:px-4 py-2 text-gray-500 text-sm italic">
                          No activities available
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
              <div className="ml-2 py-2 relative notranslate">
                {isAdminPanel ? <AdminTranslationWidget /> : (
                  <div>
                    <button
                      onClick={() => setLangDropdownOpen((prev) => !prev)}
                      className="flex items-center justify-between px-3 py-2 rounded-lg bg-cyan-800 text-white hover:bg-cyan-700 transition-colors duration-200 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-300"
                      aria-expanded={langDropdownOpen}
                      aria-haspopup="true"
                      aria-label="Toggle language selection"
                      disabled={!isLangReady}
                      style={{ opacity: isLangReady ? 1 : 0.5, cursor: isLangReady ? 'pointer' : 'not-allowed' }}
                    >
                      <span>{isLangReady ? selectedLanguage : 'Loading...'}</span>
                      <ChevronDown
                        size={14}
                        className={`ml-2 transition-transform duration-200 ${langDropdownOpen ? 'rotate-180' : ''}`}
                      />
                    </button>
                    {langDropdownOpen && isLangReady && (
                      <div className="absolute top-full right-0 mt-1 w-32 bg-white rounded-lg shadow-xl border border-gray-100 py-2 animate-in fade-in-0 zoom-in-95 duration-200 z-50">
                        {languages.map((lang) => (
                          <button
                            key={lang.code}
                            onClick={() => handleLanguageSelect(lang.code, lang.name)}
                            className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-cyan-50 hover:text-cyan-700 transition-colors duration-200 text-sm focus:outline-none focus:bg-cyan-50 focus:text-cyan-700"
                          >
                            {lang.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </nav>
            <button
              className="md:hidden text-white p-2 sm:p-3 rounded-lg hover:bg-gray-800 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-cyan-300 focus:ring-offset-2 focus:ring-offset-transparent"
              onClick={() => {
                setMobileMenuOpen(!mobileMenuOpen);
                closeAllDropdowns();
              }}
              aria-expanded={mobileMenuOpen}
              aria-label="Toggle mobile menu"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
        {mobileMenuOpen && (
          <div className="md:hidden pb-4 animate-in slide-in-from-top-5 duration-200">
            <nav className="flex flex-col space-y-2 bg-black rounded-lg p-4 sm:p-5 max-h-[80vh] overflow-y-auto">
              {navigationItems.map((item) => (
                <div key={item.name}>
                  {item.hasDropdown ? (
                    <div className="flex items-center justify-between w-full">
                      <NavLink
                        to={item.href}
                        className={({ isActive }) => {
                          const shouldBeActive = isParentActive(item.href, location.pathname);
                          return `flex-1 px-3 sm:px-4 py-3 sm:py-4 rounded-lg transition-all duration-300 font-medium text-base focus:outline-none focus:ring-2 focus:ring-cyan-300 ${
                            shouldBeActive
                              ? 'bg-cyan-700 text-white'
                              : 'text-white hover:text-cyan-300 hover:bg-gray-800'
                          }`;
                        }}
                        onClick={() => {
                          handleNavigation(null, true);
                          navigate(item.href);
                        }}
                      >
                        {item.name}
                      </NavLink>
                      <button
                        onClick={(e) => toggleDropdown(item.name.toLowerCase(), e)}
                        className={`px-3 sm:px-4 py-3 sm:py-4 rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-cyan-300 text-base ${
                          dropdownOpen[item.name.toLowerCase()]
                            ? 'bg-cyan-700 text-white'
                            : 'text-white hover:text-cyan-300 hover:bg-gray-800'
                        }`}
                        aria-expanded={dropdownOpen[item.name.toLowerCase()]}
                        aria-haspopup="true"
                        aria-label={`Toggle ${item.name} dropdown`}
                      >
                        <ChevronDown
                          size={16}
                          className={`transition-transform duration-200 ${
                            dropdownOpen[item.name.toLowerCase()] ? 'rotate-180' : ''
                          }`}
                        />
                      </button>
                    </div>
                  ) : (
                    <NavLink
                      to={item.href}
                      className={({ isActive }) => {
                        return `block px-3 sm:px-4 py-3 sm:py-4 rounded-lg transition-all duration-300 font-medium text-base focus:outline-none focus:ring-2 focus:ring-cyan-300 ${
                          isActive && (item.href === '/' ? location.pathname === '/' : true)
                            ? 'bg-cyan-700 text-white'
                            : 'text-white hover:text-cyan-300 hover:bg-gray-800'
                        }`;
                      }}
                      onClick={() => handleNavigation(null, true)}
                    >
                      {item.name}
                    </NavLink>
                  )}
                  {dropdownOpen[item.name.toLowerCase()] && item.name === 'Unterkunft' && (
                    <div className="ml-4 sm:ml-6 mt-2 space-y-2 max-h-64 overflow-y-auto">
                      {item.subDropdowns.map((sub) => (
                        <div key={sub.key}>
                          <button
                            onClick={(e) => toggleDropdown(sub.key, e)}
                            className="flex items-center justify-between w-full px-3 sm:px-4 py-2 text-cyan-200 hover:text-white hover:bg-gray-800 rounded-lg text-sm focus:outline-none focus:text-white focus:bg-gray-800"
                            aria-expanded={dropdownOpen[sub.key]}
                          >
                            <span>{sub.name}</span>
                            <span className="text-xs opacity-75">({sub.items.length})</span>
                            <ChevronDown
                              size={14}
                              className={`ml-2 transition-transform duration-200 ${dropdownOpen[sub.key] ? 'rotate-180' : ''}`}
                            />
                          </button>
                          {dropdownOpen[sub.key] && (
                            <div className="ml-4 sm:ml-6 space-y-2 max-h-48 overflow-y-auto">
                              {sub.items.length > 0 ? (
                                sub.items.map((subItem) => (
                                  <NavLink
                                    key={subItem.id}
                                    to={`/resort/${subItem.type}/${subItem.id}`}
                                    className="block px-3 sm:px-4 py-2 text-cyan-200 hover:text-white hover:bg-gray-800 rounded-lg text-sm focus:outline-none focus:text-white focus:bg-gray-800"
                                    onClick={() => handleNavigation(subItem)}
                                  >
                                    {subItem.name}
                                  </NavLink>
                                ))
                              ) : (
                                <div className="px-3 sm:px-4 py-2 text-cyan-200 text-sm italic opacity-75">
                                  No {sub.name.toLowerCase()} available
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  {dropdownOpen[item.name.toLowerCase()] && item.name === 'Aktivitäten' && (
                    <div className="ml-4 sm:ml-6 mt-2 space-y-2 max-h-64 overflow-y-auto">
                      {item.dropdownItems.length > 0 ? (
                        item.dropdownItems.map((dropdownItem) => (
                          <NavLink
                            key={dropdownItem.id}
                            to={`/activity/${dropdownItem.id}`}
                            className="block px-3 sm:px-4 py-2 text-cyan-200 hover:text-white hover:bg-gray-800 rounded-lg text-sm focus:outline-none focus:text-white focus:bg-gray-800"
                            onClick={() => handleNavigation(dropdownItem)}
                          >
                            {dropdownItem.name}
                          </NavLink>
                        ))
                      ) : (
                        <div className="px-3 sm:px-4 py-2 text-cyan-200 text-sm italic opacity-75">
                          No activities available
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </nav>
          </div>
        )}
      </div>
      <TranslationWidget />
    </header>
  );
};

export default Header;

