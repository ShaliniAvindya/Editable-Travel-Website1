import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { MapPin, X } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const imgbbAxios = axios.create();

const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold text-[#074a5b] mb-4" style={{ fontFamily: 'Comic Sans MS, cursive' }}>
          {title}
        </h3>
        <p className="text-gray-600 mb-6">{message}</p>
        <div className="flex justify-end gap-4">
          <button
            onClick={onClose}
            className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-xl font-semibold transition-all"
            style={{ fontFamily: 'Comic Sans MS, cursive' }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl font-semibold transition-all"
            style={{ fontFamily: 'Comic Sans MS, cursive' }}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

const AtollManagement = () => {
  const { user, api, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [atolls, setAtolls] = useState([]);
  const [resorts, setResorts] = useState([]);
  const [selectedAtoll, setSelectedAtoll] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    mainImage: '',
    media: [],
    amenities: '',
  });
  const [accommodationForm, setAccommodationForm] = useState({
    accommodationId: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [modal, setModal] = useState({ isOpen: false, type: '', id: null, name: '' });
  const [visibleItems, setVisibleItems] = useState({});

  // Check if user is authenticated and admin
  useEffect(() => {
    if (!user || !user.isAdmin) {
      setError('Please log in as an admin to access this page.');
      navigate('/login', { state: { message: 'Admin access required' } });
    }
  }, [user, navigate]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Auto-clear success 
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  // Fetch atolls and resorts
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const cacheBuster = new Date().getTime();
        const [atollsResponse, resortsResponse] = await Promise.all([
          api.get(`/api/atolls?_cb=${cacheBuster}`),
          api.get(`/api/resorts?_cb=${cacheBuster}`),
        ]);
        console.log('Fetched atolls:', atollsResponse.data.map(a => ({
          _id: a._id,
          name: a.name,
          accommodations: a.accommodations?.length || 0,
        })));
        console.log('Fetched resorts:', resortsResponse.data.map(r => ({
          _id: r._id,
          name: r.name,
          island: r.island,
        })));
        setAtolls(atollsResponse.data || []);
        setResorts(resortsResponse.data || []);
        if (!atollsResponse.data.length) setError('No atolls found');
        if (!resortsResponse.data.length) setError('No resorts found');
      } catch (err) {
        console.error('Fetch error:', err);
        setError(`Failed to load data: ${err.response?.data?.msg || err.message}`);
      } finally {
        setLoading(false);
      }
    };
    if (user?.isAdmin) {
      fetchData();
    }
  }, [user, api]);

  // Intersection Observer for animations
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
  }, [atolls]);

  const isValidId = (id) => {
    return typeof id === 'string' && id.match(/^[0-9a-fA-F]{24}$/);
  };

  const getSafeImageUrl = (url, fallback = 'https://via.placeholder.com/400') => url || fallback;

  const uploadImage = async (file, maxRetries = 2) => {
    const formDataImg = new FormData();
    formDataImg.append('image', file);
    setUploading(true);
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await imgbbAxios.post(
          'https://api.imgbb.com/1/upload?key=4e08e03047ee0d48610586ad270e2b39',
          formDataImg,
          { headers: { 'Content-Type': 'multipart/form-data' } }
        );
        setUploading(false);
        return response.data.data.url;
      } catch (err) {
        const errorMsg = err.response?.data?.error?.message || err.message;
        if (attempt === maxRetries) {
          console.error('Image upload failed:', errorMsg);
          setError(`Image upload failed: ${errorMsg}`);
          setUploading(false);
          return null;
        }
        await new Promise((resolve) => setTimeout(resolve, 2000 * (attempt + 1)));
      }
    }
    setUploading(false);
    return null;
  };

  const handleImageUpload = async (e, isMain = false) => {
    const files = Array.from(e.target.files).filter(
      (file) => file.type.startsWith('image/') && file.size <= 32 * 1024 * 1024
    );
    if (files.length === 0) {
      setError('Please upload valid image files (max 32MB each).');
      return;
    }
    const uploadPromises = files.map((file) => uploadImage(file));
    const urls = (await Promise.all(uploadPromises)).filter((url) => url);
    if (isMain) {
      setFormData((prev) => ({ ...prev, mainImage: urls[0] || prev.mainImage }));
    } else {
      setFormData((prev) => ({ ...prev, media: [...prev.media, ...urls] }));
    }
  };

  const handleRemoveMainImage = () => {
    setFormData((prev) => ({ ...prev, mainImage: '' }));
  };

  const handleRemoveMediaImage = (index) => {
    setFormData((prev) => ({
      ...prev,
      media: prev.media.filter((_, i) => i !== index),
    }));
  };

  const handleAtollSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!formData.name) {
        setError('Atoll name is required');
        return;
      }
      if (selectedAtoll && !isValidId(selectedAtoll._id)) {
        console.error('Invalid atoll ID:', selectedAtoll._id);
        setError('Invalid atoll ID');
        return;
      }
      const data = {
        name: formData.name.trim(),
        description: formData.description?.trim() || '',
        mainImage: formData.mainImage || '',
        media: formData.media || [],
        amenities: formData.amenities
          ? formData.amenities.split(',').map((item) => item.trim()).filter((item) => item)
          : [],
      };
      let response;
      if (selectedAtoll) {
        response = await api.put(`/api/atolls/${selectedAtoll._id}`, data);
        setAtolls(atolls.map((a) => (a._id === selectedAtoll._id ? response.data : a)));
        setSelectedAtoll({ ...response.data, accommodations: selectedAtoll.accommodations }); // Preserve accommodations
        setSuccess('Atoll updated successfully');
      } else {
        response = await api.post('/api/atolls', data);
        setAtolls([...atolls, response.data]);
        setSuccess('Atoll created successfully');
      }
      resetForm();
    } catch (err) {
      console.error('Atoll submit error:', err);
      setError(`Failed to save atoll: ${err.response?.data?.data?.msg || err.message}`);
    }
  };

  const handleAccommodationSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAtoll) {
      setError('Please select an atoll first');
      return;
    }
    try {
      const { accommodationId } = accommodationForm;
      if (!isValidId(selectedAtoll._id) || !isValidId(accommodationId)) {
        console.error('Invalid IDs:', { atollId: selectedAtoll._id, accommodationId });
        setError('Invalid atoll or resort ID');
        return;
      }
      const resortResponse = await api.get(`/api/resorts/${accommodationId}`);
      if (!resortResponse.data) {
        setError('Selected resort does not exist');
        return;
      }
      await api.post(`/api/atolls/${selectedAtoll._id}/accommodations`, {
        accommodationId,
      });
      // Fetch updated accommodations
      const updatedAtollResponse = await api.get(`/api/resorts/byAtoll/${selectedAtoll._id}`);
      const updatedAccommodations = updatedAtollResponse.data || [];
      console.log('Updated accommodations after adding:', updatedAccommodations.map(acc => ({
        _id: acc._id,
        name: acc.name,
        island: acc.island,
      })));
      const updatedAtoll = { ...selectedAtoll, accommodations: updatedAccommodations };
      setSelectedAtoll(updatedAtoll);
      setAtolls(atolls.map((a) => (a._id === selectedAtoll._id ? updatedAtoll : a)));
      setSuccess('Accommodation added successfully');
      resetAccommodationForm();
    } catch (err) {
      console.error('Accommodation submit error:', err);
      setError(`Failed to add accommodation: ${err.response?.data?.data?.msg || err.message}`);
    }
  };

  const handleDeleteAtoll = (id, name) => {
    if (!isValidId(id)) {
      console.error('Invalid atoll ID:', id);
      setError('Invalid atoll ID');
      return;
    }
    setModal({
      isOpen: true,
      type: 'atoll',
      id,
      name,
    });
  };

  const handleDeleteAccommodation = (accommodationId, accommodationName) => {
    if (!selectedAtoll?._id || !isValidId(accommodationId)) {
      console.error('Invalid IDs:', { atollId: selectedAtoll?._id, accommodationId });
      setError('Invalid atoll or accommodation ID');
      return;
    }
    setModal({
      isOpen: true,
      type: 'accommodation',
      id: accommodationId,
      name: accommodationName,
    });
  };

  const confirmDelete = async () => {
    try {
      if (modal.type === 'atoll') {
        if (!isValidId(modal.id)) {
          console.error('Invalid atoll ID:', modal.id);
          setError('Invalid atoll ID');
          return;
        }
        await api.delete(`/api/atolls/${modal.id}`);
        setAtolls(atolls.filter((a) => a._id !== modal.id));
        setSelectedAtoll(null);
        setSuccess('Atoll deleted successfully');
      } else if (modal.type === 'accommodation') {
        if (!isValidId(selectedAtoll._id) || !isValidId(modal.id)) {
          console.error('Invalid IDs:', { atollId: selectedAtoll._id, accommodationId: modal.id });
          setError('Invalid atoll or accommodation ID');
          return;
        }
        await api.delete(`/api/atolls/${selectedAtoll._id}/accommodations/${modal.id}`);
        const updatedAtollResponse = await api.get(`/api/resorts/byAtoll/${selectedAtoll._id}`);
        const updatedAccommodations = updatedAtollResponse.data || [];
        console.log('Updated accommodations after deletion:', updatedAccommodations.map(acc => ({
          _id: acc._id,
          name: acc.name,
          island: acc.island,
        })));
        const updatedAtoll = { ...selectedAtoll, accommodations: updatedAccommodations };
        setSelectedAtoll(updatedAtoll);
        setAtolls(atolls.map((a) => (a._id === selectedAtoll._id ? updatedAtoll : a)));
        setSuccess('Accommodation removed successfully');
      }
    } catch (err) {
      console.error(`Delete ${modal.type} error:`, err);
      setError(`Failed to delete ${modal.type}: ${err.response?.data?.data?.msg || err.message}`);
    } finally {
      setModal({ isOpen: false, type: '', id: null, name: '' });
    }
  };

  const closeModal = () => {
    setModal({ isOpen: false, type: '', id: null, name: '' });
  };

  const handleEditAtoll = async (atoll) => {
    if (!isValidId(atoll._id)) {
      console.error('Invalid atoll ID:', atoll._id);
      setError('Invalid atoll ID');
      return;
    }
    try {
      console.log('Fetching atoll and accommodations for edit:', atoll._id);
      const atollResponse = await api.get(`/api/atolls/${atoll._id}`);
      const fetchedAtoll = atollResponse.data;
      if (!fetchedAtoll) {
        throw new Error('Atoll not found');
      }
      // Fetch accommodations using the working endpoint
      const accommodationsResponse = await api.get(`/api/resorts/byAtoll/${atoll._id}`);
      const accommodations = accommodationsResponse.data || [];
      console.log('Fetched atoll data:', {
        _id: fetchedAtoll._id,
        name: fetchedAtoll.name,
        accommodations: accommodations.map(acc => ({
          _id: acc._id,
          name: acc.name,
          island: acc.island,
        })),
      });
      const updatedAtoll = {
        ...fetchedAtoll,
        accommodations: accommodations,
      };
      setSelectedAtoll(updatedAtoll);
      // Update atolls state to reflect accommodations
      setAtolls(atolls.map((a) => (a._id === atoll._id ? updatedAtoll : a)));
      setFormData({
        name: fetchedAtoll.name || '',
        description: fetchedAtoll.description || '',
        mainImage: fetchedAtoll.mainImage || '',
        media: fetchedAtoll.media || [],
        amenities: fetchedAtoll.amenities?.join(', ') || '',
      });
    } catch (err) {
      console.error('Error fetching atoll for edit:', err);
      setError(`Failed to load atoll data: ${err.response?.data?.data?.msg || err.message}`);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      mainImage: '',
      media: [],
      amenities: '',
    });
    setSelectedAtoll(null);
    setError('');
  };

  const resetAccommodationForm = () => {
    setAccommodationForm({
      accommodationId: '',
    });
    setError('');
  };

  if (loading || !user?.isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <p className="text-xl text-[#074a5b]" style={{ fontFamily: 'Comic Sans MS, cursive' }}>
          Loading atolls and resorts...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: 'Comic Sans MS, cursive' }}>
      <ConfirmationModal
        isOpen={modal.isOpen}
        onClose={closeModal}
        onConfirm={confirmDelete}
        title={`Delete ${modal.type === 'atoll' ? 'Atoll' : 'Accommodation'}`}
        message={`Are you sure you want to delete ${modal.name}? This action cannot be undone.`}
      />
      <div className="container mx-auto p-6">
        <h1 className="text-4xl font-bold mb-8 text-[#074a5b]" style={{ fontFamily: 'Comic Sans MS, cursive' }}>
          Atoll Management
        </h1>

        {error && (
          <div className="bg-red-100 text-red-700 p-4 mb-6 rounded-xl" style={{ fontFamily: 'Comic Sans MS, cursive' }}>
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-100 text-green-700 p-4 mb-6 rounded-xl" style={{ fontFamily: 'Comic Sans MS, cursive' }}>
            {success}
          </div>
        )}

        <div className="mb-12 p-6 bg-white rounded-2xl shadow-lg">
          <h2 className="text-2xl font-semibold mb-6 text-[#074a5b]" style={{ fontFamily: 'Comic Sans MS, cursive' }}>
            {selectedAtoll ? 'Edit Atoll' : 'Add New Atoll'}
          </h2>
          <form onSubmit={handleAtollSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block mb-2 text-[#074a5b] font-semibold" style={{ fontFamily: 'Comic Sans MS, cursive' }}>
                Atoll Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none h-12 w-full"
                required
                style={{ fontFamily: 'Comic Sans MS, cursive' }}
              />
            </div>
            <div>
              <label className="block mb-2 text-[#074a5b] font-semibold" style={{ fontFamily: 'Comic Sans MS, cursive' }}>
                Amenities (comma-separated)
              </label>
              <input
                type="text"
                value={formData.amenities}
                onChange={(e) => setFormData({ ...formData, amenities: e.target.value })}
                className="border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none h-12 w-full"
                style={{ fontFamily: 'Comic Sans MS, cursive' }}
              />
            </div>
            <div className="col-span-1">
              <label className="block mb-2 text-[#074a5b] font-semibold" style={{ fontFamily: 'Comic Sans MS, cursive' }}>
                Main Image
              </label>
              <div className="flex items-center">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, true)}
                  className="border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none h-12"
                  disabled={uploading}
                  style={{ fontFamily: 'Comic Sans MS, cursive' }}
                />
                {uploading && (
                  <span className="ml-2 text-gray-600" style={{ fontFamily: 'Comic Sans MS, cursive' }}>
                    Uploading...
                  </span>
                )}
              </div>
              {formData.mainImage && (
                <div className="mt-2 relative inline-block">
                  <img
                    src={getSafeImageUrl(formData.mainImage)}
                    alt="Main Image Preview"
                    className="w-32 h-32 object-cover rounded-xl"
                    onError={(e) => (e.target.src = 'https://via.placeholder.com/400')}
                  />
                  <button
                    onClick={handleRemoveMainImage}
                    className="absolute top-2 right-2 bg-gray-800 hover:bg-gray-600 text-white rounded-full p-2 transition-all duration-300"
                    aria-label="Remove main image"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}
            </div>
            <div className="col-span-1">
              <label className="block mb-2 text-[#074a5b] font-semibold" style={{ fontFamily: 'Comic Sans MS, cursive' }}>
                Additional Media
              </label>
              <div className="flex items-center">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e)}
                  className="border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none h-12"
                  disabled={uploading}
                  style={{ fontFamily: 'Comic Sans MS, cursive' }}
                />
                {uploading && (
                  <span className="ml-2 text-gray-600" style={{ fontFamily: 'Comic Sans MS, cursive' }}>
                    Uploading...
                  </span>
                )}
              </div>
              <div className="mt-2 flex flex-wrap gap-4">
                {formData.media?.map((img, index) => (
                  <div key={index} className="relative inline-block">
                    <img
                      src={getSafeImageUrl(img)}
                      alt={`Media Preview ${index}`}
                      className="w-24 h-24 object-cover rounded-lg"
                      onError={(e) => (e.target.src = 'https://via.placeholder.com/400')}
                    />
                    <button
                      onClick={() => handleRemoveMediaImage(index)}
                      className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 hover:bg-red-700 transition-all duration-300"
                      aria-label={`Remove media image ${index}`}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <div className="col-span-2">
              <label className="block mb-2 text-[#074a5b] font-semibold" style={{ fontFamily: 'Comic Sans MS, cursive' }}>
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none w-full h-24"
                style={{ fontFamily: 'Comic Sans MS, cursive' }}
              />
            </div>
            <div className="col-span-2 flex gap-4">
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300"
                disabled={uploading}
                style={{ fontFamily: 'Comic Sans MS, cursive' }}
              >
                {selectedAtoll ? 'Update Atoll' : 'Add Atoll'}
              </button>
              {selectedAtoll && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-6 py-3 rounded-xl font-semibold transition-all duration-300"
                  disabled={uploading}
                  style={{ fontFamily: 'Comic Sans MS, cursive' }}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        <div className="mb-12">
          <h2 className="text-2xl font-semibold mb-6 text-[#074a5b]" style={{ fontFamily: 'Comic Sans MS, cursive' }}>
            Atolls
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {atolls.map((atoll) => (
              <div
                key={atoll._id}
                data-animate
                data-id={atoll._id}
                className={`bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-500 transform ${
                  visibleItems[atoll._id] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}
              >
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={getSafeImageUrl(atoll.mainImage || atoll.media[0])}
                    alt={atoll.name}
                    className="w-full h-full object-cover"
                    onError={(e) => (e.target.src = 'https://via.placeholder.com/400')}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-2 text-[#074a5b] hover:text-blue-600 transition-colors" style={{ fontFamily: 'Comic Sans MS, cursive' }}>
                    {atoll.name}
                  </h3>
                  <p className="text-gray-600 mb-3 flex items-center" style={{ fontFamily: 'Comic Sans MS, cursive' }}>
                    <MapPin size={16} className="mr-2 text-[#074a5b]" />
                    {atoll.accommodations?.length || 0} Accommodations
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleEditAtoll(atoll)}
                      className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-xl font-semibold transition-all"
                      style={{ fontFamily: 'Comic Sans MS, cursive' }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteAtoll(atoll._id, atoll.name)}
                      className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl font-semibold transition-all"
                      style={{ fontFamily: 'Comic Sans MS, cursive' }}
                    >
                      Delete
                    </button>
                    <button
                      onClick={() => handleEditAtoll(atoll)}
                      className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-xl font-semibold transition-all"
                      style={{ fontFamily: 'Comic Sans MS, cursive' }}
                    >
                      Manage Accommodations
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {selectedAtoll && (
          <div className="p-6 bg-white rounded-2xl shadow-lg">
            <h2 className="text-2xl font-semibold mb-6 text-[#074a5b]" style={{ fontFamily: 'Comic Sans MS, cursive' }}>
              Manage Accommodations for {selectedAtoll.name}
            </h2>
            <form onSubmit={handleAccommodationSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block mb-2 text-[#074a5b] font-semibold" style={{ fontFamily: 'Comic Sans MS, cursive' }}>
                  Resort
                </label>
                <select
                  value={accommodationForm.accommodationId}
                  onChange={(e) => setAccommodationForm({ ...accommodationForm, accommodationId: e.target.value })}
                  className="border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none h-12 w-full"
                  required
                  style={{ fontFamily: 'Comic Sans MS, cursive' }}
                >
                  <option value="">Select Resort</option>
                  {resorts
                    .filter((resort) => 
                      String(resort.atoll?._id || resort.atoll) === String(selectedAtoll._id) &&
                      !selectedAtoll.accommodations?.some((acc) => String(acc._id) === String(resort._id))
                    )
                    .map((resort) => (
                      <option key={resort._id} value={resort._id}>
                        {resort.name} ({resort.island})
                      </option>
                    ))}
                </select>
              </div>
              <div className="col-span-2 flex gap-4">
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300"
                  style={{ fontFamily: 'Comic Sans MS, cursive' }}
                >
                  Add Accommodation
                </button>
              </div>
            </form>

            <h3 className="text-xl font-semibold mb-6 text-[#074a5b]" style={{ fontFamily: 'Comic Sans MS, cursive' }}>
              Accommodations
            </h3>
            {selectedAtoll.accommodations?.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {selectedAtoll.accommodations.map((accommodation) => (
                  <div
                    key={accommodation._id}
                    data-animate
                    data-id={accommodation._id}
                    className={`bg-gray-50 rounded-2xl p-6 hover:shadow-lg transition-shadow duration-300 ${
                      visibleItems[accommodation._id] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                    }`}
                  >
                    <h4 className="text-lg font-bold mb-2 text-[#074a5b]" style={{ fontFamily: 'Comic Sans MS, cursive' }}>
                      {accommodation.name || 'Unnamed Resort'}
                    </h4>
                    <p className="text-gray-600" style={{ fontFamily: 'Comic Sans MS, cursive' }}>
                      Island: {accommodation.island || 'N/A'}
                    </p>
                    <div className="flex gap-3 mt-4">
                      <button
                        onClick={() => handleDeleteAccommodation(accommodation._id, accommodation.name)}
                        className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl font-semibold transition-all"
                        style={{ fontFamily: 'Comic Sans MS, cursive' }}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600 text-sm" style={{ fontFamily: 'Comic Sans MS, cursive' }}>
                No accommodations available for this atoll.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AtollManagement;