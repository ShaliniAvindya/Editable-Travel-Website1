import React, { useState, useEffect, useRef } from 'react';
import { X, Download } from 'lucide-react';
import axios from 'axios';
import { jsPDF } from 'jspdf';

const PrivacyPolicy = ({ isOpen, onClose }) => {
  const [content, setContent] = useState('');
  const [error, setError] = useState(null);
  const popupRef = useRef(null);

  // Parse HTML to PDF content
  const parseHtmlToPdf = (html) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const elements = doc.body.childNodes;
    const contentArray = [];

    const processNode = (node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent.trim();
        if (text) return { type: 'text', value: text, bold: false, italic: false, size: 12 };
        return null;
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const tag = node.tagName.toLowerCase();
        let item = null;

        if (tag === 'h1') {
          item = { type: 'text', value: node.textContent.trim(), bold: true, italic: false, size: 24 };
        } else if (tag === 'h2') {
          item = { type: 'text', value: node.textContent.trim(), bold: true, italic: false, size: 18 };
        } else if (tag === 'h3') {
          item = { type: 'text', value: node.textContent.trim(), bold: true, italic: false, size: 14 };
        } else if (tag === 'p') {
          item = { type: 'text', value: node.textContent.trim(), bold: false, italic: false, size: 12 };
        } else if (tag === 'strong') {
          item = { type: 'text', value: node.textContent.trim(), bold: true, italic: false, size: 12 };
        } else if (tag === 'em') {
          item = { type: 'text', value: node.textContent.trim(), bold: false, italic: true, size: 12 };
        } else if (tag === 'li') {
          item = { type: 'bullet', value: node.textContent.trim(), bold: false, italic: false, size: 12 };
        } else if (tag === 'a') {
          const href = node.getAttribute('href');
          item = { type: 'text', value: `${node.textContent.trim()} (${href})`, bold: false, italic: false, size: 12 };
        }

        if (item) return item;

        // Process child nodes
        const childItems = Array.from(node.childNodes).map(processNode).filter(Boolean);
        return childItems.length ? childItems : null;
      }
      return null;
    };

    elements.forEach((node) => {
      const result = processNode(node);
      if (result) {
        if (Array.isArray(result)) {
          contentArray.push(...result);
        } else {
          contentArray.push(result);
        }
      }
    });

    return contentArray;
  };

  // Download PDF
  const handleDownload = () => {
    const doc = new jsPDF();
    doc.setFont('helvetica');
    const marginLeft = 20;
    const marginRight = 20;
    const pageWidth = doc.internal.pageSize.getWidth();
    const textWidth = pageWidth - marginLeft - marginRight;
    let y = 20;

    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    const titleLines = doc.splitTextToSize('Privacy Policy', textWidth);
    doc.text(titleLines, marginLeft, y);
    y += titleLines.length * 24 * 0.5 + 10;

    const contentArray = parseHtmlToPdf(content || '<p>No content available.</p>');

    contentArray.forEach((item) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }

      doc.setFontSize(item.size);
      doc.setFont('helvetica', item.bold ? 'bold' : item.italic ? 'italic' : 'normal');

      const lines = doc.splitTextToSize(item.value, textWidth);
      const lineHeight = item.size * 0.5 + 5;

      if (item.type === 'bullet') {
        lines.forEach((line, index) => {
          if (y > 270) {
            doc.addPage();
            y = 20;
          }
          doc.text('• ' + line, marginLeft + 10, y);
          y += lineHeight;
        });
      } else {
        lines.forEach((line) => {
          if (y > 270) {
            doc.addPage();
            y = 20;
          }
          doc.text(line, marginLeft, y);
          y += lineHeight;
        });
      }
    });

    doc.save('privacy-policy.pdf');
  };

  // Fetch Privacy Policy content
  useEffect(() => {
    if (isOpen) {
      const fetchPrivacyPolicy = async () => {
        try {
          const response = await axios.get('https://editable-travel-website1-rpfv.vercel.app/api/ui-content/legal');
          const ppSection = response.data.sections?.find((s) => s.sectionId === 'privacy-policy');
          setContent(ppSection?.content.description || '<p>No content available.</p>');
        } catch (err) {
          console.error('Error fetching Privacy Policy:', err);
          setError('Failed to load Privacy Policy content.');
          setContent('<p>No content available.</p>');
        }
      };
      fetchPrivacyPolicy();
    }
  }, [isOpen]);

  // Close popup on outside click or Escape key
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isOpen && popupRef.current && !popupRef.current.contains(event.target)) {
        onClose();
      }
    };
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div
        ref={popupRef}
        className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-4xl max-h-[80vh] overflow-y-auto"
        style={{ fontFamily: 'Comic Sans MS, cursive' }}
        role="dialog"
        aria-labelledby="privacy-policy-title"
      >
        <div className="flex justify-between items-center mb-6">
          <h3 id="privacy-policy-title" className="text-3xl font-semibold text-[#074a5b]">
            Privacy Policy
          </h3>
          <div className="flex items-center gap-4">
            <button
              onClick={handleDownload}
              className="bg-[#1e809b] hover:bg-[#074a5b] text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center"
              style={{ fontFamily: 'Comic Sans MS, cursive' }}
              aria-label="Download Privacy Policy as PDF"
            >
              <Download size={16} className="mr-2" />
              Download PDF
            </button>
            <button
              onClick={onClose}
              className="text-gray-600 hover:text-gray-800 transition-all"
              aria-label="Close Privacy Policy"
            >
              <X size={24} />
            </button>
          </div>
        </div>
        {error && <div className="text-red-500 mb-4">{error}</div>}
        <div
          className="text-gray-700 prose prose-lg max-w-none leading-relaxed"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      </div>
    </div>
  );
};

export default PrivacyPolicy;
