import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtpout.secureserver.net',
  port: parseInt(process.env.SMTP_PORT || '465'),
  secure: process.env.SMTP_PORT === '465' || !process.env.SMTP_PORT, // true for 465
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendPaymentRejectedEmail(to: string, name: string) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn("SMTP credentials not configured. Email not sent.");
    return false;
  }

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

  try {
    await transporter.sendMail({
      from: `"REVIVAL" <${process.env.SMTP_USER}>`,
      to,
      subject: 'REVIVAL Registration - Action Required',
      html,
    });
    return true;
  } catch (error) {
    console.error("Failed to send rejection email:", error);
    return false;
  }
}
