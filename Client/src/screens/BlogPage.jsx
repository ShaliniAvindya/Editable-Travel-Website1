import React, { useState, useEffect } from 'react';
import { Calendar, ArrowLeft, Play, Pause, Volume2, VolumeX, Tag, User, Clock } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const BlogPage = () => {
  const [blog, setBlog] = useState(null);
  const [currentVideo, setCurrentVideo] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [readingTime, setReadingTime] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { blogId } = useParams();
  const navigate = useNavigate();

  // Fetch blog 
  useEffect(() => {
    const fetchBlog = async () => {
      try {
        const response = await axios.get(`https://editable-travel-website1-rpfv.vercel.app/api/blogs/${blogId}`);
        const blogData = response.data;

        const mappedBlog = {
          id: blogData._id.toString(),
          title: blogData.title,
          publishDate: new Date(blogData.publish_date).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric'
          }),
          featuredImage: blogData.images[0] || 'https://via.placeholder.com/1920',
          content: blogData.content
            .map((section, index) => `
              ${section.heading ? `<h2>${index + 1}. ${section.heading}</h2>` : ''}
              ${section.image ? `<img src="${section.image}" alt="${section.heading || 'Blog image'}" style="max-width: 300px; height: auto; margin: 16px 0; border-radius: 8px;" />` : ''}
              ${section.text ? `<p>${section.text}</p>` : ''}
            `)
            .join(''),
          images: blogData.images || [],
          videos: (blogData.videos || []).map((url) => ({
            src: url,
            thumbnail: url.includes('youtube.com/embed')
              ? `https://img.youtube.com/vi/${url.split('/embed/')[1]?.split('?')[0]}/hqdefault.jpg`
              : 'https://via.placeholder.com/800'
          })),
          tags: blogData.tags || [],
          author: blogData.author || 'Unbekannter Autor'
        };

        setBlog(mappedBlog);
        setLoading(false);

        // Calculate reading time (assuming 200 words per minute)
        const wordCount = mappedBlog.content.replace(/<[^>]*>/g, '').split(' ').length;
        setReadingTime(Math.ceil(wordCount / 200));
      } catch (err) {
        console.error('Error fetching blog:', err);
        setError('Failed to load blog');
        setLoading(false);
      }
    };
    fetchBlog();
  }, [blogId]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [blogId]);

  const handleVideoPlay = (videoIndex) => {
    setCurrentVideo(videoIndex);
    setIsPlaying(true);
  };

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const handleBack = () => {
    navigate('/blogs');
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center" style={{ fontFamily: 'Comic Sans MS, cursive' }}>
        <p className="text-2xl text-[#074a5b]">Blog wird geladen...</p>
      </div>
    );
  }

  // Error state
  if (error || !blog) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center" style={{ fontFamily: 'Comic Sans MS, cursive' }}>
        <p className="text-2xl text-[#074a5b]">{error || 'Blog not found'}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: 'Comic Sans MS, cursive' }}>
      {/* Back Button */}
      <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-xl border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 py-5">
          <button
            onClick={handleBack}
            className="inline-flex items-center gap-2 text-[#1e809b] hover:text-[#074a5b] font-semibold transition-colors duration-300 group"
            aria-label="Back to Blogs"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform duration-300" />
            Zurück zu Blogs
          </button>
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative h-[60vh] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent z-10"></div>
        <img
          src={blog.featuredImage}
          alt={blog.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute bottom-0 left-0 right-0 z-20 p-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-4 mb-4 text-white/90">
              <span className="bg-[#1e809b] px-3 py-1 rounded-full text-sm font-semibold">
                <Tag className="w-4 h-4 inline mr-1" />
                {blog.tags[0] || 'General'}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {blog.publishDate}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {readingTime} Min Lesen
              </span>
              <span className="flex items-center gap-1">
                <User className="w-4 h-4" />
                {blog.author}
              </span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-white drop-shadow-2xl leading-tight">
              {blog.title}
            </h1>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <article className="prose prose-lg max-w-none mb-16">
          <div
            className="text-gray-700 leading-relaxed"
            style={{
              fontSize: '18px',
              lineHeight: '1.8'
            }}
            dangerouslySetInnerHTML={{
              __html: blog.content.replace(
                /<h2>/g,
                '<h2 style="color: #074a5b; font-size: 28px; font-weight: bold; margin: 32px 0 16px 0;">'
              ).replace(/<p>/g, '<p style="margin-bottom: 24px;">')
            }}
          />
        </article>

        {/* Image Gallery */}
        {blog.images && blog.images.length > 0 && (
          <section className="mb-16">
            <h2 className="text-3xl font-bold mb-8" style={{ color: '#074a5b' }}>
              Galerie
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {blog.images.map((image, index) => (
                <div key={index} className="group cursor-pointer overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300">
                  <img
                    src={image}
                    alt={`Gallery image ${index + 1}`}
                    className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Video Section */}
        {blog.videos && blog.videos.length > 0 && (
          <section className="mb-16">
            <h2 className="text-3xl font-bold mb-8" style={{ color: '#074a5b' }}>
              Vorgestellte Videos
            </h2>

            {/* Video Player */}
            {currentVideo !== null && (
              <div className="mb-8 bg-black rounded-2xl overflow-hidden shadow-2xl">
                <div className="relative aspect-video">
                  <iframe
                    className="w-full h-full"
                    src={`${blog.videos[currentVideo].src}${isPlaying ? '?autoplay=1' : ''}${isMuted ? '&mute=1' : ''}`}
                    title={`Video ${currentVideo + 1}`}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  ></iframe>

                  {/* Custom Controls Overlay */}
                  <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-white">
                    <div className="flex items-center gap-4">
                      <button
                        onClick={togglePlayPause}
                        className="bg-white/20 backdrop-blur-sm rounded-full p-3 hover:bg-white/30 transition-all duration-300"
                        aria-label={isPlaying ? 'Pause video' : 'Play video'}
                      >
                        {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                      </button>
                      <button
                        onClick={toggleMute}
                        className="bg-white/20 backdrop-blur-sm rounded-full p-3 hover:bg-white/30 transition-all duration-300"
                        aria-label={isMuted ? 'Unmute video' : 'Mute video'}
                      >
                        {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Video Thumbnails */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {blog.videos.map((video, index) => (
                <div
                  key={index}
                  onClick={() => handleVideoPlay(index)}
                  className={`group cursor-pointer rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 ${
                    currentVideo === index ? 'ring-4 ring-[#1e809b] ring-opacity-50' : ''
                  }`}
                >
                  <div className="relative aspect-video">
                    <img
                      src={video.thumbnail}
                      alt={`Video ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center">
                      <div className="bg-white/90 backdrop-blur-sm rounded-full p-4 group-hover:bg-white group-hover:scale-110 transition-all duration-300">
                        <Play className="w-8 h-8 text-[#074a5b] ml-1" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default BlogPage;
