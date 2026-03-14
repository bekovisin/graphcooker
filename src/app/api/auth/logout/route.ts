import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth/jwt';
import { deleteSession } from '@/lib/auth/session';

export async function POST(request: NextRequest) {
  // Invalidate session in DB so the JWT can no longer be replayed
  const token = request.cookies.get('gc_session')?.value;
  if (token) {
    const payload = await verifyToken(token);
    if (payload?.sessionId) {
      await deleteSession(payload.sessionId).catch(() => {});
    }
  }

  const response = NextResponse.json({ success: true });

  response.cookies.set('gc_session', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });

  response.cookies.set('gc_logged_in', '', {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });

  return response;
}
