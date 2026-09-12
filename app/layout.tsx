import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Inter } from "next/font/google";
import { env } from "@/lib/env";
import "./globals.css";

const display = Bricolage_Grotesque({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

const sans = Inter({ variable: "--font-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(env.appUrl),
  title: {
    default: "AI Roast My Life | RoastMe AI",
    template: "%s | RoastMe AI",
  },
  description:
    "Let AI analyze your digital life and tell you what your friends are too nice to say.",
  applicationName: "RoastMe AI",
  keywords: ["AI roast", "roast me", "AI roast generator", "personality roast", "funny AI"],
  openGraph: {
    title: "AI just roasted my life 💀",
    description: "I gave AI some information about myself. I regret everything.",
    url: env.appUrl,
    siteName: "RoastMe AI",
    type: "website",
    images: [{ url: "/api/og", width: 1200, height: 630, alt: "RoastMe AI" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "AI just roasted my life 💀",
    description: "I gave AI some information about myself. I regret everything.",
    images: ["/api/og"],
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#07060b",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-scroll-behavior="smooth" className={`${display.variable} ${sans.variable}`}>
      <body className="min-h-dvh antialiased">
        <div className="relative z-10">{children}</div>
      </body>
    </html>
  );
}
