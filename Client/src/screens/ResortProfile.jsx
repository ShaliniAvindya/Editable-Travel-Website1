import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import {
  MapPin, ChevronLeft, ChevronRight, X, Phone, MessageCircle, Mail,
} from 'lucide-react';
import axios from 'axios';
import InquiryFormModal from './InquiryFormModal';

const ResortProfile = () => {
  const { type, id } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showRoomModal, setShowRoomModal] = useState(null);
  const [currentRoomImageIndex, setCurrentRoomImageIndex] = useState(0);
  const [resortData, setResortData] = useState(state?.item || null);
  const [sameLocationResorts, setSameLocationResorts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [visibleItems, setVisibleItems] = useState({});
  const [showInquiryModal, setShowInquiryModal] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [inquiryButtonType, setInquiryButtonType] = useState('bookNow');

  const typeDisplay = {
    resort: 'Resorts',
    hotel: 'Hotels',
    adventure: 'Adventures',
  }[type] || type.charAt(0).toUpperCase() + type.slice(1) + 's';

  // Fetch resort data
  useEffect(() => {
    const fetchResort = async () => {
      try {
        setLoading(true);
        const resortResponse = await axios.get(`/api/resorts/${id}`);
        const data = resortResponse.data;
        // Use cover_images for hero, images for about slider
        const mappedResort = {
          ...data,
          price: data.rooms?.length > 0
            ? (() => {
                const roomWithPrice = data.rooms.find((room) => room.price_per_night);
                return roomWithPrice ? roomWithPrice.price_per_night : '';
              })()
            : 'N/A',
          media: data.cover_images?.length > 0
            ? data.cover_images.map((url, index) => ({ url, type: 'image', caption: `Cover Image ${index + 1}` }))
            : [{ url: data.cover_image || 'https://via.placeholder.com/800', type: 'image', caption: 'Cover Image' }],
          aboutImages: data.images?.length > 0
            ? data.images.map((url, index) => ({ url, type: 'image', caption: `Image ${index + 1}` }))
            : [],
          rooms: data.rooms?.map((room) => ({
            ...room,
            name: room.type,
            price: room.price_per_night || 'N/A',
            size: `${room.size_sqm || 'N/A'} sqm`,
            capacity: `${room.capacity?.adults || 0} Adults, ${room.capacity?.children || 0} Children`,
          })) || [],
        };
        setResortData(mappedResort);

        // Fetch resorts in the same atoll
        const allResortsResponse = await axios.get('/api/resorts');
        const allResorts = allResortsResponse.data;
        console.log('All Resorts API Response:', allResorts);
        const filteredResorts = allResorts
          .filter((item) => item.atoll?._id === data.atoll?._id && item._id !== id && item.type === type)
          .slice(0, 3)
          .map((item) => ({
            ...item,
            id: item._id,
            image: item.cover_image || 'https://via.placeholder.com/400',
            price: item.rooms?.length > 0
              ? `$${Math.min(...item.rooms.map((room) => room.pricePerNight || room.price_per_night || Infinity))}`
              : 'N/A',
          }));
        setSameLocationResorts(filteredResorts);

        setLoading(false);
      } catch (err) {
        console.error('Error fetching resort:', err);
        setError(`Failed to load accommodation: ${err.response?.data?.msg || err.message}`);
        setLoading(false);
      }
    };

    if (!state?.item) {
      fetchResort();
    } else {
      const mappedResort = {
        ...state.item,
        price: state.item.rooms?.length > 0
          ? (() => {
              const roomWithPrice = state.item.rooms.find((room) => room.price_per_night);
              return roomWithPrice ? roomWithPrice.price_per_night : 'N/A';
            })()
          : 'N/A',
        media: state.item.cover_images?.length > 0
          ? state.item.cover_images.map((url, index) => ({ url, type: 'image', caption: `Cover Image ${index + 1}` }))
          : [{ url: state.item.cover_image || 'https://via.placeholder.com/800', type: 'image', caption: 'Cover Image' }],
        aboutImages: state.item.images?.length > 0
          ? state.item.images.map((url, index) => ({ url, type: 'image', caption: `Image ${index + 1}` }))
          : [],
        rooms: state.item.rooms?.map((room) => ({
          ...room,
          name: room.type,
          price: room.price_per_night || 'N/A',
          size: `${room.size_sqm || 'N/A'} sqm`,
          capacity: `${room.capacity?.adults || 0} Adults, ${room.capacity?.children || 0} Children`,
        })) || [],
      };
      setResortData(mappedResort);

      const fetchSameLocationResorts = async () => {
        try {
          const response = await axios.get('/api/resorts');
          const allResorts = response.data;
          const filteredResorts = allResorts
            .filter((item) => item.atoll?._id === state.item.atoll?._id && item._id !== id && item.type === type)
            .slice(0, 3)
            .map((item) => ({
              ...item,
              id: item._id,
              image: item.cover_image || 'https://via.placeholder.com/400',
              price: item.rooms?.length > 0
                ? `$${Math.min(...item.rooms.map((room) => room.pricePerNight || room.price_per_night || Infinity))}`
              : 'N/A',
            }));
          setSameLocationResorts(filteredResorts);
        } catch (err) {
          console.error('Error fetching same location resorts:', err);
        }
      };
      fetchSameLocationResorts();
      setLoading(false);
    }
  }, [id, state, type]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.getAttribute('data-id');
            setVisibleItems((prev) => ({ ...prev, [id]: true }));
          }
        });
      },
      { threshold: 0.1 }
    );

    const elements = document.querySelectorAll('[data-animate]');
    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [sameLocationResorts]);

  // Auto-slider
  useEffect(() => {
    if (!resortData?.media?.length) return;

    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % resortData.media.length);
    }, 5000); 

    return () => clearInterval(interval);
  }, [resortData?.media]);

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % resortData.media.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + resortData.media.length) % resortData.media.length);
  };

  const nextRoomImage = () => {
    if (showRoomModal) {
      setCurrentRoomImageIndex((prev) => (prev + 1) % showRoomModal.images.length);
    }
  };

  const prevRoomImage = () => {
    if (showRoomModal) {
      setCurrentRoomImageIndex((prev) => (prev - 1 + showRoomModal.images.length) % showRoomModal.images.length);
    }
  };

  const handleViewDetails = (resort) => {
    navigate(`/resort/${resort.type}/${resort.id}`, { state: { item: resort } });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      setShowRoomModal(null);
    }
  };

  const handleInquirySubmit = async (submissionData) => {
    try {
      const response = await axios.post('/api/inquiries', submissionData);
      console.log('Anfrage erfolgreich abgeschickt:', response.data);
      setShowInquiryModal(false);
      setSelectedRoom(null);
      setInquiryButtonType('bookNow');
    } catch (err) {
      console.error('Fehler beim Senden der Anfrage:', err);
      throw new Error('Anfrage konnte nicht gesendet werden');
    }
  };

  if (loading) {
    return <div className="text-center py-16 text-[#074a5b]">Ladeunterkünfte...</div>;
  }

  if (error || !resortData) {
    return <div className="text-center py-16 text-[#074a5b]">{error || 'Unterkunft nicht gefunden'}</div>;
  }

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "'Comic Sans MS', 'Comic Neue'" }}>
      {/* Hero Section with Image Gallery */}
      <section className="relative h-[700px] overflow-hidden">
        <div className="absolute inset-0">
          {resortData.media && resortData.media.length > 0 && resortData.media[currentImageIndex] ? (
            <img
              src={resortData.media[currentImageIndex].url}
              alt={resortData.media[currentImageIndex].caption}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-500 text-2xl">No Image</div>
          )}
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/50 to-[#074a5b]/90"></div>
        <button
          onClick={prevImage}
          className="absolute left-6 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white p-3 rounded-full backdrop-blur-sm transition-all duration-300"
        >
          <ChevronLeft size={24} />
        </button>
        <button
          onClick={nextImage}
          className="absolute right-6 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white p-3 rounded-full backdrop-blur-sm transition-all duration-300"
        >
          <ChevronRight size={24} />
        </button>
        <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 flex gap-2">
          {resortData.media.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentImageIndex(index)}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                index === currentImageIndex ? 'bg-white' : 'bg-white/50 hover:bg-white/75'
              }`}
            />
          ))}
        </div>
        <div className="absolute bottom-10 left-6 right-6 text-white max-w-4xl">
          <h1 className="text-2xl sm:text-4xl md:text-7xl font-bold mb-4 sm:mb-8 drop-shadow-2xl leading-tight break-words">{resortData.name}</h1>
          <div className="flex flex-col sm:flex-row sm:items-center mb-3 sm:mb-6 text-base sm:text-2xl gap-1 sm:gap-0">
            <span className="flex items-center">
              <MapPin size={20} className="mr-2 sm:mr-3" />
            <span className="font-semibold text-[#b2e0ea] sm:text-[#fff]">{resortData.atoll?.name || 'Insel'} Insel</span>
            </span>
            <span className="hidden sm:inline mx-2">,</span>
           <span className="font-semibold">{resortData.island || 'Atolle'}</span>

          </div>
          <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-8">
            {resortData.price && typeof resortData.price === 'string' && resortData.price.trim() !== '' && resortData.price !== 'N/A' && (
              <div className="bg-[#1e809b]/80 backdrop-blur-sm px-4 sm:px-8 py-1.5 sm:py-2 rounded-full font-semibold text-base sm:text-xl">
                aus {resortData.price}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Resort Information */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2">
              <div className="mb-12">
                <h2 className="text-3xl font-bold mb-6 text-[#074a5b]">Über dieses {type.charAt(0).toUpperCase() + type.slice(1)}</h2>
                {/* About Images Slider */}
            {resortData.aboutImages && resortData.aboutImages.length >= 0 && (
              <div className="mb-8">
                {resortData.aboutImages.length === 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 h-80">
                    <div className="relative rounded-2xl overflow-hidden shadow-lg group cursor-pointer col-span-2 md:col-span-1"
                        onClick={() => setCurrentImageIndex(0)}>
                      <img
                        src={resortData.aboutImages[0].url}
                        alt={resortData.aboutImages[0].caption}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    </div>
                    <div className="grid grid-rows-2 gap-4">
                      {resortData.aboutImages.slice(1, 3).map((image, idx) => (
                        <div key={idx + 1} className="relative rounded-2xl overflow-hidden shadow-lg group cursor-pointer"
                            onClick={() => setCurrentImageIndex(idx + 1)}>
                          <img
                            src={image.url}
                            alt={image.caption}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Main Image Display */}
                    <div className="relative w-full h-96 rounded-2xl overflow-hidden shadow-xl">
                      <img
                        src={resortData.aboutImages[currentImageIndex % resortData.aboutImages.length].url}
                        alt={resortData.aboutImages[currentImageIndex % resortData.aboutImages.length].caption}
                        className="w-full h-full object-cover transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent"></div>
                      {/* Navigation Arrows */}
                      <button
                        onClick={() => setCurrentImageIndex((prev) => (prev - 1 + resortData.aboutImages.length) % resortData.aboutImages.length)}
                        className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white p-3 rounded-full shadow-lg transition-all duration-300 hover:scale-110"
                      >
                        <ChevronLeft size={24} />
                      </button>
                      <button
                        onClick={() => setCurrentImageIndex((prev) => (prev + 1) % resortData.aboutImages.length)}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white p-3 rounded-full shadow-lg transition-all duration-300 hover:scale-110"
                      >
                        <ChevronRight size={24} />
                      </button>
                      {/* Image Counter */}
                      <div className="absolute bottom-4 right-4 bg-black/50 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm font-medium">
                        {(currentImageIndex % resortData.aboutImages.length) + 1} / {resortData.aboutImages.length}
                      </div>
                    </div>
                    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                      {resortData.aboutImages.map((image, idx) => (
                        <button
                          key={idx}
                          onClick={() => setCurrentImageIndex(idx)}
                          className={`relative flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden shadow-md transition-all duration-300 ${
                            idx === (currentImageIndex % resortData.aboutImages.length)
                              ? 'ring-2 ring-[#1e809b] ring-offset-2 scale-105'
                              : 'hover:scale-105 opacity-70 hover:opacity-100'
                          }`}
                        >
                          <img
                            src={image.url}
                            alt={`Thumbnail ${idx + 1}`}
                            className="w-full h-full object-cover"
                          />
                          {idx === (currentImageIndex % resortData.aboutImages.length) && (
                            <div className="absolute inset-0 bg-[#1e809b]/20"></div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
                <p className="text-gray-700 text-lg leading-relaxed mb-4">{resortData.description || 'Keine Beschreibung verfügbar'}</p>
                <p className="text-gray-600 leading-relaxed">{resortData.description || 'Entdecken Sie den Charme dieser Unterkunft.'}</p>
              </div>
              <div className="mb-12">
                <h3 className="text-2xl font-bold mb-6 text-[#074a5b]">{type.charAt(0).toUpperCase() + type.slice(1)} Annehmlichkeiten</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {resortData.amenities?.map((amenity, index) => (
                    <div key={index} className="flex items-center p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors duration-300">
                      <div className="w-2 h-2 bg-[#1e809b] rounded-full mr-3"></div>
                      <span className="text-gray-700 text-sm">{amenity}</span>
                    </div>
                  )) || <p className="text-gray-600">Keine Annehmlichkeiten aufgeführt.</p>}
                </div>
              </div>
              <div className="mb-12">
                <h3 className="text-2xl font-bold mb-6 text-[#074a5b]">Verfügbare Zimmerkategorien</h3>
                <div className="overflow-x-auto">
                  <div className="flex gap-6 px-2 py-4 md:px-4 flex-nowrap">
                    {resortData.rooms.map((room) => (
                      <div
                        key={room._id || room.type}
                        className="min-w-[300px] md:min-w-[400px] border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-shadow duration-300 flex-shrink-0"
                      >
                        <div className="flex flex-col gap-4">
                          <div className="h-48 rounded-xl overflow-hidden">
                            <img
                              src={room.images[0] || 'https://via.placeholder.com/400'}
                              alt={room.name}
                              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                            />
                          </div>
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="text-lg font-bold text-[#074a5b]">{room.name}</h4>
                            <div className="text-right">
                              {room.price && typeof room.price === 'string' && room.price.trim() !== '' && room.price !== 'N/A' && (
                                <div className="text-xl font-bold text-[#1e809b]">{room.price}</div>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2 text-sm text-gray-600">
                            <span>{room.size}</span>
                            <span>•</span>
                            <span>{room.capacity}</span>
                          </div>
                          <p className="text-gray-700 text-sm">{room.description}</p>
                          <div className="flex flex-wrap gap-2 mb-2">
                            {room.amenities.slice(0, 4).map((amenity, idx) => (
                              <span
                                key={idx}
                                className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                              >
                                {amenity}
                              </span>
                            ))}
                            {room.amenities.length > 4 && (
                              <span className="px-3 py-1 bg-[#1e809b]/10 text-[#1e809b] text-xs rounded-full">
                                +{room.amenities.length - 4} mehr
                              </span>
                            )}
                          </div>
                          <button
                            onClick={() => {
                              setShowRoomModal(room);
                              setCurrentRoomImageIndex(0);
                            }}
                            className="bg-[#1e809b] hover:bg-[#074a5b] text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 transform hover:scale-105"
                          >
                            Zimmerdetails anzeigen
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
           <div className="lg:col-span-1">
  <div className="sticky top-24">
    <div className="bg-gradient-to-br from-white via-slate-50/40 to-gray-100/60 border border-gray-200/60 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 backdrop-blur-sm">
      
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-2xl font-bold text-[#074a5b] mb-2">{resortData.name}</h3>
        <div className="w-12 h-0.5 bg-gradient-to-r from-[#1e809b] to-[#074a5b] rounded-full"></div>
      </div>
      
      {/* Pricing */}
      {resortData.price && typeof resortData.price === 'string' && resortData.price.trim() !== '' && resortData.price !== 'N/A' && (
        <div className="mb-6">
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-3xl font-bold text-[#1e809b]">{resortData.price}</span>
          </div>
        </div>
      )}
      
      {/* Location */}
      <div className="mb-6 p-4 bg-gradient-to-br from-white/90 via-blue-50/80 to-cyan-50/60 rounded-xl border border-blue-200/40 shadow-sm">
        <div className="flex items-center mb-2">
          <MapPin size={18} className="mr-2 text-[#1e809b]" />
          <span className="text-sm font-medium text-gray-600">Standort</span>
        </div>
        <div className="text-gray-600">
          {resortData.atoll?.name || 'Insel'}
        </div>
        <div className="text-lg font-semibold text-[#074a5b]">
          {resortData.island|| 'Atoll'} Atoll
        </div>
      </div>
      
      {/* Available Rooms */}
      <div className="w-full mb-4">
        <div className="text-center p-6 bg-gradient-to-br from-blue-50/70 via-cyan-50/60 to-sky-50/80 rounded-xl border border-blue-200/40 shadow-sm">
          <div className="text-3xl font-bold bg-gradient-to-r from-[#1e809b] via-blue-600 to-cyan-500 bg-clip-text text-transparent mb-2">
            {resortData.rooms?.length || 0}
          </div>
          <div className="text-sm text-gray-600 uppercase tracking-wide font-medium">
            Verfügbare Zimmertypen
          </div>
        </div>
      </div>

      {/* Resort Inquiry Buttons */}
      <div className="flex flex-col gap-3 mt-4">
        <button
          onClick={() => {
            setSelectedRoom(null);
            setInquiryButtonType('bookNow');
            setShowInquiryModal(true);
          }}
          className="flex-1 bg-[#1e809b] hover:bg-[#074a5b] text-white py-3 px-6 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 flex items-center justify-center mb-2"
        >
          <Mail size={20} className="mr-2" />
          Buchen Sie per E-Mail
        </button>
        <button
          onClick={() => {
            setSelectedRoom(null);
            setInquiryButtonType('whatsapp');
            setShowInquiryModal(true);
          }}
          className="flex-1 bg-green-500 hover:bg-green-600 text-white py-3 px-6 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 flex items-center justify-center"
        >
          <MessageCircle size={20} className="mr-2" />
          Buchen Sie per WhatsApp
        </button>
      </div>
    </div>
  </div>
</div>
</div></div>
      </section>

      {/* Other Resorts in Same Atoll */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4 text-[#074a5b]">
              Andere {typeDisplay} im {resortData.atoll?.name || 'Unbekannter Atoll'}
            </h2>
            <p className="text-gray-600 text-lg">
              Entdecken Sie Weitere Erstaunliche Unterkünfte im Selben Atoll
            </p>
          </div>

          {sameLocationResorts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {sameLocationResorts.map((resort, index) => (
                <div
                  key={`${resort.type}-${resort.id}`}
                  data-animate
                  data-id={`${resort.type}-${resort.id}`}
                  className={`group bg-white rounded-3xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-gray-100 ${
                    visibleItems[`${resort.type}-${resort.id}`] ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-8'
                  }`}
                  style={{ transitionDelay: `${index * 100}ms` }}
                >
                  <div className="relative h-64 overflow-hidden">
                    <img
                      src={resort.cover_image}
                      alt={resort.name || 'Accommodation'}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="absolute top-4 left-4 bg-[#1e809b]/90 backdrop-blur-sm px-3 py-1 rounded-full shadow-lg">
                      <span className="text-white text-sm font-semibold">
                        {resort.price} / Nacht
                      </span>
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold mb-2 text-[#074a5b] group-hover:text-[#1e809b] transition-colors duration-300">
                      {resort.name || 'Unnamed Resort'}
                    </h3>
                    <p className="text-gray-600 mb-3 flex items-center">
                      <MapPin size={16} className="mr-2 text-[#1e809b]" />
                      {resort.island || 'Unbekannte Insel'} Insel, {resort.atoll?.name || 'Unbekannter Atoll'}
                    </p>
                    <p className="text-gray-700 mb-4 text-sm leading-relaxed">
                      {resort.description || 'Keine Beschreibung verfügbar'}
                    </p>
                    <div className="mb-6">
                      <div className="flex flex-wrap gap-2">
                        {resort.amenities?.slice(0, 3).map((amenity, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded-full font-medium"
                          >
                            {amenity}
                          </span>
                        ))}
                        {resort.amenities?.length > 3 && (
                          <span className="px-3 py-1 bg-[#1e809b]/10 text-[#1e809b] text-xs rounded-full font-medium">
                            +{resort.amenities.length - 3} mehr
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleViewDetails(resort)}
                        className="flex-1 bg-[#1e809b] hover:bg-[#074a5b] text-white px-4 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg"
                      >
                        Details anzeigen
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">🏝️</div>
              <h3 className="text-2xl font-bold text-[#074a5b] mb-2">Nichts gefunden</h3>
              <p className="text-gray-600 mb-3">Nichts {typeDisplay.toLowerCase()} verfügbar in diesem Atoll</p>
            </div>
          )}
        </div>
      </section>

      {/* Room Details Modal */}
      {showRoomModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm"
          onClick={handleBackdropClick}
        >
          <div
            className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] overflow-y-auto room-modal-mobile"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative">
              <button
                onClick={() => setShowRoomModal(null)}
                className="absolute top-2 right-2 sm:top-4 sm:right-4 z-10 bg-white/90 hover:bg-white text-gray-700 p-2 rounded-full shadow-lg transition-all duration-300"
              >
                <X size={20} />
              </button>
              <div className="relative h-48 sm:h-96 overflow-hidden rounded-t-2xl">
                <img
                  src={showRoomModal.images[currentRoomImageIndex]}
                  alt={`${showRoomModal.name} - Image ${currentRoomImageIndex + 1}`}
                  className="w-full h-full object-cover"
                />
                {showRoomModal.images.length > 1 && (
                  <>
                    <button
                      onClick={prevRoomImage}
                      className="absolute left-2 sm:left-4 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white p-1.5 sm:p-2 rounded-full backdrop-blur-sm transition-all duration-300"
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <button
                      onClick={nextRoomImage}
                      className="absolute right-2 sm:right-4 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white p-1.5 sm:p-2 rounded-full backdrop-blur-sm transition-all duration-300"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </>
                )}
                <div className="absolute bottom-2 sm:bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                  {showRoomModal.images.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentRoomImageIndex(index)}
                      className={`w-2 h-2 rounded-full transition-all duration-300 ${
                        index === currentRoomImageIndex ? 'bg-white' : 'bg-white/50 hover:bg-white/75'
                      }`}
                    />
                  ))}
                </div>
              </div>
              <div className="p-3 sm:p-8">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-3 sm:mb-6 gap-2 sm:gap-0">
                  <div>
                    <h2 className="text-lg sm:text-2xl font-bold text-[#074a5b] mb-1 sm:mb-2">{showRoomModal.name}</h2>
                    <div className="flex gap-2 sm:gap-4 text-xs sm:text-base text-gray-600">
                      <span>{showRoomModal.size}</span>
                      <span>•</span>
                      <span>{showRoomModal.capacity}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    {showRoomModal.price && typeof showRoomModal.price === 'string' && showRoomModal.price.trim() !== '' && showRoomModal.price !== 'N/A' && (
                      <div className="text-lg sm:text-3xl font-bold text-[#1e809b]">{showRoomModal.price}</div>
                    )}
                  </div>
                </div>
                <p className="text-gray-700 text-xs sm:text-lg mb-3 sm:mb-6 leading-relaxed">{showRoomModal.description}</p>
                <div className="mb-4 sm:mb-8">
                  <h3 className="text-sm sm:text-lg font-semibold text-[#074a5b] mb-2 sm:mb-4">Zimmerausstattung</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3">
                    {showRoomModal.amenities.map((amenity, index) => (
                      <div key={index} className="flex items-center p-2 sm:p-3 bg-gray-50 rounded-xl">
                        <div className="w-2 h-2 bg-[#1e809b] rounded-full mr-2 sm:mr-3"></div>
                        <span className="text-gray-700 text-[11px] sm:text-sm">{amenity}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                  <button
                    onClick={() => {
                      setSelectedRoom(showRoomModal);
                      setInquiryButtonType('bookNow');
                      setShowInquiryModal(true);
                    }}
                    className="flex-1 bg-[#1e809b] hover:bg-[#074a5b] text-white py-2 px-3 sm:py-3 sm:px-6 rounded-xl text-xs sm:text-base font-semibold transition-all duration-300 transform hover:scale-105 flex items-center justify-center"
                  >
                    <Mail size={16} className="mr-2 sm:mr-2.5" />
                    <span className="hidden sm:inline">Buchen Sie Ihr Zimmer per E-Mail</span>
                    <span className="sm:hidden">Per E-Mail buchen</span>
                  </button>
                  <button
                    onClick={() => {
                      setSelectedRoom(showRoomModal);
                      setInquiryButtonType('whatsapp');
                      setShowInquiryModal(true);
                    }}
                    className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 px-3 sm:py-3 sm:px-6 rounded-xl text-xs sm:text-base font-semibold transition-all duration-300 transform hover:scale-105 flex items-center justify-center"
                  >
                    <MessageCircle size={16} className="mr-2 sm:mr-2.5" />
                    <span className="hidden sm:inline">Zimmer über WhatsApp buchen</span>
                    <span className="sm:hidden">Per WhatsApp buchen</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
          {/* Mobile-specific room modal adjustments */}
          <style>{`
            @media (max-width: 640px) {
              .room-modal-mobile {
                border-radius: 12px !important;
                max-width: 98vw !important;
                margin: 0 auto !important;
              }
              .room-modal-mobile .rounded-t-2xl {
                border-top-left-radius: 12px !important;
                border-top-right-radius: 12px !important;
              }
            }
          `}</style>
        </div>
      )}

      {/* Inquiry Form Modal */}
      {showInquiryModal && (
        <InquiryFormModal
          isOpen={showInquiryModal}
          onClose={() => {
            setShowInquiryModal(false);
            setSelectedRoom(null);
            setInquiryButtonType('bookNow');
          }}
          item={{
            _id: resortData._id,
            title: selectedRoom ? `${resortData.name} - ${selectedRoom.name}` : resortData.name,
            description: selectedRoom ? selectedRoom.description : resortData.description,
            expiryDate: null,
          }}
          onSubmit={handleInquirySubmit}
          language="en"
          buttonType={inquiryButtonType}
          resortName={resortData.name}
          roomName={selectedRoom ? selectedRoom.name : undefined}
        />
      )}
    </div>
  );
};

export default ResortProfile;
