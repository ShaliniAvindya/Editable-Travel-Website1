import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import { FaRegClone, FaToggleOn, FaToggleOff } from 'react-icons/fa';
import { AuthContext } from '../context/AuthContext';

const imgbbAxios = axios.create();

const MAX_VIDEO_SIZE = 100 * 1024 * 1024;

// Confirmation Modal Component
const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold text-[#074a5b] mb-4" style={{ fontFamily: "'Comic Sans MS', 'Comic Neue'" }}>{title}</h3>
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

// Upload Progress Modal
const UploadProgressModal = ({ isOpen, progress }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold text-[#074a5b] mb-4" style={{ fontFamily: "'Comic Sans MS', 'Comic Neue'" }}>Uploading Videos</h3>
        {Object.entries(progress).map(([name, perc]) => (
          <div key={name} className="mb-4">
            <p className="text-gray-600 mb-1" style={{ fontFamily: "'Comic Sans MS', 'Comic Neue'" }}>{name}: {perc}%</p>
            <div className="bg-gray-200 rounded-full h-2.5">
              <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${perc}%` }}></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const BlogManagement = () => {
  const { user, api, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [blogs, setBlogs] = useState([]);
  const [selectedBlog, setSelectedBlog] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    publish_date: '',
    images: [],
    videos: [],
    tags: '',
    author: '',
  });
  const [contentForm, setContentForm] = useState({
    heading: '',
    image: '',
    text: '',
  });
  const [editingContentIndex, setEditingContentIndex] = useState(null);
  const [contentList, setContentList] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [submittingContent, setSubmittingContent] = useState(false);
  const [modal, setModal] = useState({ isOpen: false, id: null, name: '' });
  const [notification, setNotification] = useState('');
  const [visibleItems, setVisibleItems] = useState({});
  const [uploadProgress, setUploadProgress] = useState({});

  // Authentication check
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
    if (notification) {
      const timer = setTimeout(() => setNotification(''), 2500);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Fetch blogs
  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        setLoading(true);
        const cacheBuster = new Date().getTime();
        const response = await api.get(`/api/blogs?all=true&_cb=${cacheBuster}`);
        console.log('Fetched blogs:', response.data);
        setBlogs(response.data);
      } catch (err) {
        console.error('Fetch error:', err);
        if (err.response?.status === 401 || err.response?.status === 403) {
          setError('Unauthorized: Please log in as an admin.');
          logout();
          navigate('/login', { state: { message: 'Admin access required' } });
        } else {
          setError(`Failed to load blogs: ${err.response?.data?.msg || err.message}`);
        }
      } finally {
        setLoading(false);
      }
    };
    if (user?.isAdmin) {
      fetchBlogs();
    }
  }, [user, api, logout, navigate]);

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
  }, [blogs]);

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

  const handleVideoUpload = async (e) => {
    const files = Array.from(e.target.files).filter(
      (file) => file.type.startsWith('video/') && file.size <= MAX_VIDEO_SIZE
    );
    if (files.length === 0) {
      setError('Please upload valid video files (max 100MB each).');
      return;
    }
    setUploading(true);
    const uploadPromises = files.map(async (file) => {
      setUploadProgress((prev) => ({ ...prev, [file.name]: 0 }));
      const formDataVid = new FormData();
      formDataVid.append('video', file);
      try {
        const response = await api.post('/api/blogs/upload/video', formDataVid, {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (progressEvent) => {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress((prev) => ({ ...prev, [file.name]: percent }));
          },
        });
        setUploadProgress((prev) => {
          const newProgress = { ...prev };
          delete newProgress[file.name];
          return newProgress;
        });
        return response.data.url;
      } catch (err) {
        console.error('Video upload failed:', err);
        setError(`Video upload failed for ${file.name}: ${err.response?.data?.msg || err.message}`);
        setUploadProgress((prev) => {
          const newProgress = { ...prev };
          delete newProgress[file.name];
          return newProgress;
        });
        return null;
      }
    });
    const urls = (await Promise.all(uploadPromises)).filter((url) => url);
    setFormData((prev) => ({ ...prev, videos: [...prev.videos, ...urls] }));
    setUploading(false);
  };

  const handleRemoveMainImage = (index) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const handleRemoveVideo = (index) => {
    setFormData((prev) => ({
      ...prev,
      videos: prev.videos.filter((_, i) => i !== index),
    }));
  };

  const handleContentImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !file.type.startsWith('image/') || file.size > 32 * 1024 * 1024) {
      setError('Please upload a valid image file (max 32MB).');
      return;
    }
    const url = await uploadImage(file);
    if (url) {
      setContentForm((prev) => ({ ...prev, image: url }));
    }
  };

  const handleRemoveContentImage = () => {
    setContentForm((prev) => ({ ...prev, image: '' }));
  };

  // Handle blog form submission
  const handleBlogSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!formData.title || !formData.publish_date) {
        setError('Please fill in all required fields');
        return;
      }
      if (selectedBlog && !isValidId(selectedBlog._id)) {
        console.error('Invalid blog ID:', selectedBlog._id);
        setError('Invalid blog ID');
        return;
      }
      const data = {
        title: formData.title.trim(),
        publish_date: new Date(formData.publish_date),
        images: formData.images || [],
        videos: formData.videos || [],
        tags: formData.tags
          ? formData.tags.split(',').map(item => item.trim()).filter(item => item)
          : [],
        author: formData.author?.trim() || '',
        content: contentList,
      };
      console.log('Submitting blog payload:', data);
      let response;
      if (selectedBlog) {
        response = await api.put(`/api/blogs/${selectedBlog._id}`, data);
        setBlogs(blogs.map(b => b._id === selectedBlog._id ? response.data : b));
        setSuccess('Blog updated successfully');
      } else {
        response = await api.post('/api/blogs', data);
        setBlogs([...blogs, response.data]);
        setSuccess('Blog created successfully');
      }
      resetForm();
    } catch (err) {
      console.error('Submit error:', err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        setError('Unauthorized: Please log in as an admin.');
        logout();
        navigate('/login', { state: { message: 'Admin access required' } });
      } else {
        setError(`Failed to save blog: ${err.response?.data?.msg || err.message}`);
      }
    }
  };

  // Handle content form submission
  const handleContentSubmit = async (e) => {
    e.preventDefault();
    if (!contentForm.heading || !contentForm.text) {
      setError('Please fill in heading and text for content section');
      return;
    }
    try {
      setSubmittingContent(true);
      let updatedContentList = [...contentList];
      if (editingContentIndex !== null) {
        updatedContentList[editingContentIndex] = contentForm;
      } else {
        updatedContentList.push(contentForm);
      }
      setContentList(updatedContentList);

      if (selectedBlog && isValidId(selectedBlog._id)) {
        const data = { content: updatedContentList };
        console.log('Submitting content payload:', data);
        const response = await api.put(`/api/blogs/${selectedBlog._id}`, data);
        console.log('Content saved to database:', response.data.content);
        setBlogs(blogs.map(b => b._id === selectedBlog._id ? response.data : b));
        setSuccess(editingContentIndex !== null ? 'Content section updated' : 'Content section added');
      } else {
        setSuccess(editingContentIndex !== null ? 'Content section updated' : 'Content section added');
      }
      resetContentForm();
    } catch (err) {
      console.error('Content submit error:', err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        setError('Unauthorized: Please log in as an admin.');
        logout();
        navigate('/login', { state: { message: 'Admin access required' } });
      } else {
        setError(`Failed to save content section: ${err.response?.data?.msg || err.message}`);
      }
    } finally {
      setSubmittingContent(false);
    }
  };

  // Delete blog
  const handleDeleteBlog = (id, name) => {
    if (!isValidId(id)) {
      console.error('Invalid blog ID:', id);
      setError('Invalid blog ID');
      return;
    }
    setModal({ isOpen: true, id, name });
  };

  // Duplicate blog
  const handleDuplicateBlog = async (id) => {
    if (!isValidId(id)) {
      console.error('Invalid blog ID:', id);
      setError('Invalid blog ID');
      return;
    }
    try {
      const response = await api.post(`/api/blogs/duplicate/${id}`);
      setBlogs([...blogs, response.data]);
      setNotification('Blog duplicated successfully');
      setSuccess('Blog duplicated successfully');
    } catch (err) {
      console.error('Duplicate error:', err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        setError('Unauthorized: Please log in as an admin.');
        logout();
        navigate('/login', { state: { message: 'Admin access required' } });
      } else {
        setError(`Failed to duplicate blog: ${err.response?.data?.msg || err.message}`);
      }
    }
  };

  // Toggle blog status
  const handleToggleStatus = async (id, currentStatus) => {
    if (!isValidId(id)) {
      console.error('Invalid blog ID:', id);
      setError('Invalid blog ID');
      return;
    }
    try {
      const response = await api.put(`/api/blogs/status/${id}`, { status: !currentStatus });
      setBlogs(blogs.map(b => b._id === id ? { ...b, status: response.data.status } : b));
      setSuccess(`Blog ${currentStatus ? 'deactivated' : 'activated'} successfully`);
    } catch (err) {
      console.error('Toggle status error:', err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        setError('Unauthorized: Please log in as an admin.');
        logout();
        navigate('/login', { state: { message: 'Admin access required' } });
      } else {
        setError(`Failed to update blog status: ${err.response?.data?.msg || err.message}`);
      }
    }
  };

  const confirmDelete = async () => {
    try {
      if (!isValidId(modal.id)) {
        console.error('Invalid blog ID:', modal.id);
        setError('Invalid blog ID');
        return;
      }
      await api.delete(`/api/blogs/${modal.id}`);
      setBlogs(blogs.filter(b => b._id !== modal.id));
      setSuccess('Blog deleted successfully');
      resetForm();
    } catch (err) {
      console.error('Delete error:', err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        setError('Unauthorized: Please log in as an admin.');
        logout();
        navigate('/login', { state: { message: 'Admin access required' } });
      } else {
        setError(`Failed to delete blog: ${err.response?.data?.msg || err.message}`);
      }
    } finally {
      setModal({ isOpen: false, id: null, name: '' });
    }
  };

  const closeModal = () => {
    setModal({ isOpen: false, id: null, name: '' });
  };

  // Delete content section
  const handleDeleteContent = async (index) => {
    try {
      const updatedContentList = contentList.filter((_, i) => i !== index);
      setContentList(updatedContentList);

      if (selectedBlog && isValidId(selectedBlog._id)) {
        const data = { content: updatedContentList };
        console.log('Deleting content payload:', data);
        const response = await api.put(`/api/blogs/${selectedBlog._id}`, data);
        console.log('Content updated in database:', response.data.content);
        setBlogs(blogs.map(b => b._id === selectedBlog._id ? response.data : b));
      }
      setSuccess('Content section deleted successfully');
    } catch (err) {
      console.error('Content delete error:', err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        setError('Unauthorized: Please log in as an admin.');
        logout();
        navigate('/login', { state: { message: 'Admin access required' } });
      } else {
        setError(`Failed to delete content section: ${err.response?.data?.msg || err.message}`);
      }
    }
  };

  // Edit blog
  const handleEditBlog = (blog) => {
    if (!isValidId(blog._id)) {
      console.error('Invalid blog ID:', blog._id);
      setError('Invalid blog ID');
      return;
    }
    console.log('Editing blog:', blog);
    setSelectedBlog(blog);
    setFormData({
      title: blog.title,
      publish_date: new Date(blog.publish_date).toISOString().slice(0, 16),
      images: blog.images || [],
      videos: blog.videos || [],
      tags: blog.tags?.join(', ') || '',
      author: blog.author || '',
    });
    setContentList(blog.content || []); // Set contentList directly, as in the first code
  };

  // Edit content section
  const handleEditContent = (index) => {
    setEditingContentIndex(index);
    setContentForm(contentList[index]);
  };

  // Reset forms
  const resetForm = () => {
    console.log('Resetting form:', { formData, contentList });
    setFormData({
      title: '',
      publish_date: '',
      images: [],
      videos: [],
      tags: '',
      author: '',
    });
    setContentList([]);
    setSelectedBlog(null);
    setError('');
    setSuccess('');
  };

  const resetContentForm = () => {
    console.log('Resetting content form:', contentForm);
    setContentForm({
      heading: '',
      image: '',
      text: '',
    });
    setEditingContentIndex(null);
    setError('');
    setSuccess('');
  };

  const getBlogStatusLabel = (blog) => {
    const now = new Date();
    const pubDate = new Date(blog.publish_date);
    if (!blog.status) {
      return 'Inactive';
    } else if (pubDate > now) {
      return `Scheduled for ${pubDate.toLocaleString()}`;
    } else {
      return 'Published';
    }
  };

  const isUploadingVideos = Object.keys(uploadProgress).length > 0;

  if (loading || !user?.isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white" style={{ fontFamily: "'Comic Sans MS', 'Comic Neue'" }}>
        <p className="text-xl text-[#074a5b]">Loading blogs...</p>
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
      <ConfirmationModal
        isOpen={modal.isOpen}
        onClose={closeModal}
        onConfirm={confirmDelete}
        title="Delete Blog"
        message={`Are you sure you want to delete ${modal.name}? This action cannot be undone.`}
      />
      <UploadProgressModal isOpen={isUploadingVideos} progress={uploadProgress} />
      <div className="container mx-auto p-6">
        <h1 className="text-4xl font-bold mb-8 text-[#074a5b]">Blog Management</h1>

        {error && <div className="bg-red-100 text-red-700 p-4 mb-6 rounded-xl">{error}</div>}
        {success && <div className="bg-green-100 text-green-700 p-4 mb-6 rounded-xl">{success}</div>}

        {/* Blog Form */}
        <div className="mb-12 p-6 bg-white rounded-2xl shadow-lg">
          <h2 className="text-2xl font-semibold mb-6 text-[#074a5b]">
            {selectedBlog ? 'Edit Blog' : 'Add New Blog'}
          </h2>
          <form onSubmit={handleBlogSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block mb-2 text-[#074a5b] font-semibold">Blog Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none h-12 w-full"
                required
              />
            </div>
            <div>
              <label className="block mb-2 text-[#074a5b] font-semibold">Schedule the Blog - Date & Time</label>
              <input
                type="datetime-local"
                value={formData.publish_date}
                onChange={(e) => setFormData({ ...formData, publish_date: e.target.value })}
                className="border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none h-12 w-full"
                required
              />
            </div>
            <div>
              <label className="block mb-2 text-[#074a5b] font-semibold">Author</label>
              <input
                type="text"
                value={formData.author}
                onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                className="border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none h-12 w-full"
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
              <label className="block mb-2 text-[#074a5b] font-semibold">Blog Images</label>
              <div className="flex items-center">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="border border-gray-200 giant rounded-xl focus:ring-2 focus:ring-blue-500 outline-none h-12"
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
                      className="w-32 h-32 object-cover rounded-xl"
                      onError={(e) => (e.target.src = 'https://via.placeholder.com/400')}
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveMainImage(index)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                      aria-label={`Remove image ${index + 1}`}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <div className="col-span-1">
              <label className="block mb-2 text-[#074a5b] font-semibold">Blog Videos</label>
              <div className="flex items-center">
                <input
                  type="file"
                  accept="video/*"
                  multiple
                  onChange={handleVideoUpload}
                  className="border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none h-12"
                  disabled={uploading}
                />
                {uploading && <span className="ml-2 text-gray-600">Uploading...</span>}
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {formData.videos.map((vid, index) => (
                  <div key={index} className="relative">
                    <img
                      src={vid.replace(/\.\w+$/, '.jpg')}
                      alt={`Video Preview ${index}`}
                      className="w-32 h-32 object-cover rounded-xl"
                      onError={(e) => (e.target.src = 'https://via.placeholder.com/400?text=Video')}
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveVideo(index)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                      aria-label={`Remove video ${index + 1}`}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <div className="col-span-2 flex gap-4">
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300"
                disabled={uploading}
              >
                {selectedBlog ? 'Update Blog' : 'Add Blog'}
              </button>
              {selectedBlog && (
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

        {/* Blog List */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold mb-6 text-[#074a5b]">Blogs</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {blogs.map((blog) => (
              <div
                key={blog._id}
                data-animate
                data-id={blog._id}
                className={`bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-500 transform ${
                  visibleItems[blog._id] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}
              >
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={getSafeImageUrl(blog.images[0])}
                    alt={blog.title}
                    className="w-full h-full object-cover"
                    onError={(e) => (e.target.src = 'https://via.placeholder.com/400')}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-2 text-[#074a5b] hover:text-blue-600 transition-colors">
                    {blog.title}
                  </h3>
                  <p className="text-gray-600 mb-3">Author: {blog.author || 'Unknown'}</p>
                  <p className="text-gray-600 mb-3">Publish Date: {new Date(blog.publish_date).toLocaleString()}</p>
                  <p className="text-gray-600 mb-3">Status: {getBlogStatusLabel(blog)}</p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleEditBlog(blog)}
                      className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-xl font-semibold transition-all"
                      aria-label={`Edit blog ${blog.title}`}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteBlog(blog._id, blog.title)}
                      className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl font-semibold transition-all"
                      aria-label={`Delete blog ${blog.title}`}
                    >
                      Delete
                    </button>
                    <button
                      onClick={() => handleDuplicateBlog(blog._id)}
                      className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-xl font-semibold transition-all"
                      aria-label={`Duplicate blog ${blog.title}`}
                    >
                      <FaRegClone size={18} />
                    </button>
                    <button
                      onClick={() => handleToggleStatus(blog._id, blog.status)}
                      className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-xl font-semibold transition-all"
                      aria-label={blog.status ? `Deactivate blog ${blog.title}` : `Activate blog ${blog.title}`}
                    >
                      {blog.status ? <FaToggleOn color="green" size={22} /> : <FaToggleOff color="gray" size={22} />}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Content Section Management */}
        <div className={selectedBlog ? 'block' : 'hidden'}>
          <div className="mb-12 p-6 bg-white rounded-2xl shadow-lg">
            <h2 className="text-2xl font-semibold mb-6 text-[#074a5b]">Manage Content Sections</h2>
            <form onSubmit={handleContentSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block mb-2 text-[#074a5b] font-semibold">Heading</label>
                <input
                  type="text"
                  value={contentForm.heading}
                  onChange={(e) => setContentForm({ ...contentForm, heading: e.target.value })}
                  className="border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none h-12 w-full"
                  required
                />
              </div>
              <div>
                <label className="block mb-2 text-[#074a5b] font-semibold">Section Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleContentImageUpload}
                  className="border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none h-12"
                  disabled={uploading || submittingContent}
                />
                {contentForm.image && (
                  <div className="mt-2 relative inline-block">
                    <img
                      src={getSafeImageUrl(contentForm.image)}
                      alt="Section Preview"
                      className="w-32 h-32 object-cover rounded-xl"
                      onError={(e) => (e.target.src = 'https://via.placeholder.com/400')}
                    />
                    <button
                      type="button"
                      onClick={handleRemoveContentImage}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                      aria-label="Remove section image"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}
              </div>
              <div className="col-span-2">
                <label className="block mb-2 text-[#074a5b] font-semibold">Text</label>
                <textarea
                  value={contentForm.text}
                  onChange={(e) => setContentForm({ ...contentForm, text: e.target.value })}
                  className="border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none w-full h-24"
                  required
                />
              </div>
              <div className="col-span-2 flex gap-4">
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300"
                  disabled={uploading || submittingContent}
                >
                  {editingContentIndex !== null ? 'Update Section' : 'Add Section'}
                  {submittingContent && <span className="ml-2">Saving...</span>}
                </button>
                {editingContentIndex !== null && (
                  <button
                    type="button"
                    onClick={resetContentForm}
                    className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-6 py-3 rounded-xl font-semibold transition-all duration-300"
                    disabled={uploading || submittingContent}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>

            <h3 className="text-xl font-semibold mb-4 text-[#074a5b]">Content Sections</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {contentList.map((content, index) => (
                <div
                  key={index}
                  className="p-4 bg-gray-100 rounded-lg shadow hover:shadow-md transition-all duration-300"
                >
                  <h4 className="text-lg font-bold text-[#074a5b]">{content.heading || 'No Heading'}</h4>
                  {content.image && (
                    <img
                      src={getSafeImageUrl(content.image)}
                      alt={`Content ${index}`}
                      className="w-24 h-24 object-cover rounded-lg my-2"
                      onError={(e) => (e.target.src = 'https://via.placeholder.com/400')}
                    />
                  )}
                  <p className="text-gray-600 truncate">{content.text || 'No Text'}</p>
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => handleEditContent(index)}
                      className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-xl font-semibold transition-all"
                      disabled={submittingContent}
                      aria-label={`Edit content section ${index + 1}`}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteContent(index)}
                      className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl font-semibold transition-all"
                      disabled={submittingContent}
                      aria-label={`Delete content section ${index + 1}`}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlogManagement;
