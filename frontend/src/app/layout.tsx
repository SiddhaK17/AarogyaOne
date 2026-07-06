import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { AppDataProvider } from "@/context/AppDataContext";
import { AuthProvider } from "@/context/AuthContext";
import { ToastProvider } from "@/context/ToastContext";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
});

import "./globals.css";

export const metadata: Metadata = {
  title: "AarogyaOne - Healthcare Intelligence Platform",
  description: "Unified AI-assisted public health operations network",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${plusJakartaSans.variable} font-sans antialiased`}
      >
        <ErrorBoundary>
          <ToastProvider>
            <AuthProvider>
              <AppDataProvider>
                {children}
              </AppDataProvider>
            </AuthProvider>
          </ToastProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
