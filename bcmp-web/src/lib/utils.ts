import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Normalises a photo/file URL returned by the API so it always loads through
 * the Next.js proxy instead of hitting the backend port directly.
 *
 * Dev:  http://localhost:8000/storage/bcmp/…  →  /storage/bcmp/…
 * Prod: https://primex.sgp1.digitaloceanspaces.com/…  →  unchanged (already HTTPS)
 *
 * Using a relative path keeps the request same-origin, satisfying CSP 'self'
 * without needing http://localhost:* in img-src.
 */
export function resolvePhotoUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    // Anything served from the local API origin or local storage goes via proxy
    if (
      parsed.hostname === "localhost" ||
      parsed.hostname === "127.0.0.1" ||
      (!parsed.hostname.includes("digitaloceanspaces.com") && parsed.pathname.startsWith("/storage/"))
    ) {
      return parsed.pathname + parsed.search;
    }
  } catch {
    // relative path or invalid URL — return as-is
  }
  return url;
}
