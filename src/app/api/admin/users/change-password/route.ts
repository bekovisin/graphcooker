import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getUserRole } from '@/lib/auth/helpers';
import { verifyCodeForUser } from '@/lib/auth/verification';
import { hashPassword } from '@/lib/auth/password';
import { deleteAllUserSessions } from '@/lib/auth/session';

export async function POST(request: NextRequest) {
  try {
    const role = getUserRole(request);
    if (role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { userId, code, newPassword } = await request.json();

    if (!userId || !code || !newPassword) {
      return NextResponse.json(
        { error: 'User ID, verification code, and new password are required' },
        { status: 400 }
      );
    }

    if (typeof newPassword !== 'string' || newPassword.length < 8 || newPassword.length > 128) {
      return NextResponse.json(
        { error: 'Password must be 8-128 characters' },
        { status: 400 }
      );
    }

    // Verify the code
    const valid = await verifyCodeForUser(userId, code, 'password_change');

    if (!valid) {
      return NextResponse.json(
        { error: 'Invalid or expired verification code' },
        { status: 400 }
      );
    }

    // Update password
    const passwordHash = await hashPassword(newPassword);
    await db
      .update(users)
      .set({ passwordHash, updatedAt: new Date() })
      .where(eq(users.id, userId));

    // Invalidate all sessions — forces re-login on all devices
    await deleteAllUserSessions(userId);

    return NextResponse.json({ message: 'Password changed successfully' });
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
