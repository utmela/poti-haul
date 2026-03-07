import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Poti Transport — Car hauling across Georgia",
  description: "Find tow truck and car carrier offers from Poti to Georgian cities.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ka" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        {/* ── Global Navbar ── */}
        <nav className="bg-[var(--copart-blue)] text-white shadow-sm">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
            <Link href="/" className="text-lg font-black tracking-tight">
              Poti Transport
            </Link>
            <Link
              href="/post"
              className="rounded-lg bg-[var(--copart-yellow)] px-4 py-2 text-sm font-bold text-black hover:brightness-95"
            >
              + Post transport
            </Link>
          </div>
        </nav>

        {children}
      </body>
    </html>
  );
}