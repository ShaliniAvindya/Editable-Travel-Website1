import { useNavigate } from 'react-router-dom';
import React, { useState, useEffect, useContext, useRef } from 'react';
import axios from 'axios';
import { 
  X, Plus, Move, Eye, EyeOff, Type, Image, Video, Quote, 
  Code, List, Link2, Palette, Settings, Save, ArrowUp, 
  ArrowDown, Copy, Trash2, AlignLeft, AlignCenter, AlignRight,
  Bold, Italic, Underline, ChevronDown, Monitor, Smartphone,
  Tablet, Paintbrush, Layout, Grid, Columns, Square,
  Circle, Triangle, Star, Heart, Zap, Sun, Moon, AlignJustify,
  ExternalLink, Mail, Phone, MapPin, Clock
} from 'lucide-react';
import { FaRegClone, FaToggleOn, FaToggleOff } from 'react-icons/fa';
import { AuthContext } from '../context/AuthContext';
import { API_BASE_URL } from '../apiConfig';

const imgbbAxios = axios.create();

const MAX_VIDEO_SIZE = 100 * 1024 * 1024;

const BLOCK_TYPES = {
  TEXT: 'text',
  IMAGE: 'image',
  VIDEO: 'video',
  QUOTE: 'quote',
  LIST: 'list',
  HEADING: 'heading',
  DIVIDER: 'divider',
  EMBED: 'embed',
  GALLERY: 'gallery',
  BUTTON: 'button',
  COLUMNS: 'columns',
  SPACER: 'spacer',
  CARD: 'card',
  CTA: 'cta'
};

// Theme presets
const THEME_PRESETS = {
  default: {
    name: 'Default',
    primaryColor: '#074a5b',
    secondaryColor: '#3B82F6',
    accentColor: '#F97316',
    backgroundColor: '#FFFFFF',
    textColor: '#1F2937',
    borderRadius: '8px',
    fontFamily: '"Comic Sans MS", "Comic Neue"'
  },
  modern: {
    name: 'Modern',
    primaryColor: '#1F2937',
    secondaryColor: '#6366F1',
    accentColor: '#EF4444',
    backgroundColor: '#F9FAFB',
    textColor: '#111827',
    borderRadius: '12px',
    fontFamily: '"Comic Sans MS", "Comic Neue"'
  },
  elegant: {
    name: 'Elegant',
    primaryColor: '#7C3AED',
    secondaryColor: '#EC4899',
    accentColor: '#F59E0B',
    backgroundColor: '#FEFEFE',
    textColor: '#374151',
    borderRadius: '16px',
    fontFamily: '"Comic Sans MS", "Comic Neue"'
  },
  nature: {
    name: 'Nature',
    primaryColor: '#059669',
    secondaryColor: '#10B981',
    accentColor: '#84CC16',
    backgroundColor: '#F0FDF4',
    textColor: '#1F2937',
    borderRadius: '8px',
    fontFamily: '"Comic Sans MS", "Comic Neue"'
  }
};

// Rich Text Toolbar Component
const AdvancedRichTextToolbar = ({ onFormat, activeFormats, blockId }) => {
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  
  const formatOptions = [
    { icon: Bold, command: 'bold', title: 'Bold' },
    { icon: Italic, command: 'italic', title: 'Italic' },
    { icon: Underline, command: 'underline', title: 'Underline' },
    { icon: AlignLeft, command: 'justifyLeft', title: 'Align Left' },
    { icon: AlignCenter, command: 'justifyCenter', title: 'Align Center' },
    { icon: AlignRight, command: 'justifyRight', title: 'Align Right' },
    { icon: AlignJustify, command: 'justifyFull', title: 'Justify' },
    { icon: List, command: 'insertUnorderedList', title: 'Bullet List' },
    { icon: Link2, command: 'createLink', title: 'Insert Link' }
  ];

  const moreOptions = [
    { command: 'strikeThrough', title: 'Strikethrough', icon: 'S' },
    { command: 'subscript', title: 'Subscript', icon: 'X₂' },
    { command: 'superscript', title: 'Superscript', icon: 'X²' },
    { command: 'indent', title: 'Indent', icon: '→' },
    { command: 'outdent', title: 'Outdent', icon: '←' },
    { command: 'removeFormat', title: 'Clear Formatting', icon: '⚫' }
  ];

  const handleFormat = (command, value = null) => {
    if (command === 'createLink') {
      const url = prompt('Enter URL:');
      if (url) {
        // Ensure URL has protocol
        const fullUrl = url.startsWith('http') ? url : `https://${url}`;
        onFormat(command, fullUrl);
      }
    } else if (command === 'insertUnorderedList' || command === 'insertOrderedList') {
      const editableElement = document.querySelector(`[data-block-id="${blockId}"]`);
      if (editableElement) {
        editableElement.focus();
        document.execCommand(command, false, null);
      }
    } else {
      onFormat(command, value);
    }
  };

  return (
    <div className="flex items-center gap-1 p-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl mb-3 flex-wrap border">
      {formatOptions.map((option) => (
        <button
          key={option.command}
          type="button"
          onClick={() => handleFormat(option.command)}
          className={`p-2 rounded-lg hover:bg-white transition-all duration-200 shadow-sm ${
            activeFormats?.includes(option.command) 
              ? 'bg-blue-100 text-blue-700 border border-blue-200' 
              : 'text-gray-600 hover:text-gray-800'
          }`}
          title={option.title}
        >
          <option.icon size={16} />
        </button>
      ))}
      
      <div className="w-px h-6 bg-gray-300 mx-2" />
      
      <select
        onChange={(e) => handleFormat('fontSize', e.target.value)}
        className="px-3 py-2 rounded-lg border text-sm bg-white hover:bg-gray-50 transition-colors"
      >
        <option value="">Size</option>
        <option value="1">XX-Small</option>
        <option value="2">X-Small</option>
        <option value="3">Small</option>
        <option value="4">Medium</option>
        <option value="5">Large</option>
        <option value="6">X-Large</option>
        <option value="7">XX-Large</option>
      </select>

      <select
        onChange={(e) => handleFormat('fontName', e.target.value)}
        className="px-3 py-2 rounded-lg border text-sm bg-white hover:bg-gray-50 transition-colors"
      >
        <option value="">Font</option>
        <option value="Arial">Arial</option>
        <option value="Georgia">Georgia</option>
        <option value="Times New Roman">Times</option>
        <option value="Courier New">Courier</option>
        <option value="Verdana">Verdana</option>
        <option value="Comic Sans MS">Comic Sans</option>
      </select>
      
      <input
        type="color"
        onChange={(e) => handleFormat('foreColor', e.target.value)}
        className="w-10 h-10 rounded-lg border cursor-pointer hover:scale-110 transition-transform"
        title="Text Color"
      />
      
      <input
        type="color"
        onChange={(e) => handleFormat('hiliteColor', e.target.value)}
        className="w-10 h-10 rounded-lg border cursor-pointer hover:scale-110 transition-transform"
        title="Highlight Color"
      />
      
      <button
        onClick={() => setShowMoreOptions(!showMoreOptions)}
        className="p-2 rounded-lg bg-purple-600 transition-all duration-200 text-white relative"
        title="More Options"
      >
        <ChevronDown className={`transform transition-transform ${showMoreOptions ? 'rotate-180' : ''}`} size={16} />
      </button>
      
      {showMoreOptions && (
        <div className="absolute top-full left-0 mt-2 bg-white rounded-xl shadow-xl border p-2 z-10 flex gap-1">
          {moreOptions.map((option) => (
            <button
              key={option.command}
              onClick={() => handleFormat(option.command)}
              className="px-3 py-2 text-sm rounded-lg hover:bg-gray-100 transition-colors whitespace-nowrap flex items-center gap-2"
              title={option.title}
            >
              <span className="text-xs font-mono">{option.icon}</span>
              {option.title}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// Block Settings Component
const AdvancedBlockSettings = ({ block, onUpdate, onClose }) => {
  const [activeTab, setActiveTab] = useState('style');
  
  const tabs = [
    { id: 'style', label: 'Style', icon: Paintbrush },
    { id: 'layout', label: 'Layout', icon: Layout },
    { id: 'effects', label: 'Effects', icon: Zap }
  ];

  const animations = [
    'none', 'fadeIn', 'slideUp', 'slideDown', 'slideLeft', 'slideRight', 
    'zoomIn', 'zoomOut', 'bounce', 'pulse', 'shake'
  ];

  const shadows = [
    'none', 'sm', 'md', 'lg', 'xl', '2xl', 'inner'
  ];

  return (
    <div className="absolute top-0 right-0 bg-white rounded-2xl shadow-2xl border w-80 z-30 max-h-96 overflow-y-auto">
      <div className="flex justify-between items-center p-4 border-b">
        <h3 className="font-semibold text-lg">Block Settings</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <X size={20} />
        </button>
      </div>
      
      <div className="flex border-b">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 p-3 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
              activeTab === tab.id 
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' 
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>
      
      <div className="p-4 space-y-4">
        {activeTab === 'style' && (
          <>
            <div>
              <label className="block text-sm font-medium mb-2">Background Style</label>
              <select
                value={block.backgroundStyle || 'none'}
                onChange={(e) => onUpdate({ ...block, backgroundStyle: e.target.value })}
                className="w-full p-2 border rounded-lg"
              >
                <option value="none">None</option>
                <option value="solid">Solid Color</option>
              </select>
            </div>
            
            {block.backgroundStyle === 'solid' && (
              <div>
                <label className="block text-sm font-medium mb-2">Background Color</label>
                <input
                  type="color"
                  value={block.backgroundColor || '#ffffff'}
                  onChange={(e) => onUpdate({ ...block, backgroundColor: e.target.value })}
                  className="w-full h-10 rounded-lg border cursor-pointer"
                />
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium mb-2">Border Style</label>
              <select
                value={block.borderStyle || 'none'}
                onChange={(e) => onUpdate({ ...block, borderStyle: e.target.value })}
                className="w-full p-2 border rounded-lg"
              >
                <option value="none">None</option>
                <option value="solid">Solid</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Border Radius</label>
              <input
                type="range"
                min="0"
                max="50"
                value={block.borderRadius || 8}
                onChange={(e) => onUpdate({ ...block, borderRadius: parseInt(e.target.value) })}
                className="w-full"
              />
              <span className="text-sm text-gray-500">{block.borderRadius || 8}px</span>
            </div>
          </>
        )}
        
        {activeTab === 'layout' && (
          <>
            <div>
              <label className="block text-sm font-medium mb-2">Spacing</label>
              <select
                value={block.spacing || 'normal'}
                onChange={(e) => onUpdate({ ...block, spacing: e.target.value })}
                className="w-full p-2 border rounded-lg"
              >
                <option value="none">None</option>
                <option value="xs">Extra Small</option>
                <option value="sm">Small</option>
                <option value="normal">Normal</option>
                <option value="lg">Large</option>
                <option value="xl">Extra Large</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Padding</label>
              <input
                type="range"
                min="0"
                max="50"
                value={block.padding || 16}
                onChange={(e) => onUpdate({ ...block, padding: parseInt(e.target.value) })}
                className="w-full"
              />
              <span className="text-sm text-gray-500">{block.padding || 16}px</span>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Width</label>
              <select
                value={block.width || 'full'}
                onChange={(e) => onUpdate({ ...block, width: e.target.value })}
                className="w-full p-2 border rounded-lg"
              >
                <option value="auto">Auto</option>
                <option value="1/2">Half Width</option>
                <option value="2/3">Two Thirds</option>
                <option value="3/4">Three Quarters</option>
                <option value="full">Full Width</option>
              </select>
            </div>
          </>
        )}
        
        {activeTab === 'effects' && (
          <>
            <div>
              <label className="block text-sm font-medium mb-2">Shadow</label>
              <select
                value={block.shadow || 'none'}
                onChange={(e) => onUpdate({ ...block, shadow: e.target.value })}
                className="w-full p-2 border rounded-lg"
              >
                {shadows.map(shadow => (
                  <option key={shadow} value={shadow}>{shadow}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Opacity</label>
              <input
                type="range"
                min="0"
                max="100"
                value={block.opacity || 100}
                onChange={(e) => onUpdate({ ...block, opacity: parseInt(e.target.value) })}
                className="w-full"
              />
              <span className="text-sm text-gray-500">{block.opacity || 100}%</span>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Hover Effect</label>
              <select
                value={block.hoverEffect || 'none'}
                onChange={(e) => onUpdate({ ...block, hoverEffect: e.target.value })}
                className="w-full p-2 border rounded-lg"
              >
                <option value="none">None</option>
                <option value="lift">Lift</option>
                <option value="scale">Scale</option>
                <option value="glow">Glow</option>
                <option value="rotate">Rotate</option>
              </select>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// Content Block Component
const ContentBlock = ({ 
  block, 
  index, 
  updateBlock, 
  deleteBlock, 
  moveBlock, 
  duplicateBlock,
  uploadImage,
  uploadVideo,
  uploading,
  theme 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [localContent, setLocalContent] = useState(block.content || '');
  const [showSettings, setShowSettings] = useState(false);
  const [activeFormats, setActiveFormats] = useState([]);

  const contentRef = useRef(null);

  const handleRichTextFormat = (command, value = null) => {
    if (contentRef.current) {
      contentRef.current.focus();
      document.execCommand(command, false, value);
      const formats = [];
      if (document.queryCommandState('bold')) formats.push('bold');
      if (document.queryCommandState('italic')) formats.push('italic');
      if (document.queryCommandState('underline')) formats.push('underline');
      setActiveFormats(formats);
    }
  };

  const handleContentChange = (field, value) => {
    updateBlock(index, { ...block, [field]: value });
  };

  const handleSave = () => {
    updateBlock(index, { ...block, content: contentRef.current.innerHTML });
    setIsEditing(false);
  };

  const getBlockClasses = () => {
    const spacingMap = {
      none: 'mb-0',
      xs: 'mb-1',
      sm: 'mb-3',
      normal: 'mb-6',
      lg: 'mb-10',
      xl: 'mb-16'
    };
    
    const widthMap = {
      auto: 'w-auto',
      '1/2': 'w-1/2',
      '2/3': 'w-2/3',
      '3/4': 'w-3/4',
      full: 'w-full'
    };
    
    const shadowMap = {
      none: '',
      sm: 'shadow-sm',
      md: 'shadow-md',
      lg: 'shadow-lg',
      xl: 'shadow-xl',
      '2xl': 'shadow-2xl',
      inner: 'shadow-inner'
    };

    const hoverEffectMap = {
      none: '',
      lift: 'hover:-translate-y-1',
      scale: 'hover:scale-105',
      glow: 'hover:shadow-lg hover:shadow-blue-500/25',
      rotate: 'hover:rotate-1'
    };

    let classes = `relative transition-all duration-300 ${spacingMap[block.spacing] || spacingMap.normal} ${widthMap[block.width] || widthMap.full} ${shadowMap[block.shadow] || ''} ${hoverEffectMap[block.hoverEffect] || ''}`;
    
    if (block.borderStyle && block.borderStyle !== 'none') {
      classes += ` border border-gray-300`;
    }
    
    return classes;
  };

  const getBlockStyle = () => {
    const style = {};
    
    if (block.backgroundColor && block.backgroundStyle === 'solid') {
      style.backgroundColor = block.backgroundColor;
    }
    
    if (block.borderRadius) {
      style.borderRadius = `${block.borderRadius}px`;
    }
    
    if (block.padding) {
      style.padding = `${block.padding}px`;
    }
    
    if (block.opacity && block.opacity !== 100) {
      style.opacity = block.opacity / 100;
    }
    
    return style;
  };

  // Embed URL conversion function
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

  const renderBlockContent = () => {
    switch (block.type) {
      case BLOCK_TYPES.HEADING:
        const HeadingTag = block.level || 'h2';
        return (
          <div>
            <div className="flex gap-2 mb-3">
              <select
                value={block.level || 'h2'}
                onChange={(e) => handleContentChange('level', e.target.value)}
                className="px-3 py-2 border rounded-lg text-sm bg-white"
              >
                <option value="h1">H1 - Main Title</option>
                <option value="h2">H2 - Section Title</option>
                <option value="h3">H3 - Subsection</option>
                <option value="h4">H4 - Minor Heading</option>
                <option value="h5">H5 - Small Heading</option>
                <option value="h6">H6 - Tiny Heading</option>
              </select>
              <select
                value={block.alignment || 'left'}
                onChange={(e) => handleContentChange('alignment', e.target.value)}
                className="px-3 py-2 border rounded-lg text-sm bg-white"
              >
                <option value="left">Left</option>
                <option value="center">Center</option>
                <option value="right">Right</option>
              </select>
              <input
                type="color"
                value={block.textColor || theme.primaryColor}
                onChange={(e) => handleContentChange('textColor', e.target.value)}
                className="w-12 h-10 rounded-lg border cursor-pointer"
                title="Text Color"
              />
            </div>
            <input
              type="text"
              value={block.content || ''}
              onChange={(e) => handleContentChange('content', e.target.value)}
              placeholder="Enter heading text..."
              className="w-full p-4 border rounded-xl text-xl font-bold focus:ring-2 focus:ring-blue-500 outline-none"
              style={{ 
                color: block.textColor || theme.primaryColor,
                textAlign: block.alignment || 'left',
                fontSize: HeadingTag === 'h1' ? '2.5rem' : 
                         HeadingTag === 'h2' ? '2rem' : 
                         HeadingTag === 'h3' ? '1.75rem' : 
                         HeadingTag === 'h4' ? '1.5rem' : 
                         HeadingTag === 'h5' ? '1.25rem' : '1.125rem'
              }}
            />
          </div>
        );

      case BLOCK_TYPES.TEXT:
        return (
          <div>
            {isEditing && (
              <AdvancedRichTextToolbar 
                onFormat={handleRichTextFormat} 
                activeFormats={activeFormats}
                blockId={block.id}
              />
            )}
            <div
              ref={contentRef}
              contentEditable={isEditing}
              onBlur={(e) => setLocalContent(e.target.innerHTML)}
              onInput={(e) => setLocalContent(e.target.innerHTML)}
              dangerouslySetInnerHTML={{ __html: block.content || '<p>Click to edit text...</p>' }}
              className={`min-h-32 p-4 border rounded-xl transition-all duration-200 ${
                isEditing ? 'bg-white border-blue-300 ring-2 ring-blue-100' : 'bg-gray-50 hover:bg-gray-100'
              } focus:outline-none`}
              style={{ 
                fontFamily: block.fontFamily || theme.fontFamily,
                lineHeight: '1.6'
              }}
              data-block-id={block.id}
            />
            <div className="mt-3 flex gap-2">
              {isEditing ? (
                <>
                  <button
                    onClick={handleSave}
                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all"
                  >
                    <Save size={16} className="inline mr-1" />
                    Save
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-all"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all"
                >
                  <Type size={16} className="inline mr-1" />
                  Edit Text
                </button>
              )}
            </div>
          </div>
        );

      case BLOCK_TYPES.IMAGE:
        return (
          <div>
            {!block.url ? (
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center hover:border-blue-400 transition-colors">
                <Image className="mx-auto mb-4 text-gray-400" size={64} />
                <p className="text-gray-600 mb-4">Upload an image or enter URL</p>
                <div className="space-y-3">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files[0];
                      if (file) {
                        const url = await uploadImage(file);
                        if (url) handleContentChange('url', url);
                      }
                    }}
                    className="hidden"
                    id={`image-upload-${index}`}
                  />
                  <label
                    htmlFor={`image-upload-${index}`}
                    className="cursor-pointer bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-xl font-medium transition-all inline-block"
                  >
                    {uploading ? 'Uploading...' : 'Upload Image'}
                  </label>
                  <div className="text-gray-400">or</div>
                  <input
                    type="url"
                    placeholder="Enter image URL"
                    onChange={(e) => handleContentChange('url', e.target.value)}
                    className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>
            ) : (
              <div className={`text-${block.alignment || 'center'}`}>
                <div className="relative group">
                  <img
                    src={block.url}
                    alt={block.caption || 'Blog image'}
                    className={`rounded-xl transition-all duration-300 ${
                      block.size === 'small' ? 'max-w-xs' :
                      block.size === 'large' ? 'max-w-4xl' :
                      block.size === 'full' ? 'w-full' : 'max-w-2xl'
                    } ${block.hoverEffect === 'scale' ? 'group-hover:scale-105' : ''}`}
                    style={{ 
                      margin: block.alignment === 'left' ? '0' : 
                             block.alignment === 'right' ? '0 0 0 auto' : '0 auto',
                      filter: block.filter || 'none'
                    }}
                  />
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleContentChange('url', '')}
                      className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg shadow-lg"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
                <div className="mt-4 space-y-3">
                  <div className="flex gap-3">
                    <select
                      value={block.size || 'medium'}
                      onChange={(e) => handleContentChange('size', e.target.value)}
                      className="flex-1 p-2 border rounded-lg text-sm"
                    >
                      <option value="small">Small (300px)</option>
                      <option value="medium">Medium (600px)</option>
                      <option value="large">Large (800px)</option>
                      <option value="full">Full Width</option>
                    </select>
                    <select
                      value={block.alignment || 'center'}
                      onChange={(e) => handleContentChange('alignment', e.target.value)}
                      className="flex-1 p-2 border rounded-lg text-sm"
                    >
                      <option value="left">Left</option>
                      <option value="center">Center</option>
                      <option value="right">Right</option>
                    </select>
                  </div>
                  <input
                    type="text"
                    value={block.caption || ''}
                    onChange={(e) => handleContentChange('caption', e.target.value)}
                    placeholder="Image caption (optional)"
                    className="w-full p-3 border rounded-lg text-sm italic text-center focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>
            )}
          </div>
        );

      case BLOCK_TYPES.VIDEO:
        return (
          <div>
            {!block.url ? (
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center hover:border-blue-400 transition-colors">
                <Video className="mx-auto mb-4 text-gray-400" size={64} />
                <p className="text-gray-600 mb-4">Upload a video or enter URL</p>
                <div className="space-y-3">
                  <input
                    type="file"
                    accept="video/*"
                    onChange={async (e) => {
                      const file = e.target.files[0];
                      if (file) {
                        const url = await uploadVideo(file);
                        if (url) handleContentChange('url', url);
                      }
                    }}
                    className="hidden"
                    id={`video-upload-${index}`}
                  />
                  <label
                    htmlFor={`video-upload-${index}`}
                    className="cursor-pointer bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-xl font-medium transition-all inline-block"
                  >
                    {uploading ? 'Uploading...' : 'Upload Video'}
                  </label>
                  <div className="text-gray-400">or</div>
                  <input
                    type="url"
                    placeholder="Enter video URL"
                    onChange={(e) => handleContentChange('url', e.target.value)}
                    className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>
            ) : (
              <div className={`text-${block.alignment || 'center'}`}>
                <div className="relative group">
                  <video
                    src={block.url}
                    controls
                    className={`rounded-xl transition-all duration-300 ${
                      block.size === 'small' ? 'max-w-xs' :
                      block.size === 'large' ? 'max-w-4xl' :
                      block.size === 'full' ? 'w-full' : 'max-w-2xl'
                    } ${block.hoverEffect === 'scale' ? 'group-hover:scale-105' : ''}`}
                    style={{ 
                      margin: block.alignment === 'left' ? '0' : 
                             block.alignment === 'right' ? '0 0 0 auto' : '0 auto'
                    }}
                  />
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleContentChange('url', '')}
                      className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg shadow-lg"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
                <div className="mt-4 space-y-3">
                  <div className="flex gap-3">
                    <select
                      value={block.size || 'medium'}
                      onChange={(e) => handleContentChange('size', e.target.value)}
                      className="flex-1 p-2 border rounded-lg text-sm"
                    >
                      <option value="small">Small (300px)</option>
                      <option value="medium">Medium (600px)</option>
                      <option value="large">Large (800px)</option>
                      <option value="full">Full Width</option>
                    </select>
                    <select
                      value={block.alignment || 'center'}
                      onChange={(e) => handleContentChange('alignment', e.target.value)}
                      className="flex-1 p-2 border rounded-lg text-sm"
                    >
                      <option value="left">Left</option>
                      <option value="center">Center</option>
                      <option value="right">Right</option>
                    </select>
                  </div>
                  <input
                    type="text"
                    value={block.caption || ''}
                    onChange={(e) => handleContentChange('caption', e.target.value)}
                    placeholder="Video caption (optional)"
                    className="w-full p-3 border rounded-lg text-sm italic text-center focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>
            )}
          </div>
        );

      case BLOCK_TYPES.QUOTE:
        return (
          <div className="relative">
            <div className="absolute left-0 top-0 text-6xl text-gray-300 font-serif leading-none">"</div>
            <div className="pl-8">
              <textarea
                value={block.content || ''}
                onChange={(e) => handleContentChange('content', e.target.value)}
                placeholder="Enter your quote..."
                className="w-full p-4 border-none resize-none bg-transparent text-xl italic focus:outline-none leading-relaxed"
                rows="3"
                style={{ color: block.textColor || theme.textColor }}
              />
              <div className="flex gap-3 mt-3">
                <input
                  type="text"
                  value={block.author || ''}
                  onChange={(e) => handleContentChange('author', e.target.value)}
                  placeholder="Quote author (optional)"
                  className="flex-1 p-3 border rounded-lg text-right focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <input
                  type="color"
                  value={block.accentColor || theme.accentColor}
                  onChange={(e) => handleContentChange('accentColor', e.target.value)}
                  className="w-12 h-12 rounded-lg border cursor-pointer"
                  title="Accent Color"
                />
              </div>
            </div>
            <div 
              className="absolute left-0 top-0 bottom-0 w-1 rounded-full"
              style={{ backgroundColor: block.accentColor || theme.accentColor }}
            />
          </div>
        );

      case BLOCK_TYPES.LIST:
        return (
          <div>
            <div className="flex gap-3 mb-4">
              <select
                value={block.listType || 'unordered'}
                onChange={(e) => handleContentChange('listType', e.target.value)}
                className="px-3 py-2 border rounded-lg text-sm bg-white"
              >
                <option value="unordered">• Bullet List</option>
                <option value="ordered">1. Numbered List</option>
                <option value="checklist">✓ Checklist</option>
              </select>
              <select
                value={block.listStyle || 'disc'}
                onChange={(e) => handleContentChange('listStyle', e.target.value)}
                className="px-3 py-2 border rounded-lg text-sm bg-white"
              >
                {block.listType === 'unordered' && (
                  <>
                    <option value="disc">● Disc</option>
                    <option value="circle">○ Circle</option>
                    <option value="square">■ Square</option>
                  </>
                )}
                {block.listType === 'ordered' && (
                  <>
                    <option value="decimal">1, 2, 3</option>
                    <option value="alpha">a, b, c</option>
                    <option value="roman">i, ii, iii</option>
                  </>
                )}
              </select>
            </div>
            <div className="space-y-2">
              {(block.items || ['Add your first item here']).map((item, itemIndex) => (
                <div key={itemIndex} className="flex items-center gap-2">
                  {block.listType === 'checklist' && (
                    <input
                      type="checkbox"
                      checked={block.checkedItems?.[itemIndex] || false}
                      onChange={(e) => {
                        const checkedItems = { ...(block.checkedItems || {}) };
                        checkedItems[itemIndex] = e.target.checked;
                        handleContentChange('checkedItems', checkedItems);
                      }}
                      className="rounded"
                    />
                  )}
                  <input
                    type="text"
                    value={item}
                    onChange={(e) => {
                      const newItems = [...(block.items || [])];
                      newItems[itemIndex] = e.target.value;
                      handleContentChange('items', newItems);
                    }}
                    className="flex-1 p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="List item..."
                  />
                  <button
                    onClick={() => {
                      const newItems = (block.items || []).filter((_, i) => i !== itemIndex);
                      handleContentChange('items', newItems);
                    }}
                    className="text-red-500 hover:text-red-700 p-1"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
              <button
                onClick={() => {
                  const newItems = [...(block.items || []), ''];
                  handleContentChange('items', newItems);
                }}
                className="w-full p-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors"
              >
                + Add Item
              </button>
            </div>
          </div>
        );

      case BLOCK_TYPES.DIVIDER:
        return (
          <div>
            <div className="flex gap-3 mb-4">
              <select
                value={block.dividerStyle || 'line'}
                onChange={(e) => handleContentChange('dividerStyle', e.target.value)}
                className="px-3 py-2 border rounded-lg text-sm bg-white"
              >
                <option value="line">Line</option>
                <option value="dashed">Dashed</option>
                <option value="dotted">Dotted</option>
                <option value="double">Double</option>
                <option value="dots">Dots</option>
                <option value="stars">Stars</option>
              </select>
              <select
                value={block.dividerSize || '1'}
                onChange={(e) => handleContentChange('dividerSize', e.target.value)}
                className="px-3 py-2 border rounded-lg text-sm bg-white"
              >
                <option value="1">Small</option>
                <option value="2">Medium</option>
                <option value="3">Large</option>
              </select>
            </div>
            {block.dividerStyle === 'dots' ? (
              <div className="flex justify-center gap-2">
                <span style={{ transform: `scale(${block.dividerSize || 1})` }} className="w-2 h-2 bg-gray-400 rounded-full"></span>
                <span style={{ transform: `scale(${block.dividerSize || 1})` }} className="w-2 h-2 bg-gray-400 rounded-full"></span>
                <span style={{ transform: `scale(${block.dividerSize || 1})` }} className="w-2 h-2 bg-gray-400 rounded-full"></span>
              </div>
            ) : block.dividerStyle === 'stars' ? (
              <div className="text-center text-gray-400" style={{ fontSize: `${(block.dividerSize || 1) * 20}px` }}>★ ★ ★</div>
            ) : (
              <hr style={{ borderStyle: block.dividerStyle, borderWidth: `${block.dividerSize || 1}px` }} className="border-gray-300" />
            )}
          </div>
        );

      case BLOCK_TYPES.EMBED:
        return (
          <div>
            <input
              type="url"
              value={block.url || ''}
              onChange={(e) => handleContentChange('url', e.target.value)}
              placeholder="Enter embed URL (YouTube, Vimeo, etc.)"
              className="w-full p-4 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none mb-4"
            />
            {block.url && (
              <div className="relative">
                <iframe
                  src={getEmbedUrl(block.url)}
                  className="w-full h-64 rounded-xl"
                  allowFullScreen
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  title="Embedded content"
                />
              </div>
            )}
          </div>
        );

      case BLOCK_TYPES.GALLERY:
        const handleGalleryUpload = async (e) => {
          const files = Array.from(e.target.files).filter(file => file.type.startsWith('image/'));
          const urls = await Promise.all(files.map(uploadImage));
          handleContentChange('urls', [...(block.urls || []), ...urls.filter(u => u)]);
        };
        return (
          <div>
            <div className="flex gap-3 mb-4">
              <select
                value={block.layout || 'grid'}
                onChange={(e) => handleContentChange('layout', e.target.value)}
                className="px-3 py-2 border rounded-lg text-sm bg-white"
              >
                <option value="grid">Grid</option>
                <option value="carousel">Carousel</option>
              </select>
            </div>
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center hover:border-blue-400 transition-colors mb-4">
              <Image className="mx-auto mb-4 text-gray-400" size={64} />
              <p className="text-gray-600 mb-4">Upload images for gallery</p>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleGalleryUpload}
                className="hidden"
                id={`gallery-upload-${index}`}
              />
              <label
                htmlFor={`gallery-upload-${index}`}
                className="cursor-pointer bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-xl font-medium transition-all inline-block"
              >
                {uploading ? 'Uploading...' : 'Upload Images'}
              </label>
            </div>
            {block.urls && block.urls.length > 0 && (
              <div className={block.layout === 'grid' ? 'grid grid-cols-3 gap-4' : 'flex overflow-x-auto gap-4'}>
                {block.urls.map((url, i) => (
                  <div key={i} className="relative">
                    <img src={url} alt={`Gallery ${i}`} className="w-full h-32 object-cover rounded-lg" />
                    <button
                      onClick={() => handleContentChange('urls', block.urls.filter((_, j) => j !== i))}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case BLOCK_TYPES.BUTTON:
        return (
          <div>
            <input
              type="text"
              value={block.text || ''}
              onChange={(e) => handleContentChange('text', e.target.value)}
              placeholder="Button text"
              className="w-full p-4 border rounded-xl mb-4"
            />
            <input
              type="url"
              value={block.url || ''}
              onChange={(e) => handleContentChange('url', e.target.value)}
              placeholder="Button link"
              className="w-full p-4 border rounded-xl mb-4"
            />
            <div className="flex gap-3 mb-4">
              <select
                value={block.buttonStyle || 'primary'}
                onChange={(e) => handleContentChange('buttonStyle', e.target.value)}
                className="flex-1 p-2 border rounded-lg text-sm"
              >
                <option value="primary">Primary</option>
                <option value="secondary">Secondary</option>
                <option value="outline">Outline</option>
              </select>
              <select
                value={block.alignment || 'center'}
                onChange={(e) => handleContentChange('alignment', e.target.value)}
                className="flex-1 p-2 border rounded-lg text-sm"
              >
                <option value="left">Left</option>
                <option value="center">Center</option>
                <option value="right">Right</option>
              </select>
            </div>
            <div className="flex gap-3 mb-4">
              <div>
                <label className="block text-sm font-medium mb-1">Button Color</label>
                <input
                  type="color"
                  value={block.buttonColor || '#3B82F6'}
                  onChange={(e) => handleContentChange('buttonColor', e.target.value)}
                  className="w-full h-10 rounded-lg border cursor-pointer"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Text Color</label>
                <input
                  type="color"
                  value={block.textColor || '#FFFFFF'}
                  onChange={(e) => handleContentChange('textColor', e.target.value)}
                  className="w-full h-10 rounded-lg border cursor-pointer"
                />
              </div>
            </div>
            <div className={`text-${block.alignment || 'center'}`}>
              <button 
                style={{ 
                  backgroundColor: block.buttonStyle === 'outline' ? 'transparent' : (block.buttonColor || '#3B82F6'), 
                  color: block.buttonStyle === 'outline' ? (block.buttonColor || '#3B82F6') : (block.textColor || '#FFFFFF'),
                  borderColor: block.buttonColor || '#3B82F6'
                }}
                className={`px-6 py-3 rounded-xl font-medium transition-all ${
                  block.buttonStyle === 'outline' ? 'border-2' : ''
                } hover:opacity-80`}
              >
                {block.text || 'Button'}
              </button>
            </div>
          </div>
        );

      case BLOCK_TYPES.COLUMNS:
        return (
          <div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-2">Left Column Content Type</label>
                <select
                  value={block.leftType || 'text'}
                  onChange={(e) => handleContentChange('leftType', e.target.value)}
                  className="w-full p-2 border rounded-lg text-sm"
                >
                  <option value="text">Text</option>
                  <option value="image">Image</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Right Column Content Type</label>
                <select
                  value={block.rightType || 'text'}
                  onChange={(e) => handleContentChange('rightType', e.target.value)}
                  className="w-full p-2 border rounded-lg text-sm"
                >
                  <option value="text">Text</option>
                  <option value="image">Image</option>
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-2">Left Alignment</label>
                <select
                  value={block.leftAlign || 'left'}
                  onChange={(e) => handleContentChange('leftAlign', e.target.value)}
                  className="w-full p-2 border rounded-lg text-sm"
                >
                  <option value="left">Left</option>
                  <option value="center">Center</option>
                  <option value="right">Right</option>
                  <option value="justify">Justify</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Right Alignment</label>
                <select
                  value={block.rightAlign || 'left'}
                  onChange={(e) => handleContentChange('rightAlign', e.target.value)}
                  className="w-full p-2 border rounded-lg text-sm"
                >
                  <option value="left">Left</option>
                  <option value="center">Center</option>
                  <option value="right">Right</option>
                  <option value="justify">Justify</option>
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Left Column Content</label>
                {block.leftType === 'image' ? (
                  <div>
                    {!block.leftImage ? (
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                        <Image className="mx-auto mb-2 text-gray-400" size={32} />
                        <input
                          type="file"
                          accept="image/*"
                          onChange={async (e) => {
                            const file = e.target.files[0];
                            if (file) {
                              const url = await uploadImage(file);
                              if (url) handleContentChange('leftImage', url);
                            }
                          }}
                          className="hidden"
                          id={`left-image-upload-${index}`}
                        />
                        <label
                          htmlFor={`left-image-upload-${index}`}
                          className="cursor-pointer bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm"
                        >
                          Upload Image
                        </label>
                      </div>
                    ) : (
                      <div className="relative">
                        <img src={block.leftImage} alt="Left column" className="w-full rounded-lg" />
                        <button
                          onClick={() => handleContentChange('leftImage', '')}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <textarea
                    value={block.leftContent || ''}
                    onChange={(e) => handleContentChange('leftContent', e.target.value)}
                    placeholder="Left column content"
                    className="w-full p-4 border rounded-xl h-32 resize-none"
                    style={{ textAlign: block.leftAlign || 'left' }}
                  />
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Right Column Content</label>
                {block.rightType === 'image' ? (
                  <div>
                    {!block.rightImage ? (
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                        <Image className="mx-auto mb-2 text-gray-400" size={32} />
                        <input
                          type="file"
                          accept="image/*"
                          onChange={async (e) => {
                            const file = e.target.files[0];
                            if (file) {
                              const url = await uploadImage(file);
                              if (url) handleContentChange('rightImage', url);
                            }
                          }}
                          className="hidden"
                          id={`right-image-upload-${index}`}
                        />
                        <label
                          htmlFor={`right-image-upload-${index}`}
                          className="cursor-pointer bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm"
                        >
                          Upload Image
                        </label>
                      </div>
                    ) : (
                      <div className="relative">
                        <img src={block.rightImage} alt="Right column" className="w-full rounded-lg" />
                        <button
                          onClick={() => handleContentChange('rightImage', '')}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <textarea
                    value={block.rightContent || ''}
                    onChange={(e) => handleContentChange('rightContent', e.target.value)}
                    placeholder="Right column content"
                    className="w-full p-4 border rounded-xl h-32 resize-none"
                    style={{ textAlign: block.rightAlign || 'left' }}
                  />
                )}
              </div>
            </div>
          </div>
        );

      case BLOCK_TYPES.SPACER:
        return (
          <div>
            <label className="block text-sm font-medium mb-2">Height (px)</label>
            <input
              type="range"
              min="0"
              max="200"
              value={block.height || 20}
              onChange={(e) => handleContentChange('height', parseInt(e.target.value))}
              className="w-full"
            />
            <span className="text-sm text-gray-500">{block.height || 20}px</span>
            <div style={{ height: `${block.height || 20}px` }} className="bg-gray-100 rounded-xl mt-2" />
          </div>
        );

      case BLOCK_TYPES.CARD:
        const handleCardMediaUpload = async (e) => {
          const files = Array.from(e.target.files);
          const urls = await Promise.all(files.map(file => file.type.startsWith('image/') ? uploadImage(file) : uploadVideo(file)));
          handleContentChange('media', [...(block.media || []), ...urls.filter(u => u)]);
        };
        return (
          <div>
            <input
              type="text"
              value={block.title || ''}
              onChange={(e) => handleContentChange('title', e.target.value)}
              placeholder="Card title"
              className="w-full p-4 border rounded-xl mb-4"
            />
            <textarea
              value={block.content || ''}
              onChange={(e) => handleContentChange('content', e.target.value)}
              placeholder="Card content"
              className="w-full p-4 border rounded-xl mb-4 h-32"
            />
            <div className="flex gap-3 mb-4">
              <select
                value={block.layout || 'grid'}
                onChange={(e) => handleContentChange('layout', e.target.value)}
                className="px-3 py-2 border rounded-lg text-sm bg-white"
              >
                <option value="grid">Grid</option>
                <option value="carousel">Carousel</option>
              </select>
              <select
                value={block.size || 'medium'}
                onChange={(e) => handleContentChange('size', e.target.value)}
                className="px-3 py-2 border rounded-lg text-sm bg-white"
              >
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
              </select>
              <select
                value={block.alignment || 'center'}
                onChange={(e) => handleContentChange('alignment', e.target.value)}
                className="px-3 py-2 border rounded-lg text-sm bg-white"
              >
                <option value="left">Left</option>
                <option value="center">Center</option>
                <option value="right">Right</option>
              </select>
            </div>
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center mb-4">
              <Image className="mx-auto mb-2 text-gray-400" size={32} />
              <input
                type="file"
                accept="image/*,video/*"
                multiple
                onChange={handleCardMediaUpload}
                className="hidden"
                id={`card-upload-${index}`}
              />
              <label
                htmlFor={`card-upload-${index}`}
                className="cursor-pointer bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
              >
                {uploading ? 'Uploading...' : 'Upload Media'}
              </label>
            </div>
            {block.media && block.media.length > 0 && (
              <div className={block.layout === 'grid' ? 'grid grid-cols-3 gap-4' : 'flex overflow-x-auto gap-4'}>
                {block.media.map((url, i) => (
                  <div key={i} className="relative">
                    {url.endsWith('.mp4') || url.endsWith('.webm') ? (
                      <video src={url} controls className={`w-full rounded-xl ${block.size === 'small' ? 'h-24' : block.size === 'large' ? 'h-48' : 'h-32'}`} />
                    ) : (
                      <img src={url} alt={`Card media ${i}`} className={`w-full rounded-xl ${block.size === 'small' ? 'h-24' : block.size === 'large' ? 'h-48' : 'h-32'} object-cover`} />
                    )}
                    <button
                      onClick={() => handleContentChange('media', block.media.filter((_, j) => j !== i))}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case BLOCK_TYPES.CTA:
        return (
          <div>
            <input
              type="text"
              value={block.title || ''}
              onChange={(e) => handleContentChange('title', e.target.value)}
              placeholder="CTA Title"
              className="w-full p-4 border rounded-xl mb-4"
            />
            <textarea
              value={block.description || ''}
              onChange={(e) => handleContentChange('description', e.target.value)}
              placeholder="CTA Description"
              className="w-full p-4 border rounded-xl mb-4 h-24"
            />
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <input
                type="text"
                value={block.primaryButtonText || ''}
                onChange={(e) => handleContentChange('primaryButtonText', e.target.value)}
                placeholder="Primary button text"
                className="p-3 border rounded-lg"
              />
              <input
                type="url"
                value={block.primaryButtonUrl || ''}
                onChange={(e) => handleContentChange('primaryButtonUrl', e.target.value)}
                placeholder="Primary button URL"
                className="p-3 border rounded-lg"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <input
                type="text"
                value={block.secondaryButtonText || ''}
                onChange={(e) => handleContentChange('secondaryButtonText', e.target.value)}
                placeholder="Secondary button text (optional)"
                className="p-3 border rounded-lg"
              />
              <input
                type="url"
                value={block.secondaryButtonUrl || ''}
                onChange={(e) => handleContentChange('secondaryButtonUrl', e.target.value)}
                placeholder="Secondary button URL"
                className="p-3 border rounded-lg"
              />
            </div>
            
            <div className="flex gap-3 mb-4">
              <select
                value={block.ctaStyle || 'modern'}
                onChange={(e) => handleContentChange('ctaStyle', e.target.value)}
                className="flex-1 p-2 border rounded-lg text-sm"
              >
                <option value="modern">Modern</option>
                <option value="classic">Classic</option>
                <option value="minimal">Minimal</option>
                <option value="gradient">Gradient</option>
              </select>
              <select
                value={block.alignment || 'center'}
                onChange={(e) => handleContentChange('alignment', e.target.value)}
                className="flex-1 p-2 border rounded-lg text-sm"
              >
                <option value="left">Left</option>
                <option value="center">Center</option>
                <option value="right">Right</option>
              </select>
            </div>
            
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div>
                <label className="block text-sm font-medium mb-1">Background Color</label>
                <input
                  type="color"
                  value={block.backgroundColor || '#F3F4F6'}
                  onChange={(e) => handleContentChange('backgroundColor', e.target.value)}
                  className="w-full h-10 rounded-lg border cursor-pointer"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Primary Button Color</label>
                <input
                  type="color"
                  value={block.primaryColor || '#3B82F6'}
                  onChange={(e) => handleContentChange('primaryColor', e.target.value)}
                  className="w-full h-10 rounded-lg border cursor-pointer"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Text Color</label>
                <input
                  type="color"
                  value={block.textColor || '#1F2937'}
                  onChange={(e) => handleContentChange('textColor', e.target.value)}
                  className="w-full h-10 rounded-lg border cursor-pointer"
                />
              </div>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-medium">Contact Information (Optional)</h4>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="email"
                  value={block.email || ''}
                  onChange={(e) => handleContentChange('email', e.target.value)}
                  placeholder="Email"
                  className="p-2 border rounded-lg text-sm"
                />
                <input
                  type="tel"
                  value={block.phone || ''}
                  onChange={(e) => handleContentChange('phone', e.target.value)}
                  placeholder="Phone"
                  className="p-2 border rounded-lg text-sm"
                />
              </div>
              <input
                type="text"
                value={block.address || ''}
                onChange={(e) => handleContentChange('address', e.target.value)}
                placeholder="Address"
                className="w-full p-2 border rounded-lg text-sm"
              />
            </div>
            
            {/* CTA */}
            <div className="mt-6 p-6 border-2 border-dashed border-gray-300 rounded-xl">
              <div className="text-center">
                <h3 className="text-sm font-medium text-gray-600 mb-2">Preview</h3>
                <div 
                  className={`p-6 rounded-xl ${
                    block.ctaStyle === 'gradient' ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white' :
                    block.ctaStyle === 'minimal' ? 'bg-transparent border-2' : 'shadow-lg'
                  }`}
                  style={{ 
                    backgroundColor: block.ctaStyle !== 'gradient' ? (block.backgroundColor || '#F3F4F6') : undefined,
                    textAlign: block.alignment || 'center',
                    color: block.ctaStyle === 'gradient' ? 'white' : (block.textColor || '#1F2937'),
                    borderColor: block.ctaStyle === 'minimal' ? (block.primaryColor || '#3B82F6') : 'transparent'
                  }}
                >
                  {block.title && <h3 className="text-2xl font-bold mb-3">{block.title}</h3>}
                  {block.description && <p className="mb-4 opacity-90">{block.description}</p>}
                  
                  <div className="flex gap-3 justify-center items-center flex-wrap">
                    {block.primaryButtonText && (
                      <button 
                        style={{ backgroundColor: block.primaryColor || '#3B82F6' }}
                        className="px-6 py-3 text-white rounded-xl font-medium hover:opacity-90 transition-all"
                      >
                        {block.primaryButtonText}
                      </button>
                    )}
                    {block.secondaryButtonText && (
                      <button className="px-6 py-3 border-2 rounded-xl font-medium hover:bg-gray-50 transition-all"
                              style={{ borderColor: block.primaryColor || '#3B82F6', color: block.primaryColor || '#3B82F6' }}>
                        {block.secondaryButtonText}
                      </button>
                    )}
                  </div>
                  
                  {(block.email || block.phone || block.address) && (
                    <div className="mt-4 pt-4 border-t border-gray-300 flex flex-wrap gap-4 justify-center text-sm opacity-75">
                      {block.email && (
                        <div className="flex items-center gap-1">
                          <Mail size={14} />
                          {block.email}
                        </div>
                      )}
                      {block.phone && (
                        <div className="flex items-center gap-1">
                          <Phone size={14} />
                          {block.phone}
                        </div>
                      )}
                      {block.address && (
                        <div className="flex items-center gap-1">
                          <MapPin size={14} />
                          {block.address}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return <div className="p-4 text-gray-500 italic">Block type not implemented yet</div>;
    }
  };

  return (
    <div className={getBlockClasses()} style={getBlockStyle()}>
      {/* Block Controls */}
      <div className="absolute -left-16 top-0 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
        <button
          onClick={() => moveBlock(index, index - 1)}
          disabled={index === 0}
          className="p-2 bg-white hover:bg-gray-100 rounded-lg shadow-md border disabled:opacity-50 transition-all"
          title="Move Up"
        >
          <ArrowUp size={16} />
        </button>
        <button
          onClick={() => moveBlock(index, index + 1)}
          className="p-2 bg-white hover:bg-gray-100 rounded-lg shadow-md border transition-all"
          title="Move Down"
        >
          <ArrowDown size={16} />
        </button>
        <button
          onClick={() => duplicateBlock(index)}
          className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg shadow-md border transition-all"
          title="Duplicate"
        >
          <Copy size={16} />
        </button>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="p-2 bg-purple-50 hover:bg-purple-100 text-purple-600 rounded-lg shadow-md border transition-all"
          title="Settings"
        >
          <Settings size={16} />
        </button>
        <button
          onClick={() => deleteBlock(index)}
          className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg shadow-md border transition-all"
          title="Delete"
        >
          <Trash2 size={16} />
        </button>
      </div>

      {/* Block Settings Panel */}
      {showSettings && (
        <AdvancedBlockSettings
          block={block}
          onUpdate={(updatedBlock) => updateBlock(index, updatedBlock)}
          onClose={() => setShowSettings(false)}
        />
      )}

      {/* Block Content */}
      <div className="group">
        {renderBlockContent()}
      </div>
    </div>
  );
};

const EnhancedBlockTypeSelector = ({ onAddBlock, onClose }) => {
  const blockTypes = [
    { type: BLOCK_TYPES.HEADING, icon: Type, label: 'Heading', desc: 'Add section titles' },
    { type: BLOCK_TYPES.TEXT, icon: Type, label: 'Rich Text', desc: 'Rich text paragraph' },
    { type: BLOCK_TYPES.IMAGE, icon: Image, label: 'Image', desc: 'Upload or link images' },
    { type: BLOCK_TYPES.VIDEO, icon: Video, label: 'Video', desc: 'Embed videos' },
    { type: BLOCK_TYPES.QUOTE, icon: Quote, label: 'Quote', desc: 'Highlight important quotes' },
    { type: BLOCK_TYPES.LIST, icon: List, label: 'List', desc: 'Bullet, numbered, or checklist' },
    { type: BLOCK_TYPES.DIVIDER, icon: Type, label: 'Divider', desc: 'Section separator' },
    { type: BLOCK_TYPES.EMBED, icon: Link2, label: 'Embed', desc: 'External content' },
    { type: BLOCK_TYPES.GALLERY, icon: Grid, label: 'Gallery', desc: 'Image gallery grid' },
    { type: BLOCK_TYPES.BUTTON, icon: Square, label: 'Button', desc: 'Call-to-action button' },
    { type: BLOCK_TYPES.COLUMNS, icon: Columns, label: 'Columns', desc: 'Multi-column layout' },
    { type: BLOCK_TYPES.SPACER, icon: Layout, label: 'Spacer', desc: 'Add space between blocks' },
    { type: BLOCK_TYPES.CARD, icon: Square, label: 'Card', desc: 'Card with image and text' },
    { type: BLOCK_TYPES.CTA, icon: ExternalLink, label: 'CTA Section', desc: 'Call-to-action section' }
  ];

  return (
    <div 
      className="absolute z-[9999] bg-white rounded-2xl shadow-lg border-2 border-gray-200 p-6 min-w-96 max-w-lg"
      style={{ 
        fontFamily: "'Comic Sans MS', 'Comic Neue'", 
        zIndex: 9999, 
        right: 0,
        left: 'auto',
        top: '100%',
        marginTop: '12px',
        minWidth: '24rem',
        maxWidth: '32rem',
      }}
    >
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-xl font-semibold text-[#074a5b]">
          Add Content Block
        </h3>
        <button 
          onClick={onClose} 
          className="text-gray-400 hover:text-gray-600 p-2 rounded-xl hover:bg-gray-100 transition-all duration-300"
        >
          <X size={24} />
        </button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {blockTypes.map((blockType) => (
          <button
            key={blockType.type}
            onClick={() => {
              onAddBlock(blockType.type);
              onClose();
            }}
            className="flex items-start gap-3 p-3 text-left hover:bg-gray-50 rounded-lg transition-colors"
          >
            <blockType.icon className="mt-1 text-blue-500" size={20} />
            <div>
              <div className="font-medium text-sm">{blockType.label}</div>
              <div className="text-xs text-gray-500">{blockType.desc}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

const EnhancedBlogPreview = ({ blog, contentBlocks, theme, isOpen, onClose }) => {
  const [previewDevice, setPreviewDevice] = useState('desktop');
  
  if (!isOpen) return null;

  const getDeviceClasses = () => {
    switch (previewDevice) {
      case 'mobile':
        return 'max-w-sm mx-auto';
      case 'tablet':
        return 'max-w-2xl mx-auto';
      default:
        return 'max-w-4xl mx-auto';
    }
  };

  const renderPreviewBlock = (block, index) => {
    const getBlockClasses = () => {
      const spacingMap = {
        none: 'mb-0',
        xs: 'mb-1',
        sm: 'mb-2',
        normal: 'mb-3',
        lg: 'mb-4',
        xl: 'mb-6'
      };
      
      let classes = `${spacingMap[block.spacing] || spacingMap.normal}`;
      
      if (block.animation && block.animation !== 'none') {
        classes += ` animate-${block.animation}`;
      }
      
      return classes;
    };

    const getBlockStyle = () => {
      const style = {};
      
      if (block.backgroundColor && block.backgroundStyle === 'solid') {
        style.backgroundColor = block.backgroundColor;
      }
      
      if (block.borderRadius) {
        style.borderRadius = `${block.borderRadius}px`;
      }
      
      if (block.padding) {
        style.padding = `${block.padding}px`;
      }
      
      return style;
    };

    const getListStyle = () => {
      if (block.listType === 'unordered') {
        switch (block.listStyle) {
          case 'circle':
            return 'circle';
          case 'square':
            return 'square';
          default:
            return 'disc';
        }
      } else if (block.listType === 'ordered') {
        switch (block.listStyle) {
          case 'alpha':
            return 'lower-alpha';
          case 'roman':
            return 'lower-roman';
          default:
            return 'decimal';
        }
      }
      return 'disc';
    };

    // Fixed embed URL conversion function
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

    switch (block.type) {
      case BLOCK_TYPES.HEADING:
        const HeadingTag = block.level || 'h2';
        return React.createElement(HeadingTag, {
          key: index,
          className: `font-bold mb-2 ${
            HeadingTag === 'h1' ? 'text-4xl' : 
            HeadingTag === 'h2' ? 'text-3xl' : 
            HeadingTag === 'h3' ? 'text-2xl' : 
            HeadingTag === 'h4' ? 'text-xl' : 
            HeadingTag === 'h5' ? 'text-lg' : 'text-base'
          } ${getBlockClasses()}`,
          style: { 
            color: block.textColor || theme.primaryColor,
            textAlign: block.alignment || 'left',
            ...getBlockStyle()
          }
        }, block.content);

      case BLOCK_TYPES.TEXT:
        return (
          <div 
            key={index} 
            className={`prose max-w-none leading-relaxed ${getBlockClasses()}`}
            style={getBlockStyle()}
            dangerouslySetInnerHTML={{ __html: block.content }} 
          />
        );

      case BLOCK_TYPES.IMAGE:
        return (
          <div key={index} className={`text-${block.alignment || 'center'} ${getBlockClasses()}`} style={getBlockStyle()}>
            <img
              src={block.url}
              alt={block.caption || 'Blog image'}
              className={`rounded-xl ${
                block.size === 'small' ? 'max-w-xs' :
                block.size === 'large' ? 'max-w-4xl' :
                block.size === 'full' ? 'w-full' : 'max-w-2xl'
              }`}
              style={{ 
                margin: block.alignment === 'left' ? '0' : 
                       block.alignment === 'right' ? '0 0 0 auto' : '0 auto'
              }}
            />
            {block.caption && (
              <p className="text-sm text-gray-600 italic mt-2">{block.caption}</p>
            )}
          </div>
        );

      case BLOCK_TYPES.VIDEO:
        return (
          <div key={index} className={`text-${block.alignment || 'center'} ${getBlockClasses()}`} style={getBlockStyle()}>
            <video
              src={block.url}
              controls
              className={`rounded-xl ${
                block.size === 'small' ? 'max-w-xs' :
                block.size === 'large' ? 'max-w-4xl' :
                block.size === 'full' ? 'w-full' : 'max-w-2xl'
              }`}
              style={{ 
                margin: block.alignment === 'left' ? '0' : 
                       block.alignment === 'right' ? '0 0 0 auto' : '0 auto'
              }}
            />
            {block.caption && (
              <p className="text-sm text-gray-600 italic mt-2">{block.caption}</p>
            )}
          </div>
        );

      case BLOCK_TYPES.LIST:
        if (!block.items || block.items.length === 0) return null;
        
        if (block.listType === 'checklist') {
          return (
            <div key={index} className={`space-y-1 ${getBlockClasses()}`} style={getBlockStyle()}>
              {block.items.map((item, itemIndex) => (
                <div key={itemIndex} className="flex items-center gap-3">
                  <span className={`text-lg ${block.checkedItems?.[itemIndex] ? 'text-green-500' : 'text-gray-400'}`}>
                    {block.checkedItems?.[itemIndex] ? '✓' : '○'}
                  </span>
                  <span className={block.checkedItems?.[itemIndex] ? 'line-through text-gray-500' : ''}>{item}</span>
                </div>
              ))}
            </div>
          );
        }
        
        const ListTag = block.listType === 'ordered' ? 'ol' : 'ul';
        return (
          <ListTag key={index} className={`space-y-1 ml-6 ${getBlockClasses()}`} style={{ ...getBlockStyle(), listStyleType: getListStyle() }}>
            {block.items.map((item, itemIndex) => (
              <li key={itemIndex} className="leading-relaxed">
                {item}
              </li>
            ))}
          </ListTag>
        );

      case BLOCK_TYPES.QUOTE:
        return (
          <div key={index} className={`relative pl-8 py-4 ${getBlockClasses()}`} style={getBlockStyle()}>
            <div 
              className="absolute left-0 top-0 bottom-0 w-1 rounded-full"
              style={{ backgroundColor: block.accentColor || theme.accentColor }}
            />
            <blockquote className="text-xl italic leading-relaxed mb-2" style={{ color: block.textColor || theme.textColor }}>
              "{block.content}"
            </blockquote>
            {block.author && (
              <cite className="text-sm text-gray-600 not-italic font-medium">— {block.author}</cite>
            )}
          </div>
        );

      case BLOCK_TYPES.DIVIDER:
        if (block.dividerStyle === 'dots') {
          return (
            <div key={index} className={`flex justify-center gap-2 ${getBlockClasses()}`} style={getBlockStyle()}>
              <span style={{ transform: `scale(${block.dividerSize || 1})` }} className="w-2 h-2 bg-gray-400 rounded-full"></span>
              <span style={{ transform: `scale(${block.dividerSize || 1})` }} className="w-2 h-2 bg-gray-400 rounded-full"></span>
              <span style={{ transform: `scale(${block.dividerSize || 1})` }} className="w-2 h-2 bg-gray-400 rounded-full"></span>
            </div>
          );
        } else if (block.dividerStyle === 'stars') {
          return (
            <div key={index} className={`text-center text-gray-400 ${getBlockClasses()}`} style={{ fontSize: `${(block.dividerSize || 1) * 20}px`, ...getBlockStyle() }}>★ ★ ★</div>
          );
        } else {
          return (
            <hr key={index} style={{ borderStyle: block.dividerStyle, borderWidth: `${block.dividerSize || 1}px`, ...getBlockStyle() }} className={`border-gray-300 ${getBlockClasses()}`} />
          );
        }

      case BLOCK_TYPES.EMBED:
        return (
          <div key={index} className={getBlockClasses()} style={getBlockStyle()}>
            <iframe
              src={getEmbedUrl(block.url)}
              className="w-full h-64 rounded-xl"
              allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              title="Embedded content"
            />
          </div>
        );

      case BLOCK_TYPES.GALLERY:
        if (!block.urls || block.urls.length === 0) return null;
        return (
          <div key={index} className={getBlockClasses()} style={getBlockStyle()}>
            {block.layout === 'grid' ? (
              <div className="grid grid-cols-3 gap-4">
                {block.urls.map((url, i) => (
                  <img key={i} src={url} alt={`Gallery ${i}`} className="w-full h-auto rounded-xl" />
                ))}
              </div>
            ) : (
              <div className="flex overflow-x-auto gap-4">
                {block.urls.map((url, i) => (
                  <img key={i} src={url} alt={`Gallery ${i}`} className="h-64 object-cover rounded-xl flex-shrink-0" />
                ))}
              </div>
            )}
          </div>
        );

      case BLOCK_TYPES.BUTTON:
        const alignmentClass = block.alignment === 'left' ? 'text-left' : 
                             block.alignment === 'right' ? 'text-right' : 'text-center';
        return (
          <div key={index} className={`${alignmentClass} ${getBlockClasses()}`} style={getBlockStyle()}>
            <a 
              href={block.url || '#'} 
              style={{ 
                backgroundColor: block.buttonStyle === 'outline' ? 'transparent' : (block.buttonColor || '#3B82F6'), 
                color: block.buttonStyle === 'outline' ? (block.buttonColor || '#3B82F6') : (block.textColor || '#FFFFFF'),
                borderColor: block.buttonColor || '#3B82F6'
              }}
              className={`inline-block px-6 py-3 rounded-xl font-medium transition-all ${
                block.buttonStyle === 'outline' ? 'border-2' : ''
              } hover:opacity-80 no-underline`}
              target="_blank" rel="noopener noreferrer"
            >
              {block.text || 'Button'}
            </a>
          </div>
        );

      case BLOCK_TYPES.COLUMNS:
        return (
          <div key={index} className={`grid grid-cols-2 gap-4 ${getBlockClasses()}`} style={getBlockStyle()}>
            <div style={{ textAlign: block.leftAlign || 'left' }}>
              {block.leftType === 'image' && block.leftImage ? (
                <img src={block.leftImage} alt="Left column" className="w-full rounded-lg mb-2" />
              ) : (
                block.leftContent
              )}
            </div>
            <div style={{ textAlign: block.rightAlign || 'left' }}>
              {block.rightType === 'image' && block.rightImage ? (
                <img src={block.rightImage} alt="Right column" className="w-full rounded-lg mb-2" />
              ) : (
                block.rightContent
              )}
            </div>
          </div>
        );

      case BLOCK_TYPES.SPACER:
        return <div key={index} style={{ height: `${block.height || 20}px`, ...getBlockStyle() }} className={getBlockClasses()} />;

      case BLOCK_TYPES.CARD:
        if (!block.title && !block.content && (!block.media || block.media.length === 0)) return null;
        return (
          <div key={index} className={`border rounded-xl p-4 ${getBlockClasses()}`} style={getBlockStyle()}>
            {block.media && block.media.length > 0 && (
              <div className={`mb-3 ${block.layout === 'grid' ? 'grid grid-cols-3 gap-4' : 'flex overflow-x-auto gap-4'}`}>
                {block.media.map((url, i) => (
                  <div key={i}>
                    {url.endsWith('.mp4') || url.endsWith('.webm') ? (
                      <video src={url} controls className={`w-full rounded-xl ${block.size === 'small' ? 'h-24' : block.size === 'large' ? 'h-48' : 'h-32'}`} />
                    ) : (
                      <img src={url} alt={`Card media ${i}`} className={`w-full rounded-xl ${block.size === 'small' ? 'h-24' : block.size === 'large' ? 'h-48' : 'h-32'} object-cover`} />
                    )}
                  </div>
                ))}
              </div>
            )}
            {block.title && <h3 className="text-xl font-bold mb-2">{block.title}</h3>}
            {block.content && <p>{block.content}</p>}
          </div>
        );

      case BLOCK_TYPES.CTA:
        return (
          <div key={index} className={getBlockClasses()} style={getBlockStyle()}>
            <div 
              className={`p-6 rounded-xl ${
                block.ctaStyle === 'gradient' ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white' :
                block.ctaStyle === 'minimal' ? 'bg-transparent border-2' : 'shadow-lg'
              }`}
              style={{ 
                backgroundColor: block.ctaStyle !== 'gradient' ? (block.backgroundColor || '#F3F4F6') : undefined,
                textAlign: block.alignment || 'center',
                color: block.ctaStyle === 'gradient' ? 'white' : (block.textColor || '#1F2937'),
                borderColor: block.ctaStyle === 'minimal' ? (block.primaryColor || '#3B82F6') : 'transparent'
              }}
            >
              {block.title && <h3 className="text-2xl font-bold mb-3">{block.title}</h3>}
              {block.description && <p className="mb-4 opacity-90">{block.description}</p>}
              
              <div className="flex gap-3 justify-center items-center flex-wrap mb-4">
                {block.primaryButtonText && (
                  <a 
                    href={block.primaryButtonUrl || '#'}
                    style={{ backgroundColor: block.primaryColor || '#3B82F6' }}
                    className="px-6 py-3 text-white rounded-xl font-medium hover:opacity-90 transition-all no-underline"
                    target="_blank" rel="noopener noreferrer"
                  >
                    {block.primaryButtonText}
                  </a>
                )}
                {block.secondaryButtonText && (
                  <a 
                    href={block.secondaryButtonUrl || '#'}
                    className="px-6 py-3 border-2 rounded-xl font-medium hover:bg-gray-50 transition-all no-underline"
                    style={{ borderColor: block.primaryColor || '#3B82F6', color: block.primaryColor || '#3B82F6' }}
                    target="_blank" rel="noopener noreferrer"
                  >
                    {block.secondaryButtonText}
                  </a>
                )}
              </div>
              
              {(block.email || block.phone || block.address) && (
                <div className="pt-4 border-t border-gray-300 flex flex-wrap gap-4 justify-center text-sm opacity-75">
                  {block.email && (
                    <div className="flex items-center gap-1">
                      <Mail size={14} />
                      {block.email}
                    </div>
                  )}
                  {block.phone && (
                    <div className="flex items-center gap-1">
                      <Phone size={14} />
                      {block.phone}
                    </div>
                  )}
                  {block.address && (
                    <div className="flex items-center gap-1">
                      <MapPin size={14} />
                      {block.address}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl max-h-screen overflow-hidden flex flex-col">
        <div className="flex justify-between items-center p-6 border-b bg-gray-50">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold text-gray-800">Blog Preview</h2>
            <div className="flex gap-2">
              <button
                onClick={() => setPreviewDevice('mobile')}
                className={`p-2 rounded-lg transition-all ${previewDevice === 'mobile' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
                title="Mobile View"
              >
                <Smartphone size={18} />
              </button>
              <button
                onClick={() => setPreviewDevice('tablet')}
                className={`p-2 rounded-lg transition-all ${previewDevice === 'tablet' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
                title="Tablet View"
              >
                <Tablet size={18} />
              </button>
              <button
                onClick={() => setPreviewDevice('desktop')}
                className={`p-2 rounded-lg transition-all ${previewDevice === 'desktop' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
                title="Desktop View"
              >
                <Monitor size={18} />
              </button>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg transition-all"
          >
            <X size={24} />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-8 bg-gray-50">
          <div className={getDeviceClasses()}>
            <article 
              className="bg-white rounded-2xl shadow-lg p-8"
              style={{ 
                fontFamily: theme.fontFamily,
                backgroundColor: theme.backgroundColor 
              }}
            >
              <header className="mb-8 text-center">
                <h1 
                  className="text-5xl font-bold mb-4 leading-tight"
                  style={{ color: theme.primaryColor }}
                >
                  {blog.title || 'Untitled Blog Post'}
                </h1>
                <div className="flex items-center justify-center gap-6 text-gray-600 text-lg">
                  <span>By {blog.author || 'Anonymous'}</span>
                  <span>•</span>
                  <span>{blog.publish_date ? new Date(blog.publish_date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  }) : 'Draft'}</span>
                </div>
                {blog.tags && blog.tags.length > 0 && (
                  <div className="flex justify-center gap-2 mt-4">
                    {blog.tags.split(',').map((tag, index) => (
                      <span 
                        key={index} 
                        className="px-3 py-1 rounded-full text-sm font-medium"
                        style={{ 
                          backgroundColor: theme.secondaryColor + '20',
                          color: theme.secondaryColor 
                        }}
                      >
                        {tag.trim()}
                      </span>
                    ))}
                  </div>
                )}
              </header>
              
              <div className="space-y-4">
                {contentBlocks.map((block, index) => renderPreviewBlock(block, index))}
              </div>
              
              {contentBlocks.length === 0 && (
                <div className="text-center py-16 text-gray-500">
                  <Type size={64} className="mx-auto mb-4 text-gray-300" />
                  <p className="text-xl mb-2">No content blocks added yet</p>
                  <p>Start building your blog by adding content blocks</p>
                </div>
              )}
            </article>
          </div>
        </div>
      </div>
    </div>
  );
};

// Theme Customizer Component
const ThemeCustomizer = ({ theme, onThemeChange, isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-screen overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-bold">Theme Customizer</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 space-y-6 max-h-96 overflow-y-auto">
          <div>
            <label className="block text-sm font-medium mb-2">Theme Preset</label>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(THEME_PRESETS).map(([key, preset]) => (
                <button
                  key={key}
                  onClick={() => onThemeChange(preset)}
                  className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                    theme.name === preset.name 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex gap-1 mb-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: preset.primaryColor }}></div>
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: preset.secondaryColor }}></div>
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: preset.accentColor }}></div>
                  </div>
                  {preset.name}
                </button>
              ))}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Primary Color</label>
            <input
              type="color"
              value={theme.primaryColor}
              onChange={(e) => onThemeChange({ ...theme, primaryColor: e.target.value })}
              className="w-full h-12 rounded-lg border cursor-pointer"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Secondary Color</label>
            <input
              type="color"
              value={theme.secondaryColor}
              onChange={(e) => onThemeChange({ ...theme, secondaryColor: e.target.value })}
              className="w-full h-12 rounded-lg border cursor-pointer"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Accent Color</label>
            <input
              type="color"
              value={theme.accentColor}
              onChange={(e) => onThemeChange({ ...theme, accentColor: e.target.value })}
              className="w-full h-12 rounded-lg border cursor-pointer"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Border Radius</label>
            <input
              type="range"
              min="0"
              max="24"
              value={parseInt(theme.borderRadius)}
              onChange={(e) => onThemeChange({ ...theme, borderRadius: `${e.target.value}px` })}
              className="w-full"
            />
            <span className="text-sm text-gray-500">{theme.borderRadius}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Confirmation Modal
const EnhancedConfirmationModal = ({ isOpen, onClose, onConfirm, title, message, type = 'delete' }) => {
  if (!isOpen) return null;

  const getTypeStyles = () => {
    switch (type) {
      case 'delete':
        return {
          icon: <Trash2 size={24} className="text-red-500" />,
          buttonClass: 'bg-red-500 hover:bg-red-600',
          buttonText: 'Delete'
        };
      case 'duplicate':
        return {
          icon: <Copy size={24} className="text-blue-500" />,
          buttonClass: 'bg-blue-500 hover:bg-blue-600',
          buttonText: 'Duplicate'
        };
      default:
        return {
          icon: <X size={24} className="text-gray-500" />,
          buttonClass: 'bg-gray-500 hover:bg-gray-600',
          buttonText: 'Confirm'
        };
    }
  };

  const typeStyles = getTypeStyles();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md mx-4">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
            {typeStyles.icon}
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-4">{title}</h3>
          <p className="text-gray-600 mb-8 leading-relaxed">{message}</p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={onClose}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-3 rounded-xl font-medium transition-all"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className={`${typeStyles.buttonClass} text-white px-6 py-3 rounded-xl font-medium transition-all`}
            >
              {typeStyles.buttonText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Blog Management Component
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
  
  const [contentBlocks, setContentBlocks] = useState([]);
  const [showBlockSelector, setShowBlockSelector] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showThemeCustomizer, setShowThemeCustomizer] = useState(false);
  const [theme, setTheme] = useState(THEME_PRESETS.default);
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [modal, setModal] = useState({ isOpen: false, id: null, name: '', type: 'delete' });
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

  // Auto-hide messages
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
        const response = await api.get(`${API_BASE_URL}/blogs?all=true&_cb=${cacheBuster}`);
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

  // Intersection observer for animations
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

  // Upload functions
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

  const uploadVideo = async (file) => {
    setUploading(true);
    setUploadProgress(prev => ({ ...prev, [file.name]: 0 }));
    
    try {
      const formDataVid = new FormData();
      formDataVid.append('video', file);

      const response = await api.post(`${API_BASE_URL}/blogs/upload/video`, formDataVid, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(prev => ({ ...prev, [file.name]: percent }));
        },
      });
      
      setUploadProgress(prev => {
        const newProgress = { ...prev };
        delete newProgress[file.name];
        return newProgress;
      });
      setUploading(false);
      return response.data.url;
    } catch (err) {
      console.error('Video upload failed:', err);
      setError(`Video upload failed for ${file.name}: ${err.response?.data?.msg || err.message}`);
      setUploadProgress(prev => {
        const newProgress = { ...prev };
        delete newProgress[file.name];
        return newProgress;
      });
      setUploading(false);
      return null;
    }
  };

  // Block Management 
  const addBlock = (type) => {
    const newBlock = {
      id: Date.now(),
      type,
      content: type === BLOCK_TYPES.LIST ? '' : (type === BLOCK_TYPES.HEADING ? 'New Heading' : ''),
      style: 'default',
      spacing: 'normal',
      animation: 'none',
      shadow: 'none',
      borderRadius: 8,
      padding: 16,
      width: 'full'
    };
    
    if (type === BLOCK_TYPES.IMAGE || type === BLOCK_TYPES.VIDEO) {
      newBlock.size = 'medium';
      newBlock.alignment = 'center';
    }
    
    if (type === BLOCK_TYPES.LIST) {
      newBlock.listType = 'unordered';
      newBlock.listStyle = 'disc';
      newBlock.items = ['First item'];
    }
    
    if (type === BLOCK_TYPES.HEADING) {
      newBlock.level = 'h2';
      newBlock.alignment = 'left';
    }

    if (type === BLOCK_TYPES.DIVIDER) {
      newBlock.dividerStyle = 'line';
      newBlock.dividerSize = '1';
    }

    if (type === BLOCK_TYPES.EMBED) {
      newBlock.url = '';
    }

    if (type === BLOCK_TYPES.GALLERY) {
      newBlock.urls = [];
      newBlock.layout = 'grid';
    }

    if (type === BLOCK_TYPES.BUTTON) {
      newBlock.text = 'Click me';
      newBlock.url = '';
      newBlock.buttonStyle = 'primary';
      newBlock.alignment = 'center';
      newBlock.buttonColor = '#3B82F6';
      newBlock.textColor = '#FFFFFF';
    }

    if (type === BLOCK_TYPES.COLUMNS) {
      newBlock.leftContent = '';
      newBlock.rightContent = '';
      newBlock.leftAlign = 'left';
      newBlock.rightAlign = 'left';
      newBlock.leftType = 'text';
      newBlock.rightType = 'text';
    }

    if (type === BLOCK_TYPES.SPACER) {
      newBlock.height = 20;
    }

    if (type === BLOCK_TYPES.CARD) {
      newBlock.title = '';
      newBlock.content = '';
      newBlock.media = [];
      newBlock.layout = 'grid';
      newBlock.size = 'medium';
      newBlock.alignment = 'center';
    }

    if (type === BLOCK_TYPES.CTA) {
      newBlock.title = '';
      newBlock.description = '';
      newBlock.primaryButtonText = '';
      newBlock.primaryButtonUrl = '';
      newBlock.secondaryButtonText = '';
      newBlock.secondaryButtonUrl = '';
      newBlock.ctaStyle = 'modern';
      newBlock.alignment = 'center';
      newBlock.backgroundColor = '#F3F4F6';
      newBlock.primaryColor = '#3B82F6';
      newBlock.textColor = '#1F2937';
    }
    
    setContentBlocks([...contentBlocks, newBlock]);
  };

  const updateBlock = (index, updatedBlock) => {
    const newBlocks = [...contentBlocks];
    newBlocks[index] = updatedBlock;
    setContentBlocks(newBlocks);
  };

  const deleteBlock = (index) => {
    setContentBlocks(contentBlocks.filter((_, i) => i !== index));
  };

  const moveBlock = (fromIndex, toIndex) => {
    if (toIndex < 0 || toIndex >= contentBlocks.length) return;
    
    const newBlocks = [...contentBlocks];
    const [movedBlock] = newBlocks.splice(fromIndex, 1);
    newBlocks.splice(toIndex, 0, movedBlock);
    setContentBlocks(newBlocks);
  };

  const duplicateBlock = (index) => {
    const blockToDuplicate = { ...contentBlocks[index], id: Date.now() };
    const newBlocks = [...contentBlocks];
    newBlocks.splice(index + 1, 0, blockToDuplicate);
    setContentBlocks(newBlocks);
  };

  // Form handlers
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
    
    const uploadPromises = files.map(uploadVideo);
    const urls = (await Promise.all(uploadPromises)).filter((url) => url);
    setFormData((prev) => ({ ...prev, videos: [...prev.videos, ...urls] }));
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

  // Blog submission
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
      
      const convertedContent = contentBlocks.map(block => {
        const baseData = {
          blockType: block.type,
          blockData: {
            ...block,
            spacing: block.spacing || 'normal',
            alignment: block.alignment || 'center',
            size: block.size || 'medium',
            buttonColor: block.buttonColor,
            textColor: block.textColor,
            accentColor: block.accentColor,
            backgroundColor: block.backgroundColor,
            borderRadius: block.borderRadius,
            padding: block.padding,
            shadow: block.shadow,
            opacity: block.opacity,
            hoverEffect: block.hoverEffect,
            leftAlign: block.leftAlign,
            rightAlign: block.rightAlign,
            width: block.width,
            height: block.height,
            level: block.level,
            listType: block.listType,
            listStyle: block.listStyle,
            checkedItems: block.checkedItems,
            dividerStyle: block.dividerStyle,
            dividerSize: block.dividerSize,
            items: block.items,
            urls: block.urls,
            layout: block.layout,
            media: block.media,
            author: block.author,
            caption: block.caption,
            buttonStyle: block.buttonStyle,
            backgroundStyle: block.backgroundStyle,
            borderStyle: block.borderStyle,
            leftType: block.leftType,
            rightType: block.rightType,
            leftImage: block.leftImage,
            rightImage: block.rightImage,
            title: block.title,
            description: block.description,
            primaryButtonText: block.primaryButtonText,
            primaryButtonUrl: block.primaryButtonUrl,
            secondaryButtonText: block.secondaryButtonText,
            secondaryButtonUrl: block.secondaryButtonUrl,
            ctaStyle: block.ctaStyle,
            primaryColor: block.primaryColor,
            email: block.email,
            phone: block.phone,
            address: block.address
          }
        };

        switch (block.type) {
          case BLOCK_TYPES.HEADING:
            return {
              ...baseData,
              heading: block.content,
              text: '',
              image: ''
            };
          case BLOCK_TYPES.TEXT:
            return {
              ...baseData,
              heading: '',
              text: block.content,
              image: ''
            };
          case BLOCK_TYPES.IMAGE:
            return {
              ...baseData,
              heading: block.caption || '',
              text: '',
              image: block.url
            };
          case BLOCK_TYPES.VIDEO:
            return {
              ...baseData,
              heading: block.caption || '',
              text: '',
              image: block.url
            };
          case BLOCK_TYPES.LIST:
            return {
              ...baseData,
              heading: '',
              text: JSON.stringify({ items: block.items, listType: block.listType, listStyle: block.listStyle, checkedItems: block.checkedItems }),
              image: ''
            };
          case BLOCK_TYPES.QUOTE:
            return {
              ...baseData,
              heading: 'Quote',
              text: block.content,
              image: ''
            };
          case BLOCK_TYPES.DIVIDER:
            return {
              ...baseData,
              heading: '',
              text: `divider-${block.dividerStyle}-${block.dividerSize}`,
              image: ''
            };
          case BLOCK_TYPES.EMBED:
            return {
              ...baseData,
              heading: '',
              text: '',
              image: block.url
            };
          case BLOCK_TYPES.GALLERY:
            return {
              ...baseData,
              heading: '',
              text: '',
              image: block.urls ? block.urls.join(',') : ''
            };
          case BLOCK_TYPES.BUTTON:
            return {
              ...baseData,
              heading: '',
              text: block.text,
              image: block.url
            };
          case BLOCK_TYPES.COLUMNS:
            return {
              ...baseData,
              heading: '',
              text: JSON.stringify({ 
                left: block.leftContent, 
                right: block.rightContent, 
                leftAlign: block.leftAlign, 
                rightAlign: block.rightAlign,
                leftType: block.leftType,
                rightType: block.rightType,
                leftImage: block.leftImage,
                rightImage: block.rightImage
              }),
              image: ''
            };
          case BLOCK_TYPES.SPACER:
            return {
              ...baseData,
              heading: '',
              text: `spacer-${block.height}`,
              image: ''
            };
          case BLOCK_TYPES.CARD:
            return {
              ...baseData,
              heading: block.title,
              text: block.content,
              image: block.media ? block.media.join(',') : ''
            };
          case BLOCK_TYPES.CTA:
            return {
              ...baseData,
              heading: block.title,
              text: JSON.stringify({
                description: block.description,
                primaryButtonText: block.primaryButtonText,
                primaryButtonUrl: block.primaryButtonUrl,
                secondaryButtonText: block.secondaryButtonText,
                secondaryButtonUrl: block.secondaryButtonUrl,
                email: block.email,
                phone: block.phone,
                address: block.address
              }),
              image: ''
            };
          default:
            return {
              ...baseData,
              heading: block.type,
              text: block.content || '',
              image: block.url || ''
            };
        }
      });

      const data = {
        title: formData.title.trim(),
        publish_date: new Date(formData.publish_date),
        images: formData.images || [],
        videos: formData.videos || [],
        tags: formData.tags
          ? formData.tags.split(',').map(item => item.trim()).filter(item => item)
          : [],
        author: formData.author?.trim() || '',
        content: convertedContent,
        theme: theme,
      };
      
      console.log('Submitting blog payload:', data);
      let response;
      if (selectedBlog) {
        response = await api.put(`${API_BASE_URL}/blogs/${selectedBlog._id}`, data);
        setBlogs(blogs.map(b => b._id === selectedBlog._id ? response.data : b));
        setSuccess('Blog updated successfully');
      } else {
        response = await api.post(`${API_BASE_URL}/blogs`, data);
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

  // Blog management functions
  const handleDeleteBlog = (id, name) => {
    if (!isValidId(id)) {
      console.error('Invalid blog ID:', id);
      setError('Invalid blog ID');
      return;
    }
    setModal({ isOpen: true, id, name, type: 'delete' });
  };

  const handleDuplicateBlog = async (id) => {
    if (!isValidId(id)) {
      console.error('Invalid blog ID:', id);
      setError('Invalid blog ID');
      return;
    }
    try {
      const response = await api.post(`${API_BASE_URL}/blogs/duplicate/${id}`);
      setBlogs([...blogs, response.data]);
      setNotification('Blog duplicated successfully');
      setSuccess('Blog duplicated successfully');
    } catch (err) {
      console.error('Duplicate error:', err);
      setError(`Failed to duplicate blog: ${err.response?.data?.msg || err.message}`);
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    if (!isValidId(id)) {
      console.error('Invalid blog ID:', id);
      setError('Invalid blog ID');
      return;
    }
    try {
      const response = await api.put(`${API_BASE_URL}/blogs/status/${id}`, { status: !currentStatus });
      setBlogs(blogs.map(b => b._id === id ? { ...b, status: response.data.status } : b));
      setSuccess(`Blog ${currentStatus ? 'deactivated' : 'activated'} successfully`);
    } catch (err) {
      console.error('Toggle status error:', err);
      setError(`Failed to update blog status: ${err.response?.data?.msg || err.message}`);
    }
  };

  const confirmModalAction = async () => {
    if (modal.type === 'delete') {
      try {
        if (!isValidId(modal.id)) {
          console.error('Invalid blog ID:', modal.id);
          setError('Invalid blog ID');
          return;
        }
        await api.delete(`${API_BASE_URL}/blogs/${modal.id}`);
        setBlogs(blogs.filter(b => b._id !== modal.id));
        setSuccess('Blog deleted successfully');
        resetForm();
      } catch (err) {
        console.error('Delete error:', err);
        setError(`Failed to delete blog: ${err.response?.data?.msg || err.message}`);
      }
    }
    setModal({ isOpen: false, id: null, name: '', type: 'delete' });
  };

  const closeModal = () => {
    setModal({ isOpen: false, id: null, name: '', type: 'delete' });
  };

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

    // Block conversion from backend content to content blocks
    const convertedBlocks = (blog.content || []).map((section, index) => {
      const baseBlock = {
        id: Date.now() + index,
        style: 'default',
        spacing: section.blockData?.spacing || 'normal',
        animation: section.blockData?.animation || 'none',
        shadow: section.blockData?.shadow || 'none',
        borderRadius: section.blockData?.borderRadius || 8,
        padding: section.blockData?.padding || 16,
        width: section.blockData?.width || 'full',
        alignment: section.blockData?.alignment || 'center',
        size: section.blockData?.size || 'medium',
        buttonColor: section.blockData?.buttonColor,
        textColor: section.blockData?.textColor,
        accentColor: section.blockData?.accentColor,
        backgroundColor: section.blockData?.backgroundColor,
        opacity: section.blockData?.opacity,
        hoverEffect: section.blockData?.hoverEffect,
        leftAlign: section.blockData?.leftAlign || 'left',
        rightAlign: section.blockData?.rightAlign || 'left',
        height: section.blockData?.height,
        level: section.blockData?.level,
        listType: section.blockData?.listType,
        listStyle: section.blockData?.listStyle,
        checkedItems: section.blockData?.checkedItems,
        dividerStyle: section.blockData?.dividerStyle,
        dividerSize: section.blockData?.dividerSize,
        items: section.blockData?.items,
        urls: section.blockData?.urls,
        layout: section.blockData?.layout,
        media: section.blockData?.media,
        author: section.blockData?.author,
        caption: section.blockData?.caption,
        buttonStyle: section.blockData?.buttonStyle,
        backgroundStyle: section.blockData?.backgroundStyle,
        borderStyle: section.blockData?.borderStyle,
        leftType: section.blockData?.leftType || 'text',
        rightType: section.blockData?.rightType || 'text',
        leftImage: section.blockData?.leftImage,
        rightImage: section.blockData?.rightImage,
        title: section.blockData?.title,
        description: section.blockData?.description,
        primaryButtonText: section.blockData?.primaryButtonText,
        primaryButtonUrl: section.blockData?.primaryButtonUrl,
        secondaryButtonText: section.blockData?.secondaryButtonText,
        secondaryButtonUrl: section.blockData?.secondaryButtonUrl,
        ctaStyle: section.blockData?.ctaStyle || 'modern',
        primaryColor: section.blockData?.primaryColor,
        email: section.blockData?.email,
        phone: section.blockData?.phone,
        address: section.blockData?.address
      };

      // Convert based on blockType if available, otherwise infer from content
      if (section.blockType) {
        switch (section.blockType) {
          case BLOCK_TYPES.HEADING:
            return {
              ...baseBlock,
              type: BLOCK_TYPES.HEADING,
              content: section.heading,
              level: section.blockData?.level || 'h2'
            };
          case BLOCK_TYPES.TEXT:
            return {
              ...baseBlock,
              type: BLOCK_TYPES.TEXT,
              content: section.text
            };
          case BLOCK_TYPES.IMAGE:
            return {
              ...baseBlock,
              type: BLOCK_TYPES.IMAGE,
              url: section.image,
              caption: section.blockData?.caption || section.heading || ''
            };
          case BLOCK_TYPES.VIDEO:
            return {
              ...baseBlock,
              type: BLOCK_TYPES.VIDEO,
              url: section.image,
              caption: section.blockData?.caption || section.heading || ''
            };
          case BLOCK_TYPES.LIST:
            let listData = { items: [], listType: 'unordered', listStyle: 'disc', checkedItems: {} };
            try {
              listData = JSON.parse(section.text);
            } catch (e) {
              // Fallback to blockData
              listData = {
                items: section.blockData?.items || [],
                listType: section.blockData?.listType || 'unordered',
                listStyle: section.blockData?.listStyle || 'disc',
                checkedItems: section.blockData?.checkedItems || {}
              };
            }
            return {
              ...baseBlock,
              type: BLOCK_TYPES.LIST,
              items: listData.items || [],
              listType: listData.listType || 'unordered',
              listStyle: listData.listStyle || 'disc',
              checkedItems: listData.checkedItems || {}
            };
          case BLOCK_TYPES.QUOTE:
            return {
              ...baseBlock,
              type: BLOCK_TYPES.QUOTE,
              content: section.text,
              author: section.blockData?.author || ''
            };
          case BLOCK_TYPES.DIVIDER:
            return {
              ...baseBlock,
              type: BLOCK_TYPES.DIVIDER,
              dividerStyle: section.blockData?.dividerStyle || 'line',
              dividerSize: section.blockData?.dividerSize || '1'
            };
          case BLOCK_TYPES.EMBED:
            return {
              ...baseBlock,
              type: BLOCK_TYPES.EMBED,
              url: section.image
            };
          case BLOCK_TYPES.GALLERY:
            return {
              ...baseBlock,
              type: BLOCK_TYPES.GALLERY,
              urls: section.image ? section.image.split(',') : [],
              layout: section.blockData?.layout || 'grid'
            };
          case BLOCK_TYPES.BUTTON:
            return {
              ...baseBlock,
              type: BLOCK_TYPES.BUTTON,
              text: section.text,
              url: section.image,
              buttonStyle: section.blockData?.buttonStyle || 'primary'
            };
          case BLOCK_TYPES.COLUMNS:
            let columnsData = { 
              left: '', 
              right: '', 
              leftAlign: 'left', 
              rightAlign: 'left',
              leftType: 'text',
              rightType: 'text',
              leftImage: '',
              rightImage: ''
            };
            try {
              columnsData = JSON.parse(section.text);
            } catch (e) {}
            return {
              ...baseBlock,
              type: BLOCK_TYPES.COLUMNS,
              leftContent: columnsData.left || '',
              rightContent: columnsData.right || '',
              leftAlign: columnsData.leftAlign || 'left',
              rightAlign: columnsData.rightAlign || 'left',
              leftType: columnsData.leftType || 'text',
              rightType: columnsData.rightType || 'text',
              leftImage: columnsData.leftImage || '',
              rightImage: columnsData.rightImage || ''
            };
          case BLOCK_TYPES.SPACER:
            return {
              ...baseBlock,
              type: BLOCK_TYPES.SPACER,
              height: section.blockData?.height || 20
            };
          case BLOCK_TYPES.CARD:
            return {
              ...baseBlock,
              type: BLOCK_TYPES.CARD,
              title: section.heading,
              content: section.text,
              media: section.image ? section.image.split(',') : []
            };
          case BLOCK_TYPES.CTA:
            let ctaData = {};
            try {
              ctaData = JSON.parse(section.text);
            } catch (e) {}
            return {
              ...baseBlock,
              type: BLOCK_TYPES.CTA,
              title: section.heading,
              description: ctaData.description || '',
              primaryButtonText: ctaData.primaryButtonText || '',
              primaryButtonUrl: ctaData.primaryButtonUrl || '',
              secondaryButtonText: ctaData.secondaryButtonText || '',
              secondaryButtonUrl: ctaData.secondaryButtonUrl || '',
              email: ctaData.email || '',
              phone: ctaData.phone || '',
              address: ctaData.address || ''
            };
          default:
            return {
              ...baseBlock,
              type: BLOCK_TYPES.TEXT,
              content: section.text || section.heading || ''
            };
        }
      } else {
        // Legacy conversion based on content structure
        if (section.heading && !section.text && !section.image) {
          return {
            ...baseBlock,
            type: BLOCK_TYPES.HEADING,
            content: section.heading,
            level: 'h2'
          };
        } else if (section.text && !section.heading && !section.image) {
          return {
            ...baseBlock,
            type: BLOCK_TYPES.TEXT,
            content: section.text
          };
        } else if (section.image && !section.heading && !section.text) {
          return {
            ...baseBlock,
            type: BLOCK_TYPES.IMAGE,
            url: section.image,
            caption: ''
          };
        } else {
          return {
            ...baseBlock,
            type: BLOCK_TYPES.TEXT,
            content: `${section.heading ? `<h3>${section.heading}</h3>` : ''}${section.text || ''}`
          };
        }
      }
    });
    
    setContentBlocks(convertedBlocks);
    
    // Load theme if available
    if (blog.theme) {
      setTheme(blog.theme);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      publish_date: '',
      images: [],
      videos: [],
      tags: '',
      author: '',
    });
    setContentBlocks([]);
    setSelectedBlog(null);
    setError('');
    setSuccess('');
    setTheme(THEME_PRESETS.default);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50" style={{ fontFamily: theme.fontFamily }}>
      {notification && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-6 py-3 rounded-xl shadow-lg z-50 transition-all duration-300 animate-bounce">
          {notification}
        </div>
      )}
      
      <EnhancedConfirmationModal
        isOpen={modal.isOpen}
        onClose={closeModal}
        onConfirm={confirmModalAction}
        title={`${modal.type === 'delete' ? 'Delete' : 'Confirm'} Blog`}
        message={`Are you sure you want to ${modal.type} "${modal.name}"? This action cannot be undone.`}
        type={modal.type}
      />
      
      <EnhancedBlogPreview
        blog={formData}
        contentBlocks={contentBlocks}
        theme={theme}
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
      />
      
      <ThemeCustomizer
        theme={theme}
        onThemeChange={setTheme}
        isOpen={showThemeCustomizer}
        onClose={() => setShowThemeCustomizer(false)}
      />
      
      <div className="container mx-auto p-6 max-w-8xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-12">
          <div className="flex gap-4">
            <button
              onClick={() => setShowThemeCustomizer(true)}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              <Palette size={20} />
              Customize Theme
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-6 mb-8 rounded-2xl shadow-sm">
            <div className="flex items-center gap-3">
              <X className="text-red-500" size={20} />
              {error}
            </div>
          </div>
        )}
        
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 p-6 mb-8 rounded-2xl shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full"></div>
              </div>
              {success}
            </div>
          </div>
        )}

        {/* Blog Form */}
        <div className="mb-12 p-6 bg-white rounded-2xl shadow-lg">
          <h2 className="text-2xl font-semibold mb-6 text-[#074a5b]" style={{ fontFamily: "'Comic Sans MS', 'Comic Neue'" }}>
            {selectedBlog ? 'Edit Blog' : 'Create New Blog'}
          </h2>
          <form onSubmit={handleBlogSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block mb-2 text-[#074a5b] font-semibold" style={{ fontFamily: "'Comic Sans MS', 'Comic Neue'" }}>Blog Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none h-12 w-full"
                style={{ fontFamily: "'Comic Sans MS', 'Comic Neue'" }}
                required
              />
            </div>
            <div>
              <label className="block mb-2 text-[#074a5b] font-semibold" style={{ fontFamily: "'Comic Sans MS', 'Comic Neue'" }}>Publish Date & Time *</label>
              <input
                type="datetime-local"
                value={formData.publish_date}
                onChange={(e) => setFormData({ ...formData, publish_date: e.target.value })}
                className="border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none h-12 w-full"
                style={{ fontFamily: "'Comic Sans MS', 'Comic Neue'" }}
                required
              />
            </div>
            <div>
              <label className="block mb-2 text-[#074a5b] font-semibold" style={{ fontFamily: "'Comic Sans MS', 'Comic Neue'" }}>Author</label>
              <input
                type="text"
                value={formData.author}
                onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                className="border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none h-12 w-full"
                style={{ fontFamily: "'Comic Sans MS', 'Comic Neue'" }}
              />
            </div>
            <div>
              <label className="block mb-2 text-[#074a5b] font-semibold" style={{ fontFamily: "'Comic Sans MS', 'Comic Neue'" }}>Tags (comma-separated)</label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                className="border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none h-12 w-full"
                style={{ fontFamily: "'Comic Sans MS', 'Comic Neue'" }}
              />
            </div>
            <div className="col-span-1">
              <label className="block mb-2 text-[#074a5b] font-semibold" style={{ fontFamily: "'Comic Sans MS', 'Comic Neue'" }}>Featured Image</label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none h-12"
                style={{ fontFamily: "'Comic Sans MS', 'Comic Neue'" }}
                disabled={uploading}
              />
              <div className="mt-2 flex flex-wrap gap-2">
                {formData.images.map((img, index) => (
                  <div key={index} className="relative">
                    <img
                      src={getSafeImageUrl(img)}
                      alt={`Preview ${index}`}
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveMainImage(index)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <div className="col-span-1">
              <label className="block mb-2 text-[#074a5b] font-semibold" style={{ fontFamily: "'Comic Sans MS', 'Comic Neue'" }}>Featured Video</label>
              <input
                type="file"
                accept="video/*"
                multiple
                onChange={handleVideoUpload}
                className="border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none h-12"
                style={{ fontFamily: "'Comic Sans MS', 'Comic Neue'" }}
                disabled={uploading}
              />
              <div className="mt-2 flex flex-wrap gap-2">
                {formData.videos.map((vid, index) => (
                  <div key={index} className="relative">
                    <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center">
                      <Video size={24} className="text-gray-500" />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveVideo(index)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </form>
        </div>

        {/* Content Editor */}
        <div className="mb-12 p-6 bg-white rounded-2xl shadow-lg">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-[#074a5b]" style={{ fontFamily: "'Comic Sans MS', 'Comic Neue'" }}>
            Blog Content Editor
            </h2>
            <div className="relative">
              <button
                onClick={() => setShowBlockSelector(!showBlockSelector)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center gap-2"
                style={{ fontFamily: "'Comic Sans MS', 'Comic Neue'" }}
              >
                <Plus size={20} />
                Add Content Block
                <ChevronDown size={16} />
              </button>
              {showBlockSelector && (
                  <EnhancedBlockTypeSelector
                    onAddBlock={addBlock}
                    onClose={() => setShowBlockSelector(false)}
                  />
              )}
            </div>
          </div>
          
         {contentBlocks.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Type size={48} className="mx-auto mb-4 text-gray-300" />
              <p className="text-lg mb-2" style={{ fontFamily: "'Comic Sans MS', 'Comic Neue'" }}>Start creating your blog content</p>
              <p className="text-sm" style={{ fontFamily: "'Comic Sans MS', 'Comic Neue'" }}>Click "Add Content Block" to begin building your blog with flexible content blocks</p>
            </div>
          ) : (
            <div className="space-y-8 relative pl-20">
              {contentBlocks.map((block, index) => (
                <div key={block.id} className="group relative">
                  <ContentBlock
                    block={block}
                    index={index}
                    updateBlock={updateBlock}
                    deleteBlock={deleteBlock}
                    moveBlock={moveBlock}
                    duplicateBlock={duplicateBlock}
                    uploadImage={uploadImage}
                    uploadVideo={uploadVideo}
                    uploading={uploading}
                    theme={theme}
                  />
                </div>
              ))}
            </div>
          )}
          
    {contentBlocks.length > 0 && (
      <div className="mt-8 pt-6 border-t flex gap-4 justify-center">
              <button
                onClick={() => setShowPreview(true)}
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center gap-2"
                style={{ fontFamily: "'Comic Sans MS', 'Comic Neue'" }}
                disabled={uploading}
              >
                <Eye size={20} />
                Preview Blog
              </button>
              <button
                onClick={handleBlogSubmit}
                className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center gap-2"
                style={{ fontFamily: "'Comic Sans MS', 'Comic Neue'" }}
                disabled={uploading}
              >
                <Save size={20} />
                {selectedBlog ? 'Update Blog' : 'Publish Blog'}
              </button>
              {selectedBlog && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-6 py-3 rounded-xl font-semibold transition-all duration-300"
                  style={{ fontFamily: "'Comic Sans MS', 'Comic Neue'" }}
                  disabled={uploading}
                >
                  Cancel Editing
                </button>
              )}
            </div>
          )}
        </div>
        
           {/* Blog List */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold mb-6 text-[#074a5b]" style={{ fontFamily: "'Comic Sans MS', 'Comic Neue'" }}>Published Blogs</h2>
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
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-2 text-[#074a5b] hover:text-blue-600 transition-colors" style={{ fontFamily: "'Comic Sans MS', 'Comic Neue'" }}>
                    {blog.title}
                  </h3>
                  <p className="text-gray-600 mb-2" style={{ fontFamily: "'Comic Sans MS', 'Comic Neue'" }}>By: {blog.author || 'Unknown'}</p>
                  <p className="text-gray-600 mb-2" style={{ fontFamily: "'Comic Sans MS', 'Comic Neue'" }}>{new Date(blog.publish_date).toLocaleDateString()}</p>
                  <p className="text-gray-600 mb-4" style={{ fontFamily: "'Comic Sans MS', 'Comic Neue'" }}>Status: {getBlogStatusLabel(blog)}</p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => handleEditBlog(blog)}
                      className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded-lg font-semibold transition-all text-sm"
                      style={{ fontFamily: "'Comic Sans MS', 'Comic Neue'" }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteBlog(blog._id, blog.title)}
                      className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg font-semibold transition-all text-sm"
                      style={{ fontFamily: "'Comic Sans MS', 'Comic Neue'" }}
                    >
                      Delete
                    </button>
                    <button
                      onClick={() => handleDuplicateBlog(blog._id)}
                      className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-3 py-1 rounded-lg font-semibold transition-all text-sm"
                      style={{ fontFamily: "'Comic Sans MS', 'Comic Neue'" }}
                    >
                      <FaRegClone size={14} />
                    </button>
                    <button
                      onClick={() => handleToggleStatus(blog._id, blog.status)}
                      className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-3 py-1 rounded-lg font-semibold transition-all text-sm"
                      style={{ fontFamily: "'Comic Sans MS', 'Comic Neue'" }}
                    >
                      {blog.status ? <FaToggleOn color="green" size={18} /> : <FaToggleOff color="gray" size={18} />}
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

export default BlogManagement;
