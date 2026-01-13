
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clipboard, Stethoscope, Save, DollarSign, Pill, Plus, Loader2, CheckCircle, Info, FileText, AlertTriangle, X, Trash2, Edit } from 'lucide-react';
import { Appointment, Visit, Procedure, VisitItem, Prescription } from '../types';
import { ClinicService } from '../services/api';

const ClinicalView: React.FC = () => {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [activeAppt, setActiveAppt] = useState<Appointment | null>(null);
  const [currentVisit, setCurrentVisit] = useState<Visit | null>(null);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'info'} | null>(null);
  
  // Visit Form State
  const [complaint, setComplaint] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  
  // Procedure Form State
  const [selectedProc, setSelectedProc] = useState('');
  const [procPrice, setProcPrice] = useState<number>(0);
  const [editingItemId, setEditingItemId] = useState<number | null>(null);

  // Prescription Form State
  const [medName, setMedName] = useState('');
  const [medInstructions, setMedInstructions] = useState('');
  const [editingRxId, setEditingRxId] = useState<number | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const allAppts = await ClinicService.getAppointments();
    setAppointments(allAppts.filter(a => ['CHECKED_IN', 'IN_PROGRESS'].includes(a.status)));
    setProcedures(await ClinicService.getProcedures());
  };

  const showNotification = (message: string, type: 'success' | 'info' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleSelectPatient = async (appt: Appointment) => {
    setActiveAppt(appt);
    let visit = await ClinicService.getVisitByApptId(appt.appt_id);
    
    if (!visit && appt.status === 'CHECKED_IN') {
      visit = await ClinicService.startVisit(appt.appt_id, '');
    }
    
    if (visit) {
        setCurrentVisit(visit);
        setComplaint(visit.complaint || '');
        setDiagnosis(visit.diagnosis || '');
    }
  };

  const handleProcChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const procId = e.target.value;
      setSelectedProc(procId);
      if (procId) {
          const proc = procedures.find(p => p.procedure_id === parseInt(procId));
          if (proc) setProcPrice(proc.price);
      } else {
          setProcPrice(0);
      }
  };

  const handleAddOrUpdateProcedure = async () => {
    if (currentVisit && selectedProc) {
      if (editingItemId) {
          await ClinicService.deleteVisitItem(currentVisit.visit_id, editingItemId);
      }
      await ClinicService.addVisitItem(currentVisit.visit_id, parseInt(selectedProc), procPrice);
      const updated = await ClinicService.getVisitByApptId(activeAppt!.appt_id);
      setCurrentVisit(updated || null);
      setSelectedProc('');
      setProcPrice(0);
      setEditingItemId(null);
      showNotification(editingItemId ? 'Procedure updated.' : 'Procedure added to bill.');
    }
  };

  const handleDeleteProcedure = async (itemId: number) => {
      if (currentVisit) {
          await ClinicService.deleteVisitItem(currentVisit.visit_id, itemId);
          const updated = await ClinicService.getVisitByApptId(activeAppt!.appt_id);
          setCurrentVisit(updated || null);
          showNotification('Procedure removed from bill.');
      }
  };

  const handleEditProcedure = (item: VisitItem) => {
      setSelectedProc(item.procedure_id.toString());
      setProcPrice(item.amount);
      setEditingItemId(item.item_id);
  };

  const handleAddOrUpdatePrescription = async () => {
      if (currentVisit && medName) {
          if (editingRxId) {
              await ClinicService.updatePrescription(editingRxId, medName, medInstructions);
          } else {
              await ClinicService.addPrescription(currentVisit.visit_id, medName, medInstructions);
          }
          const updated = await ClinicService.getVisitByApptId(activeAppt!.appt_id);
          setCurrentVisit(updated || null);
          setMedName('');
          setMedInstructions('');
          setEditingRxId(null);
          showNotification(editingRxId ? 'Rx updated.' : 'Medication added to Rx.');
      }
  };

  const handleDeletePrescription = async (rxId: number) => {
      await ClinicService.deletePrescription(rxId);
      const updated = await ClinicService.getVisitByApptId(activeAppt!.appt_id);
      setCurrentVisit(updated || null);
      showNotification('Prescription removed.');
  };

  const handleEditPrescription = (rx: Prescription) => {
      setMedName(rx.medication);
      setMedInstructions(rx.instructions);
      setEditingRxId(rx.rx_id);
  };

  const handleSaveNotes = async () => {
    if (currentVisit) {
      const updated = await ClinicService.updateVisit(currentVisit.visit_id, {
        complaint,
        diagnosis
      });
      setCurrentVisit(updated);
      showNotification('Clinical notes saved as draft.', 'info');
    }
  };

  const handleFinalize = async () => {
    if (!currentVisit) return;
    setIsFinalizing(true);
    setShowConfirmModal(false);
    
    try {
        await ClinicService.updateVisit(currentVisit.visit_id, { 
          complaint, 
          diagnosis,
          status: 'BILLED'
        });
        
        const invoice = await ClinicService.finalizeVisitAndInvoice(currentVisit.visit_id);
        showNotification('Session Finalized. Generating PDF...');
        
        setTimeout(() => {
          navigate('/billing', { 
            state: { 
              openInvoiceId: invoice.invoice_id,
              autoPrint: true 
            } 
          });
        }, 800);

    } catch (err) {
        console.error("Finalization Error:", err);
        showNotification('Error finalizing clinical record.', 'info');
    } finally {
        setIsFinalizing(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row gap-6 h-[calc(100vh-8rem)] relative">
      {notification && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-top-4 fade-in duration-300">
          <div className={`px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border ${
            notification.type === 'success' 
            ? 'bg-emerald-600 text-white border-emerald-500' 
            : 'bg-cyan-700 text-white border-cyan-600'
          }`}>
            {notification.type === 'success' ? <CheckCircle size={18} /> : <Info size={18} />}
            <span className="text-sm font-bold uppercase tracking-wider">{notification.message}</span>
          </div>
        </div>
      )}

      <div className="w-full md:w-1/3 bg-white/80 backdrop-blur-md rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
        <div className="p-5 border-b border-gray-100 bg-gray-50/80">
          <h2 className="font-bold text-gray-800 uppercase tracking-wider text-sm">Consultation Queue</h2>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Ready for Doctor</p>
        </div>
        <div className="flex-1 overflow-y-auto">
          {appointments.length === 0 ? (
            <div className="p-12 text-center text-gray-400">
                <Clipboard size={32} className="mx-auto mb-2 opacity-20" />
                <p className="text-sm">No patients waiting in queue.</p>
            </div>
          ) : (
            appointments.map(appt => (
              <div 
                key={appt.appt_id} 
                onClick={() => handleSelectPatient(appt)}
                className={`p-5 border-b border-gray-100 cursor-pointer transition-all ${
                  activeAppt?.appt_id === appt.appt_id ? 'bg-cyan-50/50 border-l-4 border-l-cyan-600' : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-gray-900">{appt.patient_name}</h3>
                    <p className="text-[10px] text-cyan-600 font-black tracking-widest mt-0.5">{appt.mrn}</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[9px] uppercase font-black tracking-widest ${
                    appt.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                  }`}>
                    {appt.status.replace('_', ' ')}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="flex-1 bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200 overflow-hidden flex flex-col">
        {!activeAppt ? (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-12">
            <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                <Stethoscope size={48} className="text-gray-200" />
            </div>
            <h3 className="text-lg font-bold text-gray-700">Patient File</h3>
            <p className="text-sm mt-1 max-w-xs text-center leading-relaxed">Select a patient to record symptoms, treatments, and prescriptions.</p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col h-full overflow-hidden animate-in fade-in duration-300">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-cyan-700 text-white flex items-center justify-center font-black text-lg shadow-lg">
                      {activeAppt.patient_name?.charAt(0)}
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-gray-900 leading-none">{activeAppt.patient_name}</h2>
                    <p className="text-[10px] text-cyan-600 font-black tracking-[0.2em] mt-2 uppercase">{activeAppt.mrn} • {activeAppt.doctor_name}</p>
                  </div>
              </div>
              <div className="text-right">
                 <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Visit ID</p>
                 <p className="font-mono text-cyan-700 font-bold mt-1">V-{String(currentVisit?.visit_id).padStart(5, '0')}</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Symptoms / Complaint</label>
                  <textarea 
                    className="w-full h-32 p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-cyan-500/10 focus:border-cyan-500 outline-none transition-all text-sm"
                    placeholder="Enter patient complaints..."
                    value={complaint}
                    onChange={(e) => setComplaint(e.target.value)}
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Diagnosis / Findings</label>
                  <textarea 
                    className="w-full h-32 p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-cyan-500/10 focus:border-cyan-500 outline-none transition-all text-sm"
                    placeholder="Enter clinical findings..."
                    value={diagnosis}
                    onChange={(e) => setDiagnosis(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="flex justify-end">
                  <button onClick={handleSaveNotes} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-cyan-700 hover:bg-cyan-50 px-4 py-2 rounded-xl">
                      <Save size={14} /> <span>Save Draft</span>
                  </button>
              </div>

              <div className="h-px bg-gray-100"></div>

              <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-cyan-100 text-cyan-700 rounded-lg"><DollarSign size={18} /></div>
                        <h3 className="font-black text-gray-900 uppercase tracking-widest text-sm">Treatments & Billing</h3>
                    </div>
                </div>
                
                <div className="flex flex-wrap gap-4 items-end bg-gray-50 p-6 rounded-2xl">
                    <div className="flex-1 min-w-[200px] space-y-2">
                        <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Select Procedure</label>
                        <select 
                            className="w-full bg-white border border-gray-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-cyan-500 text-sm"
                            value={selectedProc}
                            onChange={handleProcChange}
                        >
                            <option value="">Choose Treatment...</option>
                            {procedures.map(p => (
                                <option key={p.procedure_id} value={p.procedure_id}>{p.proc_name} (Rs. {p.price})</option>
                            ))}
                        </select>
                    </div>
                    <div className="w-32 space-y-2">
                        <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Final Price</label>
                        <input 
                            type="number" 
                            className="w-full bg-white border border-gray-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-cyan-500 text-sm font-bold"
                            value={procPrice}
                            onChange={(e) => setProcPrice(parseFloat(e.target.value))}
                        />
                    </div>
                    <button 
                        onClick={handleAddOrUpdateProcedure}
                        disabled={!selectedProc}
                        className={`${editingItemId ? 'bg-amber-600' : 'bg-cyan-700'} text-white px-8 py-3 rounded-xl font-black uppercase tracking-widest text-[10px] hover:opacity-90 disabled:bg-gray-200`}
                    >
                        {editingItemId ? 'Update Item' : 'Add Procedure'}
                    </button>
                    {editingItemId && (
                        <button onClick={() => { setEditingItemId(null); setSelectedProc(''); setProcPrice(0); }} className="px-4 py-3 text-[10px] font-black uppercase text-gray-400">Cancel</button>
                    )}
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 text-[10px] font-black uppercase tracking-widest text-gray-400">
                            <tr>
                                <th className="px-6 py-4 text-left">Treatment</th>
                                <th className="px-6 py-4 text-right">Price</th>
                                <th className="px-6 py-4 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {currentVisit?.items?.length === 0 ? (
                                <tr><td colSpan={3} className="px-6 py-10 text-center text-gray-400 italic">No items added.</td></tr>
                            ) : (
                                currentVisit?.items?.map(item => (
                                    <tr key={item.item_id}>
                                        <td className="px-6 py-4 font-bold text-gray-800">{item.proc_name}</td>
                                        <td className="px-6 py-4 text-right font-black text-cyan-700">Rs. {item.amount.toLocaleString()}</td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <button onClick={() => handleEditProcedure(item)} className="p-1.5 text-amber-500 hover:bg-amber-50 rounded-lg"><Edit size={14}/></button>
                                                <button onClick={() => handleDeleteProcedure(item.item_id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={14}/></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                            <tr className="bg-cyan-50/30">
                                <td colSpan={2} className="px-6 py-5 text-right text-[11px] font-black uppercase text-gray-500">Total Bill:</td>
                                <td className="px-6 py-5 text-center font-black text-xl text-cyan-800">Rs. {(currentVisit?.total_amount || 0).toLocaleString()}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
              </div>

              <div className="space-y-6">
                  <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-100 text-purple-700 rounded-lg"><Pill size={18} /></div>
                      <h3 className="font-black text-gray-900 uppercase tracking-widest text-sm">Prescription (Rx)</h3>
                  </div>
                  <div className="flex flex-wrap gap-4 items-end bg-gray-50 p-6 rounded-2xl">
                      <div className="flex-1 min-w-[200px] space-y-2">
                          <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Medicine Name</label>
                          <input 
                              type="text" 
                              className="w-full bg-white border border-gray-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                              placeholder="e.g. Paracetamol 500mg"
                              value={medName}
                              onChange={(e) => setMedName(e.target.value)}
                          />
                      </div>
                      <div className="flex-1 min-w-[200px] space-y-2">
                          <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Dosage/Instructions</label>
                          <input 
                              type="text" 
                              className="w-full bg-white border border-gray-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                              placeholder="e.g. 1-0-1 After meal"
                              value={medInstructions}
                              onChange={(e) => setMedInstructions(e.target.value)}
                          />
                      </div>
                      <button 
                          onClick={handleAddOrUpdatePrescription}
                          disabled={!medName}
                          className={`${editingRxId ? 'bg-amber-600' : 'bg-purple-700'} text-white px-8 py-3 rounded-xl font-black uppercase tracking-widest text-[10px] hover:opacity-90 disabled:bg-gray-200`}
                      >
                          {editingRxId ? 'Update Rx' : 'Add Rx'}
                      </button>
                      {editingRxId && (
                          <button onClick={() => { setEditingRxId(null); setMedName(''); setMedInstructions(''); }} className="px-4 py-3 text-[10px] font-black uppercase text-gray-400">Cancel</button>
                      )}
                  </div>
                  <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                      <ul className="divide-y divide-gray-50">
                          {currentVisit?.prescriptions?.length === 0 ? (
                              <li className="p-8 text-center text-gray-400 italic">No medicines prescribed.</li>
                          ) : (
                              currentVisit?.prescriptions?.map((rx, idx) => (
                                  <li key={rx.rx_id} className="p-5 flex justify-between items-center hover:bg-gray-50 transition-colors">
                                      <div className="flex items-center gap-4">
                                          <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center text-[10px] font-black text-purple-600">{idx + 1}</div>
                                          <div>
                                              <p className="font-bold text-gray-800">{rx.medication}</p>
                                              <p className="text-xs text-gray-500 font-medium">{rx.instructions}</p>
                                          </div>
                                      </div>
                                      <div className="flex items-center gap-2">
                                          <button onClick={() => handleEditPrescription(rx)} className="p-1.5 text-amber-500 hover:bg-amber-50 rounded-lg"><Edit size={14}/></button>
                                          <button onClick={() => handleDeletePrescription(rx.rx_id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={14}/></button>
                                      </div>
                                  </li>
                              ))
                          )}
                      </ul>
                  </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 bg-white/80 backdrop-blur-md flex justify-between items-center">
                <button 
                    onClick={() => setShowConfirmModal(true)}
                    disabled={isFinalizing}
                    className="flex items-center gap-4 bg-[#017b5e] hover:bg-[#01654e] text-white px-10 py-4 rounded-2xl font-black uppercase tracking-[0.15em] shadow-xl shadow-[#017b5e]/20 transition-all transform active:scale-95 disabled:opacity-50"
                >
                    {isFinalizing ? (
                        <>
                            <Loader2 size={20} className="animate-spin" />
                            <span>Generating PDF...</span>
                        </>
                    ) : (
                        <>
                            <CheckCircle size={20} />
                            <span>Finalize & Print Invoice</span>
                        </>
                    )}
                </button>
            </div>
          </div>
        )}
      </div>

      {showConfirmModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-[2rem] shadow-2xl max-w-md w-full overflow-hidden border border-gray-100 animate-in zoom-in-95 duration-200">
            <div className="p-8 text-center">
              <div className="w-20 h-20 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertTriangle size={40} />
              </div>
              <h3 className="text-2xl font-black text-gray-900 mb-2 uppercase tracking-tight">Finalize Visit?</h3>
              <p className="text-gray-500 leading-relaxed mb-8">
                This will lock the clinical notes and generate the official invoice for <strong>{activeAppt?.patient_name}</strong>.
              </p>
              
              <div className="flex gap-4">
                <button 
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1 px-6 py-4 rounded-2xl font-black uppercase tracking-widest text-gray-400 bg-gray-50 hover:bg-gray-100 transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleFinalize}
                  className="flex-1 px-6 py-4 rounded-2xl font-black uppercase tracking-widest text-white bg-emerald-600 hover:bg-emerald-700 shadow-xl shadow-emerald-600/20 transition-all"
                >
                  Yes, Finalize
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClinicalView;
