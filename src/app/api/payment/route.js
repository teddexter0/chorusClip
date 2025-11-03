// app/api/payment/route.js
import * as crypto from 'crypto';
import { NextResponse } from 'next/server';
import { createPayment, updatePaymentStatus } from '../../../lib/firebase.js';

const PESAPAL_CONSUMER_KEY = process.env.PESAPAL_CONSUMER_KEY;
const PESAPAL_CONSUMER_SECRET = process.env.PESAPAL_CONSUMER_SECRET;
const PESAPAL_IFRAME_URL = 'https://www.pesapal.com/API/PostPesapalDirectOrderV4';

// Initiate payment
export async function POST(request) {
  try {
    const { userId, amount, email, phone } = await request.json();

    // Create payment record in Firebase
    const paymentId = await createPayment(userId, amount, '');

    // Prepare Pesapal payment data
    const pesapalData = {
      Amount: amount,
      Description: 'ChorusClip Premium Subscription',
      Type: 'MERCHANT',
      Reference: paymentId,
      Email: email,
      PhoneNumber: phone,
      Currency: 'KES',
      callback_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/payment/callback`
    };

    // Generate OAuth signature (simplified - use proper OAuth library in production)
    const timestamp = new Date().toISOString();
    const nonce = Math.random().toString(36).substring(7);

    // In production, use proper OAuth 1.0 signature generation
    // For now, this is a placeholder
    const signature = generateOAuthSignature(pesapalData);

    // Make request to Pesapal
    const response = await fetch(PESAPAL_IFRAME_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `OAuth oauth_consumer_key="${PESAPAL_CONSUMER_KEY}", oauth_signature_method="HMAC-SHA1", oauth_timestamp="${timestamp}", oauth_nonce="${nonce}", oauth_version="1.0", oauth_signature="${signature}"`
      },
      body: JSON.stringify(pesapalData)
    });

    const result = await response.text();
    
    // Extract iframe URL from response
    const iframeUrl = extractIframeUrl(result);

    return NextResponse.json({
      success: true,
      paymentId: paymentId,
      iframeUrl: iframeUrl
    });

  } catch (error) {
    console.error('Payment initiation error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// Payment callback handler
export async function GET(request) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const paymentId = searchParams.get('reference');
    const pesapalTrackingId = searchParams.get('pesapal_transaction_tracking_id');

    // Query Pesapal for payment status
    const status = await queryPesapalStatus(pesapalTrackingId);

    // Update payment status in Firebase
    await updatePaymentStatus(paymentId, status);

    // Redirect user based on status
    if (status === 'completed') {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/success`);
    } else {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/failed`);
    }

  } catch (error) {
    console.error('Payment callback error:', error);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/error`);
  }
}

// Helper functions

function generateOAuthSignature(data) {
  // Simplified OAuth signature generation
  // In production, use a proper OAuth 1.0 library like 'oauth-1.0a'
  const baseString = `POST&${encodeURIComponent(PESAPAL_IFRAME_URL)}&${encodeURIComponent(JSON.stringify(data))}`;
  const signingKey = `${encodeURIComponent(PESAPAL_CONSUMER_SECRET)}&`;
  
  const signature = crypto
    .createHmac('sha1', signingKey)
    .update(baseString)
    .digest('base64');
  
  return signature;
}

function extractIframeUrl(response) {
  // Extract iframe URL from Pesapal response
  const match = response.match(/src="([^"]+)"/);
  return match ? match[1] : '';
}

async function queryPesapalStatus(trackingId) {
  // Query Pesapal API for transaction status
  const queryUrl = `https://www.pesapal.com/api/querypaymentstatus?pesapal_merchant_reference=${trackingId}`;
  
  try {
    const response = await fetch(queryUrl, {
      headers: {
        'Authorization': `OAuth oauth_consumer_key="${PESAPAL_CONSUMER_KEY}"`
      }
    });
    
    const result = await response.text();
    
    // Parse status from response
    if (result.includes('COMPLETED')) return 'completed';
    if (result.includes('FAILED')) return 'failed';
    return 'pending';
    
  } catch (error) {
    console.error('Status query error:', error);
    return 'failed';
  }
}

// Alternative: M-Pesa STK Push (Daraja API)
// export async function initiateSTKPush(request) {
//   try {
//     const { userId, amount, phone } = await request.json();

//     // Get M-Pesa access token
//     const auth = Buffer.from(`${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`).toString('base64');
    
//     const tokenResponse = await fetch('https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials', {
//       headers: {
//         'Authorization': `Basic ${auth}`
//       }
//     });
    
//     const { access_token } = await tokenResponse.json();

//     // Initiate STK Push
//     const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, -3);
//     const password = Buffer.from(`${process.env.MPESA_SHORTCODE}${process.env.MPESA_PASSKEY}${timestamp}`).toString('base64');

//     const stkPushResponse = await fetch('https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest', {
//       method: 'POST',
//       headers: {
//         'Authorization': `Bearer ${access_token}`,
//         'Content-Type': 'application/json'
//       },
//       body: JSON.stringify({
//         BusinessShortCode: process.env.MPESA_SHORTCODE,
//         Password: password,
//         Timestamp: timestamp,
//         TransactionType: 'CustomerPayBillOnline',
//         Amount: amount,
//         PartyA: phone,
//         PartyB: process.env.MPESA_SHORTCODE,
//         PhoneNumber: phone,
//         CallBackURL: `${process.env.NEXT_PUBLIC_BASE_URL}/api/payment/mpesa-callback`,
//         AccountReference: 'ChorusClip Premium',
//         TransactionDesc: 'Premium Subscription'
//       })
//     });

//     const result = await stkPushResponse.json();

//     return NextResponse.json({
//       success: true,
//       checkoutRequestId: result.CheckoutRequestID
//     });

//   } catch (error) {
//     console.error('STK Push error:', error);
//     return NextResponse.json(
//       { success: false, error: error.message },
//       { status: 500 }
//     );
//   }
// }