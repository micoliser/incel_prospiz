import type { Metadata } from "next";
import Script from "next/script";
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
        {/* Google Analytics (gtag.js) */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-MHQ0V9XKE8"
          strategy="afterInteractive"
        />
        <Script
          id="google-analytics"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());

              gtag('config', 'G-MHQ0V9XKE8');
            `,
          }}
        />

        {/* Meta Pixel Code */}
        <Script
          id="meta-pixel"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '1426074797913816');
              fbq('track', 'PageView');
            `,
          }}
        />
        <noscript>
          <img
            height="1"
            width="1"
            style={{ display: "none" }}
            src="https://www.facebook.com/tr?id=1426074797913816&ev=PageView&noscript=1"
            alt=""
          />
        </noscript>
        {/* End Meta Pixel Code */}

        {/* Tawk.to Live Chat */}
        <Script
          id="tawk-to"
          strategy="lazyOnload"
          dangerouslySetInnerHTML={{
            __html: `
              var Tawk_API = Tawk_API || {}, Tawk_LoadStart = new Date();
              (function(){
                var s1 = document.createElement("script"), s0 = document.getElementsByTagName("script")[0];
                s1.async = true;
                s1.src = 'https://embed.tawk.to/6ae72bd9052a1a3c2f63cce1/1k6bg6jaa';
                s1.charset = 'UTF-8';
                s1.setAttribute('crossorigin', '*');
                s0.parentNode.insertBefore(s1, s0);
              })();
            `,
          }}
        />
        {/* End Tawk.to Live Chat */}

        {children}
        <PendingCheckoutNotifier />
      </body>
    </html>
  );
}
