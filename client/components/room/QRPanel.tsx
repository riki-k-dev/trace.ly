"use client";

import { useState, useEffect } from "react";
import { QRCodeCanvas } from "qrcode.react";

interface QRPanelProps {
  roomId: string;
  isMobile: boolean;
}

export default function QRPanel({ roomId, isMobile }: QRPanelProps) {
  const [roomUrl, setRoomUrl] = useState(`https://trace.ly/room/${roomId}`);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setRoomUrl(window.location.href);
    }, 0);
    return () => clearTimeout(timer);
  }, [roomId]);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Join my trace.ly session",
          text: "Click the link to join my secure real-time location sharing session.",
          url: roomUrl,
        });
      } catch (err) {
        console.error("Error sharing:", err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(roomUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error("Failed to copy", err);
      }
    }
  };

  const downloadQR = () => {
    const canvas = document.getElementById("qr-code") as HTMLCanvasElement;
    if (canvas) {
      const pngUrl = canvas
        .toDataURL("image/png")
        .replace("image/png", "image/octet-stream");
      const downloadLink = document.createElement("a");
      downloadLink.href = pngUrl;
      downloadLink.download = `trace-ly-${roomId}.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    }
  };

  return (
    <div className="bg-zinc-900 border border-dashed border-zinc-600/80 p-3.5 lg:p-5 rounded-none flex flex-col items-center flex-1 shrink-0">
      <div className="flex flex-col items-center justify-center my-auto">
        <div className="p-2.5 lg:p-3 bg-white border border-dashed border-zinc-300">
          <QRCodeCanvas
            id="qr-code"
            value={roomUrl}
            size={isMobile ? 140 : 180}
          />
        </div>

        <p className="text-[11px] font-medium text-zinc-500 uppercase tracking-widest mt-3 mb-3 lg:mt-4 lg:mb-0 flex items-center gap-1.5">
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          Scan to join session
        </p>
      </div>

      <div className="flex gap-2.5 lg:gap-3 w-full mt-auto pt-3 lg:pt-5">
        <button
          onClick={handleShare}
          className="flex-1 flex items-center justify-center gap-1.5 bg-white text-black py-2.5 px-3 rounded-none text-sm font-semibold hover:bg-zinc-200 transition-colors"
        >
          {copied ? (
            <>
              <svg
                className="w-4 h-4 text-emerald-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              Copied!
            </>
          ) : (
            <>
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                />
              </svg>
              Share
            </>
          )}
        </button>
        <button
          onClick={downloadQR}
          className="flex-1 flex items-center justify-center gap-1.5 bg-zinc-800 text-white py-2.5 px-3 rounded-none text-sm font-semibold hover:bg-zinc-700 transition-colors border border-dashed border-zinc-700"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
          Download
        </button>
      </div>
    </div>
  );
}
