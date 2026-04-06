import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  where,
  onSnapshot,
  Unsubscribe,
} from "firebase/firestore";
import { db } from "@/config/firebase";
import type { SystemLog, UserAccount, BackupRecord } from "@/types";

// ─── System Logs ────────────────────────────────────────────────
const LOGS_COLLECTION = "systemLogs";

export async function addSystemLog(
  log: Omit<SystemLog, "id" | "timestamp">
): Promise<void> {
  await addDoc(collection(db, LOGS_COLLECTION), {
    ...log,
    timestamp: new Date().toISOString(),
  });
}

export async function getSystemLogs(limitCount = 100): Promise<SystemLog[]> {
  const q = query(
    collection(db, LOGS_COLLECTION),
    orderBy("timestamp", "desc")
  );
  const snapshot = await getDocs(q);
  return snapshot.docs
    .slice(0, limitCount)
    .map((d) => ({ id: d.id, ...d.data() } as SystemLog));
}

export function subscribeToLogs(
  callback: (logs: SystemLog[]) => void
): Unsubscribe {
  const q = query(
    collection(db, LOGS_COLLECTION),
    orderBy("timestamp", "desc")
  );
  return onSnapshot(q, (snapshot) => {
    callback(
      snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as SystemLog))
    );
  });
}

// ─── User Management (Admin) ────────────────────────────────────
const USERS_COLLECTION = "users";

export async function getAllUsers(): Promise<UserAccount[]> {
  const snapshot = await getDocs(
    query(collection(db, USERS_COLLECTION), orderBy("createdAt", "desc"))
  );
  return snapshot.docs.map(
    (d) => ({ uid: d.id, ...d.data() } as UserAccount)
  );
}

export async function updateUserAccount(
  uid: string,
  data: Partial<UserAccount>
): Promise<void> {
  await updateDoc(doc(db, USERS_COLLECTION, uid), data);
}

export async function deactivateUser(uid: string): Promise<void> {
  await updateDoc(doc(db, USERS_COLLECTION, uid), { isActive: false });
}

export async function activateUser(uid: string): Promise<void> {
  await updateDoc(doc(db, USERS_COLLECTION, uid), { isActive: true });
}

// ─── Backup Records ─────────────────────────────────────────────
const BACKUP_COLLECTION = "backups";

export async function createBackupRecord(
  data: Omit<BackupRecord, "id">
): Promise<void> {
  await addDoc(collection(db, BACKUP_COLLECTION), data);
}

export async function getBackupRecords(): Promise<BackupRecord[]> {
  const q = query(
    collection(db, BACKUP_COLLECTION),
    orderBy("date", "desc")
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(
    (d) => ({ id: d.id, ...d.data() } as BackupRecord)
  );
}
