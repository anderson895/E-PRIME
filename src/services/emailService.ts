/**
 * Email Service — CLIENT-SIDE caller
 *
 * Invokes server-side Firebase Cloud Functions defined in functions/src/email.ts.
 * The actual sending logic (Nodemailer, firebase-functions, etc.) lives in that
 * server package and must NOT be imported here.
 */

import { getFunctions, httpsCallable, HttpsCallableResult } from "firebase/functions";
import app from "@/config/firebase";
import { logger } from "@/utils/logger";

const functions = getFunctions(app);

// ─── Request / Response Types ────────────────────────────────────────────────

interface EmailRequest {
  to: string;
  subject: string;
  html: string;
}

interface AppointmentReminderRequest {
  patientEmail: string;
  patientName: string;
  doctorName: string;
  date: string;
  time: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Translate Firebase Functions error codes to user-friendly messages. */
function translateFunctionsError(err: unknown): string {
  const e = err as { code?: string; message?: string };
  const map: Record<string, string> = {
    "functions/unauthenticated":   "You must be logged in to send emails.",
    "functions/permission-denied": "You don't have permission to send emails.",
    "functions/internal":          "Email service error. Please try again later.",
    "functions/unavailable":       "Email service is temporarily unavailable.",
    "functions/deadline-exceeded": "Email request timed out. Please try again.",
    "functions/not-found":         "Email function not deployed. Contact administrator.",
  };
  if (e.code && map[e.code]) return map[e.code];
  return e.message || "Failed to send email. Please try again.";
}

// ─── Cloud Function Callers ──────────────────────────────────────────────────

/**
 * Call the sendPasswordResetEmail Cloud Function.
 */
export async function callSendPasswordResetEmail(
  data: EmailRequest
): Promise<{ success: boolean; message?: string }> {
  try {
    const fn = httpsCallable<EmailRequest, { success: boolean; message?: string }>(
      functions,
      "sendPasswordResetEmail"
    );
    const result = await fn(data);

    logger.info("emailService.callSendPasswordResetEmail", "Password reset email sent", {
      to: data.to,
    });

    return result.data;
  } catch (err) {
    logger.error("emailService.callSendPasswordResetEmail", err, { to: data.to });
    throw new Error(translateFunctionsError(err));
  }
}

/**
 * Call the sendNotificationEmail Cloud Function.
 */
export async function callSendNotificationEmail(
  data: EmailRequest
): Promise<{ success: boolean }> {
  try {
    const fn = httpsCallable<EmailRequest, { success: boolean }>(
      functions,
      "sendNotificationEmail"
    );
    const result = await fn(data);

    logger.info("emailService.callSendNotificationEmail", "Notification email sent", {
      to: data.to,
      subject: data.subject,
    });

    return result.data;
  } catch (err) {
    logger.error("emailService.callSendNotificationEmail", err, {
      to: data.to,
      subject: data.subject,
    });
    throw new Error(translateFunctionsError(err));
  }
}

/**
 * Call the sendAppointmentReminder Cloud Function.
 */
export async function callSendAppointmentReminder(
  data: AppointmentReminderRequest
): Promise<{ success: boolean }> {
  try {
    const fn = httpsCallable<AppointmentReminderRequest, { success: boolean }>(
      functions,
      "sendAppointmentReminder"
    );
    const result = await fn(data);

    logger.info("emailService.callSendAppointmentReminder", "Appointment reminder sent", {
      patientEmail: data.patientEmail,
      date: data.date,
    });

    return result.data;
  } catch (err) {
    logger.error("emailService.callSendAppointmentReminder", err, {
      patientEmail: data.patientEmail,
      date: data.date,
    });
    throw new Error(translateFunctionsError(err));
  }
}

// ─── Client-side Template Helpers ────────────────────────────────────────────

/**
 * Email template for password reset (no server dependencies).
 */
export function getPasswordResetTemplate(
  userName: string,
  resetLink: string
): string {
  return `
    <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #5B0A0A; padding: 24px; text-align: center;">
        <h1 style="color: #C9A84C; margin: 0;">ePRIME-RHU</h1>
        <p style="color: rgba(255,255,255,0.7); margin: 4px 0 0; font-size: 12px;">
          Mogpog, Marinduque
        </p>
      </div>
      <div style="padding: 32px 24px; background: #FFF8F0;">
        <h2 style="color: #5B0A0A;">Password Reset Request</h2>
        <p>Hello <strong>${userName}</strong>,</p>
        <p>We received a request to reset your password. Click the button below:</p>
        <div style="text-align: center; margin: 24px 0;">
          <a href="${resetLink}"
             style="background: #5B0A0A; color: white; padding: 12px 32px;
                    text-decoration: none; border-radius: 8px; font-weight: 600;">
            Reset Password
          </a>
        </div>
        <p style="color: #666; font-size: 13px;">
          If you didn't request this, please ignore this email.
          This link expires in 1 hour.
        </p>
      </div>
    </div>
  `;
}
