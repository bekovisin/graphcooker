import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { generateTokenString, createVerificationToken } from '@/lib/auth/verification';
import { hashPassword } from '@/lib/auth/password';
import { sendWelcomeEmail } from '@/lib/email/send';
import { randomBytes } from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const [user] = await db
      .select({ id: users.id, name: users.name, email: users.email })
      .from(users)
      .where(eq(users.id, userId));

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Generate a new temporary password, hash it, and update the user
    const tempPassword = randomBytes(6).toString('base64url').slice(0, 10);
    const passwordHash = await hashPassword(tempPassword);
    await db
      .update(users)
      .set({ passwordHash, updatedAt: new Date() })
      .where(eq(users.id, user.id));

    const verifyToken = generateTokenString();
    await createVerificationToken(user.id, 'email_verify', verifyToken, 24 * 60);
    await sendWelcomeEmail(
      { name: user.name, email: user.email },
      tempPassword,
      verifyToken
    );

    return NextResponse.json({ message: 'Welcome email sent with new temporary password' });
  } catch (error) {
    console.error('Failed to resend welcome email:', error);
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
  }
}
