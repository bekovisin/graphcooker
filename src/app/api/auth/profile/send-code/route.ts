import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getUserId } from '@/lib/auth/helpers';
import { checkRateLimit } from '@/lib/auth/rate-limit';
import { generateVerificationCode, createVerificationToken } from '@/lib/auth/verification';
import { sendVerificationCode } from '@/lib/email/send';

export async function POST(request: NextRequest) {
  try {
    const userId = getUserId(request);

    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const rateCheck = checkRateLimit(`pwd-change:${ip}:${userId}`);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    const [user] = await db
      .select({ id: users.id, name: users.name, email: users.email })
      .from(users)
      .where(eq(users.id, userId));

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const code = generateVerificationCode();
    await createVerificationToken(user.id, 'password_change', code, 10);

    try {
      await sendVerificationCode(user.email, user.name, code, 'password_change');
    } catch (emailError) {
      console.error('Failed to send password change code:', emailError);
      return NextResponse.json(
        { error: 'Failed to send verification code. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: 'Verification code sent to your email' });
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
