import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
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
            className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-lg font-semibold transition-all"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-semibold transition-all"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

const PackageManagement = () => {
  const { user, api } = useContext(AuthContext);
  const navigate = useNavigate();
  const [packages, setPackages] = useState([]);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    price: '',
    description: '',
    included_items: '',
    excluded_items: '',
    resort: '',
    activities: '',
    images: [],
    expiry_date: '',
    nights: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [modal, setModal] = useState({ isOpen: false, id: null, name: '' });

  useEffect(() => {
    if (!user) {
      setError('Please log in to access this page.');
      navigate('/login', { state: { message: 'Access required' } });
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
    const fetchPackages = async () => {
      try {
        setLoading(true);
        const response = await api.get('https://editable-travel-website1-rpfv.vercel.app/api/packages');
        console.log('Fetched packages:', response.data);
        setPackages(response.data);
      } catch (err) {
        console.error('Fetch error:', err);
        setError(`Failed to load packages: ${err.response?.data?.msg || err.message}`);
      } finally {
        setLoading(false);
      }
    };
    if (user) {
      fetchPackages();
    }
  }, [user, api]);

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

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files).filter(
      (file) => file.type.startsWith('image/') && file.size <= 32 * 1024 * 1024
    );
    if (files.length === 0) {
      setError('Please upload valid image files (max 32MB each).');
      return;
    }
    const uploadPromises = files.map((file) => uploadImage(file));
    const urls = (await Promise.all(uploadPromises)).filter((url) => url);
    setFormData((prev) => ({ ...prev, images: [...prev.images, ...urls] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!formData.title || !formData.price) {
        setError('Please fill in all required fields');
        return;
      }
      if (selectedPackage && !isValidId(selectedPackage._id)) {
        console.error('Invalid package ID:', selectedPackage._id);
        setError('Invalid package ID');
        return;
      }
      const data = {
        title: formData.title.trim(),
        price: Number(formData.price),
        description: formData.description?.trim() || '',
        included_items: formData.included_items
          ? formData.included_items.split(',').map(item => item.trim()).filter(item => item)
          : [],
        excluded_items: formData.excluded_items
          ? formData.excluded_items.split(',').map(item => item.trim()).filter(item => item)
          : [],
        resort: formData.resort?.trim() || '',
        activities: formData.activities
          ? formData.activities.split(',').map(item => item.trim()).filter(item => item)
          : [],
        images: formData.images || [],
        expiry_date: formData.expiry_date ? new Date(formData.expiry_date) : undefined,
        nights: formData.nights ? Number(formData.nights) : undefined,
      };
      let response;
      if (selectedPackage) {
        response = await api.put(`https://editable-travel-website1-rpfv.vercel.app/api/packages/${selectedPackage._id}`, data);
        setPackages(packages.map(p => p._id === selectedPackage._id ? response.data : p));
        setSuccess('Package updated successfully');
      } else {
        response = await api.post('https://editable-travel-website1-rpfv.vercel.app/api/packages', data);
        setPackages([...packages, response.data]);
        setSuccess('Package created successfully');
      }
      resetForm();
    } catch (err) {
      console.error('Submit error:', err);
      setError(`Failed to save package: ${err.response?.data?.msg || err.message}`);
    }
  };

  const handleDeletePackage = (id, name) => {
    if (!isValidId(id)) {
      console.error('Invalid package ID:', id);
      setError('Invalid package ID');
      return;
    }
    setModal({ isOpen: true, id, name });
  };

  const confirmDelete = async () => {
    try {
      if (!isValidId(modal.id)) {
        console.error('Invalid package ID:', modal.id);
        setError('Invalid package ID:', modal.id);
        return;
      }
      await api.delete(`https://editable-travel-website1-rpfv.vercel.app/api/packages/${modal.id}`);
      setPackages(packages.filter(p => p._id !== modal.id));
      setSuccess('Package deleted successfully');
      resetForm();
    } catch (err) {
      console.error('Delete error:', err);
      setError(`Failed to delete package: ${err.response?.data?.msg || err.message}`);
    } finally {
      setModal({ isOpen: false, id: null, name: '' });
    }
  };

  const closeModal = () => {
    setModal({ isOpen: false, id: null, name: '' });
  };

  const handleEditPackage = (pkg) => {
    if (!isValidId(pkg._id)) {
      console.error('Invalid package ID: pkg._id');
      setError('Invalid package ID');
      return;
    }
    console.log('Editing package:', pkg);
    setSelectedPackage(pkg);
    setFormData({
      title: pkg.title,
      price: pkg.price,
      description: pkg.description || '',
      included_items: pkg.included_items.join(', ') || '',
      excluded_items: pkg.excluded_items.join(', ') || '',
      resort: pkg.resort || '',
      activities: pkg.activities.join(', ') || '',
      images: pkg.images || [],
      expiry_date: pkg.expiry_date ? new Date(pkg.expiry_date).toISOString().split('T')[0] : '',
      nights: pkg.nights || '',
    });
  };

  const resetForm = () => {
    console.log('Resetting form:', formData);
    setFormData({
      title: '',
      price: '',
      description: '',
      included_items: '',
      excluded_items: '',
      resort: '',
      activities: '',
      images: [],
      expiry_date: '',
      nights: '',
    });
    setSelectedPackage(null);
    setError('');
    setSuccess('');
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <p className="text-xl text-[#074a5b]" style={{ fontFamily: 'Comic Sans MS, cursive' }}>Loading packages...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: 'Comic Sans MS, cursive' }}>
      <ConfirmationModal
        isOpen={modal.isOpen}
        onClose={closeModal}
        onConfirm={confirmDelete}
        title="Delete Package"
        message={`Are you sure you want to delete ${modal.name}? This action cannot be undone.`}
      />
      <div className="container mx-auto p-6">
        <h1 className="text-4xl font-bold mb-8 text-[#074a5b]">Package Management</h1>

        {error && <div className="bg-red-100 text-red-700 p-4 mb-6 rounded-lg">{error}</div>}
        {success && <div className="bg-green-100 text-green-700 p-4 mb-6 rounded-lg">{success}</div>}

        <div className="mb-12 p-6 bg-white rounded-2xl shadow-lg">
          <h2 className="text-2xl font-semibold mb-6 text-[#074a5b]">
            {selectedPackage ? 'Edit Package' : 'Add New Package'}
          </h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block mb-2 text-[#074a5b] font-semibold">Package Title</label>
              <input                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none h-12 w-full"
                required
              />
            </div>
            <div>
              <label className="block mb-2 text-[#074a5b] font-semibold">Price</label>
              <input                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none h-12 w-full"
                required
              />
            </div>
            <div>
              <label className="block mb-2 text-[#074a5b] font-semibold">Number of Nights</label>
              <input                type="number"
                value={formData.nights}
                onChange={(e) => setFormData({ ...formData, nights: e.target.value })}
                className="border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none h-12 w-full"
              />
            </div>
            <div>
              <label className="block mb-2 text-[#074a5b] font-semibold">Expiry Date</label>
              <input                type="date"
                value={formData.expiry_date}
                onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                className="border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none h-12 w-full"
              />
            </div>
            <div>
              <label className="block mb-2 text-[#074a5b] font-semibold">Resort</label>
              <input                type="text"
                value={formData.resort}
                onChange={(e) => setFormData({ ...formData, resort: e.target.value })}
                className="border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none h-12 w-full"
              />
            </div>
            <div>
              <label className="block mb-2 text-[#074a5b] font-semibold">Activities (comma-separated)</label>
              <input                type="text"
                value={formData.activities}
                onChange={(e) => setFormData({ ...formData, activities: e.target.value })}
                className="border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none h-12 w-full"
              />
            </div>
            <div className="col-span-1">
              <label className="block mb-2 text-[#074a5b] font-semibold">Package Images</label>
              <div className="flex items-center">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none h-12"
                  disabled={uploading}
                />
                {uploading && <span className="ml-2 text-gray-600">Uploading...</span>}
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {formData.images.map((img, index) => (
                  <div key={index} className="relative">
                    <img
                      src={getSafeImageUrl(img)}
                      alt={`Preview ${index}`}
                      className="w-32 h-32 object-cover rounded-lg"
                      onError={() => console.error(`Failed to load image: ${img}`)}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          images: prev.images.filter((_, i) => i !== index),
                        }))
                      }
                      className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <label className="block mb-2 text-[#074a5b] font-semibold">Included Items (comma-separated)</label>
              <input                type="text"
                value={formData.included_items}
                onChange={(e) => setFormData({ ...formData, included_items: e.target.value })}
                className="border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none h-12 w-full"
              />
            </div>
            <div>
              <label className="block mb-2 text-[#074a5b] font-semibold">Excluded Items (comma-separated)</label>
              <input                type="text"
                value={formData.excluded_items}
                onChange={(e) => setFormData({ ...formData, excluded_items: e.target.value })}
                className="border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none h-12 w-full"
              />
            </div>
            <div className="col-span-2">
              <label className="block mb-2 text-[#074a5b] font-semibold">Description</label>
              <textarea
                placeholder="Description"
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
                {selectedPackage ? 'Update Package' : 'Add Package'}
              </button>
              {selectedPackage && (
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
          <h2 className="text-2xl font-semibold mb-6 text-[#074a5b]">Packages</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {packages.map((pkg) => (
              <div
                key={pkg._id}
                className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-500"
              >
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={getSafeImageUrl(pkg.images[0])}
                    alt={pkg.title}
                    className="w-full h-full object-cover"
                    onError={() => console.error(`Failed to load image for package ${pkg.title}: ${pkg.images[0]}`)}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-2 text-[#074a5b] hover:text-blue-600 transition-colors">
                    {pkg.title}
                  </h3>
                  <p className="text-gray-600 mb-3">Price: ${pkg.price}</p>
                  <p className="text-gray-600 mb-3">Nights: {pkg.nights || 'N/A'}</p>
                  <p className="text-gray-600 mb-3">Resort: {pkg.resort || 'N/A'}</p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleEditPackage(pkg)}
                      className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-xl font-semibold transition-all"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeletePackage(pkg._id, pkg.title)}
                      className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl font-semibold transition-all"
                    >
                      Delete
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

export default PackageManagement;
