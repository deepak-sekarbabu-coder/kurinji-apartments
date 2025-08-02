import { NextRequest, NextResponse } from 'next/server';
import { addExpense } from '@/lib/firestore';
import { getAuth } from 'firebase-admin/auth';
import { getFirebaseAdminApp } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    // Validate required fields (customize as needed)
    const { amount, categoryId, description, paidByApartment, owedByApartments, perApartmentShare, receipt } = body;
    if (!amount || !categoryId || !description || !paidByApartment || !owedByApartments || !perApartmentShare) {
      return NextResponse.json(
        { status: 'error', message: 'Missing required fields.' },
        { status: 400 }
      );
    }

    // Optionally, verify user authentication
    const session = request.cookies.get('session');
    if (!session) {
      return NextResponse.json(
        { status: 'error', message: 'Not authenticated.' },
        { status: 401 }
      );
    }
    try {
      const adminApp = getFirebaseAdminApp();
      await getAuth(adminApp).verifySessionCookie(session.value, true);
    } catch (authError) {
      return NextResponse.json(
        { status: 'error', message: 'Invalid session.' },
        { status: 401 }
      );
    }

    // Call Firestore logic to add expense
    const expense = await addExpense({ amount, categoryId, description, paidByApartment, owedByApartments, perApartmentShare, receipt });
    return NextResponse.json({ status: 'success', expense });
  } catch (error) {
    console.error('ADD_EXPENSE_ERROR:', error);
    return NextResponse.json(
      { status: 'error', message: 'Failed to add expense.' },
      { status: 500 }
    );
  }
}
