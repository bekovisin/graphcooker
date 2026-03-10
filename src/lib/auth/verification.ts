import { randomBytes } from 'crypto';
import { db } from '@/lib/db';
import { verificationTokens } from '@/lib/db/schema';
import { eq, and, lt } from 'drizzle-orm';

export function generateVerificationCode(): string {
  // Generate a random 6-digit numeric code
  const num = parseInt(randomBytes(4).toString('hex'), 16) % 1000000;
  return num.toString().padStart(6, '0');
}

export function generateTokenString(): string {
  return randomBytes(32).toString('hex');
}

export async function createVerificationToken(
  userId: number,
  type: 'email_verify' | 'forgot_password' | 'password_change',
  token: string,
  expiresInMinutes: number = 60
): Promise<void> {
  // Delete any existing tokens of the same type for this user
  await db
    .delete(verificationTokens)
    .where(
      and(
        eq(verificationTokens.userId, userId),
        eq(verificationTokens.type, type)
      )
    );

  // Create new token
  await db.insert(verificationTokens).values({
    userId,
    token,
    type,
    expiresAt: new Date(Date.now() + expiresInMinutes * 60 * 1000),
  });
}

export async function verifyTokenFromDB(
  token: string,
  type: 'email_verify' | 'forgot_password' | 'password_change'
): Promise<{ userId: number } | null> {
  const [record] = await db
    .select()
    .from(verificationTokens)
    .where(
      and(
        eq(verificationTokens.token, token),
        eq(verificationTokens.type, type)
      )
    );

  if (!record) return null;

  // Check if expired
  if (new Date() > record.expiresAt) {
    // Clean up expired token
    await db.delete(verificationTokens).where(eq(verificationTokens.id, record.id));
    return null;
  }

  // Delete the used token
  await db.delete(verificationTokens).where(eq(verificationTokens.id, record.id));

  return { userId: record.userId };
}

export async function verifyCodeForUser(
  userId: number,
  code: string,
  type: 'forgot_password' | 'password_change'
): Promise<boolean> {
  const [record] = await db
    .select()
    .from(verificationTokens)
    .where(
      and(
        eq(verificationTokens.userId, userId),
        eq(verificationTokens.token, code),
        eq(verificationTokens.type, type)
      )
    );

  if (!record) return false;

  // Check if expired
  if (new Date() > record.expiresAt) {
    await db.delete(verificationTokens).where(eq(verificationTokens.id, record.id));
    return false;
  }

  // Delete the used token
  await db.delete(verificationTokens).where(eq(verificationTokens.id, record.id));

  return true;
}

export async function cleanupExpiredTokens(): Promise<void> {
  await db
    .delete(verificationTokens)
    .where(lt(verificationTokens.expiresAt, new Date()));
}
