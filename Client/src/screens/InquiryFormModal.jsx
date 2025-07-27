import React, { useState, useEffect, useRef } from 'react';
import { X, Calendar, Users, MapPin, Phone, Mail, MessageSquare, Minus, Plus, ChevronLeft, ChevronRight, MessageCircle } from 'lucide-react';

const InquiryFormModal = ({ isOpen, onClose, item, onSubmit, language, buttonType, resortName, roomName }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone_number: '',
    message: '',
    from_date: '',
    to_date: '',
    travellers: 1,
    children: [],
    country: '',
  });
  const [childAges, setChildAges] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isSelecting, setIsSelecting] = useState(false);
  const [dragStart, setDragStart] = useState(null);
  const [dragEnd, setDragEnd] = useState(null);
  const modalRef = useRef(null);
  const calendarRef = useRef(null);

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
      travellers: Math.max(1, prev.travellers + increment),
    }));
  };

  const handleChildAgeChange = (index, value) => {
    const newChildAges = [...childAges];
    newChildAges[index] = value;
    setChildAges(newChildAges);
    setFormData((prev) => ({ ...prev, children: newChildAges.filter((age) => age !== '') }));
  };

  const addChild = () => {
    setChildAges([...childAges, '']);
  };

  const removeChild = (index) => {
    const newChildAges = childAges.filter((_, i) => i !== index);
    setChildAges(newChildAges);
    setFormData((prev) => ({ ...prev, children: newChildAges.filter((age) => age !== '') }));
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

  const validateForm = () => {
    if (!item) return t.itemMissing;
    if (!formData.name) return t.required;
    if (!formData.email || !/\S+@\S+\.\S+/.test(formData.email)) return t.invalidEmail;
    if (!formData.phone_number || !/^\+?\d{10,15}$/.test(formData.phone_number)) return t.invalidPhone;
    if (formData.from_date && formData.to_date && new Date(formData.to_date) <= new Date(formData.from_date)) return t.invalidDates;
    if (item?.expiryDate) {
      const expiry = new Date(item.expiryDate);
      if (formData.from_date && new Date(formData.from_date) > expiry) return t.expiredDates;
      if (formData.to_date && new Date(formData.to_date) > expiry) return t.expiredDates;
    }
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Form submission started with buttonType:', buttonType);
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      if (validationError === t.expiredDates) {
        alert(`Error: ${t.expiredDates} (${item?.expiryDate ? new Date(item.expiryDate).toLocaleDateString() : 'N/A'})`);
      }
      return;
    }
    setError('');
    setLoading(true);
    try {
      const entityType = item._id === 'CUSTOM' ? 'Custom' : item.title ? (resortName && roomName ? 'Accommodation' : 'Package') : 'Activity';
      const title = item.title || item.name || 'Custom Inquiry';
      const submissionData = {
        ...formData,
        entity: { $oid: item._id || 'CUSTOM' },
        entityType,
        title,
        buttonType: buttonType || 'bookNow',
        ...(entityType === 'Accommodation' && { resortName, roomName }),
      };
      console.log('Submitting data:', submissionData);
      await onSubmit(submissionData);
      setFormData({
        name: '',
        email: '',
        phone_number: '',
        message: '',
        from_date: '',
        to_date: '',
        travellers: 1,
        children: [],
        country: '',
      });
      setChildAges([]);
      setDragStart(null);
      setDragEnd(null);
      onClose();
    } catch (err) {
      console.error('Submission error:', err);
      setError('Anfrage konnte nicht gesendet werden');
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
      <div ref={modalRef} className="bg-white rounded-3xl shadow-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto" style={{ fontFamily: 'Comic Sans MS, cursive' }}>
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
          {error && <div className="mb-6 p-3 bg-red-100 text-red-700 rounded-lg text-sm">{error}</div>}
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
                  className="w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:border-transparent outline-none transition-all"
                  style={{ borderColor: '#074a5b' }}
                  placeholder="Enter your name"
                />
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
                  className="w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:border-transparent outline-none transition-all"
                  style={{ borderColor: '#074a5b' }}
                  placeholder="Enter your email"
                />
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
                  className="w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:border-transparent outline-none transition-all"
                  style={{ borderColor: '#074a5b' }}
                  placeholder="+1234567890"
                />
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
                  className="w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:border-transparent outline-none transition-all"
                  style={{ borderColor: '#074a5b' }}
                  placeholder="Enter your country"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div onClick={handleCheckInClick} className="cursor-pointer relative">
                <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center">
                  <Calendar size={18} className="mr-2" style={{ color: '#1e809b' }} />
                  {t.fromDate}
                </label>
                <div className="w-full px-4 py-3 border-2 rounded-xl flex items-center">
                  <Calendar size={18} className="mr-2 text-gray-400" />
                  <span className={formData.from_date ? 'text-gray-700' : 'text-gray-400'}>
                    {formData.from_date ? formatDateForDisplay(new Date(formData.from_date)) : t.datePlaceholder}
                  </span>
                </div>
              </div>
              <div
                onClick={() => formData.from_date && setShowCalendar(true)}
                className={`relative ${formData.from_date ? 'cursor-pointer' : 'cursor-not-allowed'}`}
              >
                <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center">
                  <Calendar size={18} className="mr-2" style={{ color: '#1e809b' }} />
                  {t.toDate}
                </label>
                <div className="w-full px-4 py-3 border-2 rounded-xl flex items-center">
                  <Calendar size={18} className="mr-2 text-gray-400" />
                  <span className={formData.to_date ? 'text-gray-700' : 'text-gray-400'}>
                    {formData.to_date ? formatDateForDisplay(new Date(formData.to_date)) : t.datePlaceholder}
                  </span>
                </div>
              </div>
            </div>
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
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center">
                <Users size={18} className="mr-2" style={{ color: '#1e809b' }} />
                {t.travellers}
              </label>
              <div className="flex items-center border-2 rounded-xl" style={{ borderColor: '#074a5b' }}>
                <button
                  type="button"
                  onClick={() => handleTravellersChange(-1)}
                  className="p-4 hover:bg-[#1e809b]/10 transition-colors"
                >
                  <Minus size={18} style={{ color: '#074a5b' }} />
                </button>
                <span className="flex-1 text-center py-3 text-base font-bold" style={{ color: '#074a5b' }}>
                  {formData.travellers}
                </span>
                <button
                  type="button"
                  onClick={() => handleTravellersChange(1)}
                  className="p-4 hover:bg-[#1e809b]/10 transition-colors"
                >
                  <Plus size={18} style={{ color: '#074a5b' }} />
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center">
                <Users size={18} className="mr-2" style={{ color: '#1e809b' }} />
                {t.children}
              </label>
              <div className="space-y-3">
                {childAges.map((age, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <input
                      type="number"
                      value={age}
                      onChange={(e) => handleChildAgeChange(index, e.target.value)}
                      min="0"
                      max="17"
                      placeholder="0"
                      className="flex-1 px-4 py-3 border-2 rounded-xl focus:ring-2 focus:border-transparent outline-none transition-all"
                      style={{ borderColor: '#074a5b' }}
                    />
                    <button
                      type="button"
                      onClick={() => removeChild(index)}
                      className="text-red-500 hover:text-red-700 transition-colors"
                    >
                      <X size={18} />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addChild}
                  className="text-sm text-blue-600 hover:text-blue-800 flex items-center transition-colors"
                >
                  <Plus size={18} className="mr-2" />
                  {t.addChild}
                </button>
              </div>
            </div>
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
                className="w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:border-transparent outline-none transition-all resize-none"
                style={{ borderColor: '#074a5b' }}
                placeholder="Erzählen Sie uns von Ihren Reiseplänen..."
              />
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