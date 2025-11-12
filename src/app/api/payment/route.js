// src/app/api/payment/route.js
import { NextResponse } from 'next/server';

const PESAPAL_CONSUMER_KEY = process.env.PESAPAL_CONSUMER_KEY;
const PESAPAL_CONSUMER_SECRET = process.env.PESAPAL_CONSUMER_SECRET;
const PESAPAL_API_URL = 'https://cybqa.pesapal.com/pesapalv3'; // DEMO

// ============================================
// GET PESAPAL TOKEN
// ============================================
async function getPesapalToken() {
  try {
    console.log('🔑 Requesting Pesapal token...');
    
    if (!PESAPAL_CONSUMER_KEY || !PESAPAL_CONSUMER_SECRET) {
      throw new Error('Pesapal credentials missing');
    }

    const response = await fetch(`${PESAPAL_API_URL}/api/Auth/RequestToken`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        consumer_key: PESAPAL_CONSUMER_KEY,
        consumer_secret: PESAPAL_CONSUMER_SECRET
      })
    });

    const data = await response.json();
    console.log('📡 Token response:', data);

    if (!data.token) {
      throw new Error(data.error_description || 'No token received');
    }

    return data.token;
  } catch (error) {
    console.error('💥 Token error:', error.message);
    throw error;
  }
}

// ============================================
// POST - INITIATE PAYMENT
// ============================================
export async function POST(request) {
  try {
    const { userId, amount, email, phone } = await request.json();

    // Validate
    if (!userId || !amount || !email || !phone) {
      return NextResponse.json(
        { success: false, error: 'Missing fields' },
        { status: 400 }
      );
    }

    // Check credentials
    if (!PESAPAL_CONSUMER_KEY || !PESAPAL_CONSUMER_SECRET) {
      return NextResponse.json(
        { success: false, error: 'Payment not configured. Contact ted.sande@strathmore.edu' },
        { status: 500 }
      );
    }

    // Get token
    const token = await getPesapalToken();

    // Create order
    const orderId = `CC_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    
    const orderData = {
      id: orderId,
      currency: 'KES',
      amount: amount,
      description: 'ChorusClip Premium - 1 Month',
      callback_url: `${process.env.NEXT_PUBLIC_BASE_URL}/?payment=success`,
      notification_id: 'default-ipn',
      billing_address: {
        email_address: email,
        phone_number: phone,
        country_code: 'KE',
        first_name: email.split('@')[0],
        last_name: 'User',
        line_1: 'Strathmore University',
        city: 'Nairobi',
        state: 'Nairobi',
        postal_code: '00100',
        zip_code: '00100'
      }
    };

    const orderResponse = await fetch(`${PESAPAL_API_URL}/api/Transactions/SubmitOrderRequest`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(orderData)
    });

    const result = await orderResponse.json();
    console.log('📡 Order response:', result);

    if (!result.redirect_url) {
      const errorMsg = result.error_description || result.error || 'Payment failed';
      return NextResponse.json({
        success: false,
        error: `Pesapal: ${errorMsg}`
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      iframeUrl: result.redirect_url,
      orderTrackingId: result.order_tracking_id
    });

  } catch (error) {
    console.error('💥 Payment error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// ============================================
// GET - PAYMENT CALLBACK
// ============================================
export async function GET(request) {
  const searchParams = request.nextUrl.searchParams;
  const status = searchParams.get('status') || 'unknown';
  
  if (status === 'success' || status === 'completed') {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/?payment=success`);
  } else {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/?payment=failed`);
  }
}