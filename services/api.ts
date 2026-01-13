
import { 
  Appointment, Patient, Doctor, Procedure, Visit, VisitItem, Invoice,
  AppointmentStatus, Prescription, InvoiceDetails, User, UserRole
} from '../types';
import { MOCK_PATIENTS, MOCK_DOCTORS, MOCK_PROCEDURES, MOCK_APPOINTMENTS, MOCK_VISITS, MOCK_INVOICES, MOCK_USERS } from './mockData';

// Simulating database state in memory
let patients = [...MOCK_PATIENTS];
let doctors = [...MOCK_DOCTORS];
let appointments = [...MOCK_APPOINTMENTS];
let visits = [...MOCK_VISITS];
let invoices = [...MOCK_INVOICES];
let prescriptions: Prescription[] = [];

let adminPasswords: Record<string, string> = {
  'Admin': 'admin123'
};

const getNextId = (arr: any[]) => arr.length > 0 ? Math.max(...arr.map(i => {
    const vals = Object.values(i);
    const firstVal = vals[0];
    return typeof firstVal === 'number' ? firstVal : 0;
})) + 1 : 1;

export const ClinicService = {
  // --- Auth Operations ---
  login: async (usernameOrMrn: string, password: string): Promise<User | null> => {
    const admin = MOCK_USERS.find(u => u.username === usernameOrMrn && adminPasswords[u.username] === password);
    if (admin) return admin;

    const patient = patients.find(p => p.mrn.toLowerCase() === usernameOrMrn.toLowerCase() && p.password === password);
    if (patient) {
      return {
        user_id: patient.patient_id,
        username: patient.mrn,
        full_name: patient.full_name,
        role: UserRole.PATIENT,
        mrn: patient.mrn
      };
    }
    return null;
  },

  verifyAdminRecovery: async (username: string, phone: string): Promise<boolean> => {
    const admin = MOCK_USERS.find(u => u.username === username && u.recovery_phone === phone);
    return !!admin;
  },

  resetAdminPassword: async (username: string, newPassword: string): Promise<void> => {
    adminPasswords[username] = newPassword;
  },

  verifyPatientRecovery: async (phone: string): Promise<Patient[]> => {
    // Return ALL distinct patient entities sharing this mobile number
    return patients.filter(p => p.mobile_no.replace(/\D/g, '') === phone.replace(/\D/g, ''));
  },

  resetPatientPassword: async (mrn: string, newPassword: string): Promise<void> => {
    patients = patients.map(p => p.mrn === mrn ? { ...p, password: newPassword } : p);
  },

  // --- Read Operations ---
  getPatients: () => Promise.resolve(patients),
  getDoctors: () => Promise.resolve(doctors),
  getProcedures: () => Promise.resolve(MOCK_PROCEDURES),
  
  getAppointments: async (): Promise<Appointment[]> => {
    return appointments.map(appt => {
      const p = patients.find(pt => pt.patient_id === appt.patient_id);
      const d = doctors.find(doc => doc.doctor_id === appt.doctor_id);
      return {
        ...appt,
        patient_name: p?.full_name,
        mrn: p?.mrn,
        mobile_no: p?.mobile_no,
        doctor_name: d?.full_name,
        specialty: d?.specialty
      };
    }).sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime());
  },

  getVisitByApptId: async (apptId: number): Promise<Visit | undefined> => {
    const visit = visits.find(v => v.appt_id === apptId);
    if (visit) {
        const rx = prescriptions.filter(r => r.visit_id === visit.visit_id);
        return { ...visit, prescriptions: rx };
    }
    return undefined;
  },
  
  getInvoices: async (): Promise<Invoice[]> => {
    return invoices.map(inv => {
      const v = visits.find(vis => vis.visit_id === inv.visit_id);
      const appt = appointments.find(a => a.appt_id === v?.appt_id);
      const p = patients.find(pt => pt.patient_id === appt?.patient_id);
      return {
        ...inv,
        patient_name: p?.full_name,
        mrn: p?.mrn
      };
    });
  },

  getInvoiceDetails: async (invoiceId: number): Promise<InvoiceDetails | null> => {
    const inv = invoices.find(i => i.invoice_id === invoiceId);
    if (!inv) return null;

    const visit = visits.find(v => v.visit_id === inv.visit_id);
    if (!visit) return null;

    const appt = appointments.find(a => a.appt_id === visit.appt_id);
    const patient = patients.find(p => p.patient_id === appt?.patient_id);
    const doctor = doctors.find(d => d.doctor_id === appt?.doctor_id);
    const rx = prescriptions.filter(r => r.visit_id === visit.visit_id);

    if (!patient || !doctor) return null;

    return {
        ...inv,
        visit: { ...visit, prescriptions: rx },
        items: visit.items || [],
        prescriptions: rx,
        patient,
        doctor
    };
  },

  registerPatient: async (patient: Omit<Patient, 'patient_id'>): Promise<Patient> => {
    // Generate unique MRN ONLY if one isn't requested explicitly
    let mrn = patient.mrn;
    if (!mrn) {
      const mrnIndex = patients.length + 1;
      mrn = `MRN${String(mrnIndex).padStart(4, '0')}`;
    }
    
    // Ensure the specific patient doesn't already exist with this MRN
    const existing = patients.find(p => p.mrn.toLowerCase() === mrn.toLowerCase());
    if (existing) return existing;

    const newPatient = { 
      ...patient,
      mrn,
      patient_id: getNextId(patients),
      password: patient.password || 'password123'
    };
    patients = [...patients, newPatient];
    return newPatient;
  },

  addDoctor: async (doctor: Omit<Doctor, 'doctor_id'>): Promise<Doctor> => {
    const newDoc = { ...doctor, doctor_id: getNextId(doctors) };
    doctors = [...doctors, newDoc];
    return newDoc;
  },

  updateDoctor: async (doctorId: number, data: Partial<Doctor>): Promise<Doctor> => {
    doctors = doctors.map(d => d.doctor_id === doctorId ? { ...d, ...data } : d);
    return doctors.find(d => d.doctor_id === doctorId)!;
  },

  createAppointment: async (appt: Omit<Appointment, 'appt_id' | 'appt_no' | 'status'>): Promise<Appointment> => {
    // Strict requirement: patient_id MUST be provided as the foreign key
    if (!appt.patient_id) {
        throw new Error("Patient ID is required to link an appointment.");
    }

    const start = new Date(appt.scheduled_at).getTime();
    const end = start + (appt.duration_min * 60000);
    const minGap = 15 * 60000;

    const hasOverlap = appointments.some(existing => {
      if (existing.status === 'CANCELLED') return false;
      const exStart = new Date(existing.scheduled_at).getTime();
      const exEnd = exStart + (existing.duration_min * 60000);
      return (start < exEnd + minGap && end > exStart - minGap);
    });

    if (hasOverlap) {
      throw new Error("This slot overlaps with another appointment.");
    }

    const newAppt: Appointment = {
      ...appt,
      appt_id: getNextId(appointments),
      appt_no: `AP${new Date().getFullYear()}-${Math.floor(Math.random() * 9000) + 1000}`,
      status: 'SCHEDULED'
    };
    appointments = [...appointments, newAppt];
    return newAppt;
  },

  updateAppointmentStatus: async (apptId: number, status: AppointmentStatus): Promise<void> => {
    appointments = appointments.map(a => a.appt_id === apptId ? { ...a, status } : a);
  },

  startVisit: async (apptId: number, complaint: string): Promise<Visit> => {
    const newVisit: Visit = {
      visit_id: getNextId(visits),
      appt_id: apptId,
      visit_date: new Date().toISOString(),
      complaint,
      diagnosis: '',
      treatment: '',
      total_amount: 0,
      status: 'OPEN',
      items: [],
      prescriptions: []
    };
    visits = [...visits, newVisit];
    await ClinicService.updateAppointmentStatus(apptId, 'IN_PROGRESS');
    return newVisit;
  },

  updateVisit: async (visitId: number, data: Partial<Visit>): Promise<Visit> => {
    visits = visits.map(v => v.visit_id === visitId ? { ...v, ...data } : v);
    return visits.find(v => v.visit_id === visitId)!;
  },

  deleteVisitItem: async (visitId: number, itemId: number): Promise<void> => {
    const visit = visits.find(v => v.visit_id === visitId);
    if (!visit) return;
    const updatedItems = (visit.items || []).filter(i => i.item_id !== itemId);
    const newTotal = updatedItems.reduce((sum, item) => sum + item.amount, 0);
    visits = visits.map(v => v.visit_id === visitId ? { ...v, items: updatedItems, total_amount: newTotal } : v);
  },

  addVisitItem: async (visitId: number, procId: number, customPrice?: number): Promise<VisitItem> => {
    const proc = MOCK_PROCEDURES.find(p => p.procedure_id === procId);
    if (!proc) throw new Error("Procedure not found");

    const visit = visits.find(v => v.visit_id === visitId);
    if (!visit) throw new Error("Visit not found");

    const priceToUse = customPrice !== undefined ? customPrice : proc.price;

    const newItem: VisitItem = {
      item_id: Math.floor(Math.random() * 10000),
      visit_id: visitId,
      procedure_id: procId,
      qty: 1,
      price: priceToUse,
      amount: priceToUse,
      proc_name: proc.proc_name
    };

    const updatedItems = [...(visit.items || []), newItem];
    const newTotal = updatedItems.reduce((sum, item) => sum + item.amount, 0);

    visits = visits.map(v => v.visit_id === visitId ? { ...v, items: updatedItems, total_amount: newTotal } : v);
    return newItem;
  },

  addPrescription: async (visitId: number, medication: string, instructions: string): Promise<Prescription> => {
    const newRx: Prescription = {
        rx_id: Math.floor(Math.random() * 10000),
        visit_id: visitId,
        medication,
        instructions
    };
    prescriptions = [...prescriptions, newRx];
    return newRx;
  },

  updatePrescription: async (rxId: number, medication: string, instructions: string): Promise<void> => {
    prescriptions = prescriptions.map(p => p.rx_id === rxId ? { ...p, medication, instructions } : p);
  },

  deletePrescription: async (rxId: number): Promise<void> => {
    prescriptions = prescriptions.filter(p => p.rx_id !== rxId);
  },

  finalizeVisitAndInvoice: async (visitId: number): Promise<Invoice> => {
    const visit = visits.find(v => v.visit_id === visitId);
    if (!visit) throw new Error("Visit not found");

    visits = visits.map(v => v.visit_id === visitId ? { ...v, status: 'BILLED' } : v);
    await ClinicService.updateAppointmentStatus(visit.appt_id, 'COMPLETED');

    const nextInvNo = invoices.length + 1;
    const newInvoice: Invoice = {
      invoice_id: getNextId(invoices),
      visit_id: visitId,
      invoice_no: `INV-${new Date().getFullYear()}-${String(nextInvNo).padStart(4, '0')}`,
      invoice_date: new Date().toISOString(),
      subtotal: visit.total_amount,
      total_amount: visit.total_amount,
      status: 'UNPAID'
    };
    invoices = [...invoices, newInvoice];
    return newInvoice;
  }
};
