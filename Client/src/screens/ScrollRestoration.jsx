import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ScrollRestoration = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Scroll to top
    const scrollToTop = () => {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'instant'
      });
    };
        scrollToTop();

    // Handle page refresh
    window.addEventListener('load', scrollToTop);
    
    return () => {
      window.removeEventListener('load', scrollToTop);
    };
  }, [pathname]);

  useEffect(() => {
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }
  }, []);

  return null;
};

export default ScrollRestoration;
