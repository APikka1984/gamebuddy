// src/components/ToastManager.jsx - ADD THIS EXPOSE
import { useState } from "react";
import Toast from "./Toast";

let toastCallbacks = [];  // Global toast queue

export default function ToastManager({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = "success") => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => removeToast(id), 4500);
  };

  // Expose addToast globally
  toastCallbacks.push(addToast);

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  return (
    <>
      {children}
      {toasts.map(toast => (
        <Toast 
          key={toast.id} 
          message={toast.message} 
          type={toast.type}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </>
  );
}

// Global useToast hook
export const useToast = () => toastCallbacks[toastCallbacks.length - 1] || (() => {});
