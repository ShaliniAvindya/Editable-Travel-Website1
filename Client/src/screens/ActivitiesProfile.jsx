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
        const atollsResponse = await axios.get('https://editable-travel-website1-rpfv.vercel.app/api/atolls');
        const atollsData = atollsResponse.data;

        const atollsWithData = await Promise.all(
          atollsData.map(async (atoll) => {
            try {
              // Fetch accommodations for this atoll
              const resortsResponse = await axios.get(
                `https://editable-travel-website1-rpfv.vercel.app/api/resorts/byAtoll/${atoll._id}`
              );

              // Fetch activities for this atoll
              const activitiesResponse = await axios.get(
                `https://editable-travel-website1-rpfv.vercel.app/api/activities/byAtoll/${atoll._id}`
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
          const activityResponse = await axios.get(`https://editable-travel-website1-rpfv.vercel.app/api/activities/${activityId}`);
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
      const response = await axios.post('https://editable-travel-website1-rpfv.vercel.app/api/inquiries', submissionData);
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
    <div className="min-h-screen bg-white" style={{ fontFamily: "Comic Sans MS, cursive" }}>
      {/* Hero Section */}
      <section className="relative h-[600px] overflow-hidden">
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
              className="absolute left-6 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white p-3 rounded-full backdrop-blur-sm transition-all duration-300"
            >
              <ChevronLeft size={24} />
            </button>
            <button
              onClick={() => handleActivityImageNav('next')}
              className="absolute right-6 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white p-3 rounded-full backdrop-blur-sm transition-all duration-300"
            >
              <ChevronRight size={24} />
            </button>
            <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2 flex items-center gap-2">
              {activity.media.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setActiveImageIndex(index)}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    index === activeImageIndex ? "bg-white" : "bg-white/50 hover:bg-white/75"
                  }`}
                />
              ))}
            </div>
          </>
        )}
        <div className="absolute bottom-10 left-6 right-6 text-white max-w-4xl">
          <h1 className="text-4xl md:text-7xl font-bold mb-8 drop-shadow-2xl">
            {activity.name}
          </h1>
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-[#1e809b]/80 backdrop-blur-sm px-8 py-2 rounded-full font-semibold text-xl">
              Aus ${activity.price}
            </div>
          </div>
        </div>
      </section>

      <section className="sticky top-0 z-50 bg-white/95 backdrop-blur-lg shadow-lg border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 text-gray-700">
                <span className="text-4xl font-bold text-[#074a5b]">
                  ${activity.price}
                </span>
                <span className="text-xl text-gray-600">pro Person</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={handleBookNow}
                className="bg-[#074a5b] hover:bg-[#1e809b] text-white px-6 py-3 rounded-full font-bold transition-all duration-300 transform hover:scale-105 flex items-center gap-2"
                disabled={!activity}
              >
                <MessageCircle size={16} />
                Buchen Sie per E-Mail
              </button>
              <button
                onClick={handleWhatsAppContact}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-full font-bold transition-all duration-300 transform hover:scale-105 flex items-center gap-2"
                disabled={!activity}
              >
                <MessageCircle size={16} />
                Buchen Sie per WhatsApp
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Available Locations */}
      <section className="py-16 px-4 bg-gradient-to-b from-cyan-50 to-white">
        <div className="max-w-7xl mx-auto">
          {activity?.available_in_all_atolls ? (            
            <div className="bg-white rounded-2xl shadow-md p-8">
              <div className="relative">
                {/* Main content */}
                <div className="grid md:grid-cols-2 gap-8 items-center">
                  <div className="space-y-6">
                    <div className="inline-block bg-[#074a5b] text-white px-6 py-2 rounded-full text-sm font-semibold mb-4">
                      In allen Atollen verfügbar
                    </div>
                    <h3 className="text-3xl font-bold text-[#074a5b] leading-tight">
                      Erfahrung {activity.name} in jedem Atoll der Malediven
                    </h3>
                    <p className="text-lg text-gray-600 leading-relaxed">
                      {activity.name} ist in jedem Atoll der Malediven verfügbar. Wählen Sie ein beliebiges Resort und tauchen Sie in dieses unglaubliche Erlebnis an Ihrem bevorzugten Standort ein.
                    </p>
                    <div className="mt-8 border-t border-gray-100 pt-8">
                      <h4 className="text-xl font-semibold text-[#074a5b] mb-4">Über dieses Erlebnis</h4>
                      <p className="text-gray-600 leading-relaxed">
                        {activity.description}
                      </p>
                      {activity.requirements && (
                        <div className="mt-4 border-t border-gray-100 pt-4">
                          <h5 className="font-semibold text-[#074a5b] mb-2">Anforderungen</h5>
                          <p className="text-gray-600">{activity.requirements}</p>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={handleBookNow}
                      className="mt-6 bg-[#074a5b] text-white px-8 py-4 rounded-xl font-semibold transition-all duration-300 hover:bg-[#1e809b] flex items-center gap-3"
                      disabled={!activity}
                    >
                      <MessageCircle size={20} />
                      Buchen Sie dieses Erlebnis
                    </button>
                  </div>                  
                  <div className="relative">
                    <div className="rounded-xl overflow-hidden shadow-md">
                      <img
                        src={getSafeImageUrl(activity?.media[0])}
                        alt={activity.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="absolute -bottom-6 -right-6 bg-white rounded-2xl shadow-xl p-4 max-w-xs">
                      <div className="text-[#074a5b] font-semibold mb-1">beginnend mit</div>
                      <div className="text-2xl font-bold text-[#1e809b]">${activity.price}</div>
                      <div className="text-gray-500 text-sm">pro Person</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="text-center mb-12">
                <h2 className="text-4xl font-bold mb-4" style={{ color: "#074a5b" }}>
                  Malediven Atolle erkunden
                </h2>
                <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                  Entdecken Sie einzigartige Unterkünfte und Aktivitäten in den wunderschönen Atollen der Malediven.
                </p>
              </div>
              <div className="space-y-6">
                {relevantAtolls.map((atoll) => (
                  <div
                    key={atoll.id}
                    className="bg-white rounded-3xl shadow-lg overflow-hidden border-2 border-gray-200"
                  >
                    <button
                      onClick={() => handleAtollSelect(atoll.id)}
                      className="w-full p-8 bg-white hover:bg-gray-50 transition-all duration-300 flex items-center justify-between border-b border-gray-200"
                    >
                      <div className="text-left">
                        <h3
                          className="text-2xl font-bold mb-2"
                          style={{ color: "#074a5b" }}
                        >
                          {atoll.name}
                        </h3>
                        <p className="text-gray-600 text-lg">
                          {atoll.accommodations.length} Unterkunft{atoll.accommodations.length !== 1 ? "en" : ""} • {countSitesForAtoll(atoll)} site{countSitesForAtoll(atoll) !== 1 ? "s" : ""}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 bg-[#1e809b]/10 px-4 py-2 rounded-full">
                          <MapPin size={18} style={{ color: "#1e809b" }} />
                          <span
                            className="text-sm font-medium"
                            style={{ color: "#074a5b" }}
                          >
                            {atoll.media.length} Medien
                          </span>
                        </div>
                        <ChevronDown
                          className={`transform transition-transform duration-300 ${
                            selectedAtoll === atoll.id ? "rotate-180" : ""
                          }`}
                          size={28}
                          style={{ color: "#1e809b" }}
                        />
                      </div>
                    </button>
                    {selectedAtoll === atoll.id && (
                      <div className="p-8" style={{background:"linear-gradient(135deg, #f0f9ff 0%,rgb(255, 255, 255) 30%,rgb(237, 251, 253) 100%)"}}>
                        <div className="mb-10">
                          <div className="relative">
                            <div className="aspect-video bg-gray-100 rounded-2xl overflow-hidden max-w-2xl mx-auto">
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
                                  className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-3 shadow-lg transition-all duration-300"
                                >
                                  <ChevronLeft size={24} className="text-gray-700" />
                                </button>
                                <button
                                  onClick={() =>
                                    handleSliderNavigation(atoll.id, "next")
                                  }
                                  className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-3 shadow-lg transition-all duration-300"
                                >
                                  <ChevronRight size={24} className="text-gray-700" />
                                </button>
                              </>
                            )}
                          </div>

                          <div className="mt-8 mb-12">
                            <h4
                              className="text-2xl font-semibold mb-4"
                              style={{ color: "#074a5b" }}
                            >
                              Über {atoll.name}
                            </h4>
                            <p className="text-gray-700 text-lg leading-relaxed">
                              {atoll.description}
                            </p>
                          </div>

                          <div className="mb-12">
                            <h4
                              className="text-3xl font-semibold mb-6"
                              style={{ color: "#074a5b" }}
                            >
                              Verfügbare Resorts
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                              {atoll.accommodations.map((resort) => (
                                <div
                                  key={resort._id}
                                  className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100"
                                >
                                  <div className="relative">
                                    <img
                                      src={resort.main_image || resort.images[0]}
                                      alt={resort.name}
                                      className="w-full h-48 object-cover"
                                    />
                                  </div>
                                  <div className="p-6">
                                    <h6 className="font-bold text-lg mb-2" style={{ color: "#074a5b" }}>
                                      {resort.name}
                                    </h6>
                                    <p className="text-gray-600 text-sm mb-4">
                                      {resort.description}
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                      {resort.amenities?.slice(0, 3).map((amenity, idx) => (
                                        <span
                                          key={idx}
                                          className="bg-[#1e809b]/10 text-[#074a5b] px-3 py-1 rounded-full text-xs font-medium"
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
                              className="text-3xl font-semibold mb-6"
                              style={{ color: "#074a5b" }}
                            >
                              Verfügbare Sites
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                              {getActivitySitesForAtoll(atoll.id).map((siteData, idx) => (
                                <div
                                  key={`site-${siteData._id || idx}`}
                                  className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100"
                                >
                                  <div className="relative">
                                    <img
                                      src={getSafeImageUrl(siteData.image)}
                                      alt={siteData.name}
                                      className="w-full h-48 object-cover"
                                    />
                                  </div>
                                  <div className="p-6">
                                    <h6 className="font-bold text-lg mb-2" style={{ color: "#074a5b" }}>
                                      {siteData.name}
                                    </h6>
                                    <p className="text-gray-600 text-sm mb-4">
                                      {siteData.description || activity.description}
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                      {activity.tags?.map((tag, tagIdx) => (
                                        <span
                                          key={tagIdx}
                                          className="bg-[#1e809b]/10 text-[#074a5b] px-3 py-1 rounded-full text-xs font-medium"
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
        item={activity}
        onSubmit={handleModalSubmit}
        language="en"
        buttonType={modalButtonType}
      />
    </div>
  );
};

export default ActivityProfile;
