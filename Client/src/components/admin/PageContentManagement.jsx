import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { X, Save, Trash2, Download, Youtube, Music2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
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

const PageContentManagement = () => {
  const { user, api } = useContext(AuthContext);
  const navigate = useNavigate();
  const [pageContent, setPageContent] = useState(null);
  const [selectedPage, setSelectedPage] = useState('accommodations');
  const [selectedSection, setSelectedSection] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    imageUrl: '',
    buttonText: '',
    callPhone: '',
    whatsappPhone: '',
    callPhoneLabel: '',
    whatsappPhoneLabel: '',
    email: '',
    emailLabel: '',
    address: '',
    addressLabel: '',
    facebook: '',
    instagram: '',
    youtube: '',
    tiktok: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [modal, setModal] = useState({ isOpen: false, type: '', id: null, name: '' });
  const [visibleItems, setVisibleItems] = useState({});

  const pages = [
    { id: 'accommodations', name: 'Accommodations' },
    { id: 'activities', name: 'Activities' },
    { id: 'packages', name: 'Packages' },
    { id: 'blogs', name: 'Blogs' },
    { id: 'contact', name: 'Contact' },
    { id: 'legal', name: 'Legal' },
  ];

  // ReactQuill toolbar options for legal page
  const quillModules = {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ['bold', 'italic', 'underline'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      ['link'],
      ['clean'],
    ],
  };

  // Convert HTML to LaTeX
  const htmlToLatex = (html) => {
    let latex = html
      .replace(/<h1>(.*?)<\/h1>/g, '\\section{$1}\n')
      .replace(/<h2>(.*?)<\/h2>/g, '\\subsection{$1}\n')
      .replace(/<h3>(.*?)<\/h3>/g, '\\subsubsection{$1}\n')
      .replace(/<p>(.*?)<\/p>/g, '$1\n\n')
      .replace(/<strong>(.*?)<\/strong>/g, '\\textbf{$1}')
      .replace(/<em>(.*?)<\/em>/g, '\\textit{$1}')
      .replace(/<ul>\s*(.*?)\s*<\/ul>/gs, '\\begin{itemize}\n$1\n\\end{itemize}\n')
      .replace(/<li>(.*?)<\/li>/g, '\\item $1\n')
      .replace(/<a href="(.*?)">(.*?)<\/a>/g, '\\href{$1}{$2}')
      .replace(/ /g, '~')
      .replace(/<[^>]+>/g, '') // Strip unsupported tags
      .replace(/\n\s*\n/g, '\n\n'); // Normalize newlines
    return latex;
  };

  // Download LaTeX content as a .tex file for PDF compilation
  const handleDownload = (sectionId, content) => {
    const fileName = sectionId === 'gtc' ? 'gtc.tex' : 'privacy-policy.tex';
    const title = sectionId === 'gtc' ? 'General Terms \\& Conditions' : 'Privacy Policy';
    const latexContent = `
\\documentclass{article}
\\usepackage[utf8]{inputenc}
\\usepackage{geometry}
\\usepackage{hyperref}
\\usepackage{fontspec}
\\setmainfont{Noto Serif}
\\geometry{a4paper, margin=1in}
\\hypersetup{
  colorlinks=true,
  linkcolor=blue,
  urlcolor=blue
}
\\begin{document}
\\title{${title}}
\\maketitle
${htmlToLatex(content.description || 'No content available.')}
\\end{document}
    `;
    const blob = new Blob([latexContent], { type: 'text/x-tex' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Check admin access
  useEffect(() => {
    if (!user || !user.isAdmin) {
      setError('Please log in as an admin to access this page.');
      navigate('/login', { state: { message: 'Admin access required' } });
    }
  }, [user, navigate]);

  // Auto-clear messages
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
        console.log(`Fetching content for ${selectedPage}`);
        const response = await api.get(`${API_BASE_URL}/ui-content/${selectedPage}`);
        console.log('API Response:', response.data);
        setPageContent(response.data);
        const firstSectionId =
          selectedPage === 'activities'
            ? 'hero'
            : selectedPage === 'contact'
            ? 'hero'
            : selectedPage === 'legal'
            ? 'gtc'
            : response.data.sections[0]?.sectionId || null;
        setSelectedSection(firstSectionId);
        if (firstSectionId) handleSectionChange(firstSectionId, response.data);
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
  }, [user, api, selectedPage]);

  // Intersection Observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.getAttribute('data-id');
            if (id) setVisibleItems((prev) => ({ ...prev, [id]: true }));
          }
        });
      },
      { threshold: 0.1 }
    );
    const elements = document.querySelectorAll('[data-id]');
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

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files).filter(
      (file) => file.type.startsWith('image/') && file.size <= 32 * 1024 * 1024
    );
    if (files.length === 0) {
      setError('Please upload valid image files (max 32MB).');
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
      id: selectedSection,
      name: 'Image',
    });
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
        callPhone: section.content.callPhone || '',
        whatsappPhone: section.content.whatsappPhone || '',
        callPhoneLabel: section.content.callPhoneLabel || '',
        whatsappPhoneLabel: section.content.whatsappPhoneLabel || '',
        email: section.content.email || '',
        emailLabel: section.content.emailLabel || '',
        address: section.content.address || '',
        addressLabel: section.content.addressLabel || '',
        facebook: section.content.facebook || '',
        instagram: section.content.instagram || '',
        youtube: section.content.youtube || '',
        tiktok: section.content.tiktok || '',
      });
    } else {
      console.log('Section not found, resetting formData');
      setFormData({
        title: '',
        description: '',
        imageUrl: '',
        buttonText: '',
        callPhone: '',
        whatsappPhone: '',
        callPhoneLabel: '',
        whatsappPhoneLabel: '',
        email: '',
        emailLabel: '',
        address: '',
        addressLabel: '',
        facebook: '',
        instagram: '',
        youtube: '',
        tiktok: '',
      });
    }
  };

  const handleSaveSection = async (e) => {
    e.preventDefault();
    try {
      console.log('Saving section:', selectedSection, 'FormData:', formData);
      let newSections = pageContent?.sections ? [...pageContent.sections] : [];
      const sectionIndex = newSections.findIndex((s) => s.sectionId === selectedSection);
      const existingSection = newSections[sectionIndex];

      let newSection;
      if (selectedPage === 'contact') {
        if (selectedSection === 'hero') {
          newSection = {
            sectionId: 'hero',
            type: 'text',
            content: {
              title: formData.title,
              description: formData.description,
            },
          };
        } else if (selectedSection === 'contact-info') {
          newSection = {
            sectionId: 'contact-info',
            type: 'contact',
            content: {
              title: formData.title,
              callPhone: formData.callPhone,
              whatsappPhone: formData.whatsappPhone,
              callPhoneLabel: formData.callPhoneLabel,
              whatsappPhoneLabel: formData.whatsappPhoneLabel,
              email: formData.email,
              emailLabel: formData.emailLabel,
              address: formData.address,
              addressLabel: formData.addressLabel,
            },
          };
        } else if (selectedSection === 'social-media') {
          newSection = {
            sectionId: 'social-media',
            type: 'social',
            content: {
              title: formData.title,
              facebook: formData.facebook,
              instagram: formData.instagram,
              youtube: formData.youtube || '',
              tiktok: formData.tiktok || '',
            },
          };
        }
      } else if (selectedPage === 'legal') {
        newSection = {
          sectionId: selectedSection,
          type: 'text',
          content: {
            description: formData.description,
          },
        };
      } else if (selectedPage === 'accommodations' && ['hotel', 'resort', 'adventure'].includes(selectedSection)) {
        newSection = {
          sectionId: selectedSection,
          type: 'text',
          content: {
            title: formData.title,
            description: formData.description,
            slides: existingSection?.content?.slides || [],
            reviews: existingSection?.content?.reviews || [],
          },
        };
      } else {
        newSection = {
          sectionId: selectedSection,
          type: selectedSection === 'hero' ? 'hero' : selectedSection === 'googleReviews' ? 'googleReviews' : 'text',
          content: {
            title: formData.title,
            description: selectedSection === 'hero' ? formData.description : undefined,
            imageUrl: selectedSection === 'hero' ? formData.imageUrl : undefined,
            buttonText:
              selectedSection === 'hero' && !['accommodations', 'activities'].includes(selectedPage)
                ? formData.buttonText
                : undefined,
            slides: existingSection?.content?.slides || [],
            reviews: selectedSection === 'googleReviews' ? existingSection?.content?.reviews || [] : undefined,
          },
        };
      }

      if (sectionIndex !== -1) {
        newSections[sectionIndex] = newSection;
      } else {
        newSections.push(newSection);
      }

      const response = await api.put(`${API_BASE_URL}/ui-content/${selectedPage}`, { sections: newSections });
      console.log('Section saved:', response.data);
      setPageContent(response.data);
      setSuccess('Section updated successfully');
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

  const confirmDelete = async () => {
    try {
      if (modal.type === 'image') {
        setFormData({ ...formData, imageUrl: '' });
        setSuccess('Image removed successfully');
      } else if (modal.type === 'section') {
        const newSections = pageContent.sections.filter((s) => s.sectionId !== modal.id);
        const response = await api.put(`${API_BASE_URL}/ui-content/${selectedPage}`, { sections: newSections });
        setPageContent(response.data);
        const newSectionId =
          selectedPage === 'activities'
            ? 'hero'
            : selectedPage === 'contact'
            ? 'hero'
            : selectedPage === 'legal'
            ? 'gtc'
            : newSections[0]?.sectionId || null;
        setSelectedSection(newSectionId);
        if (newSectionId) handleSectionChange(newSectionId, response.data);
        setSuccess('Section deleted successfully');
      }
    } catch (error) {
      console.error('Error during deletion:', error);
      setError(`Failed to delete: ${error.response?.data?.message || error.message}`);
    } finally {
      setModal({ isOpen: false, type: '', id: null, name: '' });
    }
  };

  const handleInitializeDefault = async () => {
    try {
      setLoading(true);
      const defaultSections =
        selectedPage === 'contact'
          ? [
              {
                sectionId: 'hero',
                type: 'text',
                content: {
                  title: '',
                  description: '',
                },
              },
              {
                sectionId: 'contact-info',
                type: 'contact',
                content: {
                  title: '',
                  callPhone: '',
                  whatsappPhone: '',
                  callPhoneLabel: '',
                  whatsappPhoneLabel: '',
                  email: '',
                  emailLabel: '',
                  address: '',
                  addressLabel: '',
                },
              },
              {
                sectionId: 'social-media',
                type: 'social',
                content: {
                  title: '',
                  facebook: '',
                  instagram: '',
                },
              },
            ]
          : selectedPage === 'legal'
          ? [
              {
                sectionId: 'gtc',
                type: 'text',
                content: {
                  description: '<h1>General Terms & Conditions</h1><p>Enter terms here.</p>',
                },
              },
              {
                sectionId: 'privacy-policy',
                type: 'text',
                content: {
                  description: '<h1>Privacy Policy</h1><p>Enter privacy policy here.</p>',
                },
              },
            ]
          : selectedPage === 'activities'
          ? [
              {
                sectionId: 'hero',
                type: 'hero',
                content: {
                  title: '',
                  description: '',
                  imageUrl: '',
                  slides: [],
                  reviews: [],
                },
              },
            ]
          : selectedPage === 'accommodations'
          ? [
              {
                sectionId: 'hero',
                type: 'hero',
                content: {
                  title: '',
                  description: '',
                  imageUrl: '',
                },
              },
              {
                sectionId: 'hotel',
                type: 'text',
                content: {
                  title: 'Local Hotels',
                  description: '',
                  slides: [],
                  reviews: [],
                },
              },
              {
                sectionId: 'resort',
                type: 'text',
                content: {
                  title: 'Luxury Resorts',
                  description: '',
                  slides: [],
                  reviews: [],
                },
              },
              {
                sectionId: 'adventure',
                type: 'text',
                content: {
                  title: 'Liveaboard',
                  description: '',
                  slides: [],
                  reviews: [],
                },
              },
            ]
          : [
              {
                sectionId: 'hero',
                type: 'hero',
                content: {
                  title: '',
                  description: '',
                  imageUrl: '',
                  ...(!['accommodations', 'activities'].includes(selectedPage) ? { buttonText: '' } : {}),
                },
              },
              ...(selectedPage === 'blogs'
                ? [
                    {
                      sectionId: 'all-articles',
                      type: 'text',
                      content: { title: '' },
                    },
                  ]
                : []),
            ];
      const response = await api.put(`${API_BASE_URL}/ui-content/${selectedPage}`, { sections: defaultSections });
      console.log(`Default sections initialized for ${selectedPage}:`, response.data);
      setPageContent(response.data);
      setSelectedSection(selectedPage === 'legal' ? 'gtc' : 'hero');
      handleSectionChange(selectedPage === 'legal' ? 'gtc' : 'hero', response.data);
      setSuccess('Default sections initialized successfully');
    } catch (error) {
      console.error('Initialization error:', error);
      setError(`Failed to initialize default sections: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      imageUrl: '',
      buttonText: '',
      callPhone: '',
      whatsappPhone: '',
      callPhoneLabel: '',
      whatsappPhoneLabel: '',
      email: '',
      emailLabel: '',
      address: '',
      addressLabel: '',
      facebook: '',
      instagram: '',
    });
  };

  const getDisplayName = (sectionId) => {
    if (selectedPage === 'contact') {
      return sectionId === 'hero'
        ? 'Heading Section'
        : sectionId === 'contact-info'
        ? 'Contact Information Section'
        : sectionId === 'social-media'
        ? 'Social Media Section'
        : sectionId.charAt(0).toUpperCase() + sectionId.slice(1);
    } else if (selectedPage === 'legal') {
      return sectionId === 'gtc'
        ? 'General Terms & Conditions'
        : sectionId === 'privacy-policy'
        ? 'Privacy Policy'
        : sectionId.charAt(0).toUpperCase() + sectionId.slice(1);
    } else if (selectedPage === 'accommodations') {
      return sectionId === 'hero'
        ? 'Hero Section'
        : sectionId === 'hotel'
        ? 'Hotel Section'
        : sectionId === 'resort'
        ? 'Resort Section'
        : sectionId === 'adventure'
        ? 'Adventure Section'
        : sectionId.charAt(0).toUpperCase() + sectionId.slice(1);
    }
    return sectionId === 'hero'
      ? 'Hero Section'
      : sectionId === 'all-articles'
      ? 'All Articles Section'
      : sectionId === 'googleReviews'
      ? 'Google Reviews Section'
      : sectionId.charAt(0).toUpperCase() + sectionId.slice(1);
  };

  const getAvailableSections = () => {
    if (selectedPage === 'activities') {
      return pageContent?.sections?.filter((section) => section.sectionId === 'hero') || [];
    } else if (selectedPage === 'legal') {
      return pageContent?.sections?.filter((section) =>
        ['gtc', 'privacy-policy'].includes(section.sectionId)
      ) || [];
    }
    return pageContent?.sections || [];
  };

  const renderSectionDetails = (section) => {
    const { content } = section;
    if (section.sectionId === 'contact-info') {
      return (
        <div className="text-gray-600 space-y-2" style={{ fontFamily: "'Comic Sans MS', 'Comic Neue'" }}>
          <p><strong>Call Us Label:</strong> {content.callPhoneLabel || 'N/A'}</p>
          <p><strong>Call Us:</strong> {content.callPhone || 'N/A'}</p>
          <p><strong>WhatsApp Label:</strong> {content.whatsappPhoneLabel || 'N/A'}</p>
          <p><strong>WhatsApp:</strong> {content.whatsappPhone || 'N/A'}</p>
          <p><strong>Email:</strong> {content.email || 'N/A'}</p>
          <p><strong>Email Label:</strong> {content.emailLabel || 'N/A'}</p>
          <p><strong>Address:</strong> {content.address || 'N/A'}</p>
          <p><strong>Address Label:</strong> {content.addressLabel || 'N/A'}</p>
        </div>
      );
    } else if (section.sectionId === 'social-media') {
      return (
        <div className="text-gray-600 space-y-2" style={{ fontFamily: "'Comic Sans MS', 'Comic Neue'" }}>
          <p><strong>Facebook:</strong> {content.facebook || 'N/A'}</p>
          <p><strong>Instagram:</strong> {content.instagram || 'N/A'}</p>
        </div>
      );
    } else if (selectedPage === 'legal') {
      return (
        <div className="text-gray-600 space-y-4 prose max-w-none" style={{ fontFamily: "'Comic Sans MS', 'Comic Neue'" }}>
          <strong>Description:</strong>
          <div
            dangerouslySetInnerHTML={{ __html: content.description || 'No content available.' }}
            className="mt-2 p-4 bg-gray-50 rounded-xl prose prose-sm"
          />
        </div>
      );
    } else {
      return (
        <div className="text-gray-600 space-y-2" style={{ fontFamily: "'Comic Sans MS', 'Comic Neue'" }}>
          <p><strong>Description:</strong> {content.description || 'N/A'}</p>
          {content.imageUrl && <p><strong>Image URL:</strong> {content.imageUrl}</p>}
          {content.buttonText && <p><strong>Button Text:</strong> {content.buttonText}</p>}
        </div>
      );
    }
  };

  if (loading || !user?.isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <p className="text-xl text-[#074a5b]" style={{ fontFamily: "'Comic Sans MS', 'Comic Neue'" }}>
          Loading content...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "'Comic Sans MS', 'Comic Neue'" }}>
      <ConfirmationModal
        isOpen={modal.isOpen}
        onClose={() => setModal({ isOpen: false, type: '', id: null, name: '' })}
        onConfirm={confirmDelete}
        title={`Delete ${modal.type === 'image' ? 'Image' : 'Section'}`}
        message={`Are you sure you want to delete ${modal.name}? This action cannot be undone.`}
      />
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-[#074a5b]" style={{ fontFamily: "'Comic Sans MS', 'Comic Neue'" }}>
            Page Content Management - {pages.find((p) => p.id === selectedPage)?.name}
          </h1>
          <select
            value={selectedPage}
            onChange={(e) => setSelectedPage(e.target.value)}
            className="border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-[#1e809b] outline-none h-12 w-48"
            style={{ fontFamily: "'Comic Sans MS', 'Comic Neue'" }}
          >
            {pages.map((page) => (
              <option key={page.id} value={page.id}>
                {page.name}
              </option>
            ))}
          </select>
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
            Manage Content
          </h2>
          {pageContent?.sections?.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-lg text-[#074a5b] mb-4" style={{ fontFamily: "'Comic Sans MS', 'Comic Neue'" }}>
                No sections found for {pages.find((p) => p.id === selectedPage)?.name}. Initialize default sections.
              </p>
              <button
                onClick={handleInitializeDefault}
                className="bg-[#1e809b] hover:bg-[#074a5b] text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300"
                style={{ fontFamily: "'Comic Sans MS', 'Comic Neue'" }}
              >
                Initialize Default Sections
              </button>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <label className="block mb-2 text-[#074a5b] font-semibold" style={{ fontFamily: "'Comic Sans MS', 'Comic Neue'" }}>
                  Select Section
                </label>
                <select
                  value={selectedSection || ''}
                  onChange={(e) => handleSectionChange(e.target.value)}
                  className="border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-[#1e809b] outline-none h-12 w-full md:w-1/3"
                  style={{ fontFamily: "'Comic Sans MS', 'Comic Neue'" }}
                >
                  {getAvailableSections().map((section) => (
                    <option key={section.sectionId} value={section.sectionId}>
                      {getDisplayName(section.sectionId)}
                    </option>
                  ))}
                </select>
              </div>

              {selectedSection && (
                <form onSubmit={handleSaveSection} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {selectedPage === 'legal' ? (
                    <div className="col-span-2">
                <label className="block mb-2 text-[#074a5b] font-semibold" style={{ fontFamily: "'Comic Sans MS', 'Comic Neue'" }}>
                        Description
                      </label>
                      <ReactQuill
                        value={formData.description}
                        onChange={(value) => setFormData({ ...formData, description: value })}
                        modules={quillModules}
                        className="border border-gray-200 rounded-xl bg-white"
                        style={{ height: '300px', marginBottom: '40px' }}
                      />
                    </div>
                  ) : (
                    <>
                      <div>
                        <label className="block mb-2 text-[#074a5b] font-semibold" style={{ fontFamily: "'Comic Sans MS', 'Comic Neue'" }}>
                          Title
                        </label>
                        <input
                          type="text"
                          value={formData.title}
                          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                          className="border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-[#1e809b] outline-none h-12 w-full"
                  style={{ fontFamily: "'Comic Sans MS', 'Comic Neue'" }}
                          placeholder="Enter section title"
                        />
                      </div>
                      {(selectedSection === 'hero' || 
                        (selectedPage === 'contact' && selectedSection === 'hero') ||
                        (selectedPage === 'accommodations' && ['hotel', 'resort', 'adventure'].includes(selectedSection))) && (
                        <div className="col-span-2">
                          <label className="block mb-2 text-[#074a5b] font-semibold" style={{ fontFamily: "'Comic Sans MS', 'Comic Neue'" }}>
                            Description
                          </label>
                          <textarea
                            value={formData.description || ''}
                            onChange={(e) => {
                              console.log('Description changed for section', selectedSection, ':', e.target.value);
                              setFormData({ ...formData, description: e.target.value });
                            }}
                            className="border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-[#1e809b] outline-none w-full h-24 resize-none bg-white text-gray-800"
                            style={{ fontFamily: "'Comic Sans MS', 'Comic Neue'" }}
                            placeholder="Enter section description"
                          />
                        </div>
                      )}
                      {selectedSection === 'hero' && selectedPage !== 'contact' && (
                        <>
                          <div>
                            <label className="block mb-2 text-[#074a5b] font-semibold" style={{ fontFamily: "'Comic Sans MS', 'Comic Neue'" }}>
                              Image
                            </label>
                            <div className="flex items-center">
                              <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageUpload}
                                className="border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-[#1e809b] outline-none h-12"
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
                                  alt="Section Image Preview"
                                  className="w-32 h-32 object-cover rounded-xl"
                                  onError={(e) => (e.target.style.display = 'none')}
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
                          {selectedPage !== 'accommodations' && selectedPage !== 'activities' && (
                            <div>
                              <label className="block mb-2 text-[#074a5b] font-semibold" style={{ fontFamily: "'Comic Sans MS', 'Comic Neue'" }}>
                                Button Text
                              </label>
                              <input
                                type="text"
                                value={formData.buttonText}
                                onChange={(e) => setFormData({ ...formData, buttonText: e.target.value })}
                                className="border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-[#1e809b] outline-none h-12 w-full"
                                style={{ fontFamily: "'Comic Sans MS', 'Comic Neue'" }}
                              />
                            </div>
                          )}
                        </>
                      )}
                      {selectedPage === 'contact' && selectedSection === 'contact-info' && (
                        <>
                          <div>
                            <label className="block mb-2 text-[#074a5b] font-semibold" style={{ fontFamily: "'Comic Sans MS', 'Comic Neue'" }}>
                              Call us
                            </label>
                            <input
                              type="text"
                              value={formData.callPhone}
                              onChange={(e) => setFormData({ ...formData, callPhone: e.target.value })}
                              className="border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-[#1e809b] outline-none h-12 w-full"
                              style={{ fontFamily: "'Comic Sans MS', 'Comic Neue'" }}
                            />
                          </div>
                          <div>
                            <label className="block mb-2 text-[#074a5b] font-semibold" style={{ fontFamily: "'Comic Sans MS', 'Comic Neue'" }}>
                              Whatsapp us
                            </label>
                            <input
                              type="text"
                              value={formData.whatsappPhone}
                              onChange={(e) => setFormData({ ...formData, whatsappPhone: e.target.value })}
                              className="border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-[#1e809b] outline-none h-12 w-full"
                              style={{ fontFamily: "'Comic Sans MS', 'Comic Neue'" }}
                            />
                          </div>
                          <div>
                            <label className="block mb-2 text-[#074a5b] font-semibold" style={{ fontFamily: "'Comic Sans MS', 'Comic Neue'" }}>
                              Call us label
                            </label>
                            <input
                              type="text"
                              value={formData.callPhoneLabel}
                              onChange={(e) => setFormData({ ...formData, callPhoneLabel: e.target.value })}
                              className="border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-[#1e809b] outline-none h-12 w-full"
                              style={{ fontFamily: "'Comic Sans MS', 'Comic Neue'" }}
                            />
                          </div>
                          <div>
                            <label className="block mb-2 text-[#074a5b] font-semibold" style={{ fontFamily: "'Comic Sans MS', 'Comic Neue'" }}>
                              Whatsapp label
                            </label>
                            <input
                              type="text"
                              value={formData.whatsappPhoneLabel}
                              onChange={(e) => setFormData({ ...formData, whatsappPhoneLabel: e.target.value })}
                              className="border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-[#1e809b] outline-none h-12 w-full"
                              style={{ fontFamily: "'Comic Sans MS', 'Comic Neue'" }}
                            />
                          </div>
                          <div>
                                          <label className="block mb-2 text-[#074a5b] font-semibold" style={{ fontFamily: "'Comic Sans MS', 'Comic Neue'" }}>
                              Email Address
                            </label>
                            <input
                              type="email"
                              value={formData.email}
                              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                              className="border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-[#1e809b] outline-none h-12 w-full"
                                            style={{ fontFamily: "'Comic Sans MS', 'Comic Neue'" }}
                            />
                          </div>
                          <div>
                                              <label className="block mb-2 text-[#074a5b] font-semibold" style={{ fontFamily: "'Comic Sans MS', 'Comic Neue'" }}>
                              Email Label
                            </label>
                            <input
                              type="text"
                              value={formData.emailLabel}
                              onChange={(e) => setFormData({ ...formData, emailLabel: e.target.value })}
                              className="border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-[#1e809b] outline-none h-12 w-full"
                                                style={{ fontFamily: "'Comic Sans MS', 'Comic Neue'" }}
                            />
                          </div>
                          <div>
                                                  <label className="block mb-2 text-[#074a5b] font-semibold" style={{ fontFamily: "'Comic Sans MS', 'Comic Neue'" }}>
                              Address
                            </label>
                            <input
                              type="text"
                              value={formData.address}
                              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                              className="border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-[#1e809b] outline-none h-12 w-full"
                                                    style={{ fontFamily: "'Comic Sans MS', 'Comic Neue'" }}
                            />
                          </div>
                          <div>
                                                      <label className="block mb-2 text-[#074a5b] font-semibold" style={{ fontFamily: "'Comic Sans MS', 'Comic Neue'" }}>
                              Address Label
                            </label>
                            <input
                              type="text"
                              value={formData.addressLabel}
                              onChange={(e) => setFormData({ ...formData, addressLabel: e.target.value })}
                              className="border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-[#1e809b] outline-none h-12 w-full"
                                                        style={{ fontFamily: "'Comic Sans MS', 'Comic Neue'" }}
                            />
                          </div>
                        </>
                      )}
                      {selectedPage === 'contact' && selectedSection === 'social-media' && (
                        <>
                          <div>
                            <label className="block mb-2 text-[#074a5b] font-semibold" style={{ fontFamily: "'Comic Sans MS', 'Comic Neue'" }}>
                              Facebook Link
                            </label>
                            <input
                              type="url"
                              value={formData.facebook}
                              onChange={(e) => setFormData({ ...formData, facebook: e.target.value })}
                              className="border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-[#1e809b] outline-none h-12 w-full"
                              style={{ fontFamily: "'Comic Sans MS', 'Comic Neue'" }}
                            />
                          </div>
                          <div>
                            <label className="block mb-2 text-[#074a5b] font-semibold" style={{ fontFamily: "'Comic Sans MS', 'Comic Neue'" }}>
                              Instagram Link
                            </label>
                            <input
                              type="url"
                              value={formData.instagram}
                              onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                              className="border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-[#1e809b] outline-none h-12 w-full"
                              style={{ fontFamily: "'Comic Sans MS', 'Comic Neue'" }}
                            />
                          </div>
                          <div>
                            <label className="block mb-2 text-[#074a5b] font-semibold" style={{ fontFamily: "'Comic Sans MS', 'Comic Neue'" }}>
                              YouTube Link (optional)
                            </label>
                            <input
                              type="url"
                              value={formData.youtube}
                              onChange={(e) => setFormData({ ...formData, youtube: e.target.value })}
                              className="border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-[#1e809b] outline-none h-12 w-full"
                              style={{ fontFamily: "'Comic Sans MS', 'Comic Neue'" }}
                            />
                          </div>
                          <div>
                            <label className="block mb-2 text-[#074a5b] font-semibold" style={{ fontFamily: "'Comic Sans MS', 'Comic Neue'" }}>
                              TikTok Link (optional)
                            </label>
                            <input
                              type="url"
                              value={formData.tiktok}
                              onChange={(e) => setFormData({ ...formData, tiktok: e.target.value })}
                              className="border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-[#1e809b] outline-none h-12 w-full"
                              style={{ fontFamily: "'Comic Sans MS', 'Comic Neue'" }}
                            />
                          </div>
                          <div className="flex gap-4 mt-4">
                            {formData.youtube && formData.youtube.trim() !== '' && (
                              <a href={formData.youtube} target="_blank" rel="noopener noreferrer" title="YouTube">
                                <Youtube size={32} className="text-red-600" />
                              </a>
                            )}
                            {formData.tiktok && formData.tiktok.trim() !== '' && (
                              <a href={formData.tiktok} target="_blank" rel="noopener noreferrer" title="TikTok">
                                <Music2 size={32} className="text-black" />
                              </a>
                            )}
                          </div>
                        </>
                      )}
                    </>
                  )}
                  <div className="col-span-2 flex gap-4">
                    <button
                      type="submit"
                      className="bg-[#1e809b] hover:bg-[#074a5b] text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300"
                      disabled={uploading}
                      style={{ fontFamily: "'Comic Sans MS', 'Comic Neue'" }}
                    >
                      <Save size={16} className="inline mr-2" /> Save Section
                    </button>
                    <button
                      type="button"
                      onClick={resetForm}
                      className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-6 py-3 rounded-xl font-semibold transition-all duration-300"
                      disabled={uploading}
                      style={{ fontFamily: "'Comic Sans MS', 'Comic Neue'" }}
                    >
                      Cancel
                    </button>
                    {pageContent.sections.find((s) => s.sectionId === selectedSection) && (
                      <button
                        type="button"
                        onClick={() => handleDeleteSection(selectedSection, getDisplayName(selectedSection))}
                        className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300"
                        style={{ fontFamily: "'Comic Sans MS', 'Comic Neue'" }}
                      >
                        <Trash2 size={16} className="inline mr-2" /> Delete Section
                      </button>
                    )}
                    {selectedPage === 'legal' && (
                      <button
                        type="button"
                        onClick={() => handleDownload(selectedSection, formData)}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300"
                        style={{ fontFamily: "'Comic Sans MS', 'Comic Neue'" }}
                      >
                        <Download size={16} className="inline mr-2" /> Download PDF
                      </button>
                    )}
                  </div>
                </form>
              )}
            </>
          )}
        </div>

        {selectedPage !== 'legal' && (
          <div className="mb-12">
          <h2 className="text-2xl font-semibold mb-6 text-[#074a5b]" style={{ fontFamily: "'Comic Sans MS', 'Comic Neue'" }}>
              Sections Overview
            </h2>
            {pageContent?.sections?.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-lg text-[#074a5b]" style={{ fontFamily: "'Comic Sans MS', 'Comic Neue'" }}>
                  No sections available. Initialize default sections above.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {getAvailableSections().map((section) => (
                  <div
                    key={section.sectionId}
                    data-id={section.sectionId}
                    className={`bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-500 transform ${
                      visibleItems[section.sectionId] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                    }`}
                  >
                    {section.content.imageUrl && (
                      <div className="relative h-48 overflow-hidden">
                        <img
                          src={section.content.imageUrl}
                          alt={section.content.title}
                          className="w-full h-full object-cover"
                          onError={(e) => (e.target.style.display = 'none')}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                      </div>
                    )}
                    <div className="p-6">
                      <h3 className="text-xl font-bold mb-2 text-[#074a5b] hover:text-[#1e809b] transition-colors" style={{ fontFamily: "'Comic Sans MS', 'Comic Neue'" }}>
                        {section.content.title || getDisplayName(section.sectionId)}
                      </h3>
                      <p className="text-gray-600 mb-3" style={{ fontFamily: "'Comic Sans MS', 'Comic Neue'" }}>
                        {section.sectionId === 'hero' && selectedPage === 'contact'
                          ? 'Heading Section'
                          : section.sectionId === 'contact-info'
                          ? 'Contact Information'
                          : section.sectionId === 'social-media'
                          ? 'Social Media Links'
                          : section.sectionId === 'gtc'
                          ? 'General Terms & Conditions'
                          : section.sectionId === 'privacy-policy'
                          ? 'Privacy Policy'
                          : section.type === 'hero'
                          ? 'Hero Image Section'
                          : section.type === 'googleReviews'
                          ? 'Google Reviews Section'
                          : 'Text Section'}
                      </p>
                      {renderSectionDetails(section)}
                      <div className="flex gap-3 mt-3">
                        <button
                          type="button"
                          onClick={() => handleSectionChange(section.sectionId)}
                          className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-xl font-semibold transition-all"
                          style={{ fontFamily: "'Comic Sans MS', 'Comic Neue'" }}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteSection(section.sectionId, section.content.title || getDisplayName(section.sectionId))}
                          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl font-semibold transition-all"
                          style={{ fontFamily: "'Comic Sans MS', 'Comic Neue'" }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PageContentManagement;
