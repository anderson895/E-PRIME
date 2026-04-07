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
import { logger, translateFirebaseError } from "@/utils/logger";
import type { MedicalRecord, Vitals } from "@/types";

const COLLECTION = "medicalRecords";

/**
 * Generate a sequential record ID like MR-2024-001.
 */
export async function generateRecordId(): Promise<string> {
  try {
    const year = new Date().getFullYear();
    const snapshot = await getDocs(collection(db, COLLECTION));
    const count = snapshot.size + 1;
    return `MR-${year}-${String(count).padStart(3, "0")}`;
  } catch (err) {
    logger.error("recordService.generateRecordId", err);
    throw new Error("Failed to generate record ID. Please try again.");
  }
}

/**
 * Create a new medical record (consultation result).
 */
export async function createMedicalRecord(
  data: Omit<MedicalRecord, "id" | "recordId" | "createdAt" | "updatedAt">
): Promise<MedicalRecord> {
  try {
    const recordId = await generateRecordId();
    const now = new Date().toISOString();

    const recordData = {
      ...data,
      recordId,
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await addDoc(collection(db, COLLECTION), recordData);

    logger.info("recordService.createMedicalRecord", "Medical record created", {
      recordId,
      docId: docRef.id,
      patientId: data.patientId,
    });

    return { ...recordData, id: docRef.id } as MedicalRecord;
  } catch (err) {
    logger.error("recordService.createMedicalRecord", err, {
      patientId: data.patientId,
    });
    throw new Error(translateFirebaseError(err));
  }
}

/**
 * Get all medical records ordered by date descending.
 */
export async function getAllRecords(): Promise<MedicalRecord[]> {
  try {
    const q = query(collection(db, COLLECTION), orderBy("date", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as MedicalRecord));
  } catch (err) {
    logger.error("recordService.getAllRecords", err);
    throw new Error("Failed to load medical records. Please try again.");
  }
}

/**
 * Get medical records for a specific patient (sorted client-side).
 * NOTE: orderBy is intentionally omitted to avoid requiring a Firestore composite index.
 * Collection: medicalRecords | Fields: patientId ASC, date DESC
 */
export async function getPatientRecords(
  patientId: string
): Promise<MedicalRecord[]> {
  try {
    const q = query(
      collection(db, COLLECTION),
      where("patientId", "==", patientId)
    );
    const snapshot = await getDocs(q);
    const records = snapshot.docs.map(
      (d) => ({ id: d.id, ...d.data() } as MedicalRecord)
    );
    // Sort client-side by date descending
    return records.sort((a, b) => (b.date > a.date ? 1 : -1));
  } catch (err) {
    logger.error("recordService.getPatientRecords", err, { patientId });
    throw new Error("Failed to load patient records. Please try again.");
  }
}

/**
 * Get records belonging to a specific doctor (sorted client-side).
 * NOTE: orderBy is intentionally omitted to avoid requiring a Firestore composite index.
 * Collection: medicalRecords | Fields: doctorId ASC, date DESC
 */
export async function getDoctorRecords(
  doctorId: string
): Promise<MedicalRecord[]> {
  try {
    const q = query(
      collection(db, COLLECTION),
      where("doctorId", "==", doctorId)
    );
    const snapshot = await getDocs(q);
    const records = snapshot.docs.map(
      (d) => ({ id: d.id, ...d.data() } as MedicalRecord)
    );
    return records.sort((a, b) => (b.date > a.date ? 1 : -1));
  } catch (err) {
    logger.error("recordService.getDoctorRecords", err, { doctorId });
    throw new Error("Failed to load doctor records. Please try again.");
  }
}

/**
 * Update a medical record.
 */
export async function updateMedicalRecord(
  id: string,
  data: Partial<MedicalRecord>
): Promise<void> {
  try {
    await updateDoc(doc(db, COLLECTION, id), {
      ...data,
      updatedAt: new Date().toISOString(),
    });
    logger.info("recordService.updateMedicalRecord", "Record updated", { id });
  } catch (err) {
    logger.error("recordService.updateMedicalRecord", err, { id });
    throw new Error(translateFirebaseError(err));
  }
}

/**
 * Subscribe to realtime record updates.
 * Errors inside the listener are logged but don't crash the app.
 */
export function subscribeToRecords(
  callback: (records: MedicalRecord[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const q = query(collection(db, COLLECTION), orderBy("date", "desc"));

  return onSnapshot(
    q,
    (snapshot) => {
      try {
        const records = snapshot.docs.map(
          (d) => ({ id: d.id, ...d.data() } as MedicalRecord)
        );
        callback(records);
      } catch (err) {
        logger.error("recordService.subscribeToRecords", err, {
          context: "snapshot callback",
        });
        onError?.(err instanceof Error ? err : new Error(String(err)));
      }
    },
    (err) => {
      logger.error("recordService.subscribeToRecords", err, {
        context: "onSnapshot listener",
      });
      onError?.(err);
    }
  );
}

/**
 * Get records within a date range for report generation.
 */
export async function getRecordsByDateRange(
  startDate: string,
  endDate: string
): Promise<MedicalRecord[]> {
  try {
    if (!startDate || !endDate) {
      throw new Error("Start date and end date are required.");
    }

    const q = query(
      collection(db, COLLECTION),
      where("date", ">=", startDate),
      where("date", "<=", endDate),
      orderBy("date", "desc")
    );
    const snapshot = await getDocs(q);

    logger.info("recordService.getRecordsByDateRange", "Date range query complete", {
      startDate,
      endDate,
      count: snapshot.size,
    });

    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as MedicalRecord));
  } catch (err) {
    logger.error("recordService.getRecordsByDateRange", err, { startDate, endDate });
    // Re-throw validation errors as-is
    if (err instanceof Error && !("code" in err)) throw err;
    throw new Error("Failed to fetch records for the selected date range.");
  }
}

/**
 * Get diagnosis frequency statistics.
 */
export async function getDiagnosisStats(): Promise<
  { diagnosis: string; count: number }[]
> {
  try {
    const records = await getAllRecords();
    const counts: Record<string, number> = {};
    records.forEach((r) => {
      if (r.diagnosis) {
        counts[r.diagnosis] = (counts[r.diagnosis] || 0) + 1;
      }
    });
    return Object.entries(counts)
      .map(([diagnosis, count]) => ({ diagnosis, count }))
      .sort((a, b) => b.count - a.count);
  } catch (err) {
    logger.error("recordService.getDiagnosisStats", err);
    throw new Error("Failed to compute diagnosis statistics.");
  }
}
