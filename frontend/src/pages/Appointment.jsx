import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { assets } from '../assets/assets';
import RelatedDoctors from '../components/RelatedDoctors';
import api from '../config/api';

const DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

const Appointments = () => {
  const { docId } = useParams();
  const navigate = useNavigate();

  const [docInfo, setDocInfo]   = useState(null);
  const [loading, setLoading]   = useState(true);
  const [docSlots, setDocSlots] = useState([]);
  const [slotIndex, setSlotIndex] = useState(0);
  const [slotTime, setSlotTime]   = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Verify/claim form state
  const [itemType, setItemType] = useState('');
  const [location, setLocation] = useState('');
  const [timeLost, setTimeLost] = useState('');
  const [proofFile, setProofFile] = useState(null);
  const [proofLabel, setProofLabel] = useState('No file chosen');

  // ── Fetch item from backend ──────────────────────────────────────────
  useEffect(() => {
    const fetchItem = async () => {
      setLoading(true);
      try {
        const result = await api.getItem(docId);
        if (result.success) {
          const item = result.item;
          setDocInfo({
            _id:       item.id.toString(),
            name:      item.name,
            image:     item.image ? `http://localhost:5000${item.image}` : null,
            speciality: item.speciality,
            degree:    item.degree    || '',
            experience: item.experience || '',
            about:     item.about     || '',
            address: {
              line1: item.address_line1 || '',
              line2: item.address_line2 || '',
            },
            status: item.status,
          });
        } else {
          console.error('Item not found');
          navigate('/doctors');
        }
      } catch (err) {
        console.error('Error fetching item:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchItem();
  }, [docId]);

  // ── Generate 7-day booking slots ────────────────────────────────────
  useEffect(() => {
    if (!docInfo) return;
    setDocSlots([]);
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(today);
      currentDate.setDate(today.getDate() + i);
      const endTime = new Date(currentDate);
      endTime.setHours(21, 0, 0, 0);

      if (i === 0) {
        currentDate.setHours(currentDate.getHours() > 10 ? currentDate.getHours() + 1 : 10);
        currentDate.setMinutes(currentDate.getMinutes() > 30 ? 30 : 0);
      } else {
        currentDate.setHours(10, 0, 0, 0);
      }

      const slots = [];
      while (currentDate < endTime) {
        slots.push({
          datetime: new Date(currentDate),
          time: currentDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        });
        currentDate.setMinutes(currentDate.getMinutes() + 30);
      }
      setDocSlots(prev => [...prev, slots]);
    }
  }, [docInfo]);

  // ── Book appointment ─────────────────────────────────────────────────
  const handleBookAppointment = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Please login to claim an item');
      navigate('/login');
      return;
    }
    if (!slotTime) {
      alert('Please select a pickup time slot');
      return;
    }
    if (!itemType || !location || !timeLost) {
      alert('Please fill in all verification fields');
      return;
    }

    setSubmitting(true);
    try {
      const selectedDay = docSlots[slotIndex]?.[0]?.datetime;
      const appointmentDate = selectedDay
        ? selectedDay.toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0];

      const payload = {
        item_id:          docInfo._id,
        appointment_date: appointmentDate,
        appointment_time: slotTime,
        item_type:        itemType,
        location:         location,
        time_lost:        timeLost,
        proof_file:       proofFile,
      };

      const result = await api.bookAppointment(payload);

      if (result.success) {
        alert('Appointment booked! Check My Appointments for details.');
        navigate('/my-appointments');
      } else {
        alert(result.message || 'Failed to book appointment');
      }
    } catch (err) {
      console.error('Booking error:', err);
      alert('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-20 text-gray-500">Loading item details...</div>
    );
  }

  if (!docInfo) return null;

  return (
    <div>
      {/* ── Item Details ── */}
      <div className='flex flex-col sm:flex-row gap-4'>
        <div>
          <img
            className='bg-primary w-full sm:max-w-72 rounded-lg object-cover'
            src={docInfo.image}
            alt={docInfo.name}
            onError={(e) => { e.target.src = 'https://via.placeholder.com/300x200?text=No+Image'; }}
          />
        </div>
        <div className='flex-1 border border-gray-400 rounded-lg p-8 py-7 bg-white mx-2 sm:mx-0 mt-[-80px] sm:mt-0'>
          <p className='flex items-center gap-2 text-2xl font-medium text-gray-900'>
            {docInfo.name}
            <img className='w-5' src={assets.verified_icon} alt="" />
          </p>
          <div className='flex items-center gap-2 text-sm mt-1 text-gray-600'>
            <p>Found Item - {docInfo.speciality}</p>
            {docInfo.address.line2 && (
              <button className='py-0.5 px-2 border text-xs rounded-full'>
                Found at {docInfo.address.line2}
              </button>
            )}
          </div>
          <div className='mt-3'>
            <p className='flex items-center gap-1 text-sm font-medium text-gray-900'>
              About <img src={assets.info_icon} alt="" />
            </p>
            <p className='text-sm text-gray-500 max-w-[700px] mt-1'>{docInfo.about}</p>
          </div>
          {docInfo.address.line1 && (
            <p className='text-sm text-gray-500 mt-2'>
              📍 {docInfo.address.line1}
            </p>
          )}
        </div>
      </div>

      {/* ── Verify / Claim Section ── */}
      <div className='sm:ml-72 sm:pl-4 mt-6 font-medium text-gray-700'>
        <p className='mb-3'>Verify ownership to claim this item</p>

        <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-4'>
          <div>
            <label className='block text-sm mb-1'>Type of Item</label>
            <input
              type='text'
              value={itemType}
              onChange={(e) => setItemType(e.target.value)}
              placeholder='Enter item type'
              className='w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-primary focus:outline-none'
            />
          </div>
          <div>
            <label className='block text-sm mb-1'>Location Lost</label>
            <input
              type='text'
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder='Where did you lose it?'
              className='w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-primary focus:outline-none'
            />
          </div>
          <div>
            <label className='block text-sm mb-1'>Time Lost</label>
            <input
              type='time'
              value={timeLost}
              onChange={(e) => setTimeLost(e.target.value)}
              className='w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-primary focus:outline-none'
            />
          </div>
        </div>

        <div className='mb-6'>
          <label className='block text-sm mb-1'>Upload Proof (Image/Media)</label>
          <label className='flex items-center gap-3 w-full border border-gray-300 rounded-lg p-2 cursor-pointer hover:border-primary transition-colors bg-white'>
            <span className='bg-primary text-white text-sm px-3 py-1 rounded-md whitespace-nowrap'>
              Choose File
            </span>
            <span className='text-gray-500 text-sm truncate'>{proofLabel}</span>
            <input
              type='file'
              accept='image/*,video/*'
              className='hidden'
              onChange={(e) => {
                setProofFile(e.target.files[0]);
                setProofLabel(e.target.files[0]?.name || 'No file chosen');
              }}
            />
          </label>
        </div>
      </div>

      {/* ── Booking Slots ── */}
      <div className='sm:ml-72 sm:pl-4 mt-4 font-medium text-gray-700'>
        <p>Select Pickup Slot</p>
        <div className='flex gap-3 items-center w-full overflow-x-scroll mt-4'>
          {docSlots.map((daySlots, index) => (
            <div
              key={index}
              onClick={() => { setSlotIndex(index); setSlotTime(''); }}
              className={`text-center py-6 min-w-16 rounded-full cursor-pointer ${
                slotIndex === index ? 'bg-primary text-white' : 'border border-gray-200'
              }`}
            >
              <p>{daySlots[0] && DAYS[daySlots[0].datetime.getDay()]}</p>
              <p>{daySlots[0] && daySlots[0].datetime.getDate()}</p>
            </div>
          ))}
        </div>

        <div className='flex items-center gap-3 w-full overflow-x-scroll mt-4'>
          {docSlots[slotIndex]?.map((slot, index) => (
            <p
              key={index}
              onClick={() => setSlotTime(slot.time)}
              className={`text-sm font-light flex-shrink-0 px-5 py-2 rounded-full cursor-pointer ${
                slot.time === slotTime
                  ? 'bg-primary text-white'
                  : 'text-gray-400 border border-gray-300'
              }`}
            >
              {slot.time.toLowerCase()}
            </p>
          ))}
        </div>

        <button
          onClick={handleBookAppointment}
          disabled={submitting}
          className='bg-primary text-white text-sm font-light px-14 py-3 rounded-full my-6 disabled:opacity-50 hover:scale-105 transition-transform duration-200'
        >
          {submitting ? 'Booking...' : 'Book an appointment'}
        </button>
      </div>

      {/* ── Related Items ── */}
      <RelatedDoctors docId={docId} speciality={docInfo.speciality} />
    </div>
  );
};

export default Appointments;