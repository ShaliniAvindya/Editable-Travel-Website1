import React, { useState, useEffect } from 'react';
import { Calendar, ArrowLeft, Play, Pause, Volume2, VolumeX, Tag, User, Clock } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../components/apiConfig';

const BlogPage = () => {
  const [blog, setBlog] = useState(null);
  const [currentVideo, setCurrentVideo] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [videoFallbacks, setVideoFallbacks] = useState({});
  const [readingTime, setReadingTime] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [recentBlogs, setRecentBlogs] = useState([]);

  const { blogId } = useParams();
  const navigate = useNavigate();

  const getEmbedUrl = (url) => {
    if (!url) return '';
    
    try {
      // YouTube URL handling
      if (url.includes('youtube.com/watch?v=')) {
        const videoId = url.split('watch?v=')[1].split('&')[0];
        return `https://www.youtube.com/embed/${videoId}`;
      } else if (url.includes('youtu.be/')) {
        const videoId = url.split('youtu.be/')[1].split('?')[0];
        return `https://www.youtube.com/embed/${videoId}`;
      } 
      // Vimeo URL handling
      else if (url.includes('vimeo.com/')) {
        const videoId = url.split('vimeo.com/')[1].split('?')[0];
        return `https://player.vimeo.com/video/${videoId}`;
      }
      // TikTok URL handling
      else if (url.includes('tiktok.com')) {
        return url.replace('/video/', '/embed/');
      }
      // For other embed URLs, return as is
      else if (url.includes('/embed/') || url.includes('player.')) {
        return url;
      }
      
      return url;
    } catch (error) {
      console.error('Error processing embed URL:', error);
      return url;
    }
  };

  const renderContentBlock = (section, index) => {
    const theme = blog.theme || {
      primaryColor: '#074a5b',
      secondaryColor: '#3B82F6',
      accentColor: '#F97316',
      backgroundColor: '#FFFFFF',
      textColor: '#1F2937',
      borderRadius: '8px',
      fontFamily: '"Comic Sans MS", "Comic Neue"'
    };

    const getBlockStyle = (blockData) => {
      const style = {};
      
      if (blockData?.backgroundColor && blockData?.backgroundStyle === 'solid') {
        style.backgroundColor = blockData.backgroundColor;
      }
      
      if (blockData?.borderRadius) {
        style.borderRadius = `${blockData.borderRadius}px`;
      }
      
      if (blockData?.padding) {
        style.padding = `${blockData.padding}px`;
      }
      
      if (blockData?.opacity && blockData.opacity !== 100) {
        style.opacity = blockData.opacity / 100;
      }
      
      return style;
    };

    const getSpacingClass = (spacing) => {
      const spacingMap = {
        none: 'mb-0',
        xs: 'mb-1',
        sm: 'mb-3',
        normal: 'mb-4 sm:mb-6',
        lg: 'mb-6 sm:mb-10',
        xl: 'mb-8 sm:mb-16'
      };
      return spacingMap[spacing] || spacingMap.normal;
    };

    const blockData = section.blockData || {};
    const blockStyle = getBlockStyle(blockData);
    const spacingClass = getSpacingClass(blockData.spacing);

  switch (section.blockType) {
      case 'cta': {
        let ctaData = {};
        try {
          ctaData = typeof section.text === 'string' ? JSON.parse(section.text) : {};
        } catch (e) {}
        const ctaStyle = blockData.ctaStyle || 'modern';
        const primaryColor = blockData.primaryColor || '#3B82F6';
        const textColor = blockData.textColor || '#1F2937';
        const backgroundColor = blockData.backgroundColor || '#F3F4F6';
        const alignment = blockData.alignment || 'center';
        return (
          <div key={index} className={`${spacingClass} flex justify-${alignment}`}> 
            <div
              className={`p-4 sm:p-6 rounded-xl max-w-full sm:max-w-2xl w-full mx-auto ${
                ctaStyle === 'gradient' ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white' :
                ctaStyle === 'minimal' ? 'bg-transparent border-2' : 'shadow-lg'
              }`}
              style={{
                backgroundColor: ctaStyle !== 'gradient' ? backgroundColor : undefined,
                color: ctaStyle === 'gradient' ? 'white' : textColor,
                borderColor: ctaStyle === 'minimal' ? primaryColor : 'transparent',
                textAlign: alignment,
                ...blockStyle
              }}
            >
              {(section.heading || ctaData.title) && (
                <h3 className="text-xl sm:text-2xl font-bold mb-3">{section.heading || ctaData.title}</h3>
              )}
              {(ctaData.description || section.text) && (
                <p className="mb-4 text-sm sm:text-base opacity-90">{ctaData.description || ''}</p>
              )}
              <div className="flex gap-3 justify-center items-center flex-wrap mb-4">
                {ctaData.primaryButtonText && (
                  <a
                    href={ctaData.primaryButtonUrl || '#'}
                    style={{ backgroundColor: primaryColor }}
                    className="px-4 sm:px-6 py-2 sm:py-3 text-white rounded-xl font-medium hover:opacity-90 transition-all no-underline text-sm sm:text-base"
                    target="_blank" rel="noopener noreferrer"
                  >
                    {ctaData.primaryButtonText}
                  </a>
                )}
                {ctaData.secondaryButtonText && (
                  <a
                    href={ctaData.secondaryButtonUrl || '#'}
                    className="px-4 sm:px-6 py-2 sm:py-3 border-2 rounded-xl font-medium hover:bg-gray-50 transition-all no-underline text-sm sm:text-base"
                    style={{ borderColor: primaryColor, color: primaryColor }}
                    target="_blank" rel="noopener noreferrer"
                  >
                    {ctaData.secondaryButtonText}
                  </a>
                )}
              </div>
              {(ctaData.email || ctaData.phone || ctaData.address) && (
                <div className="pt-4 border-t border-gray-300 flex flex-wrap gap-4 justify-center text-xs sm:text-sm opacity-75">
                  {ctaData.email && (
                    <div className="flex items-center gap-1">
                      <span role="img" aria-label="email">📧</span> {ctaData.email}
                    </div>
                  )}
                  {ctaData.phone && (
                    <div className="flex items-center gap-1">
                      <span role="img" aria-label="phone">📞</span> {ctaData.phone}
                    </div>
                  )}
                  {ctaData.address && (
                    <div className="flex items-center gap-1">
                      <span role="img" aria-label="address">📍</span> {ctaData.address}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      }
      case 'heading':
        const HeadingTag = blockData.level || 'h2';
        const headingSize = {
          h1: 'text-3xl sm:text-4xl',
          h2: 'text-2xl sm:text-3xl',
          h3: 'text-xl sm:text-2xl',
          h4: 'text-lg sm:text-xl',
          h5: 'text-base sm:text-lg',
          h6: 'text-sm sm:text-base'
        };
        
        return React.createElement(HeadingTag, {
          key: index,
          className: `font-bold ${headingSize[HeadingTag]} ${spacingClass}`,
          style: { 
            color: blockData.textColor || theme.primaryColor,
            ...blockStyle
          }
        }, section.heading);

      case 'text':
        return (
          <div 
            key={index}
            className={`prose prose-sm sm:prose-lg max-w-none leading-relaxed ${spacingClass}`}
            style={blockStyle}
            dangerouslySetInnerHTML={{ __html: section.text }}
          />
        );

      case 'image':
        const imageAlignment = blockData.alignment || 'center';
        const imageSize = blockData.size || 'medium';
        const alignmentClass = `text-${imageAlignment}`;
        const sizeClass = imageSize === 'small' ? 'max-w-xs' : 
                         imageSize === 'large' ? 'max-w-3xl sm:max-w-4xl' : 
                         imageSize === 'full' ? 'w-full' : 'max-w-lg sm:max-w-2xl';
        
        return (
          <div key={index} className={`${alignmentClass} ${spacingClass}`} style={blockStyle}>
            <img
              src={section.image}
              alt={blockData.caption || section.heading || 'Blog image'}
              className={`rounded-xl w-full ${sizeClass}`}
              style={{ 
                margin: imageAlignment === 'left' ? '0' : 
                       imageAlignment === 'right' ? '0 0 0 auto' : '0 auto'
              }}
            />
            {blockData.caption && (
              <p className="text-xs sm:text-sm text-gray-600 italic mt-3">{blockData.caption}</p>
            )}
          </div>
        );

      case 'video': {
        const videoAlignment = blockData.alignment || 'center';
        const videoSize = blockData.size || 'medium';
        const videoAlignmentClass = `text-${videoAlignment}`;
        const videoSizeClass = videoSize === 'small' ? 'max-w-xs' : 
                              videoSize === 'large' ? 'max-w-3xl sm:max-w-4xl' : 
                              videoSize === 'full' ? 'w-full' : 'max-w-lg sm:max-w-2xl';
        const isEmbedLink = typeof section.image === 'string' && (/youtube\.com\/watch\?v=|youtu\.be\/|vimeo\.com\//i).test(section.image);

        return (
          <div key={index} className={`${videoAlignmentClass} ${spacingClass}`} style={blockStyle}>
            <div className={`relative rounded-xl overflow-hidden ${videoSizeClass} mx-auto`} style={{ aspectRatio: '16/9' }}>
              {isEmbedLink ? (
                <iframe
                  src={getEmbedUrl(section.image)}
                  className="w-full h-full"
                  allowFullScreen
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  title={`content-video-embed-${index}`}
                />
              ) : (
                <video
                  src={section.image}
                  controls
                  className="w-full h-full object-cover"
                  {...(section.thumbnail ? { poster: section.thumbnail } : {})}
                  onError={() => setError('Failed to load video')}
                />
              )}
            </div>
            {blockData.caption && (
              <p className="text-xs sm:text-sm text-gray-600 italic mt-3">{blockData.caption}</p>
            )}
          </div>
        );
      }
        
        if (listData.listType === 'checklist') {
          return (
            <div key={index} className={`space-y-2 ${spacingClass}`} style={blockStyle}>
              {listData.items.map((item, itemIndex) => (
                <div key={itemIndex} className="flex items-center gap-3">
                  <span className={`text-base sm:text-lg ${listData.checkedItems?.[itemIndex] ? 'text-green-500' : 'text-gray-400'}`}>
                    {listData.checkedItems?.[itemIndex] ? '✓' : '○'}
                  </span>
                  <span className={listData.checkedItems?.[itemIndex] ? 'line-through text-gray-500' : ''}>{item}</span>
                </div>
              ))}
            </div>
          );
        }

        const getListStyleType = () => {
          if (listData.listType === 'unordered') {
            switch (listData.listStyle) {
              case 'circle': return 'circle';
              case 'square': return 'square';
              default: return 'disc';
            }
          } else if (listData.listType === 'ordered') {
            switch (listData.listStyle) {
              case 'alpha': return 'lower-alpha';
              case 'roman': return 'lower-roman';
              default: return 'decimal';
            }
          }
          return 'disc';
        };
        
        const ListTag = listData.listType === 'ordered' ? 'ol' : 'ul';
        return (
          <ListTag key={index} className={`space-y-1 ml-4 sm:ml-6 ${spacingClass}`} style={{ ...blockStyle, listStyleType: getListStyleType() }}>
            {listData.items.map((item, itemIndex) => (
              <li key={itemIndex} className="leading-relaxed text-sm sm:text-base">
                {item}
              </li>
            ))}
          </ListTag>
        );

      case 'quote':
        return (
          <div key={index} className={`relative pl-6 sm:pl-8 py-4 sm:py-6 ${spacingClass}`} style={blockStyle}>
            <div 
              className="absolute left-0 top-0 bottom-0 w-1 rounded-full"
              style={{ backgroundColor: blockData.accentColor || theme.accentColor }}
            />
            <blockquote className="text-lg sm:text-xl italic leading-relaxed mb-3" style={{ color: blockData.textColor || theme.textColor }}>
              "{section.text}"
            </blockquote>
            {blockData.author && (
              <cite className="text-xs sm:text-sm text-gray-600 not-italic font-medium">— {blockData.author}</cite>
            )}
          </div>
        );

      case 'divider':
        if (section.text?.startsWith('divider-')) {
          const parts = section.text.split('-');
          const dividerStyle = parts[1] || 'line';
          const dividerSize = parts[2] || '1';
          
          if (dividerStyle === 'dots') {
            return (
              <div key={index} className={`flex justify-center gap-2 ${spacingClass}`} style={blockStyle}>
                <span style={{ transform: `scale(${dividerSize})` }} className="w-2 h-2 bg-gray-400 rounded-full"></span>
                <span style={{ transform: `scale(${dividerSize})` }} className="w-2 h-2 bg-gray-400 rounded-full"></span>
                <span style={{ transform: `scale(${dividerSize})` }} className="w-2 h-2 bg-gray-400 rounded-full"></span>
              </div>
            );
          } else if (dividerStyle === 'stars') {
            return (
              <div key={index} className={`text-center text-gray-400 ${spacingClass}`} style={{ fontSize: `${dividerSize * 16}px sm:${dividerSize * 20}px`, ...blockStyle }}>★ ★ ★</div>
            );
          } else {
            return (
              <hr key={index} style={{ borderStyle: dividerStyle, borderWidth: `${dividerSize}px`, ...blockStyle }} className={`border-gray-300 ${spacingClass}`} />
            );
          }
        }
        return <hr key={index} className={`border-gray-300 ${spacingClass}`} style={blockStyle} />;

      case 'embed':
        return (
          <div key={index} className={`${spacingClass}`} style={blockStyle}>
            <iframe
              src={getEmbedUrl(section.image)}
              className="w-full h-[200px] sm:h-[400px] rounded-xl"
              allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              title="Embedded content"
            />
          </div>
        );

      case 'gallery':
        if (!section.image) return null;
        const galleryUrls = section.image.split(',');
        const galleryLayout = blockData.layout || 'grid';
        
        return (
          <div key={index} className={spacingClass} style={blockStyle}>
            {galleryLayout === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {galleryUrls.map((url, i) => (
                  <img key={i} src={url.trim()} alt={`Gallery ${i}`} className="w-full h-auto rounded-xl" />
                ))}
              </div>
            ) : (
              <div className="flex overflow-x-auto gap-4">
                {galleryUrls.map((url, i) => (
                  <img key={i} src={url.trim()} alt={`Gallery ${i}`} className="h-48 sm:h-64 object-cover rounded-xl flex-shrink-0" />
                ))}
              </div>
            )}
          </div>
        );

      case 'button':
        const buttonAlignment = blockData.alignment || 'center';
        const buttonAlignmentClass = buttonAlignment === 'left' ? 'text-left' : 
                                    buttonAlignment === 'right' ? 'text-right' : 'text-center';
        
        return (
          <div key={index} className={`${buttonAlignmentClass} ${spacingClass}`} style={blockStyle}>
            <a 
              href={section.image || '#'} 
              style={{ 
                backgroundColor: blockData.buttonStyle === 'outline' ? 'transparent' : (blockData.buttonColor || '#3B82F6'), 
                color: blockData.buttonStyle === 'outline' ? (blockData.buttonColor || '#3B82F6') : (blockData.textColor || '#FFFFFF'),
                borderColor: blockData.buttonColor || '#3B82F6'
              }}
              className={`inline-block px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-medium transition-all text-sm sm:text-base ${
                blockData.buttonStyle === 'outline' ? 'border-2' : ''
              } hover:opacity-80 no-underline`}
            >
              {section.text || 'Button'}
            </a>
          </div>
        );

      case 'columns':
        let columnsData = { left: '', right: '', leftAlign: 'left', rightAlign: 'left', leftType: 'text', rightType: 'text', leftImage: '', rightImage: '' };
        try {
          const parsed = JSON.parse(section.text);
          columnsData = { ...columnsData, ...parsed };
        } catch (e) {}

        return (
          <div key={index} className={`grid grid-cols-1 sm:grid-cols-2 gap-4 ${spacingClass}`} style={blockStyle}>
            <div style={{ textAlign: columnsData.leftAlign || 'left' }}>
              {columnsData.leftType === 'image' && columnsData.leftImage ? (
                <img src={columnsData.leftImage} alt="Left column" className="w-full rounded-lg mb-2" />
              ) : (
                columnsData.left
              )}
            </div>
            <div style={{ textAlign: columnsData.rightAlign || 'left' }}>
              {columnsData.rightType === 'image' && columnsData.rightImage ? (
                <img src={columnsData.rightImage} alt="Right column" className="w-full rounded-lg mb-2" />
              ) : (
                columnsData.right
              )}
            </div>
          </div>
        );

      case 'spacer':
        const spacerHeight = section.text?.startsWith('spacer-') ? 
                            parseInt(section.text.split('-')[1]) : 
                            (blockData.height || 20);
        
        return <div key={index} style={{ height: `${spacerHeight}px`, ...blockStyle }} className={spacingClass} />;

      case 'card':
        if (!section.heading && !section.text && !section.image) return null;
        const cardMedia = section.image ? section.image.split(',') : [];
        const cardLayout = blockData.layout || 'grid';
        const cardSize = blockData.size || 'medium';
        
        return (
          <div key={index} className={`border rounded-xl p-4 ${spacingClass}`} style={blockStyle}>
            {cardMedia.length > 0 && (
              <div className={`mb-4 ${cardLayout === 'grid' ? 'grid grid-cols-1 sm:grid-cols-3 gap-4' : 'flex overflow-x-auto gap-4'}`}>
                {cardMedia.map((url, i) => (
                  <div key={i}>
                    {url.trim().endsWith('.mp4') || url.trim().endsWith('.webm') ? (
                      <video 
                        src={url.trim()} 
                        controls 
                        className={`w-full rounded-xl ${cardSize === 'small' ? 'h-24' : cardSize === 'large' ? 'h-40 sm:h-48' : 'h-32'}`} 
                      />
                    ) : (
                      <img 
                        src={url.trim()} 
                        alt={`Card media ${i}`} 
                        className={`w-full rounded-xl ${cardSize === 'small' ? 'h-24' : cardSize === 'large' ? 'h-40 sm:h-48' : 'h-32'} object-cover`} 
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
            {section.heading && <h3 className="text-lg sm:text-xl font-bold mb-2">{section.heading}</h3>}
            {section.text && <p className="text-sm sm:text-base">{section.text}</p>}
          </div>
        );

      default:
        // Legacy content rendering
        return (
          <div key={index} className={spacingClass} style={blockStyle}>
            {section.heading && (
              <h2 style={{ color: theme.primaryColor, fontSize: '24px sm:28px', fontWeight: 'bold', margin: '24px 0 16px 0' }}>
                {section.heading}
              </h2>
            )}
            {section.image && (
              <img 
                src={section.image} 
                alt={section.heading || 'Blog image'} 
                style={{ maxWidth: '100% sm:300px', height: 'auto', margin: '16px 0', borderRadius: '8px' }} 
              />
            )}
            {section.text && (
              <p style={{ marginBottom: '24px' }} className="text-sm sm:text-base">{section.text}</p>
            )}
          </div>
        );
    }
  };

  // Fetch blog 
  useEffect(() => {
    const fetchBlog = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/blogs/${blogId}`);
        const blogData = response.data;

        const mappedBlog = {
          id: blogData._id.toString(),
          title: blogData.title,
          publishDate: new Date(blogData.publish_date).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric'
          }),
          featuredImage: blogData.images[0],
          content: blogData.content || [],
          images: blogData.images || [],
          videos: (blogData.videos || []).map((url) => {
            const src = (url || '').trim();
            const isYouTube = /youtube\.com\/watch\?v=|youtu\.be\//i.test(src);
            const isVimeo = /vimeo\.com\//i.test(src);
            let thumbnail;
            if (isYouTube) {
              try {
                const id = src.includes('watch?v=') ? src.split('watch?v=')[1].split('&')[0] : src.split('youtu.be/')[1].split('?')[0];
                thumbnail = `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
              } catch (e) { thumbnail = undefined; }
            } else if (src.includes('cloudinary')) {
              try {
                thumbnail = src.replace(/\.(mp4|webm|ogg)(\?.*)?$/i, '.jpg');
              } catch (e) { thumbnail = undefined; }
            } else {
              thumbnail = undefined;
            }

            const isEmbed = isYouTube || isVimeo || /tiktok\.com|player\.|\/embed\//i.test(src);
            return { src, thumbnail: thumbnail || 'https://via.placeholder.com/800x450?text=Video', isEmbed };
          }),
          tags: blogData.tags || [],
          author: blogData.author,
          theme: blogData.theme
        };

        setBlog(mappedBlog);
        setLoading(false);

        // Calculate reading time (assuming 200 words per minute)
        const contentText = blogData.content
          .map(section => `${section.heading || ''} ${section.text || ''}`)
          .join(' ')
          .replace(/<[^>]*>/g, '');
        const wordCount = contentText.split(' ').filter(word => word.length > 0).length;
        setReadingTime(Math.ceil(wordCount / 200));
      } catch (err) {
        console.error('Error fetching blog:', err);
        setError('Failed to load blog');
        setLoading(false);
      }
    };

    const fetchRecentBlogs = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/blogs`);
        // Exclude current blog, sort by publish_date desc, take 6
        const blogs = response.data
          .filter(b => b._id.toString() !== blogId)
          .sort((a, b) => new Date(b.publish_date) - new Date(a.publish_date))
          .slice(0, 6)
          .map(blog => {
            let excerpt = 'No excerpt available';
            if (Array.isArray(blog.content) && blog.content.length > 0) {
              const firstBlockWithText = blog.content.find(
                (block) => typeof block.text === 'string' && block.text.trim().length > 0
              );
              if (firstBlockWithText) {
                const plainText = firstBlockWithText.text.replace(/<[^>]+>/g, '');
                excerpt = plainText.slice(0, 100) + (plainText.length > 100 ? '...' : '');
              }
            }
            return {
              id: blog._id.toString(),
              title: blog.title,
              image: blog.images[0],
              date: new Date(blog.publish_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
              author: blog.author,
              excerpt,
            };
          });
        setRecentBlogs(blogs);
      } catch (err) {
        setRecentBlogs([]);
      }
    };

    fetchBlog();
    fetchRecentBlogs();
  }, [blogId]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [blogId]);

  const handleVideoPlay = (videoIndex) => {
    setCurrentVideo(videoIndex);
    setIsPlaying(true);
  };

  const togglePlayPause = () => {
    const videoElement = document.getElementById('blog-video-player');
    if (videoElement) {
      if (isPlaying) {
        videoElement.pause();
      } else {
        videoElement.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    const videoElement = document.getElementById('blog-video-player');
    if (videoElement) {
      videoElement.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleBack = () => {
    navigate('/blogs');
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center" style={{ fontFamily: "'Comic Sans MS', 'Comic Neue'" }}>
        <p className="text-xl sm:text-2xl text-[#074a5b]">Blog wird geladen...</p>
      </div>
    );
  }

  // Error state
  if (error || !blog) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center" style={{ fontFamily: "'Comic Sans MS', 'Comic Neue'" }}>
        <p className="text-xl sm:text-2xl text-[#074a5b]">{error || 'Blog nicht gefunden'}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "'Comic Sans MS', 'Comic Neue'" }}>
      {/* Hero Section */}
      <section className="relative h-[50vh] sm:h-[65vh] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent z-10"></div>
        {blog.featuredImage ? (
          <img
            src={blog.featuredImage}
            className="w-full h-full object-cover"
            alt="Blog featured"
          />
        ) : (
          <div className="w-full h-full" style={{ backgroundColor: '#074a5b' }}></div>
        )}
        <div className="absolute top-12 sm:top-24 left-4 sm:left-48 z-30">
            <button
              onClick={handleBack}
              className="inline-flex items-center gap-2 text-[#1e809b] hover:text-[#074a5b] font-semibold transition-colors duration-300 group px-3 sm:px-4 py-2 rounded-full bg-white shadow-sm border border-gray-200 w-auto"
              aria-label="Back to Blogs"
              style={{ minWidth: 'unset' }}
            >
              <ArrowLeft className="w-4 sm:w-5 h-4 sm:h-5 group-hover:-translate-x-1 transition-transform duration-300" />
              Zurück zu Blogs
            </button>
          </div>
        <div className="absolute bottom-0 left-0 right-0 z-20 p-4 sm:p-9">
          <div className="max-w-4xl sm:max-w-6xl mx-auto">
            <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold text-white drop-shadow-2xl mb-6 sm:mb-8" style={{ lineHeight: 1.1, letterSpacing: '0.01em' }}>
              {blog.title}
            </h1>
            <div className="flex flex-wrap items-center gap-2 sm:gap-4 mb-4 text-white/90 text-sm sm:text-base">
              <span className="bg-[#1e809b] px-2 sm:px-3 py-1 rounded-full font-semibold">
                <Tag className="w-3 sm:w-4 h-3 sm:h-4 inline mr-1" />
                {blog.tags[0] || 'General'}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3 sm:w-4 h-3 sm:h-4" />
                {blog.publishDate}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 sm:w-4 h-3 sm:h-4" />
                {readingTime} Min Lesen
              </span>
              <span className="flex items-center gap-1">
                <User className="w-3 sm:w-4 h-3 sm:h-4" />
                {blog.author}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-8xl mx-auto px-4 py-12 flex flex-col lg:flex-row gap-12">
  <div className="flex-1 min-w-0 lg:ml-36">
          <article className="prose prose-sm sm:prose-lg max-w-none mb-12 sm:mb-16">
            <div className="space-y-4 sm:space-y-6">
              {blog.content.map((section, index) => renderContentBlock(section, index))}
            </div>
            {blog.content.length === 0 && (
              <div className="text-center py-12 sm:py-16 text-gray-500">
                <p className="text-lg sm:text-xl mb-2">Kein Inhalt verfügbar</p>
              </div>
            )}
          </article>

        {/* Video Section */}
        {blog.videos && blog.videos.length > 0 && (
          <section className="mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8" style={{ color: '#074a5b' }}>
              Vorgestellte Videos
            </h2>

              {/* Video Player */}
              {currentVideo !== null && (
                <div className="mb-6 sm:mb-8 bg-black rounded-2xl overflow-hidden shadow-2xl">
                  <div className="relative aspect-video">
                    {blog.videos[currentVideo]?.isEmbed ? (
                      <iframe
                        src={getEmbedUrl(blog.videos[currentVideo].src)}
                        className="w-full h-full"
                        allowFullScreen
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        title={`video-embed-${currentVideo}`}
                      />
                    ) : (
                      <video
                        id="blog-video-player"
                        className="w-full h-full"
                        src={blog.videos[currentVideo].src}
                        {...(blog.videos[currentVideo].thumbnail ? { poster: blog.videos[currentVideo].thumbnail } : {})}
                        controls={false}
                        autoPlay={isPlaying}
                        muted={isMuted}
                        onError={() => setError('Failed to load video')}
                      />
                    )}

                    {/* Custom Controls Overlay */}
                    <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-white">
                      <div className="flex items-center gap-3 sm:gap-4">
                        <button
                          onClick={togglePlayPause}
                          className="bg-white/20 backdrop-blur-sm rounded-full p-2 sm:p-3 hover:bg-white/30 transition-all duration-300"
                          aria-label={isPlaying ? 'Pause video' : 'Play video'}
                        >
                          {isPlaying ? <Pause className="w-5 sm:w-6 h-5 sm:h-6" /> : <Play className="w-5 sm:w-6 h-5 sm:h-6" />}
                        </button>
                        <button
                          onClick={toggleMute}
                          className="bg-white/20 backdrop-blur-sm rounded-full p-2 sm:p-3 hover:bg-white/30 transition-all duration-300"
                          aria-label={isMuted ? 'Unmute video' : 'Mute video'}
                        >
                          {isMuted ? <VolumeX className="w-5 sm:w-6 h-5 sm:h-6" /> : <Volume2 className="w-5 sm:w-6 h-5 sm:h-6" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Video Thumbnails */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
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
                      onError={(e) => (e.target.src = 'https://via.placeholder.com/800?text=Video')}
                    />
                    <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center">
                      <div className="bg-white/90 backdrop-blur-sm rounded-full p-3 sm:p-4 group-hover:bg-white group-hover:scale-110 transition-all duration-300">
                        <Play className="w-6 sm:w-8 h-6 sm:h-8 text-[#074a5b] ml-1" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              </div>
            </section>
          )}
        </div>

        {/* Sidebar: Recent Blogs */}
        <aside className="w-full lg:w-72 flex-shrink-0 lg:mr-10 group/sidebar">
          <div className="sticky top-20 sm:top-28">
            <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6" style={{ color: '#074a5b' }}>
              Aktuelle Blogs
            </h2>
            <div className="space-y-4 sm:space-y-6">
              {recentBlogs.length === 0 && (
                <div className="text-gray-400 text-center text-sm sm:text-base">Keine weiteren Blogs gefunden.</div>
              )}
              {recentBlogs.map((blog) => (
                <div key={blog.id} className="bg-white rounded-2xl shadow-lg overflow-hidden flex flex-col group hover:shadow-xl transition-all duration-300 border border-gray-100">
                  <div className="h-32 w-full overflow-hidden flex-shrink-0">
                    {blog.image ? (
                      <img
                        src={blog.image}
                        alt={blog.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full" style={{ backgroundColor: '#074a5b' }}></div>
                    )}
                  </div>
                  <div className="p-4 flex flex-col justify-between flex-1">
                    <div>
                      <h3 className="text-base sm:text-lg font-bold mb-1" style={{ color: '#074a5b' }}>{blog.title}</h3>
                      <div className="text-xs text-gray-500 mb-2 flex items-center gap-2">
                        <Calendar size={12} /> {blog.date} <User size={12} /> {blog.author}
                      </div>
                      <div className="text-gray-600 text-xs sm:text-sm mb-2 line-clamp-3">{blog.excerpt}</div>
                    </div>
                    <button
                      className="text-xs sm:text-sm font-semibold hover:underline mt-2 text-[#1e809b]"
                      onClick={() => navigate(`/blogs/${blog.id}`)}
                      aria-label={`Read more about ${blog.title}`}
                    >
                      Lesen Sie mehr →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default BlogPage;
