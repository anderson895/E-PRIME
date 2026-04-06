/**
 * Seed Script for ePRIME-RHU
 *
 * Run this ONCE to populate Firebase with initial data.
 * Usage:
 *   npx tsx scripts/seed.ts
 *
 * Creates:
 *   - 3 user accounts (admin, doctor, nurse)
 *   - 5 sample patients
 *   - 4 sample medical records
 *   - 1 initial system log
 */

import { config } from "dotenv";
import { resolve } from "path";

// ─── Load .env from project root ────────────────────────────────
config({ path: resolve(process.cwd(), ".env") });

import { initializeApp } from "firebase/app";
import {
  getAuth,
  createUserWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import {
  getFirestore,
  doc,
  setDoc,
  addDoc,
  collection,
} from "firebase/firestore";

// ─── Read config from .env ───────────────────────────────────────
const firebaseConfig = {
  apiKey:            process.env.VITE_FIREBASE_API_KEY,
  authDomain:        process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.VITE_FIREBASE_APP_ID,
};

// ─── Guard: abort if any key is missing ─────────────────────────
const missingKeys = Object.entries(firebaseConfig)
  .filter(([, v]) => !v)
  .map(([k]) => k);

if (missingKeys.length > 0) {
  console.error("\n❌ Missing required .env values:");
  missingKeys.forEach((k) => console.error(`   - ${k}`));
  console.error("\nMake sure your .env file exists in the project root.\n");
  process.exit(1);
}

// ─── Initialize Firebase ─────────────────────────────────────────
const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);

// ─── User Accounts ───────────────────────────────────────────────
const users = [
  {
    email:         "admin@eprime-rhu.gov.ph",
    password:      "Admin@2024!",
    displayName:   "Juan Dela Cruz",
    role:          "Administrative Staff",
    contactNumber: "09171234567",
  },
  {
    email:         "dr.santos@eprime-rhu.gov.ph",
    password:      "Doctor@2024!",
    displayName:   "Dr. Maria Santos",
    role:          "Doctor",
    contactNumber: "09181234567",
  },
  {
    email:         "nurse.reyes@eprime-rhu.gov.ph",
    password:      "Nurse@2024!",
    displayName:   "Ana Reyes",
    role:          "Nurse",
    contactNumber: "09191234567",
  },
] as const;

// ─── Patients ────────────────────────────────────────────────────
const patients = [
  {
    patientId:                  "P-2024-001",
    firstName:                  "Jose",
    middleName:                 "P.",
    lastName:                   "Rizal",
    dateOfBirth:                "1990-06-19",
    gender:                     "Male",
    civilStatus:                "Single",
    address:                    "123 Main St",
    barangay:                   "Janagdong",
    municipality:               "Mogpog",
    province:                   "Marinduque",
    contactNumber:              "09201111111",
    email:                      "jose.rizal@email.com",
    bloodType:                  "O+",
    allergies:                  "Penicillin",
    emergencyContactName:       "Maria Rizal",
    emergencyContactNumber:     "09209999999",
    emergencyContactRelation:   "Mother",
    photoURL:                   "",
    status:                     "Active",
    registeredDate:             "2024-01-15",
    updatedAt:                  "2024-01-15",
  },
  {
    patientId:                  "P-2024-002",
    firstName:                  "Maria",
    middleName:                 "S.",
    lastName:                   "Clara",
    dateOfBirth:                "1985-03-22",
    gender:                     "Female",
    civilStatus:                "Married",
    address:                    "456 Beach Rd",
    barangay:                   "Balanacan",
    municipality:               "Mogpog",
    province:                   "Marinduque",
    contactNumber:              "09202222222",
    email:                      "maria.clara@email.com",
    bloodType:                  "A+",
    allergies:                  "None",
    emergencyContactName:       "Pedro Clara",
    emergencyContactNumber:     "09208888888",
    emergencyContactRelation:   "Husband",
    photoURL:                   "",
    status:                     "Active",
    registeredDate:             "2024-01-20",
    updatedAt:                  "2024-01-20",
  },
  {
    patientId:                  "P-2024-003",
    firstName:                  "Andres",
    middleName:                 "D.",
    lastName:                   "Bonifacio",
    dateOfBirth:                "1978-11-30",
    gender:                     "Male",
    civilStatus:                "Married",
    address:                    "789 Plaza St",
    barangay:                   "Mogpog Poblacion",
    municipality:               "Mogpog",
    province:                   "Marinduque",
    contactNumber:              "09203333333",
    email:                      "andres.b@email.com",
    bloodType:                  "B+",
    allergies:                  "Sulfa drugs",
    emergencyContactName:       "Gregoria Bonifacio",
    emergencyContactNumber:     "09207777777",
    emergencyContactRelation:   "Wife",
    photoURL:                   "",
    status:                     "Active",
    registeredDate:             "2024-02-01",
    updatedAt:                  "2024-02-01",
  },
  {
    patientId:                  "P-2024-004",
    firstName:                  "Gabriela",
    middleName:                 "C.",
    lastName:                   "Silang",
    dateOfBirth:                "1995-08-15",
    gender:                     "Female",
    civilStatus:                "Single",
    address:                    "321 Hill Rd",
    barangay:                   "Hinapulan",
    municipality:               "Mogpog",
    province:                   "Marinduque",
    contactNumber:              "09204444444",
    email:                      "gab.silang@email.com",
    bloodType:                  "AB+",
    allergies:                  "Aspirin",
    emergencyContactName:       "Diego Silang",
    emergencyContactNumber:     "09206666666",
    emergencyContactRelation:   "Father",
    photoURL:                   "",
    status:                     "Active",
    registeredDate:             "2024-02-10",
    updatedAt:                  "2024-02-10",
  },
  {
    patientId:                  "P-2024-005",
    firstName:                  "Emilio",
    middleName:                 "F.",
    lastName:                   "Aguinaldo",
    dateOfBirth:                "2000-01-05",
    gender:                     "Male",
    civilStatus:                "Single",
    address:                    "654 River St",
    barangay:                   "Nangka",
    municipality:               "Mogpog",
    province:                   "Marinduque",
    contactNumber:              "09205555555",
    email:                      "emilio.a@email.com",
    bloodType:                  "O-",
    allergies:                  "None",
    emergencyContactName:       "Hilaria Aguinaldo",
    emergencyContactNumber:     "09205555556",
    emergencyContactRelation:   "Mother",
    photoURL:                   "",
    status:                     "Active",
    registeredDate:             "2024-03-05",
    updatedAt:                  "2024-03-05",
  },
];

// ─── Medical Records ─────────────────────────────────────────────
// patientId and doctorId are set dynamically during the seed run.
const medicalRecords = [
  {
    recordId:                    "MR-2024-001",
    patientIndex:                0,       // → patients[0]
    date:                        "2024-03-15",
    doctorName:                  "Dr. Maria Santos",
    chiefComplaint:              "Cough, colds, and low-grade fever for 3 days",
    historyOfPresentIllness:
      "Patient presents with productive cough, nasal congestion, and low-grade fever (37.8°C) for 3 days. No dyspnea. No vomiting.",
    diagnosis:                   "Acute Upper Respiratory Tract Infection",
    treatment:                   "Amoxicillin 500mg TID x 7 days",
    prescription:
      "Amoxicillin 500mg - 1 cap 3x a day for 7 days\nParacetamol 500mg - 1 tab every 4 hours PRN for fever",
    notes:
      "Advised bed rest and adequate fluid intake. Return if symptoms worsen.",
    vitals: {
      bloodPressure:    "120/80",
      heartRate:        "78",
      temperature:      "37.8°C",
      respiratoryRate:  "18",
      weight:           "65 kg",
      height:           "170 cm",
      oxygenSaturation: "98%",
    },
    followUpDate: "2024-03-22",
    status:       "Completed",
    createdAt:    "2024-03-15T08:30:00Z",
    updatedAt:    "2024-03-15T08:30:00Z",
  },
  {
    recordId:                    "MR-2024-002",
    patientIndex:                1,       // → patients[1]
    date:                        "2024-03-16",
    doctorName:                  "Dr. Maria Santos",
    chiefComplaint:              "Headache and dizziness",
    historyOfPresentIllness:
      "BP consistently elevated on 3 separate occasions over past 2 months. Occasional headaches and dizziness.",
    diagnosis:                   "Hypertension Stage 1",
    treatment:                   "Amlodipine 5mg OD, Low-sodium diet counseling",
    prescription:
      "Amlodipine 5mg - 1 tab once daily in the morning",
    notes:
      "Patient educated on dietary modifications. Monitor BP daily. Follow-up in 2 weeks.",
    vitals: {
      bloodPressure:    "145/92",
      heartRate:        "82",
      temperature:      "36.5°C",
      respiratoryRate:  "16",
      weight:           "58 kg",
      height:           "155 cm",
      oxygenSaturation: "99%",
    },
    followUpDate: "2024-03-30",
    status:       "Follow-up",
    createdAt:    "2024-03-16T09:00:00Z",
    updatedAt:    "2024-03-16T09:00:00Z",
  },
  {
    recordId:                    "MR-2024-003",
    patientIndex:                2,       // → patients[2]
    date:                        "2024-03-18",
    doctorName:                  "Dr. Maria Santos",
    chiefComplaint:              "Increased thirst and frequent urination",
    historyOfPresentIllness:
      "Patient reports polyuria and polydipsia for 1 month. FBS: 180mg/dL. Family history of diabetes.",
    diagnosis:                   "Type 2 Diabetes Mellitus",
    treatment:                   "Metformin 500mg BID, Diabetic diet counseling",
    prescription:
      "Metformin 500mg - 1 tab twice daily after meals",
    notes:
      "Patient educated on diabetic diet and regular exercise. HbA1c requested. Follow-up in 1 month with FBS.",
    vitals: {
      bloodPressure:    "130/85",
      heartRate:        "76",
      temperature:      "36.6°C",
      respiratoryRate:  "17",
      weight:           "78 kg",
      height:           "168 cm",
      oxygenSaturation: "98%",
    },
    followUpDate: "2024-04-18",
    status:       "Follow-up",
    createdAt:    "2024-03-18T10:15:00Z",
    updatedAt:    "2024-03-18T10:15:00Z",
  },
  {
    recordId:                    "MR-2024-004",
    patientIndex:                0,       // → patients[0] (follow-up)
    date:                        "2024-04-01",
    doctorName:                  "Dr. Maria Santos",
    chiefComplaint:              "Follow-up for URTI",
    historyOfPresentIllness:
      "Patient returns for follow-up. Cough resolved. No fever. Feeling well.",
    diagnosis:                   "URTI - Resolved",
    treatment:                   "No new medications. Continue hydration.",
    prescription:                "",
    notes:                       "Symptoms have fully resolved. No abnormal findings. Cleared.",
    vitals: {
      bloodPressure:    "118/76",
      heartRate:        "72",
      temperature:      "36.5°C",
      respiratoryRate:  "16",
      weight:           "65 kg",
      height:           "170 cm",
      oxygenSaturation: "99%",
    },
    followUpDate: undefined,
    status:       "Completed",
    createdAt:    "2024-04-01T08:00:00Z",
    updatedAt:    "2024-04-01T08:00:00Z",
  },
];

// ─── Seed Runner ─────────────────────────────────────────────────
async function seed() {
  console.log("\n🌱 Seeding ePRIME-RHU database...\n");

  // ── Step 1: Create user accounts ──────────────────────────────
  console.log("👤 Creating user accounts...");
  const userMap: Record<string, string> = {};

  for (const u of users) {
    try {
      const cred = await createUserWithEmailAndPassword(auth, u.email, u.password);
      await updateProfile(cred.user, { displayName: u.displayName });
      await setDoc(doc(db, "users", cred.user.uid), {
        uid:           cred.user.uid,
        email:         u.email,
        displayName:   u.displayName,
        role:          u.role,
        contactNumber: u.contactNumber,
        photoURL:      "",
        isActive:      true,
        createdAt:     new Date().toISOString(),
      });
      userMap[u.role] = cred.user.uid;
      console.log(`   ✅ ${u.displayName} (${u.role})`);
    } catch (err: any) {
      if (err.code === "auth/email-already-in-use") {
        console.log(`   ⚠️  Already exists — skipping: ${u.email}`);
      } else {
        console.error(`   ❌ Failed to create ${u.email}:`, err.message);
        throw err;
      }
    }
  }

  // ── Step 2: Create patients ────────────────────────────────────
  console.log("\n🏥 Creating patients...");
  const patientDocIds: string[] = [];
  const nurseId = userMap["Nurse"] ?? "";

  for (const p of patients) {
    const ref = await addDoc(collection(db, "patients"), {
      ...p,
      registeredBy: nurseId,
    });
    patientDocIds.push(ref.id);
    console.log(`   ✅ ${p.firstName} ${p.lastName} (${p.patientId})`);
  }

  // ── Step 3: Create medical records ────────────────────────────
  console.log("\n📋 Creating medical records...");
  const doctorId = userMap["Doctor"] ?? "";

  for (const rec of medicalRecords) {
    const { patientIndex, ...rest } = rec;
    const recordData: Record<string, unknown> = {
      ...rest,
      patientId: patientDocIds[patientIndex],
      doctorId,
    };

    // Remove followUpDate key entirely if undefined
    if (recordData.followUpDate === undefined) {
      delete recordData.followUpDate;
    }

    await addDoc(collection(db, "medicalRecords"), recordData);
    console.log(`   ✅ ${rec.recordId} → patient index [${patientIndex}]`);
  }

  // ── Step 4: Initial system log ─────────────────────────────────
  console.log("\n📝 Writing initial system log...");
  await addDoc(collection(db, "systemLogs"), {
    timestamp: new Date().toISOString(),
    userId:    userMap["Administrative Staff"] ?? "system",
    userName:  "System",
    action:    "Database Seeded",
    details:   `Seeded ${users.length} users, ${patients.length} patients, ${medicalRecords.length} medical records`,
    type:      "system",
  });
  console.log("   ✅ System log written");

  // ── Done ───────────────────────────────────────────────────────
  console.log("\n🎉 Seeding complete!\n");
  console.log("Login credentials:");
  console.log("──────────────────────────────────────────────────");
  users.forEach((u) =>
    console.log(`  ${u.role.padEnd(22)} ${u.email}  /  ${u.password}`)
  );
  console.log("──────────────────────────────────────────────────\n");

  process.exit(0);
}

seed().catch((err) => {
  console.error("\n❌ Seed failed:", err.message ?? err);
  process.exit(1);
});