import type { Metadata } from "next";
import { ReactNode } from "react";
import "@/index.css";
import { DistrictProvider } from "@/context/DistrictContext";
import Layout from "@/components/Layout";

export const metadata: Metadata = {
  title: "ArogyaOne – District Health Intelligence Centre",
  description: "District Health Intelligence Centre for monitoring healthcare operations",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <DistrictProvider>
          <Layout>{children}</Layout>
        </DistrictProvider>
      </body>
    </html>
  );
}
