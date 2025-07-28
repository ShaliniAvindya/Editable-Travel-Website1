import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { MapPin, X } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

const imgbbAxios = axios.create();

// Confirmation Modal Component
const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold text-[#074a5b] mb-4" style={{ fontFamily: 'Comic Sans MS, cursive' }}>{title}</h3>
        <p className="text-gray-600 mb-6" style={{ fontFamily: 'Comic Sans MS, cursive' }}>{message}</p>
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

const ResortManagement = () => {
  const { user, api, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [resorts, setResorts] = useState([]);
  const [atolls, setAtolls] = useState([]);
  const [selectedResort, setSelectedResort] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    island: '',
    atoll: '',
    description: '',
    amenities: '',
    images: [],
    cover_image: '',
    type: 'resort',
  });
  const [roomForm, setRoomForm] = useState({
    type: '',
    price_per_night: '',
    capacity: { adults: '', children: '' },
    amenities: '',
    images: [],
    description: '',
    size_sqm: '',
  });
  const [editingRoomId, setEditingRoomId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);
  const [visibleItems, setVisibleItems] = useState({});
  const [uploading, setUploading] = useState(false);
  const [modal, setModal] = useState({ isOpen: false, type: '', id: null, name: '' });

  // Check if user is authenticated and admin
  useEffect(() => {
    if (!user || !user.isAdmin) {
      setError('Please log in as an admin to access this page.');
      navigate('/login', { state: { message: 'Admin access required' } });
    }
  }, [user, navigate]);

  // Auto-clear error after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Auto-clear success after 3 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  // Fetch resorts and atolls
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [resortsResponse, atollsResponse] = await Promise.all([
          api.get('https://editable-travel-website1-rpfv.vercel.app/api/resorts'),
          api.get('https://editable-travel-website1-rpfv.vercel.app/api/atolls'),
        ]);
        console.log('Fetched resorts:', resortsResponse.data);
        console.log('Fetched atolls:', atollsResponse.data);
        setResorts(resortsResponse.data);
        setAtolls(atollsResponse.data);
      } catch (err) {
        console.error('Fetch error:', err);
        if (err.response?.status === 401 || err.response?.status === 403) {
          setError('Unauthorized: Please log in as an admin.');
          logout();
          navigate('/login', { state: { message: 'Admin access required' } });
        } else {
          setError(`Failed to load data: ${err.response?.data?.message || err.message}`);
        }
      } finally {
        setLoading(false);
      }
    };
    if (user?.isAdmin) {
      fetchData();
    }
  }, [user, api, logout, navigate]);

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
  }, [resorts, selectedResort]);

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

  const handleImageUpload = async (e, isCover = false) => {
    const files = Array.from(e.target.files).filter(
      (file) => file.type.startsWith('image/') && file.size <= 32 * 1024 * 1024
    );
    if (files.length === 0) {
      setError('Please upload valid image files (max 32MB each).');
      return;
    }
    const uploadPromises = files.map((file) => uploadImage(file));
    const urls = (await Promise.all(uploadPromises)).filter((url) => url);
    if (isCover) {
      setFormData((prev) => ({ ...prev, cover_image: urls[0] || prev.cover_image }));
    } else {
      setFormData((prev) => ({ ...prev, images: [...prev.images, ...urls] }));
    }
  };

  const handleRoomImageUpload = async (e) => {
    const files = Array.from(e.target.files).filter(
      (file) => file.type.startsWith('image/') && file.size <= 32 * 1024 * 1024
    );
    if (files.length === 0) {
      setError('Please upload valid image files (max 32MB each).');
      return;
    }
    const uploadPromises = files.map((file) => uploadImage(file));
    const urls = (await Promise.all(uploadPromises)).filter((url) => url);
    setRoomForm((prev) => ({ ...prev, images: [...prev.images, ...urls] }));
  };

  const handleRemoveCoverImage = () => {
    setFormData((prev) => ({ ...prev, cover_image: '' }));
  };

  const handleRemoveImage = (index) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const handleRemoveRoomImage = (index) => {
    setRoomForm((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const handleResortSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!formData.name || !formData.island || !formData.atoll || !formData.type) {
        setError('Please fill in all required fields');
        return;
      }
      if (selectedResort && !isValidId(selectedResort._id)) {
        console.error('Invalid resort ID:', selectedResort._id);
        setError('Invalid resort ID');
        return;
      }
      const data = {
        name: formData.name.trim(),
        island: formData.island.trim(),
        atoll: formData.atoll,
        description: formData.description?.trim() || '',
        amenities: formData.amenities
          ? formData.amenities.split(',').map((item) => item.trim()).filter((item) => item)
          : [],
        images: formData.images || [],
        cover_image: formData.cover_image || '',
        type: formData.type,
      };
      let response;
      if (selectedResort) {
        response = await api.put(`https://editable-travel-website1-rpfv.vercel.app/api/resorts/${selectedResort._id}`, data);
        setResorts(resorts.map((r) => (r._id === selectedResort._id ? response.data : r)));
        setSelectedResort(response.data);
        setSuccess('Resort updated successfully');
      } else {
        response = await api.post('https://editable-travel-website1-rpfv.vercel.app/api/resorts', data);
        setResorts([...resorts, response.data]);
        setSuccess('Resort added successfully');
      }
      resetForm();
    } catch (err) {
      console.error('Resort submit error:', err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        setError('Unauthorized: Please log in as an admin.');
        logout();
        navigate('/login', { state: { message: 'Admin access required' } });
      } else {
        setError(`Failed to save resort: ${err.response?.data?.message || err.message}`);
      }
    }
  };

  const handleRoomSubmit = async (e) => {
    e.preventDefault();
    if (!selectedResort) {
      setError('Please select a resort first');
      return;
    }
    try {
      const size_sqm = Number(roomForm.size_sqm);
      if (isNaN(size_sqm) || size_sqm <= 0) {
        setError('Please enter a valid size (sqm)');
        return;
      }
      if (!isValidId(selectedResort._id) || (editingRoomId && !isValidId(editingRoomId))) {
        console.error('Invalid IDs:', { resortId: selectedResort._id, roomId: editingRoomId });
        setError('Invalid resort or room ID');
        return;
      }
      const data = {
        type: roomForm.type.trim(),
        price_per_night: Number(roomForm.price_per_night),
        capacity: {
          adults: Number(roomForm.capacity.adults),
          children: Number(roomForm.capacity.children),
        },
        amenities: roomForm.amenities
          ? roomForm.amenities.split(',').map((item) => item.trim()).filter((item) => item)
          : [],
        images: roomForm.images,
        description: roomForm.description || '',
        size_sqm,
      };
      let response;
      if (editingRoomId) {
        response = await api.put(`https://editable-travel-website1-rpfv.vercel.app/api/resorts/${selectedResort._id}/rooms/${editingRoomId}`, data);
      } else {
        response = await api.post(`https://editable-travel-website1-rpfv.vercel.app/api/resorts/${selectedResort._id}/rooms`, data);
      }
      const resortResponse = await api.get(`https://editable-travel-website1-rpfv.vercel.app/api/resorts/${selectedResort._id}`);
      setSelectedResort(resortResponse.data);
      setResorts(resorts.map((r) => (r._id === selectedResort._id ? resortResponse.data : r)));
      setSuccess(editingRoomId ? 'Room updated successfully' : 'Room added successfully');
      resetRoomForm();
    } catch (err) {
      console.error('Room submit error:', err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        setError('Unauthorized: Please log in as an admin.');
        logout();
        navigate('/login', { state: { message: 'Admin access required' } });
      } else {
        setError(`Failed to save room: ${err.response?.data?.message || err.message}`);
      }
    }
  };

  const handleDeleteResort = (id, name) => {
    if (!isValidId(id)) {
      console.error('Invalid resort ID:', id);
      setError('Invalid resort ID');
      return;
    }
    setModal({
      isOpen: true,
      type: 'resort',
      id,
      name,
    });
  };

  const handleDeleteRoom = (roomId, roomType) => {
    if (!selectedResort?._id || !isValidId(roomId)) {
      console.error('Invalid IDs:', { resortId: selectedResort?._id, roomId });
      setError('Invalid resort or room ID');
      return;
    }
    setModal({
      isOpen: true,
      type: 'room',
      id: roomId,
      name: roomType,
    });
  };

  const confirmDelete = async () => {
    try {
      if (modal.type === 'resort') {
        if (!isValidId(modal.id)) {
          console.error('Invalid resort ID:', modal.id);
          setError('Invalid resort ID');
          return;
        }
        await api.delete(`https://editable-travel-website1-rpfv.vercel.app/api/resorts/${modal.id}`);
        setResorts(resorts.filter((r) => r._id !== modal.id));
        setSelectedResort(null);
        setSuccess('Resort deleted successfully');
        resetForm();
      } else if (modal.type === 'room') {
        if (!isValidId(selectedResort._id) || !isValidId(modal.id)) {
          console.error('Invalid IDs:', { resortId: selectedResort._id, roomId: modal.id });
          setError('Invalid resort or room ID');
          return;
        }
        await api.delete(`https://editable-travel-website1-rpfv.vercel.app/api/resorts/${selectedResort._id}/rooms/${modal.id}`);
        const updatedResort = await api.get(`/api/resorts/${selectedResort._id}`);
        setSelectedResort(updatedResort.data);
        setResorts(resorts.map((r) => (r._id === selectedResort._id ? updatedResort.data : r)));
        setSuccess('Room deleted successfully');
        resetRoomForm();
      }
    } catch (err) {
      console.error(`Delete ${modal.type} error:`, err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        setError('Unauthorized: Please log in as an admin.');
        logout();
        navigate('/login', { state: { message: 'Admin access required' } });
      } else {
        setError(`Failed to delete ${modal.type}: ${err.response?.data?.message || err.message}`);
      }
    } finally {
      setModal({ isOpen: false, type: '', id: null, name: '' });
    }
  };

  const closeModal = () => {
    setModal({ isOpen: false, type: '', id: null, name: '' });
  };

  const handleEditRoom = (room) => {
    if (!isValidId(room._id)) {
      console.error('Invalid room ID:', room._id);
      setError('Invalid room ID');
      return;
    }
    console.log('Editing room:', room);
    setEditingRoomId(room._id);
    setRoomForm({
      type: room.type,
      price_per_night: room.price_per_night,
      capacity: { adults: room.capacity.adults, children: room.capacity.children },
      amenities: room.amenities.join(', '),
      images: room.images || [],
      description: room.description || '',
      size_sqm: room.size_sqm || '',
    });
  };

  const handleEditResort = (resort) => {
    if (!isValidId(resort._id)) {
      console.error('Invalid resort ID:', resort._id);
      setError('Invalid resort ID');
      return;
    }
    console.log('Editing resort:', resort);
    setSelectedResort(resort);
    setFormData({
      name: resort.name,
      island: resort.island,
      atoll: resort.atoll._id,
      description: resort.description || '',
      amenities: resort.amenities.join(', '),
      images: resort.images || [],
      cover_image: resort.cover_image || '',
      type: resort.type,
    });
  };

  const resetForm = () => {
    setFormData({
      name: '',
      island: '',
      atoll: '',
      description: '',
      amenities: '',
      images: [],
      cover_image: '',
      type: 'resort',
    });
    setSelectedResort(null);
    setError('');
    const formInputs = document.querySelectorAll('input[type="text"], input[type="number"], textarea, select');
    formInputs.forEach((input) => {
      input.value = '';
    });
  };

  const resetRoomForm = () => {
    setRoomForm({
      type: '',
      price_per_night: '',
      capacity: { adults: '', children: '' },
      amenities: '',
      images: [],
      description: '',
      size_sqm: '',
    });
    setEditingRoomId(null);
    setError('');
    const roomFormInputs = document.querySelectorAll(
      'form[onsubmit="handleRoomSubmit"] input[type="text"], form[onsubmit="handleRoomSubmit"] input[type="number"], form[onsubmit="handleRoomSubmit"] textarea'
    );
    roomFormInputs.forEach((input) => {
      input.value = '';
    });
  };

  if (loading || !user?.isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <p className="text-xl text-[#074a5b]" style={{ fontFamily: 'Comic Sans MS, cursive' }}>
          Loading resorts...
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
        title={`Delete ${modal.type === 'resort' ? 'Resort' : 'Room'}`}
        message={`Are you sure you want to delete ${modal.name}? This action cannot be undone.`}
      />
      <div className="container mx-auto p-6">
        <h1 className="text-4xl font-bold mb-8 text-[#074a5b]" style={{ fontFamily: 'Comic Sans MS, cursive' }}>
          Resort Management
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
          <h2
            className="text-2xl font-semibold mb-6 text-[#074a5b]"
            style={{ fontFamily: 'Comic Sans MS, cursive' }}
          >
            {selectedResort ? 'Edit Resort' : 'Add New Resort'}
          </h2>
          <form onSubmit={handleResortSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block mb-2 text-[#074a5b] font-semibold" style={{ fontFamily: 'Comic Sans MS, cursive' }}>
                Resort Name
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
                Island
              </label>
              <input
                type="text"
                value={formData.island}
                onChange={(e) => setFormData({ ...formData, island: e.target.value })}
                className="border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none h-12 w-full"
                required
                style={{ fontFamily: 'Comic Sans MS, cursive' }}
              />
            </div>
            <div>
              <label className="block mb-2 text-[#074a5b] font-semibold" style={{ fontFamily: 'Comic Sans MS, cursive' }}>
                Atoll
              </label>
              <select
                value={formData.atoll}
                onChange={(e) => setFormData({ ...formData, atoll: e.target.value })}
                className="border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none h-12 w-full"
                required
                style={{ fontFamily: 'Comic Sans MS, cursive' }}
              >
                <option value="">Select Atoll</option>
                {atolls.map((atoll) => (
                  <option key={atoll._id} value={atoll._id}>
                    {atoll.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block mb-2 text-[#074a5b] font-semibold" style={{ fontFamily: 'Comic Sans MS, cursive' }}>
                Type
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none h-12 w-full"
                required
                style={{ fontFamily: 'Comic Sans MS, cursive' }}
              >
                <option value="resort">Resort</option>
                <option value="hotel">Hotel</option>
                <option value="adventure">Adventure</option>
              </select>
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
                Cover Image
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
              {formData.cover_image && (
                <div className="mt-2 relative inline-block">
                  <img
                    src={getSafeImageUrl(formData.cover_image)}
                    alt="Cover Image Preview"
                    className="w-32 h-32 object-cover rounded-xl"
                    onError={() => console.error(`Failed to load cover image: ${formData.cover_image}`)}
                  />
                  <button
                    onClick={handleRemoveCoverImage}
                    className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 transition-all"
                    aria-label="Remove cover image"
                    style={{ fontFamily: 'Comic Sans MS, cursive' }}
                  >
                    <X size={16} />
                  </button>
                </div>
              )}
            </div>
            <div className="col-span-1">
              <label className="block mb-2 text-[#074a5b] font-semibold" style={{ fontFamily: 'Comic Sans MS, cursive' }}>
                Images
              </label>
              <div className="flex items-center">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
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
              <div className="mt-2 flex flex-wrap gap-2">
                {formData.images.map((img, index) => (
                  <div key={index} className="relative inline-block">
                    <img
                      src={getSafeImageUrl(img)}
                      alt={`Image Preview ${index}`}
                      className="w-32 h-32 object-cover rounded-xl"
                      onError={() => console.error(`Failed to load image: ${img}`)}
                    />
                    <button
                      onClick={() => handleRemoveImage(index)}
                      className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 transition-all"
                      aria-label={`Remove image ${index + 1}`}
                      style={{ fontFamily: 'Comic Sans MS, cursive' }}
                    >
                      <X size={16} />
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
                {selectedResort ? 'Update Resort' : 'Add Resort'}
              </button>
              {selectedResort && (
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
          <h2
            className="text-2xl font-semibold mb-6 text-[#074a5b]"
            style={{ fontFamily: 'Comic Sans MS, cursive' }}
          >
            Resorts
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {resorts.map((resort) => (
              <div
                key={resort._id}
                data-animate
                data-id={resort._id}
                className={`bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-500 transform ${
                  visibleItems[resort._id] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}
              >
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={getSafeImageUrl(resort.cover_image || resort.images[0])}
                    alt={resort.name}
                    className="w-full h-full object-cover"
                    onError={() =>
                      console.error(`Failed to load image for resort ${resort.name}: ${resort.cover_image || resort.images[0]}`)
                    }
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                  <div
                    className="absolute top-4 left-4 bg-blue-600/90 px-3 py-1 rounded-full text-white text-sm font-semibold"
                    style={{ fontFamily: 'Comic Sans MS, cursive' }}
                  >
                    {resort.type.charAt(0).toUpperCase() + resort.type.slice(1)}
                  </div>
                </div>
                <div className="p-6">
                  <h3
                    className="text-xl font-bold mb-2 text-[#074a5b] hover:text-blue-600 transition-colors"
                    style={{ fontFamily: 'Comic Sans MS, cursive' }}
                  >
                    {resort.name}
                  </h3>
                  <p
                    className="text-gray-600 mb-3 flex items-center"
                    style={{ fontFamily: 'Comic Sans MS, cursive' }}
                  >
                    <MapPin size={16} className="mr-2 text-[#074a5b]" />
                    {resort.island}, {resort.atoll?.name}
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleEditResort(resort)}
                      className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-xl font-semibold transition-all"
                      style={{ fontFamily: 'Comic Sans MS, cursive' }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteResort(resort._id, resort.name)}
                      className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl font-semibold transition-all"
                      style={{ fontFamily: 'Comic Sans MS, cursive' }}
                    >
                      Delete
                    </button>
                    <button
                      onClick={() => setSelectedResort(resort)}
                      className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-xl font-semibold transition-all"
                      style={{ fontFamily: 'Comic Sans MS, cursive' }}
                    >
                      Manage Rooms
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {selectedResort && (
          <div className="p-6 bg-white rounded-2xl shadow-lg">
            <h2
              className="text-2xl font-semibold mb-6 text-[#074a5b]"
              style={{ fontFamily: 'Comic Sans MS, cursive' }}
            >
              Manage Rooms for {selectedResort.name}
            </h2>
            <form onSubmit={handleRoomSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block mb-2 text-[#074a5b] font-semibold" style={{ fontFamily: 'Comic Sans MS, cursive' }}>
                  Room Type
                </label>
                <input
                  type="text"
                  value={roomForm.type}
                  onChange={(e) => setRoomForm({ ...roomForm, type: e.target.value })}
                  className="border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none h-12 w-full"
                  required
                  style={{ fontFamily: 'Comic Sans MS, cursive' }}
                />
              </div>
              <div>
                <label className="block mb-2 text-[#074a5b] font-semibold" style={{ fontFamily: 'Comic Sans MS, cursive' }}>
                  Price per Night
                </label>
                <input
                  type="number"
                  value={roomForm.price_per_night}
                  onChange={(e) => setRoomForm({ ...roomForm, price_per_night: e.target.value })}
                  className="border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none h-12 w-full"
                  required
                  style={{ fontFamily: 'Comic Sans MS, cursive' }}
                />
              </div>
              <div>
                <label className="block mb-2 text-[#074a5b] font-semibold" style={{ fontFamily: 'Comic Sans MS, cursive' }}>
                  Adults Capacity
                </label>
                <input
                  type="number"
                  value={roomForm.capacity.adults}
                  onChange={(e) =>
                    setRoomForm({ ...roomForm, capacity: { ...roomForm.capacity, adults: e.target.value } })
                  }
                  className="border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none h-12 w-full"
                  required
                  style={{ fontFamily: 'Comic Sans MS, cursive' }}
                />
              </div>
              <div>
                <label className="block mb-2 text-[#074a5b] font-semibold" style={{ fontFamily: 'Comic Sans MS, cursive' }}>
                  Children Capacity
                </label>
                <input
                  type="number"
                  value={roomForm.capacity.children}
                  onChange={(e) =>
                    setRoomForm({ ...roomForm, capacity: { ...roomForm.capacity, children: e.target.value } })
                  }
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
                  value={roomForm.amenities}
                  onChange={(e) => setRoomForm({ ...roomForm, amenities: e.target.value })}
                  className="border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none h-12 w-full"
                  style={{ fontFamily: 'Comic Sans MS, cursive' }}
                />
              </div>
              <div>
                <label className="block mb-2 text-[#074a5b] font-semibold" style={{ fontFamily: 'Comic Sans MS, cursive' }}>
                  Size (sqm)
                </label>
                <input
                  type="number"
                  value={roomForm.size_sqm}
                  onChange={(e) => setRoomForm({ ...roomForm, size_sqm: e.target.value })}
                  className="border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none h-12 w-full"
                  required
                  style={{ fontFamily: 'Comic Sans MS, cursive' }}
                />
              </div>
              <div className="col-span-1">
                <label className="block mb-2 text-[#074a5b] font-semibold" style={{ fontFamily: 'Comic Sans MS, cursive' }}>
                  Room Images
                </label>
                <div className="flex items-center">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleRoomImageUpload}
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
                <div className="mt-2 flex flex-wrap gap-2">
                  {roomForm.images.map((img, index) => (
                    <div key={index} className="relative inline-block">
                      <img
                        src={getSafeImageUrl(img)}
                        alt={`Room Image Preview ${index}`}
                        className="w-32 h-32 object-cover rounded-xl"
                        onError={() => console.error(`Failed to load room image: ${img}`)}
                      />
                      <button
                        onClick={() => handleRemoveRoomImage(index)}
                        className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 transition-all"
                        aria-label={`Remove room image ${index + 1}`}
                        style={{ fontFamily: 'Comic Sans MS, cursive' }}
                      >
                        <X size={16} />
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
                  value={roomForm.description}
                  onChange={(e) => setRoomForm({ ...roomForm, description: e.target.value })}
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
                  {editingRoomId ? 'Update Room' : 'Add Room'}
                </button>
                {editingRoomId && (
                  <button
                    type="button"
                    onClick={resetRoomForm}
                    className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-6 py-3 rounded-xl font-semibold transition-all duration-300"
                    disabled={uploading}
                    style={{ fontFamily: 'Comic Sans MS, cursive' }}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>

            <h3
              className="text-xl font-semibold mb-6 text-[#074a5b]"
              style={{ fontFamily: 'Comic Sans MS, cursive' }}
            >
              Rooms
            </h3>
            {selectedResort.rooms?.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {selectedResort.rooms.map((room) => (
                  <div
                    key={room._id}
                    data-animate
                    data-id={room._id}
                    className={`bg-gray-50 rounded-2xl p-6 hover:shadow-lg transition-all duration-300 ${
                      visibleItems[room._id] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                    }`}
                  >
                    <h4
                      className="text-lg font-semibold mb-2 text-[#074a5b]"
                      style={{ fontFamily: 'Comic Sans MS, cursive' }}
                    >
                      {room.type}
                    </h4>
                    <p
                      className="text-gray-600"
                      style={{ fontFamily: 'Comic Sans MS, cursive' }}
                    >
                      Price: ${room.price_per_night}/night
                    </p>
                    <p
                      className="text-gray-600"
                      style={{ fontFamily: 'Comic Sans MS, cursive' }}
                    >
                      Capacity: {room.capacity.adults} adults, {room.capacity.children} children
                    </p>
                    <p
                      className="text-gray-600"
                      style={{ fontFamily: 'Comic Sans MS, cursive' }}
                    >
                      Size: {room.size_sqm || 'N/A'} sqm
                    </p>
                    <div className="flex gap-3 mt-4">
                      <button
                        onClick={() => handleEditRoom(room)}
                        className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-xl font-semibold transition-all duration-300"
                        disabled={!room._id}
                        style={{ fontFamily: 'Comic Sans MS, cursive' }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteRoom(room._id, room.type)}
                        className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl font-semibold transition-all duration-300"
                        disabled={!room._id}
                        style={{ fontFamily: 'Comic Sans MS, cursive' }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p
                className="text-gray-600 text-sm"
                style={{ fontFamily: 'Comic Sans MS, cursive' }}
              >
                No rooms available for this resort.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Custom Styles */}
      <style jsx>{`
        /* Mobile-responsive styles */
        @media (max-width: 600px) {
          .container {
            padding: 1rem !important;
          }

          h1.text-4xl {
            font-size: 1.8rem !important;
            margin-bottom: 1rem !important;
          }

          h2.text-2xl, h3.text-xl {
            font-size: 1.2rem !important;
            margin-bottom: 0.75rem !important;
          }

          .p-6 {
            padding: 1rem !important;
          }

          .mb-12, .mb-6 {
            margin-bottom: 1.5rem !important;
          }

          /* Forms */
          .grid.grid-cols-1.md\\:grid-cols-2 {
            grid-template-columns: 1fr !important;
            gap: 0.5rem !important;
          }

          input, select, textarea {
            font-size: 0.9rem !important;
            padding: 0.5rem !important;
            height: auto !important;
          }

          textarea.h-24 {
            height: 5rem !important;
          }

          button.bg-blue-600, button.bg-gray-300, button.bg-yellow-500, button.bg-red-500, button.bg-green-500 {
            padding: 0.5rem 1rem !important;
            font-size: 0.9rem !important;
          }

          /* Image Previews */
          .w-32.h-32 {
            width: 4rem !important;
            height: 4rem !important;
          }

          .flex.gap-3 {
            flex-wrap: wrap !important;
            gap: 0.5rem !important;
          }

          /* Resort Cards */
          .grid.grid-cols-1.md\\:grid-cols-2.lg\\:grid-cols-3 {
            grid-template-columns: 1fr !important;
          }

          .relative.h-48 {
            height: 8rem !important;
          }

          .text-xl {
            font-size: 1rem !important;
          }

          .text-gray-600 {
            font-size: 0.8rem !important;
          }

          /* Confirmation Modal */
          .fixed.inset-0 .max-w-md {
            width: 90vw !important;
            padding: 1rem !important;
          }

          .fixed.inset-0 h3.text-lg {
            font-size: 1rem !important;
          }

          .fixed.inset-0 p.text-gray-600 {
            font-size: 0.8rem !important;
          }

          .fixed.inset-0 button {
            padding: 0.5rem 1rem !important;
            font-size: 0.8rem !important;
          }

          /* Error/Success Messages */
          .bg-red-100, .bg-green-100 {
            padding: 0.5rem !important;
            font-size: 0.8rem !important;
          }
        }

        @media (max-width: 400px) {
          h1.text-4xl {
            font-size: 1.5rem !important;
          }

          h2.text-2xl, h3.text-xl {
            font-size: 1rem !important;
          }

          input, select, textarea {
            font-size: 0.8rem !important;
          }

          button.bg-blue-600, button.bg-gray-300, button.bg-yellow-500, button.bg-red-500, button.bg-green-500 {
            padding: 0.4rem 0.8rem !important;
            font-size: 0.8rem !important;
          }

          .w-32.h-32 {
            width: 3.5rem !important;
            height: 3.5rem !important;
          }

          .fixed.inset-0 .max-w-md {
            width: 95vw !important;
          }
        }
      `}</style>
    </div>
  );
};

export default ResortManagement;
