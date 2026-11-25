'use client';
import { useEffect, useRef, useState } from 'react';
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react';

export default function Notification({ message, type, onClose }) {
  const [visible, setVisible] = useState(false);

  const dismissTimer = useRef(null);

  useEffect(() => {
    const enter = setTimeout(() => setVisible(true), 10);
    const exit = setTimeout(() => setVisible(false), 2200);
    dismissTimer.current = setTimeout(onClose, 2500);
    return () => {
      clearTimeout(enter);
      clearTimeout(exit);
      clearTimeout(dismissTimer.current);
    };
  }, [onClose]);

  function closeNotification() {
    setVisible(false);
    clearTimeout(dismissTimer.current);
    dismissTimer.current = setTimeout(onClose, 300);
  }

  const bgColor = type === 'success'
    ? 'from-green-700 to-green-800'
    : type === 'error'
    ? 'from-red-700 to-red-800'
    : 'from-blue-700 to-blue-800';

  const Icon = type === 'success' ? CheckCircle : type === 'error' ? XCircle : AlertCircle;

  return (
    <div
      role="status"
      className={`fixed top-20 right-4 z-50 max-w-sm transition-all duration-300 ease-out ${
        visible ? 'translate-x-0 opacity-100' : 'translate-x-8 opacity-0'
      }`}
    >
      <div
        className={`bg-gradient-to-r ${bgColor} text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3`}
        style={{ border: '1.5px solid rgba(250, 204, 21, 0.6)' }}
      >
        <span className="relative flex-shrink-0">
          <Icon size={22} />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-yellow-400 rounded-full animate-ping opacity-75" />
        </span>
        <p className="font-semibold text-base flex-1">{message}</p>
        <button
          onClick={closeNotification}
          aria-label="Dismiss notification"
          className="ml-1 hover:bg-white hover:bg-opacity-20 rounded-full p-1 transition flex-shrink-0"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
