import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "trace.ly | Realtime Tracker",
  description: "Secure, real-time location sharing with QR codes.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-zinc-950 text-zinc-50 min-h-screen font-sans antialiased selection:bg-white selection:text-black">
        {children}
      </body>
    </html>
  );
}
