/**
 * Email Service using Nodemailer + Gmail SMTP
 *
 * IMPORTANT: This code runs on the SERVER side only.
 * Deploy as a Firebase Cloud Function or Express API endpoint.
 *
 * For Firebase Functions, install:
 *   npm install nodemailer firebase-functions firebase-admin
 *
 * For Express:
 *   npm install nodemailer express cors
 */

// ─── Firebase Cloud Functions version ───────────────────────────
// File: functions/src/email.ts

import * as functions from "firebase-functions";
import * as nodemailer from "nodemailer";

// Configure Gmail SMTP transporter
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER || functions.config().smtp?.user,
    pass: process.env.SMTP_PASS || functions.config().smtp?.pass,
  },
});

interface EmailRequest {
  to: string;
  subject: string;
  html: string;
}

/**
 * Cloud Function: Send password reset email
 */
export const sendPasswordResetEmail = functions.https.onCall(
  async (data: EmailRequest) => {
    try {
      await transporter.sendMail({
        from: `"ePRIME-RHU Mogpog" <${process.env.SMTP_USER || functions.config().smtp?.user}>`,
        to: data.to,
        subject: data.subject,
        html: data.html,
      });
      return { success: true, message: "Email sent successfully" };
    } catch (error: any) {
      throw new functions.https.HttpsError(
        "internal",
        `Failed to send email: ${error.message}`
      );
    }
  }
);

/**
 * Cloud Function: Send notification email
 */
export const sendNotificationEmail = functions.https.onCall(
  async (data: EmailRequest) => {
    try {
      await transporter.sendMail({
        from: `"ePRIME-RHU Mogpog" <${process.env.SMTP_USER || functions.config().smtp?.user}>`,
        to: data.to,
        subject: data.subject,
        html: data.html,
      });
      return { success: true };
    } catch (error: any) {
      throw new functions.https.HttpsError("internal", error.message);
    }
  }
);

/**
 * Cloud Function: Send appointment reminder
 */
export const sendAppointmentReminder = functions.https.onCall(
  async (data: {
    patientEmail: string;
    patientName: string;
    doctorName: string;
    date: string;
    time: string;
  }) => {
    const html = `
      <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #5B0A0A; padding: 24px; text-align: center;">
          <h1 style="color: #C9A84C; margin: 0; font-size: 24px;">ePRIME-RHU</h1>
          <p style="color: rgba(255,255,255,0.7); margin: 4px 0 0; font-size: 12px;">
            Electronic Patient Record Information and Management System
          </p>
        </div>
        <div style="padding: 32px 24px; background: #FFF8F0;">
          <h2 style="color: #5B0A0A; margin: 0 0 16px;">Appointment Reminder</h2>
          <p>Dear <strong>${data.patientName}</strong>,</p>
          <p>This is a reminder for your upcoming appointment:</p>
          <div style="background: white; border-left: 4px solid #C9A84C; padding: 16px; margin: 16px 0; border-radius: 4px;">
            <p style="margin: 4px 0;"><strong>Doctor:</strong> ${data.doctorName}</p>
            <p style="margin: 4px 0;"><strong>Date:</strong> ${data.date}</p>
            <p style="margin: 4px 0;"><strong>Time:</strong> ${data.time}</p>
          </div>
          <p>Please arrive 15 minutes before your scheduled time.</p>
          <p style="color: #666; font-size: 12px; margin-top: 32px;">
            Rural Health Unit of Mogpog, Marinduque<br/>
            Contact: (042) 332-XXXX
          </p>
        </div>
      </div>
    `;

    try {
      await transporter.sendMail({
        from: `"ePRIME-RHU Mogpog" <${process.env.SMTP_USER || functions.config().smtp?.user}>`,
        to: data.patientEmail,
        subject: `Appointment Reminder - ${data.date}`,
        html,
      });
      return { success: true };
    } catch (error: any) {
      throw new functions.https.HttpsError("internal", error.message);
    }
  }
);

/**
 * Email template for password reset
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
