
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
  
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
  
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

  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, [currentUser]);

  const loadData = async () => {
    const [appts, docs, pats] = await Promise.all([
      ClinicService.getAppointments(),
      ClinicService.getDoctors(),
      ClinicService.getPatients()
    ]);
    setAppointments(appts);
    setDoctors(docs);
    setPatients(pats);
    
    // Auto-fill for patient if logged in
    if (!isAdmin && currentUser.mrn) {
        const p = pats.find(pt => pt.mrn === currentUser.mrn);
        if (p) {
            setSelectedPatientId(p.patient_id);
            setFormData(prev => ({
                ...prev,
                mrn: p.mrn,
                name: p.full_name,
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

      // STRICT MRN MATCHING: This ensures we get the exact correct Amina or Faiza
      matchedPatient = patients.find(p => p.mrn.toLowerCase() === searchValue.toLowerCase());

      if (!matchedPatient && /^\d+$/.test(searchValue)) {
        const padded = searchValue.padStart(4, '0');
        const formatted = `MRN${padded}`;
        matchedPatient = patients.find(p => p.mrn.toLowerCase() === formatted.toLowerCase());
      }

      if (matchedPatient) {
        setSelectedPatientId(matchedPatient.patient_id);
        setFormData(prev => ({
          ...prev,
          mrn: matchedPatient!.mrn,
          name: matchedPatient!.full_name,
          phone: matchedPatient!.mobile_no,
          age: calculateAge(matchedPatient!.dob)
        }));
        return;
      } else {
        setSelectedPatientId(null);
      }
    }

    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleBookAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let finalPatientId: number;
      
      // CRITICAL FIX: If logged in as patient, use CURRENT USER ID directly. 
      // Do not attempt to search by phone or name.
      if (!isAdmin && currentUser.role === UserRole.PATIENT) {
        const p = patients.find(pt => pt.mrn === currentUser.mrn);
        if (!p) throw new Error("Logged in patient profile not found.");
        finalPatientId = p.patient_id;
      } 
      // If admin, use the ID resolved from the MRN search
      else if (selectedPatientId) {
        finalPatientId = selectedPatientId;
      } 
      // If admin entered MRN manually that wasn't in state yet
      else if (formData.mrn) {
        const p = patients.find(pt => pt.mrn.toLowerCase() === formData.mrn.toLowerCase());
        if (p) {
          finalPatientId = p.patient_id;
        } else {
          // New Registration
          const dob = `${new Date().getFullYear() - (parseInt(formData.age) || 30)}-01-01`;
          const newPatient = await ClinicService.registerPatient({
            mrn: formData.mrn, 
            full_name: formData.name,
            father_name: '',
            dob: dob,
            gender: 'Male',
            mobile_no: formData.phone,
            address: '',
            password: 'password123'
          });
          finalPatientId = newPatient.patient_id;
        }
      } 
      else {
        // Complete new patient registration
        const dob = `${new Date().getFullYear() - (parseInt(formData.age) || 30)}-01-01`;
        const newPatient = await ClinicService.registerPatient({
          mrn: '', 
          full_name: formData.name,
          father_name: '',
          dob: dob,
          gender: 'Male',
          mobile_no: formData.phone,
          address: '',
          password: 'password123'
        });
        finalPatientId = newPatient.patient_id;
      }

      const scheduledAt = new Date(`${formData.date}T${formData.time}:00`).toISOString();

      await ClinicService.createAppointment({
        patient_id: finalPatientId,
        doctor_id: parseInt(formData.doctorId),
        scheduled_at: scheduledAt,
        duration_min: 15,
        remarks: formData.message || 'Scheduled visit'
      });

      setShowBookingForm(false);
      loadData();
      
      // Reset form carefully
      if (isAdmin) {
        setSelectedPatientId(null);
        setFormData({
            ...formData,
            mrn: '',
            name: '',
            phone: '',
            age: '',
            message: ''
        });
      }

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
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
             <div>
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                    {isAdmin ? 'Manage Appointments' : 'Book Your Appointment'}
                </h1>
                <p className="text-gray-500 mt-1 text-sm font-medium">
                    {isAdmin ? 'Records are tracked by Unique MRN' : `Welcome, ${currentUser.full_name}. Appointments are linked to your MRN.`}
                </p>
             </div>
             
             <div className="flex items-center gap-3">
                <div className="bg-white border border-gray-200 rounded-xl px-4 py-2.5 flex items-center gap-3 shadow-sm">
                    <span className="text-sm font-semibold text-gray-500">Date:</span>
                    <input 
                        type="date" 
                        value={filterDate} 
                        onChange={(e) => setFilterDate(e.target.value)}
                        className="outline-none text-sm font-bold text-cyan-700 bg-transparent cursor-pointer"
                    />
                </div>
                <button 
                  onClick={() => setShowBookingForm(!showBookingForm)}
                  className="bg-cyan-700 hover:bg-cyan-800 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-cyan-700/20 transition-all flex items-center gap-2"
                >
                  <Plus size={18} />
                  <span>{showBookingForm ? 'Close' : 'New Appointment'}</span>
                </button>
             </div>
        </div>

        {showBookingForm && (
            <div className="bg-white rounded-2xl shadow-xl border border-cyan-100 overflow-hidden animate-in slide-in-from-top duration-300">
                <div className="p-8">
                     <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-gray-900">Patient Details</h2>
                        {(selectedPatientId || !isAdmin) && (
                            <div className="flex items-center gap-2 text-xs bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-full font-black uppercase tracking-widest border border-emerald-100">
                                <CheckCircle2 size={14} /> Account Identified
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
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Unique MR No.</label>
                                <input 
                                    name="mrn" 
                                    value={formData.mrn} 
                                    onChange={handleInputChange} 
                                    readOnly={!isAdmin}
                                    type="text" 
                                    placeholder="e.g. 1" 
                                    className={`w-full border border-gray-200 rounded-xl p-3 outline-none transition-all font-mono font-bold ${!isAdmin ? 'bg-gray-50 text-gray-400' : 'focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500'}`} 
                                />
                            </div>
                            <div className="space-y-1.5 md:col-span-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Patient Name</label>
                                <input 
                                    required 
                                    name="name" 
                                    value={formData.name} 
                                    onChange={handleInputChange} 
                                    readOnly={!isAdmin || selectedPatientId !== null}
                                    type="text" 
                                    className={`w-full border border-gray-200 rounded-xl p-3 outline-none transition-all font-bold ${(!isAdmin || selectedPatientId) ? 'bg-gray-50 text-gray-600' : 'focus:ring-2 focus:ring-cyan-500'}`} 
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Phone</label>
                                <input 
                                    required 
                                    name="phone" 
                                    value={formData.phone} 
                                    onChange={handleInputChange} 
                                    type="tel" 
                                    readOnly={!isAdmin || selectedPatientId !== null}
                                    className={`w-full border border-gray-200 rounded-xl p-3 outline-none transition-all ${(!isAdmin || selectedPatientId) ? 'bg-gray-50 text-gray-600' : 'focus:ring-2 focus:ring-cyan-500'}`} 
                                />
                            </div>
                        </div>

                        <div className="h-px bg-gray-100"></div>

                        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                            <div className="space-y-1.5 md:col-span-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Consulting Doctor</label>
                                <select required name="doctorId" value={formData.doctorId} onChange={handleInputChange} className="w-full border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-cyan-500 outline-none transition-all font-bold text-gray-700">
                                    <option value="">Select Doctor</option>
                                    {doctors.filter(d => d.active === 'Y').map(d => (
                                        <option key={d.doctor_id} value={d.doctor_id}>{d.full_name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Date</label>
                                <input required name="date" value={formData.date} onChange={handleInputChange} type="date" className="w-full border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-cyan-500 outline-none transition-all font-bold" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Time</label>
                                <input required name="time" value={formData.time} onChange={handleInputChange} type="time" className="w-full border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-cyan-500 outline-none transition-all font-bold" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Age</label>
                                <input required name="age" value={formData.age} onChange={handleInputChange} type="number" className="w-full border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-cyan-500 outline-none transition-all font-bold" />
                            </div>
                        </div>
                        
                        <div className="flex justify-end gap-3 pt-4 border-t border-gray-50">
                            <button type="button" onClick={() => setShowBookingForm(false)} className="px-8 py-3 text-gray-400 font-black uppercase tracking-widest text-[10px] hover:bg-gray-50 rounded-xl transition-all">Cancel</button>
                            <button 
                                type="submit" 
                                disabled={loading} 
                                className="px-12 py-3 bg-cyan-700 text-white font-black uppercase tracking-widest text-[10px] rounded-xl shadow-xl shadow-cyan-700/20 hover:bg-cyan-800 transition-all transform active:scale-95 disabled:opacity-50"
                            >
                                {loading ? 'Saving...' : 'Confirm Appointment'}
                            </button>
                        </div>
                     </form>
                </div>
            </div>
        )}

        <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                            <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">Time / Ref</th>
                            <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">Unique MRN</th>
                            <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">Patient</th>
                            <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">Doctor</th>
                            <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">Status</th>
                            <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                    {filteredAppts.length === 0 ? (
                        <tr>
                            <td colSpan={6} className="px-8 py-24 text-center">
                                <Calendar size={48} className="text-gray-100 mx-auto mb-4" />
                                <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">No records for {new Date(filterDate).toLocaleDateString('en-GB')}</p>
                            </td>
                        </tr>
                    ) : (
                        filteredAppts.map(appt => {
                        // FIX: Ensure comparison is done via MRN which is unique
                        const isOwnAppt = !isAdmin && appt.mrn === currentUser.mrn;
                        const isCheckingIn = processingId === appt.appt_id;
                        const isAlreadyChecked = appt.status === 'CHECKED_IN' || appt.status === 'IN_PROGRESS' || appt.status === 'COMPLETED';
                        
                        return (
                        <tr key={appt.appt_id} className={`hover:bg-cyan-50/20 transition-all ${isOwnAppt ? 'bg-cyan-50/40 border-l-4 border-cyan-600' : ''}`}>
                            <td className="px-8 py-6">
                                <div className="text-sm font-black text-gray-800">
                                    {new Date(appt.scheduled_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                </div>
                                <div className="text-[9px] font-mono text-cyan-600 font-bold mt-1 uppercase tracking-tighter">{appt.appt_no}</div>
                            </td>

                            <td className="px-8 py-6">
                                <span className={`text-[10px] px-3 py-1.5 rounded-xl font-black border uppercase tracking-widest ${
                                    isOwnAppt ? 'bg-cyan-700 text-white border-cyan-700' : 'bg-white text-cyan-700 border-cyan-100'
                                } shadow-sm`}>
                                    {appt.mrn}
                                </span>
                            </td>
                            
                            <td className="px-8 py-6">
                                <div className="flex items-center gap-4">
                                    <div className={`h-10 w-10 rounded-2xl flex items-center justify-center font-black text-sm ${
                                        isOwnAppt ? 'bg-cyan-700 text-white shadow-lg shadow-cyan-700/20' : 'bg-gray-100 text-gray-400'
                                    }`}>
                                        {appt.patient_name?.charAt(0)}
                                    </div>
                                    <div>
                                        <div className="text-sm font-black text-gray-900 uppercase tracking-tight">
                                            {isOwnAppt ? (isAdmin ? appt.patient_name : 'YOU') : (isAdmin ? appt.patient_name : 'Patient Record')}
                                        </div>
                                        <div className="text-[10px] text-gray-400 font-bold mt-1">
                                            {isAdmin || isOwnAppt ? appt.mobile_no : '***-*******'}
                                        </div>
                                    </div>
                                </div>
                            </td>
                            
                            <td className="px-8 py-6">
                                <div className="text-sm font-bold text-gray-800">{appt.doctor_name}</div>
                                <div className="text-[10px] text-cyan-600 font-black uppercase tracking-widest mt-1 opacity-60">{appt.specialty}</div>
                            </td>
                            
                            <td className="px-8 py-6">
                                <span className={`px-4 py-1.5 text-[9px] font-black tracking-[0.15em] uppercase rounded-full border ${
                                    appt.status === 'SCHEDULED' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                    appt.status === 'CHECKED_IN' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                    appt.status === 'COMPLETED' ? 'bg-gray-50 text-gray-500 border-gray-100' :
                                    'bg-amber-50 text-amber-600 border-amber-100'
                                }`}>
                                    {appt.status.replace('_', ' ')}
                                </span>
                            </td>
                            
                            <td className="px-8 py-6">
                                {isAdmin ? (
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={() => handleStatusChange(appt.appt_id, 'CHECKED_IN')}
                                            disabled={isAlreadyChecked || isCheckingIn}
                                            className={`flex items-center gap-2 px-6 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-sm transition-all transform active:scale-95 ${
                                                isAlreadyChecked 
                                                ? 'bg-gray-100 text-gray-300 border border-gray-100 cursor-not-allowed' 
                                                : 'bg-[#017b5e] text-white hover:bg-[#01654e] shadow-lg shadow-[#017b5e]/20'
                                            }`}
                                        >
                                            {isCheckingIn ? (
                                                <Loader2 size={14} className="animate-spin" />
                                            ) : (
                                                <CheckCircle2 size={14} />
                                            )}
                                            <span>{isAlreadyChecked ? 'Finalized' : 'Check In'}</span>
                                        </button>
                                        <button className="p-2 text-gray-300 hover:text-cyan-600 hover:bg-cyan-50 rounded-xl transition-all"><Edit3 size={16}/></button>
                                        <button className="p-2 text-gray-300 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={16}/></button>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 text-gray-200 italic text-xs font-medium">
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
