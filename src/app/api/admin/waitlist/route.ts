import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { waitlist } from '@/lib/db/schema';
import { getUserRole } from '@/lib/auth/helpers';
import { desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  const role = getUserRole(request);
  if (role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const entries = await db
    .select()
    .from(waitlist)
    .orderBy(desc(waitlist.createdAt));

  return NextResponse.json({ entries });
}
