import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { checkRateLimit } from '@/lib/auth/rate-limit';
import { generateVerificationCode, createVerificationToken } from '@/lib/auth/verification';
import { sendVerificationCode } from '@/lib/email/send';

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const rateCheck = checkRateLimit(`forgot-pwd:${ip}`);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const [user] = await db
      .select({ id: users.id, name: users.name, email: users.email })
      .from(users)
      .where(eq(users.email, email.toLowerCase().trim()));

    // Always return success to prevent email enumeration
    if (!user) {
      return NextResponse.json({ message: 'If an account exists, a verification code has been sent.' });
    }

    const code = generateVerificationCode();
    await createVerificationToken(user.id, 'forgot_password', code, 10);

    try {
      await sendVerificationCode(user.email, user.name, code, 'forgot_password');
    } catch (emailError) {
      console.error('Failed to send forgot password email:', emailError);
      return NextResponse.json(
        { error: 'Failed to send verification code. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: 'If an account exists, a verification code has been sent.' });
  } catch (error) {
    console.error('Forgot password send code error:', error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
