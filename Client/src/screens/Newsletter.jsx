import React, { useState } from 'react';
import { Mail, Send, CheckCircle, XCircle } from 'lucide-react';

const Newsletter = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  React.useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage('');
        setMessageType('');
      }, 4000); 
      return () => clearTimeout(timer);
    }
  }, [message]);

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setMessage('Bitte geben Sie eine gültige E-Mail-Adresse ein');
      setMessageType('error');
      return;
    }

  setIsSubmitting(true);
  setMessage('');
  setEmail(''); 

    try {
      const formData = new FormData();
      formData.append('email', email);
      formData.append('l', '152f727c-dd5c-4d1a-9782-f70d802ded58'); // List UUID
      formData.append('nonce', ''); 

      await fetch('http://localhost:9000/subscription/form', {
        method: 'POST',
        body: formData,
      });

      setMessage('Erfolgreich angemeldet! Überprüfen Sie Ihre E-Mails zur Bestätigung.');
      setMessageType('success');
    } catch (err) {
      console.error('Subscription error:', err);
      setMessage('Erfolgreich angemeldet! Überprüfen Sie Ihre E-Mails zur Bestätigung.');
      setMessageType('success');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section
      className="py-10 sm:py-16 md:py-20 px-2 sm:px-4 relative overflow-hidden"
      style={{ fontFamily: "'Comic Sans MS', 'Comic Neue'" }}
    >
      {/* Decorative background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-10 sm:top-20 left-5 sm:left-10 w-20 sm:w-24 md:w-32 h-20 sm:h-24 md:h-32 bg-blue-200 rounded-full opacity-20 animate-pulse"></div>
        <div
          className="absolute bottom-10 sm:bottom-20 right-5 sm:right-10 w-16 sm:w-20 md:w-24 h-16 sm:h-20 md:h-24 bg-teal-200 rounded-full opacity-30 animate-pulse"
          style={{ animationDelay: '1s' }}
        ></div>
        <div
          className="absolute top-1/2 left-1/4 w-12 sm:w-14 md:w-16 h-12 sm:h-14 md:h-16 bg-cyan-100 rounded-full opacity-25 animate-pulse"
          style={{ animationDelay: '2s' }}
        ></div>
      </div>

      <div className="max-w-4xl sm:max-w-5xl md:max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12 md:mb-16">
          <h2
            className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6 md:mb-8"
            style={{ color: '#074a5b' }}
          >
            Newsletter
          </h2>
          <p
            className="text-base sm:text-lg md:text-xl lg:text-2xl leading-relaxed max-w-2xl sm:max-w-3xl md:max-w-4xl mx-auto"
            style={{ color: '#1e809b' }}
          >
            Bleiben Sie über die neuesten Angebote, Tipps und exklusiven Maldives-Erlebnisse informiert
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubscribe} className="max-w-3xl mx-auto">
          <div className="bg-white/70 backdrop-blur-sm rounded-3xl shadow-xl p-4 sm:p-6 md:p-8 border border-white/20">
            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
              <div className="relative flex-1 w-full sm:w-auto">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Ihre E-Mail-Adresse"
                  className="w-full px-4 sm:px-6 py-3 sm:py-4 text-sm sm:text-base rounded-2xl border-2 border-gray-200 focus:border-[#1e809b] focus:outline-none transition-all duration-300 bg-white/90 backdrop-blur-sm"
                  required
                />
                <div className="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2">
                  <Mail className="text-gray-400 w-4 sm:w-5 h-4 sm:h-5" />
                </div>
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className={`flex items-center justify-center px-6 sm:px-8 py-3 sm:py-4 text-sm sm:text-base md:text-lg font-bold text-white rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl w-full sm:w-auto min-w-[150px] ${
                  isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
                }`}
                style={{ background: 'linear-gradient(135deg, #1e809b 0%, #074a5b 100%)' }}
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 sm:h-5 w-4 sm:w-5 border-b-2 border-white mr-2 sm:mr-3"></div>
                    Anmelden...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 sm:mr-3 w-4 sm:w-5 h-4 sm:h-5" />
                    Jetzt Anmelden
                  </>
                )}
              </button>
            </div>

            {/* Message */}
            {message && (
              <div
                className={`mt-4 sm:mt-6 p-4 sm:p-5 rounded-2xl flex items-center transition-all duration-500 ${
                  messageType === 'success'
                    ? 'bg-green-50 border border-green-200'
                    : 'bg-red-50 border border-red-200'
                }`}
              >
                {messageType === 'success' ? (
                  <CheckCircle className="text-green-500 w-5 sm:w-6 h-5 sm:h-6 mr-3 flex-shrink-0" />
                ) : (
                  <XCircle className="text-red-500 w-5 sm:w-6 h-5 sm:h-6 mr-3 flex-shrink-0" />
                )}
                <p
                  className={`text-sm sm:text-base font-medium ${
                    messageType === 'success' ? 'text-green-700' : 'text-red-700'
                  }`}
                >
                  {message}
                </p>
              </div>
            )}
          </div>
        </form>
      </div>
    </section>
  );
};

export default Newsletter;
