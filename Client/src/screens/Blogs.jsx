import React, { useState, useEffect } from 'react';
import { Calendar, Search, Tag, ChevronLeft, ChevronRight, ChevronDown, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Blogs = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [isVisible, setIsVisible] = useState(false);
  const [blogs, setBlogs] = useState([]);
  const [categories, setCategories] = useState(['All']);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uiContent, setUiContent] = useState(null);

  const navigate = useNavigate();
  const blogsPerPage = 6;

  const filteredBlogs = blogs.filter((blog) => {
    const matchesSearch = blog.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              blog.excerpt.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || blog.tags.includes(selectedCategory);
    return matchesSearch && matchesCategory;
  });

  const totalPages = Math.ceil(filteredBlogs.length / blogsPerPage);
  const startIndex = (currentPage - 1) * blogsPerPage;
  const currentBlogs = filteredBlogs.slice(startIndex, startIndex + blogsPerPage);

  // Fetch blogs 
  useEffect(() => {
    const fetchData = async () => {
      try {
        const uiContentResponse = await axios.get('/api/ui-content/blogs');
        setUiContent(uiContentResponse.data);

        // Fetch blogs
        const blogsResponse = await axios.get('/api/blogs');
        const mappedBlogs = blogsResponse.data.map((blog) => ({
          id: blog._id.toString(),
          title: blog.title,
          excerpt: blog.content[0]?.text?.slice(0, 150) + (blog.content[0]?.text?.length > 150 ? '...' : '') || 'No excerpt available',
          image: blog.images[0] || 'https://via.placeholder.com/800',
          date: new Date(blog.publish_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
          category: blog.tags[0] || 'General',
          tags: blog.tags || [],
          author: blog.author,
        }));
        setBlogs(mappedBlogs);
        const uniqueTags = [...new Set(mappedBlogs.flatMap((blog) => blog.tags))].sort();
        setCategories(['All', ...uniqueTags]);
        setLoading(false);
        setTimeout(() => setIsVisible(true), 100);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load content');
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory]);

  const handleBlogClick = (blogId) => {
    navigate(`/blogs/${blogId}`);
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      setCurrentPage(page);
      setTimeout(() => {
        const blogsSection = document.querySelector('.blogs-section');
        if (blogsSection) {
          blogsSection.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
          });
        }
      }, 0);
    }
  };

  const scrollToBlogs = () => {
    const blogsSection = document.querySelector('.blogs-section');
    if (blogsSection) {
      blogsSection.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center" style={{ fontFamily: 'Comic Sans MS, cursive' }}>
        <p className="text-2xl text-[#074a5b]">Blogs werden geladen...</p>
      </div>
    );
  }

  // Error state
  if (error || !uiContent) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center" style={{ fontFamily: 'Comic Sans MS, cursive' }}>
        <p className="text-2xl text-[#074a5b]">{error || 'No content available'}</p>
      </div>
    );
  }

  // Get Hero content
  const heroContent = uiContent.sections?.find((s) => s.sectionId === 'hero')?.content;

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: 'Comic Sans MS, cursive' }}>
      {/* Hero Section */}
      {heroContent && (
        <section className="relative h-[68vh] overflow-hidden">
          {heroContent.imageUrl && (
            <img
              src={heroContent.imageUrl}
              alt="Blog Hero"
              className="w-full h-full object-cover"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/50 to-[#074a5b]/90"></div>
          <div className="absolute inset-0 flex items-center justify-center z-20">
            <div
              className={`text-center text-white px-4 max-w-4xl transition-all duration-1000 ease-out ${
                isVisible ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-8'
              }`}
            >
              {heroContent.title && (
                <h1 className="text-5xl md:text-6xl font-bold mb-6 drop-shadow-2xl">
                  {heroContent.title}
                </h1>
              )}
              {heroContent.description && (
                <p className="text-xl md:text-2xl leading-relaxed drop-shadow-xl mb-6">
                  {heroContent.description}
                </p>
              )}
              {heroContent.buttonText && (
                <button
                  onClick={scrollToBlogs}
                  className="group inline-flex items-center gap-3 bg-gradient-to-r from-[#085966] to-[#22a0c4] hover:from-[#074a5b] hover:to-[#1e809b] px-8 py-4 md:px-10 md:py-4 rounded-full text-lg md:text-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-2xl hover:shadow-cyan-500/25 drop-shadow-lg"
                  aria-label={heroContent.buttonText}
                >
                  <span>{heroContent.buttonText}</span>
                  <ChevronDown className="w-5 h-5 md:w-6 md:h-6 group-hover:translate-y-1 transition-transform duration-300" />
                </button>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Search and Filter Section */}
      <section className="py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-xl border border-white/20">
            <div className="flex flex-col md:flex-row gap-6 items-center">
              {/* Search Bar */}
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Suchen Sie Artikel..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 rounded-2xl border border-gray-200 focus:border-[#1e809b] focus:outline-none focus:ring-2 focus:ring-[#1e809b]/20 transition-all duration-300 text-lg"
                  aria-label="Search blog articles"
                />
              </div>

              {/* Category Filter */}
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-6 py-3 rounded-full font-semibold transition-all duration-300 transform hover:scale-105 ${
                      selectedCategory === category
                        ? 'bg-[#1e809b] text-white shadow-lg'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                    aria-label={`Filter by ${category}`}
                  >
                    <Tag size={16} className="inline mr-2" />
                    {category}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* All Blogs Section */}
      {uiContent.sections?.find((s) => s.sectionId === 'all-articles') && (
        <section className="py-16 px-4 bg-gray-50/50 blogs-section">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              {uiContent.sections.find((s) => s.sectionId === 'all-articles')?.content.title && (
                <h2 className="text-4xl md:text-5xl font-bold mb-4" style={{ color: '#074a5b' }}>
                  {uiContent.sections.find((s) => s.sectionId === 'all-articles').content.title}
                </h2>
              )}
              <p className="text-xl" style={{ color: '#1e809b' }}>
                {filteredBlogs.length} Artikel{filteredBlogs.length !== 1 ? 's' : ''} gefunden
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {currentBlogs.map((post) => (
                <article
                  key={post.id}
                  className="bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-xl transition-all duration-300"
                >
                  <div className="h-48 overflow-hidden">
                    <img
                      src={post.image}
                      alt={post.title}
                      className="w-full h-full object-cover transition-transform duration-200 hover:scale-110"
                    />
                  </div>
                  <div className="p-6">
                    <div className="flex justify-between items-center mb-5 text-sm" style={{ color: '#1e809b' }}>
                      <div className="flex items-center">
                        <Calendar size={16} className="mr-2" />
                        <span>{post.date}</span>
                      </div>
                      <div className="flex items-center">
                        <User size={16} className="mr-2" />
                        <span>{post.author}</span>
                      </div>
                    </div>
                    <h3 className="text-xl font-bold mb-3" style={{ color: '#074a5b' }}>
                      {post.title}
                    </h3>
                    <p className="text-gray-600 mb-4">{post.excerpt}</p>
                    <button
                      className="text-lg font-semibold hover:underline"
                      style={{ color: '#1e809b' }}
                      onClick={() => handleBlogClick(post.id)}
                      aria-label={`Read more about ${post.title}`}
                    >
                      Lesen Sie mehr →
                    </button>
                  </div>
                </article>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center mt-12 space-x-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`flex items-center px-4 py-2 rounded-full font-semibold transition-all duration-300 ${
                    currentPage === 1
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-white text-[#1e809b] hover:bg-[#1e809b] hover:text-white shadow-lg hover:shadow-xl transform hover:scale-105'
                  }`}
                  aria-label="Previous page"
                >
                  <ChevronLeft size={16} className="mr-1" />
                  Vorherige
                </button>
                {[...Array(totalPages)].map((_, index) => (
                  <button
                    key={index + 1}
                    onClick={() => handlePageChange(index + 1)}
                    className={`w-10 h-10 rounded-full font-semibold transition-all duration-300 ${
                      currentPage === index + 1
                        ? 'bg-[#1e809b] text-white shadow-lg scale-110'
                        : 'bg-white text-[#1e809b] hover:bg-[#1e809b] hover:text-white shadow-lg hover:shadow-xl transform hover:scale-105'
                    }`}
                    aria-label={`Gehe zu Seite ${index + 1}`}
                  >
                    {index + 1}
                  </button>
                ))}
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`flex items-center px-4 py-2 rounded-full font-semibold transition-all duration-300 ${
                    currentPage === totalPages
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-white text-[#1e809b] hover:bg-[#1e809b] hover:text-white shadow-lg hover:shadow-xl transform hover:scale-105'
                  }`}
                  aria-label="Next page"
                >
                  Nächste
                  <ChevronRight size={16} className="ml-1" />
                </button>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
};

export default Blogs;