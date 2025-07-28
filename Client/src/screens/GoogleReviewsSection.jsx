import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = 'https://editable-travel-website1-rpfv.vercel.app';

const GoogleReviewsSection = () => {
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [error, setError] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    const fetchSection = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/ui-content/home`);
        const section = res.data.sections?.find(s => s.sectionId === 'googleReviews');
        setTitle(section?.content?.title || 'What Our Guests Say');
        setDescription(section?.content?.description || 'Hear from our valued customers about their experiences');
      } catch (err) {
        setTitle('What Our Guests Say');
        setDescription('Hear from our valued customers about their experiences');
      }
    };
    fetchSection();
  }, []);

  useEffect(() => {
    const scriptId = 'elfsight-platform-script';
    if (document.getElementById(scriptId)) {
      setScriptLoaded(true);
      return;
    }
    const script = document.createElement('script');
    script.id = scriptId;
    script.src = 'https://static.elfsight.com/platform/platform.js';
    script.async = true;
    script.onload = () => setScriptLoaded(true);
    script.onerror = () => setError('Failed to load reviews. Please try again later.');
    document.body.appendChild(script);
  }, []);

  if (error) {
    return (
      <div className="text-center py-12" style={{ fontFamily: 'Comic Sans MS, cursive' }}>
        <p className="text-lg text-red-500">{error}</p>
      </div>
    );
  }

  if (!scriptLoaded) {
    return (
      <div className="text-center py-12" style={{ fontFamily: 'Comic Sans MS, cursive' }}>
        <p className="text-lg text-[#074a5b]">Loading reviews...</p>
      </div>
    );
  }

  return (
    <section
      id="reviews-section"
      className="py-12 sm:py-16 md:py-24 relative bg-white"
      style={{ fontFamily: 'Comic Sans MS, cursive', minHeight: '400px' }}
    >
      <div className="max-w-4xl sm:max-w-5xl md:max-w-6xl lg:max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        <div className="text-center mb-8 sm:mb-12 md:mb-20">
          <h2
            className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-2 sm:mb-3 md:mb-4"
            style={{ color: '#074a5b' }}
          >
            {title}
          </h2>
          <p
            className="text-base sm:text-lg md:text-xl"
            style={{ color: '#1e809b' }}
          >
            {description}
          </p>
        </div>
        <div className="relative">
          <div className="elfsight-app-c6de1691-ec9e-4d7b-a874-f3bb5aedd69e" data-elfsight-app-lazy></div>
        </div>
      </div>
    </section>
  );
};

export default GoogleReviewsSection;
