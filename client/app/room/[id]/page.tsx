"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { QRCodeCanvas } from "qrcode.react";
import socket from "@/lib/socket";
import { motion, useAnimation, PanInfo } from "framer-motion";

const Map = dynamic(() => import("@/components/Map"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-zinc-900/50 text-zinc-500 animate-pulse rounded-none border border-dashed border-zinc-800/50">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-4 border-zinc-700 border-t-white rounded-none animate-spin" />
        <p className="text-sm font-medium tracking-wide">Connecting to satellites...</p>
      </div>
    </div>
  ),
});

interface UserLocation {
  id: string;
  latitude: number;
  longitude: number;
}

export default function RoomPage() {
  const params = useParams();
  const roomId = params.id as string;
  const router = useRouter();

  const [error, setError] = useState<string | null>(null);
  const [myLocation, setMyLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [users, setUsers] = useState<Record<string, UserLocation>>({});
  
  const [roomUrl, setRoomUrl] = useState("");
  const [copied, setCopied] = useState(false);
  
  const [expiryTime, setExpiryTime] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState<string>("--h --m --s");

  // Bottom Sheet States
  const controls = useAnimation();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Calculate total active participants
  const activeParticipants = Object.keys(users).length + (myLocation ? 1 : 0);

  // Check if Mobile Device
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile(); 
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Handle Drawer Animation state
  useEffect(() => {
    if (!isMobile) {
      controls.start({ y: 0 }); // Desktop par normal
    } else {
      // Peek state (collapsed) pe kitna drawer dikhna chahiye
      controls.start({ y: isExpanded ? 0 : "calc(100% - 130px)" });
    }
  }, [isMobile, isExpanded, controls]);

  // Handle Swipe/Drag gesture
  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (!isMobile) return;
    const swipeThreshold = 50;
    
    if (info.offset.y < -swipeThreshold || info.velocity.y < -500) {
      setIsExpanded(true); // Pura expand hoga
    } else if (info.offset.y > swipeThreshold || info.velocity.y > 500) {
      setIsExpanded(false); // Niche chala jayega
    } else {
      // Wapis apni jagah pe snap karega
      controls.start({ y: isExpanded ? 0 : "calc(100% - 130px)" });
    }
  };

  useEffect(() => {
    setRoomUrl(typeof window !== "undefined" ? window.location.href : "");
    if (!roomId) return;

    socket.connect();
    socket.emit("join-room", roomId);

    socket.on("error", (err: { message: string }) => setError(err.message));
    socket.on("room-ended", () => router.push("/"));

    socket.on("room-joined", (data?: { expiryTime: number }) => {
      if (data?.expiryTime) setExpiryTime(data.expiryTime);
    });

    socket.on("receive-location", (data: UserLocation) => {
      setUsers((prev) => ({ ...prev, [data.id]: data }));
    });

    socket.on("user-left", ({ userId }: { userId: string }) => {
      setUsers((prev) => {
        const updated = { ...prev };
        delete updated[userId];
        return updated;
      });
    });

    let watchId: number;
    if (navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setMyLocation({ latitude, longitude });
          socket.emit("send-location", { roomId, latitude, longitude });
        },
        (err) => console.error(err),
        { enableHighAccuracy: true }
      );
    }

    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
      socket.off("error");
      socket.off("room-ended");
      socket.off("room-joined");
      socket.off("receive-location");
      socket.off("user-left");
    };
  }, [roomId, router]);

  // Timer logic
  useEffect(() => {
    if (!expiryTime) return;
    const interval = setInterval(() => {
      const now = Date.now();
      const diff = expiryTime - now;
      if (diff <= 0) {
        setTimeLeft("00h 00m 00s");
        clearInterval(interval);
      } else {
        const hours = String(Math.floor(diff / (1000 * 60 * 60))).padStart(2, '0');
        const mins = String(Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))).padStart(2, '0');
        const secs = String(Math.floor((diff % (1000 * 60)) / 1000)).padStart(2, '0');
        setTimeLeft(`${hours}h ${mins}m ${secs}s`);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [expiryTime]);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Join my trace.ly session",
          text: "Click the link to join my secure real-time location sharing session.",
          url: roomUrl,
        });
      } catch (err) { console.error("Error sharing:", err); }
    } else {
      try {
        await navigator.clipboard.writeText(roomUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) { console.error("Failed to copy", err); }
    }
  };

  const downloadQR = () => {
    const canvas = document.getElementById("qr-code") as HTMLCanvasElement;
    if (canvas) {
      const pngUrl = canvas.toDataURL("image/png").replace("image/png", "image/octet-stream");
      const downloadLink = document.createElement("a");
      downloadLink.href = pngUrl;
      downloadLink.download = `trace-ly-${roomId}.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    }
  };

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen text-red-400 bg-zinc-950 font-medium">
        <div className="bg-red-500/10 px-6 py-4 rounded-none border border-dashed border-red-500/20 flex items-center gap-3">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[100dvh] bg-zinc-950 relative overflow-hidden lg:p-4 lg:gap-4">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-lg h-32 bg-white/[0.02] blur-[100px] pointer-events-none rounded-none" />

      {/* Header Container */}
      <div className="flex-none p-3 pb-0 lg:p-0 relative z-20">
        <header className="flex items-center justify-between px-4 py-3 bg-zinc-900/80 backdrop-blur-xl border border-dashed border-zinc-800/80 rounded-none shadow-lg">
          <div className="flex items-center gap-3.5">
            <div className="w-9 h-9 bg-white text-black flex items-center justify-center rounded-none font-bold text-lg shadow-[0_0_15px_rgba(255,255,255,0.2)]">
              t
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white hidden sm:block">
              trace<span className="text-zinc-500 font-normal">.ly</span>
            </h1>
          </div>

          <button
            onClick={() => socket.emit("end-room", roomId)}
            className="group flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-red-400 bg-red-500/10 border border-dashed border-red-500/20 rounded-none hover:bg-red-500 hover:text-white transition-all duration-300"
          >
            <span className="hidden sm:inline">End Session</span>
            <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </header>
      </div>

      {/* Main Content Area */}
      <main className="flex flex-1 overflow-hidden relative z-10 mt-3 lg:mt-0 lg:flex-row lg:gap-4">
        
        {/* Left/Background: Map Canvas */}
        <div className="absolute inset-0 lg:relative lg:flex-1 bg-zinc-900/50 border-none lg:border lg:border-dashed border-zinc-800/80 rounded-none overflow-hidden z-0 lg:z-10 shadow-inner">
          <Map users={users} myLocation={myLocation} />
          <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_40px_rgba(9,9,11,0.5)] z-[400]"></div>
        </div>

        {/* Right/Bottom: Sidebar (Draggable on Mobile) */}
        <motion.aside
          drag={isMobile ? "y" : false}
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={0.05}
          onDragEnd={handleDragEnd}
          animate={controls}
          initial={{ y: "calc(100% - 130px)" }}
          className={`
            flex flex-col
            absolute bottom-0 left-0 w-full z-50 bg-zinc-950/95 backdrop-blur-xl border-t border-zinc-800 shadow-[0_-20px_40px_rgba(0,0,0,0.6)]
            h-fit max-h-[calc(100dvh-100px)] rounded-t-[2rem] pb-5
            lg:relative lg:h-full lg:w-[360px] lg:bg-transparent lg:border-t-0 lg:rounded-none lg:shadow-none lg:z-auto lg:shrink-0 lg:pb-0
          `}
        >
          {/* Mobile Drag Handle */}
          <div 
            className="w-full flex justify-center pt-4 pb-2.5 lg:hidden cursor-pointer touch-none"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <div className="w-12 h-1.5 bg-zinc-700 rounded-full" />
          </div>

          {/* INTERNAL WRAPPER - Added 'flex-1' to stretch it down on desktop */}
          <div className="w-full flex-1 flex flex-col gap-2.5 lg:gap-4 px-4 lg:px-0 overflow-y-auto hide-scrollbar pb-2 lg:pb-0">
            
            <div className="bg-zinc-900 border border-dashed border-zinc-800/80 p-3.5 lg:p-5 rounded-none flex flex-col gap-2.5 lg:gap-3 shrink-0">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                  Room Identity
                </h2>
                <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex h-1.5 w-1.5 bg-emerald-500"></span>
                  </span>
                  <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">
                    {activeParticipants} Active
                  </span>
                </div>
              </div>
              <div className="bg-zinc-950 border border-dashed border-zinc-800 p-2.5 lg:p-3 font-mono text-zinc-300 text-sm tracking-widest text-center select-all">
                {roomId}
              </div>
            </div>

            <div className="bg-zinc-900 border border-dashed border-zinc-800/80 p-3.5 lg:p-5 rounded-none flex flex-col gap-2.5 lg:gap-3 shrink-0">
              <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Session Expires In
              </h2>
              <div className="bg-zinc-950 border border-dashed border-zinc-800 p-2.5 lg:p-3 flex justify-center items-center">
                <span className={`text-xl font-mono tracking-wider ${timeLeft === "00h 00m 00s" ? "text-red-500" : "text-zinc-200"}`}>
                  {timeLeft}
                </span>
              </div>
            </div>

            {/* QR CODE BLOCK - Flex-1 stretches it to bottom, text is vertically centered using my-auto */}
            <div className="bg-zinc-900 border border-dashed border-zinc-800/80 p-3.5 lg:p-5 rounded-none flex flex-col items-center flex-1 shrink-0">
              
              {/* V-Center Container for Desktop's extra space */}
              <div className="flex flex-col items-center justify-center my-auto">
                <div className="p-2.5 lg:p-3 bg-white border border-dashed border-zinc-300">
                  {/* Dynamic Size: Chota on Mobile, Bada on Desktop */}
                  <QRCodeCanvas id="qr-code" value={roomUrl || "https://trace.ly"} size={isMobile ? 140 : 180} />
                </div>
                
                <p className="text-[11px] font-medium text-zinc-500 uppercase tracking-widest mt-3 mb-3 lg:mt-4 lg:mb-0 flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  Scan to join session
                </p>
              </div>

              {/* Buttons forced to bottom */}
              <div className="flex gap-2.5 lg:gap-3 w-full mt-auto pt-3 lg:pt-5">
                <button
                  onClick={handleShare}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-white text-black py-2.5 px-3 rounded-none text-sm font-semibold hover:bg-zinc-200 transition-colors"
                >
                  {copied ? (
                    <>
                      <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                      Copied!
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                      Share
                    </>
                  )}
                </button>
                <button
                  onClick={downloadQR}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-zinc-800 text-white py-2.5 px-3 rounded-none text-sm font-semibold hover:bg-zinc-700 transition-colors border border-dashed border-zinc-700"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                  Download
                </button>
              </div>
            </div>
            
          </div>
        </motion.aside>

      </main>
      
      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  );
}