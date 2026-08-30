import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";

interface EmailConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  fromName: string;
  fromEmail: string;
  secure?: boolean;
}

let transporter: Transporter | null = null;

function getTransporter(): Transporter {
  if (transporter) return transporter;

  const config: EmailConfig = {
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT || 587),
    user: process.env.SMTP_USER || "",
    password: process.env.SMTP_PASSWORD || "",
    fromName: process.env.EMAIL_FROM_NAME || "Doctor Directory",
    fromEmail: process.env.EMAIL_FROM_ADDRESS || "noreply@doctordirectory.com",
    secure: process.env.SMTP_SECURE === "true",
  };

  if (!config.user || !config.password) {
    throw new Error(
      "Email service not configured. Please set SMTP_USER and SMTP_PASSWORD environment variables."
    );
  }

  transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.password,
    },
  });

  return transporter;
}

export interface OtpEmailData {
  to: string;
  userName: string;
  otp: string;
  expiresMinutes: number;
  purpose: "password_reset" | "email_verification" | "two_factor";
}

export async function sendOtpEmail(data: OtpEmailData): Promise<{ success: boolean; error?: string }> {
  try {
    const config: EmailConfig = {
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: Number(process.env.SMTP_PORT || 587),
      user: process.env.SMTP_USER || "",
      password: process.env.SMTP_PASSWORD || "",
      fromName: process.env.EMAIL_FROM_NAME || "Doctor Directory",
      fromEmail: process.env.EMAIL_FROM_ADDRESS || "noreply@doctordirectory.com",
    };

    const subjectMap = {
      password_reset: "Password Reset Verification Code",
      email_verification: "Verify Your Email Address",
      two_factor: "Two-Factor Authentication Code",
    };

    const transport = getTransporter();

    const mailOptions = {
      from: `"${config.fromName}" <${config.fromEmail}>`,
      to: data.to,
      subject: subjectMap[data.purpose],
      html: getOtpEmailTemplate(data),
      text: getOtpEmailText(data),
    };

    const info = await transport.sendMail(mailOptions);
    console.log("OTP email sent successfully:", info.messageId);
    return { success: true };
  } catch (error) {
    console.error("Failed to send OTP email:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

function getOtpEmailText(data: OtpEmailData): string {
  return `
Hello ${data.userName},

Your Doctor Directory verification code is: ${data.otp}

This code will expire in ${data.expiresMinutes} minutes.

If you did not request this code, please ignore this email or contact our support team.

Best regards,
Doctor Directory Team
  `.trim();
}

function getOtpEmailTemplate(data: OtpEmailData): string {
  const purposeText = {
    password_reset: "reset your password",
    email_verification: "verify your email address",
    two_factor: "complete your sign-in",
  };

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verification Code</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f8fafc; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 480px; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
          <!-- Header -->
          <tr>
            <td style="padding: 32px 32px 16px; text-align: center; border-bottom: 1px solid #e2e8f0;">
              <h1 style="margin: 0; color: #0f172a; font-size: 20px; font-weight: 700;">Doctor Directory</h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 32px;">
              <p style="margin: 0 0 8px; color: #0f172a; font-size: 16px; font-weight: 600;">Hello ${escapeHtml(data.userName)},</p>
              <p style="margin: 0 0 24px; color: #64748b; font-size: 14px; line-height: 1.5;">
                Use the following verification code to ${purposeText[data.purpose]}. This code is valid for ${data.expiresMinutes} minutes.
              </p>

              <!-- OTP Code Box -->
              <div style="background-color: #f1f5f9; border: 2px dashed #cbd5e1; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
                <p style="margin: 0 0 8px; color: #64748b; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Your Verification Code</p>
                <p style="margin: 0; color: #0f172a; font-size: 32px; font-weight: 800; letter-spacing: 8px; font-family: 'Courier New', monospace;">${data.otp}</p>
              </div>

              <!-- Warning -->
              <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 4px; padding: 12px; margin: 24px 0;">
                <p style="margin: 0; color: #92400e; font-size: 13px; line-height: 1.4;">
                  <strong>⚠️ Security Notice:</strong> Never share this code with anyone. Doctor Directory staff will never ask for your verification code.
                </p>
              </div>

              <p style="margin: 24px 0 8px; color: #64748b; font-size: 13px; line-height: 1.5;">
                If you did not request this code, please ignore this email or contact our support team.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 16px 32px 32px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0; color: #94a3b8; font-size: 12px;">
                &copy; ${new Date().getFullYear()} Doctor Directory Bangladesh
              </p>
              <p style="margin: 8px 0 0; color: #94a3b8; font-size: 11px;">
                This is an automated message. Please do not reply.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

export async function verifyEmailConfig(): Promise<boolean> {
  try {
    const transport = getTransporter();
    await transport.verify();
    return true;
  } catch (error) {
    console.error("Email configuration verification failed:", error);
    return false;
  }
}

// =====================================================================
// Booking-related email templates
// =====================================================================

export interface BookingEmailData {
  to: string;
  patientName: string;
  doctorName: string;
  specialty: string | null;
  serialNumber: number;
  slotDate: Date;
  startTime: Date;
}

export async function sendBookingConfirmationEmail(data: BookingEmailData): Promise<{ success: boolean; error?: string }> {
  try {
    const config: EmailConfig = {
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: Number(process.env.SMTP_PORT || 587),
      user: process.env.SMTP_USER || "",
      password: process.env.SMTP_PASSWORD || "",
      fromName: process.env.EMAIL_FROM_NAME || "Doctor Directory",
      fromEmail: process.env.EMAIL_FROM_ADDRESS || "noreply@doctordirectory.com",
    };

    const transport = getTransporter();
    const dateStr = data.slotDate.toLocaleDateString("en-GB", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    const timeStr = data.startTime.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    const mailOptions = {
      from: `"${config.fromName}" <${config.fromEmail}>`,
      to: data.to,
      subject: `✓ Serial #${data.serialNumber} Confirmed with ${data.doctorName}`,
      html: getBookingEmailTemplate(data, dateStr, timeStr),
      text: getBookingEmailText(data, dateStr, timeStr),
    };

    await transport.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error("Failed to send booking email:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

function getBookingEmailText(data: BookingEmailData, dateStr: string, timeStr: string): string {
  return `
Hi ${data.patientName},

Your appointment has been confirmed!

Doctor: ${data.doctorName}${data.specialty ? ` (${data.specialty})` : ""}
Serial Number: #${data.serialNumber}
Date: ${dateStr}
Time: ${timeStr}

Please arrive at the chamber 10-15 minutes before your scheduled time. Show this email or your serial number to the receptionist.

To view your live queue position or cancel this appointment, log in to your account at drchamber.info

Best regards,
Dr Chamber Directory Team
  `.trim();
}

function getBookingEmailTemplate(data: BookingEmailData, dateStr: string, timeStr: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f8fafc; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 500px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
          <!-- Success Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 32px; text-align: center;">
              <div style="display: inline-block; background-color: rgba(255,255,255,0.2); border-radius: 50%; padding: 16px; margin-bottom: 12px;">
                <span style="font-size: 32px;">✓</span>
              </div>
              <h1 style="margin: 0; color: #ffffff; font-size: 22px; font-weight: 700;">Appointment Confirmed!</h1>
            </td>
          </tr>

          <!-- Serial Number -->
          <tr>
            <td style="padding: 32px 32px 0;">
              <p style="margin: 0 0 8px; color: #64748b; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; text-align: center;">Your Serial Number</p>
              <div style="background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%); border: 2px dashed #cbd5e1; border-radius: 16px; padding: 24px; text-align: center; margin-bottom: 24px;">
                <p style="margin: 0; color: #0f172a; font-size: 48px; font-weight: 800; line-height: 1;">#${data.serialNumber}</p>
              </div>
            </td>
          </tr>

          <!-- Doctor & Date Info -->
          <tr>
            <td style="padding: 0 32px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="padding: 16px; background-color: #f8fafc; border-radius: 12px; margin-bottom: 8px;">
                    <p style="margin: 0 0 4px; color: #64748b; font-size: 11px; font-weight: 600; text-transform: uppercase;">Doctor</p>
                    <p style="margin: 0; color: #0f172a; font-size: 16px; font-weight: 700;">${escapeHtml(data.doctorName)}</p>
                    ${data.specialty ? `<p style="margin: 4px 0 0; color: #64748b; font-size: 13px;">${escapeHtml(data.specialty)}</p>` : ""}
                  </td>
                </tr>
                <tr><td style="height: 12px;"></td></tr>
                <tr>
                  <td style="padding: 16px; background-color: #f8fafc; border-radius: 12px;">
                    <p style="margin: 0 0 4px; color: #64748b; font-size: 11px; font-weight: 600; text-transform: uppercase;">Date & Time</p>
                    <p style="margin: 0; color: #0f172a; font-size: 14px; font-weight: 600;">${dateStr}</p>
                    <p style="margin: 4px 0 0; color: #6366f1; font-size: 18px; font-weight: 800;">${timeStr}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Instructions -->
          <tr>
            <td style="padding: 24px 32px;">
              <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 4px; padding: 12px 16px;">
                <p style="margin: 0 0 4px; color: #92400e; font-size: 13px; font-weight: 600;">📌 Important Reminders</p>
                <ul style="margin: 8px 0 0; padding-left: 16px; color: #92400e; font-size: 12px; line-height: 1.6;">
                  <li>Arrive 10-15 minutes before your scheduled time</li>
                  <li>Show this email or your serial number at reception</li>
                  <li>You can check live queue position from your account</li>
                </ul>
              </div>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding: 0 32px 32px; text-align: center;">
              <a href="${process.env.NEXTAUTH_URL || "https://drchamber.info"}/dashboard/appointments" style="display: inline-block; background-color: #0f172a; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-size: 14px; font-weight: 700;">View My Appointments</a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 16px 32px 32px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0; color: #94a3b8; font-size: 12px;">&copy; ${new Date().getFullYear()} Dr Chamber Directory</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

export interface QueueAdvanceEmailData {
  to: string;
  patientName: string;
  doctorName: string;
  serialNumber: number;
}

export async function sendQueueAdvanceEmail(data: QueueAdvanceEmailData): Promise<{ success: boolean; error?: string }> {
  try {
    const config: EmailConfig = {
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: Number(process.env.SMTP_PORT || 587),
      user: process.env.SMTP_USER || "",
      password: process.env.SMTP_PASSWORD || "",
      fromName: process.env.EMAIL_FROM_NAME || "Doctor Directory",
      fromEmail: process.env.EMAIL_FROM_ADDRESS || "noreply@doctordirectory.com",
    };

    const transport = getTransporter();
    const mailOptions = {
      from: `"${config.fromName}" <${config.fromEmail}>`,
      to: data.to,
      subject: `🔔 You're next! Serial #${data.serialNumber} with ${data.doctorName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); padding: 24px; text-align: center; border-radius: 12px 12px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 22px;">🔔 You're Next!</h1>
          </div>
          <div style="background: white; padding: 24px; border-radius: 0 0 12px 12px; border: 1px solid #e2e8f0;">
            <p style="color: #0f172a; font-size: 16px; line-height: 1.5;">Hi ${escapeHtml(data.patientName)},</p>
            <p style="color: #0f172a; font-size: 16px; line-height: 1.5;">Your serial <strong>#${data.serialNumber}</strong> with <strong>${escapeHtml(data.doctorName)}</strong> is up next. Please be ready at the chamber reception now.</p>
            <p style="color: #64748b; font-size: 13px;">If you no longer need this appointment, please cancel from your account to free the slot for others.</p>
          </div>
        </div>
      `,
      text: `Hi ${data.patientName}, your serial #${data.serialNumber} with ${data.doctorName} is up next. Please be ready at the chamber now.`,
    };

    await transport.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error("Failed to send queue advance email:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export interface CancellationEmailData {
  to: string;
  patientName: string;
  doctorName: string;
  serialNumber: number;
  reason?: string;
}

export async function sendCancellationEmail(data: CancellationEmailData): Promise<{ success: boolean; error?: string }> {
  try {
    const config: EmailConfig = {
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: Number(process.env.SMTP_PORT || 587),
      user: process.env.SMTP_USER || "",
      password: process.env.SMTP_PASSWORD || "",
      fromName: process.env.EMAIL_FROM_NAME || "Doctor Directory",
      fromEmail: process.env.EMAIL_FROM_ADDRESS || "noreply@doctordirectory.com",
    };

    const transport = getTransporter();
    const mailOptions = {
      from: `"${config.fromName}" <${config.fromEmail}>`,
      to: data.to,
      subject: `Appointment Cancelled - Serial #${data.serialNumber}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #0f172a;">Appointment Cancelled</h2>
          <p>Hi ${escapeHtml(data.patientName)},</p>
          <p>Your appointment (Serial #${data.serialNumber}) with ${escapeHtml(data.doctorName)} has been cancelled.${data.reason ? ` Reason: ${escapeHtml(data.reason)}` : ""}</p>
          <p>You can book a new appointment anytime at drchamber.info</p>
        </div>
      `,
      text: `Hi ${data.patientName}, your appointment (Serial #${data.serialNumber}) with ${data.doctorName} has been cancelled.${data.reason ? ` Reason: ${data.reason}` : ""}`,
    };

    await transport.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error("Failed to send cancellation email:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}
