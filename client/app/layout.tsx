import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ToastProvider } from "@/components/ui/ToastProvider";
import PWARegister from "@/components/PWARegister";

export const viewport: Viewport = {
  themeColor: "#09090b",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: {
    default: "trace.ly",
    template: "%s | trace.ly",
  },
  description:
    "End-to-end encrypted, real-time location sharing via temporary links. No user account required. Auto-destructs on expiry.",
  manifest: "/manifest.json",
  keywords: [
    "location sharing",
    "real-time tracking",
    "e2e encryption",
    "privacy",
    "temporary location",
    "gps tracker",
    "secure tracking",
    "pwa",
  ],
  authors: [{ name: "trace.ly" }],
  creator: "trace.ly",
  metadataBase: new URL("https://tracely-rt.vercel.app"),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    title: "trace.ly",
    description:
      "End-to-end encrypted, real-time location sharing via temporary links. No user account required.",
    siteName: "trace.ly",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "trace.ly - Secure Real-Time Location Sharing",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "trace.ly",
    description:
      "End-to-end encrypted, real-time location sharing via temporary links.",
    images: ["/og-image.png"],
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
        <meta name="apple-mobile-web-app-title" content="trace.ly" />
      </head>
      <body
        className="bg-zinc-950 text-zinc-50 min-h-screen font-sans antialiased selection:bg-white selection:text-black"
        suppressHydrationWarning
      >
        <PWARegister />
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
