import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  Unsubscribe,
} from "firebase/firestore";
import { db } from "@/config/firebase";
import type { MedicalRecord, Vitals } from "@/types";

const COLLECTION = "medicalRecords";

/**
 * Generate record ID like MR-2024-001
 */
export async function generateRecordId(): Promise<string> {
  const year = new Date().getFullYear();
  const snapshot = await getDocs(collection(db, COLLECTION));
  const count = snapshot.size + 1;
  return `MR-${year}-${String(count).padStart(3, "0")}`;
}

/**
 * Create a new medical record (consultation result)
 */
export async function createMedicalRecord(
  data: Omit<MedicalRecord, "id" | "recordId" | "createdAt" | "updatedAt">
): Promise<MedicalRecord> {
  const recordId = await generateRecordId();
  const now = new Date().toISOString();

  const recordData = {
    ...data,
    recordId,
    createdAt: now,
    updatedAt: now,
  };

  const docRef = await addDoc(collection(db, COLLECTION), recordData);
  return { ...recordData, id: docRef.id } as MedicalRecord;
}

/**
 * Get all medical records
 */
export async function getAllRecords(): Promise<MedicalRecord[]> {
  const q = query(collection(db, COLLECTION), orderBy("date", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as MedicalRecord));
}

/**
 * Get medical records for a specific patient
 */
export async function getPatientRecords(
  patientId: string
): Promise<MedicalRecord[]> {
  const q = query(
    collection(db, COLLECTION),
    where("patientId", "==", patientId),
    orderBy("date", "desc")
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as MedicalRecord));
}

/**
 * Get records by doctor
 */
export async function getDoctorRecords(
  doctorId: string
): Promise<MedicalRecord[]> {
  const q = query(
    collection(db, COLLECTION),
    where("doctorId", "==", doctorId),
    orderBy("date", "desc")
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as MedicalRecord));
}

/**
 * Update a medical record
 */
export async function updateMedicalRecord(
  id: string,
  data: Partial<MedicalRecord>
): Promise<void> {
  await updateDoc(doc(db, COLLECTION, id), {
    ...data,
    updatedAt: new Date().toISOString(),
  });
}

/**
 * Subscribe to realtime record updates
 */
export function subscribeToRecords(
  callback: (records: MedicalRecord[]) => void
): Unsubscribe {
  const q = query(collection(db, COLLECTION), orderBy("date", "desc"));
  return onSnapshot(q, (snapshot) => {
    const records = snapshot.docs.map(
      (d) => ({ id: d.id, ...d.data() } as MedicalRecord)
    );
    callback(records);
  });
}

/**
 * Get records within a date range for reports
 */
export async function getRecordsByDateRange(
  startDate: string,
  endDate: string
): Promise<MedicalRecord[]> {
  const q = query(
    collection(db, COLLECTION),
    where("date", ">=", startDate),
    where("date", "<=", endDate),
    orderBy("date", "desc")
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as MedicalRecord));
}

/**
 * Get diagnosis statistics
 */
export async function getDiagnosisStats(): Promise<
  { diagnosis: string; count: number }[]
> {
  const records = await getAllRecords();
  const counts: Record<string, number> = {};
  records.forEach((r) => {
    counts[r.diagnosis] = (counts[r.diagnosis] || 0) + 1;
  });
  return Object.entries(counts)
    .map(([diagnosis, count]) => ({ diagnosis, count }))
    .sort((a, b) => b.count - a.count);
}
