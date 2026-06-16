"use client";

/**
 * Dynamically imports ResidentPinMap with SSR disabled.
 * Leaflet requires `window` — this wrapper ensures it never runs on the server.
 */

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

const ResidentPinMap = dynamic(() => import("./resident-pin-map"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-56 rounded-lg border border-border bg-muted flex flex-col items-center justify-center gap-2">
      <Loader2 className="h-6 w-6 text-muted-foreground animate-spin" />
      <p className="text-xs text-muted-foreground">Loading map...</p>
    </div>
  ),
});

export default ResidentPinMap;
