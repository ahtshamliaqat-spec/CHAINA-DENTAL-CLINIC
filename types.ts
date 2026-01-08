export enum UserRole {
  RECEPTION = 'RECEPTION',
  ADMIN = 'ADMIN',
  DOCTOR = 'DOCTOR',
  PATIENT = 'PATIENT'
}

export interface User {
  user_id: number;
  username: string;
  full_name: string;
  role: UserRole;
  mrn?: string; // Links to patient MRN if role is PATIENT
  recovery_phone?: string; // For Admin password reset
}

export interface Doctor {
  doctor_id: number;
  doctor_code: string;
  registration_no?: string; // PMDC / Registration No
  full_name: string;
  specialty: string;
  active: 'Y' | 'N';
  image?: string;
}

export interface Patient {
  patient_id: number;
  mrn: string;
  password?: string; // New field for patient login
  full_name: string;
  father_name: string;
  dob: string;
  gender: 'Male' | 'Female' | 'Other';
  mobile_no: string;
  address: string;
}

export type AppointmentStatus = 'SCHEDULED' | 'CHECKED_IN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';

export interface Appointment {
  appt_id: number;
  appt_no: string;
  patient_id: number;
  doctor_id: number;
  scheduled_at: string; // ISO String
  duration_min: number;
  status: AppointmentStatus;
  remarks: string;
  // Joined fields for UI
  patient_name?: string;
  doctor_name?: string;
  mrn?: string;
  mobile_no?: string;
  specialty?: string;
}

export interface Procedure {
  procedure_id: number;
  code: string;
  proc_name: string;
  description: string;
  price: number;
}

export interface VisitItem {
  item_id: number;
  visit_id: number;
  procedure_id: number;
  qty: number;
  price: number;
  amount: number;
  // UI helper
  proc_name?: string;
}

export interface Prescription {
  rx_id: number;
  visit_id: number;
  medication: string;
  instructions: string;
}

export interface Visit {
  visit_id: number;
  appt_id: number;
  visit_date: string;
  complaint: string;
  diagnosis: string;
  treatment: string;
  total_amount: number;
  status: 'OPEN' | 'BILLED' | 'CLOSED';
  items?: VisitItem[];
  prescriptions?: Prescription[];
}

export interface Invoice {
  invoice_id: number;
  visit_id: number;
  invoice_no: string;
  invoice_date: string;
  subtotal: number;
  total_amount: number;
  status: 'UNPAID' | 'PAID' | 'CANCELLED';
  patient_name?: string;
  mrn?: string;
}

export interface InvoiceDetails extends Invoice {
  visit: Visit;
  patient: Patient;
  doctor: Doctor;
  items: VisitItem[];
  prescriptions: Prescription[];
}