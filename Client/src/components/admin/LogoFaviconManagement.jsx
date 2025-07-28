import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { X, Save, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const imgbbAxios = axios.create();

const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold text-[#074a5b] mb-4" style={{ fontFamily: 'Comic Sans MS, cursive' }}>
          {title}
        </h3>
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

const LogoFaviconManagement = () => {
  const { user, api } = useContext(AuthContext);
  const navigate = useNavigate();
  const [selectedType, setSelectedType] = useState('logo');
  const [formData, setFormData] = useState({ imageUrl: '' });
  const [pageContent, setPageContent] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [uploading, setUploading] = useState(false);
  const [modal, setModal] = useState({ isOpen: false, type: '', id: null, name: '' });
  const [loading, setLoading] = useState(true);

  const types = [
    { id: 'logo', name: 'Logo' },
    { id: 'favicon', name: 'Favicon' },
  ];

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
    const fetchImages = async () => {
      try {
        setLoading(true);
        const response = await api.get('https://editable-travel-website1-rpfv.vercel.app/api/ui-content/logo-favicon');
        console.log('API Response:', response.data);
        setPageContent(response.data);
        const section = response.data?.sections?.find((s) => s.sectionId === selectedType);
        setFormData({ imageUrl: section?.content?.imageUrl || '' });
      } catch (err) {
        console.error('Error fetching content:', err);
        setError(`Failed to load content: ${err.response?.data?.message || err.message}`);
      } finally {
        setLoading(false);
      }
    };
    if (user?.isAdmin) fetchImages();
  }, [user, api, selectedType]);

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
      setError('Please upload a valid image file (max 32MB).');
      return;
    }
    const url = await uploadImage(files[0]);
    if (url) {
      setFormData({ ...formData, imageUrl: url });
    }
  };

  const handleRemoveImage = () => {
    setModal({
      isOpen: true,
      type: 'image',
      id: selectedType,
      name: selectedType === 'logo' ? 'Logo Image' : 'Favicon Image',
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      let newSections = pageContent?.sections ? [...pageContent.sections] : [];
      const sectionIndex = newSections.findIndex((s) => s.sectionId === selectedType);
      const newSection = {
        sectionId: selectedType,
        type: 'image',
        content: { imageUrl: formData.imageUrl },
      };

      if (sectionIndex !== -1) {
        newSections[sectionIndex] = newSection;
      } else {
        newSections.push(newSection);
      }

      const response = await api.put('https://editable-travel-website1-rpfv.vercel.app/api/ui-content/logo-favicon', { sections: newSections });
      console.log('Section saved:', response.data);
      setPageContent(response.data);
      setSuccess(`${selectedType === 'logo' ? 'Logo' : 'Favicon'} updated successfully`);
    } catch (err) {
      console.error('Error saving:', err);
      setError(`Failed to update ${selectedType}: ${err.response?.data?.message || err.message}`);
    }
  };

  const confirmDelete = async () => {
    try {
      let newSections = pageContent?.sections ? [...pageContent.sections] : [];
      const sectionIndex = newSections.findIndex((s) => s.sectionId === modal.id);
      if (sectionIndex !== -1) {
        newSections[sectionIndex] = {
          ...newSections[sectionIndex],
          content: { imageUrl: '' },
        };
      } else {
        newSections.push({
          sectionId: modal.id,
          type: 'image',
          content: { imageUrl: '' },
        });
      }
      const response = await api.put('https://editable-travel-website1-rpfv.vercel.app/api/ui-content/logo-favicon', { sections: newSections });
      setPageContent(response.data);
      setFormData({ imageUrl: '' });
      setSuccess(`${modal.id === 'logo' ? 'Logo' : 'Favicon'} removed successfully`);
    } catch (err) {
      console.error('Error during deletion:', err);
      setError(`Failed to delete: ${err.response?.data?.message || err.message}`);
    } finally {
      setModal({ isOpen: false, type: '', id: null, name: '' });
    }
  };

  const handleInitializeDefault = async () => {
    try {
      setLoading(true);
      const defaultSections = [
        {
          sectionId: 'logo',
          type: 'image',
          content: { imageUrl: '' },
        },
        {
          sectionId: 'favicon',
          type: 'image',
          content: { imageUrl: '' },
        },
      ];
      const response = await api.put('https://editable-travel-website1-rpfv.vercel.app/api/ui-content/logo-favicon', { sections: defaultSections });
      console.log('Default sections initialized:', response.data);
      setPageContent(response.data);
      setSelectedType('logo');
      setFormData({ imageUrl: '' });
      setSuccess('Default sections initialized successfully');
    } catch (error) {
      console.error('Initialization error:', error);
      setError(`Failed to initialize default sections: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !user?.isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <p className="text-xl text-[#074a5b]" style={{ fontFamily: 'Comic Sans MS, cursive' }}>
          Loading content...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: 'Comic Sans MS, cursive' }}>
      <ConfirmationModal
        isOpen={modal.isOpen}
        onClose={() => setModal({ isOpen: false, type: '', id: null, name: '' })}
        onConfirm={confirmDelete}
        title={`Delete ${modal.name}`}
        message={`Are you sure you want to delete ${modal.name}? This action cannot be undone.`}
      />
      <div className="container mx-auto p-6">
        <h1 className="text-4xl font-bold text-[#074a5b] mb-8" style={{ fontFamily: 'Comic Sans MS, cursive' }}>
          Logo & Favicon Management
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
            Manage {selectedType === 'logo' ? 'Logo' : 'Favicon'}
          </h2>
          {pageContent?.sections?.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-lg text-[#074a5b] mb-4" style={{ fontFamily: 'Comic Sans MS, cursive' }}>
                No sections found. Initialize default sections.
              </p>
              <button
                onClick={handleInitializeDefault}
                className="bg-[#1e809b] hover:bg-[#074a5b] text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300"
                style={{ fontFamily: 'Comic Sans MS, cursive' }}
              >
                Initialize Default Sections
              </button>
            </div>
          ) : (
            <form onSubmit={handleSave} className="grid grid-cols-1 gap-6">
              <div>
                <label className="block mb-2 text-[#074a5b] font-semibold" style={{ fontFamily: 'Comic Sans MS, cursive' }}>
                  Select Type
                </label>
                <select
                  value={selectedType}
                  onChange={(e) => {
                    setSelectedType(e.target.value);
                    const section = pageContent?.sections?.find((s) => s.sectionId === e.target.value);
                    setFormData({ imageUrl: section?.content?.imageUrl || '' });
                  }}
                  className="border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-[#1e809b] outline-none h-12 w-full md:w-1/3"
                  style={{ fontFamily: 'Comic Sans MS, cursive' }}
                >
                  {types.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block mb-2 text-[#074a5b] font-semibold" style={{ fontFamily: 'Comic Sans MS, cursive' }}>
                  {selectedType === 'logo' ? 'Logo Image' : 'Favicon Image'}
                </label>
                <div className="flex items-center">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-[#1e809b] outline-none h-12"
                    disabled={uploading}
                    style={{ fontFamily: 'Comic Sans MS, cursive' }}
                  />
                  {uploading && (
                    <span className="ml-2 text-gray-600" style={{ fontFamily: 'Comic Sans MS, cursive' }}>
                      Uploading...
                    </span>
                  )}
                </div>
                {formData.imageUrl && (
                  <div className="mt-2 relative inline-block">
                    <img
                      src={formData.imageUrl}
                      alt={selectedType === 'logo' ? 'Logo Preview' : 'Favicon Preview'}
                      className={selectedType === 'logo' ? 'w-32 h-32 object-contain rounded-xl border' : 'w-12 h-12 object-contain rounded-xl border'}
                      onError={(e) => (e.target.style.display = 'none')}
                    />
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="absolute top-2 right-2 bg-gray-800 hover:bg-gray-600 text-white rounded-full p-2 transition-all duration-300"
                      aria-label={`Remove ${selectedType}`}
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}
              </div>
              <div className="flex gap-4">
                <button
                  type="submit"
                  className="bg-[#1e809b] hover:bg-[#074a5b] text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300"
                  disabled={uploading}
                  style={{ fontFamily: 'Comic Sans MS, cursive' }}
                >
                  <Save size={16} className="inline mr-2" /> Save {selectedType === 'logo' ? 'Logo' : 'Favicon'}
                </button>
                {formData.imageUrl && (
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300"
                    style={{ fontFamily: 'Comic Sans MS, cursive' }}
                  >
                    <Trash2 size={16} className="inline mr-2" /> Delete {selectedType === 'logo' ? 'Logo' : 'Favicon'}
                  </button>
                )}
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default LogoFaviconManagement;
