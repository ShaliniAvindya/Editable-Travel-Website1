import React, { useState, useEffect } from 'react';
import PrivacyPolicy from '../screens/PrivacyPolicy';
import Cookies from 'js-cookie';

const CookieConsentComponent = () => {
  const [cookiePreferences, setCookiePreferences] = useState({
    essential: true, // Always enabled
    analytics: false,
    marketing: false,
  });
  const [showBanner, setShowBanner] = useState(!Cookies.get('myWebsiteCookieConsent'));
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);

  // Load saved preferences
  useEffect(() => {
    const consent = Cookies.get('myWebsiteCookieConsent');
    if (consent) {
      const savedPreferences = Cookies.get('cookiePreferences');
      if (savedPreferences) {
        setCookiePreferences(JSON.parse(savedPreferences));
      }
      setShowBanner(false);
    }
  }, []);

  // Function to handle Accept All
  const handleAcceptAll = () => {
    const allAccepted = { essential: true, analytics: true, marketing: true };
    savePreferences(allAccepted);
    setShowBanner(false);
  };

  // Function to handle Accept Partial 
  const handleAcceptPartial = () => {
    const partialAccepted = { essential: true, analytics: false, marketing: false };
    savePreferences(partialAccepted);
    setShowBanner(false);
  };

  // Save preferences to cookie
  const savePreferences = (preferences) => {
    setCookiePreferences(preferences);
    Cookies.set('cookiePreferences', JSON.stringify(preferences), { expires: 365 });
    Cookies.set('myWebsiteCookieConsent', 'true', { expires: 365 });

    if (preferences.analytics) loadAnalytics();
    if (preferences.marketing) loadMarketingScripts();
  };

  // Load Google Analytics
  const loadAnalytics = () => {
    if (!document.getElementById('ga-script')) {
      const script = document.createElement('script');
      script.id = 'ga-script';
      script.src = 'https://www.googletagmanager.com/gtag/js?id=UA-XXXXXXX-X';
      script.async = true;
      document.body.appendChild(script);

      script.onload = () => {
        window.dataLayer = window.dataLayer || [];
        function gtag(){window.dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', 'UA-XXXXXXX-X');
      };
    }
  };

  // Load marketing scripts
  const loadMarketingScripts = () => {
    console.log('Marketing scripts loaded');
  };

  return (
    <>
      {showBanner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black opacity-50" aria-hidden="true" />

          <div className="relative bg-white rounded-2xl shadow-xl max-w-3xl md:max-w-4xl w-full mx-4 p-8 max-h-[95vh] overflow-y-auto" role="dialog" aria-modal="true">
            <div className="flex justify-between items-start">
              <h3 className="text-lg font-semibold text-gray-900">Cookies & Privacy</h3>
            </div>

            <div className="mt-4 text-gray-700">
              <p>This website uses cookies to enhance your experience.</p>
            </div>

            <div className="mt-4 flex items-center gap-3">
              <button
                onClick={handleAcceptAll}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-semibold"
              >
                Accept All
              </button>

              <button
                onClick={handleAcceptPartial}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-lg font-semibold"
              >
                Accept Partial
              </button>

              <button
                onClick={() => setShowPrivacyPolicy(true)}
                className="ml-auto text-sm text-green-600 underline"
                type="button"
              >
                Learn more
              </button>
            </div>
          </div>
        </div>
      )}

      {showPrivacyPolicy && (
        <PrivacyPolicy isOpen={showPrivacyPolicy} onClose={() => setShowPrivacyPolicy(false)} />
      )}
    </>
  );
};

export default CookieConsentComponent;
