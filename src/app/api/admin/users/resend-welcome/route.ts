import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { generateTokenString, createVerificationToken } from '@/lib/auth/verification';
import { sendWelcomeEmail } from '@/lib/email/send';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId));

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const verifyToken = generateTokenString();
    await createVerificationToken(user.id, 'email_verify', verifyToken, 24 * 60);
    await sendWelcomeEmail(
      { name: user.name, email: user.email },
      user.plainPassword || '(use your existing password)',
      verifyToken
    );

    return NextResponse.json({ message: 'Welcome email sent' });
  } catch (error) {
    console.error('Failed to resend welcome email:', error);
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
  }
}
