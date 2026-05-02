import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  // Simple security check using a query parameter
  const url = new URL(request.url);
  const code = url.searchParams.get('code');

  if (code !== 'revival-purge-2026') {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Delete in correct order to respect foreign key constraints
    await prisma.ticket.deleteMany({});
    await prisma.registration.deleteMany({});
    await prisma.attendee.deleteMany({});
    await prisma.emailLog.deleteMany({});
    
    // We do NOT delete AdminConfig, EmailSettings, or EmailTemplates!
    
    return NextResponse.json({ 
      success: true, 
      message: 'All test registrations, attendees, tickets, and email logs have been permanently deleted.' 
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
