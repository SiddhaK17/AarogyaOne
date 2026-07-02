"use client";

import dynamic from "next/dynamic";
import { ReactNode } from "react";
import Header from "@/components/Header";

const LiveMapContent = dynamic(() => import("@/components/MapContent"), {
  ssr: false,
  loading: () => (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#94a3b8" }}>
      Loading map...
    </div>
  ),
});

export default function LiveMap() {
  return (
    <>
      <Header
        title="Live District Map"
        subtitle="Geographic visualization of healthcare resources across Mumbai"
      />
      <div className="page" style={{ padding: "0 16px 16px" }}>
        <div style={{ display: "flex", gap: 16, height: "calc(100vh - 120px)" }}>
          <LiveMapContent />
        </div>
      </div>
    </>
  );
}
