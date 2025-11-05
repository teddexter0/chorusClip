// src/app/api/payment/route.js
import { NextResponse } from 'next/server';

const PESAPAL_CONSUMER_KEY = process.env.PESAPAL_CONSUMER_KEY;
const PESAPAL_CONSUMER_SECRET = process.env.PESAPAL_CONSUMER_SECRET;
const PESAPAL_API_URL = 'https://cybqa.pesapal.com/pesapalv3';

// Get OAuth token
async function getPesapalToken() {
  try {
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
    if (!data.token) {
      throw new Error('No token received from Pesapal');
    }
    return data.token;
  } catch (error) {
    console.error('Pesapal token error:', error);
    throw error;
  }
}

// Register IPN
async function registerIPN(token) {
  try {
    const response = await fetch(`${PESAPAL_API_URL}/api/URLSetup/RegisterIPN`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/payment/callback`,
        ipn_notification_type: 'GET'
      })
    });

    const data = await response.json();
    return data.ipn_id || 'default-ipn';
  } catch (error) {
    console.error('IPN registration error:', error);
    return 'default-ipn'; // Fallback
  }
}

export async function POST(request) {
  try {
    const { userId, amount, email, phone } = await request.json();

    if (!userId || !amount || !email || !phone) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!PESAPAL_CONSUMER_KEY || !PESAPAL_CONSUMER_SECRET) {
      return NextResponse.json(
        { success: false, error: 'Payment gateway not configured. Contact ted.sande@strathmore.edu' },
        { status: 500 }
      );
    }

    // Get token
    const token = await getPesapalToken();
    
    // Register IPN
    const ipnId = await registerIPN(token);

    // Create payment order
    const orderData = {
      id: `CC_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      currency: 'KES',
      amount: amount,
      description: 'ChorusClip Premium - 1 Month',
      callback_url: `${process.env.NEXT_PUBLIC_BASE_URL}/?payment=success`,
      notification_id: ipnId,
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

    // In payment/route.js, update the POST function:
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
console.log('Pesapal full response:', JSON.stringify(result, null, 2)); // ADD THIS LINE

if (!result.redirect_url) {
  console.error('Pesapal error details:', result);
  return NextResponse.json({
    success: false,
    error: `Pesapal says: ${JSON.stringify(result)}` // Show actual error
  }, { status: 500 });
}

    return NextResponse.json({
      success: true,
      iframeUrl: result.redirect_url,
      orderTrackingId: result.order_tracking_id
    });

  } catch (error) {
    console.error('Payment error:', error);
    return NextResponse.json(
      { success: false, error: `Payment failed: ${error.message}. Contact ted.sande@strathmore.edu` },
      { status: 500 }
    );
  }
}

// Callback handler
export async function GET(request) {
  const searchParams = request.nextUrl.searchParams;
  const status = searchParams.get('status') || 'unknown';
  
  if (status === 'success' || status === 'completed') {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/?payment=success`);
  } else {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/?payment=failed`);
  }
}