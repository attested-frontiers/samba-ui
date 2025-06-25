import { NextRequest } from 'next/server';
import { verifyAuthToken } from './firebase-admin';

export interface AuthenticatedUser {
  uid: string;
  email?: string;
}

export class AuthenticationError extends Error {
  constructor(message: string, public statusCode: number = 401) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

/**
 * Extract and verify Firebase authentication token from request
 */
export async function authenticateRequest(request: NextRequest): Promise<AuthenticatedUser> {
  // Get the Authorization header
  const authHeader = request.headers.get('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new AuthenticationError('Missing or invalid authorization header');
  }

  // Extract the token
  const token = authHeader.substring(7); // Remove 'Bearer ' prefix

  try {
    // Verify the token with Firebase Admin
    const decodedToken = await verifyAuthToken(token);
    
    return {
      uid: decodedToken.uid,
      email: decodedToken.email,
    };
  } catch (error) {
    console.error('Authentication failed:', error);
    throw new AuthenticationError('Invalid or expired token');
  }
}

/**
 * Middleware wrapper for authenticated API routes
 */
export function withAuth<T>(
  handler: (request: NextRequest, user: AuthenticatedUser) => Promise<T>
) {
  return async (request: NextRequest): Promise<T> => {
    const user = await authenticateRequest(request);
    return handler(request, user);
  };
}

/**
 * Create standardized error response for authentication failures
 */
export function createAuthErrorResponse(error: AuthenticationError) {
  return {
    success: false,
    error: error.message,
    statusCode: error.statusCode,
  };
}