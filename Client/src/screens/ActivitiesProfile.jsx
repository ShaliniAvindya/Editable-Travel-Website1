import React, { useState, useEffect, useMemo } from "react";
import {
  MapPin,
  MessageCircle,
  ChevronDown,
  Heart,
  Share2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useParams } from "react-router-dom";
import axios from 'axios';
import InquiryFormModal from './InquiryFormModal'; 
import { API_BASE_URL } from '../components/apiConfig';

const ActivityProfile = () => {
  const [atolls, setAtolls] = useState([]);
  const [selectedAtoll, setSelectedAtoll] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [atollSliderIndices, setAtollSliderIndices] = useState({});
  const [activity, setActivity] = useState(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalButtonType, setModalButtonType] = useState('bookNow');
  const { activityId } = useParams();

  useEffect(() => {
    if (!activity?.media?.length) return;
    const interval = setInterval(() => {
      setActiveImageIndex((prev) => (prev + 1) % activity.media.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [activity?.media]);

  // Filter atolls to show where this activity is available
  const relevantAtolls = useMemo(() => {
    if (!activity) return [];
    if (activity.available_in_all_atolls) return atolls;
    const ids = (activity.available_atoll_ids || []).map(id => String(id._id || id));
    return atolls.filter(atoll => ids.includes(String(atoll.id)));
  }, [activity, atolls]);
  // Handle atoll selection manually
  const handleAtollSelect = (atollId) => {
    setSelectedAtoll(selectedAtoll === atollId ? "" : atollId);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch all atolls
        const atollsResponse = await axios.get(`${API_BASE_URL}/atolls`);
        const atollsData = atollsResponse.data;

        const atollsWithData = await Promise.all(
          atollsData.map(async (atoll) => {
            try {
              // Fetch accommodations for this atoll
              const resortsResponse = await axios.get(
                `${API_BASE_URL}/resorts/byAtoll/${atoll._id}`
              );

              // Fetch activities for this atoll
              const activitiesResponse = await axios.get(
                `${API_BASE_URL}/activities/byAtoll/${atoll._id}`
              );

              return {
                ...atoll,
                id: atoll._id,
                media: atoll.media?.length > 0
                  ? atoll.media.map((url, idx) => ({ url, caption: `Image ${idx + 1}` }))
                  : [{ url: atoll.mainImage || 'https://via.placeholder.com/400', caption: 'Main Image' }],
                accommodations: resortsResponse.data,
                activities: activitiesResponse.data,
              };
            } catch (err) {
              console.error(`Error fetching data for atoll ${atoll._id}:`, err);
              return {
                ...atoll,
                id: atoll._id,
                media: [{ url: atoll.mainImage || 'https://via.placeholder.com/400', caption: 'Main Image' }],
                accommodations: [],
                activities: [],
              };
            }
          })
        );

        const initialIndices = {};
        atollsData.forEach((atoll) => {
          initialIndices[atoll._id] = 0;
        });
        setAtollSliderIndices(initialIndices);
        setAtolls(atollsWithData);

        // Fetch activity details with populated atoll data
        if (activityId) {
          const activityResponse = await axios.get(`${API_BASE_URL}/activities/${activityId}`);
          const activityData = activityResponse.data;
          
          // Make sure atoll IDs properly formatted
          const availableAtollIds = activityData.available_atoll_ids?.map(id => 
            typeof id === 'string' ? id : id._id
          ) || [];
          
          setActivity({
            ...activityData,
            _id: activityData._id,
            available_atoll_ids: availableAtollIds
          });
        }

        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(`Daten konnten nicht geladen werden: ${err.response?.data?.msg || err.message}`);
        setLoading(false);
      }
    };
    fetchData();
  }, [activityId]);

  const handleWhatsAppContact = () => {
    if (!activity) {
      console.warn('Activity not loaded, cannot open WhatsApp modal');
      return;
    }
    setModalButtonType('whatsapp');
    setIsModalOpen(true);
  };

  const handleBookNow = () => {
    if (!activity) {
      console.warn('Activity not loaded, cannot open Book Now modal');
      return;
    }
    setModalButtonType('bookNow');
    setIsModalOpen(true);
  };

  const handleModalSubmit = async (submissionData) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/inquiries`, submissionData);
      console.log('Anfrage erfolgreich übermittelt:', response.data);
    } catch (err) {
      console.error('Fehler beim Senden der Anfrage:', err);
      throw err;
    }
  };

  const handleSliderNavigation = (atollId, direction) => {
    const atoll = atolls.find((a) => a.id === atollId);
    const currentIndex = atollSliderIndices[atollId] || 0;
    const maxIndex = atoll.media.length - 1;
    let newIndex =
      direction === "next"
        ? currentIndex >= maxIndex
          ? 0
          : currentIndex + 1
        : currentIndex <= 0
        ? maxIndex
        : currentIndex - 1;

    setAtollSliderIndices((prev) => ({ ...prev, [atollId]: newIndex }));
  };

  const countSitesForAtoll = (atoll) => {
    if (!activity?.activity_sites) return 0;
    return activity.activity_sites.filter(site => {
      const siteAtollId = site.atoll_id?._id || site.atoll_id;
      return String(siteAtollId) === String(atoll.id);
    }).length;
  };

  // Helper function to safely get activity sites for an atoll
  const getActivitySitesForAtoll = useMemo(() => (atollId) => {
    if (!activity?.activity_sites) return [];
    return activity.activity_sites.filter(site => {
      const siteAtollId = site.atoll_id?._id || site.atoll_id;
      return String(siteAtollId) === String(atollId);
    });
  }, [activity]);

  const getSafeImageUrl = (imageUrl, fallbackIndex = 0) => {
    return imageUrl || (activity?.media && activity.media[fallbackIndex]) || 'https://via.placeholder.com/400?text=No+Image';
  };

  // Activity image navigation
  const handleActivityImageNav = (direction) => {
    if (!activity?.media?.length) return;
    setActiveImageIndex((prev) => {
      if (direction === 'next') {
        return (prev + 1) % activity.media.length;
      }
      return (prev - 1 + activity.media.length) % activity.media.length;
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-2xl text-[#074a5b]">Ladeorte...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <h2 className="text-2xl font-bold text-[#074a5b]">{error}</h2>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "'Comic Sans MS', 'Comic Neue'" }}>
      {/* Hero Section */}
      <section className="relative h-[400px] sm:h-[600px] overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={getSafeImageUrl(activity?.media[activeImageIndex])}
            alt={activity?.name}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30"></div>
        {activity?.media?.length > 1 && (
          <>
            <button
              onClick={() => handleActivityImageNav('prev')}
              className="absolute left-3 sm:left-6 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white p-2 sm:p-3 rounded-full backdrop-blur-sm transition-all duration-300"
            >
              <ChevronLeft size={20} className="sm:w-6 sm:h-6" />
            </button>
            <button
              onClick={() => handleActivityImageNav('next')}
              className="absolute right-3 sm:right-6 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white p-2 sm:p-3 rounded-full backdrop-blur-sm transition-all duration-300"
            >
              <ChevronRight size={20} className="sm:w-6 sm:h-6" />
            </button>
            <div className="absolute bottom-16 sm:bottom-24 left-1/2 transform -translate-x-1/2 flex items-center gap-2">
              {activity.media.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setActiveImageIndex(index)}
                  className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full transition-all duration-300 ${
                    index === activeImageIndex ? "bg-white" : "bg-white/50 hover:bg-white/75"
                  }`}
                />
              ))}
            </div>
          </>
        )}
        <div className="absolute bottom-4 sm:bottom-10 left-3 sm:left-6 right-3 sm:right-6 text-white max-w-4xl">
          <h1 className="text-2xl sm:text-4xl md:text-7xl font-bold mb-3 sm:mb-8 drop-shadow-2xl">
            {activity.name}
          </h1>
          <div className="flex items-center gap-3 sm:gap-4">
            {activity.price && typeof activity.price === 'string' && activity.price.trim() !== '' && activity.price !== 'N/A' && (
              <div className="bg-[#1e809b]/80 backdrop-blur-sm px-3 sm:px-8 py-1 sm:py-2 rounded-full font-semibold text-sm sm:text-xl">
                Aus {activity.price}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Sticky Action Bar */}
      <section className="sticky top-0 z-50 bg-white/95 backdrop-blur-lg shadow-lg border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-3 sm:gap-6">
              {activity.price && typeof activity.price === 'string' && activity.price.trim() !== '' && activity.price !== 'N/A' && (
                <span className="text-2xl sm:text-4xl font-bold text-[#074a5b]">
                  {activity.price}
                </span>
              )}
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4 w-full sm:w-auto">
              <button
                onClick={handleBookNow}
                className="bg-[#074a5b] hover:bg-[#1e809b] text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-full font-bold transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2 text-sm sm:text-base flex-1 sm:flex-none"
                disabled={!activity}
              >
                <MessageCircle size={16} className="sm:w-4" />
                <span>per E-Mail anfragen</span>
              </button>
              <button
                onClick={handleWhatsAppContact}
                className="bg-green-600 hover:bg-green-700 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-full font-bold transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2 text-sm sm:text-base flex-1 sm:flex-none"
                disabled={!activity}
              >
                <MessageCircle size={16} className="sm:w-4" />
                <span>Anfrage per WhatsApp</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Available Locations */}
      <section className="py-8 sm:py-16 px-3 sm:px-4 bg-gradient-to-b from-cyan-50 to-white">
        <div className="max-w-7xl mx-auto">
          {activity?.available_in_all_atolls ? (            
            <div className="bg-white rounded-2xl shadow-md p-4 sm:p-8">
              <div className="relative">
                {/* Main content */}
                <div className="grid md:grid-cols-2 gap-6 sm:gap-8 items-center">
                  <div className="space-y-4 sm:space-y-6">
                    <div className="inline-block bg-[#074a5b] text-white px-4 sm:px-6 py-2 rounded-full text-xs sm:text-sm font-semibold mb-4">
                      In allen Inseln verfügbar
                    </div>
                    <h3 className="text-2xl sm:text-3xl font-bold text-[#074a5b] leading-tight">
                      Erfahrung {activity.name} in jedem Insel der Malediven
                    </h3>
                    <p className="text-base sm:text-lg text-gray-600 leading-relaxed">
                      {activity.name} ist in jedem Insel der Malediven verfügbar. Wählen Sie ein beliebiges Resort und tauchen Sie in dieses unglaubliche Erlebnis an Ihrem bevorzugten Standort ein.
                    </p>
                    <div className="mt-6 sm:mt-8 border-t border-gray-100 pt-6 sm:pt-8">
                      <h4 className="text-lg sm:text-xl font-semibold text-[#074a5b] mb-3 sm:mb-4">Über dieses Erlebnis</h4>
                      <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                        {activity.description}
                      </p>
                      {activity.requirements && (
                        <div className="mt-3 sm:mt-4 border-t border-gray-100 pt-3 sm:pt-4">
                          <h5 className="font-semibold text-[#074a5b] mb-2">Anforderungen</h5>
                          <p className="text-sm sm:text-base text-gray-600">{activity.requirements}</p>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={handleBookNow}
                      className="mt-4 sm:mt-6 w-full sm:w-auto bg-[#074a5b] text-white px-6 sm:px-8 py-3 sm:py-4 rounded-lg sm:rounded-xl font-semibold transition-all duration-300 hover:bg-[#1e809b] flex items-center justify-center gap-2 sm:gap-3 text-sm sm:text-base"
                      disabled={!activity}
                    >
                      <MessageCircle size={18} />
                      Buchen Sie dieses Erlebnis
                    </button>
                  </div>                  
                  <div className="relative mt-6 md:mt-0">
                    <div className="rounded-lg sm:rounded-xl overflow-hidden shadow-md">
                      <img
                        src={getSafeImageUrl(activity?.media[0])}
                        alt={activity.name}
                        className="w-full h-64 sm:h-full object-cover"
                      />
                    </div>
                    <div className="absolute -bottom-3 -right-3 sm:-bottom-6 sm:-right-6 bg-white rounded-xl sm:rounded-2xl shadow-xl p-3 sm:p-4 max-w-xs">
                      {activity.price && typeof activity.price === 'string' && activity.price.trim() !== '' && activity.price !== 'N/A' && (
                        <>
                          <div className="text-[#074a5b] font-semibold mb-1 text-xs sm:text-base">beginnend mit</div>
                          <div className="text-xl sm:text-2xl font-bold text-[#1e809b]">{activity.price}</div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="text-center mb-8 sm:mb-12">
                <h2 className="text-2xl sm:text-4xl font-bold mb-3 sm:mb-4" style={{ color: "#074a5b" }}>
                  Malediven Insels erkunden
                </h2>
                <p className="text-base sm:text-xl text-gray-600 max-w-3xl mx-auto px-2">
                  Entdecken Sie einzigartige Unterkünfte und Aktivitäten in den wunderschönen Inselns der Malediven.
                </p>
              </div>
              <div className="space-y-4 sm:space-y-6">
                {relevantAtolls.map((atoll) => (
                  <div
                    key={atoll.id}
                    className="bg-white rounded-2xl sm:rounded-3xl shadow-lg overflow-hidden border-2 border-gray-200"
                  >
                    <button
                      onClick={() => handleAtollSelect(atoll.id)}
                      className="w-full p-4 sm:p-8 bg-white hover:bg-gray-50 transition-all duration-300 flex items-center justify-between border-b border-gray-200"
                    >
                      <div className="text-left min-w-0 flex-1">
                        <h3
                          className="text-lg sm:text-2xl font-bold mb-1 sm:mb-2"
                          style={{ color: "#074a5b" }}
                        >
                          {atoll.name}
                        </h3>
                        <p className="text-gray-600 text-sm sm:text-lg">
                          {atoll.accommodations.length} Unterkunft{atoll.accommodations.length !== 1 ? "en" : ""} • {countSitesForAtoll(atoll)} site{countSitesForAtoll(atoll) !== 1 ? "s" : ""}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0 ml-2">
                        <div className="hidden sm:flex items-center gap-2 bg-[#1e809b]/10 px-4 py-2 rounded-full">
                          <MapPin size={18} style={{ color: "#1e809b" }} />
                          <span
                            className="text-sm font-medium"
                            style={{ color: "#074a5b" }}
                          >
                            {atoll.media.length} Medien
                          </span>
                        </div>
                        <ChevronDown
                          className={`transform transition-transform duration-300 flex-shrink-0`}
                          size={24}
                          style={{ 
                            color: "#1e809b",
                            transform: selectedAtoll === atoll.id ? 'rotate(180deg)' : 'rotate(0deg)'
                          }}
                        />
                      </div>
                    </button>
                    {selectedAtoll === atoll.id && (
                      <div className="p-4 sm:p-8" style={{background:"linear-gradient(135deg, #f0f9ff 0%,rgb(255, 255, 255) 30%,rgb(237, 251, 253) 100%)"}}>
                        <div className="mb-8 sm:mb-10">
                          <div className="relative">
                            <div className="aspect-video bg-gray-100 rounded-lg sm:rounded-2xl overflow-hidden max-w-2xl mx-auto">
                              <img
                                src={atoll.media[atollSliderIndices[atoll.id] || 0].url}
                                alt={atoll.media[atollSliderIndices[atoll.id] || 0].caption}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            {atoll.media.length > 1 && (
                              <>
                                <button
                                  onClick={() =>
                                    handleSliderNavigation(atoll.id, "prev")
                                  }
                                  className="absolute left-2 sm:left-4 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-2 sm:p-3 shadow-lg transition-all duration-300"
                                >
                                  <ChevronLeft size={20} className="sm:w-6 sm:h-6" />
                                </button>
                                <button
                                  onClick={() =>
                                    handleSliderNavigation(atoll.id, "next")
                                  }
                                  className="absolute right-2 sm:right-4 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-2 sm:p-3 shadow-lg transition-all duration-300"
                                >
                                  <ChevronRight size={20} className="sm:w-6 sm:h-6" />
                                </button>
                              </>
                            )}
                          </div>

                          <div className="mt-6 sm:mt-8 mb-8 sm:mb-12">
                            <h4
                              className="text-xl sm:text-2xl font-semibold mb-3 sm:mb-4"
                              style={{ color: "#074a5b" }}
                            >
                              Über {atoll.name}
                            </h4>
                            <p className="text-gray-700 text-sm sm:text-lg leading-relaxed">
                              {atoll.description}
                            </p>
                          </div>

                          <div className="mb-8 sm:mb-12">
                            <h4
                              className="text-2xl sm:text-3xl font-semibold mb-4 sm:mb-6"
                              style={{ color: "#074a5b" }}
                            >
                              Verfügbare Resorts
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                              {atoll.accommodations.map((resort) => (
                                <div
                                  key={resort._id}
                                  className="bg-white rounded-lg sm:rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100"
                                >
                                  <div className="relative">
                                    <img
                                      src={resort.main_image || resort.images[0]}
                                      alt={resort.name}
                                      className="w-full h-40 sm:h-48 object-cover"
                                    />
                                  </div>
                                  <div className="p-3 sm:p-6">
                                    <h6 className="font-bold text-base sm:text-lg mb-2" style={{ color: "#074a5b" }}>
                                      {resort.name}
                                    </h6>
                                    <p className="text-gray-600 text-xs sm:text-sm mb-3 sm:mb-4 line-clamp-2">
                                      {resort.description}
                                    </p>
                                    <div className="flex flex-wrap gap-1 sm:gap-2">
                                      {resort.amenities?.slice(0, 3).map((amenity, idx) => (
                                        <span
                                          key={idx}
                                          className="bg-[#1e809b]/10 text-[#074a5b] px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs font-medium"
                                        >
                                          {amenity}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div>
                            <h4
                              className="text-2xl sm:text-3xl font-semibold mb-4 sm:mb-6"
                              style={{ color: "#074a5b" }}
                            >
                              Verfügbare Sites
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                              {getActivitySitesForAtoll(atoll.id).map((siteData, idx) => (
                                <div
                                  key={`site-${siteData._id || idx}`}
                                  className="bg-white rounded-lg sm:rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100"
                                >
                                  <div className="relative">
                                    <img
                                      src={getSafeImageUrl(siteData.image)}
                                      alt={siteData.name}
                                      className="w-full h-40 sm:h-48 object-cover"
                                    />
                                  </div>
                                  <div className="p-3 sm:p-6">
                                    <h6 className="font-bold text-base sm:text-lg mb-2" style={{ color: "#074a5b" }}>
                                      {siteData.name}
                                    </h6>
                                    <p className="text-gray-600 text-xs sm:text-sm mb-3 sm:mb-4 line-clamp-2">
                                      {siteData.description || activity.description}
                                    </p>
                                    <div className="flex flex-wrap gap-1 sm:gap-2">
                                      {activity.tags?.map((tag, tagIdx) => (
                                        <span
                                          key={tagIdx}
                                          className="bg-[#1e809b]/10 text-[#074a5b] px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs font-medium"
                                        >
                                          {tag}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      <InquiryFormModal
        isOpen={isModalOpen && !!activity}
        onClose={() => setIsModalOpen(false)}
        item={{ ...activity, type: activity?.type || activity?.entityType || 'activity' }}
        onSubmit={handleModalSubmit}
        language="en"
        buttonType={modalButtonType}
      />
    </div>
  );
};

export default ActivityProfile;
