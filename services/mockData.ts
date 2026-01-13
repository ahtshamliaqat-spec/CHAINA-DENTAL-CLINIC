
import { Doctor, Patient, Procedure, Appointment, Visit, Invoice, User, UserRole } from '../types';

export const MOCK_USERS: User[] = [
  { user_id: 1, username: 'Admin', full_name: 'Administrator', role: UserRole.ADMIN, recovery_phone: '0333-4216580' }
];

export const MOCK_DOCTORS: Doctor[] = [
  { 
    doctor_id: 1, 
    doctor_code: 'DOC001', 
    registration_no: 'PMDC-12345-B',
    full_name: 'Dr. Bashir Khan D.H.', 
    specialty: 'Senior Dental Surgeon', 
    active: 'Y',
    image: 'https://img.freepik.com/free-photo/portrait-successful-mid-adult-doctor-with-crossed-arms_1262-12865.jpg'
  },
  { 
    doctor_id: 2, 
    doctor_code: 'DOC002', 
    registration_no: 'PMDC-77889-A',
    full_name: 'Dr. Ayesha Khan', 
    specialty: 'Orthodontist', 
    active: 'Y',
    image: 'https://img.freepik.com/free-photo/pleased-young-female-doctor-wearing-medical-robe-stethoscope-around-neck-standing-with-closed-posture_409827-254.jpg' 
  },
  { 
    doctor_id: 3, 
    doctor_code: 'DOC003', 
    registration_no: 'PMDC-11223-O',
    full_name: 'Dr. Omar Rizvi', 
    specialty: 'Endodontist', 
    active: 'Y',
    image: 'https://img.freepik.com/free-photo/smiling-doctor-with-strethoscope-isolated-grey_651396-974.jpg'
  },
];

export const MOCK_PATIENTS: Patient[] = [
  { 
    patient_id: 1, 
    mrn: 'MRN0001', 
    password: 'password123',
    full_name: 'Irfan Ali', 
    father_name: 'Ghulam Ali', 
    dob: '1985-05-20', 
    gender: 'Male', 
    mobile_no: '0304-4444444', 
    address: 'Phool Nagar' 
  },
  { 
    patient_id: 2, 
    mrn: 'MRN0002', 
    password: 'password123',
    full_name: 'Sadia Bibi', 
    father_name: 'Abdul Rehman', 
    dob: '1990-11-02', 
    gender: 'Female', 
    mobile_no: '0305-5555555', 
    address: 'Phool Nagar' 
  },
  { 
    patient_id: 3, 
    mrn: 'MRN0003', 
    password: 'password123',
    full_name: 'Amina', 
    father_name: 'Ahmad Khan', 
    dob: '1995-03-15', 
    gender: 'Female', 
    mobile_no: '0306-6666666', 
    address: 'Phool Nagar' 
  },
  { 
    patient_id: 4, 
    mrn: 'MRN0004', 
    password: 'password123',
    full_name: 'Faiza', 
    father_name: 'Muhammad Ali', 
    dob: '1998-07-22', 
    gender: 'Female', 
    mobile_no: '0307-7777777', 
    address: 'Phool Nagar' 
  },
];

export const MOCK_PROCEDURES: Procedure[] = [
  { procedure_id: 1, code: 'P001', proc_name: 'Oral Exam', description: 'Routine oral checkup', price: 500 },
  { procedure_id: 2, code: 'P002', proc_name: 'Scaling', description: 'Teeth cleaning', price: 1500 },
  { procedure_id: 3, code: 'P003', proc_name: 'Filling', description: 'Composite filling', price: 3000 },
  { procedure_id: 4, code: 'P004', proc_name: 'Root Canal', description: 'RCT Anterior', price: 8000 },
];

const today = new Date();

export const MOCK_APPOINTMENTS: Appointment[] = [
  {
    appt_id: 1,
    appt_no: 'AP20251203-101',
    patient_id: 1,
    doctor_id: 1,
    scheduled_at: new Date(today.setHours(10, 0, 0, 0)).toISOString(),
    duration_min: 15,
    status: 'SCHEDULED',
    remarks: 'Regular checkup'
  },
  {
    appt_id: 2,
    appt_no: 'AP20251203-102',
    patient_id: 2,
    doctor_id: 2,
    scheduled_at: new Date(today.setHours(11, 30, 0, 0)).toISOString(),
    duration_min: 15,
    status: 'CHECKED_IN',
    remarks: 'Braces adjustment'
  }
];

export const MOCK_VISITS: Visit[] = [];
export const MOCK_INVOICES: Invoice[] = [];
