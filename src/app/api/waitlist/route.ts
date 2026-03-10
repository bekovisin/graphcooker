import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { waitlist } from '@/lib/db/schema';

// Simple in-memory rate limiter for waitlist (3 per 30 min per IP)
const waitlistAttempts = new Map<string, { count: number; resetAt: number }>();
const MAX_WAITLIST = 3;
const WINDOW_MS = 30 * 60 * 1000;

function checkWaitlistRateLimit(ip: string) {
  const now = Date.now();
  const entry = waitlistAttempts.get(ip);

  if (!entry || now > entry.resetAt) {
    waitlistAttempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true, remaining: MAX_WAITLIST - 1 };
  }

  if (entry.count >= MAX_WAITLIST) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count++;
  return { allowed: true, remaining: MAX_WAITLIST - entry.count };
}

export async function POST(request: NextRequest) {
  try {
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      'unknown';

    const { allowed, resetAt } = checkWaitlistRateLimit(ip);
    if (!allowed) {
      return NextResponse.json(
        { error: 'Too many submissions. Please try again later.' },
        {
          status: 429,
          headers: { 'Retry-After': String(Math.ceil(((resetAt ?? 0) - Date.now()) / 1000)) },
        }
      );
    }

    const body = await request.json();
    const { name, email, phone, message } = body as {
      name: string;
      email: string;
      phone?: string;
      message?: string;
    };

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }
    if (!email || !email.trim()) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    await db.insert(waitlist).values({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone?.trim() || null,
      message: message?.trim() || null,
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
