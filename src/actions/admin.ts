'use server';

import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { RegistrationStatus } from '@prisma/client';
import { revalidatePath } from 'next/cache';

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
        totalCapacity: 400,
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
  totalCapacity: number;
  isEarlyBird: boolean;
  adultPriceEarlyBird: number;
  kidsPriceEarlyBird: number;
  adultPriceRegular: number;
  kidsPriceRegular: number;
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
    await prisma.registration.update({
      where: { id },
      data: { status }
    });
    
    revalidatePath('/admin/registrations');
    
    return { success: true };
  } catch (e) {
    console.error("Failed to update registration status", e);
    return { success: false, message: "Failed to update status." };
  }
}

export async function getDashboardStats() {
  const config = await getAdminConfig();
  
  const [totalRegistrations, securedSeats, pendingSeats] = await Promise.all([
    prisma.registration.count(),
    prisma.ticket.count({
      where: {
        registration: {
          status: 'SEAT_SECURED'
        }
      }
    }),
    prisma.ticket.count({
      where: {
        registration: {
          status: {
            in: ['PENDING_FOR_PAYMENT', 'PENDING_FOR_REVIEW']
          }
        }
      }
    })
  ]);

  return {
    capacity: config.totalCapacity,
    securedSeats,
    pendingSeats,
    totalRegistrations
  };
}
