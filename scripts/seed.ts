/**
 * Seed Script for ePRIME-RHU
 *
 * Run this ONCE to populate Firebase with initial data.
 * Usage:
 *   1. Copy your Firebase config into this file
 *   2. Run: npx tsx scripts/seed.ts
 *
 * Creates:
 *   - 3 user accounts (admin, doctor, nurse)
 *   - 5 sample patients
 *   - 4 sample medical records
 */

import { initializeApp } from "firebase/app";
import {
  getAuth,
  createUserWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { getFirestore, doc, setDoc, addDoc, collection } from "firebase/firestore";

// ⚠️ PASTE YOUR FIREBASE CONFIG HERE
const firebaseConfig = {
  apiKey: "AIzaSyCJ_5t0jkoD91mVLD1yMupQ-9zSGgw7rgw",
  authDomain: "eprime-b8599.firebaseapp.com",
  projectId: "eprime-b8599",
  storageBucket: "eprime-b8599.firebasestorage.app",
  messagingSenderId: "329296245704",
  appId: "1:329296245704:web:8450b3cd19fa1c52db86fd"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ─── User Accounts ──────────────────────────────────────────────
const users = [
  {
    email: "admin@eprime-rhu.gov.ph",
    password: "admin123",
    displayName: "Juan Dela Cruz",
    role: "Administrative Staff",
    contactNumber: "09171234567",
  },
  {
    email: "dr.santos@eprime-rhu.gov.ph",
    password: "doctor123",
    displayName: "Dr. Maria Santos",
    role: "Doctor",
    contactNumber: "09181234567",
  },
  {
    email: "nurse.reyes@eprime-rhu.gov.ph",
    password: "nurse123",
    displayName: "Ana Reyes",
    role: "Nurse",
    contactNumber: "09191234567",
  },
];

// ─── Patients ───────────────────────────────────────────────────
const patients = [
  {
    patientId: "P-2024-001",
    firstName: "Jose",
    middleName: "P.",
    lastName: "Rizal",
    dateOfBirth: "1990-06-19",
    gender: "Male",
    civilStatus: "Single",
    address: "123 Main St",
    barangay: "Janagdong",
    municipality: "Mogpog",
    province: "Marinduque",
    contactNumber: "09201111111",
    email: "jose.rizal@email.com",
    bloodType: "O+",
    allergies: "Penicillin",
    emergencyContactName: "Maria Rizal",
    emergencyContactNumber: "09209999999",
    emergencyContactRelation: "Mother",
    photoURL: "",
    status: "Active",
    registeredBy: "",
    registeredDate: "2024-01-15",
    updatedAt: "2024-01-15",
  },
  {
    patientId: "P-2024-002",
    firstName: "Maria",
    middleName: "S.",
    lastName: "Clara",
    dateOfBirth: "1985-03-22",
    gender: "Female",
    civilStatus: "Married",
    address: "456 Beach Rd",
    barangay: "Balanacan",
    municipality: "Mogpog",
    province: "Marinduque",
    contactNumber: "09202222222",
    email: "maria.clara@email.com",
    bloodType: "A+",
    allergies: "None",
    emergencyContactName: "Pedro Clara",
    emergencyContactNumber: "09208888888",
    emergencyContactRelation: "Husband",
    photoURL: "",
    status: "Active",
    registeredBy: "",
    registeredDate: "2024-01-20",
    updatedAt: "2024-01-20",
  },
  {
    patientId: "P-2024-003",
    firstName: "Andres",
    middleName: "D.",
    lastName: "Bonifacio",
    dateOfBirth: "1978-11-30",
    gender: "Male",
    civilStatus: "Married",
    address: "789 Plaza St",
    barangay: "Mogpog Poblacion",
    municipality: "Mogpog",
    province: "Marinduque",
    contactNumber: "09203333333",
    email: "andres.b@email.com",
    bloodType: "B+",
    allergies: "Sulfa drugs",
    emergencyContactName: "Gregoria Bonifacio",
    emergencyContactNumber: "09207777777",
    emergencyContactRelation: "Wife",
    photoURL: "",
    status: "Active",
    registeredBy: "",
    registeredDate: "2024-02-01",
    updatedAt: "2024-02-01",
  },
  {
    patientId: "P-2024-004",
    firstName: "Gabriela",
    middleName: "C.",
    lastName: "Silang",
    dateOfBirth: "1995-08-15",
    gender: "Female",
    civilStatus: "Single",
    address: "321 Hill Rd",
    barangay: "Hinapulan",
    municipality: "Mogpog",
    province: "Marinduque",
    contactNumber: "09204444444",
    email: "gab.silang@email.com",
    bloodType: "AB+",
    allergies: "Aspirin",
    emergencyContactName: "Diego Silang",
    emergencyContactNumber: "09206666666",
    emergencyContactRelation: "Father",
    photoURL: "",
    status: "Active",
    registeredBy: "",
    registeredDate: "2024-02-10",
    updatedAt: "2024-02-10",
  },
  {
    patientId: "P-2024-005",
    firstName: "Emilio",
    middleName: "F.",
    lastName: "Aguinaldo",
    dateOfBirth: "2000-01-05",
    gender: "Male",
    civilStatus: "Single",
    address: "654 River St",
    barangay: "Nangka",
    municipality: "Mogpog",
    province: "Marinduque",
    contactNumber: "09205555555",
    email: "emilio.a@email.com",
    bloodType: "O-",
    allergies: "None",
    emergencyContactName: "Hilaria Aguinaldo",
    emergencyContactNumber: "09205555556",
    emergencyContactRelation: "Mother",
    photoURL: "",
    status: "Active",
    registeredBy: "",
    registeredDate: "2024-03-05",
    updatedAt: "2024-03-05",
  },
];

// ─── Medical Records ────────────────────────────────────────────
const medicalRecords = [
  {
    recordId: "MR-2024-001",
    patientId: "", // Will be set to P-2024-001's doc ID
    date: "2024-03-15",
    doctorId: "",
    doctorName: "Dr. Maria Santos",
    chiefComplaint: "Cough, colds, and low-grade fever for 3 days",
    historyOfPresentIllness: "Patient presents with productive cough, nasal congestion, and low-grade fever (37.8°C) for 3 days. No dyspnea. No vomiting.",
    diagnosis: "Acute Upper Respiratory Tract Infection",
    treatment: "Amoxicillin 500mg TID x 7 days",
    prescription: "Amoxicillin 500mg - 1 cap 3x a day for 7 days\nParacetamol 500mg - 1 tab every 4 hours PRN for fever",
    notes: "Advised bed rest and adequate fluid intake. Return if symptoms worsen.",
    vitals: {
      bloodPressure: "120/80",
      heartRate: "78",
      temperature: "37.8°C",
      respiratoryRate: "18",
      weight: "65 kg",
      height: "170 cm",
      oxygenSaturation: "98%",
    },
    followUpDate: "2024-03-22",
    status: "Completed",
    createdAt: "2024-03-15T08:30:00Z",
    updatedAt: "2024-03-15T08:30:00Z",
  },
  {
    recordId: "MR-2024-002",
    patientId: "",
    date: "2024-03-16",
    doctorId: "",
    doctorName: "Dr. Maria Santos",
    chiefComplaint: "Headache and dizziness",
    historyOfPresentIllness: "BP consistently elevated on 3 separate occasions over past 2 months. Occasional headaches and dizziness.",
    diagnosis: "Hypertension Stage 1",
    treatment: "Amlodipine 5mg OD, Low-sodium diet counseling",
    prescription: "Amlodipine 5mg - 1 tab once daily in the morning",
    notes: "Patient educated on dietary modifications. Monitor BP daily. Follow-up in 2 weeks.",
    vitals: {
      bloodPressure: "145/92",
      heartRate: "82",
      temperature: "36.5°C",
      respiratoryRate: "16",
      weight: "58 kg",
      height: "155 cm",
      oxygenSaturation: "99%",
    },
    followUpDate: "2024-03-30",
    status: "Follow-up",
    createdAt: "2024-03-16T09:00:00Z",
    updatedAt: "2024-03-16T09:00:00Z",
  },
  {
    recordId: "MR-2024-003",
    patientId: "",
    date: "2024-03-18",
    doctorId: "",
    doctorName: "Dr. Maria Santos",
    chiefComplaint: "Increased thirst and frequent urination",
    historyOfPresentIllness: "Patient reports polyuria and polydipsia for 1 month. FBS: 180mg/dL. Family history of diabetes.",
    diagnosis: "Type 2 Diabetes Mellitus",
    treatment: "Metformin 500mg BID, Diabetic diet counseling",
    prescription: "Metformin 500mg - 1 tab twice daily after meals",
    notes: "Patient educated on diabetic diet and regular exercise. HbA1c requested. Follow-up in 1 month with FBS.",
    vitals: {
      bloodPressure: "130/85",
      heartRate: "76",
      temperature: "36.6°C",
      respiratoryRate: "17",
      weight: "78 kg",
      height: "168 cm",
      oxygenSaturation: "98%",
    },
    followUpDate: "2024-04-18",
    status: "Follow-up",
    createdAt: "2024-03-18T10:15:00Z",
    updatedAt: "2024-03-18T10:15:00Z",
  },
  {
    recordId: "MR-2024-004",
    patientId: "",
    date: "2024-04-01",
    doctorId: "",
    doctorName: "Dr. Maria Santos",
    chiefComplaint: "Follow-up for URTI",
    historyOfPresentIllness: "Patient returns for follow-up. Cough resolved. No fever. Feeling well.",
    diagnosis: "URTI - Resolved",
    treatment: "No new medications. Continue hydration.",
    prescription: "",
    notes: "Symptoms have fully resolved. No abnormal findings. Cleared.",
    vitals: {
      bloodPressure: "118/76",
      heartRate: "72",
      temperature: "36.5°C",
      respiratoryRate: "16",
      weight: "65 kg",
      height: "170 cm",
      oxygenSaturation: "99%",
    },
    status: "Completed",
    createdAt: "2024-04-01T08:00:00Z",
    updatedAt: "2024-04-01T08:00:00Z",
  },
];

// ─── Run Seed ───────────────────────────────────────────────────
async function seed() {
  console.log("🌱 Seeding ePRIME-RHU database...\n");

  // 1. Create user accounts
  const userMap: Record<string, string> = {};
  for (const u of users) {
    try {
      const cred = await createUserWithEmailAndPassword(auth, u.email, u.password);
      await updateProfile(cred.user, { displayName: u.displayName });
      await setDoc(doc(db, "users", cred.user.uid), {
        uid: cred.user.uid,
        email: u.email,
        displayName: u.displayName,
        role: u.role,
        contactNumber: u.contactNumber,
        photoURL: "",
        isActive: true,
        createdAt: new Date().toISOString(),
      });
      userMap[u.role] = cred.user.uid;
      console.log(`  ✅ Created user: ${u.displayName} (${u.role})`);
    } catch (err: any) {
      console.log(`  ⚠️  User may already exist: ${u.email} — ${err.message}`);
    }
  }

  // 2. Create patients
  const patientDocIds: string[] = [];
  for (const p of patients) {
    const ref = await addDoc(collection(db, "patients"), {
      ...p,
      registeredBy: userMap["Nurse"] || "",
    });
    patientDocIds.push(ref.id);
    console.log(`  ✅ Created patient: ${p.firstName} ${p.lastName} (${p.patientId})`);
  }

  // 3. Create medical records
  const patientMap = [
    patientDocIds[0], // MR-001 → patient 1
    patientDocIds[1], // MR-002 → patient 2
    patientDocIds[2], // MR-003 → patient 3
    patientDocIds[0], // MR-004 → patient 1 (follow-up)
  ];

  for (let i = 0; i < medicalRecords.length; i++) {
    const rec = {
      ...medicalRecords[i],
      patientId: patientMap[i],
      doctorId: userMap["Doctor"] || "",
    };
    await addDoc(collection(db, "medicalRecords"), rec);
    console.log(`  ✅ Created record: ${rec.recordId}`);
  }

  // 4. Create initial system log
  await addDoc(collection(db, "systemLogs"), {
    timestamp: new Date().toISOString(),
    userId: userMap["Administrative Staff"] || "system",
    userName: "System",
    action: "Database Seeded",
    details: "Initial data populated",
    type: "system",
  });

  console.log("\n🎉 Seeding complete!\n");
  console.log("Login credentials:");
  console.log("──────────────────────────────────────────");
  users.forEach((u) => {
    console.log(`  ${u.role}: ${u.email} / ${u.password}`);
  });
  console.log("──────────────────────────────────────────\n");

  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
