"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

type ToastType = "success" | "error" | "info";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  toast: (message: string, type?: ToastType) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: ToastType = "info") => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const originalAlert = window.alert;
      window.alert = (msg: string) => {
        if (msg.toLowerCase().includes('fail') || msg.toLowerCase().includes('error')) {
          addToast(msg, "error");
        } else {
          addToast(msg, "info");
        }
      };
      return () => {
        window.alert = originalAlert;
      };
    }
  }, [addToast]);

  return (
    <ToastContext.Provider
      value={{
        toast: addToast,
        success: (msg) => addToast(msg, "success"),
        error: (msg) => addToast(msg, "error"),
        info: (msg) => addToast(msg, "info"),
      }}
    >
      {children}
      <div 
        className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2"
        aria-live="polite"
        role="status"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border backdrop-blur-md text-sm font-semibold animate-in slide-in-from-bottom-5 fade-in duration-300 min-w-[300px] max-w-md ${
              t.type === "success"
                ? "bg-emerald-50/90 border-emerald-200 text-emerald-800"
                : t.type === "error"
                ? "bg-rose-50/90 border-rose-200 text-rose-800"
                : "bg-blue-50/90 border-blue-200 text-blue-800"
            }`}
          >
            {t.type === "success" && <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />}
            {t.type === "error" && <AlertCircle className="h-5 w-5 text-rose-500 shrink-0" />}
            {t.type === "info" && <Info className="h-5 w-5 text-blue-500 shrink-0" />}
            
            <span className="flex-1">{t.message}</span>
            
            <button
              onClick={() => removeToast(t.id)}
              className="p-1 hover:bg-black/5 rounded-lg transition-colors shrink-0"
              aria-label="Close notification"
            >
              <X className="h-4 w-4 opacity-50 hover:opacity-100" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};
