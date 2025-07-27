import React, { useState, useEffect, useContext, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { MapPin, ChevronDown,X } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

const imgbbAxios = axios.create();

// Confirmation Modal Component
const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold text-[#074a5b] mb-4">{title}</h3>
        <p className="text-gray-600 mb-6">{message}</p>
        <div className="flex justify-end gap-4">
          <button
            onClick={onClose}
            className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-xl font-semibold transition-all"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl font-semibold transition-all"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

// Atoll Dropdown 
const AtollDropdown = ({ atolls, selectedAtolls, onChange, disabled }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = () => {
    if (!disabled) setIsOpen(!isOpen);
  };

  const handleSelect = (atollId) => {
    const newSelected = selectedAtolls.includes(atollId)
      ? selectedAtolls.filter((id) => id !== atollId)
      : [...selectedAtolls, atollId];
    onChange(newSelected);
  };

  const selectedNames = selectedAtolls
    .map((id) => atolls.find((a) => a._id === id)?.name)
    ?.filter(Boolean)
    .join(', ') || 'Select Atolls';

  return (
    <div className="relative">
      <label className="block mb-2 text-[#074a5b] font-semibold">Available Atolls</label>
      <button
        type="button"
        onClick={handleToggle}
        className={`w-full flex justify-between items-center border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none h-12 bg-white text-left ${
          disabled ? 'bg-gray-100 cursor-not-allowed' : 'hover:bg-gray-50'
        }`}
        disabled={disabled}
      >
        <span className="truncate text-gray-600">{selectedNames}</span>
        <ChevronDown
          size={20}
          className={`text-[#074a5b] transition-transform ${isOpen && !disabled ? 'rotate-180' : ''}`}
        />
      </button>
      {isOpen && !disabled && (
        <div className="absolute z-10 w-full mt-2 bg-white border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
          {atolls.length > 0 ? (
            atolls.map((atoll) => (
              <label
                key={atoll._id}
                className="flex items-center px-4 py-2 hover:bg-gray-100 cursor-pointer rounded-lg"
              >
                <input
                  type="checkbox"
                  checked={selectedAtolls.includes(atoll._id)}
                  onChange={() => handleSelect(atoll._id)}
                  className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 outline-none"
                />
                <span className="text-gray-700">{atoll.name}</span>
              </label>
            ))
          ) : (
            <div className="px-4 py-2 text-gray-600">No atolls available</div>
          )}
        </div>
      )}
    </div>
  );
};

const ActivityManagement = () => {
  const { user, api, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [activities, setActivities] = useState([]);
  const [atolls, setAtolls] = useState([]);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    tags: '',
    media: [],
    available_in_all_atolls: false,
    available_atoll_ids: [],
    price: '',
  });
  const [siteFormData, setSiteFormData] = useState({
    name: '',
    image: '',
    atoll_id: '',
  });
  const [editingSiteId, setEditingSiteId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);
  const [visibleItems, setVisibleItems] = useState({});
  const [uploading, setUploading] = useState(false);
  const [modal, setModal] = useState({ isOpen: false, type: '', id: null, name: '' });

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

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [activitiesResponse, atollsResponse] = await Promise.all([
          api.get('/api/activities'),
          api.get('/api/atolls'),
        ]);
        console.log('Fetched activities:', activitiesResponse.data);
        console.log('Fetched atolls:', atollsResponse.data);
        setActivities(activitiesResponse.data);
        setAtolls(atollsResponse.data);
      } catch (err) {
        console.error('Fetch error:', err);
        if (err.response?.status === 401 || err.response?.status === 403) {
          setError('Unauthorized: Please log in as an admin.');
          logout();
          navigate('/login', { state: { message: 'Admin access required' } });
        } else {
          setError(`Failed to load data: ${err.response?.data?.msg || err.message}`);
        }
      } finally {
        setLoading(false);
      }
    };
    if (user?.isAdmin) {
      fetchData();
    }
  }, [user, api, navigate, logout]);

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
  }, [activities, selectedActivity]);

  const isValidId = (id) => {
    return typeof id === 'string' && id.match(/^[0-9a-fA-F]{24}$/);
  };

  const getSafeImageUrl = (url) => url || '';

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

  const handleMediaUpload = async (e) => {
    const files = Array.from(e.target.files).filter(
      (file) => file.type.startsWith('image/') && file.size <= 32 * 1024 * 1024
    );
    if (files.length === 0) {
      setError('Please upload valid image files (max 32MB each).');
      return;
    }
    const uploadPromises = files.map((file) => uploadImage(file));
    const urls = (await Promise.all(uploadPromises)).filter((url) => url);
    setFormData((prev) => ({ ...prev, media: [...prev.media, ...urls] }));
  };

  const handleSiteImageUpload = async (e) => {
    const files = Array.from(e.target.files).filter(
      (file) => file.type.startsWith('image/') && file.size <= 32 * 1024 * 1024
    );
    if (files.length === 0) {
      setError('Please upload valid image files (max 32MB each).');
      return;
    }
    const uploadPromises = files.map((file) => uploadImage(file));
    const urls = (await Promise.all(uploadPromises)).filter((url) => url);
    setSiteFormData((prev) => ({ ...prev, image: urls[0] || prev.image }));
  };

  const handleActivitySubmit = async (e) => {
    e.preventDefault();
    try {
      if (!formData.name || !formData.price || (!formData.available_in_all_atolls && !formData.available_atoll_ids.length)) {
        setError('Please fill in all required fields');
        return;
      }
      if (selectedActivity && !isValidId(selectedActivity._id)) {
        console.error('Invalid activity ID:', selectedActivity._id);
        setError('Invalid activity ID');
        return;
      }
      const data = {
        name: formData.name.trim(),
        description: formData.description?.trim() || '',
        tags: formData.tags ? formData.tags.split(',').map(item => item.trim()).filter(item => item) : [],
        media: formData.media || [],
        available_in_all_atolls: formData.available_in_all_atolls,
        available_atoll_ids: formData.available_in_all_atolls ? [] : formData.available_atoll_ids,
        price: Number(formData.price),
      };
      let response;
      if (selectedActivity) {
        response = await api.put(`/api/activities/${selectedActivity._id}`, data);
        setActivities(activities.map(a => a._id === selectedActivity._id ? response.data : a));
        setSuccess('Activity updated successfully');
      } else {
        response = await api.post('/api/activities', data);
        setActivities([...activities, response.data]);
        setSuccess('Activity created successfully');
      }
      resetForm();
      resetSiteForm();
    } catch (err) {
      console.error('Activity submit error:', err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        setError('Unauthorized: Please log in as an admin.');
        logout();
        navigate('/login', { state: { message: 'Admin access required' } });
      } else {
        setError(`Failed to save activity: ${err.response?.data?.msg || err.message}`);
      }
    }
  };

  const handleSiteSubmit = async (e) => {
    e.preventDefault();
    if (!selectedActivity) {
      setError('Please select an activity first');
      return;
    }
    try {
      if (!siteFormData.name || !siteFormData.atoll_id) {
        setError('Please fill in all required site fields');
        return;
      }
      if (!isValidId(selectedActivity._id) || (editingSiteId && !isValidId(editingSiteId))) {
        console.error('Invalid IDs:', { activityId: selectedActivity._id, siteId: editingSiteId });
        setError('Invalid activity or site ID');
        return;
      }
      const data = {
        name: siteFormData.name.trim(),
        image: siteFormData.image || '',
        atoll_id: siteFormData.atoll_id,
      };
      let updatedSites;
      if (editingSiteId) {
        updatedSites = selectedActivity.activity_sites.map(site =>
          site._id === editingSiteId ? { ...site, ...data } : site
        );
      } else {
        updatedSites = [...selectedActivity.activity_sites, data];
      }
      const response = await api.put(`/api/activities/${selectedActivity._id}`, {
        ...selectedActivity,
        activity_sites: updatedSites,
      });
      const refreshedActivity = await api.get(`/api/activities/${selectedActivity._id}`);
      console.log('Refreshed activity:', refreshedActivity.data);
      setSelectedActivity(refreshedActivity.data);
      setActivities(activities.map(a => a._id === selectedActivity._id ? refreshedActivity.data : a));
      setSuccess(editingSiteId ? 'Activity site updated successfully' : 'Activity site added successfully');
      resetSiteForm();
      resetForm();
    } catch (err) {
      console.error('Site submit error:', err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        setError('Unauthorized: Please log in as an admin.');
        logout();
        navigate('/login', { state: { message: 'Admin access required' } });
      } else {
        setError(`Failed to save activity site: ${err.response?.data?.msg || err.message}`);
      }
    }
  };

  const handleDeleteActivity = (id, name) => {
    if (!isValidId(id)) {
      console.error('Invalid activity ID:', id);
      setError('Invalid activity ID');
      return;
    }
    setModal({
      isOpen: true,
      type: 'activity',
      id,
      name,
    });
  };

  const handleDeleteSite = (siteId, siteName) => {
    if (!selectedActivity?._id || !isValidId(siteId)) {
      console.error('Invalid IDs:', { activityId: selectedActivity?._id, siteId });
      setError('Invalid activity or site ID');
      return;
    }
    setModal({
      isOpen: true,
      type: 'site',
      id: siteId,
      name: siteName,
    });
  };

  const confirmDelete = async () => {
    try {
      if (modal.type === 'activity') {
        if (!isValidId(modal.id)) {
          console.error('Invalid activity ID:', modal.id);
          setError('Invalid activity ID');
          return;
        }
        await api.delete(`/api/activities/${modal.id}`);
        setActivities(activities.filter(a => a._id !== modal.id));
        setSuccess('Activity deleted successfully');
        resetForm();
        resetSiteForm();
      } else if (modal.type === 'site') {
        if (!isValidId(selectedActivity._id) || !isValidId(modal.id)) {
          console.error('Invalid IDs:', { activityId: selectedActivity._id, siteId: modal.id });
          setError('Invalid activity or site ID');
          return;
        }
        const updatedSites = selectedActivity.activity_sites.filter(s => s._id !== modal.id);
        const response = await api.put(`/api/activities/${selectedActivity._id}`, {
          ...selectedActivity,
          activity_sites: updatedSites,
        });
        const refreshedActivity = await api.get(`/api/activities/${selectedActivity._id}`);
        console.log('Refreshed activity after delete:', refreshedActivity.data);
        setSelectedActivity(refreshedActivity.data);
        setActivities(activities.map(a => a._id === selectedActivity._id ? refreshedActivity.data : a));
        setSuccess('Activity site deleted successfully');
        resetSiteForm();
        resetForm();
      }
    } catch (err) {
      console.error(`Delete ${modal.type} error:`, err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        setError('Unauthorized: Please log in as an admin.');
        logout();
        navigate('/login', { state: { message: 'Admin access required' } });
      } else {
        setError(`Failed to delete ${modal.type}: ${err.response?.data?.msg || err.message}`);
      }
    } finally {
      setModal({ isOpen: false, type: '', id: null, name: '' });
    }
  };

  const closeModal = () => {
    setModal({ isOpen: false, type: '', id: null, name: '' });
  };

  const handleEditActivity = (activity) => {
    if (!isValidId(activity._id)) {
      console.error('Invalid activity ID:', activity._id);
      setError('Invalid activity ID');
      return;
    }
    console.log('Editing activity:', activity);
    setSelectedActivity(activity);
    setFormData({
      name: activity.name,
      description: activity.description || '',
      tags: activity.tags.join(', '),
      media: activity.media || [],
      available_in_all_atolls: activity.available_in_all_atolls,
      available_atoll_ids: activity.available_in_all_atolls ? [] : 
        (activity.available_atoll_ids || []).map(id => id._id || id),
      price: activity.price,
    });
  };

  const handleEditSite = (site) => {
    if (!isValidId(site._id)) {
      console.error('Invalid site ID:', site._id);
      setError('Invalid site ID');
      return;
    }
    console.log('Editing site:', site);
    setEditingSiteId(site._id);
    setSiteFormData({
      name: site.name,
      image: site.image || '',
      atoll_id: site.atoll_id._id || site.atoll_id,
    });
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      tags: '',
      media: [],
      available_in_all_atolls: false,
      available_atoll_ids: [],
      price: '',
    });
    setSelectedActivity(null);
    setError('');
  };

  const resetSiteForm = () => {
    setSiteFormData({
      name: '',
      image: '',
      atoll_id: '',
    });
    setEditingSiteId(null);
    setError('');
  };

  const getAvailableAtollsForSite = () => {
    if (!selectedActivity) return [];
    if (selectedActivity.available_in_all_atolls) return atolls;
    return atolls.filter((atoll) =>
      selectedActivity.available_atoll_ids.some((id) => id._id === atoll._id || id === atoll._id)
    );
  };

  if (loading || !user?.isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <p className="text-xl text-[#074a5b]" style={{ fontFamily: 'Comic Sans MS, cursive' }}>Loading activities...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: 'Comic Sans MS, cursive' }}>
      <ConfirmationModal
        isOpen={modal.isOpen}
        onClose={closeModal}
        onConfirm={confirmDelete}
        title={`Delete ${modal.type === 'activity' ? 'Activity' : 'Site'}`}
        message={`Are you sure you want to delete ${modal.name}? This action cannot be undone.`}
      />
      <div className="container mx-auto p-6">
        <h1 className="text-4xl font-bold mb-8 text-[#074a5b]">Activity Management</h1>

        {error && <div className="bg-red-100 text-red-700 p-4 mb-6 rounded-xl">{error}</div>}
        {success && <div className="bg-green-100 text-green-700 p-4 mb-6 rounded-xl">{success}</div>}

        <div className="mb-12 p-6 bg-white rounded-2xl shadow-lg">
          <h2 className="text-2xl font-semibold mb-6 text-[#074a5b]">
            {selectedActivity ? 'Edit Activity' : 'Add New Activity'}
          </h2>
          <form onSubmit={handleActivitySubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block mb-2 text-[#074a5b] font-semibold">Activity Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none h-12 w-full"
                required
              />
            </div>
            <div>
              <label className="block mb-2 text-[#074a5b] font-semibold">Price</label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none h-12 w-full"
                required
              />
            </div>
            <div>
              <label className="block mb-2 text-[#074a5b] font-semibold">Tags (comma-separated)</label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                className="border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none h-12 w-full"
              />
            </div>
            <div className="col-span-1">
              <label className="block mb-2 text-[#074a5b] font-semibold">Media Images</label>
              <div className="flex items-center">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleMediaUpload}
                  className="border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none h-12"
                  disabled={uploading}
                />
                {uploading && <span className="ml-2 text-gray-600">Uploading...</span>}
              </div>
              <div className="mt-2 flex flex-wrap gap-2">                {formData.media.map((img, index) => (
                  <div key={index} className="relative">
                    <img
                      src={getSafeImageUrl(img)}
                      alt={`Preview ${index}`}
                      className="w-32 h-32 object-cover rounded-xl"
                      onError={() => console.error(`Failed to load image: ${img}`)}
                    />
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({
                        ...prev,
                        media: prev.media.filter((_, i) => i !== index)
                      }))}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <AtollDropdown
              atolls={atolls}
              selectedAtolls={formData.available_atoll_ids}
              onChange={(newAtolls) => setFormData({ ...formData, available_atoll_ids: newAtolls })}
              disabled={formData.available_in_all_atolls}
            />
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={formData.available_in_all_atolls}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    available_in_all_atolls: e.target.checked,
                    available_atoll_ids: e.target.checked ? [] : formData.available_atoll_ids,
                  })
                }
                className="mr-2 h-5 w-5"
              />
              <label className="text-[#074a5b] font-semibold">Available in All Atolls</label>
            </div>
            <div className="col-span-2">
              <label className="block mb-2 text-[#074a5b] font-semibold">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none w-full h-24"
              />
            </div>
            <div className="col-span-2 flex gap-4">
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300"
                disabled={uploading}
              >
                {selectedActivity ? 'Update Activity' : 'Add Activity'}
              </button>
              {selectedActivity && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-6 py-3 rounded-xl font-semibold transition-all duration-300"
                  disabled={uploading}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        <div className="mb-12">
          <h2 className="text-2xl font-semibold mb-6 text-[#074a5b]">Activities</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activities.map((activity) => (
              <div
                key={activity._id}
                data-animate
                data-id={activity._id}
                className={`bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-500 transform ${
                  visibleItems[activity._id] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}
              >
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={getSafeImageUrl(activity.media[0])}
                    alt={activity.name}
                    className="w-full h-full object-cover"
                    onError={() => console.error(`Failed to load image for activity ${activity.name}: ${activity.media[0]}`)}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-2 text-[#074a5b] hover:text-blue-600 transition-colors">
                    {activity.name}
                  </h3>
                  <p className="text-gray-600 mb-3 flex items-center">
                    <MapPin size={16} className="mr-2 text-[#074a5b]" />
                    {activity.available_in_all_atolls ? 'All Atolls' : 
                      (activity.available_atoll_ids || []).map(id => 
                        atolls.find(a => a._id === (id._id || id))?.name || 'Unknown'
                      ).filter(name => name !== 'Unknown').join(', ') || 'None'}
                  </p>
                  <p className="text-gray-600 mb-3">Price: ${activity.price}</p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleEditActivity(activity)}
                      className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-xl font-semibold transition-all"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteActivity(activity._id, activity.name)}
                      className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl font-semibold transition-all"
                    >
                      Delete
                    </button>
                    <button
                      onClick={() => setSelectedActivity(activity)}
                      className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-xl font-semibold transition-all"
                    >
                      Manage Sites
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {selectedActivity && (
          <div className="p-6 bg-white rounded-2xl shadow-lg">
            <h2 className="text-2xl font-semibold mb-6 text-[#074a5b]">
              Manage Sites for {selectedActivity.name}
            </h2>
            <form onSubmit={handleSiteSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block mb-2 text-[#074a5b] font-semibold">Site Name</label>
                <input
                  type="text"
                  value={siteFormData.name}
                  onChange={(e) => setSiteFormData({ ...siteFormData, name: e.target.value })}
                  className="border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none h-12 w-full"
                  required
                />
              </div>
              <div className="col-span-1">
                <label className="block mb-2 text-[#074a5b] font-semibold">Site Image</label>
                <div className="flex items-center">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleSiteImageUpload}
                    className="border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none h-12"
                    disabled={uploading}
                  />
                  {uploading && <span className="ml-2 text-gray-600">Uploading...</span>}
                </div>                {siteFormData.image && (
                  <div className="mt-2">
                    <div className="relative inline-block group">
                      <img
                        src={getSafeImageUrl(siteFormData.image)}
                        alt="Site Preview"
                        className="w-32 h-32 object-cover rounded-xl"
                        onError={() => console.error(`Failed to load site image: ${siteFormData.image}`)}
                      />
                      <button
                        type="button"
                        onClick={() => setSiteFormData(prev => ({ ...prev, image: '' }))}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
              <div>
                <label className="block mb-2 text-[#074a5b] font-semibold">Atoll</label>
                <select
                  value={siteFormData.atoll_id}
                  onChange={(e) => setSiteFormData({ ...siteFormData, atoll_id: e.target.value })}
                  className="border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none h-12 w-full"
                  required
                >
                  <option value="">Select Atoll</option>
                  {getAvailableAtollsForSite().map((atoll) => (
                    <option key={atoll._id} value={atoll._id}>
                      {atoll.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-span-2 flex gap-4">
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-xl font-semibold transition-all duration-300"
                  disabled={uploading}
                >
                  {editingSiteId ? 'Update Site' : 'Add Site'}
                </button>
                {editingSiteId && (
                  <button
                    type="button"
                    onClick={resetSiteForm}
                    className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-6 py-2 rounded-xl font-semibold transition-all duration-300"
                    disabled={uploading}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>

            <h3 className="text-xl font-semibold mb-6 text-[#074a5b]">Activity Sites</h3>
            {selectedActivity.activity_sites?.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {selectedActivity.activity_sites.map((site) => (
                  <div
                    key={site._id}
                    data-animate
                    data-id={site._id}
                    className={`bg-gray-50 rounded-2xl p-6 hover:shadow-lg transition-all duration-300 ${
                      visibleItems[site._id] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                    }`}
                  >
                    <h4 className="text-lg font-semibold mb-2 text-[#074a5b]">{site.name}</h4>
                    <p className="text-gray-600">Atoll: {site.atoll_id?.name || 'Unknown'}</p>                    
                    {site.image && (
                      <div className="relative inline-block group mt-2">
                        <img
                          src={getSafeImageUrl(site.image)}
                          alt={site.name}
                          className="w-32 h-32 object-cover rounded-xl"
                          onError={() => console.error(`Failed to load site image: ${site.image}`)}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const updatedSites = selectedActivity.activity_sites.map(s => 
                              s._id === site._id ? { ...s, image: '' } : s
                            );
                            api.put(`/api/activities/${selectedActivity._id}`, {
                              ...selectedActivity,
                              activity_sites: updatedSites,
                            }).then(() => {
                              api.get(`/api/activities/${selectedActivity._id}`).then(response => {
                                setSelectedActivity(response.data);
                                setActivities(activities.map(a => 
                                  a._id === selectedActivity._id ? response.data : a
                                ));
                              });
                            });
                          }}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    )}
                    <div className="flex gap-3 mt-4">
                      <button
                        onClick={() => handleEditSite(site)}
                        className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-xl font-semibold transition-all duration-200"
                        disabled={!site._id}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteSite(site._id, site.name)}
                        className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl font-semibold transition-all duration-200"
                        disabled={!site._id}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600 text-sm">No sites available for this activity.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityManagement;