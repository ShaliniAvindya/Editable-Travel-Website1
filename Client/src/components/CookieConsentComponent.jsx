import React, { useState, useEffect } from 'react';
import PrivacyPolicy from '../screens/PrivacyPolicy';
import CookieConsent, { getCookieConsentValue } from 'react-cookie-consent';
import Cookies from 'js-cookie';

const CookieConsentComponent = () => {
  const [cookiePreferences, setCookiePreferences] = useState({
    essential: true, // Always enabled
    analytics: false,
    marketing: false, 
  });
  const [showBanner, setShowBanner] = useState(!getCookieConsentValue('myWebsiteCookieConsent'));
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);

  // Load saved preferences
  useEffect(() => {
    const consent = getCookieConsentValue('myWebsiteCookieConsent');
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

    if (preferences.analytics) {
      loadAnalytics();
    }
    if (preferences.marketing) {
      loadMarketingScripts();
    }
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
        <CookieConsent
          location="bottom"
          buttonText="Accept All"
          declineButtonText="Accept Partial"
          enableDeclineButton
          onAccept={handleAcceptAll}
          onDecline={handleAcceptPartial}
          cookieName="myWebsiteCookieConsent"
          style={{
            background: '#1f2937',
            color: '#fff',
            padding: '1rem',
            fontFamily: 'Arial, sans-serif',
            transition: 'transform 0.5s ease',
          }}
          buttonStyle={{
            background: '#10b981',
            color: '#fff',
            padding: '0.5rem 1rem',
            borderRadius: '0.25rem',
          }}
          declineButtonStyle={{
            background: '#6b7280',
            color: '#fff',
            padding: '0.5rem 1rem',
            borderRadius: '0.25rem',
            marginLeft: '0.5rem',
          }}
          expires={365}
        >
          This website uses cookies to enhance your experience.{' '}
          <button
            type="button"
            style={{ color: '#10b981', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer' }}
            onClick={() => setShowPrivacyPolicy(true)}
          >
            Learn more
          </button>
        </CookieConsent>
      )}
    {showPrivacyPolicy && (
      <PrivacyPolicy isOpen={showPrivacyPolicy} onClose={() => setShowPrivacyPolicy(false)} />
    )}
    </>
  );
};

export default CookieConsentComponent;
