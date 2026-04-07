/**
 * logger.ts — ePRIME-RHU Central Logging Utility
 *
 * Provides structured console logging (dev) and Firestore error logging (prod).
 * Safe to call from anywhere — never throws, never blocks the caller.
 *
 * Usage:
 *   import { logger } from "@/utils/logger";
 *   logger.error("patientService.createPatient", err, { patientId: "P-2024-001" });
 *   logger.warn("authService.loginUser", "Role mismatch detected", { role });
 *   logger.info("authService.loginUser", "User logged in", { uid });
 */

import { collection, addDoc } from "firebase/firestore";

// ─── Types ────────────────────────────────────────────────────────────────────

export type LogLevel = "error" | "warn" | "info" | "debug";

export interface LogEntry {
  level: LogLevel;
  context: string;      // e.g. "patientService.createPatient"
  message: string;
  details?: Record<string, unknown>;
  errorCode?: string;   // Firebase error code if available
  stack?: string;
  timestamp: string;
  env: "development" | "production";
}

// ─── Firebase error code → human-readable message ────────────────────────────

const FIREBASE_ERROR_MESSAGES: Record<string, string> = {
  "auth/invalid-credential":        "Invalid email or password.",
  "auth/user-not-found":            "No account found with this email.",
  "auth/wrong-password":            "Incorrect password.",
  "auth/email-already-in-use":      "This email is already registered.",
  "auth/weak-password":             "Password must be at least 6 characters.",
  "auth/too-many-requests":         "Too many attempts. Please try again later.",
  "auth/network-request-failed":    "Network error. Check your internet connection.",
  "auth/user-disabled":             "This account has been disabled.",
  "auth/expired-action-code":       "This link has expired. Please request a new one.",
  "auth/invalid-action-code":       "This link is invalid or already used.",
  "permission-denied":              "You don't have permission to perform this action.",
  "not-found":                      "The requested resource was not found.",
  "unavailable":                    "Service is temporarily unavailable. Please try again.",
  "deadline-exceeded":              "Request timed out. Please check your connection.",
  "resource-exhausted":             "Too many requests. Please slow down.",
  "already-exists":                 "This record already exists.",
  "cancelled":                      "Operation was cancelled.",
  "internal":                       "An internal server error occurred.",
  "storage/unauthorized":           "You are not authorized to access this file.",
  "storage/canceled":               "File upload was cancelled.",
  "storage/unknown":                "An unknown storage error occurred.",
  "functions/unauthenticated":      "You must be logged in to perform this action.",
  "functions/permission-denied":    "You don't have permission to call this function.",
  "functions/internal":             "A server error occurred. Please try again.",
  "functions/unavailable":          "Service is temporarily unavailable.",
};

/**
 * Translate a Firebase error code to a user-friendly message.
 * Falls back to the original error message if no mapping exists.
 */
export function translateFirebaseError(err: unknown): string {
  if (!err || typeof err !== "object") return "An unexpected error occurred.";
  const e = err as { code?: string; message?: string };
  if (e.code && FIREBASE_ERROR_MESSAGES[e.code]) {
    return FIREBASE_ERROR_MESSAGES[e.code];
  }
  return e.message || "An unexpected error occurred.";
}

/**
 * Check if an error is a specific Firebase error code.
 */
export function isFirebaseError(err: unknown, code: string): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    (err as { code?: string }).code === code
  );
}

// ─── Core Logger ──────────────────────────────────────────────────────────────

const isDev = import.meta.env.DEV;

/**
 * Build a structured LogEntry from any thrown value.
 */
function buildEntry(
  level: LogLevel,
  context: string,
  errOrMessage: unknown,
  details?: Record<string, unknown>
): LogEntry {
  const timestamp = new Date().toISOString();
  const env = isDev ? "development" : "production";

  if (errOrMessage instanceof Error || (typeof errOrMessage === "object" && errOrMessage !== null)) {
    const e = errOrMessage as { message?: string; code?: string; stack?: string };
    return {
      level,
      context,
      message: e.message || String(errOrMessage),
      details,
      errorCode: e.code,
      stack: e.stack,
      timestamp,
      env,
    };
  }

  return {
    level,
    context,
    message: String(errOrMessage),
    details,
    timestamp,
    env,
  };
}

/**
 * Print to console with grouping in dev mode.
 */
function toConsole(entry: LogEntry): void {
  const prefix = `[ePRIME-RHU] [${entry.level.toUpperCase()}] ${entry.context}`;

  if (isDev) {
    const groupFn =
      entry.level === "error" ? console.error :
      entry.level === "warn"  ? console.warn  :
      console.log;

    groupFn(`${prefix} — ${entry.message}`);
    if (entry.errorCode) console.log("  Error Code:", entry.errorCode);
    if (entry.details)   console.log("  Details:", entry.details);
    if (entry.stack)     console.log("  Stack:", entry.stack);
  } else {
    // Production: single-line JSON to avoid leaking stack traces in plain text
    const payload: Record<string, unknown> = {
      level: entry.level,
      context: entry.context,
      message: entry.message,
      timestamp: entry.timestamp,
    };
    if (entry.errorCode) payload.errorCode = entry.errorCode;
    if (entry.details)   payload.details   = entry.details;

    if (entry.level === "error") console.error(prefix, payload);
    else if (entry.level === "warn") console.warn(prefix, payload);
    else console.log(prefix, payload);
  }
}

/**
 * Persist error/warn entries to Firestore `errorLogs` collection.
 * Fire-and-forget — failure here must never surface to the user.
 */
async function persistToFirestore(entry: LogEntry): Promise<void> {
  // Only persist errors and warnings; skip verbose info/debug
  if (entry.level !== "error" && entry.level !== "warn") return;

  try {
    // Lazy-import db to avoid circular dependency issues
    const { db } = await import("@/config/firebase");
    await addDoc(collection(db, "errorLogs"), {
      level:     entry.level,
      context:   entry.context,
      message:   entry.message,
      errorCode: entry.errorCode ?? null,
      details:   entry.details ?? null,
      // Never store full stack traces in Firestore (security + cost)
      timestamp: entry.timestamp,
      env:       entry.env,
    });
  } catch {
    // Silently swallow — logging must never cause cascading failures
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

export const logger = {
  /**
   * Log an error. Pass the raw caught value as `err`.
   * @param context  Dot-notation identifier e.g. "patientService.createPatient"
   * @param err      The caught error (any type)
   * @param details  Optional extra key/value pairs for debugging
   */
  error(context: string, err: unknown, details?: Record<string, unknown>): void {
    const entry = buildEntry("error", context, err, details);
    toConsole(entry);
    void persistToFirestore(entry);
  },

  /**
   * Log a warning (non-fatal unexpected condition).
   */
  warn(context: string, message: string, details?: Record<string, unknown>): void {
    const entry = buildEntry("warn", context, message, details);
    toConsole(entry);
    void persistToFirestore(entry);
  },

  /**
   * Log an informational event (significant state changes, audits).
   * Console-only — not persisted to Firestore.
   */
  info(context: string, message: string, details?: Record<string, unknown>): void {
    const entry = buildEntry("info", context, message, details);
    toConsole(entry);
  },

  /**
   * Log a debug message (dev only — silently dropped in production).
   */
  debug(context: string, message: string, details?: Record<string, unknown>): void {
    if (!isDev) return;
    const entry = buildEntry("debug", context, message, details);
    toConsole(entry);
  },
};
