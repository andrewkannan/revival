import nodemailer from 'nodemailer';
import prisma from './prisma';
import dns from 'dns';

// Force Node.js to resolve IPv4 addresses first globally.
// This prevents ENETUNREACH errors on Railway when trying to route Google SMTP via IPv6.
dns.setDefaultResultOrder('ipv4first');

export async function getTransporter() {
  const settings = await prisma.emailSettings.findFirst();
  
  const host = settings?.host || process.env.SMTP_HOST || 'smtpout.secureserver.net';
  const port = settings?.port || parseInt(process.env.SMTP_PORT || '465');
  const user = settings?.username || process.env.SMTP_USER;
  const pass = settings?.password || process.env.SMTP_PASS;

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    connectionTimeout: 20000,
    greetingTimeout: 20000,
    socketTimeout: 20000,
    auth: {
      user,
      pass,
    },
  });
}

export async function sendEmail(to: string, subject: string, html: string, attachments?: any[]) {
  const settings = await prisma.emailSettings.findFirst();
  const user = settings?.username || process.env.SMTP_USER;
  const fromName = settings?.fromName || "REVIVAL Team";
  const fromEmail = settings?.fromEmail || user;

  if (!user) {
    console.warn("SMTP credentials not configured. Email not sent.");
    return false;
  }

  const transporter = await getTransporter();

  try {
    await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to,
      subject,
      html,
      attachments,
    });
    
    // Log success
    try {
      await prisma.emailLog.create({
        data: {
          to,
          subject,
          status: 'SENT'
        }
      });
    } catch (dbError) {
      console.error("Failed to log email success to DB:", dbError);
    }
    
    return true;
  } catch (error: any) {
    console.error("Failed to send email:", error);
    
    // Log failure
    try {
      await prisma.emailLog.create({
        data: {
          to,
          subject,
          status: 'FAILED',
          error: error?.message || 'Unknown error'
        }
      });
    } catch (dbError) {
      console.error("Failed to log email failure to DB:", dbError);
    }
    
    return false;
  }
}

export async function sendPaymentRejectedEmail(to: string, name: string) {
  const html = `
    <div style="font-family: sans-serif; max-w: 600px; margin: 0 auto;">
      <h2 style="color: #ef4444;">Payment Verification Failed</h2>
      <p>Hi ${name},</p>
      <p>We received your ticket registration for the REVIVAL conference, but unfortunately, we were unable to verify the payment receipt you uploaded.</p>
      <p>Please double-check your bank transfer and <strong>reply to this email</strong> with a clear screenshot of the successful transaction.</p>
      <p>If you have not made the payment yet, please transfer the required amount to our account and send us the receipt.</p>
      <br />
      <p>Thank you,<br />The REVIVAL Team</p>
    </div>
  `;

  return sendEmail(to, 'REVIVAL Registration - Action Required', html);
}

export function parseTemplate(template: string, data: Record<string, string>) {
  let parsed = template;
  for (const [key, value] of Object.entries(data)) {
    parsed = parsed.replace(new RegExp(`{{${key}}}`, 'g'), value);
  }
  return parsed;
}
