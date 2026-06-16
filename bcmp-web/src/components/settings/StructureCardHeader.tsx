"use client";

interface Props {
  variant: "klasiko" | "elegante" | "moderno";
  barangayName?: string | null;
  municipality?: string | null;
  province?: string | null;
  logoUrl?: string | null;
  municipalityLogoUrl?: string | null;
  compact?: boolean;
}

export function StructureCardHeader({
  variant,
  barangayName,
  municipality,
  province,
  logoUrl,
  municipalityLogoUrl,
  compact = false,
}: Props) {
  const docBarangay = (barangayName?.trim()) || "Barangay San Roque";
  const docMunicipality = (municipality?.trim()) || "City of Caloocan";
  const docProvince = (province?.trim()) || "Metro Manila";

  if (variant === "moderno") {
    return (
      <div className={`${compact ? "px-3 pt-3 pb-2" : "px-4 pt-4 pb-3"} border-b border-gray-300 flex flex-col items-center flex-shrink-0`}>
        <div className={`flex items-center justify-center ${compact ? "gap-2 mb-1.5" : "gap-3 mb-2"}`}>
          <Seal url={municipalityLogoUrl ?? null} size={compact ? 34 : 42} fallbackLabel="LGU" dashed />
          <Seal url={logoUrl ?? null} size={compact ? 34 : 42} fallbackLabel="BRGY" />
        </div>
        <div className="text-center" style={{ lineHeight: 1.2 }}>
          <p className={`${compact ? "text-[7px] tracking-[0.16em]" : "text-[9px] tracking-[0.2em]"} uppercase text-gray-500 font-medium`}>
            Republic of the Philippines
          </p>
          <p className={`${compact ? "text-[8px]" : "text-[10px]"} text-gray-600 mt-px`}>
            {docProvince} · {docMunicipality}
          </p>
          <p
            className={`${compact ? "text-[11px] tracking-[0.04em]" : "text-[14px] tracking-[0.05em]"} font-bold uppercase text-gray-900`}
            style={{ lineHeight: 1.05, marginTop: compact ? 2 : 4 }}
          >
            {docBarangay}
          </p>
          <div className={`${compact ? "w-12 mt-1" : "w-16 mt-1.5"} h-px mx-auto bg-gray-400`} />
        </div>
      </div>
    );
  }

  const isElegante = variant === "elegante";
  const sealSize = compact ? (isElegante ? 36 : 40) : (isElegante ? 44 : 50);
  const gap = compact ? "gap-2" : isElegante ? "gap-2" : "gap-3";

  return (
    <div
      className={`${compact ? "px-2.5 pt-2 pb-1.5" : "px-3 pt-2.5 pb-2"} border-b flex items-center flex-shrink-0 ${gap}`}
      style={{
        borderColor: isElegante ? "#374151" : "#9ca3af",
        borderBottomWidth: isElegante ? 2 : 1,
      }}
    >
      <Seal
        url={municipalityLogoUrl ?? null}
        size={sealSize}
        fallbackLabel="LGU"
        thickBorder={isElegante}
      />
      <div className="flex-1 text-center min-w-0" style={{ lineHeight: 1.15 }}>
        <p
          className={`${compact ? "text-[7px]" : "text-[8.5px]"} uppercase text-gray-500 font-medium truncate`}
          style={{ letterSpacing: compact ? (isElegante ? "0.06em" : "0.1em") : (isElegante ? "0.1em" : "0.18em") }}
        >
          Republic of the Philippines
        </p>
        <p className={`${compact ? "text-[8px]" : "text-[10px]"} text-gray-600 truncate`} style={{ marginTop: 1 }}>
          Province of {docProvince}
        </p>
        <p className={`${compact ? "text-[8px]" : "text-[10px]"} text-gray-700 font-medium truncate`}>
          {docMunicipality}
        </p>
        <p
          className={`${compact ? "text-[11px]" : "text-[15px]"} font-bold uppercase text-gray-900 truncate`}
          style={{ lineHeight: 1.05, marginTop: compact ? 2 : 3, letterSpacing: compact ? "0.03em" : "0.04em" }}
        >
          {docBarangay}
        </p>
        {isElegante && (
          <div className={`flex items-center justify-center gap-1 ${compact ? "mt-0.5" : "mt-1"}`}>
            <div className={`${compact ? "w-2" : "w-3"} h-px bg-gray-500`} />
            <div className={`${compact ? "w-0.5 h-0.5" : "w-1 h-1"} rotate-45 bg-gray-500`} />
            <div className={`${compact ? "w-2" : "w-3"} h-px bg-gray-500`} />
          </div>
        )}
      </div>
      <Seal
        url={logoUrl ?? null}
        size={sealSize}
        fallbackLabel="BRGY"
        thickBorder={isElegante}
      />
    </div>
  );
}

function Seal({
  url,
  size,
  fallbackLabel,
  thickBorder,
  dashed,
}: {
  url: string | null;
  size: number;
  fallbackLabel: string;
  thickBorder?: boolean;
  dashed?: boolean;
}) {
  const borderClass = thickBorder
    ? "border-2 border-gray-700 ring-1 ring-gray-300 ring-offset-1 ring-offset-white"
    : dashed
      ? "border border-dashed border-gray-400"
      : "border border-gray-400";

  if (url) {
    return (
      <div
        className={`rounded-full overflow-hidden bg-white flex-shrink-0 ${borderClass}`}
        style={{ width: size, height: size }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={url}
          alt={fallbackLabel === "BRGY" ? "Barangay seal" : "Municipality seal"}
          className="w-full h-full object-contain"
        />
      </div>
    );
  }

  return (
    <div
      className={`rounded-full flex items-center justify-center bg-gray-50 flex-shrink-0 ${borderClass}`}
      style={{ width: size, height: size }}
    >
      <span className="text-[8px] tracking-wider text-gray-400 font-semibold">{fallbackLabel}</span>
    </div>
  );
}
