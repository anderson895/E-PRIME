// ─── User & Auth Types ──────────────────────────────────────────
export type UserRole = "Doctor" | "Nurse" | "Administrative Staff";

export interface UserAccount {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  contactNumber?: string;
  photoURL?: string;
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
  role: UserRole;
}

// ─── Patient Types ──────────────────────────────────────────────
export interface Patient {
  id: string;
  patientId: string; // e.g. P-2024-001
  firstName: string;
  middleName: string;
  lastName: string;
  suffix?: string;
  dateOfBirth: string;
  gender: "Male" | "Female";
  civilStatus: "Single" | "Married" | "Widowed" | "Separated";
  address: string;
  barangay: string;
  municipality: string;
  province: string;
  contactNumber: string;
  email?: string;
  bloodType: string;
  allergies: string;
  emergencyContactName: string;
  emergencyContactNumber: string;
  emergencyContactRelation: string;
  photoURL?: string;
  status: "Active" | "Inactive" | "Deceased";
  registeredBy: string;
  registeredDate: string;
  updatedAt: string;
}

// ─── Medical Record Types ───────────────────────────────────────
export interface Vitals {
  bloodPressure: string;
  heartRate: string;
  temperature: string;
  respiratoryRate: string;
  weight: string;
  height: string;
  oxygenSaturation?: string;
}

export interface MedicalRecord {
  id: string;
  recordId: string; // e.g. MR-2024-001
  patientId: string;
  date: string;
  doctorId: string;
  doctorName: string;
  chiefComplaint: string;
  historyOfPresentIllness: string;
  diagnosis: string;
  treatment: string;
  prescription: string;
  notes: string;
  vitals: Vitals;
  followUpDate?: string;
  status: "Completed" | "Pending" | "Follow-up";
  attachments?: string[]; // Cloudinary URLs
  createdAt: string;
  updatedAt: string;
}

// ─── Consultation Types ─────────────────────────────────────────
export interface Consultation {
  id: string;
  patientId: string;
  doctorId: string;
  date: string;
  type: "Walk-in" | "Follow-up" | "Emergency" | "Referral";
  chiefComplaint: string;
  diagnosis: string;
  treatment: string;
  prescription: string;
  notes: string;
  vitals: Vitals;
  status: "In Progress" | "Completed" | "Cancelled";
}

// ─── Report Types ───────────────────────────────────────────────
export interface ReportFilter {
  startDate: string;
  endDate: string;
  type: "patient" | "consultation" | "diagnosis" | "monthly";
}

export interface DiagnosisCount {
  diagnosis: string;
  count: number;
}

export interface MonthlyStats {
  month: string;
  patients: number;
  consultations: number;
}

// ─── System Log Types ───────────────────────────────────────────
export interface SystemLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  action: string;
  details: string;
  type: "auth" | "record" | "system" | "admin";
  ipAddress?: string;
}

// ─── Backup Types ───────────────────────────────────────────────
export interface BackupRecord {
  id: string;
  date: string;
  size: string;
  type: "Automated" | "Manual";
  status: "Success" | "Failed" | "In Progress";
  createdBy: string;
  filePath?: string;
}

// ─── Notification Types ─────────────────────────────────────────
export interface Notification {
  id: string;
  title: string;
  message: string;
  type: "info" | "warning" | "success" | "error";
  read: boolean;
  createdAt: string;
  userId: string;
}

// ─── Dashboard Stats ────────────────────────────────────────────
export interface DashboardStats {
  totalPatients: number;
  totalConsultations: number;
  thisMonthConsultations: number;
  activePatients: number;
  pendingFollowUps: number;
  todayConsultations: number;
}

// ─── Email Types (Nodemailer) ───────────────────────────────────
export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  from?: string;
}
