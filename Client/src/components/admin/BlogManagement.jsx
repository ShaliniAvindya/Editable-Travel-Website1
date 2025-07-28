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
        <h3 className="text-lg font-semibold text-[#34495e] mb-4">{title}</h3>
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

const BlogManagement = () => {
  const { user, api } = useContext(AuthContext);
  const navigate = useNavigate();
  const [blogs, setBlogs] = useState([]);
  const [selectedBlog, setSelectedBlog] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    publish_date: '',
    images: [],
    videos: '',
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

  // Authentication check
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

  // Success timeout
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  // Fetch blogs
  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        setLoading(true);
        const response = await api.get('https://editable-travel-website1-rpfv.vercel.app/api/blogs');
        console.log('Fetched blogs:', response.data);
        setBlogs(response.data);
      } catch (err) {
        console.error('Fetch error:', err);
        setError(`Failed to load blogs: ${err.response?.data?.msg || err.message}`);
      } finally {
        setLoading(false);
      }
    };
    if (user) {
      fetchBlogs();
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
        videos: formData.videos
          ? formData.videos.split(',').map(item => item.trim()).filter(item => item)
          : [],
        tags: formData.tags
          ? formData.tags.split(',').map(item => item.trim()).filter(item => item)
          : [],
        author: formData.author?.trim() || '',
        content: contentList,
      };
      console.log('Submitting blog payload:', data);
      let response;
      if (selectedBlog) {
        response = await api.put(`https://editable-travel-website1-rpfv.vercel.app/api/blogs/${selectedBlog._id}`, data);
        setBlogs(blogs.map(b => b._id === selectedBlog._id ? response.data : b));
        setSuccess('Blog updated successfully');
      } else {
        response = await api.post('https://editable-travel-website1-rpfv.vercel.app/api/blogs', data);
        setBlogs([...blogs, response.data]);
        setSuccess('Blog created successfully');
      }
      resetForm();
    } catch (err) {
      console.error('Submit error:', err);
      setError(`Failed to save blog: ${err.response?.data?.msg || err.message}`);
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
        const response = await api.put(`https://editable-travel-website1-rpfv.vercel.app/api/blogs/${selectedBlog._id}`, data);
        console.log('Content saved to database:', response.data.content);
        setBlogs(blogs.map(b => b._id === selectedBlog._id ? response.data : b));
        setSuccess(editingContentIndex !== null ? 'Content section updated' : 'Content section added');
      } else {
        setSuccess(editingContentIndex !== null ? 'Content section updated' : 'Content section added');
      }
      resetContentForm();
    } catch (err) {
      console.error('Content submit error:', err);
      setError(`Failed to save content section: ${err.response?.data?.msg || err.message}`);
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

  const confirmDelete = async () => {
    try {
      if (!isValidId(modal.id)) {
        console.error('Invalid blog ID:', modal.id);
        setError('Invalid blog ID');
        return;
      }
      await api.delete(`https://editable-travel-website1-rpfv.vercel.app/api/blogs/${modal.id}`);
      setBlogs(blogs.filter(b => b._id !== modal.id));
      setSuccess('Blog deleted successfully');
      resetForm();
    } catch (err) {
      console.error('Delete error:', err);
      setError(`Failed to delete blog: ${err.response?.data?.msg || err.message}`);
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

      // Update database if editing an existing blog
      if (selectedBlog && isValidId(selectedBlog._id)) {
        const data = { content: updatedContentList };
        console.log('Deleting content payload:', data);
        const response = await api.put(`https://editable-travel-website1-rpfv.vercel.app/api/blogs/${selectedBlog._id}`, data);
        console.log('Content updated in database:', response.data.content);
        setBlogs(blogs.map(b => b._id === selectedBlog._id ? response.data : b));
      }
      setSuccess('Content section deleted successfully');
    } catch (err) {
      console.error('Content delete error:', err);
      setError(`Failed to delete content section: ${err.response?.data?.msg || err.message}`);
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
      publish_date: new Date(blog.publish_date).toISOString().split('T')[0],
      images: blog.images || [],
      videos: blog.videos?.join(', ') || '',
      tags: blog.tags?.join(', ') || '',
      author: blog.author || '',
    });
    setContentList(blog.content || []);
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
      videos: '',
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

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white" style={{ fontFamily: 'Comic Sans MS, cursive' }}>
        <p className="text-xl text-[#34495e]">Loading blogs...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: 'Comic Sans MS, cursive' }}>
      <ConfirmationModal
        isOpen={modal.isOpen}
        onClose={closeModal}
        onConfirm={confirmDelete}
        title="Delete Blog"
        message={`Are you sure you want to delete ${modal.name}? This action cannot be undone.`}
      />
      <div className="container mx-auto p-6">
        <h1 className="text-4xl font-bold mb-8 text-[#34495e]">Blog Management</h1>

        {error && <div className="bg-red-100 text-red-700 p-4 mb-6 rounded-lg">{error}</div>}
        {success && <div className="bg-green-100 text-green-700 p-4 mb-6 rounded-lg">{success}</div>}

        {/* Blog Form */}
        <div className="mb-12 p-6 bg-white rounded-2xl shadow-lg">
          <h2 className="text-2xl font-semibold mb-6 text-[#34495e]">
            {selectedBlog ? 'Edit Blog' : 'Add New Blog'}
          </h2>
          <form onSubmit={handleBlogSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block mb-2 text-[#34495e] font-semibold">Blog Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none h-12 w-full"
                required
              />
            </div>
            <div>
              <label className="block mb-2 text-[#34495e] font-semibold">Publish Date</label>
              <input
                type="date"
                value={formData.publish_date}
                onChange={(e) => setFormData({ ...formData, publish_date: e.target.value })}
                className="border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none h-12 w-full"
                required
              />
            </div>
            <div>
              <label className="block mb-2 text-[#34495e] font-semibold">Author</label>
              <input
                type="text"
                value={formData.author}
                onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                className="border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none h-12 w-full"
              />
            </div>
            <div>
              <label className="block mb-2 text-[#34495e] font-semibold">Tags (comma-separated)</label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                className="border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none h-12 w-full"
              />
            </div>
            <div>
              <label className="block mb-2 text-[#34495e] font-semibold">Video URLs (comma-separated)</label>
              <input
                type="text"
                value={formData.videos}
                onChange={(e) => setFormData({ ...formData, videos: e.target.value })}
                className="border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none h-12 w-full"
              />
            </div>
            <div className="col-span-1">
              <label className="block mb-2 text-[#34495e] font-semibold">Blog Images</label>
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
          <h2 className="text-2xl font-semibold mb-6 text-[#34495e]">Blogs</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {blogs.map((blog) => (
              <div
                key={blog._id}
                className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-500"
              >
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={getSafeImageUrl(blog.images[0])}
                    alt={blog.title}
                    className="w-full h-full object-cover"
                    onError={() => console.error(`Failed to load image for blog ${blog.title}: ${blog.images[0]}`)}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-2 text-[#34495e] hover:text-blue-600 transition-colors">
                    {blog.title}
                  </h3>
                  <p className="text-gray-600 mb-3">Author: {blog.author || 'Unknown'}</p>
                  <p className="text-gray-600 mb-3">Published: {new Date(blog.publish_date).toLocaleDateString()}</p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleEditBlog(blog)}
                      className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-xl font-semibold transition-all"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteBlog(blog._id, blog.title)}
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

        {/* Content Section Management */}
        <div className={selectedBlog ? 'block' : 'hidden'}>
          <div className="mb-12 p-6 bg-white rounded-2xl shadow-lg">
            <h2 className="text-2xl font-semibold mb-6 text-[#34495e]">Manage Content Sections</h2>
            <form onSubmit={handleContentSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block mb-2 text-[#34495e] font-semibold">Heading</label>
                <input
                  type="text"
                  value={contentForm.heading}
                  onChange={(e) => setContentForm({ ...contentForm, heading: e.target.value })}
                  className="border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none h-12 w-full"
                  required
                />
              </div>
              <div>
                <label className="block mb-2 text-[#34495e] font-semibold">Section Image</label>
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
                      className="w-32 h-32 object-cover rounded-lg"
                      onError={() => console.error(`Failed to load image: ${contentForm.image}`)}
                    />
                    <button
                      type="button"
                      onClick={() => setContentForm((prev) => ({ ...prev, image: '' }))}
                      className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}
              </div>
              <div className="col-span-2">
                <label className="block mb-2 text-[#34495e] font-semibold">Text</label>
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

            {/* Content List */}
            <h3 className="text-xl font-semibold mb-4 text-[#34495e]">Content Sections</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {contentList.map((content, index) => (
                <div
                  key={index}
                  className="p-4 bg-gray-100 rounded-lg shadow hover:shadow-md transition-all duration-300"
                >
                  <h4 className="text-lg font-bold text-[#34495e]">{content.heading || 'No Heading'}</h4>
                  {content.image && (
                    <img
                      src={getSafeImageUrl(content.image)}
                      alt={`Content ${index}`}
                      className="w-24 h-24 object-cover rounded-lg my-2"
                      onError={() => console.error(`Failed to load image: ${content.image}`)}
                    />
                  )}
                  <p className="text-gray-600 truncate">{content.text || 'No Text'}</p>
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => handleEditContent(index)}
                      className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-xl font-semibold transition-all"
                      disabled={submittingContent}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteContent(index)}
                      className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl font-semibold transition-all"
                      disabled={submittingContent}
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
