import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

const adminLanguages = [
  { code: 'en', name: 'English' },
  { code: 'de', name: 'German' },
];

export default function AdminTranslationWidget() {
  const [adminLang, setAdminLang] = useState(() => {
    const stored = window.sessionStorage.getItem('adminLang');
    return stored === 'de' ? 'de' : 'en';
  });
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const location = useLocation();
  const isAdminPanel = location.pathname.startsWith('/admin');

  // Clear all translation-related elements and cookies
  const clearTranslation = () => {
    const cookies = ['googtrans', 'googtrans_t', 'googtrans_a'];
    cookies.forEach((cookie) => {
      document.cookie = `${cookie}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname};`;
      document.cookie = `${cookie}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${window.location.hostname};`;
      document.cookie = `${cookie}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    });

    document.body.classList.remove('translated-ltr', 'translated-rtl');
    const translateElements = document.querySelectorAll(
      '[id*="google_translate"], [id*="goog-gt"], [class*="goog-te"], [class*="skiptranslate"]'
    );
    translateElements.forEach((el) => {
      if (el.id !== 'admin_google_translate_element') el.remove();
    });

    const bannerFrame = document.querySelector('iframe.goog-te-banner-frame');
    if (bannerFrame) bannerFrame.remove();

    const elementsWithStyle = document.querySelectorAll('[style*="color"], [style*="background"]');
    elementsWithStyle.forEach((el) => {
      if (el.style.color && el.style.color.includes('rgb')) el.style.color = '';
      if (el.style.backgroundColor && el.style.backgroundColor.includes('rgb')) el.style.backgroundColor = '';
    });
  };

  useEffect(() => {
    if (!isAdminPanel) return;

    window.sessionStorage.setItem('adminLang', adminLang);

    const style = document.createElement('style');
    style.innerHTML = `
      .goog-te-banner-frame, .skiptranslate, .goog-te-spinner-pos, .goog-te-menu-frame, 
      .goog-te-menu-value, .goog-te-gadget, .goog-te-combo, .goog-te-spinner-animation, 
      .goog-te-spinner, .goog-te-spinner-pos, .goog-te-spinner-icon, .goog-te-balloon-frame, 
      .goog-te-balloon, .goog-te-icon, .goog-te-gadget-icon, .goog-te-gadget-simple, 
      .goog-te-gadget-simple img, .goog-te-gadget img {
        display: none !important;
        visibility: hidden !important;
        opacity: 0 !important;
        pointer-events: none !important;
      }
      body { top: 0 !important; }
      .notranslate { translate: no; }
    `;
    document.head.appendChild(style);

    if (adminLang === 'en') {
      clearTranslation();
      const script = document.getElementById('admin-google-translate-script');
      if (script) script.remove();
      const translateElement = document.getElementById('admin_google_translate_element');
      if (translateElement) translateElement.innerHTML = '';
      if (window.adminGoogleTranslateElementInit) delete window.adminGoogleTranslateElementInit;
      // Set cookie to force English and prevent auto-translation
      document.cookie = `googtrans=/en/en; path=/; domain=${window.location.hostname}; max-age=86400`;
    } else if (adminLang === 'de') {
      clearTranslation();
      document.cookie = `googtrans=/en/de; path=/; domain=${window.location.hostname}; max-age=86400`;

      if (!document.getElementById('admin-google-translate-script')) {
        const script = document.createElement('script');
        script.id = 'admin-google-translate-script';
        script.src = '//translate.google.com/translate_a/element.js?cb=adminGoogleTranslateElementInit';
        script.async = true;
        document.body.appendChild(script);

        window.adminGoogleTranslateElementInit = () => {
          try {
            new window.google.translate.TranslateElement(
              {
                pageLanguage: 'en',
                includedLanguages: 'de',
                autoDisplay: false,
                layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
              },
              'admin_google_translate_element'
            );
            setTimeout(() => translateContent('de'), 300);
          } catch (error) {
            console.error('Translation initialization error:', error);
          }
        };
      } else {
        setTimeout(() => translateContent('de'), 300);
      }

      const observer = new MutationObserver(() => {
        const body = document.body;
        const translateElement = document.querySelector('#admin_google_translate_element .goog-te-combo');
        if (body && body.classList.contains('translated-ltr') && translateElement && translateElement.value !== 'de') {
          clearTranslation();
          document.cookie = `googtrans=/en/de; path=/; domain=${window.location.hostname}; max-age=86400`;
          translateContent('de');
        }
      });
      observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });

      return () => observer.disconnect();
    }

    return () => {
      style.remove();
      if (adminLang === 'de') {
        const script = document.getElementById('admin-google-translate-script');
        if (script) script.remove();
        if (window.adminGoogleTranslateElementInit) delete window.adminGoogleTranslateElementInit;
      }
    };
  }, [adminLang, isAdminPanel]);

  const translateContent = (langCode) => {
    if (langCode !== 'de' || !isAdminPanel) return;

    const attemptTranslate = (code, retries = 10) => {
      const combo = document.querySelector('#admin_google_translate_element .goog-te-combo');
      if (combo) {
        combo.value = code;
        combo.dispatchEvent(new Event('change', { bubbles: true }));
        combo.dispatchEvent(new Event('input', { bubbles: true }));
      } else if (retries > 0) {
        setTimeout(() => attemptTranslate(code, retries - 1), 100);
      }
    };
    attemptTranslate(langCode);
  };

  const handleLanguageChange = (langCode) => {
    if (langCode === 'en' && adminLang !== 'en') {
      window.sessionStorage.setItem('adminLang', 'en');
      setAdminLang('en');
      setDropdownOpen(false);
      setTimeout(() => {
        window.location.reload();
      }, 50);
      return;
    }
    setAdminLang(langCode);
    setDropdownOpen(false);
    window.sessionStorage.setItem('adminLang', langCode);
  };

  return (
    <div className="notranslate" style={{ position: 'relative', zIndex: 100 }}>
      <button
        onClick={() => setDropdownOpen((prev) => !prev)}
        className="flex items-center justify-between px-3 py-2 rounded-lg bg-cyan-800 text-white hover:bg-cyan-700 transition-colors duration-200 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-300"
        aria-expanded={dropdownOpen}
        aria-haspopup="true"
        aria-label="Toggle admin language selection"
        type="button"
      >
        <span>{adminLanguages.find((l) => l.code === adminLang)?.name || 'English'}</span>
        <svg
          width="14"
          height="14"
          viewBox="0 0 20 20"
          fill="currentColor"
          className={`ml-2 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`}
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.25a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z"
            clipRule="evenodd"
          />
        </svg>
      </button>
      {dropdownOpen && (
        <div className="absolute top-full right-0 mt-1 w-32 bg-white rounded-lg shadow-xl border border-gray-100 py-2 z-50">
          {adminLanguages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleLanguageChange(lang.code)}
              className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-cyan-50 hover:text-cyan-700 text-sm focus:outline-none focus:bg-cyan-50 focus:text-cyan-700"
              type="button"
              aria-current={adminLang === lang.code ? 'true' : undefined}
            >
              {lang.name}
            </button>
          ))}
        </div>
      )}
      <div
        id="admin_google_translate_element"
        style={{ position: 'absolute', left: '-9999px', top: 0, width: '1px', height: '1px', overflow: 'hidden' }}
      />
    </div>
  );
}