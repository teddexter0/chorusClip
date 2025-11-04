// src/app/api/payment/route.js
import { NextResponse } from 'next/server';
import crypto from 'crypto';

const PESAPAL_CONSUMER_KEY = process.env.PESAPAL_CONSUMER_KEY;
const PESAPAL_CONSUMER_SECRET = process.env.PESAPAL_CONSUMER_SECRET;
const PESAPAL_API_URL = 'https://cybqa.pesapal.com/pesapalv3'; // QA/Test environment

// For production, use: https://pay.pesapal.com/pesapalv3

// Get OAuth token from Pesapal
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

    if (!response.ok) {
      throw new Error(`Pesapal auth failed: ${response.status}`);
    }

    const data = await response.json();
    return data.token;
  } catch (error) {
    console.error('Pesapal token error:', error);
    throw error;
  }
}

// Register IPN (Instant Payment Notification)
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

    if (!response.ok) {
      throw new Error(`IPN registration failed: ${response.status}`);
    }

    const data = await response.json();
    return data.ipn_id;
  } catch (error) {
    console.error('IPN registration error:', error);
    throw error;
  }
}

// Initiate payment
export async function POST(request) {
  try {
    const { userId, amount, email, phone } = await request.json();

    // Validate inputs
    if (!userId || !amount || !email || !phone) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if Pesapal is configured
    if (!PESAPAL_CONSUMER_KEY || !PESAPAL_CONSUMER_SECRET) {
      console.error('Pesapal credentials missing!');
      return NextResponse.json(
        { success: false, error: 'Payment gateway not configured. Contact support.' },
        { status: 500 }
      );
    }

    // Import Firebase functions dynamically (server-side only)
    const { createPayment } = await import('../../../lib/firebase-server.js');

    // Create payment record in Firebase
    const paymentId = await createPayment(userId, amount, '');

    // Get Pesapal OAuth token
    const token = await getPesapalToken();

    // Register IPN
    const ipnId = await registerIPN(token);

    // Prepare Pesapal payment order
    const orderData = {
      id: paymentId,
      currency: 'KES',
      amount: amount,
      description: 'ChorusClip Premium Subscription',
      callback_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/payment/callback?reference=${paymentId}`,
      notification_id: ipnId,
      billing_address: {
        email_address: email,
        phone_number: phone,
        country_code: 'KE',
        first_name: email.split('@')[0],
        last_name: 'User'
      }
    };

    // Submit order request
    const orderResponse = await fetch(`${PESAPAL_API_URL}/api/Transactions/SubmitOrderRequest`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(orderData)
    });

    if (!orderResponse.ok) {
      const errorText = await orderResponse.text();
      console.error('Pesapal order error:', errorText);
      throw new Error(`Order submission failed: ${orderResponse.status}`);
    }

    const result = await orderResponse.json();

    if (!result.redirect_url) {
      console.error('Pesapal response:', result);
      return NextResponse.json({
        success: false,
        error: 'Payment gateway returned invalid response. Contact support.'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      paymentId: paymentId,
      iframeUrl: result.redirect_url,
      orderTrackingId: result.order_tracking_id
    });

  } catch (error) {
    console.error('Payment initiation error:', error);
    return NextResponse.json(
      { success: false, error: `Payment failed: ${error.message}` },
      { status: 500 }
    );
  }
}

// Payment callback handler
export async function GET(request) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const paymentId = searchParams.get('reference');
    const orderTrackingId = searchParams.get('OrderTrackingId');
    const merchantReference = searchParams.get('OrderMerchantReference');

    if (!paymentId && !merchantReference) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/?payment=error`);
    }

    // Import Firebase functions dynamically
    const { updatePaymentStatus } = await import('../../../lib/firebase-server.js');

    // Get token and query payment status
    const token = await getPesapalToken();
    
    const statusResponse = await fetch(
      `${PESAPAL_API_URL}/api/Transactions/GetTransactionStatus?orderTrackingId=${orderTrackingId}`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      }
    );

    if (!statusResponse.ok) {
      throw new Error('Status query failed');
    }

    const statusData = await statusResponse.json();
    const status = statusData.payment_status_description?.toLowerCase() || 'pending';

    // Map Pesapal status to our status
    let ourStatus = 'pending';
    if (status.includes('completed') || status.includes('success')) {
      ourStatus = 'completed';
    } else if (status.includes('failed') || status.includes('invalid')) {
      ourStatus = 'failed';
    }

    // Update payment status in Firebase
    await updatePaymentStatus(paymentId || merchantReference, ourStatus);

    // Redirect user based on status
    if (ourStatus === 'completed') {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/?payment=success`);
    } else {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/?payment=failed`);
    }

  } catch (error) {
    console.error('Payment callback error:', error);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/?payment=error`);
  }
}