import { cn } from "@/lib/utils";

interface PrimeXLogoProps {
  className?: string;
}

export function PrimeXLogo({ className }: PrimeXLogoProps) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("h-6 w-6", className)}
    >
      {/* Upper swirl - starts top-left, curves through center to bottom-right */}
      <path
        d="M25 10 C5 25, 5 55, 30 70 C45 78, 60 75, 70 65 C80 55, 78 40, 65 32 C55 26, 45 30, 42 38"
        stroke="currentColor"
        strokeWidth="10"
        strokeLinecap="round"
        fill="none"
      />
      {/* Lower swirl - starts bottom-right, curves through center to top-left */}
      <path
        d="M75 90 C95 75, 95 45, 70 30 C55 22, 40 25, 30 35 C20 45, 22 60, 35 68 C45 74, 55 70, 58 62"
        stroke="currentColor"
        strokeWidth="10"
        strokeLinecap="round"
        fill="none"
        opacity="0.6"
      />
    </svg>
  );
}
