import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X } from 'lucide-react';

const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-[#074a5b]" style={{ fontFamily: 'Comic Sans MS, cursive' }}>
            {title}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-600 hover:text-gray-800"
            aria-label="Close modal"
            style={{ fontFamily: 'Comic Sans MS, cursive' }}
          >
            <X size={20} />
          </button>
        </div>
        <p className="text-gray-600 mb-6" style={{ fontFamily: 'Comic Sans MS, cursive' }}>
          {message}
        </p>
        <div className="flex justify-end gap-4">
          <button
            onClick={onClose}
            className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-xl font-semibold transition-all duration-300"
            style={{ fontFamily: 'Comic Sans MS, cursive' }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl font-semibold transition-all duration-300"
            style={{ fontFamily: 'Comic Sans MS, cursive' }}
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

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ inquiryId: inquiry._id.$oid, subject, message });
    setSubject('');
    setMessage('');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-[#074a5b]" style={{ fontFamily: 'Comic Sans MS, cursive' }}>
            Reply to {inquiry.name}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-600 hover:text-gray-800"
            aria-label="Close modal"
            style={{ fontFamily: 'Comic Sans MS, cursive' }}
          >
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-600 mb-2" style={{ fontFamily: 'Comic Sans MS, cursive' }}>
              Subject
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-3 py-2 focus:outline-none focus:border-[#1e809b]"
              required
              style={{ fontFamily: 'Comic Sans MS, cursive' }}
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-600 mb-2" style={{ fontFamily: 'Comic Sans MS, cursive' }}>
              Message
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-3 py-2 focus:outline-none focus:border-[#1e809b]"
              rows="5"
              required
              style={{ fontFamily: 'Comic Sans MS, cursive' }}
            />
          </div>
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-xl font-semibold transition-all duration-300"
              style={{ fontFamily: 'Comic Sans MS, cursive' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-[#074a5b] hover:bg-[#1e809b] text-white px-4 py-2 rounded-xl font-semibold transition-all duration-300"
              style={{ fontFamily: 'Comic Sans MS, cursive' }}
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
          <h3 className="text-lg font-semibold text-[#074a5b]" style={{ fontFamily: 'Comic Sans MS, cursive' }}>
            Reply Message
          </h3>
          <button
            onClick={onClose}
            className="text-gray-600 hover:text-gray-800"
            aria-label="Close modal"
            style={{ fontFamily: 'Comic Sans MS, cursive' }}
          >
            <X size={20} />
          </button>
        </div>
        <p className="text-gray-600 mb-6" style={{ fontFamily: 'Comic Sans MS, cursive' }}>
          {replyMessage || 'No reply message sent yet.'}
        </p>
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-xl font-semibold transition-all duration-300"
            style={{ fontFamily: 'Comic Sans MS, cursive' }}
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
    try {
      const response = await axios.get('/api/inquiries');
      setInquiries(response.data);
    } catch (err) {
      console.error('Fetch inquiries error:', err);
      setError('Failed to fetch inquiries');
    }
  };

  const handleDeleteInquiry = (id, name) => {
    setDeleteModal({ isOpen: true, id, name });
  };

  const confirmDelete = async () => {
    try {
      await axios.delete(`/api/inquiries/${deleteModal.id}`);
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
    try {
      await axios.post('/api/inquiries/reply', { inquiryId, subject, message });
      setInquiries(inquiries.map((i) =>
        i._id.$oid === inquiryId ? { ...i, replyMessage: message } : i
      ));
      setSuccess('Reply sent successfully');
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
        <p className="text-gray-600" style={{ fontFamily: 'Comic Sans MS, cursive' }}>
          No {tab.toLowerCase()} inquiries found.
        </p>
      );
    }

    const headers = {
      Package: [
        'Name', 'Email', 'Phone', 'Country', 'Travellers', 'Children Ages',
        'From Date', 'To Date', 'Message', 'Title', 'Submitted At', 'Mode of Book', 'Actions'
      ],
      Activity: [
        'Name', 'Email', 'Phone', 'Country', 'Travellers', 'Children Ages',
        'From Date', 'To Date', 'Message', 'Title', 'Submitted At', 'Mode of Book', 'Actions'
      ],
      Accommodation: [
        'Name', 'Email', 'Phone', 'Country', 'Travellers', 'Children Ages',
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
            {filteredInquiries.map((inquiry) => (
              <tr key={inquiry._id.$oid} className="border-t hover:bg-gray-100">
                <td className="px-4 py-2 text-gray-600 truncate min-w-[100px] max-w-[150px] font-sans">
                  {inquiry.name}
                </td>
                <td className="px-4 py-2 text-gray-600 truncate min-w-[120px] max-w-[200px] font-sans">
                  {inquiry.email}
                </td>
                {tab !== 'Contact' && (
                  <>
                    <td className="px-4 py-2 text-gray-600 min-w-[100px] max-w-[120px] font-sans">
                      {inquiry.phone_number || 'N/A'}
                    </td>
                    <td className="px-4 py-2 text-gray-600 min-w-[80px] max-w-[100px] font-sans">
                      {inquiry.country || 'N/A'}
                    </td>
                    <td className="px-4 py-2 text-gray-600 min-w-[80px] max-w-[100px] font-sans">
                      {inquiry.travellers || 'N/A'}
                    </td>
                    <td className="px-4 py-2 text-gray-600 truncate min-w-[100px] max-w-[120px] font-sans">
                      {inquiry.children?.length > 0 ? inquiry.children.join(', ') : 'None'}
                    </td>
                    <td className="px-4 py-2 text-gray-600 min-w-[100px] max-w-[120px] font-sans">
                      {inquiry.from_date?.$date ? new Date(inquiry.from_date.$date).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-4 py-2 text-gray-600 min-w-[100px] max-w-[120px] font-sans">
                      {inquiry.to_date?.$date ? new Date(inquiry.to_date.$date).toLocaleDateString() : 'N/A'}
                    </td>
                  </>
                )}
                <td className="px-4 py-2 text-gray-600 truncate min-w-[120px] max-w-[200px] font-sans">
                  {inquiry.message || 'N/A'}
                </td>
                {tab === 'Package' || tab === 'Activity' ? (
                  <td className="px-4 py-2 text-gray-600 truncate min-w-[100px] max-w-[150px] font-sans">
                    {inquiry.title || 'N/A'}
                  </td>
                ) : tab === 'Accommodation' ? (
                  <>
                    <td className="px-4 py-2 text-gray-600 truncate min-w-[100px] max-w-[150px] font-sans">
                      {inquiry.resortName || 'N/A'}
                    </td>
                    <td className="px-4 py-2 text-gray-600 truncate min-w-[100px] max-w-[150px] font-sans">
                      {inquiry.roomName || 'N/A'}
                    </td>
                  </>
                ) : null}
                <td className="px-4 py-2 text-gray-600 min-w-[100px] max-w-[120px] font-sans">
                  {inquiry.submitted_at?.$date ? new Date(inquiry.submitted_at.$date).toLocaleDateString() : 'N/A'}
                </td>
                <td className="px-4 py-2 text-gray-600 min-w-[100px] max-w-[120px] font-sans">
                  {inquiry.buttonType === 'bookNow' ? 'Email' : inquiry.buttonType === 'whatsapp' ? 'WhatsApp' : 'N/A'}
                </td>
                <td className="px-4 py-2 flex gap-2 min-w-[200px]">
                  <button
                    onClick={() => handleDeleteInquiry(inquiry._id.$oid, inquiry.name)}
                    className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-xl text-sm transition-all duration-300"
                    style={{ fontFamily: 'Comic Sans MS, cursive' }}
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => handleReplyInquiry(inquiry)}
                    className="bg-[#074a5b] hover:bg-[#1e809b] text-white px-3 py-1 rounded-xl text-sm transition-all duration-300"
                    style={{ fontFamily: 'Comic Sans MS, cursive' }}
                  >
                    Reply
                  </button>
                  <button
                    onClick={() => handleViewReply(inquiry.replyMessage)}
                    className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-3 py-1 rounded-xl text-sm transition-all duration-300"
                    style={{ fontFamily: 'Comic Sans MS, cursive' }}
                  >
                    View Reply
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: 'Comic Sans MS, cursive' }}>
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
        <h1 className="text-4xl font-bold mb-8 text-[#074a5b]" style={{ fontFamily: 'Comic Sans MS, cursive' }}>
          Inquiry Management
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

        <div className="mb-12">
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
          {renderTable(activeTab)}
        </div>
      </div>
    </div>
  );
};

export default InquiryManagement;