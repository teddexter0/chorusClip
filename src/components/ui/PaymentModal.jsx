'use client';
import { useState } from 'react';
import { X, Phone } from 'lucide-react';

export default function PaymentModal({ onClose, userEmail, onSuccess }) {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const formatPhone = (value) => {
    let cleaned = value.replace(/\D/g, '');
    if (cleaned.startsWith('0')) {
      cleaned = '254' + cleaned.substring(1);
    } else if (cleaned.startsWith('7')) {
      cleaned = '254' + cleaned;
    } else if (cleaned.startsWith('+254')) {
      cleaned = cleaned.substring(1);
    } else if (!cleaned.startsWith('254')) {
      cleaned = '254' + cleaned;
    }
    return cleaned.substring(0, 12);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const formattedPhone = formatPhone(phone);
    if (!formattedPhone.match(/^254\d{9}$/)) {
      setError('Invalid phone number. Use format: 0712345678 or 712345678');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userEmail,
          amount: 299,
          email: userEmail,
          phone: formattedPhone
        })
      });

      const data = await response.json();
      
      if (data.success && data.iframeUrl) {
        window.location.href = data.iframeUrl;
      } else {
        setError(`❌ ${data.error || 'Payment initiation failed. Please try again.'}`);
        setLoading(false);
      }
    } catch (error) {
      setError('❌ Payment error. Please try again later.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-purple-900 to-pink-900 rounded-3xl p-8 max-w-md w-full border border-yellow-500">
        <button onClick={onClose} className="float-right text-white hover:text-purple-300 transition">
          <X size={32} />
        </button>
        
        <h2 className="text-4xl font-black mb-4">Upgrade to Premium</h2>
        <p className="text-purple-200 mb-6 text-lg">KES 299/month - Cancel anytime</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-base font-bold text-purple-300 mb-2">M-Pesa Phone Number</label>
            <div className="relative">
              <Phone className="absolute left-3 top-4 text-purple-400" size={22} />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0712345678"
                className="w-full pl-12 pr-4 py-4 text-lg bg-purple-950 bg-opacity-50 border border-purple-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
                required
              />
            </div>
            <p className="text-sm text-purple-300 mt-2">
              Format: 0712345678 or 712345678 (we'll add +254)
            </p>
          </div>

          {error && (
            <div className="bg-red-900 bg-opacity-50 border border-red-500 rounded-xl p-4 text-base">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-5 text-xl bg-gradient-to-r from-yellow-400 to-orange-500 text-black rounded-xl font-bold hover:shadow-2xl transition disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Pay KES 299'}
          </button>
        </form>

        <p className="text-sm text-purple-300 text-center mt-4">
          You'll be redirected to Pesapal to complete payment
        </p>
      </div>
    </div>
  );
}