import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getUserId } from '@/lib/auth/helpers';

// GET /api/auth/profile — get current user profile
export async function GET(request: NextRequest) {
  try {
    const userId = getUserId(request);

    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        emailVerified: users.emailVerified,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, userId));

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

// PUT /api/auth/profile — update name/email only (password change via email verification)
export async function PUT(request: NextRequest) {
  try {
    const userId = getUserId(request);
    const body = await request.json();
    const { name, email } = body;

    // Fetch current user
    const [currentUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId));

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const updates: Record<string, unknown> = { updatedAt: new Date() };

    // Update name
    if (name && name.trim()) {
      updates.name = name.trim();
    }

    // Update email
    if (email && email.trim() && email !== currentUser.email) {
      const [existing] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, email.trim()));

      if (existing) {
        return NextResponse.json({ error: 'Email already in use' }, { status: 409 });
      }
      updates.email = email.trim();
    }

    // Apply updates
    const [updated] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, userId))
      .returning({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
      });

    return NextResponse.json({ user: updated });
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
