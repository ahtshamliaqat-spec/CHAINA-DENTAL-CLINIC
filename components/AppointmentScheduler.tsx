
import React, { useEffect, useState } from 'react';
import { Plus, Calendar, Clock, CheckCircle, Search, Phone, ChevronDown, User, Mail, MessageSquare, CheckCircle2, Lock, Edit3, Trash2, Loader2 } from 'lucide-react';
import { Appointment, Doctor, Patient, User as AppUser, UserRole } from '../types';
import { ClinicService } from '../services/api';

interface Props {
  currentUser: AppUser;
}

const AppointmentScheduler: React.FC<Props> = ({ currentUser }) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [processingId, setProcessingId] = useState<number | null>(null);
  
  const isAdmin = currentUser.role === UserRole.ADMIN;

  // Form State
  const [formData, setFormData] = useState({
    mrn: isAdmin ? '' : (currentUser.mrn || ''),
    name: isAdmin ? '' : currentUser.full_name,
    phone: '',
    email: '',
    age: '',
    date: new Date().toISOString().split('T')[0],
    time: '09:00',
    doctorId: '',
    message: ''
  });

  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [appts, docs, pats] = await Promise.all([
      ClinicService.getAppointments(),
      ClinicService.getDoctors(),
      ClinicService.getPatients()
    ]);
    setAppointments(appts);
    setDoctors(docs);
    setPatients(pats);
    
    // Auto-fill phone/age for patient if logged in
    if (!isAdmin && currentUser.mrn) {
        const p = pats.find(pt => pt.mrn === currentUser.mrn);
        if (p) {
            setFormData(prev => ({
                ...prev,
                phone: p.mobile_no,
                age: calculateAge(p.dob)
            }));
        }
    }
  };

  const calculateAge = (dob: string) => {
    if (!dob) return '';
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age.toString();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setError('');

    if (isAdmin && name === 'mrn') {
      const searchValue = value.trim();
      let matchedPatient = null;

      matchedPatient = patients.find(p => p.mrn.toLowerCase() === searchValue.toLowerCase());

      if (!matchedPatient && /^\d+$/.test(searchValue)) {
        const padded = searchValue.padStart(4, '0');
        const formatted = `MRN${padded}`;
        matchedPatient = patients.find(p => p.mrn.toLowerCase() === formatted.toLowerCase());
      }
      
      if (!matchedPatient && searchValue.toLowerCase().startsWith('mrn')) {
          const numPart = searchValue.substring(3);
          if (/^\d+$/.test(numPart)) {
              const padded = numPart.padStart(4, '0');
              const formatted = `MRN${padded}`;
              matchedPatient = patients.find(p => p.mrn.toLowerCase() === formatted.toLowerCase());
          }
      }

      if (matchedPatient) {
        setFormData(prev => ({
          ...prev,
          mrn: matchedPatient!.mrn,
          name: matchedPatient!.full_name,
          phone: matchedPatient!.mobile_no,
          age: calculateAge(matchedPatient!.dob)
        }));
        return;
      }
    }

    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleBookAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let patientId: number;
      let existingPatient = patients.find(p => 
        (formData.mrn && p.mrn.toLowerCase() === formData.mrn.toLowerCase()) || 
        p.mobile_no === formData.phone
      );

      if (existingPatient) {
        patientId = existingPatient.patient_id;
      } else {
        const currentYear = new Date().getFullYear();
        const birthYear = currentYear - (parseInt(formData.age) || 0);
        const dob = `${birthYear}-01-01`;

        const newPatient = await ClinicService.registerPatient({
          mrn: formData.mrn || `MRN${Math.floor(Math.random() * 10000)}`,
          full_name: formData.name,
          father_name: '',
          dob: dob,
          gender: 'Male',
          mobile_no: formData.phone,
          address: ''
        });
        patientId = newPatient.patient_id;
        setPatients(prev => [...prev, newPatient]);
      }

      const scheduledAt = new Date(`${formData.date}T${formData.time}:00`).toISOString();

      await ClinicService.createAppointment({
        patient_id: patientId,
        doctor_id: parseInt(formData.doctorId),
        scheduled_at: scheduledAt,
        duration_min: 15,
        remarks: `${formData.message} (Email: ${formData.email})`
      });

      setShowBookingForm(false);
      loadData();

    } catch (error: any) {
      setError(error.message || 'Failed to book appointment.');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: number, status: any) => {
    if (!isAdmin) return;
    setProcessingId(id);
    try {
        await ClinicService.updateAppointmentStatus(id, status);
        await loadData();
    } finally {
        setProcessingId(null);
    }
  };

  const filteredAppts = appointments.filter(a => {
    const aDate = new Date(a.scheduled_at).toISOString().split('T')[0];
    return aDate === filterDate;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
             <div>
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                    {isAdmin ? 'Manage Appointments' : 'Book Your Appointment'}
                </h1>
                <p className="text-gray-500 mt-1">
                    {isAdmin ? 'Review and manage clinic schedules' : 'Choose a time and doctor for your dental care'}
                </p>
             </div>
             
             <div className="flex items-center gap-3">
                <div className="bg-white border border-gray-200 rounded-xl px-4 py-2.5 flex items-center gap-3 shadow-sm">
                    <span className="text-sm font-semibold text-gray-500">View Date:</span>
                    <div className="flex items-center gap-2">
                        <input 
                            type="date" 
                            value={filterDate} 
                            onChange={(e) => setFilterDate(e.target.value)}
                            className="outline-none text-sm font-medium text-gray-700 bg-transparent cursor-pointer"
                        />
                    </div>
                </div>
                <button 
                  onClick={() => setShowBookingForm(!showBookingForm)}
                  className="bg-cyan-700 hover:bg-cyan-800 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-cyan-700/20 transition-all flex items-center gap-2"
                >
                  <Plus size={18} />
                  <span>{showBookingForm ? 'Close Form' : 'New Appointment'}</span>
                </button>
             </div>
        </div>

        {/* Dynamic Booking Form */}
        {showBookingForm && (
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden animate-in slide-in-from-top duration-300">
                <div className="p-8">
                     <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-gray-900">Create New Appointment</h2>
                        {isAdmin && (
                            <div className="text-xs bg-cyan-50 text-cyan-700 px-3 py-1 rounded-full font-bold">
                                Enter MR No. (e.g., 1, 12) to auto-fill details
                            </div>
                        )}
                     </div>

                     {error && (
                         <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 flex items-center gap-3 text-sm font-bold">
                             <Lock size={18} /> {error}
                         </div>
                     )}

                     <form onSubmit={handleBookAppointment} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <div className="space-y-1.5">
                                <label className="text-xs font-black uppercase tracking-widest text-gray-400">MR No.</label>
                                <input 
                                    name="mrn" 
                                    value={formData.mrn} 
                                    onChange={handleInputChange} 
                                    readOnly={!isAdmin}
                                    type="text" 
                                    placeholder="e.g. 1 or MRN0001" 
                                    className={`w-full border border-gray-200 rounded-xl p-3 outline-none transition-all font-mono ${!isAdmin ? 'bg-gray-50 text-gray-500' : 'focus:ring-2 focus:ring-cyan-500'}`} 
                                />
                            </div>
                            <div className="space-y-1.5 md:col-span-2">
                                <label className="text-xs font-black uppercase tracking-widest text-gray-400">Patient Name</label>
                                <input 
                                    required 
                                    name="name" 
                                    value={formData.name} 
                                    onChange={handleInputChange} 
                                    readOnly={!isAdmin}
                                    type="text" 
                                    className={`w-full border border-gray-200 rounded-xl p-3 outline-none transition-all ${!isAdmin ? 'bg-gray-50 text-gray-500' : 'focus:ring-2 focus:ring-cyan-500'}`} 
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-black uppercase tracking-widest text-gray-400">Phone No.</label>
                                <input required name="phone" value={formData.phone} onChange={handleInputChange} type="tel" className="w-full border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-cyan-500 outline-none transition-all" />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                            <div className="space-y-1.5 md:col-span-2">
                                <label className="text-xs font-black uppercase tracking-widest text-gray-400">Attending Doctor</label>
                                <select required name="doctorId" value={formData.doctorId} onChange={handleInputChange} className="w-full border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-cyan-500 outline-none transition-all">
                                    <option value="">Select Doctor</option>
                                    {doctors.filter(d => d.active === 'Y').map(d => (
                                        <option key={d.doctor_id} value={d.doctor_id}>{d.full_name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-black uppercase tracking-widest text-gray-400">Date</label>
                                <input required name="date" value={formData.date} onChange={handleInputChange} type="date" className="w-full border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-cyan-500 outline-none transition-all" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-black uppercase tracking-widest text-gray-400">Time</label>
                                <input required name="time" value={formData.time} onChange={handleInputChange} type="time" className="w-full border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-cyan-500 outline-none transition-all" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-black uppercase tracking-widest text-gray-400">Age</label>
                                <input required name="age" value={formData.age} onChange={handleInputChange} type="number" className="w-full border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-cyan-500 outline-none transition-all" />
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 pt-4">
                            <button type="button" onClick={() => setShowBookingForm(false)} className="px-6 py-3 text-gray-500 font-bold hover:bg-gray-50 rounded-xl transition-all">Cancel</button>
                            <button type="submit" disabled={loading} className="px-10 py-3 bg-cyan-700 text-white font-bold rounded-xl shadow-lg shadow-cyan-700/20 hover:bg-cyan-800 transition-all transform active:scale-95">
                                {loading ? 'Processing...' : 'Book Appointment'}
                            </button>
                        </div>
                     </form>
                </div>
            </div>
        )}

        {/* List View Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-white border-b border-gray-100">
                        <tr>
                            <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Time</th>
                            <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">MR No.</th>
                            <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Patient</th>
                            <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Doctor</th>
                            <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Status</th>
                            <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                    {filteredAppts.length === 0 ? (
                        <tr>
                            <td colSpan={6} className="px-8 py-20 text-center">
                                <div className="flex flex-col items-center">
                                    <Calendar size={48} className="text-gray-100 mb-2" />
                                    <p className="text-gray-400 font-medium">No appointments for this date.</p>
                                </div>
                            </td>
                        </tr>
                    ) : (
                        filteredAppts.map(appt => {
                        const isOwnAppt = !isAdmin && appt.mrn === currentUser.mrn;
                        const isCheckingIn = processingId === appt.appt_id;
                        const isAlreadyChecked = appt.status === 'CHECKED_IN' || appt.status === 'IN_PROGRESS' || appt.status === 'COMPLETED';
                        
                        return (
                        <tr key={appt.appt_id} className={`hover:bg-cyan-50/20 transition-all group ${isOwnAppt ? 'bg-cyan-50/10' : ''} ${appt.status === 'CHECKED_IN' ? 'animate-pulse bg-green-50/30' : ''}`}>
                            {/* Time Column */}
                            <td className="px-8 py-6 whitespace-nowrap">
                                <div className="flex items-center gap-3">
                                    <Clock size={18} className="text-gray-300" />
                                    <div>
                                        <div className="text-[15px] font-bold text-gray-800">
                                            {new Date(appt.scheduled_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                        </div>
                                        <div className="text-[11px] font-mono text-gray-400 mt-0.5 tracking-tight">{appt.appt_no}</div>
                                    </div>
                                </div>
                            </td>

                            {/* MR No. Column */}
                            <td className="px-8 py-6 whitespace-nowrap">
                                <span className={`text-[11px] px-2.5 py-1 rounded-lg font-black border uppercase tracking-wider shadow-sm transition-all ${
                                    isOwnAppt ? 'bg-cyan-700 text-white border-cyan-700' : 'bg-cyan-50 text-cyan-700 border-cyan-100'
                                }`}>
                                    {appt.mrn}
                                </span>
                            </td>
                            
                            {/* Patient Column */}
                            <td className="px-8 py-6">
                                <div className="flex items-center gap-4">
                                    <div className={`h-10 w-10 rounded-full flex items-center justify-center font-black text-xs shadow-sm transition-all ${
                                        isOwnAppt ? 'bg-cyan-700 text-white' : 'bg-cyan-100 text-cyan-600'
                                    }`}>
                                        {appt.patient_name?.charAt(0)}
                                    </div>
                                    <div>
                                        <div className="text-[15px] font-bold text-gray-800">
                                            {isOwnAppt ? 'You' : (isAdmin ? appt.patient_name : 'Blocked Slot')}
                                        </div>
                                        <div className="text-[12px] text-gray-400 font-medium mt-0.5">
                                            {isAdmin || isOwnAppt ? appt.mobile_no : '***-*******'}
                                        </div>
                                    </div>
                                </div>
                            </td>
                            
                            {/* Doctor Column */}
                            <td className="px-8 py-6 whitespace-nowrap">
                                <div className="text-[15px] font-bold text-gray-800">{appt.doctor_name}</div>
                                <div className="text-[12px] text-cyan-600 font-semibold mt-0.5">{appt.specialty}</div>
                            </td>
                            
                            {/* Status Column */}
                            <td className="px-8 py-6 whitespace-nowrap">
                                <span className={`px-4 py-1.5 inline-flex text-[10px] font-black tracking-widest uppercase rounded-full border transition-all ${
                                    appt.status === 'SCHEDULED' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                    appt.status === 'CHECKED_IN' ? 'bg-[#017b5e]/10 text-[#017b5e] border-[#017b5e]/20 scale-105' :
                                    appt.status === 'COMPLETED' ? 'bg-gray-50 text-gray-500 border-gray-100' :
                                    'bg-amber-50 text-amber-600 border-amber-100'
                                }`}>
                                    {appt.status === 'CHECKED_IN' ? 'CHECKED' : appt.status.replace('_', ' ')}
                                </span>
                            </td>
                            
                            {/* Action Column */}
                            <td className="px-8 py-6 whitespace-nowrap">
                                {isAdmin ? (
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={() => handleStatusChange(appt.appt_id, 'CHECKED_IN')}
                                            disabled={isAlreadyChecked || isCheckingIn}
                                            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest shadow-sm transition-all transform active:scale-95 ${
                                                isAlreadyChecked 
                                                ? 'bg-gray-50 text-gray-300 border border-gray-100 cursor-not-allowed' 
                                                : 'bg-[#017b5e] text-white hover:bg-[#01654e] shadow-lg shadow-[#017b5e]/20'
                                            }`}
                                        >
                                            {isCheckingIn ? (
                                                <Loader2 size={16} className="animate-spin" />
                                            ) : isAlreadyChecked ? (
                                                <CheckCircle2 size={16} />
                                            ) : (
                                                <CheckCircle2 size={16} />
                                            )}
                                            <span>{isAlreadyChecked ? 'CHECKED' : 'CHECK IN'}</span>
                                        </button>
                                        <button className="p-2 text-gray-400 hover:text-cyan-600 hover:bg-cyan-50 rounded-lg transition-colors"><Edit3 size={16}/></button>
                                        <button className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={16}/></button>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 text-gray-300 italic text-xs font-medium">
                                        <Lock size={14} />
                                        <span>Read Only</span>
                                    </div>
                                )}
                            </td>
                        </tr>
                        );
                        })
                    )}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
  );
};

export default AppointmentScheduler;
