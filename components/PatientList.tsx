
import React, { useEffect, useState } from 'react';
import { Search, Plus, User, FileText, Phone, MapPin, Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import { Patient, Appointment } from '../types';
import { ClinicService } from '../services/api';

const PatientList: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [allAppointments, setAllAppointments] = useState<Appointment[]>([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  
  const [newPatient, setNewPatient] = useState<Partial<Patient>>({
    gender: 'Male',
    dob: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    ClinicService.getPatients().then(setPatients);
    ClinicService.getAppointments().then(setAllAppointments);
  };

  const filteredPatients = patients.filter(p => 
    p.full_name.toLowerCase().includes(search.toLowerCase()) || 
    p.mrn.toLowerCase().includes(search.toLowerCase())
  );

  const toggleExpand = (id: number) => {
    setExpandedId(expandedId === id ? null : id);
  };

  // Helper to display YYYY-MM-DD as DD/MM/YYYY
  const formatDateDisplay = (isoDate?: string) => {
    if (!isoDate) return '';
    const date = new Date(isoDate);
    // Use en-GB for DD/MM/YYYY
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPatient.full_name && newPatient.mobile_no && newPatient.dob) {
      const mrn = `MRN${String(patients.length + 1).padStart(4, '0')}`;
      
      // Convert DD/MM/YYYY input to YYYY-MM-DD for backend storage
      let dobForStorage = newPatient.dob;
      if (newPatient.dob.includes('/')) {
          const parts = newPatient.dob.split('/');
          if (parts.length === 3) {
              // Input: 25/12/1990 -> Storage: 1990-12-25
              dobForStorage = `${parts[2]}-${parts[1]}-${parts[0]}`;
          }
      }

      await ClinicService.registerPatient({
        mrn,
        full_name: newPatient.full_name!,
        father_name: newPatient.father_name || '',
        dob: dobForStorage,
        gender: newPatient.gender as any,
        mobile_no: newPatient.mobile_no!,
        address: newPatient.address || ''
      });
      setShowModal(false);
      setNewPatient({ gender: 'Male', dob: '' });
      loadData();
    }
  };

  const handleDobInputChange = (value: string) => {
    setNewPatient({...newPatient, dob: value});
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Patients</h1>
          <p className="text-gray-500">Manage patient records and registration</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center space-x-2 bg-cyan-700 hover:bg-cyan-800 text-white px-4 py-2.5 rounded-lg transition-colors shadow-sm"
        >
          <Plus size={18} />
          <span>Register Patient</span>
        </button>
      </div>

      {/* Search & Filter */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text" 
            placeholder="Search by Name or MRN..." 
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPatients.map(patient => {
            const patientAppts = allAppointments.filter(a => a.patient_id === patient.patient_id);
            const isExpanded = expandedId === patient.patient_id;

            return (
              <div key={patient.patient_id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                <div className="p-5">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-500">
                        <User size={24} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-800">{patient.full_name}</h3>
                        <p className="text-xs text-cyan-600 font-medium bg-cyan-50 px-2 py-0.5 rounded inline-block mt-1">
                          {patient.mrn}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs text-gray-400">{patient.gender}</span>
                  </div>
                  
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center space-x-2">
                      <FileText size={16} className="text-gray-400" />
                      <span>Born: {formatDateDisplay(patient.dob)}</span>
                    </div>
                    {/* Contact removed from patient detail card for privacy */}
                    <div className="flex items-center space-x-2">
                      <MapPin size={16} className="text-gray-400" />
                      <span className="truncate">{patient.address}</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <button 
                        onClick={() => toggleExpand(patient.patient_id)}
                        className="w-full flex justify-between items-center text-sm font-medium text-cyan-700 hover:text-cyan-800 transition-colors"
                    >
                        <span>Appointment History ({patientAppts.length})</span>
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                  </div>
                </div>

                {/* History Dropdown */}
                {isExpanded && (
                    <div className="bg-gray-50 p-4 border-t border-gray-100 text-sm">
                        {patientAppts.length === 0 ? (
                            <p className="text-gray-500 italic text-center">No appointments found.</p>
                        ) : (
                            <ul className="space-y-3">
                                {patientAppts.map(appt => (
                                    <li key={appt.appt_id} className="bg-white p-2 rounded border border-gray-200">
                                        <div className="flex justify-between text-gray-800 font-medium">
                                            <span>{new Date(appt.scheduled_at).toLocaleDateString('en-GB')}</span>
                                            <span className={`text-xs px-1.5 py-0.5 rounded ${
                                                appt.status === 'COMPLETED' ? 'bg-gray-100 text-gray-600' : 'bg-green-100 text-green-700'
                                            }`}>
                                                {appt.status}
                                            </span>
                                        </div>
                                        <div className="text-xs text-gray-500 mt-1 flex justify-between">
                                            <span>{appt.doctor_name}</span>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                )}
              </div>
            );
        })}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
              <h3 className="font-semibold text-lg text-gray-800">New Patient Registration</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">&times;</button>
            </div>
            
            <form onSubmit={handleRegister} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Full Name</label>
                  <input required type="text" className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-cyan-500 outline-none" 
                    onChange={e => setNewPatient({...newPatient, full_name: e.target.value})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Father/Husband Name</label>
                  <input type="text" className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-cyan-500 outline-none" 
                     onChange={e => setNewPatient({...newPatient, father_name: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Mobile No</label>
                  <input required type="text" className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-cyan-500 outline-none" 
                     onChange={e => setNewPatient({...newPatient, mobile_no: e.target.value})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Gender</label>
                  <select className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-cyan-500 outline-none"
                    onChange={e => setNewPatient({...newPatient, gender: e.target.value as any})}
                    value={newPatient.gender}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Date of Birth (DD/MM/YYYY)</label>
                <input 
                   required 
                   type="text" 
                   placeholder="DD/MM/YYYY" 
                   className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-cyan-500 outline-none" 
                   value={newPatient.dob}
                   onChange={e => handleDobInputChange(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Address</label>
                <textarea className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-cyan-500 outline-none h-20"
                   onChange={e => setNewPatient({...newPatient, address: e.target.value})}
                ></textarea>
              </div>

              <div className="pt-4 flex justify-end space-x-3">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-cyan-700 text-white rounded-lg hover:bg-cyan-800 transition-colors">Register</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientList;
