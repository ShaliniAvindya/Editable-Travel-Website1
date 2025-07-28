import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, Plus, Edit, Trash2, Save, MapPin } from 'lucide-react';
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

const UIContentManagement = () => {
  const { user, api } = React.useContext(AuthContext);
  const navigate = useNavigate();
  const [pageContent, setPageContent] = useState(null);
  const [selectedPage, setSelectedPage] = useState('home');
  const [selectedSection, setSelectedSection] = useState('hero');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    imageUrl: '',
    buttonText: '',
    buttonLink: '',
    slides: [],
    reviews: [],
  });
  const [editingSlideIndex, setEditingSlideIndex] = useState(null);
  const [editingReviewIndex, setEditingReviewIndex] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [modal, setModal] = useState({ isOpen: false, type: '', id: null, name: '' });
  const [visibleItems, setVisibleItems] = useState({});

  // Check admin access
  useEffect(() => {
    if (!user || !user.isAdmin) {
      setError('Please log in as an admin to access this page.');
      navigate('/login', { state: { message: 'Admin access required' } });
    }
  }, [user, navigate]);

  // Auto-clear error/success messages
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

  // Fetch page content
  useEffect(() => {
    const fetchPageContent = async () => {
      try {
        setLoading(true);
        console.log(`Fetching content for page: ${selectedPage}`);
        const response = await api.get(`https://editable-travel-website1-rpfv.vercel.app/api/ui-content/${selectedPage}`);
        console.log('API Response:', response.data);
        setPageContent(response.data);
        const firstSectionId = response.data.sections[0]?.sectionId || 'hero';
        setSelectedSection(firstSectionId);
        handleSectionChange(firstSectionId, response.data);
      } catch (error) {
        console.error('Error fetching content:', error);
        setError(`Failed to load content: ${error.response?.data?.message || error.message}`);
      } finally {
        setLoading(false);
      }
    };
    if (user?.isAdmin) {
      fetchPageContent();
    }
  }, [selectedPage, user, api]);

  // Update formData when pageContent or selectedSection changes
  useEffect(() => {
    if (pageContent && selectedSection) {
      // For googleReviews, always update formData.reviews from fetched data
      if (selectedSection === 'googleReviews') {
        const section = pageContent.sections.find((s) => s.sectionId === 'googleReviews');
        setFormData({
          title: section?.content?.title || '',
          description: section?.content?.description || '',
          imageUrl: section?.content?.imageUrl || '',
          buttonText: section?.content?.buttonText || '',
          buttonLink: section?.content?.buttonLink || '',
          slides: Array.isArray(section?.content?.slides) ? section.content.slides : [],
          reviews: Array.isArray(section?.content?.reviews) ? section.content.reviews.map(review => ({
            name: review.name || '',
            text: review.text || '',
            date: review.date || '',
            avatar: review.avatar || '',
          })) : [],
        });
        setEditingSlideIndex(null);
        setEditingReviewIndex(null);
      } else {
        handleSectionChange(selectedSection, pageContent);
      }
    }
  }, [pageContent, selectedSection]);

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
  }, [pageContent]);

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

  const handleImageUpload = async (e, slideIndex = null) => {
    const files = Array.from(e.target.files).filter(
      (file) => file.type.startsWith('image/') && file.size <= 32 * 1024 * 1024
    );
    if (files.length === 0) {
      setError('Please upload valid image files (max 32MB each).');
      return;
    }
    const urls = (await Promise.all(files.map((file) => uploadImage(file)))).filter((url) => url);
    if (slideIndex !== null) {
      const newSlides = [...formData.slides];
      newSlides[slideIndex].imageUrl = urls[0] || newSlides[slideIndex].imageUrl;
      setFormData({ ...formData, slides: newSlides });
    } else {
      setFormData({ ...formData, imageUrl: urls[0] || formData.imageUrl });
    }
  };

  const handleRemoveImage = (slideIndex = null) => {
    if (slideIndex !== null) {
      const newSlides = [...formData.slides];
      newSlides[slideIndex].imageUrl = '';
      setFormData({ ...formData, slides: newSlides });
    } else {
      setFormData({ ...formData, imageUrl: '' });
    }
  };

  const handleSectionChange = (sectionId, content = pageContent) => {
    console.log('Switching to section:', sectionId, 'Content:', content);
    setSelectedSection(sectionId);
    const section = content?.sections?.find((s) => s.sectionId === sectionId);
    if (section) {
      console.log('Found section:', section);
      setFormData({
        title: section.content.title || '',
        description: section.content.description || '',
        imageUrl: section.content.imageUrl || '',
        buttonText: section.content.buttonText || '',
        buttonLink: section.content.buttonLink || '',
        slides: Array.isArray(section.content.slides) ? section.content.slides : [],
        reviews: Array.isArray(section.content.reviews) ? section.content.reviews.map(review => ({
          name: review.name || '',
          text: review.text || '',
          date: review.date || '',
          avatar: review.avatar || '',
        })) : [],
      });
    } else {
      console.log('Section not found, resetting formData');
      setFormData({
        title: '',
        description: '',
        imageUrl: '',
        buttonText: '',
        buttonLink: '',
        slides: [],
        reviews: [],
      });
    }
    setEditingSlideIndex(null);
    setEditingReviewIndex(null);
  };

  const handleAddSlide = (e) => {
    e.preventDefault();
    setFormData({
      ...formData,
      slides: [
        ...formData.slides,
        { title: '', description: '', imageUrl: '', buttonText: '', buttonLink: '' },
      ],
    });
    setEditingSlideIndex(formData.slides.length);
  };

  const handleEditSlide = (e, index) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingSlideIndex(index);
  };

  const handleCancelEditSlide = (e) => {
    e.preventDefault();
    setEditingSlideIndex(null);
  };

  const handleDeleteSlide = (index) => {
    setModal({
      isOpen: true,
      type: 'slide',
      id: index,
      name: `Slide ${index + 1}`,
    });
  };

  const handleAddReview = (e) => {
    e.preventDefault();
    const newReviews = [
      ...formData.reviews,
      { name: '', text: '', date: '', avatar: '' },
    ];
    setFormData({
      ...formData,
      reviews: newReviews,
    });
    setEditingReviewIndex(newReviews.length - 1);
  };

  const handleEditReview = (e, index) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingReviewIndex(index);
  };

  const handleCancelEditReview = (e) => {
    e.preventDefault();
    setEditingReviewIndex(null);
  };

  const handleDeleteReview = (index) => {
    setModal({
      isOpen: true,
      type: 'review',
      id: index,
      name: `Review ${index + 1}`,
    });
  };

  const confirmDelete = async () => {
    try {
      if (modal.type === 'slide') {
        const newSlides = formData.slides.filter((_, i) => i !== modal.id);
        setFormData({ ...formData, slides: newSlides });
        setEditingSlideIndex(null);
        setSuccess('Slide deleted successfully');
      } else if (modal.type === 'review') {
        const newReviews = formData.reviews.filter((_, i) => i !== modal.id);
        setFormData({ ...formData, reviews: newReviews });
        setEditingReviewIndex(null);
        setSuccess('Review deleted successfully');
      } else if (modal.type === 'section') {
        const newSections = pageContent.sections.filter((s) => s.sectionId !== modal.id);
        await api.put(`https://editable-travel-website1-rpfv.vercel.app/api/ui-content/${selectedPage}`, { sections: newSections });
        setPageContent({ ...pageContent, sections: newSections });
        const newSectionId = newSections[0]?.sectionId || 'hero';
        setSelectedSection(newSectionId);
        handleSectionChange(newSectionId, { ...pageContent, sections: newSections });
        setSuccess('Section deleted successfully');
      }
    } catch (error) {
      console.error('Error during deletion:', error);
      setError(`Failed to delete: ${error.response?.data?.message || error.message}`);
    } finally {
      setModal({ isOpen: false, type: '', id: null, name: '' });
    }
  };

  const handleSaveSection = async (e) => {
    e.preventDefault();
    try {
      console.log('Saving section:', selectedSection, 'FormData:', formData);
      const newSections = pageContent.sections.map((section) =>
        section.sectionId === selectedSection
          ? {
              ...section,
              content: {
                title: formData.title,
                description: formData.description,
                imageUrl: formData.imageUrl,
                buttonText: formData.buttonText,
                buttonLink: formData.buttonLink,
                slides: formData.slides,
                reviews: formData.reviews,
              },
            }
          : section
      );
      if (!pageContent.sections.find((s) => s.sectionId === selectedSection)) {
        newSections.push({
          sectionId: selectedSection,
          type: selectedSection === 'hero' ? 'hero' : selectedSection === 'googleReviews' ? 'googleReviews' : 'text',
          content: {
            title: formData.title,
            description: formData.description,
            imageUrl: formData.imageUrl,
            buttonText: formData.buttonText,
            buttonLink: formData.buttonLink,
            slides: formData.slides,
            reviews: formData.reviews,
          },
        });
      }
      const response = await api.put(`https://editable-travel-website1-rpfv.vercel.app/api/ui-content/${selectedPage}`, { sections: newSections });
      setPageContent(response.data);
      setSuccess('Section updated successfully');
      setEditingSlideIndex(null);
      setEditingReviewIndex(null);
      handleSectionChange(selectedSection, response.data);
    } catch (error) {
      console.error('Error saving section:', error);
      setError(`Failed to save section: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleDeleteSection = (sectionId, sectionName) => {
    setModal({
      isOpen: true,
      type: 'section',
      id: sectionId,
      name: sectionName,
    });
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      imageUrl: '',
      buttonText: '',
      buttonLink: '',
      slides: [],
      reviews: [],
    });
    setEditingSlideIndex(null);
    setEditingReviewIndex(null);
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
        title={`Delete ${modal.type === 'slide' ? 'Slide' : modal.type === 'review' ? 'Review' : 'Section'}`}
        message={`Are you sure you want to delete ${modal.name}? This action cannot be undone.`}
      />
      <div className="container mx-auto p-6">
        <h1 className="text-4xl font-bold mb-8 text-[#074a5b]" style={{ fontFamily: 'Comic Sans MS, cursive' }}>
          Home Page Management
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
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-[#074a5b]" style={{ fontFamily: 'Comic Sans MS, cursive' }}>
              Manage Content
            </h2>
          </div>

          <div className="mb-6">
            <label className="block mb-2 text-[#074a5b] font-semibold" style={{ fontFamily: 'Comic Sans MS, cursive' }}>
              Select Section
            </label>
            <select
              value={selectedSection}
              onChange={(e) => handleSectionChange(e.target.value)}
              className="border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none h-12 w-full md:w-1/3"
              style={{ fontFamily: 'Comic Sans MS, cursive' }}
            >
              <option value="hero">Hero Section</option>
              <option value="welcome">Welcome Section</option>
              <option value="offerings">Offerings Section</option>
              <option value="blog">Blog Section</option>
              <option value="googleReviews">Google Reviews Section</option>
            </select>
          </div>

          <form onSubmit={handleSaveSection} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {selectedSection === 'hero' && (
              <div className="col-span-2">
                <h3 className="text-xl font-semibold mb-4 text-[#074a5b]" style={{ fontFamily: 'Comic Sans MS, cursive' }}>
                  Hero Slides
                </h3>
                <button
                  type="button"
                  onClick={handleAddSlide}
                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-xl font-semibold transition-all mb-4"
                  style={{ fontFamily: 'Comic Sans MS, cursive' }}
                >
                  <Plus size={16} className="inline mr-2" /> Add Slide
                </button>
                {formData.slides.length === 0 && (
                  <p className="text-gray-600" style={{ fontFamily: 'Comic Sans MS, cursive' }}>
                    No slides added yet.
                  </p>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {formData.slides.map((slide, index) => (
                    <div
                      key={index}
                      data-animate
                      data-id={`slide-${index}`}
                      className={`bg-gray-50 rounded-2xl p-6 hover:shadow-lg transition-shadow duration-300 ${
                        visibleItems[`slide-${index}`] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                      }`}
                    >
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="text-lg font-bold text-[#074a5b]" style={{ fontFamily: 'Comic Sans MS, cursive' }}>
                          Slide {index + 1}
                        </h4>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={(e) => handleEditSlide(e, index)}
                            className="bg-yellow-500 hover:bg-yellow-600 text-white p-2 rounded-xl transition-all"
                            style={{ fontFamily: 'Comic Sans MS, cursive' }}
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteSlide(index)}
                            className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-xl transition-all"
                            style={{ fontFamily: 'Comic Sans MS, cursive' }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                      {editingSlideIndex === index && (
                        <div className="space-y-4">
                          <div>
                            <label className="block mb-2 text-[#074a5b] font-semibold" style={{ fontFamily: 'Comic Sans MS, cursive' }}>
                              Title
                            </label>
                            <input
                              type="text"
                              value={slide.title}
                              onChange={(e) => {
                                const newSlides = [...formData.slides];
                                newSlides[index].title = e.target.value;
                                setFormData({ ...formData, slides: newSlides });
                              }}
                              className="border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none h-12 w-full"
                              style={{ fontFamily: 'Comic Sans MS, cursive' }}
                            />
                          </div>
                          <div>
                            <label className="block mb-2 text-[#074a5b] font-semibold" style={{ fontFamily: 'Comic Sans MS, cursive' }}>
                              Description
                            </label>
                            <textarea
                              value={slide.description}
                              onChange={(e) => {
                                const newSlides = [...formData.slides];
                                newSlides[index].description = e.target.value;
                                setFormData({ ...formData, slides: newSlides });
                              }}
                              className="border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none w-full h-24"
                              style={{ fontFamily: 'Comic Sans MS, cursive' }}
                            />
                          </div>
                          <div>
                            <label className="block mb-2 text-[#074a5b] font-semibold" style={{ fontFamily: 'Comic Sans MS, cursive' }}>
                              Image
                            </label>
                            <div className="flex items-center">
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleImageUpload(e, index)}
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
                            {slide.imageUrl && (
                              <div className="mt-2 relative inline-block">
                                <img
                                  src={slide.imageUrl}
                                  alt={`Slide ${index + 1} Preview`}
                                  className="w-32 h-32 object-cover rounded-xl"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleRemoveImage(index)}
                                  className="absolute top-2 right-2 bg-gray-800 hover:bg-gray-600 text-white rounded-full p-2 transition-all duration-300"
                                  aria-label="Remove slide image"
                                >
                                  <X size={16} />
                                </button>
                              </div>
                            )}
                          </div>
                          <div>
                            <label className="block mb-2 text-[#074a5b] font-semibold" style={{ fontFamily: 'Comic Sans MS, cursive' }}>
                              Button Text
                            </label>
                            <input
                              type="text"
                              value={slide.buttonText}
                              onChange={(e) => {
                                const newSlides = [...formData.slides];
                                newSlides[index].buttonText = e.target.value;
                                setFormData({ ...formData, slides: newSlides });
                              }}
                              className="border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none h-12 w-full"
                              style={{ fontFamily: 'Comic Sans MS, cursive' }}
                            />
                          </div>
                          <div>
                            <label className="block mb-2 text-[#074a5b] font-semibold" style={{ fontFamily: 'Comic Sans MS, cursive' }}>
                              Button Link
                            </label>
                            <input
                              type="text"
                              value={slide.buttonLink}
                              onChange={(e) => {
                                const newSlides = [...formData.slides];
                                newSlides[index].buttonLink = e.target.value;
                                setFormData({ ...formData, slides: newSlides });
                              }}
                              className="border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none h-12 w-full"
                              style={{ fontFamily: 'Comic Sans MS, cursive' }}
                            />
                          </div>
                          <div className="flex gap-4">
                            <button
                              type="submit"
                              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-semibold transition-all"
                              style={{ fontFamily: 'Comic Sans MS, cursive' }}
                            >
                              Save Slide
                            </button>
                            <button
                              type="button"
                              onClick={handleCancelEditSlide}
                              className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-xl font-semibold transition-all"
                              style={{ fontFamily: 'Comic Sans MS, cursive' }}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedSection === 'googleReviews' && (
              <>
                <div>
                  <label className="block mb-2 text-[#074a5b] font-semibold" style={{ fontFamily: 'Comic Sans MS, cursive' }}>
                    Title
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none h-12 w-full"
                    style={{ fontFamily: 'Comic Sans MS, cursive' }}
                  />
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
              </>
            )}

            {['welcome', 'offerings', 'blog'].includes(selectedSection) && (
              <>
                <div>
                  <label className="block mb-2 text-[#074a5b] font-semibold" style={{ fontFamily: 'Comic Sans MS, cursive' }}>
                    Title
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none h-12 w-full"
                    style={{ fontFamily: 'Comic Sans MS, cursive' }}
                  />
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
                {selectedSection === 'blog' && (
                  <>
                    <div>
                      <label className="block mb-2 text-[#074a5b] font-semibold" style={{ fontFamily: 'Comic Sans MS, cursive' }}>
                        Button Text
                      </label>
                      <input
                        type="text"
                        value={formData.buttonText}
                        onChange={(e) => setFormData({ ...formData, buttonText: e.target.value })}
                        className="border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none h-12 w-full"
                        style={{ fontFamily: 'Comic Sans MS, cursive' }}
                      />
                    </div>
                    <div>
                      <label className="block mb-2 text-[#074a5b] font-semibold" style={{ fontFamily: 'Comic Sans MS, cursive' }}>
                        Button Link
                      </label>
                      <input
                        type="text"
                        value={formData.buttonLink}
                        onChange={(e) => setFormData({ ...formData, buttonLink: e.target.value })}
                        className="border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none h-12 w-full"
                        style={{ fontFamily: 'Comic Sans MS, cursive' }}
                      />
                    </div>
                  </>
                )}
              </>
            )}

            <div className="col-span-2 flex gap-4">
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300"
                disabled={uploading}
                style={{ fontFamily: 'Comic Sans MS, cursive' }}
              >
                <Save size={16} className="inline mr-2" /> Save Section
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-6 py-3 rounded-xl font-semibold transition-all duration-300"
                disabled={uploading}
                style={{ fontFamily: 'Comic Sans MS, cursive' }}
              >
                Cancel
              </button>
              {pageContent.sections.find((s) => s.sectionId === selectedSection) && (
                <button
                  type="button"
                  onClick={() => handleDeleteSection(selectedSection, selectedSection.charAt(0).toUpperCase() + selectedSection.slice(1) + ' Section')}
                  className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300"
                  style={{ fontFamily: 'Comic Sans MS, cursive' }}
                >
                  <Trash2 size={16} className="inline mr-2" /> Delete Section
                </button>
              )}
            </div>
          </form>
        </div>

        <div className="mb-12">
          <h2 className="text-2xl font-semibold mb-6 text-[#074a5b]" style={{ fontFamily: 'Comic Sans MS, cursive' }}>
            Sections Overview
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pageContent?.sections.map((section) => (
              <div
                key={section.sectionId}
                data-animate
                data-id={section.sectionId}
                className={`bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-500 transform ${
                  visibleItems[section.sectionId] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}
              >
                {(section.content.imageUrl || section.content.slides?.[0]?.imageUrl) && (
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={section.content.imageUrl || section.content.slides[0].imageUrl}
                      alt={section.content.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                  </div>
                )}
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-2 text-[#074a5b] hover:text-blue-600 transition-colors" style={{ fontFamily: 'Comic Sans MS, cursive' }}>
                    {section.content.title || section.sectionId.charAt(0).toUpperCase() + section.sectionId.slice(1)}
                  </h3>
                  <p className="text-gray-600 mb-3 flex items-center" style={{ fontFamily: 'Comic Sans MS, cursive' }}>
                    <MapPin size={16} className="mr-2 text-[#074a5b]" />
                    {section.type === 'hero' ? `${section.content.slides?.length || 0} Slides` : section.type === 'googleReviews' ? `${section.content.reviews?.length || 0} Reviews` : 'Text Section'}
                  </p>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => handleSectionChange(section.sectionId)}
                      className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-xl font-semibold transition-all"
                      style={{ fontFamily: 'Comic Sans MS, cursive' }}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteSection(section.sectionId, section.content.title || section.sectionId)}
                      className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl font-semibold transition-all"
                      style={{ fontFamily: 'Comic Sans MS, cursive' }}
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

export default UIContentManagement;
