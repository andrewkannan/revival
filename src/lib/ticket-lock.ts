import { redis } from './redis';

const LOCK_TTL_SECONDS = 600; // 10 minutes

export interface TicketLock {
  adultTickets: number;
  kidsTickets: number;
}

export async function acquireTicketLock(
  sessionId: string, 
  adultTickets: number, 
  kidsTickets: number
): Promise<boolean> {
  const lockKey = `ticket_lock:${sessionId}`;
  const lockData: TicketLock = { adultTickets, kidsTickets };
  
  // Set the lock with TTL of 10 minutes. NX ensures it only sets if the key doesn't exist
  // We use EX to set the expiration in seconds
  const result = await redis.set(lockKey, JSON.stringify(lockData), 'EX', LOCK_TTL_SECONDS, 'NX');
  
  return result === 'OK';
}

export async function getTicketLock(sessionId: string): Promise<TicketLock | null> {
  const lockKey = `ticket_lock:${sessionId}`;
  const data = await redis.get(lockKey);
  
  if (!data) return null;
  
  try {
    return JSON.parse(data) as TicketLock;
  } catch (e) {
    console.error('Failed to parse ticket lock data', e);
    return null;
  }
}

export async function releaseTicketLock(sessionId: string): Promise<void> {
  const lockKey = `ticket_lock:${sessionId}`;
  await redis.del(lockKey);
}

export async function getActiveLocksCount(): Promise<number> {
  // Find all keys matching ticket_lock:*
  let cursor = '0';
  let totalAdult = 0;
  let totalKids = 0;
  
  do {
    const [newCursor, keys] = await redis.scan(cursor, 'MATCH', 'ticket_lock:*', 'COUNT', '100');
    cursor = newCursor;
    
    if (keys.length > 0) {
      const values = await redis.mget(...keys);
      for (const val of values) {
        if (val) {
          try {
            const data = JSON.parse(val) as TicketLock;
            totalAdult += data.adultTickets;
            totalKids += data.kidsTickets;
          } catch (e) {
            // ignore parse errors
          }
        }
      }
    }
  } while (cursor !== '0');
  
  return totalAdult + totalKids;
}
