import React, { useState, useEffect } from 'react';
import axios from 'axios';
import NewsletterManagement from './NewsletterManagement';
import { X } from 'lucide-react';
import { API_BASE_URL } from '../apiConfig';

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
  const [cc, setCc] = useState('');

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
    const ccList = (cc || '').split(/[,;\s]+/).map(s => s.trim()).filter(Boolean);
    onSubmit({ inquiryId, subject, message, cc: ccList });
    setSubject('');
    setMessage('');
    setCc('');
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
              CC (comma separated emails)
            </label>
            <input
              type="text"
              value={cc}
              onChange={(e) => setCc(e.target.value)}
              placeholder="e.g. other@example.com, another@example.com"
              className="w-full border border-gray-300 rounded-xl px-3 py-2 focus:outline-none focus:border-[#1e809b]"
              style={{ fontFamily: "'Comic Sans MS', 'Comic Neue'" }}
            />
            <p className="text-xs text-gray-500 mt-1">Optional: recipients to CC.</p>
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

const ViewReplyModal = ({ isOpen, onClose, inquiry }) => {
  if (!isOpen || !inquiry) return null;

  const toEmail = inquiry.email || (inquiry.inquiry && inquiry.inquiry.email) || 'N/A';
  const cc = Array.isArray(inquiry.cc) ? inquiry.cc : (typeof inquiry.cc === 'string' && inquiry.cc.trim() ? [inquiry.cc.trim()] : (inquiry.inquiry && Array.isArray(inquiry.inquiry.cc) ? inquiry.inquiry.cc : []));
  const replyMessage = inquiry.replyMessage || null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-[#074a5b]" style={{ fontFamily: "'Comic Sans MS', 'Comic Neue'" }}>
            Reply
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

        <div className="mb-4 text-sm text-gray-700">
          <div className="mb-2"><strong>To:</strong> <a href={`mailto:${toEmail}`} className="text-[#1e809b]">{toEmail}</a></div>
          <div className="mb-2"><strong>CC:</strong> {cc && cc.length ? cc.join(', ') : 'None'}</div>
        </div>

        <div className="mb-4">
          <label className="block text-gray-600 mb-2" style={{ fontFamily: "'Comic Sans MS', 'Comic Neue'" }}>Message</label>
          <div className="whitespace-pre-wrap bg-gray-50 p-3 rounded-lg text-gray-800" style={{ minHeight: 80 }}>{replyMessage}</div>
        </div>

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
  const [activeTab, setActiveTab] = useState('Accommodation');
  const [showArchived, setShowArchived] = useState(false);
  const [packageSubTab, setPackageSubTab] = useState('Accommodation');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null, name: '' });
  const [replyModal, setReplyModal] = useState({ isOpen: false, inquiry: null });
  const [viewReplyModal, setViewReplyModal] = useState({ isOpen: false, inquiry: null });
  const [viewDetailsModal, setViewDetailsModal] = useState({ isOpen: false, inquiry: null });
  const [refreshing, setRefreshing] = useState(false);

  const getField = (inquiry, key) => {
    if (!inquiry || !key) return undefined;
    if (Object.prototype.hasOwnProperty.call(inquiry, key)) return inquiry[key];
    const variants = [
      key.replace(/_/g, ''), 
      key.replace(/non_divers/g, 'nondivers'),
      key.replace(/nondivers/g, 'non_divers'),
      key.replace(/_([a-z])/g, (_, c) => c.toUpperCase()) 
    ];
    for (const v of variants) {
      if (Object.prototype.hasOwnProperty.call(inquiry, v)) return inquiry[v];
    }
    return inquiry[key];
  };

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
      const response = await axios.get(`${API_BASE_URL}/inquiries`);
      setInquiries(response.data);
    } catch (err) {
      console.error('Fetch inquiries error:', err);
      setError('Failed to fetch inquiries');
    } finally {
      setRefreshing(false);
    }
  };

  const DetailsModal = ({ isOpen, onClose, inquiry }) => {
    if (!isOpen || !inquiry) return null;
    const effectiveForm = (inquiry.entityType === 'Package')
      ? (inquiry.inquiry_form_type || 'Accommodation')
      : (inquiry.entityType || 'Contact');

    const labels = {
      name: 'Name',
      email: 'Email',
      phone_number: 'Phone',
      country: 'Country',
      message: 'Message',
      from_date: 'From Date',
      to_date: 'To Date',
      number_of_rooms: 'Number of Rooms',
      divers_adults: 'Divers Adults',
      divers_children: 'Divers Children',
      nondivers_adults: 'Non-Divers Adults',
      nondivers_children: 'Non-Divers Children',
      nondivers_infants: 'Non-Divers Infants',
      selectedActivities: 'Selected Activities',
      resortName: 'Resort Name',
      roomName: 'Room Name',
      preferredMonth: 'Preferred Month',
      preferredYear: 'Preferred Year',
  adventureOptions: 'Options',
  adventureOption: 'Option',
  participantsByOption: 'Participants by Option',
  participants: 'Participants',
      bookWholeBoat: 'Book Whole Boat',
      submitted_at: 'Submitted At',
      buttonType: 'Mode of Book',
      title: 'Title',
      inquiry_form_type: 'Inquiry Form Type',
      entityType: 'Entity Type',
      _id: 'ID'
    };

    const fieldsByForm = {
      Accommodation: [
        'name','email','phone_number','country','message','from_date','to_date','number_of_rooms',
        'divers_adults','divers_children','non_divers_adults','non_divers_children','non_divers_infants',
        'selectedActivities','resortName','roomName','submitted_at','buttonType','entityType','inquiry_form_type','title','_id'
      ],
      Adventure: [
        'name','email','phone_number','country','message','preferredMonth','preferredYear','adventureOptions','participantsByOption', 'adventureOption',
        'participants','bookWholeBoat','submitted_at','buttonType','entityType','inquiry_form_type','title','_id'
      ],
      Activity: [
        'name','email','phone_number','country','message','title','submitted_at','buttonType','entityType','inquiry_form_type','_id'
      ],
      Contact: [
        'name','email','message','submitted_at','buttonType','entityType','_id'
      ]
    };

    const chosenFields = fieldsByForm[effectiveForm] || Object.keys(inquiry);

    const renderValue = (val) => {
      if (val == null) return 'N/A';
      if (Array.isArray(val)) return val.map(v => (typeof v === 'object' ? JSON.stringify(v) : String(v))).join(', ');
      if (typeof val === 'object') {
        // Friendly render for participants array or other known shapes
        if (val.name || val.email) return JSON.stringify(val, null, 2);
        return JSON.stringify(val, null, 2);
      }
      if (typeof val === 'boolean') return val ? 'Yes' : 'No';
      return String(val);
    };

    const getLabel = (key) => labels[key] || key;

    const getId = (i) => {
      if (!i) return '';
      if (i._id && typeof i._id === 'object' && i._id.$oid) return i._id.$oid;
      if (typeof i._id === 'string') return i._id;
      return '';
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-3xl overflow-auto max-h-[80vh]">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-[#074a5b]">
              {effectiveForm} Inquiry - {inquiry.name} {getId(inquiry) ? `(${getId(inquiry)})` : ''}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-600 hover:text-gray-800"
              aria-label="Close modal"
            >
              <X size={20} />
            </button>
          </div>

          <div className="mb-4">
            <table className="w-full text-sm">
              <tbody>
                {chosenFields.map((key) => {
                  // Render participants specially for Activity inquiries
                  if (key === 'participantsByOption') {
                    const groups = Array.isArray(inquiry.participantsByOption) ? inquiry.participantsByOption : [];
                    if (groups.length === 0) {
                      return (
                        <tr key={key} className="border-t">
                          <td className="py-2 align-top font-semibold text-[#074a5b] w-1/3">{getLabel(key)}</td>
                          <td className="py-2 align-top whitespace-pre-wrap">N/A</td>
                        </tr>
                      );
                    }
                    return (
                      <React.Fragment key={key}>
                        <tr className="border-t bg-gray-50">
                          <td className="py-2 font-semibold text-[#074a5b]">{getLabel(key)}</td>
                          <td className="py-2">{groups.length} group(s)</td>
                        </tr>
                        {groups.map((g, gi) => (
                          <React.Fragment key={`group-${gi}`}>
                            <tr className="border-t">
                              <td className="py-2 align-top font-semibold text-[#074a5b] w-1/3">Option</td>
                              <td className="py-2 align-top whitespace-pre-wrap">{g.option}</td>
                            </tr>
                            {(Array.isArray(g.participants) ? g.participants : []).map((p, idx) => (
                              <tr key={`${key}-${gi}-${idx}`} className="border-t">
                                <td className="py-2 align-top font-semibold text-[#074a5b] w-1/3">{`Participant ${idx + 1} (${g.option})`}</td>
                                <td className="py-2 align-top whitespace-pre-wrap">
                                  <div className="space-y-1">
                                    {['name','gender','diverStatus','ageCategory'].map((field) => (
                                      p[field] != null ? (
                                        <div key={field}><strong className="text-gray-700">{field.charAt(0).toUpperCase() + field.slice(1)}:</strong> <span className="text-gray-900">{String(p[field])}</span></div>
                                      ) : null
                                    ))}
                                    {Object.keys(p).filter(f => !['name','gender','diverStatus','ageCategory','_id'].includes(f)).map(f => (
                                      <div key={f}><strong className="text-gray-700">{f}:</strong> <span className="text-gray-900">{renderValue(p[f])}</span></div>
                                    ))}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </React.Fragment>
                        ))}
                      </React.Fragment>
                    );
                  }
                  if (key === 'participants') {
                    const groups = Array.isArray(inquiry.participantsByOption) ? inquiry.participantsByOption : [];
                    if (groups && groups.length) {
                      // avoid duplicating
                      return null;
                    }
                    const parts = Array.isArray(inquiry.participants) ? inquiry.participants : [];
                    if (parts.length === 0) {
                      return (
                        <tr key={key} className="border-t">
                          <td className="py-2 align-top font-semibold text-[#074a5b] w-1/3">{getLabel(key)}</td>
                          <td className="py-2 align-top whitespace-pre-wrap">N/A</td>
                        </tr>
                      );
                    }
                    return (
                      <React.Fragment key={key}>
                        <tr className="border-t bg-gray-50">
                          <td className="py-2 font-semibold text-[#074a5b]">{getLabel(key)}</td>
                          <td className="py-2">{parts.length} participant(s)</td>
                        </tr>
                        {parts.map((p, idx) => (
                          <tr key={`${key}-${idx}`} className="border-t">
                            <td className="py-2 align-top font-semibold text-[#074a5b] w-1/3">Participant {idx + 1}</td>
                            <td className="py-2 align-top whitespace-pre-wrap">
                              <div className="space-y-1">
                                {(() => {
                                  const partLabels = { name: 'Name', gender: 'Gender', diverStatus: 'Diver status', ageCategory: 'Age category' };
                                  return (
                                    <>
                                      {['name','gender','diverStatus','ageCategory'].map((field) => (
                                        p[field] != null ? (
                                          <div key={field}><strong className="text-gray-700">{partLabels[field] || (field.charAt(0).toUpperCase() + field.slice(1))}:</strong> <span className="text-gray-900">{String(p[field])}</span></div>
                                        ) : null
                                      ))}
                                      {Object.keys(p).filter(f => !['name','gender','diverStatus','ageCategory','_id'].includes(f)).map(f => (
                                        <div key={f}><strong className="text-gray-700">{f}:</strong> <span className="text-gray-900">{renderValue(p[f])}</span></div>
                                      ))}
                                    </>
                                  );
                                })()}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </React.Fragment>
                    );
                  }

                  return (
                    <tr key={key} className="border-t">
                      <td className="py-2 align-top font-semibold text-[#074a5b] w-1/3">{getLabel(key)}</td>
                      <td className="py-2 align-top whitespace-pre-wrap">{renderValue(getField(inquiry, key))}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-xl font-semibold transition-all duration-300"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
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
      await axios.delete(`${API_BASE_URL}/inquiries/${deleteModal.id}`);
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

  const handleSendReply = async ({ inquiryId, subject, message, cc = [] }) => {
    if (!inquiryId || typeof inquiryId !== 'string' || !/^[a-fA-F0-9]{24}$/.test(inquiryId)) {
      setError('Invalid inquiry id for reply');
      setReplyModal({ isOpen: false, inquiry: null });
      return;
    }
    try {
      const payload = { inquiryId, subject, message };
      if (Array.isArray(cc) && cc.length) payload.cc = cc;
      const response = await axios.post(`${API_BASE_URL}/inquiries/reply`, payload);
      if (response.data && response.data.inquiry) {
        const updated = response.data.inquiry;
        setInquiries((prev) => prev.map((i) => {
          const id = (i._id && i._id.$oid) ? i._id.$oid : (i._id || '');
          const updId = (updated._id && updated._id.$oid) ? updated._id.$oid : (updated._id || '');
          if (id && updId && id === updId) return updated;
          return i;
        }));
      } else {
        setInquiries((prev) => prev.map((i) =>
          (i._id && i._id.$oid === inquiryId) ? { ...i, replyMessage: message, archived: true, archivedAt: new Date().toISOString() } : i
        ));
      }
      setSuccess('Reply sent successfully');
      const found = (inquiries || []).find((i) => {
        const id = (i._id && i._id.$oid) ? i._id.$oid : (i._id || '');
        return id === inquiryId;
      });
      const viewInquiry = found ? { ...found, replyMessage: message, cc } : { email: 'N/A', replyMessage: message, cc };
      setViewReplyModal({ isOpen: true, inquiry: viewInquiry });
    } catch (err) {
      console.error('Send reply error:', err);
      setError('Failed to send reply');
    } finally {
      setReplyModal({ isOpen: false, inquiry: null });
    }
  };

  const handleViewReply = (inquiry) => {
    setViewReplyModal({ isOpen: true, inquiry });
  };

  const tabs = ['Accommodation', 'Adventure', 'Activity', 'Package', 'Contact', 'Newsletter'];

  const displayTabLabel = (t) => {
    if (!t) return t;
    if (t === 'Adventure') return 'Liveaboard';
    return t;
  };

  const renderTable = (tab) => {
    const effectiveTab = tab === 'Package' ? packageSubTab : tab;
    const filteredInquiries = tab === 'Package'
      ? inquiries.filter((inquiry) => inquiry.entityType === 'Package' && inquiry.inquiry_form_type === packageSubTab)
      : inquiries.filter((inquiry) => inquiry.entityType === tab);

    const packageSubTabs = tab === 'Package' ? (
      <div className="mb-4 flex justify-center">
        <div className="inline-flex rounded bg-gray-100 p-1">
          {['Accommodation', 'Adventure', 'Activity'].map((sub) => (
            <button
              key={sub}
              onClick={() => setPackageSubTab(sub)}
              className={`px-4 py-2 rounded ${packageSubTab === sub ? 'bg-white shadow' : 'bg-transparent'}`}
            >
              {displayTabLabel(sub)}
            </button>
          ))}
        </div>
      </div>
    ) : null;

    const activeInquiries = filteredInquiries.filter(i => !i.archived);
    const archivedInquiries = filteredInquiries.filter(i => i.archived);
    if (filteredInquiries.length === 0) {
      return (
        <div>
          {packageSubTabs}
          <p className="text-gray-600" style={{ fontFamily: "'Comic Sans MS', 'Comic Neue'" }}>
            No {displayTabLabel(effectiveTab).toLowerCase()} inquiries found.
          </p>
        </div>
      );
    }

    const headers = {
      Package: [
        'Name', 'Email', 'Phone', 'Country', 'Message','From Date', 'To Date', 'Hotel', 'Submitted At', 'Mode of Book', 'Actions'
      ],
      Activity: [
        'Name', 'Email', 'Phone', 'Country', 'Message', 'Activity', 'Submitted At', 'Mode of Book', 'Actions'
      ],
      Accommodation: [
        'Name', 'Email', 'Phone', 'Country','Message', 'From Date', 'To Date', 'Number of Rooms', 'Divers Adults', 'Divers Children', 'Non-Divers Adults', 'Non-Divers Children', 'Non-Divers Infants', 'Selected Activities', 'Resort Name', 'Room Name', 'Submitted At', 'Mode of Book', 'Actions'
      ],
      Adventure: [
        'Name', 'Email', 'Phone', 'Country','Message', 'Preferred Month', 'Preferred Year', 'Option', 'Participants', 'Book Whole Boat', 'Submitted At', 'Mode of Book', 'Actions'
      ],
      Contact: [
        'Name', 'Email', 'Message', 'Submitted At', 'Mode of Book', 'Actions'
      ]
    };

    const headersToShow = (() => {
      const base = Array.isArray(headers[effectiveTab]) ? [...headers[effectiveTab]] : [];
      if (tab === 'Package' && packageSubTab === 'Accommodation') {
        return base.map(h => (h === 'Room Name' ? 'Package Name' : h));
      }
      if (tab === 'Package' && packageSubTab === 'Activity') {
        return base.map(h => (h === 'Activity' ? 'Package Name' : h));
      }
      if (tab === 'Package' && packageSubTab === 'Adventure') {
        const idx = base.indexOf('Message');
        if (idx >= 0) {
          const copy = [...base];
          copy.splice(idx + 1, 0, 'Package Name');
          return copy;
        }
      }
      return base;
    })();

    const listToRender = showArchived ? archivedInquiries : activeInquiries;
    return (
      <div>
        {packageSubTabs}
        <div className="flex items-center justify-between mb-3 sticky top-0 bg-white z-30" style={{ paddingTop: 8 }}>
          <div className="text-sm text-gray-700">Showing: <strong>{showArchived ? 'Archived' : 'Active'}</strong> — {listToRender.length} / {filteredInquiries.length}</div>
          <div>
            <button
              onClick={() => setShowArchived(!showArchived)}
              className={`px-3 py-1 rounded-xl text-sm ${showArchived ? 'bg-gray-200' : 'bg-[#074a5b] text-white'}`}
            >
              {showArchived ? 'Show Active' : `Show Archived (${archivedInquiries.length})`}
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white rounded-2xl shadow-lg table-fixed font-sans">
          <thead>
            <tr className="bg-[#074a5b] text-white">
              {headersToShow.map((header) => (
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
            {listToRender.map((inquiry) => {
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
                  <td key={rowId+"-adults"} className="hidden" />,
                  <td key={rowId+"-children"} className="hidden" />,
                  <td key={rowId+"-infants"} className="hidden" />,
                  <td key={rowId+"-from"} className="hidden" />,
                  <td key={rowId+"-to"} className="hidden" />
                );
              }
              cells.push(
                <td key={rowId+"-message"} className="px-4 py-2 text-gray-600 truncate min-w-[120px] max-w-[200px] font-sans">{inquiry.message || 'N/A'}</td>
              );
              if (effectiveTab === 'Package') {
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
                  <td key={rowId+"-from"} className="px-4 py-2 text-gray-600 min-w-[100px] max-w-[120px] font-sans">{parseDate(inquiry.from_date)}</td>,
                  <td key={rowId+"-to"} className="px-4 py-2 text-gray-600 min-w-[100px] max-w-[120px] font-sans">{parseDate(inquiry.to_date)}</td>,
                  <td key={rowId+"-title"} className="px-4 py-2 text-gray-600 truncate min-w-[100px] max-w-[150px] font-sans">{inquiry.title || 'N/A'}</td>
                );
              } else if (effectiveTab === 'Activity') {
                // Activity: show only the activity title 
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
                  <td key={rowId+"-title"} className="px-4 py-2 text-gray-600 truncate min-w-[100px] max-w-[150px] font-sans">{(inquiry.entityType === 'Package') ? (inquiry.title || 'N/A') : (inquiry.title || 'N/A')}</td>
                );
              } else if (effectiveTab === 'Accommodation') {
                // Accommodation: from/to, number_of_rooms, divers_*, non_divers_*, selectedActivities, resortName, roomName
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
                const activities = Array.isArray(getField(inquiry, 'selectedActivities')) ? getField(inquiry, 'selectedActivities').join(', ') : (getField(inquiry, 'selectedActivities') || 'N/A');
                cells.push(
                  <td key={rowId+"-from"} className="px-4 py-2 text-gray-600 min-w-[100px] max-w-[120px] font-sans">{parseDate(getField(inquiry, 'from_date'))}</td>,
                  <td key={rowId+"-to"} className="px-4 py-2 text-gray-600 min-w-[100px] max-w-[120px] font-sans">{parseDate(getField(inquiry, 'to_date'))}</td>,
                  <td key={rowId+"-numrooms"} className="px-4 py-2 text-gray-600 min-w-[80px] max-w-[100px] font-sans">{getField(inquiry, 'number_of_rooms') ?? 'N/A'}</td>,
                  <td key={rowId+"-divers_adults"} className="px-4 py-2 text-gray-600 min-w-[80px] font-sans">{getField(inquiry, 'divers_adults') ?? 'N/A'}</td>,
                  <td key={rowId+"-divers_children"} className="px-4 py-2 text-gray-600 min-w-[80px] font-sans">{getField(inquiry, 'divers_children') ?? 'N/A'}</td>,
                  <td key={rowId+"-non_divers_adults"} className="px-4 py-2 text-gray-600 min-w-[80px] font-sans">{getField(inquiry, 'non_divers_adults') ?? getField(inquiry, 'nondivers_adults') ?? 'N/A'}</td>,
                  <td key={rowId+"-non_divers_children"} className="px-4 py-2 text-gray-600 min-w-[80px] font-sans">{getField(inquiry, 'non_divers_children') ?? getField(inquiry, 'nondivers_children') ?? 'N/A'}</td>,
                  <td key={rowId+"-non_divers_infants"} className="px-4 py-2 text-gray-600 min-w-[80px] font-sans">{getField(inquiry, 'non_divers_infants') ?? getField(inquiry, 'nondivers_infants') ?? 'N/A'}</td>,
                  <td key={rowId+"-selacts"} className="px-4 py-2 text-gray-600 truncate min-w-[120px] max-w-[200px] font-sans">{activities}</td>,
                  <td key={rowId+"-resort"} className="px-4 py-2 text-gray-600 truncate min-w-[100px] max-w-[150px] font-sans">{getField(inquiry, 'resortName') || 'N/A'}</td>,
                  <td key={rowId+"-room"} className="px-4 py-2 text-gray-600 truncate min-w-[100px] max-w-[150px] font-sans">{(inquiry.entityType === 'Package') ? (getField(inquiry, 'title') || getField(inquiry, 'roomName') || 'N/A') : (getField(inquiry, 'roomName') || 'N/A')}</td>
                );
              } else if (effectiveTab === 'Adventure') {
                // Adventure: preferredMonth, preferredYear, adventureOption, participants, bookWholeBoat
                const optArr = Array.isArray(getField(inquiry, 'adventureOptions')) ? getField(inquiry, 'adventureOptions') : (getField(inquiry, 'adventureOption') ? [getField(inquiry, 'adventureOption')] : []);
                const optionsDisplay = optArr.length ? optArr.join(', ') : 'N/A';
                const pbo = Array.isArray(getField(inquiry, 'participantsByOption')) ? getField(inquiry, 'participantsByOption') : null;
                let participantsSummary = 'N/A';
                if (pbo && pbo.length) {
                  participantsSummary = pbo.map(g => `${g.option}: ${Array.isArray(g.participants) ? g.participants.map(p=>p.name).filter(Boolean).join(', ') || (g.participants.length+' participant(s)') : '0'}`).join(' | ');
                } else {
                  const flat = Array.isArray(getField(inquiry, 'participants')) ? getField(inquiry, 'participants').map(p => p.name || '').filter(Boolean) : [];
                  participantsSummary = flat.length ? flat.join(', ') : 'N/A';
                }
                if (tab === 'Package' && packageSubTab === 'Adventure') {
                  cells.push(
                    <td key={rowId+"-pkgname"} className="px-4 py-2 text-gray-600 truncate min-w-[120px] max-w-[180px] font-sans">{inquiry.title || 'N/A'}</td>,
                    <td key={rowId+"-prefMonth"} className="px-4 py-2 text-gray-600 min-w-[100px] max-w-[140px] font-sans">{getField(inquiry, 'preferredMonth') || 'N/A'}</td>,
                    <td key={rowId+"-prefYear"} className="px-4 py-2 text-gray-600 min-w-[80px] max-w-[100px] font-sans">{getField(inquiry, 'preferredYear') || 'N/A'}</td>,
                    <td key={rowId+"-option"} className="px-4 py-2 text-gray-600 min-w-[100px] max-w-[140px] font-sans">{optionsDisplay}</td>,
                    <td key={rowId+"-participants"} className="px-4 py-2 text-gray-600 truncate min-w-[140px] max-w-[220px] font-sans">{participantsSummary}</td>,
                    <td key={rowId+"-bookWhole"} className="px-4 py-2 text-gray-600 min-w-[80px] max-w-[100px] font-sans">{getField(inquiry, 'bookWholeBoat') ? 'Yes' : 'No'}</td>
                  );
                } else {
                  cells.push(
                    <td key={rowId+"-prefMonth"} className="px-4 py-2 text-gray-600 min-w-[100px] max-w-[140px] font-sans">{getField(inquiry, 'preferredMonth') || 'N/A'}</td>,
                    <td key={rowId+"-prefYear"} className="px-4 py-2 text-gray-600 min-w-[80px] max-w-[100px] font-sans">{getField(inquiry, 'preferredYear') || 'N/A'}</td>,
                    <td key={rowId+"-option"} className="px-4 py-2 text-gray-600 min-w-[100px] max-w-[140px] font-sans">{optionsDisplay}</td>,
                    <td key={rowId+"-participants"} className="px-4 py-2 text-gray-600 truncate min-w-[140px] max-w-[220px] font-sans">{participantsSummary}</td>,
                    <td key={rowId+"-bookWhole"} className="px-4 py-2 text-gray-600 min-w-[80px] max-w-[100px] font-sans">{getField(inquiry, 'bookWholeBoat') ? 'Yes' : 'No'}</td>
                  );
                }
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
                <td key={rowId+"-submitted"} className="px-4 py-2 text-gray-600 min-w-[100px] max-w-[120px] font-sans">{parseDate(getField(inquiry, 'submitted_at'))}</td>,
                <td key={rowId+"-mode"} className="px-4 py-2 text-gray-600 min-w-[100px] max-w-[120px] font-sans">{getField(inquiry, 'buttonType') === 'bookNow' ? 'Email' : getField(inquiry, 'buttonType') === 'whatsapp' ? 'WhatsApp' : 'N/A'}</td>,
                <td key={rowId+"-actions"} className="px-4 py-2 flex gap-2 min-w-[200px]">
                  <button
                    onClick={() => setViewDetailsModal({ isOpen: true, inquiry })}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-xl text-sm transition-all duration-300"
                    style={{ fontFamily: "'Comic Sans MS', 'Comic Neue'" }}
                  >
                    View
                  </button>
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
                    onClick={() => handleViewReply(inquiry)}
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
        onClose={() => setViewReplyModal({ isOpen: false, inquiry: null })}
        inquiry={viewReplyModal.inquiry}
      />
      <DetailsModal
        isOpen={viewDetailsModal.isOpen}
        onClose={() => setViewDetailsModal({ isOpen: false, inquiry: null })}
        inquiry={viewDetailsModal.inquiry}
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
                  {displayTabLabel(tab)} Inquiries
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
            activeTab === 'Newsletter' ? (
              <NewsletterManagement />
            ) : (
              renderTable(activeTab)
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default InquiryManagement;
