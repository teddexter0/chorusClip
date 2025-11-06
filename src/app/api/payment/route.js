// src/app/api/payment/route.js
import { NextResponse } from 'next/server';

const PESAPAL_CONSUMER_KEY = process.env.PESAPAL_CONSUMER_KEY;
const PESAPAL_CONSUMER_SECRET = process.env.PESAPAL_CONSUMER_SECRET;
const PESAPAL_API_URL = 'https://cybqa.pesapal.com/pesapalv3'; // Demo/Sandbox

// ============================================
// GET PESAPAL TOKEN
// ============================================
async function getPesapalToken() {
  try {
    console.log('🔑 Requesting Pesapal token...');
    console.log('📍 API URL:', PESAPAL_API_URL);
    console.log('🔐 Has consumer key:', !!PESAPAL_CONSUMER_KEY);
    console.log('🔐 Has consumer secret:', !!PESAPAL_CONSUMER_SECRET);

    if (!PESAPAL_CONSUMER_KEY || !PESAPAL_CONSUMER_SECRET) {
      throw new Error('Pesapal credentials missing from environment variables');
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
    console.log('📡 Pesapal token response:', JSON.stringify(data, null, 2));

    if (!data.token) {
      const errorMsg = data.error_description || data.error || 'No token received';
      console.error('❌ Pesapal token error:', errorMsg);
      throw new Error(errorMsg);
    }

    console.log('✅ Token received successfully');
    return data.token;
  } catch (error) {
    console.error('💥 getPesapalToken failed:', error.message);
    throw error;
  }
}

// ============================================
// REGISTER IPN (Callback URL)
// ============================================
async function registerIPN(token) {
  try {
    console.log('📞 Registering IPN callback...');
    
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
    console.log('📡 IPN registration response:', JSON.stringify(data, null, 2));
    
    return data.ipn_id || 'default-ipn';
  } catch (error) {
    console.error('⚠️ IPN registration failed (non-critical):', error.message);
    return 'default-ipn'; // Fallback
  }
}

// ============================================
// POST - INITIATE PAYMENT
// ============================================
export async function POST(request) {
  try {
    console.log('\n🚀 ===== NEW PAYMENT REQUEST =====');
    
    const body = await request.json();
    const { userId, amount, email, phone } = body;

    console.log('📋 Payment details:', { userId, amount, email, phone });

    // Validate inputs
    if (!userId || !amount || !email || !phone) {
      console.error('❌ Missing required fields');
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if Pesapal is configured
    if (!PESAPAL_CONSUMER_KEY || !PESAPAL_CONSUMER_SECRET) {
      console.error('❌ Pesapal credentials not configured');
      return NextResponse.json(
        { 
          success: false, 
          error: 'Payment system not configured. Please contact support at ted.sande@strathmore.edu' 
        },
        { status: 500 }
      );
    }

    // Step 1: Get OAuth token
    console.log('\n📌 Step 1: Getting Pesapal token...');
    let token;
    try {
      token = await getPesapalToken();
    } catch (tokenError) {
      console.error('❌ Failed to get token:', tokenError.message);
      return NextResponse.json({
        success: false,
        error: `Payment gateway authentication failed: ${tokenError.message}`
      }, { status: 500 });
    }

    // Step 2: Register IPN
    console.log('\n📌 Step 2: Registering IPN...');
    const ipnId = await registerIPN(token);
    console.log('✅ IPN ID:', ipnId);

    // Step 3: Create payment order
    console.log('\n📌 Step 3: Creating payment order...');
    const orderId = `CC_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    console.log('🆔 Order ID:', orderId);

    const orderData = {
      id: orderId,
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

    console.log('📦 Order data:', JSON.stringify(orderData, null, 2));

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
    console.log('📡 Pesapal order response:', JSON.stringify(result, null, 2));

    // Check if we got a redirect URL
    if (!result.redirect_url) {
      console.error('❌ No redirect URL in response');
      console.error('Full response:', result);
      
      const errorMessage = result.error_description || result.error || result.message || 'Payment initialization failed';
      
      return NextResponse.json({
        success: false,
        error: `Pesapal error: ${errorMessage}. Please contact support at ted.sande@strathmore.edu`
      }, { status: 500 });
    }

    console.log('✅ Payment order created successfully!');
    console.log('🔗 Redirect URL:', result.redirect_url);
    console.log('🆔 Tracking ID:', result.order_tracking_id);
    console.log('\n🎉 ===== PAYMENT REQUEST SUCCESS =====\n');

    return NextResponse.json({
      success: true,
      iframeUrl: result.redirect_url,
      orderTrackingId: result.order_tracking_id
    });

  } catch (error) {
    console.error('💥 CRITICAL ERROR in payment route:', error);
    console.error('Error stack:', error.stack);
    
    return NextResponse.json(
      { 
        success: false, 
        error: `Payment failed: ${error.message}. Contact ted.sande@strathmore.edu` 
      },
      { status: 500 }
    );
  }
}

// ============================================
// GET - PAYMENT CALLBACK
// ============================================
export async function GET(request) {
  console.log('\n🔔 ===== PAYMENT CALLBACK RECEIVED =====');
  
  const searchParams = request.nextUrl.searchParams;
  const status = searchParams.get('status') || 'unknown';
  const orderTrackingId = searchParams.get('OrderTrackingId');
  
  console.log('📋 Callback params:', { status, orderTrackingId });
  
  if (status === 'success' || status === 'completed') {
    console.log('✅ Payment successful!');
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/?payment=success`);
  } else {
    console.log('❌ Payment failed or cancelled');
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/?payment=failed`);
  }
}