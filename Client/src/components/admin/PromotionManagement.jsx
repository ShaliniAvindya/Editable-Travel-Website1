import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { X, Edit, Trash2, Save } from 'lucide-react';
import { FaRegClone, FaToggleOn, FaToggleOff } from 'react-icons/fa'; 
import { useNavigate } from 'react-router-dom';
import PromotionPopup from '../PromotionPopup';
import { AuthContext } from '../context/AuthContext';
import { API_BASE_URL } from '../apiConfig';

const imgbbAxios = axios.create();

const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold text-[#074a5b] mb-4" style={{ fontFamily: "'Comic Sans MS', 'Comic Neue'" }}>
          {title}
        </h3>
        <p className="text-gray-600 mb-6" style={{ fontFamily: "'Comic Sans MS', 'Comic Neue'" }}>{message}</p>
        <div className="flex justify-end gap-4">
          <button
            onClick={onClose}
            className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-xl font-semibold transition-all"
            style={{ fontFamily: "'Comic Sans MS', 'Comic Neue'" }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl font-semibold transition-all"
            style={{ fontFamily: "'Comic Sans MS', 'Comic Neue'" }}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

const handleNewsletterClick = () => {
  window.open('http://localhost:9000/', '_blank');
};

const PromotionManagement = ({ searchTerm }) => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [promotions, setPromotions] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    imageUrl: '',
    validFrom: '',
    validUntil: '',
    isPopup: false,
    buttonText: '',
    buttonLink: '',
    countdownLabel: '',
    trustIndicator1: '',
    trustIndicator2: '',
  });
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [notification, setNotification] = useState(''); 
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [modal, setModal] = useState({ isOpen: false, id: null, name: '' });
  const [visibleItems, setVisibleItems] = useState({});
  const [activePopupPromotion, setActivePopupPromotion] = useState(null);
  const [promoError, setPromoError] = useState('');

  // Check admin access
  useEffect(() => {
    if (!user || !user.isAdmin) {
      setError('Admin access required');
      setTimeout(() => navigate('/login'), 2000);
      return;
    }
    setLoading(false);
  }, [user, navigate]);

  // Auto-clear messages
  useEffect(() => {
    if (error) setTimeout(() => setError(''), 5000);
    if (success) setTimeout(() => setSuccess(''), 3000);
    if (notification) setTimeout(() => setNotification(''), 2500);
  }, [error, success, notification]);

  // Fetch promotions and determine active popup
  useEffect(() => {
    if (!user || !user.isAdmin) return;
    const fetchPromotions = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        console.log('Fetching promotions with token:', token);
        const res = await axios.get(`${API_BASE_URL}/promotions`, {
          headers: { 'x-auth-token': token },
        });
        setPromotions(res.data);

        // Find active popup promotion
        const currentDate = new Date();
        const activePopup = res.data.find(
          (p) =>
            p.isPopup &&
            new Date(p.validFrom) <= currentDate &&
            new Date(p.validUntil).setHours(23, 59, 59, 999) >= currentDate.getTime()
        );
        setActivePopupPromotion(activePopup || null);
      } catch (err) {
        console.error('Fetch promotions error:', err);
        setError(
          err.response
            ? `Failed to load promotions: ${err.response.data?.msg || err.message}`
            : 'Failed to load promotions: Network Error. Please ensure the backend server is running on http://localhost:8000 and allows the x-auth-token header in CORS.'
        );
      } finally {
        setLoading(false);
      }
    };
    fetchPromotions();
  }, [user]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisibleItems((prev) => ({ ...prev, [entry.target.getAttribute('data-id')]: true }));
          }
        });
      },
      { threshold: 0.1 }
    );
    document.querySelectorAll('[data-animate]').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [promotions]);

  const uploadImage = async (file) => {
    const formDataImg = new FormData();
    formDataImg.append('image', file);
    setUploading(true);
    try {
      const res = await imgbbAxios.post(
        'https://api.imgbb.com/1/upload?key=4e08e03047ee0d48610586ad270e2b39',
        formDataImg,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      return res.data.data.url;
    } catch (err) {
      setError(`Image upload failed: ${err.response?.data?.error?.message || err.message}`);
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !file.type.startsWith('image/') || file.size > 32 * 1024 * 1024) {
      setError('Please upload a valid image (max 32MB)');
      return;
    }
    const url = await uploadImage(file);
    if (url) setFormData({ ...formData, imageUrl: url });
  };

  const handleRemoveImage = () => {
    setFormData({ ...formData, imageUrl: '' });
  };

  const handleAddPromotion = (e) => {
    e.preventDefault();
    setFormData({
      title: '',
      description: '',
      imageUrl: '',
      validFrom: '',
      validUntil: '',
      isPopup: false,
      buttonText: '',
      buttonLink: '',
      countdownLabel: '',
      trustIndicator1: '',
      trustIndicator2: '',
    });
    setEditingId(null);
  };

  const handleEditPromotion = (e, promotion) => {
    e.preventDefault();
    setFormData({
      title: promotion.title,
      description: promotion.description,
      imageUrl: promotion.imageUrl,
      validFrom: new Date(promotion.validFrom).toISOString().slice(0, 10),
      validUntil: new Date(promotion.validUntil).toISOString().slice(0, 10),
      isPopup: promotion.isPopup,
      buttonText: promotion.buttonText,
      buttonLink: promotion.buttonLink,
      countdownLabel: promotion.countdownLabel,
      trustIndicator1: promotion.trustIndicator1,
      trustIndicator2: promotion.trustIndicator2,
    });
    setEditingId(promotion._id);
  };

  const handleDeletePromotion = (id, title) => {
    setModal({ isOpen: true, id, name: title });
  };

  const confirmDelete = async () => {
    try {
      const token = localStorage.getItem('token');
      console.log('Deleting promotion with token:', token);
      await axios.delete(`${API_BASE_URL}/promotions/${modal.id}`, {
        headers: { 'x-auth-token': token },
      });
      setPromotions(promotions.filter((p) => p._id !== modal.id));
      setSuccess('Promotion deleted successfully');
      setEditingId(null);
      if (activePopupPromotion && activePopupPromotion._id === modal.id) {
        setActivePopupPromotion(null);
      }
    } catch (err) {
      console.error('Delete promotion error:', err);
      setError(
        err.response
          ? `Failed to delete: ${err.response.data?.msg || err.message}`
          : 'Failed to delete: Network Error. Please ensure the backend server is running on http://localhost:8000 and allows the x-auth-token header in CORS.'
      );
    } finally {
      setModal({ isOpen: false, id: null, name: '' });
    }
  };

  // Duplicate a promotion
  const handleDuplicatePromotion = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(`${API_BASE_URL}/promotions/duplicate/${id}`, {}, {
        headers: { 'x-auth-token': token },
      });
      setPromotions([...promotions, res.data]);
      setNotification('Duplicate created successfully');
      setSuccess('Promotion duplicated successfully');
      setTimeout(() => setNotification(''), 2500);
    } catch (err) {
      console.error('Duplicate promotion error:', err);
      setError(
        err.response
          ? `Failed to duplicate: ${err.response.data?.msg || err.message}`
          : 'Failed to duplicate: Network Error.'
      );
    }
  };

  // Toggle promotion status
  const handleToggleStatus = async (id, currentStatus) => {
    try {
      if (!currentStatus) { 
        const alreadyActive = promotions.some(p => p.status === true && p._id !== id);
        if (alreadyActive) {
          setPromoError('Cannot activate two promotions at once.');
          setTimeout(() => setPromoError(''), 3000);
          return;
        }
      }
      const token = localStorage.getItem('token');
      await axios.patch(`${API_BASE_URL}/promotions/status/${id}`, { status: !currentStatus }, {
        headers: { 'x-auth-token': token },
      });
      setSuccess('Promotion status updated');
      const res = await axios.get(`${API_BASE_URL}/promotions`, {
        headers: { 'x-auth-token': token },
      });
      setPromotions(res.data);
    } catch (err) {
      console.error('Toggle status error:', err);
      setError(
        err.response
          ? `Failed to update status: ${err.response.data?.msg || err.message}`
          : 'Failed to update status: Network Error.'
      );
    }
  };

  const handleSavePromotion = async (e) => {
    e.preventDefault();
    try {
      const promotionData = {
        title: formData.title,
        description: formData.description,
        imageUrl: formData.imageUrl,
        validFrom: new Date(formData.validFrom).toISOString(),
        validUntil: new Date(formData.validUntil).setHours(23, 59, 59, 999),
        isPopup: formData.isPopup || false,
        buttonText: formData.buttonText,
        buttonLink: formData.buttonLink,
        countdownLabel: formData.countdownLabel,
        trustIndicator1: formData.trustIndicator1,
        trustIndicator2: formData.trustIndicator2,
      };
      const token = localStorage.getItem('token');
      console.log('Saving promotion with token:', token);
      const headers = { 'x-auth-token': token };
      let res;
      if (editingId) {
        res = await axios.put(`${API_BASE_URL}/promotions/${editingId}`, promotionData, { headers });
        setPromotions(promotions.map((p) => (p._id === editingId ? res.data : p)));
        setSuccess('Promotion updated');
      } else {
        res = await axios.post(`${API_BASE_URL}/promotions`, promotionData, { headers });
        setPromotions([...promotions, res.data]);
        setSuccess('Promotion added');
      }

      // Update active popup if necessary
      const currentDate = new Date();
      if (
        res.data.isPopup &&
        new Date(res.data.validFrom) <= currentDate &&
        new Date(res.data.validUntil).setHours(23, 59, 59, 999) >= currentDate.getTime()
      ) {
        setActivePopupPromotion(res.data);
      } else if (activePopupPromotion && activePopupPromotion._id === res.data._id) {
        setActivePopupPromotion(null);
      }

      setFormData({
        title: '',
        description: '',
        imageUrl: '',
        validFrom: '',
        validUntil: '',
        isPopup: false,
        buttonText: '',
        buttonLink: '',
        countdownLabel: '',
        trustIndicator1: '',
        trustIndicator2: '',
      });
      setEditingId(null);
    } catch (err) {
      console.error('Save promotion error:', err);
      setError(
        err.response
          ? `Failed to save: ${err.response.data?.msg || err.message}`
          : 'Failed to save: Network Error. Please ensure the backend server is running on http://localhost:8000 and allows the x-auth-token header in CORS.'
      );
    }
  };

  const handleClosePopup = () => {
    setActivePopupPromotion(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <p className="text-xl text-[#074a5b]" style={{ fontFamily: "'Comic Sans MS', 'Comic Neue'" }}>
          Loading...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "'Comic Sans MS', 'Comic Neue'" }}>
      {notification && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-6 py-3 rounded-xl shadow-lg z-50 transition-all duration-300">
          {notification}
        </div>
      )}
      {activePopupPromotion && (
        <PromotionPopup promotion={activePopupPromotion} onClose={handleClosePopup} />
      )}
      <ConfirmationModal
        isOpen={modal.isOpen}
        onClose={() => setModal({ isOpen: false, id: null, name: '' })}
        onConfirm={confirmDelete}
        title="Delete Promotion"
        message={`Are you sure you want to delete ${modal.name}? This cannot be undone.`}
      />
      {promoError && (
        <div className="fixed top-8 left-1/2 transform -translate-x-1/2 bg-red-100 border border-red-400 text-red-700 px-6 py-3 rounded-xl shadow-lg z-50 animate-bounce">
          {promoError}
        </div>
      )}
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold text-[#074a5b]" style={{ fontFamily: "'Comic Sans MS', 'Comic Neue'" }}>
            Promotion Management
          </h1>
        </div>

        {error && (
          <div className="bg-red-100 text-red-700 p-4 mb-6 rounded-xl" style={{ fontFamily: "'Comic Sans MS', 'Comic Neue'" }}>
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-100 text-green-700 p-4 mb-6 rounded-xl" style={{ fontFamily: "'Comic Sans MS', 'Comic Neue'" }}>
            {success}
          </div>
        )}

        <div className="mb-12 p-6 bg-white rounded-2xl shadow-lg">
          <h2 className="text-2xl font-semibold mb-6 text-[#074a5b]" style={{ fontFamily: "'Comic Sans MS', 'Comic Neue'" }}>
            {editingId ? 'Edit Promotion' : 'Add Promotion'}
          </h2>
          <form onSubmit={handleSavePromotion} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block mb-2 text-[#074a5b] font-semibold" style={{ fontFamily: "'Comic Sans MS', 'Comic Neue'" }}>
                Title
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none h-12 w-full"
                style={{ fontFamily: "'Comic Sans MS', 'Comic Neue'" }}
                required
              />
            </div>
            <div className="col-span-2">
              <label className="block mb-2 text-[#074a5b] font-semibold" style={{ fontFamily: "'Comic Sans MS', 'Comic Neue'" }}>
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none w-full h-24"
                style={{ fontFamily: "'Comic Sans MS', 'Comic Neue'" }}
                required
              />
            </div>
            <div>
              <label className="block mb-2 text-[#074a5b] font-semibold" style={{ fontFamily: "'Comic Sans MS', 'Comic Neue'" }}>
                Image
              </label>
              <div className="flex items-center">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="border-none outline-none h-12"
                  disabled={uploading}
                  style={{ fontFamily: "'Comic Sans MS', 'Comic Neue'" }}
                />
                {uploading && (
                  <span className="ml-2 text-gray-600" style={{ fontFamily: "'Comic Sans MS', 'Comic Neue'" }}>
                    Uploading...
                  </span>
                )}
              </div>
              {formData.imageUrl && (
                <div className="mt-2 relative inline-block">
                  <img
                    src={formData.imageUrl}
                    alt="Promotion Preview"
                    className="w-32 h-32 object-cover rounded-xl"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="absolute top-2 right-2 bg-gray-800 hover:bg-gray-600 text-white rounded-full p-2 transition-all duration-300"
                    aria-label="Remove image"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}
            </div>
            <div>
              <label className="block mb-2 text-[#074a5b] font-semibold" style={{ fontFamily: "'Comic Sans MS', 'Comic Neue'" }}>
                Valid From
              </label>
              <input
                type="date"
                value={formData.validFrom}
                onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                className="border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none h-12 w-full"
                style={{ fontFamily: "'Comic Sans MS', 'Comic Neue'" }}
                required
              />
            </div>
            <div>
              <label className="block mb-2 text-[#074a5b] font-semibold" style={{ fontFamily: "'Comic Sans MS', 'Comic Neue'" }}>
                Valid Until
              </label>
              <input
                type="date"
                value={formData.validUntil}
                onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                className="border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none h-12 w-full"
                style={{ fontFamily: "'Comic Sans MS', 'Comic Neue'" }}
                required
              />
            </div>
            <div>
              <label className="block mb-2 text-[#074a5b] font-semibold" style={{ fontFamily: "'Comic Sans MS', 'Comic Neue'" }}>
                Show as Popup
              </label>
              <input
                type="checkbox"
                checked={formData.isPopup}
                onChange={(e) => setFormData({ ...formData, isPopup: e.target.checked })}
                className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-200 rounded"
              />
            </div>
            <div>
              <label className="block mb-2 text-[#074a5b] font-semibold" style={{ fontFamily: "'Comic Sans MS', 'Comic Neue'" }}>
                Button Text
              </label>
              <input
                type="text"
                value={formData.buttonText}
                onChange={(e) => setFormData({ ...formData, buttonText: e.target.value })}
                className="border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none h-12 w-full"
                style={{ fontFamily: "'Comic Sans MS', 'Comic Neue'" }}
              />
            </div>
            <div>
              <label className="block mb-2 text-[#074a5b] font-semibold" style={{ fontFamily: "'Comic Sans MS', 'Comic Neue'" }}>
                Button Link
              </label>
              <input
                type="text"
                value={formData.buttonLink}
                onChange={(e) => setFormData({ ...formData, buttonLink: e.target.value })}
                className="border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none h-12 w-full"
                style={{ fontFamily: "'Comic Sans MS', 'Comic Neue'" }}
              />
            </div>
            <div>
              <label className="block mb-2 text-[#074a5b] font-semibold" style={{ fontFamily: "'Comic Sans MS', 'Comic Neue'" }}>
                Countdown Label
              </label>
              <input
                type="text"
                value={formData.countdownLabel}
                onChange={(e) => setFormData({ ...formData, countdownLabel: e.target.value })}
                className="border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none h-12 w-full"
                style={{ fontFamily: "'Comic Sans MS', 'Comic Neue'" }}
              />
            </div>
            <div>
              <label className="block mb-2 text-[#074a5b] font-semibold" style={{ fontFamily: "'Comic Sans MS', 'Comic Neue'" }}>
                Tag 1
              </label>
              <input
                type="text"
                value={formData.trustIndicator1}
                onChange={(e) => setFormData({ ...formData, trustIndicator1: e.target.value })}
                className="border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none h-12 w-full"
                style={{ fontFamily: "'Comic Sans MS', 'Comic Neue'" }}
                translate="no"
              />
            </div>
            <div>
              <label className="block mb-2 text-[#074a5b] font-semibold" style={{ fontFamily: "'Comic Sans MS', 'Comic Neue'" }}>
                Tag 2
              </label>
              <input
                type="text"
                value={formData.trustIndicator2}
                onChange={(e) => setFormData({ ...formData, trustIndicator2: e.target.value })}
                className="border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none h-12 w-full"
                style={{ fontFamily: "'Comic Sans MS', 'Comic Neue'" }}
                translate="no"
              />
            </div>
            <div className="col-span-2 flex gap-4">
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300"
                disabled={uploading}
                style={{ fontFamily: "'Comic Sans MS', 'Comic Neue'" }}
              >
                <Save size={16} className="inline mr-2" /> Save
              </button>
              <button
                type="button"
                onClick={handleAddPromotion}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-6 py-3 rounded-xl font-semibold transition-all duration-300"
                disabled={uploading}
                style={{ fontFamily: "'Comic Sans MS', 'Comic Neue'" }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>

        <div className="mb-12">
          <h2 className="text-2xl font-semibold mb-6 text-[#074a5b]" style={{ fontFamily: "'Comic Sans MS', 'Comic Neue'" }}>
            Promotions
          </h2>
          {!promotions.length && (
            <p className="text-gray-600" style={{ fontFamily: "'Comic Sans MS', 'Comic Neue'" }}>
              No promotions added.
            </p>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {promotions.map((promotion) => (
              <div
                key={promotion._id}
                data-animate
                data-id={`promotion-${promotion._id}`}
                className={`bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-500 ${
                  visibleItems[`promotion-${promotion._id}`] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}
              >
                {promotion.imageUrl && (
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={promotion.imageUrl}
                      alt={promotion.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                  </div>
                )}
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-[#074a5b]" style={{ fontFamily: "'Comic Sans MS', 'Comic Neue'" }}>
                    {promotion.title}
                  </h3>
                  <p className="text-gray-600 mb-3" style={{ fontFamily: "'Comic Sans MS', 'Comic Neue'" }}>
                    {promotion.description}
                  </p>
                  <p className="text-gray-600 mb-3" style={{ fontFamily: "'Comic Sans MS', 'Comic Neue'" }}>
                    <strong>Valid:</strong> {new Date(promotion.validFrom).toLocaleDateString()} -{' '}
                    {new Date(promotion.validUntil).toLocaleDateString()}
                  </p>
                  <p className="text-gray-600 mb-3" style={{ fontFamily: "'Comic Sans MS', 'Comic Neue'" }}>
                    <strong>Popup:</strong> {promotion.isPopup ? 'Yes' : 'No'}
                  </p>
                  <p className="text-gray-600 mb-3" style={{ fontFamily: "'Comic Sans MS', 'Comic Neue'" }}>
                    <strong>Button Text:</strong> {promotion.buttonText}
                  </p>
                  <p className="text-gray-600 mb-3" style={{ fontFamily: "'Comic Sans MS', 'Comic Neue'" }}>
                    <strong>Button Link:</strong> {promotion.buttonLink}
                  </p>
                  <p className="text-gray-600 mb-3" style={{ fontFamily: "'Comic Sans MS', 'Comic Neue'" }}>
                    <strong>Countdown Label:</strong> {promotion.countdownLabel}
                  </p>
                  <p className="text-gray-600 mb-3" style={{ fontFamily: "'Comic Sans MS', 'Comic Neue'" }}>
                    <strong>Trust Indicator 1:</strong> <span translate="no">{promotion.trustIndicator1}</span>
                  </p>
                  <p className="text-gray-600 mb-3" style={{ fontFamily: "'Comic Sans MS', 'Comic Neue'" }}>
                    <strong>Trust Indicator 2:</strong> <span translate="no">{promotion.trustIndicator2}</span>
                  </p>
                  <p className="text-gray-600 mb-3" style={{ fontFamily: "'Comic Sans MS', 'Comic Neue'" }}>
                    <strong>Status:</strong> {promotion.status ? 'Active' : 'Inactive'}
                  </p>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={(e) => handleEditPromotion(e, promotion)}
                      className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-xl font-semibold transition-all duration-300"
                      style={{ fontFamily: "'Comic Sans MS', 'Comic Neue'" }}
                    >
                      <Edit size={16} className="inline mr-2" /> Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeletePromotion(promotion._id, promotion.title)}
                      className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl font-semibold transition-all duration-300"
                      style={{ fontFamily: "'Comic Sans MS', 'Comic Neue'" }}
                    >
                      <Trash2 size={16} className="inline mr-2" /> Delete
                    </button>
                    <button
                      type="button"
                      title="Duplicate Promotion"
                      onClick={() => handleDuplicatePromotion(promotion._id)}
                      className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-xl font-semibold transition-all duration-300"
                      style={{ fontFamily: "'Comic Sans MS', 'Comic Neue'" }}
                    >
                      <FaRegClone size={18} />
                    </button>
                    <button
                      type="button"
                      title={promotion.status ? 'Set Inactive' : 'Set Active'}
                      onClick={() => handleToggleStatus(promotion._id, promotion.status)}
                      className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-xl font-semibold transition-all duration-300"
                      style={{ fontFamily: "'Comic Sans MS', 'Comic Neue'" }}
                    >
                      {promotion.status ? <FaToggleOn color="green" size={22} /> : <FaToggleOff color="gray" size={22} />}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PromotionManagement;

