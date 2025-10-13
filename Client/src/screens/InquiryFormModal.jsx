import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Calendar, Users, MapPin, Phone, Mail, MessageSquare, Minus, Plus, ChevronLeft, ChevronRight, MessageCircle } from 'lucide-react';
import { API_BASE_URL } from '../components/apiConfig';

const InquiryFormModal = ({ isOpen, onClose, item, onSubmit, language, buttonType, resortName, roomName, isPackage, packageInquiryFormType }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone_number: '',
    message: '',
    subscribe_newsletter: true,
    from_date: '',
    to_date: '',
    adults: null,
    children: null,
    infants: null,
    number_of_rooms: null,
    // hotel/resort
    divers_adults: null,
    divers_children: null,
    nondivers_adults: null,
    nondivers_children: null,
    nondivers_infants: null,
    selectedActivities: [],
    // adventure
    preferredMonth: '',
    preferredYear: '',
    adventureOption: '', 
    participants: [], 
    bookWholeBoat: false,
    country: '',
    preferred_language: language || (languages && languages[0] && languages[0].code) || 'en',
  });
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isSelecting, setIsSelecting] = useState(false);
  const [dragStart, setDragStart] = useState(null);
  const [dragEnd, setDragEnd] = useState(null);
  const modalRef = useRef(null);
  const calendarRef = useRef(null);

  const languages = [
  { code: 'de', name: 'German' },
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'it', name: 'Italian' },
  { code: 'fr', name: 'French' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'ru', name: 'Russian' },
];

  useEffect(() => {
    console.log('InquiryFormModal opened with props:', { isOpen, buttonType, item, resortName, roomName });
    if (!item) {
      console.error('item is undefined/null, inquiry submission may fail');
    }
    if (isOpen && !buttonType) {
      console.warn('buttonType is undefined/null, defaulting to bookNow');
    }

    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      } else if (calendarRef.current && !calendarRef.current.contains(event.target) && showCalendar) {
        setShowCalendar(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, buttonType, item, onClose, showCalendar]);

  const translations = {
    en: {
      bookNow: 'Per E-Mail senden',
      close: 'Schließen',
      inquiryForm: 'Anfrageformular',
      name: 'Ihr Name',
      email: 'Ihre E-Mail',
      phone: 'Telefonnummer',
      message: 'Ihre Nachricht',
      fromDate: 'Check-in Datum',
      toDate: 'Check-out Datum',
      travellers: 'Anzahl der Reisenden',
      children: 'Alter der Kinder (falls vorhanden)',
      addChild: 'Kind hinzufügen',
      removeChild: 'Kind entfernen',
      country: 'Land',
      sendWhatsApp: 'Über WhatsApp senden',
      required: 'Dieses Feld ist erforderlich',
      invalidEmail: 'Ungültige E-Mail-Adresse',
      invalidPhone: 'Ungültige Telefonnummer',
      invalidDates: 'Das Check-out-Datum muss nach dem Check-in-Datum liegen',
      expiredDates: 'Ausgewählte Daten dürfen nicht nach dem Ablaufdatum liegen',
      datePlaceholder: 'MM/DD/YYYY',
      itemMissing: 'Kein Paket oder keine Aktivität ausgewählt',
    },
  };

  const t = translations[language || 'en'];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleTravellersChange = (increment) => {
    setFormData((prev) => ({
      ...prev,
      travellers: Math.max(1, (prev.travellers ?? 0) + increment),
    }));
  };


  const handleCountChange = (field, increment) => {
    setFormData((prev) => ({
      ...prev,
      [field]: Math.max(0, (prev[field] ?? 0) + increment),
    }));
  };

  // Activities list (for hotel/resort inquiries)
  const [activities, setActivities] = useState([]);

  // Adventure helper: detect adventure type
  const isAdventure = () => {
    const tt = (item?.type || item?.entityType || '').toString().toLowerCase();
    return tt === 'adventure';
  };

  const ageCategories = [
    'Adults (12+)',
    'Children (2-11)',
    'Infants (below 2)'
  ];

  const currentYear = new Date().getFullYear();
  const yearRange = 10; 

  const addParticipant = () => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2,9)}`;
    setFormData((p) => ({
      ...p,
      participants: [...(p.participants || []), { id, name: '', gender: 'male', diverStatus: 'non-diver', ageCategory: ageCategories[0] }],
    }));
  };

  const ParticipantName = React.memo(({ id, value, onCommit }) => {
    const [localName, setLocalName] = useState(value || '');
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
      if (!isEditing) setLocalName(value || '');
    }, [value, isEditing]);

    const commit = useCallback(() => {
      if (typeof onCommit === 'function') onCommit(id, 'name', localName);
      setIsEditing(false);
    }, [id, localName, onCommit]);

    return (
      <input
        type="text"
        placeholder="Name"
        value={localName}
        onChange={(e) => setLocalName(e.target.value)}
        onFocus={() => setIsEditing(true)}
        onBlur={commit}
        className="flex-1 px-3 py-2 border rounded"
      />
    );
  });

  const updateParticipant = (id, field, value) => {
    setFormData((p) => ({
      ...p,
      participants: (p.participants || []).map((part) => part.id === id ? { ...part, [field]: value } : part),
    }));
  };

  const removeParticipant = (id) => {
    setFormData((p) => ({ ...p, participants: (p.participants || []).filter(part => part.id !== id) }));
  };

  const isHotelOrResort = () => {
    const t = (item?.type || item?.entityType || '').toString().toLowerCase();
    // treat 'accommodation' as the canonical value for hotel/resort inquiries
    return t === 'accommodation' || t === 'hotel' || t === 'resort';
  };

  const isActivity = () => {
    const tt = (item?.type || item?.entityType || '').toString().toLowerCase();
    return tt === 'activity';
  };

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/activities`);
        if (!res.ok) return;
        const data = await res.json();
        setActivities(Array.isArray(data) ? data : data.activities || []);
      } catch (err) {
        console.warn('Could not fetch activities:', err);
      }
    };

    if (isHotelOrResort()) fetchActivities();
  }, [item]);

  const toggleActivitySelection = (activityLabel) => {
    setFormData((prev) => {
      const set = new Set(prev.selectedActivities || []);
      if (set.has(activityLabel)) set.delete(activityLabel); else set.add(activityLabel);
      return { ...prev, selectedActivities: Array.from(set) };
    });
  };

  const getDaysInMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const getFirstDayOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

  // Adjusted to ensure consistent local date handling
  const formatDateForInput = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatDateForDisplay = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${month}/${day}/${year}`;
  };

  const isSameDate = (date1, date2) => {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
  };

  const isDateInRange = (date, start, end) => {
    if (!start || !end) return false;
    const startDate = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    const endDate = new Date(end.getFullYear(), end.getMonth(), end.getDate());
    const checkDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    return checkDate >= startDate && checkDate <= endDate;
  };

  const handleDateClick = (date) => {
    if (!isSelecting) {
      setDragStart(date);
      setDragEnd(null);
      setIsSelecting(true);
      setFormData((prev) => ({
        ...prev,
        from_date: formatDateForInput(date),
        to_date: '',
      }));
    } else {
      let checkoutDate = date;
      let checkinDate = dragStart;

      if (date < dragStart) {
        checkoutDate = dragStart;
        checkinDate = date;
      }

      setDragEnd(checkoutDate);
      setDragStart(checkinDate);
      setFormData((prev) => ({
        ...prev,
        from_date: formatDateForInput(checkinDate),
        to_date: formatDateForInput(checkoutDate),
      }));
      setIsSelecting(false);
      setShowCalendar(false);
    }
  };

  const handleDateHover = (date) => {
    if (isSelecting && dragStart) setDragEnd(date);
  };

  const handleCheckInClick = () => {
    setShowCalendar((prev) => !prev);
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    const days = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize to start of day
    const expiry = item?.expiryDate ? new Date(item.expiryDate) : null;

    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-9"></div>);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      date.setHours(0, 0, 0, 0); // Normalize to start of day
      const isToday = isSameDate(date, today);
      const isPast = date < today;
      const isExpired = expiry && date > expiry;
      const isSelected = (dragStart && isSameDate(date, dragStart)) || (dragEnd && isSameDate(date, dragEnd));
      const isInRange = isDateInRange(date, dragStart, dragEnd);

      days.push(
        <div
          key={day}
          className={`h-9 w-9 flex items-center justify-center text-sm cursor-pointer rounded-lg transition-all ${
            isPast || isExpired
              ? 'text-gray-300 cursor-not-allowed'
              : isSelected
              ? 'bg-[#074a5b] text-white font-semibold shadow-md'
              : isInRange
              ? 'bg-[#1e809b]/20 text-[#074a5b] font-medium'
              : isToday
              ? 'bg-[#1e809b]/30 text-[#074a5b] font-semibold border border-[#1e809b]'
              : 'hover:bg-[#1e809b]/10 text-gray-700 hover:text-[#074a5b]'
          }`}
          onClick={() => !(isPast || isExpired) && handleDateClick(date)}
          onMouseEnter={() => !(isPast || isExpired) && handleDateHover(date)}
        >
          {day}
        </div>
      );
    }

    return days;
  };

  // --- Section components ---
  const AdventureSection = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Preferred Month</label>
          <select name="preferredMonth" value={formData.preferredMonth} onChange={handleChange} className="w-full px-4 py-3 border-2 rounded-xl">
            <option value="">Select month</option>
            {Array.from({ length: 12 }).map((_, i) => {
                const monthName = new Date(0, i).toLocaleString('default', { month: 'long' });
                return <option key={i} value={monthName}>{monthName}</option>;
            })}
          </select>
          {fieldErrors.preferredMonth && <div className="mt-1 text-xs text-red-600">{fieldErrors.preferredMonth}</div>}
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Preferred Year</label>
          <select name="preferredYear" value={formData.preferredYear} onChange={handleChange} className="w-full px-4 py-3 border-2 rounded-xl">
            <option value="">Select year</option>
            {Array.from({ length: yearRange + 1 }).map((_, i) => {
                const y = currentYear + i;
                return <option key={y} value={y}>{y}</option>;
              })}
          </select>
          {fieldErrors.preferredYear && <div className="mt-1 text-xs text-red-600">{fieldErrors.preferredYear}</div>}
        </div>
      </div>

       <div className="flex items-center gap-3">
        <input id="bookWholeBoat" type="checkbox" checked={!!formData.bookWholeBoat} onChange={(e) => setFormData((p) => ({ ...p, bookWholeBoat: e.target.checked }))} />
        <label htmlFor="bookWholeBoat" className="text-sm">Need to book whole boat</label>
      </div>

      <div>
        <label className="block text-sm font-bold text-gray-700 mb-2">Select options (you may choose multiple)</label>
        <div className="flex gap-4">
          {['Shared', 'Double', 'Single'].map((opt) => (
            <label key={opt} className="flex items-center gap-2">
              <input type="checkbox" name="adventureOptions" value={opt} checked={(formData.adventureOptions || []).includes(opt)} onChange={(e) => {
                const checked = e.target.checked;
                setFormData((p) => {
                  const cur = new Set(p.adventureOptions || []);
                  if (checked) cur.add(opt); else cur.delete(opt);
                  const pbo = Array.isArray(p.participantsByOption) ? [...p.participantsByOption] : [];
                  if (checked && !pbo.find(x => x.option === opt)) pbo.push({ option: opt, participants: [] });
                  if (!checked) {
                    const idx = pbo.findIndex(x => x.option === opt);
                    if (idx !== -1) pbo.splice(idx, 1);
                  }
                  return { ...p, adventureOptions: Array.from(cur), participantsByOption: pbo };
                });
              }} />
              <span>{opt}</span>
            </label>
          ))}
        </div>
        {fieldErrors.adventureOption && <div className="mt-1 text-xs text-red-600">{fieldErrors.adventureOption}</div>}
      </div>

      <div>
        <label className="block text-sm font-bold text-gray-700 mb-2">Add Participants</label>
        <div className="space-y-4">
          {(formData.participantsByOption || []).map((group) => (
            <div key={group.option} className="p-3 border-2 rounded-xl">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-bold">{group.option}</h4>
                <button type="button" onClick={() => {
                  // remove entire group
                  setFormData((p) => ({ ...p, adventureOptions: (p.adventureOptions||[]).filter(o=>o!==group.option), participantsByOption: (p.participantsByOption||[]).filter(x=>x.option!==group.option) }));
                }} className="text-sm text-red-500">Remove option</button>
              </div>
              {(group.participants || []).map((pt, idx) => (
                <div key={pt.id || idx} className="p-3 border rounded mb-2">
                  <div className="flex gap-2 mb-2">
                    <ParticipantName id={pt.id} value={pt.name} onCommit={(id, field, value) => {
                      setFormData((p) => ({
                        ...p,
                        participantsByOption: (p.participantsByOption || []).map(g => g.option === group.option ? {
                          ...g,
                          participants: (g.participants || []).map(pp => pp.id === id ? { ...pp, [field]: value } : pp)
                        } : g)
                      }));
                    }} />
                    <select value={pt.gender || 'male'} onChange={(e) => {
                      const v = e.target.value;
                      setFormData((p) => ({ ...p, participantsByOption: (p.participantsByOption||[]).map(g => g.option === group.option ? { ...g, participants: g.participants.map((pp, i) => i === idx ? { ...pp, gender: v } : pp) } : g) }));
                    }} className="px-3 py-2 border rounded">
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                    </select>
                  </div>
                  <div className="flex gap-2 items-center">
                    <select value={pt.diverStatus || 'diver'} onChange={(e) => {
                      const v = e.target.value;
                      setFormData((p) => ({ ...p, participantsByOption: (p.participantsByOption||[]).map(g => g.option === group.option ? { ...g, participants: g.participants.map((pp, i) => i === idx ? { ...pp, diverStatus: v } : pp) } : g) }));
                    }} className="px-3 py-2 border rounded">
                      <option value="diver">Diver</option>
                      <option value="non-diver">Non-diver</option>
                    </select>
                    <select value={pt.ageCategory || ageCategories[0]} onChange={(e) => {
                      const v = e.target.value;
                      setFormData((p) => ({ ...p, participantsByOption: (p.participantsByOption||[]).map(g => g.option === group.option ? { ...g, participants: g.participants.map((pp, i) => i === idx ? { ...pp, ageCategory: v } : pp) } : g) }));
                    }} className="px-3 py-2 border rounded">
                      {ageCategories.map((ac) => <option key={ac} value={ac}>{ac}</option>)}
                    </select>
                    <button type="button" onClick={() => {
                      setFormData((p) => ({ ...p, participantsByOption: (p.participantsByOption||[]).map(g => g.option === group.option ? { ...g, participants: g.participants.filter((_, i) => i !== idx) } : g) }));
                    }} className="px-3 py-2 bg-red-100 rounded">Remove</button>
                  </div>
                </div>
              ))}
              <div>
                <button type="button" onClick={() => {
                  const newPart = { id: `p-${Date.now()}`, name: '', gender: 'male', diverStatus: 'diver', ageCategory: ageCategories[0] };
                  setFormData((p) => ({ ...p, participantsByOption: (p.participantsByOption||[]).map(g => g.option === group.option ? { ...g, participants: [...(g.participants||[]), newPart] } : g) }));
                }} className="mt-2 px-4 py-2 bg-green-100 rounded ">Add Participant</button>
              </div>
            </div>
          ))}
          {/* If no per-option participants exist, allow adding to a default group */}
          {(!(formData.participantsByOption || []).length) && (
            <div className="p-3 border-2 rounded-xl">
              <div className="text-sm text-gray-500">No options selected yet. Select one or more options above to add participants for each option.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const HotelResortSection = () => (
    <div>
      <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center">
        <Users size={18} className="mr-2" style={{ color: '#1e809b' }} />
        Number of rooms
      </label>
      <div className="flex items-center border-2 rounded-xl mb-4" style={{ borderColor: '#074a5b' }}>
        <button
          type="button"
          onClick={() => setFormData((p) => ({ ...p, number_of_rooms: Math.max(0, (p.number_of_rooms ?? 0) - 1) }))}
          className="p-4 hover:bg-[#1e809b]/10 transition-colors"
        >
          <Minus size={18} style={{ color: '#074a5b' }} />
        </button>
        <span className="flex-1 text-center py-3 text-base font-bold" style={{ color: '#074a5b' }}>
          {formData.number_of_rooms ?? 0}
        </span>
        <button
          type="button"
          onClick={() => setFormData((p) => ({ ...p, number_of_rooms: (p.number_of_rooms ?? 0) + 1 }))}
          className="p-4 hover:bg-[#1e809b]/10 transition-colors"
        >
          <Plus size={18} style={{ color: '#074a5b' }} />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="font-bold mb-2">Taucher</p>
          <label className="block text-sm font-bold text-gray-700 mb-2">Adults (12+)</label>
          <div className="flex items-center border-2 rounded-xl mb-2" style={{ borderColor: '#074a5b' }}>
            <button type="button" onClick={() => setFormData((p) => ({ ...p, divers_adults: Math.max(0, (p.divers_adults ?? 0) - 1) }))} className="p-4 hover:bg-[#1e809b]/10 transition-colors"><Minus size={18} style={{ color: '#074a5b' }} /></button>
            <span className="flex-1 text-center py-3 text-base font-bold" style={{ color: '#074a5b' }}>{formData.divers_adults ?? 0}</span>
            <button type="button" onClick={() => setFormData((p) => ({ ...p, divers_adults: (p.divers_adults ?? 0) + 1 }))} className="p-4 hover:bg-[#1e809b]/10 transition-colors"><Plus size={18} style={{ color: '#074a5b' }} /></button>
          </div>

          <label className="block text-sm font-bold text-gray-700 mb-2">Children (2-11)</label>
          <div className="flex items-center border-2 rounded-xl mb-2" style={{ borderColor: '#074a5b' }}>
            <button type="button" onClick={() => setFormData((p) => ({ ...p, divers_children: Math.max(0, (p.divers_children ?? 0) - 1) }))} className="p-4 hover:bg-[#1e809b]/10 transition-colors"><Minus size={18} style={{ color: '#074a5b' }} /></button>
            <span className="flex-1 text-center py-3 text-base font-bold" style={{ color: '#074a5b' }}>{formData.divers_children ?? 0}</span>
            <button type="button" onClick={() => setFormData((p) => ({ ...p, divers_children: (p.divers_children ?? 0) + 1 }))} className="p-4 hover:bg-[#1e809b]/10 transition-colors"><Plus size={18} style={{ color: '#074a5b' }} /></button>
          </div>
        </div>

        <div>
          <p className="font-bold mb-2">Nicht-Taucher</p>
          <label className="block text-sm font-bold text-gray-700 mb-2">Adults (12+)</label>
          <div className="flex items-center border-2 rounded-xl mb-2" style={{ borderColor: '#074a5b' }}>
            <button type="button" onClick={() => setFormData((p) => ({ ...p, nondivers_adults: Math.max(0, (p.nondivers_adults ?? 0) - 1) }))} className="p-4 hover:bg-[#1e809b]/10 transition-colors"><Minus size={18} style={{ color: '#074a5b' }} /></button>
            <span className="flex-1 text-center py-3 text-base font-bold" style={{ color: '#074a5b' }}>{formData.nondivers_adults ?? 0}</span>
            <button type="button" onClick={() => setFormData((p) => ({ ...p, nondivers_adults: (p.nondivers_adults ?? 0) + 1 }))} className="p-4 hover:bg-[#1e809b]/10 transition-colors"><Plus size={18} style={{ color: '#074a5b' }} /></button>
          </div>

          <label className="block text-sm font-bold text-gray-700 mb-2">Children (2-11)</label>
          <div className="flex items-center border-2 rounded-xl mb-2" style={{ borderColor: '#074a5b' }}>
            <button type="button" onClick={() => setFormData((p) => ({ ...p, nondivers_children: Math.max(0, (p.nondivers_children ?? 0) - 1) }))} className="p-4 hover:bg-[#1e809b]/10 transition-colors"><Minus size={18} style={{ color: '#074a5b' }} /></button>
            <span className="flex-1 text-center py-3 text-base font-bold" style={{ color: '#074a5b' }}>{formData.nondivers_children ?? 0}</span>
            <button type="button" onClick={() => setFormData((p) => ({ ...p, nondivers_children: (p.nondivers_children ?? 0) + 1 }))} className="p-4 hover:bg-[#1e809b]/10 transition-colors"><Plus size={18} style={{ color: '#074a5b' }} /></button>
          </div>

          <label className="block text-sm font-bold text-gray-700 mb-2">Infants (Below)</label>
          <div className="flex items-center border-2 rounded-xl" style={{ borderColor: '#074a5b' }}>
            <button type="button" onClick={() => setFormData((p) => ({ ...p, nondivers_infants: Math.max(0, (p.nondivers_infants ?? 0) - 1) }))} className="p-4 hover:bg-[#1e809b]/10 transition-colors"><Minus size={18} style={{ color: '#074a5b' }} /></button>
            <span className="flex-1 text-center py-3 text-base font-bold" style={{ color: '#074a5b' }}>{formData.nondivers_infants ?? 0}</span>
            <button type="button" onClick={() => setFormData((p) => ({ ...p, nondivers_infants: (p.nondivers_infants ?? 0) + 1 }))} className="p-4 hover:bg-[#1e809b]/10 transition-colors"><Plus size={18} style={{ color: '#074a5b' }} /></button>
          </div>
        </div>
      </div>

      <div className="mt-4">
        <label className="block text-sm font-bold text-gray-700 mb-2">Select Activities</label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-40 overflow-y-auto border-2 rounded-xl p-2" style={{ borderColor: '#074a5b' }}>
          {activities.length === 0 && <div className="text-sm text-gray-500">No activities available</div>}
          {activities.map((a) => (
            <label key={a._id || a.id} className="flex items-center gap-2 p-2 rounded hover:bg-[#1e809b]/10 cursor-pointer">
              <input type="checkbox" checked={(formData.selectedActivities || []).includes(a.title || a.name)} onChange={() => toggleActivitySelection(a.title || a.name)} />
              <span className="text-sm">{a.title || a.name}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );

  const DefaultTravellersSection = () => (
    <div>
      <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center">
        <Users size={18} className="mr-2" style={{ color: '#1e809b' }} />
        Number of adults (12+)
      </label>
      <div className="flex items-center border-2 rounded-xl mb-2" style={{ borderColor: '#074a5b' }}>
        <button
          type="button"
          onClick={() => handleCountChange('adults', -1)}
          className="p-4 hover:bg-[#1e809b]/10 transition-colors"
        >
          <Minus size={18} style={{ color: '#074a5b' }} />
        </button>
        <span className="flex-1 text-center py-3 text-base font-bold" style={{ color: '#074a5b' }}>
          {formData.adults ?? 0}
        </span>
        <button
          type="button"
          onClick={() => handleCountChange('adults', 1)}
          className="p-4 hover:bg-[#1e809b]/10 transition-colors"
        >
          <Plus size={18} style={{ color: '#074a5b' }} />
        </button>
      </div>
      <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center mt-4">
        <Users size={18} className="mr-2" style={{ color: '#1e809b' }} />
        Number of children (2-11)
      </label>
      <div className="flex items-center border-2 rounded-xl mb-2" style={{ borderColor: '#074a5b' }}>
        <button
          type="button"
          onClick={() => handleCountChange('children', -1)}
          className="p-4 hover:bg-[#1e809b]/10 transition-colors"
        >
          <Minus size={18} style={{ color: '#074a5b' }} />
        </button>
        <span className="flex-1 text-center py-3 text-base font-bold" style={{ color: '#074a5b' }}>
          {formData.children ?? 0}
        </span>
        <button
          type="button"
          onClick={() => handleCountChange('children', 1)}
          className="p-4 hover:bg-[#1e809b]/10 transition-colors"
        >
          <Plus size={18} style={{ color: '#074a5b' }} />
        </button>
      </div>
      <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center mt-4">
        <Users size={18} className="mr-2" style={{ color: '#1e809b' }} />
        Number of infants (below 2)
      </label>
      <div className="flex items-center border-2 rounded-xl" style={{ borderColor: '#074a5b' }}>
        <button
          type="button"
          onClick={() => handleCountChange('infants', -1)}
          className="p-4 hover:bg-[#1e809b]/10 transition-colors"
        >
          <Minus size={18} style={{ color: '#074a5b' }} />
        </button>
        <span className="flex-1 text-center py-3 text-base font-bold" style={{ color: '#074a5b' }}>
          {formData.infants ?? 0}
        </span>
        <button
          type="button"
          onClick={() => handleCountChange('infants', 1)}
          className="p-4 hover:bg-[#1e809b]/10 transition-colors"
        >
          <Plus size={18} style={{ color: '#074a5b' }} />
        </button>
      </div>
    </div>
  );

  const ActivitySection = () => null;

  const isValidInternationalPhone = (phone) => {
    return /^\+\d{8,15}$/.test(phone);
  };

  const validateForm = () => {
    const errors = {};
    if (!item) return { common: t.itemMissing };
    if (!formData.name) errors.name = t.required;
    if (!formData.email) {
      errors.email = t.required;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = t.invalidEmail;
    }
    if (!formData.phone_number) errors.phone_number = t.required;
    if (!formData.country) errors.country = t.required;
  if (formData.subscribe_newsletter && !formData.preferred_language) errors.preferred_language = 'Preferred language required';
    if (!isAdventure() && !isActivity()) {
      if (!formData.from_date) errors.from_date = t.required;
      if (!formData.to_date) errors.to_date = t.required;
    } else if (isAdventure()) {
      // for adventures require preferred month/year 
      if (!formData.preferredMonth) errors.preferredMonth = 'Preferred month required';
      if (!formData.preferredYear) errors.preferredYear = 'Preferred year required';
      if (!Array.isArray(formData.adventureOptions) || formData.adventureOptions.length === 0) errors.adventureOption = 'Select at least one option';
      const totalParticipants = (formData.participantsByOption || []).reduce((s, g) => s + ((g.participants || []).length), 0);
      if (totalParticipants === 0) errors.participants = 'Add at least one participant';
    }
    if (formData.from_date && formData.to_date && new Date(formData.to_date) <= new Date(formData.from_date)) errors.common = t.invalidDates;
    if (item?.expiryDate) {
      const expiry = new Date(item.expiryDate);
      if (formData.from_date && new Date(formData.from_date) > expiry) errors.common = t.expiredDates;
      if (formData.to_date && new Date(formData.to_date) > expiry) errors.common = t.expiredDates;
    }
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Form submission started with buttonType:', buttonType);
    const errors = validateForm();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      setError(errors.common || '');
      if (errors.common === t.expiredDates) {
        alert(`Error: ${t.expiredDates} (${item?.expiryDate ? new Date(item.expiryDate).toLocaleDateString() : 'N/A'})`);
      }
      return;
    }
    setError('');
    setLoading(true);
    try {
  let entityType = (item.entityType || (item.type || '')).toString();
  const isPackageOrigin = !!isPackage || (!!item?._id && (item.type === 'Package' || item.type === 'package' || item.type === 'packages') );
  const packageFormType = packageInquiryFormType || item?.inquiry_form_type || undefined;
      if (isPackageOrigin) {
        // Force Package entityType when modal was opened from a package listing
        entityType = 'Package';
      } else if (entityType) {
        const t = entityType.toString().toLowerCase();
        if (t === 'hotel' || t === 'resort' || t === 'accommodation') entityType = 'Accommodation';
        else if (t === 'adventure' || t === 'adventures') entityType = 'Adventure';
        else if (t === 'activity' || t === 'activities') entityType = 'Activity';
        else if (t === 'package' || t === 'packages') entityType = 'Package';
        else if (t === 'contact' || t === 'inquiry') entityType = 'Contact';
        else entityType = item.title && resortName && roomName ? 'Accommodation' : (item.title ? 'Package' : 'Activity');
      } else {
        entityType = item.title && resortName && roomName ? 'Accommodation' : (item.title ? 'Package' : 'Activity');
      }
      const title = item.title || item.name || 'Inquiry';
      // Build payload selectively per entity type and remove empty/default values
      const base = {
        name: formData.name || undefined,
        email: formData.email || undefined,
        phone_number: formData.phone_number || undefined,
        message: formData.message || undefined,
        subscribe_newsletter: typeof formData.subscribe_newsletter !== 'undefined' ? !!formData.subscribe_newsletter : undefined,
        language: formData.preferred_language || undefined,
        country: formData.country || undefined,
  entity: item._id ? { $oid: item._id } : undefined,
        entityType,
        title,
        buttonType: buttonType || 'bookNow',
      };

      const payload = { ...base };
      if (isPackageOrigin) {
        const chosenForm = (typeof packageInquiryFormType !== 'undefined' && packageInquiryFormType) || item?.inquiry_form_type || packageFormType || '';
        if (chosenForm) payload.inquiry_form_type = chosenForm;
        // If package maps to the Accommodation form, include the package's resort name in the payload
        const effectiveResortNameForPackage = resortName || item?.resort || item?.resortName || undefined;
        if (chosenForm === 'Accommodation' && effectiveResortNameForPackage) {
          payload.resortName = effectiveResortNameForPackage;
        }
      }

      const addIf = (key, value) => {
        if (value === undefined || value === null) return;
        if (Array.isArray(value) && value.length === 0) return;
        if (typeof value === 'number' && value === 0) return; // drop default zeros
        if (typeof value === 'boolean') {
          if (value) payload[key] = value;
          return;
        }
        payload[key] = value;
      };

      const effectiveFormForPayload = isPackageOrigin
        ? ((typeof packageInquiryFormType !== 'undefined' && packageInquiryFormType) || item?.inquiry_form_type || packageFormType || '')
        : entityType;

      if (effectiveFormForPayload === 'Accommodation') {
        const effectiveResortName = resortName || item?.resort || item?.resortName || undefined;
        addIf('from_date', formData.from_date);
        addIf('to_date', formData.to_date);
        addIf('resortName', effectiveResortName);
        // Only include roomName when it's a non-empt
        if (typeof roomName === 'string' && roomName.trim() !== '') {
          addIf('roomName', roomName);
        }
        addIf('number_of_rooms', formData.number_of_rooms);
        addIf('divers_adults', formData.divers_adults);
        addIf('divers_children', formData.divers_children);
        addIf('nondivers_adults', formData.nondivers_adults);
        addIf('nondivers_children', formData.nondivers_children);
        addIf('nondivers_infants', formData.nondivers_infants);
        addIf('selectedActivities', formData.selectedActivities && formData.selectedActivities.length ? formData.selectedActivities : undefined);
      } else if (effectiveFormForPayload === 'Adventure') {
          addIf('preferredMonth', formData.preferredMonth);
          addIf('preferredYear', formData.preferredYear);
          addIf('adventureOptions', formData.adventureOptions && formData.adventureOptions.length ? formData.adventureOptions : undefined);
          addIf('adventureOption', Array.isArray(formData.adventureOptions) && formData.adventureOptions.length ? formData.adventureOptions[0] : formData.adventureOption);
          addIf('participantsByOption', (formData.participantsByOption || []).filter(g => g && g.option && Array.isArray(g.participants) && g.participants.length));
          const flatParticipants = (formData.participantsByOption || []).flatMap(g => (g.participants||[])).filter(p => p && (p.name || p.ageCategory || p.gender));
          addIf('participants', flatParticipants.length ? flatParticipants : undefined);
          addIf('bookWholeBoat', !!formData.bookWholeBoat);
      } else if (effectiveFormForPayload === 'Activity') {

      } else {
        // Generic: include any dates or counts if present
        addIf('from_date', formData.from_date);
        addIf('to_date', formData.to_date);
      }

      console.log('Submitting cleaned payload:', payload);
      await onSubmit(payload);
      setFormData({
        name: '',
        email: '',
        phone_number: '',
        message: '',
        from_date: '',
        to_date: '',
        adults: null,
        children: null,
        infants: null,
        number_of_rooms: null,
        divers_adults: null,
        divers_children: null,
        nondivers_adults: null,
        nondivers_children: null,
        nondivers_infants: null,
        selectedActivities: [],
        // adventure-specific resets
        preferredMonth: '',
        preferredYear: '',
        adventureOptions: [],
        adventureOption: '',
        participants: [],
        participantsByOption: [],
        bookWholeBoat: false,
        country: '',
      });
      setDragStart(null);
      setDragEnd(null);
      setFieldErrors({});
      onClose();
    } catch (err) {
      console.error('Submission error:', err, err?.response?.data);
      const serverError = err?.response?.data?.error || err?.response?.data?.msg || err?.message || 'Anfrage konnte nicht gesendet werden';
      setError(serverError);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !item) {
    console.warn('Modal not rendered due to isOpen:', isOpen, 'or item:', item);
    return null;
  }

  const effectiveButtonType = buttonType || 'bookNow';

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-6">
      <div ref={modalRef} className="bg-white rounded-3xl shadow-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto" style={{ fontFamily: "'Comic Sans MS', 'Comic Neue'" }}>
        <div className="p-8">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-2xl font-bold" style={{ color: '#074a5b' }}>{t.inquiryForm}</h3>
            <button onClick={onClose} className="p-3 hover:bg-gray-100 rounded-full transition-colors">
              <X size={24} className="text-gray-600" />
            </button>
          </div>
          <div className="mb-7 p-5 rounded-2xl border-2" style={{ backgroundColor: '#074a5b0a', borderColor: '#074a5b' }}>
            <p className="text-base font-bold mb-2" style={{ color: '#074a5b' }}>{item.title || item.name || 'Custom Inquiry'}</p>
            <p className="text-base text-gray-600 font-medium">{item.shortDescription || item.description || 'No description available'}</p>
          </div>
          {/* Common error popup */}
          {error && (
            <div className="mb-6 p-3 bg-red-100 text-red-700 rounded-lg text-sm border border-red-300 shadow">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center">
                  <Mail size={18} className="mr-2" style={{ color: '#1e809b' }} />
                  {t.name}
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:border-transparent outline-none transition-all ${fieldErrors.name ? 'border-red-500' : ''}`}
                  style={{ borderColor: fieldErrors.name ? '#ef4444' : '#074a5b' }}
                  placeholder="Enter your name"
                />
                {fieldErrors.name && <div className="mt-1 text-xs text-red-600">{fieldErrors.name}</div>}
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center">
                  <Mail size={18} className="mr-2" style={{ color: '#1e809b' }} />
                  {t.email}
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:border-transparent outline-none transition-all ${fieldErrors.email ? 'border-red-500' : ''}`}
                  style={{ borderColor: fieldErrors.email ? '#ef4444' : '#074a5b' }}
                  placeholder="Enter your email"
                />
                {fieldErrors.email && <div className="mt-1 text-xs text-red-600">{fieldErrors.email}</div>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center">
                  <Phone size={18} className="mr-2" style={{ color: '#1e809b' }} />
                  {t.phone}
                </label>
                <input
                  type="tel"
                  name="phone_number"
                  value={formData.phone_number}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:border-transparent outline-none transition-all ${fieldErrors.phone_number ? 'border-red-500' : ''}`}
                  style={{ borderColor: fieldErrors.phone_number ? '#ef4444' : '#074a5b' }}
                  placeholder="Enter your phone number"
                />
                {fieldErrors.phone_number && <div className="mt-1 text-xs text-red-600">{fieldErrors.phone_number}</div>}
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center">
                  <MapPin size={18} className="mr-2" style={{ color: '#1e809b' }} />
                  {t.country}
                </label>
                <input
                  type="text"
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:border-transparent outline-none transition-all ${fieldErrors.country ? 'border-red-500' : ''}`}
                  style={{ borderColor: fieldErrors.country ? '#ef4444' : '#074a5b' }}
                  placeholder="Enter your country"
                />
                {fieldErrors.country && <div className="mt-1 text-xs text-red-600">{fieldErrors.country}</div>}
              </div>
            </div>
            {isAdventure() ? (
              <AdventureSection />
            ) : isActivity() ? <ActivitySection /> : (
              <div className="grid grid-cols-2 gap-4">
                <div onClick={handleCheckInClick} className="cursor-pointer relative">
                  <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center">
                    <Calendar size={18} className="mr-2" style={{ color: '#1e809b' }} />
                    {t.fromDate}
                  </label>
                  <div className={`w-full px-4 py-3 border-2 rounded-xl flex items-center ${fieldErrors.from_date ? 'border-red-500' : ''}`}
                    style={{ borderColor: fieldErrors.from_date ? '#ef4444' : '#074a5b' }}>
                    <Calendar size={18} className="mr-2 text-gray-400" />
                    <span className={formData.from_date ? 'text-gray-700' : 'text-gray-400'}>
                      {formData.from_date ? formatDateForDisplay(new Date(formData.from_date)) : t.datePlaceholder}
                    </span>
                  </div>
                  {fieldErrors.from_date && <div className="mt-1 text-xs text-red-600">{fieldErrors.from_date}</div>}
                </div>
                <div
                  onClick={() => formData.from_date && setShowCalendar(true)}
                  className={`relative ${formData.from_date ? 'cursor-pointer' : 'cursor-not-allowed'}`}
                >
                  <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center">
                    <Calendar size={18} className="mr-2" style={{ color: '#1e809b' }} />
                    {t.toDate}
                  </label>
                  <div className={`w-full px-4 py-3 border-2 rounded-xl flex items-center ${fieldErrors.to_date ? 'border-red-500' : ''}`}
                    style={{ borderColor: fieldErrors.to_date ? '#ef4444' : '#074a5b' }}>
                    <Calendar size={18} className="mr-2 text-gray-400" />
                    <span className={formData.to_date ? 'text-gray-700' : 'text-gray-400'}>
                      {formData.to_date ? formatDateForDisplay(new Date(formData.to_date)) : t.datePlaceholder}
                    </span>
                  </div>
                  {fieldErrors.to_date && <div className="mt-1 text-xs text-red-600">{fieldErrors.to_date}</div>}
                </div>
              </div>
            )}
            {showCalendar && (
              <div ref={calendarRef} className="mt-6 p-5 border-2 rounded-xl max-w-[320px] mx-auto" style={{ borderColor: '#074a5b', backgroundColor: '#074a5b0a' }}>
                <div className="flex items-center justify-between mb-5">
                  <button
                    type="button"
                    onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                    className="p-3 hover:bg-[#1e809b]/10 rounded-lg transition-colors"
                  >
                    <ChevronLeft size={18} style={{ color: '#074a5b' }} />
                  </button>
                  <h5 className="font-bold text-base" style={{ color: '#074a5b' }}>
                    {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </h5>
                  <button
                    type="button"
                    onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                    className="p-3 hover:bg-[#1e809b]/10 rounded-lg transition-colors"
                  >
                    <ChevronRight size={18} style={{ color: '#074a5b' }} />
                  </button>
                </div>
                <div className="grid grid-cols-7 gap-2 mb-5">
                  {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
                    <div key={day} className="h-9 flex items-center justify-center text-sm font-bold" style={{ color: '#074a5b' }}>
                      {day}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-2">{renderCalendar()}</div>
                {isSelecting && dragStart && (
                  <div className="text-center mt-5 p-3 rounded-lg" style={{ backgroundColor: '#1e809b0a' }}>
                    <p className="text-sm font-medium" style={{ color: '#074a5b' }}>
                      ✓ Einchecken: {formatDateForDisplay(dragStart)}
                    </p>
                    <p className="text-sm" style={{ color: '#1e809b' }}>
                      Klicken Sie auf das Check-out-Datum, um die Auswahl abzuschließen
                    </p>
                  </div>
                )}
              </div>
            )}
            {!isAdventure() && !isActivity() && (isHotelOrResort() ? (
              <HotelResortSection />
            ) : (
              <DefaultTravellersSection />
            ))}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center">
                <MessageSquare size={18} className="mr-2" style={{ color: '#1e809b' }} />
                {t.message}
              </label>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleChange}
                rows={5}
                className="w-full px-4 py-2 border-2 rounded-xl focus:ring-2 focus:border-transparent outline-none transition-all resize-none"
                style={{ borderColor: '#074a5b' }}
                placeholder="Erzählen Sie uns von Ihren Reiseplänen..."
              />
            </div>
            <div className="">
              <label className="block text-sm font-bold text-gray-700 mb-2">Preferred language</label>
              <div className="max-w-48">
                <select
                  name="preferred_language"
                  value={formData.preferred_language}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:border-transparent outline-none transition-all ${fieldErrors.preferred_language ? 'border-red-500' : ''}`}
                  style={{ borderColor: fieldErrors.preferred_language ? '#ef4444' : '#074a5b' }}
                >
                  <option value="">Select language</option>
                  {languages.map((l) => (
                    <option key={l.code} value={l.code}>
                      {l.name}
                    </option>
                  ))}
                </select>
              </div>
              {fieldErrors.preferred_language && <div className="mt-1 text-xs text-red-600">{fieldErrors.preferred_language}</div>}
            </div>
            <div className="flex items-center gap-3">
              <input
                id="subscribe_newsletter"
                type="checkbox"
                name="subscribe_newsletter"
                checked={!!formData.subscribe_newsletter}
                onChange={(e) => setFormData((p) => ({ ...p, subscribe_newsletter: e.target.checked }))}
              />
              <label htmlFor="subscribe_newsletter" className="text-md">Subscribe to Newsletter</label>
            </div>
            <div className="border-t-2 pt-6" style={{ borderColor: '#074a5b' }}>
              {console.log('Rendering submit button for effectiveButtonType:', effectiveButtonType)}
              <button
                type="submit"
                disabled={loading}
                className={`w-full px-6 py-4 text-white rounded-xl font-semibold text-lg transition-all duration-300 transform hover:scale-[1.02] shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center ${
                  effectiveButtonType === 'whatsapp' ? 'bg-green-600 hover:bg-green-700' : 'bg-gradient-to-r from-[#074a5b] to-[#1e809b] hover:from-[#1e809b] hover:to-[#074a5b]'
                }`}
              >
                {effectiveButtonType === 'bookNow' && <MessageCircle size={20} className="mr-2" />}
                {effectiveButtonType === 'whatsapp' && <Phone size={20} className="mr-2" />}
                {loading ? 'Submitting...' : effectiveButtonType === 'whatsapp' ? t.sendWhatsApp : t.bookNow}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default React.memo(InquiryFormModal);
