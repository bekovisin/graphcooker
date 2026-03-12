import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id');
  const email = request.headers.get('x-user-email');
  const role = request.headers.get('x-user-role');

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // User info is already verified by middleware JWT — no DB call needed
  const name = request.headers.get('x-user-name');
  return NextResponse.json({
    user: {
      id: parseInt(userId),
      email,
      name: name || email?.split('@')[0] || '',
      role,
    },
  });
}
