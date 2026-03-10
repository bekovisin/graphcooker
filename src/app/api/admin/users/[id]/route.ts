import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { hashPassword } from '@/lib/auth/password';
import { getUserId } from '@/lib/auth/helpers';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const body = await request.json();
    const updates: Record<string, unknown> = { updatedAt: new Date() };

    if (body.name) updates.name = body.name;
    if (body.email) updates.email = body.email.toLowerCase().trim();
    if (body.password) {
      if (typeof body.password !== 'string' || body.password.length < 8) {
        return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
      }
      if (body.password.length > 128) {
        return NextResponse.json({ error: 'Password is too long' }, { status: 400 });
      }
      updates.passwordHash = await hashPassword(body.password);
      updates.plainPassword = body.password;
    }

    const [updated] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      });

    if (!updated) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Failed to update user:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const adminId = getUserId(request);
    if (id === adminId) {
      return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 });
    }

    // Prevent deleting other admins
    const [targetUser] = await db.select({ role: users.role }).from(users).where(eq(users.id, id));
    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    if (targetUser.role === 'admin') {
      return NextResponse.json({ error: 'Cannot delete admin accounts' }, { status: 400 });
    }

    // CASCADE delete handles all user data via foreign key constraints
    // But since we don't have FK constraints on existing tables, delete manually
    const { folders, projects, visualizations, templates, colorThemes, preferences, dashboardTemplates } = await import('@/lib/db/schema');

    await db.delete(visualizations).where(eq(visualizations.userId, id));
    await db.delete(projects).where(eq(projects.userId, id));
    await db.delete(folders).where(eq(folders.userId, id));
    await db.delete(templates).where(eq(templates.userId, id));
    await db.delete(colorThemes).where(eq(colorThemes.userId, id));
    await db.delete(preferences).where(eq(preferences.userId, id));
    await db.delete(dashboardTemplates).where(eq(dashboardTemplates.userId, id));
    await db.delete(users).where(eq(users.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete user:', error);
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}
