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
  onSnapshot,
  Unsubscribe,
} from "firebase/firestore";
import { db } from "@/config/firebase";
import { logger, translateFirebaseError } from "@/utils/logger";
import type { Patient } from "@/types";

const COLLECTION = "patients";

/**
 * Generate a sequential patient ID like P-2024-001.
 */
export async function generatePatientId(): Promise<string> {
  try {
    const year = new Date().getFullYear();
    const snapshot = await getDocs(collection(db, COLLECTION));
    const count = snapshot.size + 1;
    return `P-${year}-${String(count).padStart(3, "0")}`;
  } catch (err) {
    logger.error("patientService.generatePatientId", err);
    throw new Error("Failed to generate patient ID. Please try again.");
  }
}

/**
 * Create a new patient record.
 */
export async function createPatient(
  data: Omit<Patient, "id" | "patientId" | "registeredDate" | "updatedAt">
): Promise<Patient> {
  try {
    const patientId = await generatePatientId();
    const now = new Date().toISOString();

    const patientData = {
      ...data,
      patientId,
      registeredDate: now,
      updatedAt: now,
    };

    const docRef = await addDoc(collection(db, COLLECTION), patientData);

    logger.info("patientService.createPatient", "Patient created", {
      patientId,
      docId: docRef.id,
    });

    return { ...patientData, id: docRef.id } as Patient;
  } catch (err) {
    logger.error("patientService.createPatient", err, {
      patientName: `${data.lastName}, ${data.firstName}`,
    });
    throw new Error(translateFirebaseError(err));
  }
}

/**
 * Get all patients ordered by registration date.
 */
export async function getAllPatients(): Promise<Patient[]> {
  try {
    const q = query(collection(db, COLLECTION), orderBy("registeredDate", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Patient));
  } catch (err) {
    logger.error("patientService.getAllPatients", err);
    throw new Error("Failed to load patient list. Please try again.");
  }
}

/**
 * Get a single patient by document ID.
 */
export async function getPatientById(id: string): Promise<Patient | null> {
  try {
    const docSnap = await getDoc(doc(db, COLLECTION, id));
    if (!docSnap.exists()) {
      logger.warn("patientService.getPatientById", "Patient not found", { id });
      return null;
    }
    return { id: docSnap.id, ...docSnap.data() } as Patient;
  } catch (err) {
    logger.error("patientService.getPatientById", err, { id });
    throw new Error("Failed to load patient. Please try again.");
  }
}

/**
 * Search patients by name, patient ID, or contact number.
 * Filters client-side after fetching all patients.
 */
export async function searchPatients(searchTerm: string): Promise<Patient[]> {
  try {
    const allPatients = await getAllPatients();
    const term = searchTerm.toLowerCase().trim();
    if (!term) return allPatients;
    return allPatients.filter(
      (p) =>
        p.firstName.toLowerCase().includes(term) ||
        p.lastName.toLowerCase().includes(term) ||
        p.patientId.toLowerCase().includes(term) ||
        p.contactNumber.includes(term)
    );
  } catch (err) {
    logger.error("patientService.searchPatients", err, { searchTerm });
    throw new Error("Patient search failed. Please try again.");
  }
}

/**
 * Update a patient record.
 */
export async function updatePatient(
  id: string,
  data: Partial<Patient>
): Promise<void> {
  try {
    await updateDoc(doc(db, COLLECTION, id), {
      ...data,
      updatedAt: new Date().toISOString(),
    });
    logger.info("patientService.updatePatient", "Patient updated", { id });
  } catch (err) {
    logger.error("patientService.updatePatient", err, { id });
    throw new Error(translateFirebaseError(err));
  }
}

/**
 * Soft-delete a patient by setting their status to Inactive.
 */
export async function deactivatePatient(id: string): Promise<void> {
  try {
    await updateDoc(doc(db, COLLECTION, id), {
      status: "Inactive",
      updatedAt: new Date().toISOString(),
    });
    logger.info("patientService.deactivatePatient", "Patient deactivated", { id });
  } catch (err) {
    logger.error("patientService.deactivatePatient", err, { id });
    throw new Error(translateFirebaseError(err));
  }
}

/**
 * Subscribe to realtime patient updates.
 * Errors inside the snapshot listener are logged but don't crash the app.
 */
export function subscribeToPatients(
  callback: (patients: Patient[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const q = query(collection(db, COLLECTION), orderBy("registeredDate", "desc"));

  return onSnapshot(
    q,
    (snapshot) => {
      try {
        const patients = snapshot.docs.map(
          (d) => ({ id: d.id, ...d.data() } as Patient)
        );
        callback(patients);
      } catch (err) {
        logger.error("patientService.subscribeToPatients", err, {
          context: "snapshot callback",
        });
        onError?.(err instanceof Error ? err : new Error(String(err)));
      }
    },
    (err) => {
      logger.error("patientService.subscribeToPatients", err, {
        context: "onSnapshot listener",
      });
      onError?.(err);
    }
  );
}

/**
 * Get aggregated patient count statistics.
 */
export async function getPatientStats() {
  try {
    const patients = await getAllPatients();
    return {
      total:  patients.length,
      active: patients.filter((p) => p.status === "Active").length,
      male:   patients.filter((p) => p.gender === "Male").length,
      female: patients.filter((p) => p.gender === "Female").length,
    };
  } catch (err) {
    logger.error("patientService.getPatientStats", err);
    throw new Error("Failed to load patient statistics.");
  }
}
