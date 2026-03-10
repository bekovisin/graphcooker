import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  const userId = parseInt(request.headers.get('x-user-id') || '');
  if (isNaN(userId)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const [user] = await db
    .select({ id: users.id, email: users.email, name: users.name, role: users.role })
    .from(users)
    .where(eq(users.id, userId));

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  return NextResponse.json({ user });
}
