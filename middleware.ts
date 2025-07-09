import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Check if user is accessing the swap page
  if (request.nextUrl.pathname === '/swap') {
    // For now, we'll let the client-side handle the auth check
    // since we don't have access to the auth state in middleware
    return NextResponse.next();
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/swap'],
};