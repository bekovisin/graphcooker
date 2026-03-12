import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { verifyTokenFromDB } from '@/lib/auth/verification';
import { createToken } from '@/lib/auth/jwt';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get('token');

    if (!token) {
      return NextResponse.redirect(new URL('/login?error=invalid_token', request.url));
    }

    const result = await verifyTokenFromDB(token, 'email_verify');

    if (!result) {
      return NextResponse.redirect(new URL('/login?error=invalid_token', request.url));
    }

    // Mark email as verified
    const [user] = await db
      .update(users)
      .set({ emailVerified: true, updatedAt: new Date() })
      .where(eq(users.id, result.userId))
      .returning({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
      });

    if (!user) {
      return NextResponse.redirect(new URL('/login?error=user_not_found', request.url));
    }

    // Auto-login: create JWT token and set cookie
    const jwtToken = await createToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role as 'admin' | 'customer',
    });

    const response = NextResponse.redirect(new URL('/verify?success=true', request.url));

    response.cookies.set('gc_session', jwtToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 24 * 60 * 60,
    });

    return response;
  } catch (error) {
    console.error('Email verification error:', error);
    return NextResponse.redirect(new URL('/login?error=verification_failed', request.url));
  }
}
