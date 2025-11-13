'use client';
import { useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react';

export default function Notification({ message, type, onClose }) {
  const bgColor = type === 'success' ? 'from-green-600 to-green-700' 
    : type === 'error' ? 'from-red-600 to-red-700' 
    : 'from-blue-600 to-blue-700';
  const Icon = type === 'success' ? CheckCircle : type === 'error' ? XCircle : AlertCircle;

  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`fixed top-20 right-4 z-50 bg-gradient-to-r ${bgColor} text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 animate-slideIn max-w-md`}>
      <Icon size={28} />
      <p className="font-semibold text-lg">{message}</p>
      <button onClick={onClose} className="ml-4 hover:bg-white hover:bg-opacity-20 rounded-full p-1">
        <X size={20} />
      </button>
    </div>
  );
}