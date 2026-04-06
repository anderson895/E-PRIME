import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  Unsubscribe,
} from "firebase/firestore";
import { db } from "@/config/firebase";
import type { Patient } from "@/types";

const COLLECTION = "patients";

/**
 * Generate a sequential patient ID like P-2024-001
 */
export async function generatePatientId(): Promise<string> {
  const year = new Date().getFullYear();
  const snapshot = await getDocs(collection(db, COLLECTION));
  const count = snapshot.size + 1;
  return `P-${year}-${String(count).padStart(3, "0")}`;
}

/**
 * Create a new patient record
 */
export async function createPatient(
  data: Omit<Patient, "id" | "patientId" | "registeredDate" | "updatedAt">
): Promise<Patient> {
  const patientId = await generatePatientId();
  const now = new Date().toISOString();

  const patientData = {
    ...data,
    patientId,
    registeredDate: now,
    updatedAt: now,
  };

  const docRef = await addDoc(collection(db, COLLECTION), patientData);
  return { ...patientData, id: docRef.id } as Patient;
}

/**
 * Get all patients
 */
export async function getAllPatients(): Promise<Patient[]> {
  const q = query(collection(db, COLLECTION), orderBy("registeredDate", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Patient));
}

/**
 * Get a single patient by document ID
 */
export async function getPatientById(id: string): Promise<Patient | null> {
  const docSnap = await getDoc(doc(db, COLLECTION, id));
  if (!docSnap.exists()) return null;
  return { id: docSnap.id, ...docSnap.data() } as Patient;
}

/**
 * Search patients by name or patient ID
 */
export async function searchPatients(searchTerm: string): Promise<Patient[]> {
  const allPatients = await getAllPatients();
  const term = searchTerm.toLowerCase();
  return allPatients.filter(
    (p) =>
      p.firstName.toLowerCase().includes(term) ||
      p.lastName.toLowerCase().includes(term) ||
      p.patientId.toLowerCase().includes(term) ||
      p.contactNumber.includes(term)
  );
}

/**
 * Update a patient record
 */
export async function updatePatient(
  id: string,
  data: Partial<Patient>
): Promise<void> {
  await updateDoc(doc(db, COLLECTION, id), {
    ...data,
    updatedAt: new Date().toISOString(),
  });
}

/**
 * Delete a patient (soft delete — set inactive)
 */
export async function deactivatePatient(id: string): Promise<void> {
  await updateDoc(doc(db, COLLECTION, id), {
    status: "Inactive",
    updatedAt: new Date().toISOString(),
  });
}

/**
 * Subscribe to realtime patient updates
 */
export function subscribeToPatients(
  callback: (patients: Patient[]) => void
): Unsubscribe {
  const q = query(collection(db, COLLECTION), orderBy("registeredDate", "desc"));
  return onSnapshot(q, (snapshot) => {
    const patients = snapshot.docs.map(
      (d) => ({ id: d.id, ...d.data() } as Patient)
    );
    callback(patients);
  });
}

/**
 * Get patient count stats
 */
export async function getPatientStats() {
  const patients = await getAllPatients();
  return {
    total: patients.length,
    active: patients.filter((p) => p.status === "Active").length,
    male: patients.filter((p) => p.gender === "Male").length,
    female: patients.filter((p) => p.gender === "Female").length,
  };
}
