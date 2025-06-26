import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/firebase-admin';

export async function GET(request: NextRequest) {
  try {
    // Get the Authorization header
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      );
    }

    // Extract the token
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify the token with Firebase Admin
    const decodedToken = await verifyAuthToken(token);
    
    // If we get here, the token is valid
    return NextResponse.json({ 
      message: 'hello',
      user: {
        uid: decodedToken.uid,
        email: decodedToken.email
      }
    });

  } catch (error) {
    console.error('Authentication failed:', error);
    return NextResponse.json(
      { error: 'Invalid or expired token' },
      { status: 401 }
    );
  }
}

export async function POST(request: NextRequest) {
  // Same auth logic for POST requests
  return GET(request);
}