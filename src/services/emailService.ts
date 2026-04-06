/**
 * Email Service — CLIENT-SIDE caller
 *
 * Invokes the server-side Firebase Cloud Functions defined in functions/src/email.ts.
 * The actual sending logic (Nodemailer, firebase-functions, etc.) lives in that
 * server package and must NOT be imported here.
 */

import { getFunctions, httpsCallable } from "firebase/functions";
import app from "@/config/firebase";

const functions = getFunctions(app);

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

/** Call the sendPasswordResetEmail Cloud Function */
export async function callSendPasswordResetEmail(
  data: EmailRequest
): Promise<{ success: boolean; message?: string }> {
  const fn = httpsCallable<EmailRequest, { success: boolean; message?: string }>(
    functions,
    "sendPasswordResetEmail"
  );
  const result = await fn(data);
  return result.data;
}

/** Call the sendNotificationEmail Cloud Function */
export async function callSendNotificationEmail(
  data: EmailRequest
): Promise<{ success: boolean }> {
  const fn = httpsCallable<EmailRequest, { success: boolean }>(
    functions,
    "sendNotificationEmail"
  );
  const result = await fn(data);
  return result.data;
}

/** Call the sendAppointmentReminder Cloud Function */
export async function callSendAppointmentReminder(
  data: AppointmentReminderRequest
): Promise<{ success: boolean }> {
  const fn = httpsCallable<AppointmentReminderRequest, { success: boolean }>(
    functions,
    "sendAppointmentReminder"
  );
  const result = await fn(data);
  return result.data;
}

/**
 * Email template for password reset (client-side helper — no server deps)
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