import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { BrowserRouter } from 'react-router-dom';

// Dynamically set favicon from API
const setFavicon = async () => {
  try {
    let res = await fetch('/api/ui-content/logo-favicon');
    let data = await res.json();
    if (!data || (!data.sections || data.sections.length === 0)) {
      res = await fetch('/api/ui-content/favicon');
      data = await res.json();
    }
    const faviconSection = data.sections?.find(s => s.sectionId === 'favicon');
    const faviconUrl = faviconSection?.content?.imageUrl;
    const faviconTitle = faviconSection?.content?.title;
    if (faviconUrl) {
      let link = document.querySelector("link[rel~='icon']");
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
      }
      link.href = faviconUrl;
    }
    if (faviconTitle) {
      try {
        const titleEl = document.querySelector('title');
        if (titleEl) titleEl.textContent = faviconTitle;
        document.title = faviconTitle;
      } catch (e) {}
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
