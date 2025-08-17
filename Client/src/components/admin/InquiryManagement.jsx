import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X } from 'lucide-react';

const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-[#074a5b]" style={{ fontFamily: "'Comic Sans MS', 'Comic Neue'" }}>
            {title}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-600 hover:text-gray-800"
            aria-label="Close modal"
            style={{ fontFamily: "'Comic Sans MS', 'Comic Neue'" }}
          >
            <X size={20} />
          </button>
        </div>
        <p className="text-gray-600 mb-6" style={{ fontFamily: "'Comic Sans MS', 'Comic Neue'" }}>
          {message}
        </p>
        <div className="flex justify-end gap-4">
          <button
            onClick={onClose}
            className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-xl font-semibold transition-all duration-300"
            style={{ fontFamily: "'Comic Sans MS', 'Comic Neue'" }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl font-semibold transition-all duration-300"
            style={{ fontFamily: "'Comic Sans MS', 'Comic Neue'" }}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

const ReplyModal = ({ isOpen, onClose, onSubmit, inquiry }) => {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  if (!isOpen) return null;

  const getInquiryId = (inquiry) => {
    if (!inquiry) return '';
    if (inquiry._id && typeof inquiry._id === 'object' && inquiry._id.$oid) return inquiry._id.$oid;
    if (typeof inquiry._id === 'string') return inquiry._id;
    return '';
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const inquiryId = getInquiryId(inquiry);
    if (!inquiryId || typeof inquiryId !== 'string' || !/^[a-fA-F0-9]{24}$/.test(inquiryId)) {
      onClose();
      setSubject('');
      setMessage('');
      alert('Invalid inquiry id for reply.');
      return;
    }
    onSubmit({ inquiryId, subject, message });
    setSubject('');
    setMessage('');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-[#074a5b]" style={{ fontFamily: "'Comic Sans MS', 'Comic Neue'" }}>
            Reply to {inquiry.name}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-600 hover:text-gray-800"
            aria-label="Close modal"
            style={{ fontFamily: "'Comic Sans MS', 'Comic Neue'" }}
          >
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-600 mb-2" style={{ fontFamily: "'Comic Sans MS', 'Comic Neue'" }}>
              Subject
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-3 py-2 focus:outline-none focus:border-[#1e809b]"
              required
              style={{ fontFamily: "'Comic Sans MS', 'Comic Neue'" }}
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-600 mb-2" style={{ fontFamily: "'Comic Sans MS', 'Comic Neue'" }}>
              Message
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-3 py-2 focus:outline-none focus:border-[#1e809b]"
              rows="5"
              required
              style={{ fontFamily: "'Comic Sans MS', 'Comic Neue'" }}
            />
          </div>
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-xl font-semibold transition-all duration-300"
              style={{ fontFamily: "'Comic Sans MS', 'Comic Neue'" }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-[#074a5b] hover:bg-[#1e809b] text-white px-4 py-2 rounded-xl font-semibold transition-all duration-300"
              style={{ fontFamily: "'Comic Sans MS', 'Comic Neue'" }}
            >
              Send Reply
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ViewReplyModal = ({ isOpen, onClose, replyMessage }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-[#074a5b]" style={{ fontFamily: "'Comic Sans MS', 'Comic Neue'" }}>
            Reply Message
          </h3>
          <button
            onClick={onClose}
            className="text-gray-600 hover:text-gray-800"
            aria-label="Close modal"
            style={{ fontFamily: "'Comic Sans MS', 'Comic Neue'" }}
          >
            <X size={20} />
          </button>
        </div>
        <p className="text-gray-600 mb-6" style={{ fontFamily: "'Comic Sans MS', 'Comic Neue'" }}>
          {replyMessage || 'No reply message sent yet.'}
        </p>
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-xl font-semibold transition-all duration-300"
            style={{ fontFamily: "'Comic Sans MS', 'Comic Neue'" }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

const InquiryManagement = () => {
  const [inquiries, setInquiries] = useState([]);
  const [activeTab, setActiveTab] = useState('Package');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null, name: '' });
  const [replyModal, setReplyModal] = useState({ isOpen: false, inquiry: null });
  const [viewReplyModal, setViewReplyModal] = useState({ isOpen: false, replyMessage: '' });
  const [refreshing, setRefreshing] = useState(false);

  // Auto-clear error and success messages
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 5000);
      return () => clearTimeout(timer);
    }
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  // Fetch inquiries
  useEffect(() => {
    fetchInquiries();
  }, []);

  const fetchInquiries = async () => {
    setRefreshing(true);
    try {
      const response = await axios.get('https://editable-travel-website1-rpfv.vercel.app/api/inquiries');
      setInquiries(response.data);
    } catch (err) {
      console.error('Fetch inquiries error:', err);
      setError('Failed to fetch inquiries');
    } finally {
      setRefreshing(false);
    }
  };

  const handleDeleteInquiry = (id, name) => {
    let validId = id;
    if (typeof id === 'object' && id !== null && id.$oid) {
      validId = id.$oid;
    }
    if (!validId || typeof validId !== 'string') {
      setError('Invalid inquiry id for delete');
      return;
    }
    setDeleteModal({ isOpen: true, id: validId, name });
  };

  const confirmDelete = async () => {
    try {
      await axios.delete(`https://editable-travel-website1-rpfv.vercel.app/api/inquiries/${deleteModal.id}`);
      setInquiries(inquiries.filter((i) => i._id.$oid !== deleteModal.id));
      setSuccess('Inquiry deleted successfully');
    } catch (err) {
      console.error('Delete inquiry error:', err);
      setError('Failed to delete inquiry');
    } finally {
      setDeleteModal({ isOpen: false, id: null, name: '' });
    }
  };

  const handleReplyInquiry = (inquiry) => {
    setReplyModal({ isOpen: true, inquiry });
  };

  const handleSendReply = async ({ inquiryId, subject, message }) => {
    if (!inquiryId || typeof inquiryId !== 'string' || !/^[a-fA-F0-9]{24}$/.test(inquiryId)) {
      setError('Invalid inquiry id for reply');
      setReplyModal({ isOpen: false, inquiry: null });
      return;
    }
    try {
      await axios.post('//inquiries/reply', { inquiryId, subject, message });
      setInquiries((prev) => prev.map((i) =>
        (i._id && i._id.$oid === inquiryId) ? { ...i, replyMessage: message } : i
      ));
      setSuccess('Reply sent successfully');
      setViewReplyModal({ isOpen: true, replyMessage: message });
    } catch (err) {
      console.error('Send reply error:', err);
      setError('Failed to send reply');
    } finally {
      setReplyModal({ isOpen: false, inquiry: null });
    }
  };

  const handleViewReply = (replyMessage) => {
    setViewReplyModal({ isOpen: true, replyMessage });
  };

  const tabs = ['Package', 'Activity', 'Accommodation', 'Contact'];

  const renderTable = (tab) => {
    const filteredInquiries = inquiries.filter((inquiry) => inquiry.entityType === tab);

    if (filteredInquiries.length === 0) {
      return (
        <p className="text-gray-600" style={{ fontFamily: "'Comic Sans MS', 'Comic Neue'" }}>
          No {tab.toLowerCase()} inquiries found.
        </p>
      );
    }

    const headers = {
      Package: [
        'Name', 'Email', 'Phone', 'Country', 'Adults', 'Children', 'Infants',
        'From Date', 'To Date', 'Message', 'Title', 'Submitted At', 'Mode of Book', 'Actions'
      ],
      Activity: [
        'Name', 'Email', 'Phone', 'Country', 'Adults', 'Children', 'Infants',
        'From Date', 'To Date', 'Message', 'Title', 'Submitted At', 'Mode of Book', 'Actions'
      ],
      Accommodation: [
        'Name', 'Email', 'Phone', 'Country', 'Adults', 'Children', 'Infants',
        'From Date', 'To Date', 'Message', 'Resort Name', 'Room Name', 'Submitted At', 'Mode of Book', 'Actions'
      ],
      Contact: [
        'Name', 'Email', 'Message', 'Submitted At', 'Mode of Book', 'Actions'
      ]
    };

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white rounded-2xl shadow-lg table-fixed font-sans">
          <thead>
            <tr className="bg-[#074a5b] text-white">
              {headers[tab].map((header) => (
                <th
                  key={header}
                  className="px-4 py-2 text-center text-sm font-semibold min-w-[100px] max-w-[200px] font-sans"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredInquiries.map((inquiry) => {
              const rowId = (inquiry._id && inquiry._id.$oid) ? inquiry._id.$oid : inquiry._id;
              const deleteId = (inquiry._id && inquiry._id.$oid) ? inquiry._id.$oid : inquiry._id;
              const cells = [
                <td key={rowId+"-name"} className="px-4 py-2 text-gray-600 truncate min-w-[100px] max-w-[150px] font-sans">{inquiry.name}</td>,
                <td key={rowId+"-email"} className="px-4 py-2 text-gray-600 truncate min-w-[120px] max-w-[200px] font-sans">{inquiry.email}</td>
              ];
              if (tab !== 'Contact') {
                const parseDate = (dateVal) => {
                  if (!dateVal) return 'N/A';
                  if (typeof dateVal === 'string') {
                    const d = new Date(dateVal);
                    return isNaN(d) ? 'N/A' : d.toLocaleDateString();
                  }
                  if (typeof dateVal === 'object' && dateVal.$date) {
                    const d = new Date(dateVal.$date);
                    return isNaN(d) ? 'N/A' : d.toLocaleDateString();
                  }
                  return 'N/A';
                };
                cells.push(
                  <td key={rowId+"-phone"} className="px-4 py-2 text-gray-600 min-w-[100px] max-w-[120px] font-sans">{inquiry.phone_number || 'N/A'}</td>,
                  <td key={rowId+"-country"} className="px-4 py-2 text-gray-600 min-w-[80px] max-w-[100px] font-sans">{inquiry.country || 'N/A'}</td>,
                  <td key={rowId+"-adults"} className="px-4 py-2 text-gray-600 min-w-[80px] max-w-[100px] font-sans">{typeof inquiry.adults === 'number' ? inquiry.adults : (inquiry.adults ? Number(inquiry.adults) : 0)}</td>,
                  <td key={rowId+"-children"} className="px-4 py-2 text-gray-600 min-w-[80px] max-w-[100px] font-sans">{typeof inquiry.children === 'number' ? inquiry.children : (inquiry.children ? Number(inquiry.children) : 0)}</td>,
                  <td key={rowId+"-infants"} className="px-4 py-2 text-gray-600 min-w-[80px] max-w-[100px] font-sans">{typeof inquiry.infants === 'number' ? inquiry.infants : (inquiry.infants ? Number(inquiry.infants) : 0)}</td>,
                  <td key={rowId+"-from"} className="px-4 py-2 text-gray-600 min-w-[100px] max-w-[120px] font-sans">{parseDate(inquiry.from_date)}</td>,
                  <td key={rowId+"-to"} className="px-4 py-2 text-gray-600 min-w-[100px] max-w-[120px] font-sans">{parseDate(inquiry.to_date)}</td>
                );
              }
              cells.push(
                <td key={rowId+"-message"} className="px-4 py-2 text-gray-600 truncate min-w-[120px] max-w-[200px] font-sans">{inquiry.message || 'N/A'}</td>
              );
              if (tab === 'Package' || tab === 'Activity') {
                cells.push(
                  <td key={rowId+"-title"} className="px-4 py-2 text-gray-600 truncate min-w-[100px] max-w-[150px] font-sans">{inquiry.title || 'N/A'}</td>
                );
              } else if (tab === 'Accommodation') {
                cells.push(
                  <td key={rowId+"-resort"} className="px-4 py-2 text-gray-600 truncate min-w-[100px] max-w-[150px] font-sans">{inquiry.resortName || 'N/A'}</td>,
                  <td key={rowId+"-room"} className="px-4 py-2 text-gray-600 truncate min-w-[100px] max-w-[150px] font-sans">{inquiry.roomName || 'N/A'}</td>
                );
              }
              const parseDate = (dateVal) => {
                if (!dateVal) return 'N/A';
                if (typeof dateVal === 'string') {
                  const d = new Date(dateVal);
                  return isNaN(d) ? 'N/A' : d.toLocaleDateString();
                }
                if (typeof dateVal === 'object' && dateVal.$date) {
                  const d = new Date(dateVal.$date);
                  return isNaN(d) ? 'N/A' : d.toLocaleDateString();
                }
                return 'N/A';
              };
              cells.push(
                <td key={rowId+"-submitted"} className="px-4 py-2 text-gray-600 min-w-[100px] max-w-[120px] font-sans">{parseDate(inquiry.submitted_at)}</td>,
                <td key={rowId+"-mode"} className="px-4 py-2 text-gray-600 min-w-[100px] max-w-[120px] font-sans">{inquiry.buttonType === 'bookNow' ? 'Email' : inquiry.buttonType === 'whatsapp' ? 'WhatsApp' : 'N/A'}</td>,
                <td key={rowId+"-actions"} className="px-4 py-2 flex gap-2 min-w-[200px]">
                  <button
                    onClick={() => handleDeleteInquiry(deleteId, inquiry.name)}
                    className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-xl text-sm transition-all duration-300"
                    style={{ fontFamily: "'Comic Sans MS', 'Comic Neue'" }}
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => handleReplyInquiry(inquiry)}
                    className="bg-[#074a5b] hover:bg-[#1e809b] text-white px-3 py-1 rounded-xl text-sm transition-all duration-300"
                    style={{ fontFamily: "'Comic Sans MS', 'Comic Neue'" }}
                  >
                    Reply
                  </button>
                  <button
                    onClick={() => handleViewReply(inquiry.replyMessage)}
                    className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-3 py-1 rounded-xl text-sm transition-all duration-300"
                    style={{ fontFamily: "'Comic Sans MS', 'Comic Neue'" }}
                  >
                    View Reply
                  </button>
                </td>
              );
              return <tr key={rowId} className="border-t hover:bg-gray-100">{cells}</tr>;
            })}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "'Comic Sans MS', 'Comic Neue'" }}>
      <ConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, id: null, name: '' })}
        onConfirm={confirmDelete}
        title="Delete Inquiry"
        message={`Are you sure you want to delete the inquiry from ${deleteModal.name}? This action cannot be undone.`}
      />
      <ReplyModal
        isOpen={replyModal.isOpen}
        onClose={() => setReplyModal({ isOpen: false, inquiry: null })}
        onSubmit={handleSendReply}
        inquiry={replyModal.inquiry}
      />
      <ViewReplyModal
        isOpen={viewReplyModal.isOpen}
        onClose={() => setViewReplyModal({ isOpen: false, replyMessage: '' })}
        replyMessage={viewReplyModal.replyMessage}
      />
      <div className="container mx-auto p-6">
        <h1 className="text-4xl font-bold mb-8 text-[#074a5b]" style={{ fontFamily: "'Comic Sans MS', 'Comic Neue'" }}>
          Inquiry Management
        </h1>

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

        <div className="mb-12">
          <div className="flex items-center mb-4">
            <div className="flex-1"></div>
            <button
              onClick={refreshing ? undefined : fetchInquiries}
              disabled={refreshing}
              className={`px-4 py-2 bg-[#1e809b] text-white rounded-xl font-semibold shadow transition-all duration-300 ml-auto flex items-center gap-2 ${refreshing ? 'opacity-60 cursor-not-allowed' : 'hover:bg-[#074a5b]'}`}
              style={{ fontFamily: "'Comic Sans MS', 'Comic Neue'" }}
            >
              {refreshing && (
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                </svg>
              )}
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
          <div className="flex justify-center border-b border-gray-200 mb-6">
            {tabs.map((tab) => (
              <button
                key={tab}
                className={`px-4 py-2 text-sm font-semibold transition-all duration-300 font-sans ${
                  activeTab === tab
                    ? 'bg-[#074a5b] text-white border-b-2 border-[#074a5b]'
                    : 'text-gray-600 hover:text-[#074a5b]'
                }`}
                onClick={() => setActiveTab(tab)}
              >
                {tab} Inquiries
              </button>
            ))}
          </div>
          {refreshing ? (
            <div className="flex justify-center items-center py-12">
              <svg className="animate-spin h-8 w-8 text-[#074a5b]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
              </svg>
              <span className="ml-3 text-[#074a5b] font-semibold text-lg" style={{ fontFamily: "'Comic Sans MS', 'Comic Neue'" }}>Loading inquiries...</span>
            </div>
          ) : (
            renderTable(activeTab)
          )}
        </div>
      </div>
    </div>
  );
};

export default InquiryManagement;

