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
