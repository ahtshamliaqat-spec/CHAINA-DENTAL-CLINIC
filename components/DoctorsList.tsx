import React, { useEffect, useState } from 'react';
import { Search, Plus, User, Stethoscope, Image as ImageIcon, Upload, X } from 'lucide-react';
import { Doctor } from '../types';
import { ClinicService } from '../services/api';

const DoctorsList: React.FC = () => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  
  // Form State
  const [newDoctor, setNewDoctor] = useState<Partial<Doctor>>({
    full_name: 'Dr. ', // Pre-filled
    specialty: '',
    doctor_code: '',
    image: '',
    active: 'Y'
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    ClinicService.getDoctors().then(setDoctors);
  };

  const filteredDoctors = doctors.filter(d => 
    d.full_name.toLowerCase().includes(search.toLowerCase()) || 
    d.specialty.toLowerCase().includes(search.toLowerCase())
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("File size should be less than 2MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewDoctor({ ...newDoctor, image: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = () => {
    setNewDoctor({ ...newDoctor, image: '' });
  };

  const handleAddDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newDoctor.full_name && newDoctor.specialty && newDoctor.doctor_code) {
      await ClinicService.addDoctor({
        full_name: newDoctor.full_name,
        specialty: newDoctor.specialty,
        doctor_code: newDoctor.doctor_code,
        active: 'Y',
        image: newDoctor.image || undefined // Send undefined if empty string
      });
      setShowModal(false);
      // Reset form but keep Dr.
      setNewDoctor({ full_name: 'Dr. ', specialty: '', doctor_code: '', image: '', active: 'Y' });
      loadData();
    }
  };

  const handleToggleStatus = async (id: number, currentStatus: 'Y' | 'N') => {
      const newStatus = currentStatus === 'Y' ? 'N' : 'Y';
      await ClinicService.updateDoctor(id, { active: newStatus });
      loadData();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Doctors</h1>
          <p className="text-gray-500">Manage medical staff and profiles</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center space-x-2 bg-cyan-700 hover:bg-cyan-800 text-white px-4 py-2.5 rounded-lg transition-colors shadow-sm"
        >
          <Plus size={18} />
          <span>Add Doctor</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text" 
            placeholder="Search doctor by name or specialty..." 
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Grid of Doctors */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredDoctors.map(doc => (
            <div key={doc.doctor_id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow group">
                <div className="h-48 w-full bg-gray-100 relative overflow-hidden">
                    {doc.image ? (
                        <img 
                            src={doc.image} 
                            alt={doc.full_name} 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-400">
                            <User size={64} />
                        </div>
                    )}
                    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded text-xs font-bold text-cyan-700 shadow-sm">
                        {doc.doctor_code}
                    </div>
                </div>
                
                <div className="p-5">
                    <h3 className="text-lg font-bold text-gray-800 mb-1">{doc.full_name}</h3>
                    <div className="flex items-center text-cyan-600 font-medium text-sm mb-4">
                        <Stethoscope size={14} className="mr-1.5" />
                        {doc.specialty}
                    </div>
                    
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                         <button 
                             onClick={() => handleToggleStatus(doc.doctor_id, doc.active)}
                             title="Click to toggle status"
                             className={`px-3 py-1 text-xs rounded-full font-semibold border transition-all active:scale-95 ${
                                 doc.active === 'Y' 
                                 ? 'bg-green-100 text-green-700 border-green-200 hover:bg-green-200' 
                                 : 'bg-red-100 text-red-700 border-red-200 hover:bg-red-200'
                             }`}>
                             {doc.active === 'Y' ? 'Active' : 'Inactive'}
                         </button>
                         <button className="text-sm text-gray-400 hover:text-cyan-700">View Profile</button>
                    </div>
                </div>
            </div>
        ))}
      </div>

      {/* Add Doctor Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
              <h3 className="font-semibold text-lg text-gray-800">Add New Doctor</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleAddDoctor} className="p-6 space-y-5">
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-gray-700">Doctor Name <span className="text-red-500">*</span></label>
                <input 
                  required 
                  type="text" 
                  className="w-full border border-gray-300 rounded-xl p-2.5 focus:ring-2 focus:ring-cyan-500 outline-none transition-all" 
                  placeholder="e.g. Dr. John Doe"
                  value={newDoctor.full_name}
                  onChange={e => setNewDoctor({...newDoctor, full_name: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <label className="text-sm font-bold text-gray-700">Doctor Code <span className="text-red-500">*</span></label>
                    <input 
                      required 
                      type="text" 
                      className="w-full border border-gray-300 rounded-xl p-2.5 focus:ring-2 focus:ring-cyan-500 outline-none transition-all" 
                      placeholder="e.g. DOC005"
                      value={newDoctor.doctor_code}
                      onChange={e => setNewDoctor({...newDoctor, doctor_code: e.target.value})}
                    />
                </div>
                <div className="space-y-1.5">
                    <label className="text-sm font-bold text-gray-700">Specialty <span className="text-red-500">*</span></label>
                    <input 
                      required 
                      type="text" 
                      className="w-full border border-gray-300 rounded-xl p-2.5 focus:ring-2 focus:ring-cyan-500 outline-none transition-all" 
                      placeholder="e.g. Orthodontist"
                      value={newDoctor.specialty}
                      onChange={e => setNewDoctor({...newDoctor, specialty: e.target.value})}
                    />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                    <ImageIcon size={16}/> Profile Photo
                </label>
                
                <div className="flex items-center gap-4">
                    {newDoctor.image ? (
                        <div className="relative group/img shrink-0">
                            <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-cyan-100 shadow-sm">
                                <img src={newDoctor.image} alt="Preview" className="w-full h-full object-cover" />
                            </div>
                            <button 
                                type="button"
                                onClick={removePhoto}
                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition-colors"
                            >
                                <X size={12} />
                            </button>
                        </div>
                    ) : (
                        <div className="w-20 h-20 rounded-2xl bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center text-gray-300 shrink-0">
                            <User size={32} />
                        </div>
                    )}
                    
                    <label className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-2xl p-4 hover:border-cyan-500 hover:bg-cyan-50/30 cursor-pointer transition-all group">
                        <Upload size={20} className="text-gray-400 group-hover:text-cyan-600 mb-1 transition-colors" />
                        <span className="text-[11px] text-gray-500 group-hover:text-cyan-700 font-bold uppercase tracking-wider transition-colors">
                            Click to Upload Photo
                        </span>
                        <input 
                            type="file" 
                            className="hidden" 
                            accept="image/*"
                            onChange={handleFileChange}
                        />
                    </label>
                </div>
                <p className="text-[10px] text-gray-400 italic">Recommended: Square photo, Max 2MB (JPEG, PNG)</p>
              </div>

              <div className="pt-4 flex justify-end space-x-3">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)} 
                  className="px-5 py-2.5 text-gray-600 font-semibold hover:bg-gray-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-6 py-2.5 bg-cyan-700 text-white font-bold rounded-xl hover:bg-cyan-800 transition-all shadow-lg shadow-cyan-700/20 active:scale-95"
                >
                  Save Doctor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorsList;