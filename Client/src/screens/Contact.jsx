import React, { useState, useEffect } from 'react';
import { Phone, Mail, MapPin, Facebook, Instagram } from 'lucide-react';
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
      phone: '',
      phoneLabel: '',
      email: '',
      emailLabel: '',
      address: '',
      addressLabel: '',
    },
    socialMedia: {
      title: '',
      facebook: '',
      instagram: '',
    },
  });
  const [loading, setLoading] = useState(true);

  // Fetch content
  useEffect(() => {
    const fetchContent = async () => {
      try {
        const response = await axios.get('https://editable-travel-website1-rpfv.vercel.app/api/ui-content/contact');
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
            phone: contactInfoSection.phone || '',
            phoneLabel: contactInfoSection.phoneLabel || '',
            email: contactInfoSection.email || '',
            emailLabel: contactInfoSection.emailLabel || '',
            address: contactInfoSection.address || '',
            addressLabel: contactInfoSection.addressLabel || '',
          },
          socialMedia: {
            title: socialMediaSection.title || '',
            facebook: socialMediaSection.facebook || '',
            instagram: socialMediaSection.instagram || '',
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

      const response = await axios.post('https://editable-travel-website1-rpfv.vercel.app/api/inquiries/contact', {
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
    <section className="py-20" style={{ backgroundColor: '#074a5b', style={{ fontFamily: "'Comic Sans MS', 'Comic Neue'" }}>
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
              {content.contactInfo.phone && content.contactInfo.phoneLabel && (
                <div className="flex items-center p-4 bg-white bg-opacity-10 rounded-xl hover:bg-opacity-20 transition-all duration-300">
                  <Phone className="mr-4 flex-shrink-0" style={{ color: '#1e809b' }} size={24} />
                  <div>
                    <p className="text-sm text-cyan-200">{content.contactInfo.phoneLabel}</p>
                    <span className="text-lg font-semibold">{content.contactInfo.phone}</span>
                  </div>
                </div>
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
            </div>
            {(content.socialMedia.title || content.socialMedia.facebook || content.socialMedia.instagram) && (
              <div className="mt-10">
                {content.socialMedia.title && (
                  <h4 className="text-xl font-bold mb-6">{content.socialMedia.title}</h4>
                )}
                {(content.socialMedia.facebook || content.socialMedia.instagram) && (
                  <div className="flex space-x-4">
                    {content.socialMedia.facebook && (
                      <a
                        href={content.socialMedia.facebook}
                        className="p-4 rounded-full transition-all duration-300 hover:scale-110 hover:shadow-lg"
                        style={{ backgroundColor: '#1e809b' }}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Facebook className="text-white" size={20} />
                      </a>
                    )}
                    {content.socialMedia.instagram && (
                      <a
                        href={content.socialMedia.instagram}
                        className="p-4 rounded-full transition-all duration-300 hover:scale-110 hover:shadow-lg"
                        style={{ backgroundColor: '#1e809b' }}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Instagram className="text-white" size={20} />
                      </a>
                    )}
                  
                  </div>
                )}
              </div>
            )}
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
