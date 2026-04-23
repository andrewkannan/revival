'use server';

import prisma from '@/lib/prisma';
import { acquireTicketLock, releaseTicketLock, getActiveLocksCount } from '@/lib/ticket-lock';
import { OutreachLocation, RegistrationStatus } from '@prisma/client';

export async function checkCapacity(requestedAdults: number, requestedKids: number) {
  try {
    const totalRequested = requestedAdults + requestedKids;
    
    // 1. Get Admin Config for total capacity
    const adminConfig = await prisma.adminConfig.findUnique({ where: { id: 1 } });
    const totalCapacity = adminConfig?.totalCapacity || 400; // default 400

    // 2. Get tickets already stored in Postgres (SEAT_SECURED or PENDING)
    // We count all tickets that do not belong to a CONTACT_ADMIN or failed registration.
    const dbTicketsCount = await prisma.ticket.count({
      where: {
        registration: {
          status: {
            in: ['SEAT_SECURED', 'PENDING_FOR_PAYMENT', 'PENDING_FOR_REVIEW']
          }
        }
      }
    });

    // 3. Get currently active Redis locks
    const activeRedisLocksCount = await getActiveLocksCount();

    const available = totalCapacity - dbTicketsCount - activeRedisLocksCount;

    return {
      success: available >= totalRequested,
      available,
    };
  } catch (error) {
    console.error('Error checking capacity:', error);
    return { success: false, available: 0, error: 'Failed to check capacity' };
  }
}

export async function lockTicketsAction(sessionId: string, adult: number, kids: number) {
  try {
    // Check capacity one more time just before locking
    const capCheck = await checkCapacity(adult, kids);
    if (!capCheck.success) {
      return { success: false, message: 'Not enough tickets available.' };
    }
    
    const locked = await acquireTicketLock(sessionId, adult, kids);
    if (locked) {
      return { success: true };
    } else {
      return { success: false, message: 'Failed to acquire lock. Session already locked?' };
    }
  } catch (error) {
    console.error('Error locking tickets:', error);
    return { success: false, message: 'System error' };
  }
}

export async function getPricing() {
  const adminConfig = await prisma.adminConfig.findUnique({ where: { id: 1 } });
  
  // default fallback prices
  return {
    isEarlyBird: adminConfig?.isEarlyBird ?? true,
    adultPrice: adminConfig?.isEarlyBird 
      ? Number(adminConfig?.adultPriceEarlyBird || 50) 
      : Number(adminConfig?.adultPriceRegular || 70),
    kidsPrice: adminConfig?.isEarlyBird 
      ? Number(adminConfig?.kidsPriceEarlyBird || 25) 
      : Number(adminConfig?.kidsPriceRegular || 35),
  };
}

interface RegistrationData {
  name: string;
  email: string;
  phone: string;
  outreach: OutreachLocation;
  adultTickets: number;
  kidsTickets: number;
}

export async function finalizeRegistration(data: RegistrationData, sessionId: string) {
  try {
    // Start transaction
    const pricing = await getPricing();
    const totalAmount = (data.adultTickets * pricing.adultPrice) + (data.kidsTickets * pricing.kidsPrice);

    const result = await prisma.$transaction(async (tx) => {
      // 1. Find or create Attendee
      let attendee = await tx.attendee.findUnique({
        where: { email: data.email }
      });
      
      if (!attendee) {
        attendee = await tx.attendee.create({
          data: {
            name: data.name,
            email: data.email,
            phone: data.phone,
            outreach: data.outreach,
          }
        });
      } else {
        // update phone or name just in case
        attendee = await tx.attendee.update({
          where: { email: data.email },
          data: { name: data.name, phone: data.phone, outreach: data.outreach }
        });
      }

      // 2. Create Registration
      const registration = await tx.registration.create({
        data: {
          attendeeId: attendee.id,
          adultTickets: data.adultTickets,
          kidsTickets: data.kidsTickets,
          totalAmount: totalAmount,
          status: 'PENDING_FOR_PAYMENT',
          payLater: true,
        }
      });

      // 3. Create Tickets
      const ticketsData = [];
      for(let i=0; i<data.adultTickets; i++) {
        ticketsData.push({ registrationId: registration.id, ticketType: 'ADULT' as const });
      }
      for(let i=0; i<data.kidsTickets; i++) {
        ticketsData.push({ registrationId: registration.id, ticketType: 'KIDS' as const });
      }

      if (ticketsData.length > 0) {
        await tx.ticket.createMany({ data: ticketsData });
      }

      return registration;
    });

    // Release Redis lock
    await releaseTicketLock(sessionId);

    return { success: true, registrationId: result.id };
  } catch (error) {
    console.error('Error finalizing registration:', error);
    // release lock if failed? It will auto-expire anyway, but we can do it explicitly
    await releaseTicketLock(sessionId);
    return { success: false, message: 'Database transaction failed.' };
  }
}
