import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { desc, eq } from 'drizzle-orm';
import { hashPassword } from '@/lib/auth/password';

export async function GET() {
  try {
    const allUsers = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .orderBy(desc(users.createdAt));
    return NextResponse.json(allUsers);
  } catch (error) {
    console.error('Failed to fetch users:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { email, name, password } = await request.json();

    if (!email || !name || !password) {
      return NextResponse.json({ error: 'Email, name, and password are required' }, { status: 400 });
    }

    if (typeof password !== 'string' || password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
    }

    if (password.length > 128) {
      return NextResponse.json({ error: 'Password is too long' }, { status: 400 });
    }

    const emailNormalized = email.toLowerCase().trim();

    const [existing] = await db.select().from(users).where(eq(users.email, emailNormalized));
    if (existing) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);
    const [newUser] = await db
      .insert(users)
      .values({ email: emailNormalized, name, passwordHash, role: 'customer' })
      .returning({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        createdAt: users.createdAt,
      });

    return NextResponse.json(newUser, { status: 201 });
  } catch (error) {
    console.error('Failed to create user:', error);
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }
}
