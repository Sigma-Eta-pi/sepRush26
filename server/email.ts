import nodemailer from "nodemailer";

const configured = !!(
  process.env.EMAIL_HOST &&
  process.env.EMAIL_USER &&
  process.env.EMAIL_PASS
);

const transporter = configured
  ? nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT || "587"),
      secure: process.env.EMAIL_PORT === "465",
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    })
  : null;

const FROM =
  process.env.EMAIL_FROM || process.env.EMAIL_USER || "noreply@ucsbsep.org";
const APP_URL = process.env.APP_URL || "http://localhost:3000";

function baseTemplate(body: string) {
  return `
    <div style="font-family:Inter,sans-serif;max-width:520px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
      <div style="background:#05006C;padding:24px 32px;">
        <span style="color:#EEEADE;font-weight:700;font-size:16px;letter-spacing:2px;">SIGMA ETA PI</span>
        <span style="color:#EEEADE;opacity:0.5;font-size:12px;margin-left:8px;letter-spacing:1px;">EPSILON CHAPTER</span>
      </div>
      <div style="padding:32px;">${body}</div>
      <div style="background:#f9fafb;padding:16px 32px;border-top:1px solid #e5e7eb;">
        <p style="color:#9ca3af;font-size:11px;margin:0;">Sigma Eta Pi — UC Santa Barbara Epsilon Chapter</p>
      </div>
    </div>
  `;
}

export async function sendPasswordResetEmail(to: string, token: string) {
  const link = `${APP_URL}/reset-password?token=${token}`;
  const html = baseTemplate(`
    <h2 style="color:#05006C;margin:0 0 12px;">Reset Your Password</h2>
    <p style="color:#374151;margin:0 0 24px;">Click below to set a new password for your SEP account. This link expires in 24 hours.</p>
    <a href="${link}" style="display:inline-block;background:#05006C;color:#EEEADE;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px;">Reset Password</a>
    <p style="color:#9ca3af;font-size:12px;margin-top:24px;">If you didn't request this, ignore this email.<br/><a href="${link}" style="color:#9ca3af;">${link}</a></p>
  `);
  if (!transporter) {
    console.log(`[EMAIL] Password reset for ${to}: ${link}`);
    return;
  }
  await transporter.sendMail({
    from: FROM,
    to,
    subject: "Reset your SEP password",
    html,
  });
}

export async function sendWelcomeEmail(to: string, token: string) {
  const link = `${APP_URL}/reset-password?token=${token}`;
  const html = baseTemplate(`
    <h2 style="color:#05006C;margin:0 0 12px;">Welcome to SEP Epsilon!</h2>
    <p style="color:#374151;margin:0 0 8px;">Your account has been created. Set your password to get started.</p>
    <p style="color:#6b7280;font-size:13px;margin:0 0 24px;">After logging in you'll complete a quick profile setup.</p>
    <a href="${link}" style="display:inline-block;background:#05006C;color:#EEEADE;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px;">Set My Password</a>
    <p style="color:#9ca3af;font-size:12px;margin-top:24px;">Link expires in 24 hours.<br/><a href="${link}" style="color:#9ca3af;">${link}</a></p>
  `);
  if (!transporter) {
    console.log(`[EMAIL] Welcome email for ${to}: ${link}`);
    return;
  }
  await transporter.sendMail({
    from: FROM,
    to,
    subject: "Welcome to SEP Epsilon — Set your password",
    html,
  });
}

export async function sendBlastEmail(
  recipients: string[],
  subject: string,
  content: string,
  senderName: string
) {
  const html = baseTemplate(`
    <p style="color:#374151;white-space:pre-wrap;line-height:1.7;margin:0 0 32px;">${content.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>
    <hr style="border:none;border-top:1px solid #e5e7eb;margin:0 0 16px;"/>
    <p style="color:#9ca3af;font-size:12px;margin:0;">— ${senderName}, SEP Epsilon Executive Board</p>
  `);
  if (!transporter) {
    console.log(
      `[EMAIL] Blast "${subject}" to ${recipients.length} recipients (not configured)`
    );
    return;
  }
  for (const to of recipients) {
    await transporter.sendMail({ from: FROM, to, subject, html });
  }
}
