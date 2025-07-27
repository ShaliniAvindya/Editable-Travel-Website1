import React, { useState, useEffect } from "react";
import { Search, Filter, Heart, Share2, MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from 'axios';

const Activities = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [filteredActivities, setFilteredActivities] = useState([]);
  const [isVisible, setIsVisible] = useState(false);
  const [activities, setActivities] = useState([]);
  const [categories, setCategories] = useState([]);
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Fetch activities
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [activitiesResponse, contentResponse] = await Promise.all([
          axios.get('/api/activities'),
          axios.get('/api/ui-content/activities'),
        ]);
        console.log('API Response (Activities):', activitiesResponse.data);
        console.log('API Response (Content):', contentResponse.data);
        setActivities(activitiesResponse.data);
        setContent(contentResponse.data);

        // Generate categories from unique tags
        const allTags = activitiesResponse.data.flatMap((activity) => activity.tags || []);
        const uniqueTags = [...new Set(allTags)];
        const generatedCategories = [
          { id: "all", name: "Alle Aktivitäten", count: activitiesResponse.data.length },
          ...uniqueTags.map((tag) => ({
            id: tag,
            name: tag.charAt(0).toUpperCase() + tag.slice(1).replace(/-/g, ' '),
            count: activitiesResponse.data.filter((activity) => activity.tags?.includes(tag)).length,
          })),
        ];
        setCategories(generatedCategories);

        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(`Aktivitäten konnten nicht geladen werden: ${err.response?.data?.msg || err.message}`);
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    setIsVisible(true);
    filterActivities();
  }, [searchTerm, selectedCategory, activities]);

  const filterActivities = () => {
    let filtered = activities;

    if (selectedCategory !== "all") {
      filtered = filtered.filter((activity) =>
        activity.tags?.includes(selectedCategory)
      );
    }

    if (searchTerm) {
      filtered = filtered.filter(
        (activity) =>
          activity.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          activity.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          activity.atolls?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredActivities(filtered);
  };

  const handleViewNow = (activityId) => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    navigate(`/activity/${activityId}`);
  };

  const getSectionContent = (sectionId) => {
    const section = content?.sections.find((s) => s.sectionId === sectionId);
    return {
      title: section?.content?.title || '',
      description: section?.content?.description || '',
      imageUrl: section?.content?.imageUrl || '',
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ fontFamily: "Comic Sans MS, cursive" }}>
        <p className="text-xl text-[#074a5b]">Ladeaktivitäten...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ fontFamily: "Comic Sans MS, cursive" }}>
        <p className="text-xl text-red-600">{error}</p>
      </div>
    );
  }

  const heroContent = getSectionContent('hero');

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "Comic Sans MS, cursive" }}>
      {/* Hero Section */}
      {heroContent.imageUrl && heroContent.title && heroContent.description && (
        <section className="relative h-[70vh] overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/50 to-[#074a5b]/90"></div>
          <img
            src={heroContent.imageUrl}
            alt="Activities Hero"
            className="w-full h-full object-cover"
            onError={(e) => {
              console.warn('Hero image failed to load:', heroContent.imageUrl);
              e.target.style.display = 'none';
            }}
          />
          <div className="absolute inset-0 flex items-center justify-center z-20">
            <div className="text-center text-white px-4 max-w-7xl">
              <div
                className={`transition-all duration-1000 ease-out ${
                  isVisible ? "opacity-100 transform translate-y-5" : "opacity-0 transform translate-y-8"
                }`}
              >
                <h1 className="text-5xl md:text-6xl font-bold mb-8 leading-tight">
                  <span className="text-white drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)] filter brightness-110">
                    {heroContent.title}
                  </span>
                </h1>
                <p
                  className={`text-xl md:text-2xl mb-12 text-white leading-relaxed max-w-4xl mx-auto transition-all duration-1000 delay-300 drop-shadow-[0_2px_4px_rgba(0,0,0,0.7)] filter brightness-110 ${
                    isVisible ? "opacity-100 transform translate-y-0" : "opacity-0 transform translate-y-8"
                  }`}
                >
                  {heroContent.description}
                </p>
                <div
                  className={`bg-white/20 backdrop-blur-xl rounded-2xl p-6 shadow-2xl border border-white/30 max-w-4xl mx-auto transition-all duration-1000 delay-500 ${
                    isVisible ? "transform translate-y-0 opacity-100" : "transform translate-y-8 opacity-0"
                  }`}
                >
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                      <Search
                        className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white"
                        size={20}
                      />
                      <input
                        type="text"
                        placeholder="Suchaktivitäten..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 rounded-xl bg-white/25 backdrop-blur-sm border border-white/40 focus:outline-none focus:ring-2 focus:ring-white/60 focus:border-white/60 text-white placeholder-white/90 font-medium"
                        style={{ fontFamily: "Comic Sans MS, cursive" }}
                      />
                    </div>
                    <div className="relative">
                      <Filter
                        className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white"
                        size={20}
                      />
                      <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="pl-12 pr-8 py-4 rounded-xl bg-white/25 backdrop-blur-sm border border-white/40 focus:outline-none focus:ring-2 focus:ring-white/60 focus:border-white/60 appearance-none text-white min-w-[200px] font-medium"
                        style={{ fontFamily: "Comic Sans MS, cursive" }}
                      >
                        {categories.map((category) => (
                          <option
                            key={category.id}
                            value={category.id}
                            className="bg-[#074a5b] text-white font-medium"
                            style={{ fontFamily: "Comic Sans MS, cursive" }}
                          >
                            {category.name} ({category.count})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Activities Grid */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: "#074a5b" }}>
              {selectedCategory === "all"
                ? getSectionContent('hero').title || "All Activities"
                : categories.find((c) => c.id === selectedCategory)?.name}
              <span className="text-[#1e809b] ml-2">({filteredActivities.length})</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredActivities.map((activity, index) => (
              <div
                key={activity._id}
                className={`group bg-white rounded-3xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-3 border border-gray-100 ${
                  isVisible ? "animate-fade-in" : "opacity-0"
                }`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {activity.media?.[0] && (
                  <div className="relative overflow-hidden">
                    <img
                      src={activity.media[0]}
                      alt={activity.name}
                      className="w-full h-64 object-cover transition-transform duration-700 group-hover:scale-110"
                      onError={(e) => {
                        console.warn(`Failed to load image for ${activity.name}: ${activity.media[0]}`);
                        e.target.style.display = 'none';
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
                    <div className="absolute top-4 right-4 flex gap-2">
                      <button className="bg-white/95 backdrop-blur-sm p-2 rounded-full shadow-lg hover:bg-white transition-colors duration-300">
                        <Heart className="w-4 h-4 text-gray-600" />
                      </button>
                      <button className="bg-white/95 backdrop-blur-sm p-2 rounded-full shadow-lg hover:bg-white transition-colors duration-300">
                        <Share2 className="w-4 h-4 text-gray-600" />
                      </button>
                    </div>
                    <div className="absolute bottom-4 right-4 bg-[#1e809b] text-white px-4 py-2 rounded-full shadow-lg">
                      <span className="font-bold text-lg">${activity.price}</span>
                    </div>
                  </div>
                )}
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-3" style={{ color: "#074a5b" }}>
                    {activity.name || ''}
                  </h3>
                  {activity.description && (
                    <p className="text-gray-600 mb-4 line-clamp-2">{activity.description}</p>
                  )}
                  <div className="space-y-2 mb-4">
                    {activity.tags?.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {activity.tags.slice(0, 3).map((tag, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded-full font-medium"
                          >
                            {tag.charAt(0).toUpperCase() + tag.slice(1).replace(/-/g, ' ')}
                          </span>
                        ))}
                        {activity.tags.length > 3 && (
                          <span className="px-3 py-1 bg-[#1e809b]/10 text-[#1e809b] text-xs rounded-full font-medium">
                            +{activity.tags.length - 3} mehr
                          </span>
                        )}
                      </div>
                    )}
                    {activity.atolls && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <MapPin size={16} className="text-[#1e809b]" />
                        <span className="text-sm">Verfügbar in: {activity.atolls}</span>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => handleViewNow(activity._id)}
                    className="w-full bg-[#1e809b] hover:bg-[#074a5b] text-white py-3 rounded-full font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                    style={{ fontFamily: "Comic Sans MS, cursive" }}
                  >
                    Jetzt ansehen
                  </button>
                </div>
              </div>
            ))}
          </div>

          {filteredActivities.length === 0 && (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">🏝️</div>
              <h3 className="text-2xl font-bold mb-2" style={{ color: "#074a5b" }}>
                Keine Aktivitäten gefunden
              </h3>
              <p className="text-gray-600 mb-6">Versuchen Sie, Ihre Such- oder Filterkriterien anzupassen</p>
              <button
                onClick={() => {
                  setSearchTerm("");
                  setSelectedCategory("all");
                }}
                className="bg-[#1e809b] hover:bg-[#074a5b] text-white px-6 py-3 rounded-full font-semibold transition-colors duration-300"
                style={{ fontFamily: "Comic Sans MS, cursive" }}
              >
                Alle Aktivitäten anzeigen
              </button>
            </div>
          )}
        </div>
      </section>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.6s ease-out forwards;
        }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
};

export default Activities;