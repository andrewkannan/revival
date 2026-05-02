'use server';

import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { RegistrationStatus, OutreachLocation, TemplateType } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { sendPaymentRejectedEmail, sendEmail, parseTemplate } from '@/lib/email';
import QRCode from 'qrcode';

const ADMIN_COOKIE_NAME = 'revival_admin_session';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 1 week

export async function loginAdmin(password: string) {
  const secret = process.env.ADMIN_SECRET;
  
  if (!secret) {
    console.warn("ADMIN_SECRET is not set in environment variables.");
    if (password === 'admin') {
      await (await cookies()).set(ADMIN_COOKIE_NAME, 'authenticated', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: COOKIE_MAX_AGE,
        path: '/',
      });
      return { success: true };
    }
    return { success: false, message: 'Invalid password.' };
  }

  if (password === secret) {
    await (await cookies()).set(ADMIN_COOKIE_NAME, 'authenticated', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: COOKIE_MAX_AGE,
      path: '/',
    });
    return { success: true };
  }

  return { success: false, message: 'Invalid password.' };
}

export async function logoutAdmin() {
  await (await cookies()).delete(ADMIN_COOKIE_NAME);
  return { success: true };
}

export async function getAdminConfig() {
  let config = await prisma.adminConfig.findUnique({
    where: { id: 1 }
  });

  if (!config) {
    // Create default config if it doesn't exist
    config = await prisma.adminConfig.create({
      data: {
        id: 1,
        adultCapacity: 300,
        kidsCapacity: 100,
        isEarlyBird: true,
        adultPriceEarlyBird: 50,
        kidsPriceEarlyBird: 25,
        adultPriceRegular: 80,
        kidsPriceRegular: 40,
      }
    });
  }

  return config;
}

export async function updateAdminConfig(data: {
  adultCapacity: number;
  kidsCapacity: number;
  isEarlyBird: boolean;
  adultPriceEarlyBird: number;
  kidsPriceEarlyBird: number;
  adultPriceRegular: number;
  kidsPriceRegular: number;
  earlyBirdEndDate?: Date | null;
}) {
  try {
    await prisma.adminConfig.upsert({
      where: { id: 1 },
      update: data,
      create: {
        id: 1,
        ...data
      }
    });
    
    revalidatePath('/admin/settings');
    revalidatePath('/'); // revalidate the home page to update prices/availability
    
    return { success: true };
  } catch (e) {
    console.error("Failed to update admin config", e);
    return { success: false, message: "Failed to save configuration." };
  }
}

export async function updateRegistrationStatus(id: string, status: RegistrationStatus) {
  try {
    const registration = await prisma.registration.update({
      where: { id },
      data: { status },
      include: { attendee: true, tickets: true }
    });
    
    if (status === 'PAYMENT_REJECTED') {
      // Fire and forget email
      sendPaymentRejectedEmail(registration.attendee.email, registration.attendee.name).catch(e => console.error("Async email error:", e));
    } else if (status === 'SEAT_SECURED') {
      // Generate QR codes for tickets
      const updatedTickets = [];
      for (const ticket of registration.tickets) {
        if (!ticket.qrCodeUrl) {
          const qrCodeUrl = await QRCode.toDataURL(ticket.id);
          const updatedTicket = await prisma.ticket.update({
            where: { id: ticket.id },
            data: { qrCodeUrl }
          });
          updatedTickets.push(updatedTicket);
        } else {
          updatedTickets.push(ticket);
        }
      }

      // Send E-Ticket email
      const template = await getEmailTemplate('E_TICKET');
      const parsedHtml = parseTemplate(template.bodyHtml, {
        name: registration.attendee.name,
        orderNumber: registration.orderNumber.toString()
      });

      const attachments = updatedTickets.map((t, idx) => ({
        filename: `ticket-${t.ticketType.toLowerCase()}-${idx + 1}.png`,
        content: t.qrCodeUrl!.split("base64,")[1],
        encoding: 'base64',
        cid: `ticket_${t.id}` // Can be referenced in HTML as cid:ticket_id
      }));

      // Optionally inject images into the HTML if they are missing
      let finalHtml = parsedHtml;
      if (!finalHtml.includes('ticket_')) {
        const qrImages = attachments.map(att => `<img src="cid:${att.cid}" alt="QR Code" style="margin: 10px; width: 150px; height: 150px;" />`).join('');
        finalHtml += `<br/><br/><div><strong>Your Tickets:</strong><br/>${qrImages}</div>`;
      }

      // Fire and forget: send email asynchronously
      sendEmail(registration.attendee.email, template.subject, finalHtml, attachments).catch(e => console.error("Async email error:", e));
    }
    
    revalidatePath('/admin/registrations');
    
    return { success: true };
  } catch (e) {
    console.error("Failed to update registration status", e);
    return { success: false, message: "Failed to update status." };
  }
}

export async function updateRegistrationDetails(
  id: string,
  attendeeId: string,
  data: {
    name: string;
    email: string;
    phone: string;
    outreach: OutreachLocation;
    totalAmount: number;
    status: RegistrationStatus;
    receiptBase64?: string | null;
  }
) {
  try {
    const oldReg = await prisma.registration.findUnique({ where: { id } });
    
    const updateData: any = {
      status: data.status,
      totalAmount: data.totalAmount,
    };
    if (data.receiptBase64) {
      updateData.receiptUrl = data.receiptBase64;
    }

    await prisma.registration.update({
      where: { id },
      data: updateData
    });

    await prisma.attendee.update({
      where: { id: attendeeId },
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        outreach: data.outreach,
      }
    });

    if (data.status === 'PAYMENT_REJECTED' && oldReg?.status !== 'PAYMENT_REJECTED') {
      // Fire and forget email
      sendPaymentRejectedEmail(data.email, data.name).catch(e => console.error("Async email error:", e));
    } else if (data.status === 'SEAT_SECURED' && oldReg?.status !== 'SEAT_SECURED') {
       // Also trigger E-ticket generation here
       await updateRegistrationStatus(id, 'SEAT_SECURED');
    }
    
    revalidatePath('/admin/registrations');
    return { success: true };
  } catch (e) {
    console.error("Failed to update registration details", e);
    return { success: false, message: "Failed to update details." };
  }
}

export async function getDashboardStats() {
  const config = await getAdminConfig();
  
  const securedStats = await prisma.ticket.groupBy({
    by: ['ticketType'],
    where: {
      registration: {
        status: 'SEAT_SECURED'
      }
    },
    _count: true
  });

  const pendingStats = await prisma.ticket.groupBy({
    by: ['ticketType'],
    where: {
      registration: {
        status: {
          in: ['PENDING_FOR_PAYMENT', 'PENDING_FOR_REVIEW']
        }
      }
    },
    _count: true
  });

  const totalRegistrations = await prisma.registration.count();

  const paidAmountAgg = await prisma.registration.aggregate({
    _sum: { totalAmount: true },
    where: { status: 'SEAT_SECURED' }
  });

  const pendingAmountAgg = await prisma.registration.aggregate({
    _sum: { totalAmount: true },
    where: { status: { in: ['PENDING_FOR_PAYMENT', 'PENDING_FOR_REVIEW'] } }
  });

  const getCount = (stats: any[], type: 'ADULT' | 'KIDS') => 
    stats.find(s => s.ticketType === type)?._count || 0;

  return {
    adultCapacity: config.adultCapacity,
    kidsCapacity: config.kidsCapacity,
    securedAdults: getCount(securedStats, 'ADULT'),
    securedKids: getCount(securedStats, 'KIDS'),
    pendingAdults: getCount(pendingStats, 'ADULT'),
    pendingKids: getCount(pendingStats, 'KIDS'),
    totalRegistrations,
    totalPaidAmount: Number(paidAmountAgg._sum.totalAmount || 0),
    totalPendingAmount: Number(pendingAmountAgg._sum.totalAmount || 0)
  };
}

export async function getEmailSettings() {
  let settings = await prisma.emailSettings.findUnique({
    where: { id: 1 }
  });

  if (!settings) {
    settings = await prisma.emailSettings.create({
      data: {
        id: 1,
        host: "smtp.gmail.com",
        port: 465,
        fromName: "REVIVAL Team",
      }
    });
  }

  return settings;
}

export async function updateEmailSettings(data: {
  host: string;
  port: number;
  username: string;
  password?: string;
  fromName: string;
  fromEmail: string;
}) {
  try {
    await prisma.emailSettings.upsert({
      where: { id: 1 },
      update: data,
      create: {
        id: 1,
        ...data
      }
    });
    return { success: true };
  } catch (e) {
    console.error("Failed to update email settings", e);
    return { success: false, message: "Failed to save email settings." };
  }
}

export async function getEmailTemplate(type: TemplateType) {
  let template = await prisma.emailTemplate.findUnique({
    where: { type }
  });

  if (!template) {
    let subject = '';
    let bodyHtml = '';
    
    if (type === 'INVOICE') {
      subject = 'REVIVAL Conference - Registration Invoice';
      bodyHtml = `
<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
  <h2>Registration Received</h2>
  <p>Hi {{name}},</p>
  <p>Thank you for registering for the REVIVAL conference! Your order number is <strong>#{{orderNumber}}</strong>.</p>
  <p>Total Amount Due: <strong>RM {{totalAmount}}</strong></p>
  <p>If you have not uploaded your payment receipt, please log in or reply to this email with your proof of payment.</p>
  <br/>
  <p>Blessings,<br/>The REVIVAL Team</p>
</div>`;
    } else if (type === 'E_TICKET') {
      subject = 'REVIVAL Conference - Your E-Tickets';
      bodyHtml = `
<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
  <h2>Your Tickets are Confirmed!</h2>
  <p>Hi {{name}},</p>
  <p>Your payment has been verified. Attached are your unique QR code e-tickets for order <strong>#{{orderNumber}}</strong>.</p>
  <p>Please present these QR codes at the entrance for scanning.</p>
  <br/>
  <p>See you there,<br/>The REVIVAL Team</p>
</div>`;
    } else if (type === 'REMINDER') {
      subject = 'REVIVAL Conference - Reminder';
      bodyHtml = `
<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
  <h2>REVIVAL Conference is Approaching!</h2>
  <p>Hi {{name}},</p>
  <p>This is a friendly reminder for the upcoming REVIVAL conference. We are so excited to see you!</p>
  <p>Don't forget to have your QR code e-tickets ready for scanning at the entrance.</p>
  <br/>
  <p>Blessings,<br/>The REVIVAL Team</p>
</div>`;
    }

    template = await prisma.emailTemplate.create({
      data: {
        type,
        subject,
        bodyHtml
      }
    });
  }

  return template;
}

export async function updateEmailTemplate(type: TemplateType, subject: string, bodyHtml: string) {
  try {
    await prisma.emailTemplate.upsert({
      where: { type },
      update: { subject, bodyHtml },
      create: { type, subject, bodyHtml }
    });
    return { success: true };
  } catch (e) {
    console.error("Failed to update email template", e);
    return { success: false, message: "Failed to save email template." };
  }
}

export async function sendConferenceReminders() {
  try {
    const registrations = await prisma.registration.findMany({
      where: { status: 'SEAT_SECURED' },
      include: { attendee: true }
    });

    const template = await getEmailTemplate('REMINDER');

    let sentCount = 0;
    for (const reg of registrations) {
      const parsedHtml = parseTemplate(template.bodyHtml, {
        name: reg.attendee.name,
        orderNumber: reg.orderNumber.toString()
      });
      const sent = await sendEmail(reg.attendee.email, template.subject, parsedHtml);
      if (sent) sentCount++;
    }

    return { success: true, message: `Sent ${sentCount} reminders.` };
  } catch (e) {
    console.error("Failed to send reminders", e);
    return { success: false, message: "Failed to send reminders." };
  }
}

export async function getEmailLogs() {
  try {
    const logs = await prisma.emailLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100 // Limit to recent 100 for dashboard performance
    });
    return { success: true, logs };
  } catch (e) {
    console.error("Failed to fetch email logs", e);
    return { success: false, logs: [] };
  }
}

export async function retryEmail(logId: string) {
  try {
    const log = await prisma.emailLog.findUnique({ where: { id: logId } });
    if (!log) return { success: false, message: 'Log not found' };

    const attendee = await prisma.attendee.findUnique({
      where: { email: log.to },
      include: {
        registrations: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: { tickets: true }
        }
      }
    });

    if (!attendee || attendee.registrations.length === 0) {
      return { success: false, message: 'Attendee or Registration not found' };
    }

    const registration = attendee.registrations[0];

    if (log.subject.includes('Registration Invoice')) {
      const template = await getEmailTemplate('INVOICE');
      const parsedHtml = parseTemplate(template.bodyHtml, {
        name: attendee.name,
        orderNumber: registration.orderNumber.toString(),
        totalAmount: registration.totalAmount.toString()
      });
      const success = await sendEmail(log.to, template.subject, parsedHtml);
      if (success) {
        await prisma.emailLog.update({ where: { id: logId }, data: { status: 'SENT', error: null } });
      }
      revalidatePath('/admin/emails');
      return { success, message: success ? 'Retried successfully' : 'Retry failed again' };
    } else if (log.subject.includes('E-Tickets')) {
      const template = await getEmailTemplate('E_TICKET');
      const parsedHtml = parseTemplate(template.bodyHtml, {
        name: attendee.name,
        orderNumber: registration.orderNumber.toString()
      });

      const attachments = registration.tickets.filter((t: any) => t.qrCodeUrl).map((t: any, idx: number) => ({
        filename: `ticket-${t.ticketType.toLowerCase()}-${idx + 1}.png`,
        content: t.qrCodeUrl!.split("base64,")[1],
        encoding: 'base64',
        cid: `ticket_${t.id}`
      }));

      let finalHtml = parsedHtml;
      if (!finalHtml.includes('ticket_') && attachments.length > 0) {
        const qrImages = attachments.map((att: any) => `<img src="cid:${att.cid}" alt="QR Code" style="margin: 10px; width: 150px; height: 150px;" />`).join('');
        finalHtml += `<br/><br/><div><strong>Your Tickets:</strong><br/>${qrImages}</div>`;
      }

      const success = await sendEmail(log.to, template.subject, finalHtml, attachments);
      if (success) {
        await prisma.emailLog.update({ where: { id: logId }, data: { status: 'SENT', error: null } });
      }
      revalidatePath('/admin/emails');
      return { success, message: success ? 'Retried successfully' : 'Retry failed again' };
    } else if (log.subject.includes('Action Required')) {
      const success = await sendPaymentRejectedEmail(log.to, attendee.name);
      if (success) {
        await prisma.emailLog.update({ where: { id: logId }, data: { status: 'SENT', error: null } });
      }
      revalidatePath('/admin/emails');
      return { success, message: success ? 'Retried successfully' : 'Retry failed again' };
    } else {
      return { success: false, message: 'Unknown email type for retry' };
    }
  } catch (e: any) {
    console.error("Retry failed:", e);
    return { success: false, message: e.message || 'Server error' };
  }
}
