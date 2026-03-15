import dynamic from "next/dynamic";

// Leaflet requires `window` — must be loaded client-side only
const AllResidentsMap = dynamic(() => import("./all-residents-map"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-muted/20">
      <div className="text-center">
        <div className="w-10 h-10 border-2 border-accent-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs text-muted-foreground">Loading map...</p>
      </div>
    </div>
  ),
});

export default AllResidentsMap;
export type { MapResident } from "./all-residents-map";
