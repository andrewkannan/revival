const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const newHtml = `
<div style="max-width: 500px; margin: 20px auto; border: 2px solid #e5e7eb; border-radius: 16px; overflow: hidden; font-family: sans-serif; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
  <div style="background-color: #0f172a; color: white; padding: 20px; text-align: center;">
    <h2 style="margin: 0; font-size: 24px; letter-spacing: 2px;">REVIVAL 2026</h2>
    <p style="margin: 5px 0 0; color: #94a3b8; font-size: 14px;">Registration Invoice</p>
  </div>
  <div style="padding: 30px 20px; background-color: white;">
    <p style="font-size: 18px; color: #0f172a; font-weight: bold;">Hi {{name}},</p>
    <p style="color: #475569; line-height: 1.6;">Thank you for registering for the REVIVAL conference! Your registration has been received and is currently pending payment.</p>
    <div style="margin: 25px 0; padding: 15px; background-color: #f8fafc; border-radius: 8px; border-left: 4px solid #3b82f6;">
      <p style="margin: 0 0 5px; color: #64748b; font-size: 14px; text-transform: uppercase; font-weight: bold;">Order Number</p>
      <p style="margin: 0; font-size: 24px; font-weight: bold; color: #0f172a; font-family: monospace;">#{{orderNumber}}</p>
    </div>
    <div style="margin: 25px 0; padding: 15px; background-color: #f8fafc; border-radius: 8px; border-left: 4px solid #10b981;">
      <p style="margin: 0 0 5px; color: #64748b; font-size: 14px; text-transform: uppercase; font-weight: bold;">Total Amount Due</p>
      <p style="margin: 0; font-size: 24px; font-weight: bold; color: #0f172a;">RM {{totalAmount}}</p>
    </div>
    <p style="color: #475569; line-height: 1.6; font-size: 14px; padding: 15px; background-color: #fffbeb; border: 1px solid #fde68a; border-radius: 8px;">
      <strong>Action Required:</strong> If you selected 'Pay Later' or have not uploaded your payment receipt, please upload your proof of payment via the registration portal or reply to this email with your receipt attached.
    </p>
  </div>
  <div style="background-color: #f8fafc; border-top: 2px dashed #cbd5e1; padding: 20px; text-align: center;">
    <p style="margin: 0; color: #64748b; font-size: 14px;">Blessings,<br/>The REVIVAL Team</p>
  </div>
</div>
`;

async function main() {
  await prisma.emailTemplate.update({
    where: { type: 'INVOICE' },
    data: { bodyHtml: newHtml }
  });
  console.log("Invoice updated in DB");
}

main().catch(console.error).finally(() => prisma.$disconnect());
