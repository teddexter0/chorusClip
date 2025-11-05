// src/app/api/payment/route.js
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { userEmail, phone } = await request.json();

    // For MVP, just redirect to success - implement actual payment later
    showNotification('🚧 Payment integration coming soon! Premium features unlocked for testing.', 'info');
    
    return NextResponse.json({
      success: true,
      message: 'Payment feature coming soon'
    });

  } catch (error) {
    console.error('Payment error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}