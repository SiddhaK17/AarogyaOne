import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { AppDataProvider } from "@/context/AppDataContext";

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
        <AppDataProvider>
          {children}
        </AppDataProvider>
      </body>
    </html>
  );
}
