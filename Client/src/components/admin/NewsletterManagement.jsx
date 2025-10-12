import React, { useState, useEffect, useMemo } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import {
  Users, Mail, Send, Calendar, Tag, List, BarChart3, Settings,
  Plus, Trash2, Edit2, Search, Filter, Download, Upload, Eye,
  Copy, Clock, ChevronDown, ChevronRight, Star, Target, Zap
} from 'lucide-react';
import { API_BASE_URL } from '../apiConfig';

const languages = [
  { code: 'de', name: 'German' },
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'it', name: 'Italian' },
  { code: 'fr', name: 'French' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'ru', name: 'Russian' },
];

const formatLocalDatetimeInput = (date) => {
  if (!date || !(date instanceof Date)) return '';
  const pad = (n) => n.toString().padStart(2, '0');
  const y = date.getFullYear();
  const m = pad(date.getMonth() + 1);
  const d = pad(date.getDate());
  const hh = pad(date.getHours());
  const mm = pad(date.getMinutes());
  return `${y}-${m}-${d}T${hh}:${mm}`;
};

const NewsletterManagement = () => {
  const [activeTab, setActiveTab] = useState('subscribers');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [selectedSubscribers, setSelectedSubscribers] = useState([]);

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 4000);
  };

  const languages = [
  { code: 'de', name: 'German' },
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'it', name: 'Italian' },
  { code: 'fr', name: 'French' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'ru', name: 'Russian' },
];

  const tabs = [
    { id: 'subscribers', label: 'Subscribers', icon: Users },
    { id: 'campaigns', label: 'Campaigns', icon: Mail },
    { id: 'lists', label: 'Lists', icon: List },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#074a5b] mb-2">Newsletter Management</h1>
          <p className="text-gray-600">Manage subscribers, campaigns</p>
        </div>

        {message.text && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' :
            message.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' :
            'bg-blue-50 text-blue-700 border border-blue-200'
          }`}>
            {message.text}
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex overflow-x-auto">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                      activeTab === tab.id
                        ? 'border-[#1e809b] text-[#1e809b]'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon size={18} />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          {activeTab === 'subscribers' && <SubscribersTab showMessage={showMessage} selectedSubscribers={selectedSubscribers} setSelectedSubscribers={setSelectedSubscribers} />}
          {activeTab === 'campaigns' && <CampaignsTab showMessage={showMessage} selectedSubscribers={selectedSubscribers} setSelectedSubscribers={setSelectedSubscribers} />}
          {activeTab === 'lists' && <ListsTab showMessage={showMessage} />}
        </div>
      </div>
    </div>
  );
};

// Quill toolbar
const quillModules = {
  toolbar: [
    [{ header: [1, 2, 3, 4, 5, 6, false] }, { font: [] }],
    [{ size: ['small', false, 'large', 'huge'] }],
    ['bold', 'italic', 'underline', 'strike', 'blockquote'],
    [{ list: 'ordered' }, { list: 'bullet' }, { indent: '-1' }, { indent: '+1' }],
  [{ color: [] }, { background: [] }],
  [{ align: [] }],
  ['link'],
    ['clean']
  ],
  clipboard: { matchVisual: false }
};

const quillFormats = [
  'header', 'font', 'size', 'bold', 'italic', 'underline', 'strike', 'blockquote',
  'list', 'bullet', 'indent', 'link', 'color', 'background', 'align'
];

const transformQuillAlignToInline = (html) => {
  if (!html) return html;
  try {
    const parser = new DOMParser();
    const d = parser.parseFromString(html, 'text/html');
    const els = d.querySelectorAll('[class]');
    els.forEach(n => {
      const cls = (n.getAttribute('class') || '').split(/\s+/);
      for (const c of cls) {
        if (/^ql-align-/.test(c)) {
          const align = c.replace('ql-align-', '');
          const prev = n.getAttribute('style') || '';
          n.setAttribute('style', `${prev}${prev && prev.trim().slice(-1) !== ';' ? ';' : ''}text-align:${align};`);
        }
      }
    });
    return d.body.innerHTML;
  } catch (e) {
    return html;
  }
};


const SubscribersTab = ({ showMessage, selectedSubscribers, setSelectedSubscribers }) => {
  const [subscribers, setSubscribers] = useState([]);
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [languageFilter, setLanguageFilter] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showAddToListModal, setShowAddToListModal] = useState(false);
  const [addAllMode, setAddAllMode] = useState(false);
  const [pendingListId, setPendingListId] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');

  const [formData, setFormData] = useState({
    email: '',
    language: 'en',
  });

  useEffect(() => {
    fetchSubscribers();
    fetchLists();
  }, [statusFilter, sortBy, sortOrder, languageFilter]);

  const fetchLists = async () => {
    try {
      const resp = await fetch(`${API_BASE_URL}/newsletter/admin/lists`);
      if (!resp.ok) return;
      const { lists } = await resp.json();
      setLists(lists || []);
    } catch (err) {
      console.error('Failed to load lists', err);
    }
  };

  // estimate recipients for a campaign object
  const computeEstimated = (campaign) => {
    try {
      if (!campaign) return 0;
      if (campaign.status === 'sent') return campaign.recipients_count || 0;
      const r = campaign.recipients;
      if (!r || !r.type || r.type === 'all') return totalSubscribers || 0;
      if (r.type === 'custom') return Array.isArray(r.customEmails) ? r.customEmails.length : 0;
      if (r.type === 'lists') {
        const unique = new Set();
        let sumUnpop = 0;
        if (Array.isArray(r.listIds)) {
          for (const lid of r.listIds) {
            const listObj = lists.find(l => String(l._id) === String(lid));
            if (!listObj) continue;
            if (Array.isArray(listObj.subscribers) && listObj.subscribers.length > 0) {
              listObj.subscribers.forEach(s => unique.add(String(s._id || s)));
            } else if (typeof listObj.subscriber_count === 'number') {
              sumUnpop += listObj.subscriber_count;
            }
          }
        }
        return unique.size + sumUnpop;
      }
      return 0;
    } catch (e) { return 0; }
  };

  const estimateForSelection = (type = recipientsType, listIds = selectedListIds, emails = customEmails) => {
    if (type === 'all') return totalSubscribers || 0;
    if (type === 'custom') return (emails || '').split(/[\n,\s]+/).filter(Boolean).length;
    if (type === 'lists') {
      const unique = new Set();
      let sumUnpop = 0;
      for (const lid of (listIds || [])) {
        const listObj = lists.find(l => String(l._id) === String(lid));
        if (!listObj) continue;
        if (Array.isArray(listObj.subscribers) && listObj.subscribers.length > 0) {
          listObj.subscribers.forEach(s => unique.add(String(s._id || s)));
        } else if (typeof listObj.subscriber_count === 'number') {
          sumUnpop += listObj.subscriber_count;
        }
      }
      return unique.size + sumUnpop;
    }
    return 0;
  };

  const fetchSubscribers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter && statusFilter !== 'all') params.set('status', statusFilter);
      if (languageFilter) params.set('language', languageFilter);
      const url = `${API_BASE_URL}/newsletter/admin/subscribers` + (params.toString() ? `?${params.toString()}` : '');
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch subscribers');
      const { subscribers } = await response.json();
      setSubscribers(subscribers || []);
    } catch (error) {
      console.error('Error fetching subscribers:', error);
      showMessage('error', 'Failed to load subscribers');
    } finally {
      setLoading(false);
    }
  };

  const addSubscriber = async () => {
    if (!formData.email || !formData.email.includes('@')) {
      showMessage('error', 'Please enter a valid email');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/newsletter/admin/subscribers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!response.ok) {
        const { message } = await response.json();
        showMessage('error', message || 'Failed to add subscriber');
        return;
      }
      showMessage('success', 'Subscriber added successfully');
      setShowAddModal(false);
      setFormData({
        email: '',
        language: 'en',
      });
      fetchSubscribers();
    } catch (error) {
      console.error('Error adding subscriber:', error);
      showMessage('error', 'Failed to add subscriber');
    }
  };

  const deleteSubscriber = async (id) => {
    if (!window.confirm('Are you sure you want to delete this subscriber?')) return;

    try {
      const extractId = (v) => {
        if (!v && v !== 0) return '';
        if (typeof v === 'string') return v;
        if (typeof v === 'object') {
          if (v.$oid) return String(v.$oid);
          if (v._id) return extractId(v._id);
          if (v.id) return String(v.id);
          try {
            const s = v.toString();
            const m = s && s.match && s.match(/([0-9a-fA-F]{24})/);
            if (m) return m[1];
          } catch (e) { }
        }
        try { return String(v); } catch (e) { return ''; }
      };

      const rawId = extractId(id);
      if (!rawId) {
        showMessage('error', 'Invalid subscriber id');
        console.error('deleteSubscriber: could not extract id from', id);
        return;
      }
      const encodedId = encodeURIComponent(rawId);
      const response = await fetch(`${API_BASE_URL}/newsletter/admin/subscribers/${encodedId}`, {
        method: 'DELETE',
        headers: { 'Accept': 'application/json' },
      });

      if (!response.ok) {
        let serverMsg = '';
        try {
          const data = await response.json();
          serverMsg = data && data.message ? data.message : '';
        } catch (e) {
          serverMsg = await response.text().catch(() => '');
        }
        if (response.status === 404) {
          throw new Error(serverMsg || 'Subscriber not found');
        }
        throw new Error(serverMsg || `Failed to delete subscriber (status ${response.status})`);
      }

      showMessage('success', 'Subscriber deleted');
      fetchSubscribers();
    } catch (error) {
      console.error('Error deleting subscriber:', error);
      const msg = (error && error.message) ? error.message : 'Failed to delete subscriber';
      showMessage('error', msg);
    }
  };

  const bulkUpdateStatus = async (status) => {
    if (selectedSubscribers.length === 0) {
      showMessage('error', 'Please select subscribers first');
      return;
    }

    try {
      for (const id of selectedSubscribers) {
        const subscriber = subscribers.find(s => s._id === id);
        if (!subscriber) continue;
        const endpoint = status === 'subscribed' ? `${API_BASE_URL}/newsletter/subscribe` : `${API_BASE_URL}/newsletter/unsubscribe`;
        await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: subscriber.email }),
        });
      }
      showMessage('success', `Updated ${selectedSubscribers.length} subscribers`);
      setSelectedSubscribers([]);
      fetchSubscribers();
    } catch (error) {
      console.error('Error updating subscribers:', error);
      showMessage('error', 'Failed to update subscribers');
    }
  };

  const exportSubscribers = () => {
    try {
      const subscribersToExport = selectedSubscribers.length > 0
        ? subscribers.filter(s => selectedSubscribers.includes(s._id))
        : subscribers;

      const csv = [
        ['Email', 'Status', 'Language', 'Created At'].join(','),
        ...subscribersToExport.map(s => [
          s.email,
          s.status,
          s.language,
          s.createdAt ? new Date(s.createdAt).toLocaleDateString() : 'N/A'
        ].join(','))
      ].join('\n');

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `subscribers_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      showMessage('success', 'Subscribers exported');
    } catch (error) {
      console.error('Error exporting:', error);
      showMessage('error', 'Failed to export subscribers');
    }
  };

  const importSubscribers = async (csvText) => {
    try {
      const lines = csvText.split('\n');
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      const emailIndex = headers.indexOf('email');

      if (emailIndex === -1) {
        showMessage('error', 'CSV must contain an "email" column');
        return;
      }

      const languageIndex = headers.indexOf('language');

      const subscribersToImport = [];

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        if (values[emailIndex] && values[emailIndex].includes('@')) {
          subscribersToImport.push({
            email: values[emailIndex],
            language: languageIndex !== -1 ? values[languageIndex] : 'en',
          });
        }
      }

      if (subscribersToImport.length === 0) {
        showMessage('error', 'No valid emails found in CSV');
        return;
      }

      let successCount = 0;
      for (const sub of subscribersToImport) {
        const response = await fetch(`${API_BASE_URL}/newsletter/admin/subscribers`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(sub),
        });
        if (response.ok) successCount++;
      }

      showMessage('success', `Successfully imported ${successCount} subscribers`);
      setShowImportModal(false);
      fetchSubscribers();
    } catch (error) {
      console.error('Error importing:', error);
      showMessage('error', 'Failed to import subscribers');
    }
  };

  const addSelectedToList = async (listId) => {
    if (selectedSubscribers.length === 0) { showMessage('error', 'No subscribers selected'); return; }
    try {
      const resp = await fetch(`${API_BASE_URL}/newsletter/admin/lists/${listId}/add`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ subscriberIds: selectedSubscribers })
      });
      if (!resp.ok) throw new Error('Failed to add');
      showMessage('success', 'Added to list');
      setSelectedSubscribers([]);
      setShowAddToListModal(false);
      fetchLists();
    } catch (err) { console.error(err); showMessage('error', 'Failed to add to list'); }
  };

  const addAllToList = async (listId) => {
    try {
      const resp = await fetch(`${API_BASE_URL}/newsletter/admin/subscribers`);
      if (!resp.ok) throw new Error('Failed to fetch subscribers');
      const { subscribers: allSubs } = await resp.json();
      const ids = allSubs.map(s => s._id);
      const addResp = await fetch(`${API_BASE_URL}/newsletter/admin/lists/${listId}/add`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ subscriberIds: ids }) });
      if (!addResp.ok) throw new Error('Failed to add');
      showMessage('success', `Added ${ids.length} subscribers to list`);
      setShowAddToListModal(false);
      window.__add_all_to_list = false;
      fetchLists();
    } catch (err) { console.error(err); showMessage('error','Failed to add all to list'); window.__add_all_to_list=false; }
  };

  const filteredSubscribers = subscribers.filter(s => {
    const matchesEmail = s.email && s.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
    // Normalize language code for comparison: prefer s.language, fallback to s.preferred_language or empty
    const lang = (s.language || s.preferred_language || '').toString().toLowerCase();
    const matchesLanguage = !languageFilter || (lang && lang === languageFilter.toString().toLowerCase());
    return matchesEmail && matchesStatus && matchesLanguage;
  });

  const stats = {
    total: subscribers.length,
    subscribed: subscribers.filter(s => s.status === 'subscribed').length,
    unsubscribed: subscribers.filter(s => s.status === 'unsubscribed').length,
  };

  return (
    <div>
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
          <div className="text-sm text-blue-600 mb-1">Total Subscribers</div>
          <div className="text-2xl font-bold text-blue-900">{stats.total}</div>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
          <div className="text-sm text-green-600 mb-1">Subscribed</div>
          <div className="text-2xl font-bold text-green-900">{stats.subscribed}</div>
        </div>
        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-4 rounded-lg border border-yellow-200">
          <div className="text-sm text-yellow-600 mb-1">Unsubscribed</div>
          <div className="text-2xl font-bold text-yellow-900">{stats.unsubscribed}</div>
        </div>
      </div>

  <div className="flex flex-wrap gap-3 mb-6">
        <div className="flex-1 min-w-[300px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search subscribers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e809b] focus:border-transparent"
            />
          </div>
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e809b]"
        >
          <option value="all">All Status</option>
          <option value="subscribed">Subscribed</option>
          <option value="unsubscribed">Unsubscribed</option>
        </select>

        <select
          value={languageFilter}
          onChange={(e) => setLanguageFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e809b]"
        >
          <option value="">All languages</option>
          {languages.map(l => (<option key={l.code} value={l.code}>{l.name}</option>))}
        </select>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#1e809b] text-white rounded-lg hover:bg-[#166a82] transition-colors"
        >
          <Plus size={18} />
          Add Subscriber
        </button>

        <button
          onClick={() => setShowImportModal(true)}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <Upload size={18} />
          Import CSV
        </button>

        <button
          onClick={() => {
            if (selectedSubscribers.length === 0) { showMessage('error', 'Please select subscribers to add to a list'); return; }
            setAddAllMode(false);
            setPendingListId('');
            setShowAddToListModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <Plus size={18} />
          Add to List
        </button>

        <button
          onClick={() => {
            setAddAllMode(true);
            setPendingListId('');
            setShowAddToListModal(true);
            window.__add_all_to_list = true;
          }}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <Plus size={18} />
          Add All to List
        </button>

        <button
          onClick={exportSubscribers}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <Download size={18} />
          Export
        </button>
      </div>

      {selectedSubscribers.length > 0 && (
        <div className="flex items-center gap-3 mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <span className="text-sm text-blue-900">{selectedSubscribers.length} selected</span>
          <button
            onClick={() => bulkUpdateStatus('subscribed')}
            className="text-sm px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Mark Subscribed
          </button>
          <button
            onClick={() => bulkUpdateStatus('unsubscribed')}
            className="text-sm px-3 py-1 bg-yellow-600 text-white rounded hover:bg-yellow-700"
          >
            Unsubscribe
          </button>
            <button
              onClick={() => setSelectedSubscribers([])}
              className="text-sm px-3 py-1 border border-gray-300 rounded hover:bg-white"
            >
              Clear Selection
            </button>
        </div>
      )}

      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedSubscribers(filteredSubscribers.map(s => s._id));
                      } else {
                        setSelectedSubscribers([]);
                      }
                    }}
                    checked={selectedSubscribers.length === filteredSubscribers.length && filteredSubscribers.length > 0}
                    className="rounded"
                  />
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Email</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Language</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Created</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-4 py-8 text-center text-gray-500">
                    Loading subscribers...
                  </td>
                </tr>
              ) : filteredSubscribers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-4 py-8 text-center text-gray-500">
                    No subscribers found
                  </td>
                </tr>
              ) : (
                filteredSubscribers.map((subscriber) => (
                  <tr key={subscriber._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedSubscribers.includes(subscriber._id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedSubscribers([...selectedSubscribers, subscriber._id]);
                          } else {
                            setSelectedSubscribers(selectedSubscribers.filter(id => id !== subscriber._id));
                          }
                        }}
                        className="rounded"
                      />
                    </td>
                    <td className="px-4 py-3 text-sm">{subscriber.email}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        subscriber.status === 'subscribed' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {subscriber.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm uppercase">{subscriber.language}</td>
                   <td className="px-4 py-3 text-sm text-gray-500">
                    {subscriber.createdAt && subscriber.createdAt.$date
                        ? new Date(subscriber.createdAt.$date).toLocaleDateString()
                        : 'N/A'}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => deleteSubscriber(subscriber._id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showAddModal && (
        <Modal onClose={() => setShowAddModal(false)} title="Add Subscriber">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e809b]"
                placeholder="email@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
              <select
                value={formData.language}
                onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e809b]"
              >
                <option value="en">English</option>
                <option value="de">German</option>
                <option value="fr">French</option>
                <option value="es">Spanish</option>
                <option value="it">Italian</option>
              </select>
            </div>
            <div className="flex gap-3 pt-4">
              <button
                onClick={addSubscriber}
                className="flex-1 px-4 py-2 bg-[#1e809b] text-white rounded-lg hover:bg-[#166a82]"
              >
                Add Subscriber
              </button>
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </Modal>
      )}

      {showImportModal && (
        <Modal onClose={() => setShowImportModal(false)} title="Import Subscribers">
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Upload a CSV file with columns: email,language (language optional)
            </p>
            <input
              type="file"
              accept=".csv"
              onChange={(e) => {
                const file = e.target.files[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = (event) => {
                    importSubscribers(event.target.result);
                  };
                  reader.readAsText(file);
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
        </Modal>
      )}

      {showAddToListModal && (
        <Modal onClose={() => { setShowAddToListModal(false); setAddAllMode(false); setPendingListId(''); window.__add_all_to_list=false; }} title={addAllMode ? "Add all subscribers to list" : "Add selected to list"}>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">Choose a list to add {addAllMode ? 'all subscribers' : 'the selected subscribers'} to:</p>
            <div>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                value={pendingListId}
                onChange={(e) => setPendingListId(e.target.value)}
              >
                <option value="">-- Select list --</option>
                {lists.map(l => (<option key={l._id} value={l._id}>{l.name} ({l.subscribers?.length||0})</option>))}
              </select>
            </div>
            <div className="flex gap-3 pt-4">
              <button
                onClick={async () => {
                  if (!pendingListId) { showMessage('error', 'Please choose a list'); return; }
                  try {
                    if (addAllMode) {
                      await addAllToList(pendingListId);
                    } else {
                      await addSelectedToList(pendingListId);
                    }
                    setShowAddToListModal(false);
                    setAddAllMode(false);
                    setPendingListId('');
                    window.__add_all_to_list = false;
                  } catch (err) {
                    console.error('Add to list failed', err);
                    showMessage('error', 'Failed to add to list');
                  }
                }}
                className="px-4 py-2 bg-[#1e809b] text-white rounded-lg hover:bg-[#166a82]"
              >
                OK
              </button>
              <button onClick={() => { setShowAddToListModal(false); setAddAllMode(false); setPendingListId(''); window.__add_all_to_list=false; }} className="px-4 py-2 border border-gray-300 rounded-lg">Cancel</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

const CampaignsTab = ({ showMessage, selectedSubscribers }) => {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [body, setBody] = useState('');
  const [footerPreview, setFooterPreview] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [lists, setLists] = useState([]);
  const [showSendModal, setShowSendModal] = useState(false);
  const [sendingCampaign, setSendingCampaign] = useState(null);
  const [sendRecipientsType, setSendRecipientsType] = useState('all');
  const [sendSelectedListIds, setSendSelectedListIds] = useState([]);
  const [sendCustomEmails, setSendCustomEmails] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    subject: '',
    scheduled_at: ''
  });

  const [titleAlign, setTitleAlign] = useState('left');
  const [recipientsType, setRecipientsType] = useState('all');
  const [selectedListIds, setSelectedListIds] = useState([]);
  const [customEmails, setCustomEmails] = useState('');
  const [totalSubscribers, setTotalSubscribers] = useState(0);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  useEffect(() => { fetchLists(); }, []);
  useEffect(() => { fetchSubscriberCount(); }, []);

  useEffect(() => {
    if (showCreateModal) fetchFooterPreview();
  }, [showCreateModal]);

  useEffect(() => {
    if (showEditModal) fetchFooterPreview();
  }, [showEditModal]);

  const fetchFooterPreview = async () => {
    try {
      const resp = await fetch(`${API_BASE_URL}/newsletter/admin/footer`);
      if (!resp.ok) throw new Error('Failed to fetch footer');
      const { footer } = await resp.json();
      setFooterPreview(footer || '');
    } catch (err) {
      console.error('Footer preview fetch failed', err);
    }
  };

  const fetchLists = async () => {
    try {
      const resp = await fetch(`${API_BASE_URL}/newsletter/admin/lists`);
      if (!resp.ok) return;
      const data = await resp.json();
      setLists(data.lists || []);
    } catch (err) {
      console.error('Failed to load lists', err);
    }
  };

  const fetchSubscriberCount = async () => {
    try {
      const resp = await fetch(`${API_BASE_URL}/newsletter/admin/subscribers`);
      if (!resp.ok) return;
      const data = await resp.json();
      setTotalSubscribers(data.subscribers.filter(s => s.status === 'subscribed').length || 0);
    } catch (err) {
      console.error('Failed to load subscriber count', err);
    }
  };

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/newsletter/admin/campaigns`);
      if (!response.ok) throw new Error('Failed to fetch campaigns');
      const { campaigns } = await response.json();
      setCampaigns(campaigns || []);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      showMessage('error', 'Failed to load campaigns');
    } finally {
      setLoading(false);
    }
  };

  // derive display campaigns with estimated recipient counts
  const displayCampaigns = useMemo(() => {
    return (campaigns || []).map(c => {
      try {
        const r = c.recipients || { type: 'all' };
        let estimated = 0;
        if (r.type === 'all') {
          estimated = totalSubscribers || 0;
        } else if (r.type === 'lists') {
          const ids = (r.listIds || []).map(String);
          estimated = (lists || []).filter(l => ids.includes(String(l._id))).reduce((acc, l) => acc + (Array.isArray(l.subscribers) ? l.subscribers.length : (l.subscriber_count || 0)), 0);
        } else if (r.type === 'custom') {
          estimated = (r.customEmails || []).filter(Boolean).length;
        } else {
          estimated = totalSubscribers || 0;
        }
        return { ...c, estimated_recipients: estimated };
      } catch (e) {
        return { ...c, estimated_recipient: 0 };
      }
    });
  }, [campaigns, lists, totalSubscribers]);

  const createCampaign = async () => {
    if (!formData.title || !formData.subject || !body) {
      showMessage('error', 'Please fill in required fields');
      return;
    }
    setLoading(true);
    try {
  const payload = { ...formData, body, recipients: { type: recipientsType }, titleAlign };
  if (recipientsType === 'lists') payload.recipients.listIds = selectedListIds;
  if (recipientsType === 'custom') payload.recipients.customEmails = customEmails.split(/[,\n\s]+/).filter(Boolean);

      const response = await fetch(`${API_BASE_URL}/newsletter/admin/campaigns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const txt = await response.text();
        throw new Error(txt || 'Failed to create campaign');
      }
    showMessage('success', 'Campaign created successfully');
    setShowCreateModal(false);
  setTitleAlign('left');
      setFormData({ title: '', subject: '', scheduled_at: '' });
      setBody('');
      // reset recipient inputs
      setRecipientsType('all'); setSelectedListIds([]); setCustomEmails('');
      fetchCampaigns();
    } catch (error) {
      console.error('Error creating campaign:', error);
      showMessage('error', 'Failed to create campaign');
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (campaign) => {
    setEditingCampaign(campaign);
    setFormData({
      title: campaign.title || '',
      subject: campaign.subject || '',
      scheduled_at: campaign.scheduled_at ? formatLocalDatetimeInput(new Date(campaign.scheduled_at)) : ''
    });
    setBody(campaign.body || '');
    setTitleAlign(campaign.titleAlign || 'left');
    // set recipient defaults if present on campaign
    const r = campaign.recipients || { type: 'all' };
    setRecipientsType(r.type || 'all');
    setSelectedListIds(r.listIds || []);
    setCustomEmails((r.customEmails && r.customEmails.join('\n')) || '');
    setShowEditModal(true);
  };

  const updateCampaign = async () => {
    if (!editingCampaign) return;
    if (!formData.title || !formData.subject || !body) {
      showMessage('error', 'Please fill in required fields');
      return;
    }
    setUpdating(true);
    try {
  const payload = { ...formData, body, recipients: { type: recipientsType }, titleAlign };
  if (recipientsType === 'lists') payload.recipients.listIds = selectedListIds;
  if (recipientsType === 'custom') payload.recipients.customEmails = customEmails.split(/[,\n\s]+/).filter(Boolean);

      const response = await fetch(`${API_BASE_URL}/newsletter/admin/campaigns/${editingCampaign._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const txt = await response.text();
        throw new Error(txt || 'Failed to update campaign');
      }
      showMessage('success', 'Campaign updated successfully');
      setShowEditModal(false);
      setEditingCampaign(null);
      setFormData({ title: '', subject: '', scheduled_at: '' });
      setBody('');
      setRecipientsType('all'); setSelectedListIds([]); setCustomEmails('');
  setTitleAlign('left');
      fetchCampaigns();
    } catch (error) {
      console.error('Error updating campaign:', error);
      showMessage('error', 'Failed to update campaign');
    } finally {
      setUpdating(false);
    }
  };

  // send campaign helper
  const sendCampaign = async (campaignId, options = {}) => {
    try {
      const resp = await fetch(`${API_BASE_URL}/newsletter/admin/campaigns/${campaignId}/send`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(options)
      });
      if (!resp.ok) {
        const txt = await resp.text();
        throw new Error(txt || 'Send failed');
      }
      return true;
    } catch (err) {
      console.error('Send campaign failed', err);
      throw err;
    }
  };

  const openSendModal = (campaign) => {
    setSendingCampaign(campaign);
    setSendRecipientsType('all');
    setSendSelectedListIds([]);
    setSendCustomEmails('');
    setShowSendModal(true);
  };

  const performSend = async () => {
    if (!sendingCampaign) return;
    try {
  const options = {};
  if (sendRecipientsType === 'lists') options.listIds = sendSelectedListIds;
  if (sendRecipientsType === 'custom') options.customEmails = sendCustomEmails.split(/[,\n\s]+/).filter(Boolean);

      await sendCampaign(sendingCampaign._id, options);
      showMessage('success', 'Campaign send requested');
      setShowSendModal(false);
    } catch (err) {
      showMessage('error', 'Failed to send campaign');
    }
  };

  const deleteCampaign = async (id) => {
    if (!window.confirm('Delete this campaign?')) return;
    try {
      const resp = await fetch(`${API_BASE_URL}/newsletter/admin/campaigns/${id}`, { method: 'DELETE' });
      if (!resp.ok) throw new Error('Failed to delete');
      showMessage('success', 'Campaign deleted');
      fetchCampaigns();
    } catch (err) {
      console.error(err);
      showMessage('error', 'Failed to delete campaign');
    }
  };

  const duplicateCampaign = async (campaign) => {
    try {
      const payload = {
        title: `Copy of ${campaign.title}`,
        subject: campaign.subject,
        body: campaign.body,
        recipients: campaign.recipients || { type: 'all' },
        titleAlign: campaign.titleAlign || 'left'
      };
      const resp = await fetch(`${API_BASE_URL}/newsletter/admin/campaigns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!resp.ok) {
        const txt = await resp.text();
        throw new Error(txt || 'Failed to duplicate');
      }
      showMessage('success', 'Campaign duplicated');
      fetchCampaigns();
    } catch (err) {
      console.error(err);
      showMessage('error', 'Failed to duplicate campaign');
    }
  };

  const stats = campaigns.reduce((acc, c) => ({
    total: acc.total + 1,
    draft: acc.draft + (c.status === 'draft' ? 1 : 0),
    scheduled: acc.scheduled + (c.status === 'scheduled' ? 1 : 0),
    sent: acc.sent + (c.status === 'sent' ? 1 : 0)
  }), { total: 0, draft: 0, scheduled: 0, sent: 0 });

  return (
    <div>
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
          <div className="text-sm text-blue-600 mb-1">Total Campaigns</div>
          <div className="text-2xl font-bold text-blue-900">{stats.total}</div>
        </div>
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-lg border border-gray-200">
          <div className="text-sm text-gray-600 mb-1">Draft</div>
          <div className="text-2xl font-bold text-gray-900">{stats.draft}</div>
        </div>
        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-4 rounded-lg border border-yellow-200">
          <div className="text-sm text-yellow-600 mb-1">Scheduled</div>
          <div className="text-2xl font-bold text-yellow-900">{stats.scheduled}</div>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
          <div className="text-sm text-green-600 mb-1">Sent</div>
          <div className="text-2xl font-bold text-green-900">{stats.sent}</div>
        </div>
      </div>

      <div className="flex justify-between items-center mb-6">
        <div className="text-lg font-semibold text-gray-900">All Campaigns</div>
        <button
          onClick={() => { setTitleAlign('left'); setShowCreateModal(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-[#1e809b] text-white rounded-lg hover:bg-[#166a82]"
        >
          <Plus size={18} />
          Create Campaign
        </button>
      </div>

      <div className="grid gap-4">
        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading campaigns...</div>
        ) : campaigns.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No campaigns yet. Create your first campaign!
          </div>
        ) : (
          displayCampaigns.map((campaign) => (
            <div key={campaign._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{campaign.title}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      campaign.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                      campaign.status === 'scheduled' ? 'bg-yellow-100 text-yellow-800' :
                      campaign.status === 'sent' ? 'bg-green-100 text-green-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {campaign.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{campaign.subject}</p>
                  <div className="flex items-center gap-6 text-sm text-gray-500">
                    <span>Recipients: {campaign.status === 'sent' ? campaign.recipients_count : (campaign.estimated_recipients || 0)}</span>
                    <span>Created: {new Date(campaign.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {campaign.status !== 'sent' && (
                    <>
                      <button
                        onClick={async () => {
                          try {
                            if (selectedSubscribers && selectedSubscribers.length > 0) {
                              const useSelected = window.confirm(`Send to selected ${selectedSubscribers.length} subscribers? OK = selected, Cancel = all`);
                              if (useSelected) {
                                await sendCampaign(campaign._id, { toSelected: true, selectedIds: selectedSubscribers });
                                return;
                              }
                            }
                            await sendCampaign(campaign._id);
                          } catch (e) {
                            console.error(e);
                          }
                        }}
                        className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                      >
                        <Send size={16} />
                        Send Now
                      </button>
                      <button
                        onClick={async () => {
                          const test = prompt('Send test to which email?');
                          if (!test) return;
                          try {
                            const resp = await fetch(`${API_BASE_URL}/newsletter/admin/campaigns/${campaign._id}/send`, {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ testEmail: test })
                            });
                            if (!resp.ok) throw new Error('Test send failed');
                            showMessage('success', 'Test email sent');
                          } catch (err) {
                            console.error(err);
                            showMessage('error', 'Failed to send test');
                          }
                        }}
                        className="flex items-center gap-2 px-3 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 text-sm ml-2"
                      >
                        Test
                      </button>
                      <button
                        onClick={() => openEditModal(campaign)}
                        className="flex items-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm ml-2"
                      >
                        Edit
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => duplicateCampaign(campaign)}
                    className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                  >
                    <Copy size={16} />
                    Duplicate
                  </button>
                  <button
                    onClick={() => deleteCampaign(campaign._id)}
                    className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                  >
                    <Trash2 size={16} />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {showCreateModal && (
        <Modal onClose={() => setShowCreateModal(false)} title="Create Campaign" wide>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Campaign Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e809b]"
                placeholder="Monthly Newsletter - January 2024"
              />
            </div>
             <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Campaign Title Alignment</label>
              <select value={titleAlign} onChange={(e) => setTitleAlign(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                <option value="left">Left</option>
                <option value="center">Center</option>
                <option value="right">Right</option>
                <option value="justify">Justify</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Subject *</label>
              <input
                type="text"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e809b]"
                placeholder="Your monthly update is here!"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Body *</label>
              <div style={{ height: '400px' }}>
                <ReactQuill theme="snow" value={body} onChange={setBody} modules={quillModules} formats={quillFormats} style={{ height: '350px' }} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Recipients</label>
              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input type="radio" name="recipients" checked={recipientsType === 'all'} onChange={() => setRecipientsType('all')} />
                  <span className="text-sm">All subscribers ({totalSubscribers})</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="radio" name="recipients" checked={recipientsType === 'lists'} onChange={() => setRecipientsType('lists')} />
                  <span className="text-sm">Lists</span>
                </label>
                {recipientsType === 'lists' && (
                  <div className="mt-2">
                    <select multiple value={selectedListIds} onChange={(e) => setSelectedListIds(Array.from(e.target.selectedOptions).map(o => o.value))} className="w-full border rounded p-2">
                      {lists.map(l => (<option key={l._id} value={l._id}>{l.name} ({l.subscribers?.length||l.subscriber_count||0})</option>))}
                    </select>
                    <div className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple lists</div>
                  </div>
                )}
                <label className="flex items-center gap-2">
                  <input type="radio" name="recipients" checked={recipientsType === 'custom'} onChange={() => setRecipientsType('custom')} />
                  <span className="text-sm">Custom emails</span>
                </label>
                {recipientsType === 'custom' && (
                  <textarea value={customEmails} onChange={(e) => setCustomEmails(e.target.value)} rows={3} className="w-full border rounded p-2" placeholder="test@example.com\nother@example.com" />
                )}
              </div>
            </div>

            {footerPreview && (
              <div className="mt-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">Footer Preview</label>
                <div className="flex justify-center">
                  <div className="w-full max-w-2xl border rounded shadow-sm overflow-hidden bg-white">
                    <div className="bg-[#f7fafc] px-4 py-2 border-b text-sm text-gray-600">Email preview</div>
                    <div className="p-6" style={{ minHeight: 80 }}>
                      <div style={{ textAlign: titleAlign }} className="prose max-w-none text-sm text-gray-700"><h1 style={{ margin: 0, fontSize: '20px' }}>{formData.title || '(title)'}</h1></div>
                      <div className="mt-4 prose max-w-none text-sm text-gray-700" dangerouslySetInnerHTML={{ __html: transformQuillAlignToInline(body) || '<em>(email body)</em>' }} />
                    </div>
                    <div className="bg-white border-t p-4">
                      <div className="mt-3 p-4 bg-gray-50 rounded">
                        <div className="prose text-sm text-gray-700" dangerouslySetInnerHTML={{ __html: transformQuillAlignToInline(footerPreview) }} />
                      </div>
                      {/* unsubscribe button on its own line */}
                      <div className="py-3 text-center bg-white">
                        <a href="#" className="inline-block px-4 py-2 bg-red-600 text-white rounded-md font-semibold text-sm">Unsubscribe</a>
                      </div>
                      <div className="bg-gray-100 p-3 text-center text-xs text-gray-600">
                        <p className="m-0">Automated notification from Traveliccted Admin System</p>
                        <p className="m-1">© 2025 Traveliccted. All rights reserved.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Schedule (optional)</label>
              <input
                type="datetime-local"
                value={formData.scheduled_at}
                onChange={(e) => setFormData({ ...formData, scheduled_at: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e809b]"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={createCampaign}
                className="flex-1 px-4 py-2 bg-[#1e809b] text-white rounded-lg hover:bg-[#166a82]"
              >
                Create Campaign
              </button>
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </Modal>
      )}

      {showEditModal && (
        <Modal onClose={() => setShowEditModal(false)} title="Edit Campaign" wide>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Campaign Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e809b]"
                placeholder="Monthly Newsletter - January 2024"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Subject *</label>
              <input
                type="text"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e809b]"
                placeholder="Your monthly update is here!"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Body *</label>
              <div style={{ height: '400px' }}>
                <ReactQuill theme="snow" value={body} onChange={setBody} modules={quillModules} formats={quillFormats} style={{ height: '350px' }} />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Recipients</label>
              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input type="radio" name="recipients_edit" checked={recipientsType === 'all'} onChange={() => setRecipientsType('all')} />
                  <span className="text-sm">All subscribers ({totalSubscribers})</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="radio" name="recipients_edit" checked={recipientsType === 'lists'} onChange={() => setRecipientsType('lists')} />
                  <span className="text-sm">Lists</span>
                </label>
                {recipientsType === 'lists' && (
                  <div className="mt-2">
                    <select multiple value={selectedListIds} onChange={(e) => setSelectedListIds(Array.from(e.target.selectedOptions).map(o => o.value))} className="w-full border rounded p-2">
                      {lists.map(l => (<option key={l._id} value={l._id}>{l.name} ({l.subscribers?.length||l.subscriber_count||0})</option>))}
                    </select>
                    <div className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple lists</div>
                  </div>
                )}
                <label className="flex items-center gap-2">
                  <input type="radio" name="recipients_edit" checked={recipientsType === 'custom'} onChange={() => setRecipientsType('custom')} />
                  <span className="text-sm">Custom emails</span>
                </label>
                {recipientsType === 'custom' && (
                  <textarea value={customEmails} onChange={(e) => setCustomEmails(e.target.value)} rows={3} className="w-full border rounded p-2" placeholder="test@example.com\nother@example.com" />
                )}
              </div>
            </div>

            {footerPreview && (
              <div className="mt-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">Footer Preview</label>
                <div className="flex justify-center">
                  <div className="w-full max-w-2xl border rounded shadow-sm overflow-hidden bg-white">
                    <div className="bg-[#f7fafc] px-4 py-2 border-b text-sm text-gray-600">Email preview</div>
                    <div className="p-6" style={{ minHeight: 80 }}>
                      <div style={{ textAlign: titleAlign }} className="prose max-w-none text-sm text-gray-700"><h1 style={{ margin: 0, fontSize: '20px' }}>{formData.title || '(title)'}</h1></div>
                      <div className="mt-4 prose max-w-none text-sm text-gray-700" dangerouslySetInnerHTML={{ __html: transformQuillAlignToInline(body) || '<em>(email body)</em>' }} />
                    </div>
                    <div className="bg-white border-t p-4">
                      <div className="text-sm text-gray-600">{/* footer content rendered below */}</div>
                      <div className="mt-3 p-4 bg-gray-50 rounded">
                        <div className="prose text-sm text-gray-700" dangerouslySetInnerHTML={{ __html: transformQuillAlignToInline(footerPreview) }} />
                        <div className="mt-3 text-right">
                          <a href="#" className="inline-block px-3 py-1 text-xs font-medium bg-white border rounded text-gray-700">Unsubscribe</a>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Schedule (optional)</label>
              <input
                type="datetime-local"
                value={formData.scheduled_at}
                onChange={(e) => setFormData({ ...formData, scheduled_at: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e809b]"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={updateCampaign}
                disabled={updating}
                className="flex-1 px-4 py-2 bg-[#1e809b] text-white rounded-lg hover:bg-[#166a82]"
              >
                Update Campaign
              </button>
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </Modal>
      )}

      {showSendModal && sendingCampaign && (
        <Modal onClose={() => setShowSendModal(false)} title={`Send — ${sendingCampaign.title}`} wide>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Recipients for send</label>
              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input type="radio" name="send_recipients" checked={sendRecipientsType === 'all'} onChange={() => setSendRecipientsType('all')} />
                  <span className="text-sm">All subscribers ({totalSubscribers})</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="radio" name="send_recipients" checked={sendRecipientsType === 'lists'} onChange={() => setSendRecipientsType('lists')} />
                  <span className="text-sm">Lists</span>
                </label>
                {sendRecipientsType === 'lists' && (
                  <div className="mt-2">
                    <select multiple value={sendSelectedListIds} onChange={(e) => setSendSelectedListIds(Array.from(e.target.selectedOptions).map(o => o.value))} className="w-full border rounded p-2">
                      {lists.map(l => (<option key={l._id} value={l._id}>{l.name} ({l.subscribers?.length||l.subscriber_count||0})</option>))}
                    </select>
                  </div>
                )}
                <label className="flex items-center gap-2">
                  <input type="radio" name="send_recipients" checked={sendRecipientsType === 'custom'} onChange={() => setSendRecipientsType('custom')} />
                  <span className="text-sm">Custom emails (one per line or comma-separated)</span>
                </label>
                {sendRecipientsType === 'custom' && (
                  <textarea value={sendCustomEmails} onChange={(e) => setSendCustomEmails(e.target.value)} rows={3} className="w-full border rounded p-2" placeholder="test@example.com\nother@example.com" />
                )}
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button onClick={performSend} className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg">Send Now</button>
              <button onClick={() => setShowSendModal(false)} className="px-4 py-2 border rounded">Cancel</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};


const ListsTab = ({ showMessage }) => {
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showManageModal, setShowManageModal] = useState(false);
  const [currentList, setCurrentList] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '', is_public: false });
  const [allSubscribers, setAllSubscribers] = useState([]);
  const [manageSelectedIds, setManageSelectedIds] = useState([]);
  const [removeSelectedIds, setRemoveSelectedIds] = useState([]);
  const currentMemberIds = useMemo(() => {
    try {
      if (!currentList || !Array.isArray(currentList.subscribers)) return new Set();
      return new Set(currentList.subscribers.map(cs => {
        if (!cs && cs !== 0) return null;
        if (typeof cs === 'string') return String(cs);
        if (cs._id && typeof cs._id === 'object' && cs._id.$oid) return String(cs._id.$oid);
        return String(cs._id || cs.id || cs);
      }).filter(Boolean));
    } catch (e) { return new Set(); }
  }, [currentList]);

  useEffect(() => { fetchLists(); }, []);

  const fetchLists = async () => {
    setLoading(true);
    try {
      console.debug('[Newsletter] fetchLists: requesting /api/newsletter/admin/lists');
      const resp = await fetch(`${API_BASE_URL}/newsletter/admin/lists`);
      if (!resp.ok) throw new Error('Failed to load lists');
      const data = await resp.json();
      console.debug('[Newsletter] fetchLists: response', data && data.lists ? data.lists.length : 'no-data');
      // ensure subscriber_count and created_at fallbacks
      const normalized = (data.lists || []).map(l => ({
        ...l,
        // normalize subscriber shapes to objects with _id and optional email for consistent client usage
        subscribers: Array.isArray(l.subscribers) ? l.subscribers.map(s => {
          if (!s) return null;
          if (typeof s === 'string') return { _id: s, email: '' };
          if (s._id && typeof s._id === 'object' && s._id.$oid) return { _id: s._id.$oid, email: s.email || '' };
          return { _id: s._id || s.id || s, email: s.email || '' };
        }).filter(Boolean) : [],
        subscriber_count: Array.isArray(l.subscribers) ? l.subscribers.length : (l.subscriber_count || 0),
        created_at: l.createdAt || l.created_at || new Date().toISOString()
      }));
      setLists(normalized);
    } catch (err) {
      console.error('Error fetching lists:', err);
      showMessage('error', 'Failed to load lists');
    } finally { setLoading(false); }
  };

  const fetchAllSubscribers = async () => {
    try {
      console.debug('[Newsletter] fetchAllSubscribers: requesting subscribed subscribers');
      const resp = await fetch(`${API_BASE_URL}/newsletter/admin/subscribers?status=subscribed`);
      if (!resp.ok) throw new Error('Failed to load subscribers');
      const { subscribers } = await resp.json();
      console.debug('[Newsletter] fetchAllSubscribers: got', Array.isArray(subscribers) ? subscribers.length : 0);
      const normalized = (subscribers || []).map(s => {
        if (!s) return null;
        const id = (typeof s === 'string') ? s : (s._id && typeof s._id === 'object' && s._id.$oid ? s._id.$oid : (s._id || s.id || s));
        const email = (typeof s === 'string') ? '' : (s.email || s.emailAddress || '');
        const language = (typeof s === 'object' && s.language) ? s.language : '';
        const status = (typeof s === 'object' && s.status) ? s.status : '';
        return { _id: String(id), email, language, status };
      }).filter(Boolean);
      setAllSubscribers(normalized);
    } catch (err) {
      console.error('Failed to fetch subscribers', err);
    }
  };

  const createList = async () => {
    if (!formData.name) return showMessage('error', 'Please enter a list name');
    try {
      const resp = await fetch(`${API_BASE_URL}/newsletter/admin/lists`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData)
      });
      if (!resp.ok) {
        const { message } = await resp.json();
        return showMessage('error', message || 'Failed to create list');
      }
      showMessage('success', 'List created');
      setShowCreateModal(false);
      setFormData({ name: '', description: '', is_public: false });
      fetchLists();
    } catch (err) {
      console.error('Error creating list', err);
      showMessage('error', 'Failed to create list');
    }
  };

  const updateList = async () => {
    if (!formData.name) return showMessage('error', 'Please enter a list name');
    try {
      const resp = await fetch(`${API_BASE_URL}/newsletter/admin/lists/${currentList._id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData)
      });
      if (!resp.ok) {
        const { message } = await resp.json();
        return showMessage('error', message || 'Failed to update list');
      }
      showMessage('success', 'List updated');
      setShowEditModal(false);
      setCurrentList(null);
      setFormData({ name: '', description: '', is_public: false });
      fetchLists();
    } catch (err) {
      console.error('Error updating list', err);
      showMessage('error', 'Failed to update list');
    }
  };

  const openEditModal = (list) => {
    setCurrentList(list);
    setFormData({ name: list.name || '', description: list.description || '', is_public: !!list.is_public });
    setShowEditModal(true);
  };

  const deleteList = async (id) => {
    if (!window.confirm('Delete this list?')) return;
    try {
      const resp = await fetch(`${API_BASE_URL}/newsletter/admin/lists/${id}`, { method: 'DELETE' });
      if (!resp.ok) throw new Error('Failed to delete list');
      showMessage('success', 'List deleted');
      fetchLists();
    } catch (err) {
      console.error('Error deleting list', err);
      showMessage('error', 'Failed to delete list');
    }
  };

  const openManageModal = async (list) => {
    setCurrentList(list);
    setManageSelectedIds([]);
    setRemoveSelectedIds([]);
    console.debug('[Newsletter] openManageModal: list ->', list && list._id);
    await fetchAllSubscribers();
    // normalize current list subscribers now to objects {_id,email}
    try {
      const normalizedSubs = (list.subscribers || []).map(s => {
        if (!s) return null;
        if (typeof s === 'string') return { _id: s, email: '' };
        if (s._id && typeof s._id === 'object' && s._id.$oid) return { _id: s._id.$oid, email: s.email || '' };
        return { _id: s._id || s.id || s, email: s.email || '' };
      }).filter(Boolean);
      setCurrentList({ ...list, subscribers: normalizedSubs });
    } catch (e) { console.warn('openManageModal: failed to normalize list subscribers', e); }
    setShowManageModal(true);
  };

  const addMembers = async () => {
    if (!manageSelectedIds || manageSelectedIds.length === 0) return showMessage('error', 'Select subscribers to add');
    try {
      const toAdd = manageSelectedIds.map(String);
      console.debug('[Newsletter] addMembers: adding', toAdd.length, 'to', currentList && currentList._id);
      try {
        setCurrentList(prev => {
          if (!prev) return prev;
          const existing = new Set((prev.subscribers || []).map(s => (typeof s === 'string' ? String(s) : String(s._id || s))));
          const merged = [ ...(prev.subscribers || []) ];
          for (const id of toAdd) {
            if (!existing.has(String(id))) {
              const lookup = allSubscribers.find(a => String(a._id) === String(id));
              merged.push(lookup ? { _id: String(id), email: lookup.email || '' } : { _id: String(id), email: '' });
              existing.add(String(id));
            }
          }
          return { ...prev, subscribers: merged };
        });
      } catch (e) { console.warn('Optimistic addMembers failed', e); }

      const resp = await fetch(`${API_BASE_URL}/newsletter/admin/lists/${currentList._id}/add`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ subscriberIds: toAdd })
      });
      if (!resp.ok) {
        const { message } = await resp.json().catch(() => ({}));
        await fetchLists();
        await fetchAllSubscribers();
        return showMessage('error', message || 'Failed to add members');
      }
      const data = await resp.json().catch(() => ({}));
      console.debug('[Newsletter] addMembers: response', data && data.list ? 'list-returned' : 'no-list');
      await fetchLists();
      await fetchAllSubscribers();
      if (data && data.list) {
        // normalize list subscribers
        const nl = data.list;
        const normalized = (nl.subscribers || []).map(s => {
          if (!s) return null;
          if (typeof s === 'string') return { _id: String(s), email: '' };
          if (s._id && typeof s._id === 'object' && s._id.$oid) return { _id: String(s._id.$oid), email: s.email || '' };
          return { _id: String(s._id || s.id || s), email: s.email || '' };
        }).filter(Boolean);
        setCurrentList(prev => ({ ...prev, ...nl, subscribers: normalized }));
      } else {
        // try to find updated list in the fetched lists
        try {
          const latest = (await (async () => { const r = await fetch(`${API_BASE_URL}/newsletter/admin/lists`); if (!r.ok) return null; const d = await r.json(); return d.lists || []; })()) || [];
          const found = latest.find(l => String(l._id) === String(currentList._id));
          if (found) {
            // normalize found subscribers
            const normalized = (found.subscribers || []).map(s => {
              if (!s) return null;
              if (typeof s === 'string') return { _id: String(s), email: '' };
              if (s._id && typeof s._id === 'object' && s._id.$oid) return { _id: String(s._id.$oid), email: s.email || '' };
              return { _id: String(s._id || s.id || s), email: s.email || '' };
            }).filter(Boolean);
            setCurrentList(prev => ({ ...prev, ...found, subscribers: normalized }));
          }
        } catch (e) {}
      }
      showMessage('success', 'Members added');
      setManageSelectedIds([]);
    } catch (err) {
      console.error('Error adding members', err);
      try { await fetchLists(); await fetchAllSubscribers(); } catch (e) {}
      showMessage('error', 'Failed to add members');
    }
  };

  const removeMembers = async () => {
    if (!removeSelectedIds || removeSelectedIds.length === 0) return showMessage('error', 'Select subscribers to remove');
    try {
      const toRemove = removeSelectedIds.map(String);
      console.debug('[Newsletter] removeMembers: removing', toRemove.length, 'from', currentList && currentList._id);
      // remove members from UI
      try {
        setCurrentList(prev => {
          if (!prev) return prev;
          const removedSet = new Set(toRemove.map(String));
          const filtered = (prev.subscribers || []).filter(s => {
            const sid = (typeof s === 'string') ? String(s) : String(s._id || s.id || s);
            return !removedSet.has(sid);
          });
          return { ...prev, subscribers: filtered };
        });
      } catch (e) { console.warn('Optimistic removeMembers failed', e); }

      const resp = await fetch(`${API_BASE_URL}/newsletter/admin/lists/${currentList._id}/remove`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ subscriberIds: toRemove })
      });
      if (!resp.ok) {
        const { message } = await resp.json().catch(() => ({}));
        await fetchLists();
        await fetchAllSubscribers();
        return showMessage('error', message || 'Failed to remove members');
      }
      const data = await resp.json().catch(() => ({}));
      console.debug('[Newsletter] removeMembers: response', data && data.list ? 'list-returned' : 'no-list');
      showMessage('success', 'Members removed');
      // Refresh lists and subscribers and update currentList 
      await fetchLists();
      await fetchAllSubscribers();
      if (data && data.list) {
        const nl = data.list;
        const normalized = (nl.subscribers || []).map(s => {
          if (!s) return null;
          if (typeof s === 'string') return { _id: String(s), email: '' };
          if (s._id && typeof s._id === 'object' && s._id.$oid) return { _id: String(s._id.$oid), email: s.email || '' };
          return { _id: String(s._id || s.id || s), email: s.email || '' };
        }).filter(Boolean);
        setCurrentList(prev => ({ ...prev, ...nl, subscribers: normalized }));
      }
      else {
        try {
          const latestResp = await fetch(`${API_BASE_URL}/newsletter/admin/lists`);
          if (latestResp.ok) {
            const latestData = await latestResp.json();
            const found = (latestData.lists || []).find(l => String(l._id) === String(currentList._id));
            if (found) {
              const normalized = (found.subscribers || []).map(s => {
                if (!s) return null;
                if (typeof s === 'string') return { _id: String(s), email: '' };
                if (s._id && typeof s._id === 'object' && s._id.$oid) return { _id: String(s._id.$oid), email: s.email || '' };
                return { _id: String(s._id || s.id || s), email: s.email || '' };
              }).filter(Boolean);
              setCurrentList(prev => ({ ...prev, ...found, subscribers: normalized }));
            }
          }
        } catch (e) {}
      }
      setRemoveSelectedIds([]);
    } catch (err) {
      console.error('Error removing members', err);
      showMessage('error', 'Failed to remove members');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="text-lg font-semibold text-gray-900">Subscriber Lists</div>
        <button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2 px-4 py-2 bg-[#1e809b] text-white rounded-lg hover:bg-[#166a82]">
          <Plus size={18} />
          Create List
        </button>
      </div>

      <div className="grid gap-4">
        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading lists...</div>
        ) : lists.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No lists yet. Create your first list to organize subscribers!</div>
        ) : (
          lists.map((list) => (
            <div key={list._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{list.name}</h3>
                    {list.is_public && (<span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">Public</span>)}
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{list.description || 'No description'}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1"><Users size={16} />{list.subscriber_count || 0} subscribers</span>
                    <span>Created: {new Date(list.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => openEditModal(list)} className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">Edit</button>
                  <button onClick={() => openManageModal(list)} className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">Manage Members</button>
                  <button onClick={() => deleteList(list._id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {showCreateModal && (
        <Modal onClose={() => setShowCreateModal(false)} title="Create List">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">List Name *</label>
              <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e809b]" placeholder="VIP Customers" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e809b]" rows={3} placeholder="High-value customers who receive exclusive offers" />
            </div>

            <div className="flex items-center gap-2">
              <input type="checkbox" id="is_public" checked={formData.is_public} onChange={(e) => setFormData({ ...formData, is_public: e.target.checked })} className="rounded" />
              <label htmlFor="is_public" className="text-sm text-gray-700">Allow public subscription</label>
            </div>

            <div className="flex gap-3 pt-4">
              <button onClick={createList} className="flex-1 px-4 py-2 bg-[#1e809b] text-white rounded-lg hover:bg-[#166a82]">Create List</button>
              <button onClick={() => setShowCreateModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
            </div>
          </div>
        </Modal>
      )}

      {showEditModal && (
        <Modal onClose={() => setShowEditModal(false)} title="Edit List">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">List Name *</label>
              <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e809b]" placeholder="VIP Customers" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e809b]" rows={3} placeholder="High-value customers who receive exclusive offers" />
            </div>

            <div className="flex items-center gap-2">
              <input type="checkbox" id="is_public" checked={formData.is_public} onChange={(e) => setFormData({ ...formData, is_public: e.target.checked })} className="rounded" />
              <label htmlFor="is_public" className="text-sm text-gray-700">Allow public subscription</label>
            </div>

            <div className="flex gap-3 pt-4">
              <button onClick={updateList} className="flex-1 px-4 py-2 bg-[#1e809b] text-white rounded-lg hover:bg-[#166a82]">Update List</button>
              <button onClick={() => setShowEditModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
            </div>
          </div>
        </Modal>
      )}

      {showManageModal && currentList && (
        <Modal onClose={() => setShowManageModal(false)} title={`Manage Members — ${currentList.name}`} wide>
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Current members ({(currentList.subscribers || []).length})</h4>
              <div className="max-h-40 overflow-y-auto border border-gray-100 rounded-lg p-3">
                {currentList.subscribers && currentList.subscribers.length > 0 ? (
                  currentList.subscribers.map(s => {
                    const sid = (typeof s === 'string') ? s : (s._id && typeof s._id === 'object' && s._id.$oid ? s._id.$oid : (s._id || s.id || s));
                    const sidStr = String(sid);
                    const email = (typeof s === 'object' && s.email) ? s.email : (allSubscribers.find(a => String(a._id) === sidStr)?.email || '');
                    return (
                      <label key={sidStr} className="flex items-center gap-3 py-1">
                        <input type="checkbox" checked={removeSelectedIds.includes(sidStr)} onChange={(e) => {
                          setRemoveSelectedIds(prev => e.target.checked ? [...prev, sidStr] : prev.filter(id => id !== sidStr));
                        }} />
                        <span className="text-sm">{email || sidStr}</span>
                      </label>
                    );
                  })
                ) : (
                  <div className="text-sm text-gray-500">No members in this list</div>
                )}
              </div>
              <div className="flex gap-2 mt-3">
                <button onClick={removeMembers} className="px-3 py-2 bg-red-600 text-white rounded">Remove selected</button>
                <button onClick={() => setRemoveSelectedIds([])} className="px-3 py-2 border rounded">Clear</button>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Add subscribers</h4>
              <div className="text-sm text-gray-500 mb-2">Select from existing subscribers</div>
              <div className="max-h-52 overflow-y-auto border border-gray-100 rounded-lg p-3">
                {allSubscribers.length === 0 ? (
                  <div className="text-sm text-gray-500">Loading subscribers...</div>
                ) : (
                  allSubscribers.filter(s => !currentMemberIds.has(String(s._id))).map(s => (
                    <label key={s._id} className="flex items-center gap-3 py-1">
                      <input type="checkbox" checked={manageSelectedIds.includes(String(s._id))} onChange={(e) => {
                        const sid = String(s._id);
                        setManageSelectedIds(prev => e.target.checked ? [...prev, sid] : prev.filter(id => id !== sid));
                      }} />
                      <span className="text-sm">{s.email}</span>
                    </label>
                  ))
                )}
              </div>
              <div className="flex gap-2 mt-3">
                <button onClick={addMembers} className="px-3 py-2 bg-[#1e809b] text-white rounded">Add selected</button>
                <button onClick={() => setManageSelectedIds([])} className="px-3 py-2 border rounded">Clear</button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

const Modal = ({ children, onClose, title, wide = false }) => {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className={`bg-white rounded-lg shadow-xl ${wide ? 'max-w-4xl' : 'max-w-md'} w-full max-h-[90vh] overflow-y-auto`} onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};

export default NewsletterManagement;
