import { NextRequest, NextResponse } from 'next/server';

export function getUserId(request: NextRequest | Request): number {
  const id = parseInt((request as NextRequest).headers.get('x-user-id') || '');
  if (isNaN(id)) throw new Error('UNAUTHORIZED');
  return id;
}

export function getUserRole(request: NextRequest | Request): string {
  return (request as NextRequest).headers.get('x-user-role') || 'customer';
}

export function unauthorizedResponse() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

export function forbiddenResponse() {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}
