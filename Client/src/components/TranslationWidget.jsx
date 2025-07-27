import { useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import { useLocation } from 'react-router-dom';

const TranslationWidget = forwardRef(function TranslationWidget({ isAdmin = false }, ref) {
  const location = useLocation();
  const isAdminPanel = location.pathname.startsWith('/admin') || isAdmin;
  const [isLangReady, setIsLangReady] = useState(false);
  const [currentLang, setCurrentLang] = useState('de');
  const [isTranslating, setIsTranslating] = useState(false);

  // Clear translation cookies
  const clearTranslationCookies = () => {
    const cookies = ['googtrans', 'googtrans_t', 'googtrans_a'];
    cookies.forEach((cookie) => {
      document.cookie = `${cookie}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname};`;
      document.cookie = `${cookie}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${window.location.hostname};`;
      document.cookie = `${cookie}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    });
  };

  // Apply translation for the specified language code
  const translateContent = (langCode, retries = 30) => {
    if (isTranslating) {
      console.warn(`Translation in progress, skipping for ${langCode}`);
      return;
    }
    setIsTranslating(true);
    const translateElement = document.querySelector('#google_translate_element .goog-te-combo');
    if (translateElement) {
      try {
        translateElement.value = langCode;
        translateElement.dispatchEvent(new Event('change', { bubbles: true }));
        translateElement.dispatchEvent(new Event('input', { bubbles: true }));
        setCurrentLang(langCode);
        setIsLangReady(true);
      } catch (err) {
        console.error(`Error applying translation for ${langCode}:`, err);
      } finally {
        setTimeout(() => setIsTranslating(false), 1000); 
      }
    } else if (retries > 0) {
      setTimeout(() => {
        translateContent(langCode, retries - 1);
        setIsTranslating(false);
      }, 300);
    } else {
      console.error(`Failed to find .goog-te-combo for language ${langCode} after retries`);
      setIsLangReady(false);
      setIsTranslating(false);
    }
  };

  useImperativeHandle(ref, () => ({
    translateContent,
    currentLang,
  }));

  useEffect(() => {
    if (isAdminPanel) return;

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
      #goog-gt-tt, .goog-te-balloon-frame, .goog-te-balloon, .goog-te-gadget-icon, .goog-te-gadget-simple, .goog-te-gadget-simple img, .goog-te-gadget img {
        display: none !important;
        visibility: hidden !important;
        opacity: 0 !important;
        pointer-events: none !important;
      }
      body { top: 0 !important; }
      .notranslate { translate: no; }
    `;
    document.head.appendChild(style);

    // Initialize with German
    clearTranslationCookies();
    document.cookie = `googtrans=/de/de; path=/; domain=${window.location.hostname}; max-age=86400`;
    const existingScript = document.getElementById('google-translate-script');
    if (!existingScript) {
      const script = document.createElement('script');
      script.id = 'google-translate-script';
      script.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
      script.async = true;
      script.onerror = () => {
        console.error('Failed to load Google Translate script. Check network or ad blockers.');
        setIsLangReady(false);
      };
      script.onload = () => console.log('Google Translate script loaded');
      document.body.appendChild(script);
    }

    // Initialize Google Translate
    window.googleTranslateElementInit = () => {
      try {
        if (!document.getElementById('google_translate_element')) {
          console.error('google_translate_element container not found');
          setIsLangReady(false);
          return;
        }
        new window.google.translate.TranslateElement(
          {
            pageLanguage: 'de',
            includedLanguages: 'de,en,es,it,fr,pt,ru',
            autoDisplay: false,
            layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
            multilanguagePage: true,
          },
          'google_translate_element'
        );
        setTimeout(() => translateContent('de'), 1000);
      } catch (err) {
        console.error('Translation initialization error:', err);
        setIsLangReady(false);
      }
    };

    // Prevent auto-translation to non-German on initial load
    let observerTimeout = null;
    const observer = new MutationObserver(() => {
      if (isTranslating) return;
      const body = document.body;
      const translateElement = document.querySelector('#google_translate_element .goog-te-combo');
      if (body && body.classList.contains('translated-ltr') && translateElement && translateElement.value !== currentLang && currentLang === 'de') {
        clearTimeout(observerTimeout);
        observerTimeout = setTimeout(() => {
          clearTranslationCookies();
          document.cookie = `googtrans=/de/de; path=/; domain=${window.location.hostname}; max-age=86400`;
          translateContent('de');
        }, 1000); 
      }
    });
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });

    return () => {
      style.remove();
      const script = document.getElementById('google-translate-script');
      if (script && !isAdminPanel) script.remove();
      if (window.googleTranslateElementInit) delete window.googleTranslateElementInit;
      clearTimeout(observerTimeout);
      observer.disconnect();
    };
  }, [isAdminPanel]);

  return <div id="google_translate_element" style={{ display: 'none' }} />;
});

export default TranslationWidget;