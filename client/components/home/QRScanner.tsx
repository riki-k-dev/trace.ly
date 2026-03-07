"use client";

import { useEffect, useState, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { useRouter } from "next/navigation";

export default function QRScanner() {
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const router = useRouter();

  useEffect(() => {
    const scanner = new Html5Qrcode("reader");
    scannerRef.current = scanner;

    const startScanner = async () => {
      try {
        await scanner.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1,
          },
          (decodedText) => {
            scanner.stop().then(() => {
              if (decodedText.includes(window.location.origin)) {
                router.push(decodedText);
              } else {
                setError("Invalid trace.ly QR Code");
                setTimeout(startScanner, 2000);
              }
            });
          },
          () => {},
        );
      } catch {
        setError("Camera permission denied or not available.");
      }
    };

    startScanner();

    return () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(console.error);
      }
    };
  }, [router]);

  return (
    <div className="w-full flex flex-col items-center">
      <div className="relative w-full aspect-square max-w-62.5 mx-auto rounded-none overflow-hidden bg-zinc-900 border-2 border-dashed border-zinc-600">
        <div id="reader" className="w-full h-full object-cover"></div>
        <div className="absolute inset-0 border-40 border-black/50 pointer-events-none"></div>
        <div className="absolute top-1/2 left-0 w-full h-0.5 bg-emerald-500 shadow-[0_0_10px_#10b981] animate-[scan_2s_ease-in-out_infinite]"></div>
      </div>

      {error ? (
        <p className="mt-4 text-xs font-medium text-red-400 text-center bg-red-500/10 py-2 px-4 rounded-none border border-dashed border-red-500/30">
          {error}
        </p>
      ) : (
        <p className="mt-4 text-[11px] font-bold text-zinc-500 text-center uppercase tracking-widest">
          Point camera at the QR Code
        </p>
      )}

      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes scan {
          0% { transform: translateY(-100px); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(100px); opacity: 0; }
        }
      `,
        }}
      />
    </div>
  );
}
