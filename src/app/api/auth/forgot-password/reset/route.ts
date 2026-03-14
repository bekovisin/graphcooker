import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { verifyCodeForUser } from '@/lib/auth/verification';
import { hashPassword } from '@/lib/auth/password';
import { deleteAllUserSessions } from '@/lib/auth/session';

export async function POST(request: NextRequest) {
  try {
    const { email, code, newPassword } = await request.json();

    if (!email || !code || !newPassword) {
      return NextResponse.json(
        { error: 'Email, code, and new password are required' },
        { status: 400 }
      );
    }

    if (typeof newPassword !== 'string' || newPassword.length < 6 || newPassword.length > 128) {
      return NextResponse.json(
        { error: 'Password must be 6-128 characters' },
        { status: 400 }
      );
    }

    // Find user by email
    const [user] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email.toLowerCase().trim()));

    if (!user) {
      return NextResponse.json({ error: 'Invalid code' }, { status: 400 });
    }

    // Verify the code
    const valid = await verifyCodeForUser(user.id, code, 'forgot_password');

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
      .where(eq(users.id, user.id));

    // Invalidate all sessions — forces re-login on all devices
    await deleteAllUserSessions(user.id);

    return NextResponse.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Password reset error:', error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
