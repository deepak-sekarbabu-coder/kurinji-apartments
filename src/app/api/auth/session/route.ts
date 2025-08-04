import { getAuth } from 'firebase-admin/auth';

import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

import {
  getAuthErrorMessage,
  isAuthUserNotFoundError,
  isInvalidTokenError,
} from '@/lib/auth-utils';
import { getFirebaseAdminApp } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    const { idToken } = await request.json();
    if (!idToken) {
      return NextResponse.json(
        { status: 'error', message: 'idToken is required' },
        { status: 400 }
      );
    }

    const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days

    try {
      const adminApp = getFirebaseAdminApp();

      // First verify the idToken is valid
      let decodedToken;
      try {
        decodedToken = await getAuth(adminApp).verifyIdToken(idToken);
        console.log('✅ ID token verified for UID:', decodedToken.uid);
        console.log('Decoded token:', decodedToken);
      } catch (verifyError) {
        console.error('ID token verification failed:', verifyError);
        return NextResponse.json(
          {
            status: 'error',
            message: 'ID token verification failed',
            details: verifyError,
          },
          { status: 401 }
        );
      }

      try {
        const sessionCookie = await getAuth(adminApp).createSessionCookie(idToken, { expiresIn });

        const cookieStore = await cookies();
        cookieStore.set('session', sessionCookie, {
          maxAge: expiresIn,
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/',
        });

        return NextResponse.json({ status: 'success' });
      } catch (sessionError) {
        console.error('Session cookie creation failed:', sessionError);
        return NextResponse.json(
          {
            status: 'error',
            message: 'Session cookie creation failed',
            details: sessionError,
            decodedToken,
          },
          { status: 401 }
        );
      }
    } catch (adminError: unknown) {
      console.error('Firebase Admin SDK Error:', adminError);
      console.error('Error code:', (adminError as { code?: string })?.code);

      // Handle specific authentication errors
      if (isAuthUserNotFoundError(adminError) || isInvalidTokenError(adminError)) {
        return NextResponse.json(
          {
            status: 'error',
            message: getAuthErrorMessage(adminError),
          },
          { status: 401 }
        );
      }

      // Remove fallback: Do NOT set session cookie to idToken
      // Instead, return an error and do not set any session cookie
      return NextResponse.json(
        {
          status: 'error',
          message: 'Failed to create session cookie. Please sign in again.',
        },
        { status: 401 }
      );
    }
  } catch (error: unknown) {
    console.error('SESSION_CREATION_ERROR:', error);
    // Ensure a helpful message is returned, including the error code if available
    let errorMessage = 'Failed to create session.';
    let errorDetails = {};
    if (error && typeof error === 'object') {
      errorDetails = error;
      if ((error as any).code || (error as any).message) {
        errorMessage =
          ((error as any).code ? `(${(error as any).code}) ` : '') +
          ((error as any).message || errorMessage);
      }
    } else if (typeof error === 'string') {
      errorMessage = error;
    }
    return NextResponse.json(
      { status: 'error', message: errorMessage, details: errorDetails },
      { status: 401 }
    );
  }
}

export async function DELETE() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete('session');
    cookieStore.delete('user-role'); // Also delete the user-role cookie
    return NextResponse.json({ status: 'success' });
  } catch (error) {
    console.error('Session cookie deletion failed:', error);
    return NextResponse.json(
      { status: 'error', message: 'Failed to delete session.' },
      { status: 500 }
    );
  }
}
