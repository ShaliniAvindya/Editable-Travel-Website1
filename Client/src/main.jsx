import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { BrowserRouter } from 'react-router-dom';

// Dynamically set favicon from API
const setFavicon = async () => {
  try {
    const res = await fetch('/api/ui-content/favicon');
    const data = await res.json();
    const faviconSection = data.sections?.find(s => s.sectionId === 'favicon');
    const faviconUrl = faviconSection?.content?.imageUrl;
    if (faviconUrl) {
      let link = document.querySelector("link[rel~='icon']");
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
      }
      link.href = faviconUrl;
    }
  } catch (e) {}
};
setFavicon();

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
