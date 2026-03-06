"use client";

import { useEffect, useState } from "react";
import { motion, useAnimation, PanInfo } from "framer-motion";
import RoomIdentity from "./RoomIdentity";
import RoomTimer from "./RoomTimer";
import QRPanel from "./QRPanel";
import { useMobile } from "@/hooks/useMobile";

interface RoomSidebarProps {
  roomId: string;
  expiryTime: number | null;
  activeParticipants: number;
}

export default function RoomSidebar({
  roomId,
  expiryTime,
  activeParticipants,
}: RoomSidebarProps) {
  const controls = useAnimation();
  const [isExpanded, setIsExpanded] = useState(false);
  const isMobile = useMobile();

  useEffect(() => {
    if (!isMobile) {
      controls.start({ y: 0 });
    } else {
      controls.start({ y: isExpanded ? 0 : "calc(100% - 130px)" });
    }
  }, [isMobile, isExpanded, controls]);

  const handleDragEnd = (
    event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo,
  ) => {
    if (!isMobile) return;
    const swipeThreshold = 50;

    if (info.offset.y < -swipeThreshold || info.velocity.y < -500) {
      setIsExpanded(true);
    } else if (info.offset.y > swipeThreshold || info.velocity.y > 500) {
      setIsExpanded(false);
    } else {
      controls.start({ y: isExpanded ? 0 : "calc(100% - 130px)" });
    }
  };

  return (
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
        h-fit max-h-[calc(100dvh-100px)] rounded-t-4xl pb-5
        lg:relative lg:h-full lg:w-90 lg:bg-transparent lg:border-t-0 lg:rounded-none lg:shadow-none lg:z-auto lg:shrink-0 lg:pb-0
      `}
    >
      <div
        className="w-full flex justify-center pt-4 pb-2.5 lg:hidden cursor-pointer touch-none"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="w-12 h-1.5 bg-zinc-700 rounded-full" />
      </div>

      <div className="w-full flex-1 flex flex-col gap-2.5 lg:gap-4 px-4 lg:px-0 overflow-y-auto hide-scrollbar pb-2 lg:pb-0">
        <RoomIdentity roomId={roomId} activeParticipants={activeParticipants} />
        <RoomTimer expiryTime={expiryTime} roomId={roomId} />
        <QRPanel roomId={roomId} isMobile={isMobile} />
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `,
        }}
      />
    </motion.aside>
  );
}
