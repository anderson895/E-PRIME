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
import { logger, translateFirebaseError } from "@/utils/logger";
import type { SystemLog, UserAccount, BackupRecord } from "@/types";

// ─── System Logs ────────────────────────────────────────────────────────────

const LOGS_COLLECTION = "systemLogs";

/**
 * Write a system activity log entry.
 * Fire-and-forget safe — caller should not await if non-critical.
 */
export async function addSystemLog(
  log: Omit<SystemLog, "id" | "timestamp">
): Promise<void> {
  try {
    await addDoc(collection(db, LOGS_COLLECTION), {
      ...log,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    // Log to console only — never throw from a logging function
    logger.error("adminService.addSystemLog", err, {
      action: log.action,
      userId: log.userId,
    });
  }
}

/**
 * Get the most recent system logs.
 */
export async function getSystemLogs(limitCount = 100): Promise<SystemLog[]> {
  try {
    const q = query(
      collection(db, LOGS_COLLECTION),
      orderBy("timestamp", "desc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs
      .slice(0, limitCount)
      .map((d) => ({ id: d.id, ...d.data() } as SystemLog));
  } catch (err) {
    logger.error("adminService.getSystemLogs", err, { limitCount });
    throw new Error("Failed to load system logs. Please try again.");
  }
}

/**
 * Subscribe to realtime system log updates.
 */
export function subscribeToLogs(
  callback: (logs: SystemLog[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const q = query(
    collection(db, LOGS_COLLECTION),
    orderBy("timestamp", "desc")
  );

  return onSnapshot(
    q,
    (snapshot) => {
      try {
        callback(
          snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as SystemLog))
        );
      } catch (err) {
        logger.error("adminService.subscribeToLogs", err, {
          context: "snapshot callback",
        });
        onError?.(err instanceof Error ? err : new Error(String(err)));
      }
    },
    (err) => {
      logger.error("adminService.subscribeToLogs", err, {
        context: "onSnapshot listener",
      });
      onError?.(err);
    }
  );
}

// ─── User Management (Admin) ────────────────────────────────────────────────

const USERS_COLLECTION = "users";

/**
 * Get all user accounts ordered by creation date.
 */
export async function getAllUsers(): Promise<UserAccount[]> {
  try {
    const snapshot = await getDocs(
      query(collection(db, USERS_COLLECTION), orderBy("createdAt", "desc"))
    );
    return snapshot.docs.map(
      (d) => ({ uid: d.id, ...d.data() } as UserAccount)
    );
  } catch (err) {
    logger.error("adminService.getAllUsers", err);
    throw new Error("Failed to load user accounts. Please try again.");
  }
}

/**
 * Update a user account record.
 */
export async function updateUserAccount(
  uid: string,
  data: Partial<UserAccount>
): Promise<void> {
  try {
    await updateDoc(doc(db, USERS_COLLECTION, uid), data);
    logger.info("adminService.updateUserAccount", "User account updated", { uid });
  } catch (err) {
    logger.error("adminService.updateUserAccount", err, { uid });
    throw new Error(translateFirebaseError(err));
  }
}

/**
 * Deactivate a user account.
 */
export async function deactivateUser(uid: string): Promise<void> {
  try {
    await updateDoc(doc(db, USERS_COLLECTION, uid), { isActive: false });
    logger.info("adminService.deactivateUser", "User deactivated", { uid });
  } catch (err) {
    logger.error("adminService.deactivateUser", err, { uid });
    throw new Error(translateFirebaseError(err));
  }
}

/**
 * Reactivate a user account.
 */
export async function activateUser(uid: string): Promise<void> {
  try {
    await updateDoc(doc(db, USERS_COLLECTION, uid), { isActive: true });
    logger.info("adminService.activateUser", "User activated", { uid });
  } catch (err) {
    logger.error("adminService.activateUser", err, { uid });
    throw new Error(translateFirebaseError(err));
  }
}

// ─── Backup Records ─────────────────────────────────────────────────────────

const BACKUP_COLLECTION = "backups";

/**
 * Record a new backup entry.
 */
export async function createBackupRecord(
  data: Omit<BackupRecord, "id">
): Promise<void> {
  try {
    await addDoc(collection(db, BACKUP_COLLECTION), data);
    logger.info("adminService.createBackupRecord", "Backup record created");
  } catch (err) {
    logger.error("adminService.createBackupRecord", err);
    throw new Error(translateFirebaseError(err));
  }
}

/**
 * Get all backup records ordered by date descending.
 */
export async function getBackupRecords(): Promise<BackupRecord[]> {
  try {
    const q = query(
      collection(db, BACKUP_COLLECTION),
      orderBy("date", "desc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(
      (d) => ({ id: d.id, ...d.data() } as BackupRecord)
    );
  } catch (err) {
    logger.error("adminService.getBackupRecords", err);
    throw new Error("Failed to load backup history. Please try again.");
  }
}
