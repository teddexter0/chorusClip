const handleSubmit = async (e) => {
  e.preventDefault();
  const formattedPhone = formatPhone(phone);
  
  if (!formattedPhone.match(/^254\d{9}$/)) {
    setError('Invalid phone number');
    return;
  }

  // Direct Pesapal redirect
  const pesapalUrl = 'https://www.pesapal.com/API/PostPesapalDirectOrderV4';
  const params = new URLSearchParams({
    Amount: '299',
    Description: 'ChorusClip Premium',
    Type: 'MERCHANT',
    Reference: `${userEmail}_${Date.now()}`,
    Email: userEmail,
    PhoneNumber: formattedPhone,
    Currency: 'KES',
    callback_url: `${window.location.origin}/?payment=success`
  });
  
  window.location.href = `${pesapalUrl}?${params.toString()}`;
};