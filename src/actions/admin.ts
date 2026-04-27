'use server';

import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { RegistrationStatus, OutreachLocation } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { sendPaymentRejectedEmail } from '@/lib/email';

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
      include: { attendee: true }
    });
    
    if (status === 'PAYMENT_REJECTED') {
      await sendPaymentRejectedEmail(registration.attendee.email, registration.attendee.name);
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
      await sendPaymentRejectedEmail(data.email, data.name);
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
  
  // Group secured tickets by type
  const securedStats = await prisma.ticket.groupBy({
    by: ['ticketType'],
    where: {
      registration: {
        status: 'SEAT_SECURED'
      }
    },
    _count: true
  });

  // Group pending tickets by type
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

  const getCount = (stats: any[], type: 'ADULT' | 'KIDS') => 
    stats.find(s => s.ticketType === type)?._count || 0;

  return {
    adultCapacity: config.adultCapacity,
    kidsCapacity: config.kidsCapacity,
    securedAdults: getCount(securedStats, 'ADULT'),
    securedKids: getCount(securedStats, 'KIDS'),
    pendingAdults: getCount(pendingStats, 'ADULT'),
    pendingKids: getCount(pendingStats, 'KIDS'),
    totalRegistrations
  };
}
