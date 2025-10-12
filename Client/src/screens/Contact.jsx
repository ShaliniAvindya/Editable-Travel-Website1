import React, { useState, useEffect } from 'react';
import { Phone, Mail, MapPin, Facebook, Instagram, Youtube, Music2 } from 'lucide-react';
import axios from 'axios';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [content, setContent] = useState({
    hero: { title: '', description: '' },
    contactInfo: {
      title: '',
      callPhone: '',
      whatsappPhone: '',
      callPhoneLabel: '',
      whatsappPhoneLabel: '',
      email: '',
      emailLabel: '',
      address: '',
      addressLabel: '',
    },
    socialMedia: {
      title: '',
      facebook: '',
      instagram: '',
      youtube: '',
      tiktok: '',
    },
  });
  const [loading, setLoading] = useState(true);

  // Newsletter state
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterLoading, setNewsletterLoading] = useState(false);
  const [newsletterMessage, setNewsletterMessage] = useState('');
  const [newsletterMessageType, setNewsletterMessageType] = useState('');

  // Fetch content
  useEffect(() => {
    const fetchContent = async () => {
      try {
        const response = await axios.get('/api/ui-content/contact');
        const sections = response.data.sections || [];
        const heroSection = sections.find((s) => s.sectionId === 'hero')?.content || {};
        const contactInfoSection = sections.find((s) => s.sectionId === 'contact-info')?.content || {};
        const socialMediaSection = sections.find((s) => s.sectionId === 'social-media')?.content || {};
        setContent({
          hero: {
            title: heroSection.title || '',
            description: heroSection.description || '',
          },
          contactInfo: {
            title: contactInfoSection.title || '',
            callPhone: contactInfoSection.callPhone || '',
            whatsappPhone: contactInfoSection.whatsappPhone || '',
            callPhoneLabel: contactInfoSection.callPhoneLabel || '',
            whatsappPhoneLabel: contactInfoSection.whatsappPhoneLabel || '',
            email: contactInfoSection.email || '',
            emailLabel: contactInfoSection.emailLabel || '',
            address: contactInfoSection.address || '',
            addressLabel: contactInfoSection.addressLabel || '',
          },
          socialMedia: {
            title: socialMediaSection.title || '',
            facebook: socialMediaSection.facebook || '',
            instagram: socialMediaSection.instagram || '',
            youtube: socialMediaSection.youtube || '',
            tiktok: socialMediaSection.tiktok || '',
          },
        });
      } catch (err) {
        console.error('Error fetching content:', err);
        setError('Failed to load content.');
      } finally {
        setLoading(false);
      }
    };
    fetchContent();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError(null);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      if (!formData.name || !formData.email || !formData.message) {
        throw new Error('Please fill in all fields.');
      }

      const response = await axios.post('/api/inquiries/contact', {
        name: formData.name,
        email: formData.email,
        message: formData.message,
      });

      console.log('Contact inquiry submitted:', response.data);
      setSuccess('Message sent! We will contact you soon.');
      setFormData({ name: '', email: '', message: '' });
    } catch (err) {
      console.error('Error submitting contact inquiry:', err);
      const errorMessage = err.response?.data?.error || err.message || 'Failed to send message. Please try again.';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNewsletterSubscribe = async (e) => {
    e?.preventDefault?.();
    const email = (newsletterEmail || '').trim();
    if (!email || !email.includes('@')) {
      setNewsletterMessage('Bitte geben Sie eine gültige E-Mail-Adresse ein');
      setNewsletterMessageType('error');
      return;
    }

    setNewsletterLoading(true);
    setNewsletterMessage('');

    try {
      const resp = await axios.post('/api/newsletter/subscribe', { email });
      const data = resp.data || {};
      const status = data.status || data.subscriber?.status;

      if (data.success || status === 'subscribed') {
        setNewsletterMessage(data.message || 'Erfolgreich angemeldet!');
        setNewsletterMessageType('success');
        setNewsletterEmail('');
      } else if (data.error || data.message) {
        setNewsletterMessage(data.error || data.message);
        setNewsletterMessageType('error');
      } else {
        setNewsletterMessage('Subscription failed');
        setNewsletterMessageType('error');
      }
    } catch (err) {
      console.error('Subscribe error:', err);
      const statusCode = err.response?.status;
      const serverMsg = err.response?.data?.error || err.response?.data?.message;
      if (statusCode === 409) {
        setNewsletterMessage(serverMsg || 'Bereits abonniert.');
        setNewsletterMessageType('error');
      } else {
        setNewsletterMessage(serverMsg || 'Fehler beim Abonnieren. Bitte versuchen Sie es später.');
        setNewsletterMessageType('error');
      }
    } finally {
      setNewsletterLoading(false);
    }
  };

  useEffect(() => {
    if (!newsletterMessage) return;
    const timer = setTimeout(() => {
      setNewsletterMessage('');
      setNewsletterMessageType('');
      setNewsletterLoading(false);
    }, 5000); // 5 seconds

    return () => clearTimeout(timer);
  }, [newsletterMessage]);

  const handleNewsletterUnsubscribe = async (e) => {
    e?.preventDefault?.();
    const email = (newsletterEmail || '').trim();
    if (!email || !email.includes('@')) {
      setNewsletterMessage('Bitte geben Sie eine gültige E-Mail-Adresse ein');
      setNewsletterMessageType('error');
      return;
    }

    setNewsletterLoading(true);
    setNewsletterMessage('');

    try {
      const resp = await axios.post('/api/newsletter/unsubscribe', { email });
      const data = resp.data || {};
      const status = data.status || data.subscriber?.status;

      if (data.success || status === 'unsubscribed') {
        setNewsletterMessage(data.message || 'Erfolgreich abgemeldet.');
        setNewsletterMessageType('success');
        setNewsletterEmail('');
      } else if (data.error || data.message) {
        setNewsletterMessage(data.error || data.message);
        setNewsletterMessageType('error');
      } else {
        setNewsletterMessage('Unsubscribe failed');
        setNewsletterMessageType('error');
      }
    } catch (err) {
      console.error('Unsubscribe error:', err);
      const serverMsg = err.response?.data?.error || err.response?.data?.message;
      setNewsletterMessage(serverMsg || 'Fehler beim Abbestellen. Bitte versuchen Sie es später.');
      setNewsletterMessageType('error');
    } finally {
      setNewsletterLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#074a5b' }}>
        <p className="text-xl text-white" style={{ fontFamily: "'Comic Sans MS', 'Comic Neue'" }}>
          Laden...
        </p>
      </div>
    );
  }

  return (
    <section className="py-20" style={{ backgroundColor: '#074a5b', fontFamily: "'Comic Sans MS', 'Comic Neue'" }}>
      <div className="max-w-7xl mx-auto px-4">
        {(content.hero.title || content.hero.description) && (
          <div className="text-center mb-16">
            {content.hero.title && (
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">{content.hero.title}</h2>
            )}
            {content.hero.description && (
              <p className="text-xl text-cyan-200">{content.hero.description}</p>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Contact Information */}
          <div className="text-white">
            {content.contactInfo.title && (
              <h3 className="text-2xl font-bold mb-6">{content.contactInfo.title}</h3>
            )}
            <div className="space-y-6">
              {(content.contactInfo.callPhone || content.contactInfo.whatsappPhone) && (
                <>
                  {content.contactInfo.callPhone && (
                    <div className="flex items-center p-4 bg-white bg-opacity-10 rounded-xl hover:bg-opacity-20 transition-all duration-300">
                      <Phone className="mr-4 flex-shrink-0" style={{ color: '#1e809b' }} size={24} />
                      <div>
                        <p className="text-sm text-cyan-200">{content.contactInfo.callPhoneLabel}</p>
                        <span className="text-lg font-semibold">{content.contactInfo.callPhone}</span>
                      </div>
                    </div>
                  )}
                  {content.contactInfo.whatsappPhone && (
                    <a
                      href={`https://wa.me/${content.contactInfo.whatsappPhone.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center p-4 bg-white bg-opacity-10 rounded-xl hover:bg-opacity-20 transition-all duration-300"
                    >
                      <Music2 className="mr-4 flex-shrink-0" style={{ color: '#1e809b' }} size={24} />
                      <div>
                        <p className="text-sm text-cyan-200">{content.contactInfo.whatsappPhoneLabel || 'WhatsApp'}</p>
                        <span className="text-lg font-semibold">{content.contactInfo.whatsappPhone}</span>
                      </div>
                    </a>
                  )}
                </>
              )}
              {content.contactInfo.email && content.contactInfo.emailLabel && (
                <div className="flex items-center p-4 bg-white bg-opacity-10 rounded-xl hover:bg-opacity-20 transition-all duration-300">
                  <Mail className="mr-4 flex-shrink-0" style={{ color: '#1e809b' }} size={24} />
                  <div>
                    <p className="text-sm text-cyan-200">{content.contactInfo.emailLabel}</p>
                    <span className="text-lg font-semibold">{content.contactInfo.email}</span>
                  </div>
                </div>
              )}
              {content.contactInfo.address && content.contactInfo.addressLabel && (
                <div className="flex items-center p-4 bg-white bg-opacity-10 rounded-xl hover:bg-opacity-20 transition-all duration-300">
                  <MapPin className="mr-4 flex-shrink-0" style={{ color: '#1e809b' }} size={24} />
                  <div>
                    <p className="text-sm text-cyan-200">{content.contactInfo.addressLabel}</p>
                    <span className="text-lg font-semibold">{content.contactInfo.address}</span>
                  </div>
                </div>
              )}
              {/* Newsletter block */}
              <div className="p-4 bg-white/70 bg-opacity-10 rounded-xl hover:bg-opacity-20 transition-all duration-300">
               <h3 className="text-2xl font-bold mb-4" style={{ color: '#074a5b' }}>Newsletter</h3>
            <p className="text-sm text-cyan-700 mb-4">Bleiben Sie über die neuesten Angebote und Nachrichten informiert.</p>

            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
              <input
                type="email"
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                placeholder="Ihre E-Mail-Adresse"
                className="w-full text-black px-4 sm:px-6 py-3 sm:py-4 text-sm sm:text-base rounded-2xl border-2 border-gray-200 focus:border-[#1e809b] focus:outline-none transition-all duration-300 bg-white/90"
              />

              <div className="flex gap-3 w-full sm:w-auto">
                <button
                  onClick={handleNewsletterSubscribe}
                  disabled={newsletterLoading}
                  className={`px-4 py-3 rounded-2xl font-semibold text-white ${newsletterLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                  style={{ background: 'linear-gradient(135deg, #1e809b 0%, #074a5b 100%)' }}
                >
                  Subscribe
                </button>
                <button
                  onClick={handleNewsletterUnsubscribe}
                  disabled={newsletterLoading}
                  className={`px-4 py-3 rounded-2xl font-semibold text-white ${newsletterLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                  style={{ background: 'linear-gradient(135deg, #b03030 0%, #7a1e1e 100%)' }}
                >
                  Unsubscribe
                </button>
              </div>
            </div>
                {newsletterMessage && (
                  <div className={`mt-3 p-2 rounded-md ${newsletterMessageType === 'success' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
                    {newsletterMessage}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="bg-white p-8 rounded-2xl shadow-xl">
            <h3 className="text-2xl font-bold mb-6" style={{ color: '#074a5b' }}>
              Senden Sie uns eine Nachricht
            </h3>
            {success && (
              <div className="mb-6 p-4 bg-green-100 text-green-700 rounded-lg text-center">{success}</div>
            )}
            {error && <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-lg text-center">{error}</div>}
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#074a5b' }}>
                  Ihr Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Geben Sie Ihren vollständigen Namen ein"
                  className="w-full p-4 border-2 border-gray-200 rounded-lg focus:border-[#1e809b] focus:outline-none transition-all duration-300 hover:border-gray-300"
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#074a5b' }}>
                  Ihre Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Geben Sie Ihre E-Mail-Adresse ein"
                  className="w-full p-4 border-2 border-gray-200 rounded-lg focus:border-[#1e809b] focus:outline-none transition-all duration-300 hover:border-gray-300"
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#074a5b' }}>
                  Ihre Nachricht
                </label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  placeholder="Sagen Sie uns, wie wir Ihnen helfen können..."
                  rows={4}
                  className="w-full p-4 border-2 border-gray-200 rounded-lg focus:border-[#1e809b] focus:outline-none resize-none transition-all duration-300 hover:border-gray-300"
                  disabled={isSubmitting}
                ></textarea>
              </div>
              <button
                className="w-full py-4 font-semibold rounded-lg transition-all duration-300 hover:shadow-lg transform hover:scale-105"
                style={{ backgroundColor: '#1e809b', color: 'white' }}
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Senden...' : 'Nachricht senden'}
              </button>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default Contact;
