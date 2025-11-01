import React, { useState, useEffect } from 'react';
import { Facebook, Instagram, Twitter, Youtube, Music2 } from 'lucide-react';
import axios from 'axios';
import GTC from './GTC';
import PrivacyPolicy from './PrivacyPolicy';
import { API_BASE_URL } from '../components/apiConfig';

const Footer = () => {
  const [popupState, setPopupState] = useState({ gtc: false, privacyPolicy: false });
  const [socialMedia, setSocialMedia] = useState({ facebook: '', instagram: '', twitter: '', youtube: '', tiktok: '' });
  const [footerLabels, setFooterLabels] = useState(null);
  const [footerTitle, setFooterTitle] = useState('');
  const [footerDescription, setFooterDescription] = useState('');
  const [error, setError] = useState(null);

  // Fetch social media links from database
  useEffect(() => {
    const fetchFooterData = async () => {
      try {
        const [contactRes, uiRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/ui-content/contact`),
          axios.get(`${API_BASE_URL}/ui-content/home`),
        ]);

        const socialMediaSection = contactRes.data.sections?.find((s) => s.sectionId === 'social-media')?.content || {};
        setSocialMedia({
          facebook: socialMediaSection.facebook || '',
          instagram: socialMediaSection.instagram || '',
          twitter: socialMediaSection.twitter || '',
          youtube: socialMediaSection.youtube || '',
          tiktok: socialMediaSection.tiktok || '',
        });

        const footerSection = uiRes.data.sections?.find((s) => s.sectionId === 'footer')?.content || {};
        setFooterLabels(footerSection.footerLabels || null);
        setFooterTitle(footerSection.title || '');
        setFooterDescription(footerSection.description || '');
      } catch (err) {
        console.error('Error fetching footer data:', err);
        setError('Failed to load footer data.');
      }
    };
    fetchFooterData();
  }, []);

  const openPopup = (type) => setPopupState((p) => ({ ...p, [type]: true }));
  const closePopup = (type) => setPopupState((p) => ({ ...p, [type]: false }));

  return (
    <footer className="py-12 relative overflow-hidden" style={{ backgroundColor: '#041e26', fontFamily: "'Comic Sans MS', 'Comic Neue'" }}>
      <GTC isOpen={popupState.gtc} onClose={() => closePopup('gtc')} />
      <PrivacyPolicy isOpen={popupState.privacyPolicy} onClose={() => closePopup('privacyPolicy')} />

      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-10 left-10 w-32 h-32 bg-cyan-400 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-40 h-40 bg-blue-400 rounded-full blur-2xl"></div>
        <div className="absolute top-1/2 left-1/3 w-24 h-24 bg-pink-400 rounded-full blur-2xl"></div>
      </div>

      <div className="max-w-6xl mx-auto px-4 relative z-10">
        {error && <div className="text-red-500 text-center mb-4">{error}</div>}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {(footerTitle || footerDescription) && (
            <div>
              {footerTitle && (
                <h3 className="text-2xl font-bold text-white mb-4 bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                  <span className="notranslate" translate="no">{footerTitle}</span>
                </h3>
              )}
              {footerDescription && (
                <p className="text-gray-300 leading-relaxed">
                  {footerDescription}
                </p>
              )}
            </div>
          )}

          {/* Quick Links*/}
          {footerLabels?.quickLinks && (
            <div>
              {footerLabels.quickLinks.header && (
                <h4 className="text-lg font-bold text-white mb-4 flex items-center">
                {footerLabels.quickLinks.header}
                </h4>
              )}
              <ul className="space-y-3 text-gray-300">
                {footerLabels.quickLinks.home && <li><a href="/" className="hover:text-cyan-300 transition-all duration-300 hover:translate-x-1 inline-block">{footerLabels.quickLinks.home}</a></li>}
                {footerLabels.quickLinks.accommodations && <li><a href="/accommodations" className="hover:text-cyan-300 transition-all duration-300 hover:translate-x-1 inline-block">{footerLabels.quickLinks.accommodations}</a></li>}
                {footerLabels.quickLinks.activities && <li><a href="/activities" className="hover:text-cyan-300 transition-all duration-300 hover:translate-x-1 inline-block">{footerLabels.quickLinks.activities}</a></li>}
                {footerLabels.quickLinks.packages && <li><a href="/packageoffers" className="hover:text-cyan-300 transition-all duration-300 hover:translate-x-1 inline-block">{footerLabels.quickLinks.packages}</a></li>}
                {footerLabels.quickLinks.blogs && <li><a href="/blogs" className="hover:text-cyan-300 transition-all duration-300 hover:translate-x-1 inline-block">{footerLabels.quickLinks.blogs}</a></li>}
              </ul>
            </div>
          )}

          {/* Legal column */}
          {footerLabels?.legal && (
            <div>
              {footerLabels.legal.header && (
                <h4 className="text-lg font-bold text-white mb-4 flex items-center">{footerLabels.legal.header}</h4>
              )}
              <ul className="space-y-3 text-gray-300">
                {footerLabels.legal.gtc && (
                  <li>
                    <button onClick={() => openPopup('gtc')} className="hover:text-cyan-300 transition-all duration-300 hover:translate-x-1 inline-block group">
                      <span className="border-b border-transparent group-hover:border-cyan-300 pb-1 transition-all duration-300 text-left block">{footerLabels.legal.gtc}</span>
                    </button>
                  </li>
                )}
                {footerLabels.legal.privacy && (
                  <li>
                    <button onClick={() => openPopup('privacyPolicy')} className="hover:text-cyan-300 transition-all duration-300 hover:translate-x-1 inline-block group">
                      <span className="border-b border-transparent group-hover:border-cyan-300 pb-1 transition-all duration-300">{footerLabels.legal.privacy}</span>
                    </button>
                  </li>
                )}
              </ul>
            </div>
          )}

          <div>
            {footerLabels?.social?.header && (
              <h4 className="text-lg font-bold text-white mb-6 flex items-center">
                {footerLabels.social.header}
              </h4>
            )}
            <div className="flex space-x-4">
              {socialMedia.facebook && (
                <a href={socialMedia.facebook} className="group relative overflow-hidden" target="_blank" rel="noopener noreferrer">
                  <div className="text-white bg-gradient-to-br from-[#1877F2] to-[#0d5aa7] hover:from-[#2b88ff] hover:to-[#1877F2] transition-all duration-300 hover:scale-110 p-3 rounded-full shadow-lg hover:shadow-blue-500/40 transform hover:-translate-y-1">
                    <Facebook size={20} className="relative z-10" />
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </div>
                </a>
              )}
              {socialMedia.instagram && (
                <a href={socialMedia.instagram} className="group relative overflow-hidden" target="_blank" rel="noopener noreferrer">
                  <div className="text-white bg-gradient-to-br from-[#E4405F] via-[#C13584] to-[#833AB4] hover:from-[#ff4d6d] hover:via-[#d63893] hover:to-[#9c44c4] transition-all duration-300 hover:scale-110 p-3 rounded-full shadow-lg hover:shadow-pink-500/40 transform hover:-translate-y-1">
                    <Instagram size={20} className="relative z-10" />
                    <div className="absolute inset-0 bg-gradient-to-br from-pink-400/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </div>
                </a>
              )}
              {socialMedia.youtube && (
                <a href={socialMedia.youtube} className="group relative overflow-hidden" target="_blank" rel="noopener noreferrer">
                  <div className="text-white bg-gradient-to-br from-[#FF0000] to-[#c4302b] hover:from-[#ff4d4d] hover:to-[#c4302b] transition-all duration-300 hover:scale-110 p-3 rounded-full shadow-lg hover:shadow-red-500/40 transform hover:-translate-y-1">
                    <Youtube size={20} className="relative z-10" />
                    <div className="absolute inset-0 bg-gradient-to-br from-red-400/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </div>
                </a>
              )}
              {socialMedia.tiktok && (
                <a href={socialMedia.tiktok} className="group relative overflow-hidden" target="_blank" rel="noopener noreferrer">
                  <div className="text-white bg-gradient-to-br from-[#000000] to-[#25F4EE] hover:from-[#333333] hover:to-[#25F4EE] transition-all duration-300 hover:scale-110 p-3 rounded-full shadow-lg hover:shadow-black/40 transform hover:-translate-y-1">
                    <Music2 size={20} className="relative z-10" />
                    <div className="absolute inset-0 bg-gradient-to-br from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </div>
                </a>
              )}
              {socialMedia.twitter && (
                <a href={socialMedia.twitter} className="group relative overflow-hidden" target="_blank" rel="noopener noreferrer">
                  <div className="text-white bg-gradient-to-br from-[#1DA1F2] to-[#0d8bd9] hover:from-[#29a9ff] hover:to-[#1DA1F2] transition-all duration-300 hover:scale-110 p-3 rounded-full shadow-lg hover:shadow-sky-400/40 transform hover:-translate-y-1">
                    <Twitter size={20} className="relative z-10" />
                    <div className="absolute inset-0 bg-gradient-to-br from-sky-400/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </div>
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400">
          <p>
            © Copyright 2025 - Traveliccted. Entwickelt von{' '}
            <a href="https://lushwebdesigners.com/" target="_blank" rel="noopener noreferrer" className="text-green-500 hover:underline">
              Lush Web Designers
            </a>{' '}
            von{' '}
            <a href="https://lushware.org/" target="_blank" rel="noopener noreferrer" className="text-green-500 hover:underline">
              Lushware Org
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

