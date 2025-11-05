import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { userId, amount, email, phone } = await request.json();

    if (!userId || !amount || !email || !phone) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Simple Pesapal redirect - no Firebase, no IPN, just redirect
    const pesapalUrl = `https://www.pesapal.com/API/PostPesapalDirectOrderV4`;
    
    // Build redirect URL manually
    const callbackUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/?payment=success`;
    const description = 'ChorusClip Premium';
    
    // Create simple iframe URL
    const iframeUrl = `${pesapalUrl}?Amount=${amount}&Description=${encodeURIComponent(description)}&Type=MERCHANT&Reference=${userId}_${Date.now()}&Email=${email}&PhoneNumber=${phone}&Currency=KES&callback_url=${encodeURIComponent(callbackUrl)}`;

    return NextResponse.json({
      success: true,
      iframeUrl: iframeUrl
    });

  } catch (error) {
    console.error('Payment error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// Remove GET callback - not needed for simple redirect