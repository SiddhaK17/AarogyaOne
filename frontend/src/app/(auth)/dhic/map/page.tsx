"use client";

import dynamic from "next/dynamic";
import Header from "@/components/Header";

// Dynamically import MapContent with SSR disabled to prevent Leaflet window/document reference crashes.
const MapContent = dynamic(() => import("@/components/MapContent"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full w-full bg-slate-900/10 rounded-2xl border border-slate-200/50" style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", width: "100%" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
        <div style={{ width: 40, height: 40, border: "4px solid #3b82f6", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
        <span style={{ fontSize: 14, fontWeight: 600, color: "#64748b" }}>Initializing Live GIS Map...</span>
      </div>
    </div>
  ),
});

export default function LiveMapPage() {
  return (
    <>
      <Header
        title="Live District Map"
        subtitle="Interactive tracking and operational mapping of registered Palghar healthcare centres"
      />
      <div className="page" style={{ height: "calc(100vh - 160px)", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", gap: 24, height: "100%", flex: 1, minHeight: 0 }}>
          <MapContent />
        </div>
      </div>
      <style jsx global>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}
