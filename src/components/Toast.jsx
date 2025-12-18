// src/components/Toast.jsx - NEW FILE
import { useState, useEffect } from "react";

export default function Toast({ message, type = "success", duration = 4000, onClose }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 300);
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  if (!visible) return null;

  return (
    <div className={`fixed top-20 right-4 z-50 p-4 rounded-xl shadow-2xl transform transition-all duration-300 ${
      type === "success" ? "bg-green-500 text-white" : 
      type === "error" ? "bg-red-500 text-white" : 
      "bg-blue-500 text-white"
    }`}>
      <div className="flex items-center justify-between">
        <span className="font-medium">{message}</span>
        <button onClick={() => setVisible(false)} className="ml-4 text-white opacity-70 hover:opacity-100">
          ✕
        </button>
      </div>
    </div>
  );
}
