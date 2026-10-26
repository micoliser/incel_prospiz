import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://prospiz.inceltourism.com"),
  title: "Lagos Luxe 2026 | Incel Holidays × Prospiz",
  description:
    "13–30 December 2026. 7 days of curated Lagos tours, authentic food, wellness, and VIP nights. Air-conditioned transport, guides, and MOPOL security sorted.",
  keywords: [
    "Lagos Luxe 2026",
    "Incel Holidays and Tourism",
    "Prospiz Management Consulting",
    "Olumo Rock Tour",
    "Badagry Heritage Tour",
    "Tarkwa Bay Beach Lagos",
    "Kalakuta Afrobeat Museum",
    "Lekki Conservation Centre",
    "Nigeria Diaspora Travel",
  ],
  openGraph: {
    title: "Lagos Luxe 2026",
    description:
      "Come home, experience Lagos in December. Tours, food, wellness & VIP nights sorted.",
    images: [{ url: "/images/hero-lagos.jpg", width: 1200, height: 630 }],
  },
  icons: {
    icon: [
      { url: "/tourism-favicon.png" },
      { url: "/tourism-favicon.png", type: "image/png" },
    ],
    shortcut: "/tourism-favicon.png",
    apple: "/tourism-favicon.png",
  },
};

import { PendingCheckoutNotifier } from "@/components/PendingCheckoutNotifier";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/tourism-favicon.png" type="image/png" />
        <link
          rel="shortcut icon"
          href="/tourism-favicon.png"
          type="image/png"
        />
        <link rel="apple-touch-icon" href="/tourism-favicon.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Cabinet+Grotesk:wght@700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        {children}
        <PendingCheckoutNotifier />
      </body>
    </html>
  );
}
