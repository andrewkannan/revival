import { redis } from './redis';

const LOCK_TTL_SECONDS = 600; // 10 minutes

export interface TicketLock {
  adultTickets: number;
  kidsTickets: number;
}

const inMemoryLocks = new Map<string, { data: TicketLock, expiresAt: number }>();

export async function acquireTicketLock(
  sessionId: string, 
  adultTickets: number, 
  kidsTickets: number
): Promise<boolean> {
  const lockKey = `ticket_lock:${sessionId}`;
  const lockData: TicketLock = { adultTickets, kidsTickets };
  
  if (!process.env.REDIS_URL) {
    if (inMemoryLocks.has(lockKey) && inMemoryLocks.get(lockKey)!.expiresAt > Date.now()) {
      return false; // Already locked
    }
    inMemoryLocks.set(lockKey, { data: lockData, expiresAt: Date.now() + (LOCK_TTL_SECONDS * 1000) });
    return true;
  }

  // Set the lock with TTL of 10 minutes. NX ensures it only sets if the key doesn't exist
  // We use EX to set the expiration in seconds
  try {
    const result = await redis.set(lockKey, JSON.stringify(lockData), 'EX', LOCK_TTL_SECONDS, 'NX');
    return result === 'OK';
  } catch (e) {
    console.warn("Redis is not available. Falling back to memory mock for this lock.");
    inMemoryLocks.set(lockKey, { data: lockData, expiresAt: Date.now() + (LOCK_TTL_SECONDS * 1000) });
    return true;
  }
}

export async function getTicketLock(sessionId: string): Promise<TicketLock | null> {
  const lockKey = `ticket_lock:${sessionId}`;
  
  if (!process.env.REDIS_URL || inMemoryLocks.has(lockKey)) {
    const lock = inMemoryLocks.get(lockKey);
    if (lock && lock.expiresAt > Date.now()) return lock.data;
    if (lock) inMemoryLocks.delete(lockKey);
    return null;
  }

  try {
    const data = await redis.get(lockKey);
    if (!data) return null;
    return JSON.parse(data) as TicketLock;
  } catch (e) {
    return null;
  }
}

export async function releaseTicketLock(sessionId: string): Promise<void> {
  const lockKey = `ticket_lock:${sessionId}`;
  inMemoryLocks.delete(lockKey);
  try {
    if (process.env.REDIS_URL) await redis.del(lockKey);
  } catch (e) {}
}

export async function getActiveLocksCount(): Promise<number> {
  let totalAdult = 0;
  let totalKids = 0;

  // Add memory locks
  const now = Date.now();
  for (const [key, lock] of Array.from(inMemoryLocks.entries())) {
    if (lock.expiresAt > now) {
      totalAdult += lock.data.adultTickets;
      totalKids += lock.data.kidsTickets;
    } else {
      inMemoryLocks.delete(key);
    }
  }

  if (!process.env.REDIS_URL) return totalAdult + totalKids;

  try {
    let cursor = '0';
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
            } catch (e) {}
          }
        }
      }
    } while (cursor !== '0');
  } catch (e) {
    console.warn("Failed to get active locks from Redis, returning memory locks only.");
  }
  
  return totalAdult + totalKids;
}
