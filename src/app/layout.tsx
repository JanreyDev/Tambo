import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "@/components/providers";
import { Toaster } from "sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Command Center | PrimeX Ventures",
  description: "Founder monitoring dashboard for PrimeX infrastructure",
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-PH" className="dark" suppressHydrationWarning>
      <head>
        <meta name="robots" content="noindex, nofollow, noarchive" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-grid`}
      >
        <Providers>{children}</Providers>
        <Toaster
          theme="dark"
          position="top-right"
          toastOptions={{
            style: {
              background: "#0f172a",
              border: "1px solid rgba(234, 88, 12, 0.2)",
              color: "#e2e8f0",
            },
          }}
        />
      </body>
    </html>
  );
}
