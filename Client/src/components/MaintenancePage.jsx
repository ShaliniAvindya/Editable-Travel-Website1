import React from 'react';
import { Wrench, Clock, RefreshCw } from 'lucide-react';

const MaintenancePage = () => {
  return (
    <div 
      className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50 flex items-center justify-center px-4 relative overflow-hidden"
      style={{ fontFamily: "'Comic Sans MS', 'Comic Neue', cursive" }}
    >
      <div className="max-w-2xl mx-auto text-center relative z-10">
        <div className="relative mb-4">
          <div className="inline-flex items-center justify-center w-24 h-24 md:w-32 md:h-32 bg-white/80 backdrop-blur-sm rounded-full shadow-xl border border-white/20 mb-6">
            <Wrench 
              className="w-10 h-10 md:w-16 md:h-16 text-[#1e809b] animate-pulse" 
              strokeWidth={1.5}
            />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-[#074a5b] mb-6 leading-tight">
          Website unten
          <span className="block text-[#1e809b]">Wartung</span>
        </h1>

        {/* Description */}
        <div className="bg-white/60 backdrop-blur-md rounded-2xl p-6 md:p-8 shadow-xl border border-white/20 mb-8">
          <p className="text-lg md:text-xl text-gray-700 leading-relaxed mb-4">
            Wir führen derzeit geplante Wartungsarbeiten durch, um Ihr Erlebnis zu verbessern.
          </p>
          <p className="text-base md:text-lg text-gray-600">
          Bitte schauen Sie in wenigen Augenblicken noch einmal vorbei. Vielen Dank für Ihre Geduld!
          </p>
        </div>

        {/* Progress indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-2 mb-3">
            <span className="text-[#1e809b] font-semibold">Ich arbeite daran</span>
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-[#1e809b] rounded-full animate-bounce"></div>
              <div 
                className="w-2 h-2 bg-[#1e809b] rounded-full animate-bounce"
                style={{ animationDelay: '0.2s' }}
              ></div>
              <div 
                className="w-2 h-2 bg-[#1e809b] rounded-full animate-bounce"
                style={{ animationDelay: '0.4s' }}
              ></div>
            </div>
          </div>
          
          {/* Progress bar */}
          <div className="w-full max-w-md mx-auto bg-white/30 rounded-full h-2 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-[#1e809b] to-[#074a5b] rounded-full animate-pulse"></div>
          </div>
        </div>

        {/* Refresh button */}
        <button
          onClick={() => window.location.reload()}
          className="group relative px-6 py-3 md:px-8 md:py-4 text-base md:text-lg font-semibold rounded-full overflow-hidden transition-all duration-500 hover:scale-105 hover:shadow-2xl bg-gradient-to-r from-[#1e809b] to-[#074a5b] text-white border-2 border-transparent hover:border-white/30"
        >
          <span className="relative z-10 flex items-center">
            <RefreshCw className="mr-2 w-5 h-5 transition-transform duration-300 group-hover:rotate-180" />
            Seite aktualisieren
          </span>
          <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        </button>
      </div>
    </div>
  );
};

export default MaintenancePage;
