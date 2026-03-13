"use client";

import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  Polyline,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect, useState, useRef } from "react";

const stringToColor = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++)
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  const c = (hash & 0x00ffffff).toString(16).toUpperCase();
  return "#" + "00000".substring(0, 6 - c.length) + c;
};

const createColoredIcon = (color: string) => {
  return L.divIcon({
    className: "custom-pin",
    html: `<div style="background-color: ${color}; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.5); transition: background-color 0.3s;"></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
};

interface UserLocation {
  id: string;
  username?: string;
  latitude: number;
  longitude: number;
  path?: [number, number][];
  isOffline?: boolean;
}

interface Props {
  users: Record<string, UserLocation>;
  myLocation: {
    latitude: number;
    longitude: number;
    path?: [number, number][];
  } | null;
}

function LerpMarker({
  position,
  icon,
  children,
}: {
  position: [number, number];
  icon: L.DivIcon | L.Icon;
  children?: React.ReactNode;
}) {
  const markerRef = useRef<L.Marker>(null);

  useEffect(() => {
    if (!markerRef.current) return;
    let animationFrame: number;
    let currentLat = markerRef.current.getLatLng().lat;
    let currentLng = markerRef.current.getLatLng().lng;

    const animate = () => {
      const [targetLat, targetLng] = position;
      currentLat += (targetLat - currentLat) * 0.1;
      currentLng += (targetLng - currentLng) * 0.1;

      markerRef.current?.setLatLng([currentLat, currentLng]);

      if (
        Math.abs(targetLat - currentLat) > 0.00001 ||
        Math.abs(targetLng - currentLng) > 0.00001
      ) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [position]);

  return (
    <Marker ref={markerRef} position={position} icon={icon}>
      {children}
    </Marker>
  );
}

function MapUpdater({
  center,
  isAutoFollow,
}: {
  center: [number, number];
  isAutoFollow: boolean;
}) {
  const map = useMap();
  const isInitialRender = useRef(true);

  useEffect(() => {
    if (isAutoFollow) {
      if (isInitialRender.current) {
        map.setView(center, map.getZoom());
        isInitialRender.current = false;
      } else {
        const currentCenter = map.getCenter();
        const dist = map.distance(currentCenter, center);
        if (dist > 100) {
          map.flyTo(center, map.getZoom(), { duration: 1.5 });
        }
      }
    }
  }, [center, map, isAutoFollow]);

  useEffect(() => {
    map.on("dragstart", () =>
      map.getContainer().dispatchEvent(new CustomEvent("mapDragged")),
    );
  }, [map]);
  return null;
}

export default function Map({ users, myLocation }: Props) {
  const [isAutoFollow, setIsAutoFollow] = useState(true);
  const defaultCenter: [number, number] = myLocation
    ? [myLocation.latitude, myLocation.longitude]
    : [20, 77];

  useEffect(() => {
    const handleDrag = () => setIsAutoFollow(false);
    document.addEventListener("mapDragged", handleDrag);
    return () => document.removeEventListener("mapDragged", handleDrag);
  }, []);

  return (
    <div style={{ height: "100%", width: "100%", position: "relative" }}>
      {!isAutoFollow && (
        <button
          onClick={() => setIsAutoFollow(true)}
          className="absolute top-4 left-1/2 transform -translate-x-1/2 z-[400] bg-white text-black px-4 py-2 rounded-full text-sm font-semibold shadow-md"
        >
          Resume Auto-Follow
        </button>
      )}
      <MapContainer
        center={defaultCenter}
        zoom={15}
        style={{ height: "100%", width: "100%", background: "#18181b" }}
        zoomControl={false}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        {myLocation && (
          <MapUpdater
            center={[myLocation.latitude, myLocation.longitude]}
            isAutoFollow={isAutoFollow}
          />
        )}

        {myLocation && myLocation.path && myLocation.path.length > 1 && (
          <Polyline
            positions={myLocation.path}
            pathOptions={{
              color: "#3b82f6",
              weight: 4,
              opacity: 0.6,
              dashArray: "8, 8",
              lineCap: "round",
              lineJoin: "round",
            }}
          />
        )}

        {Object.values(users).map((user) => {
          if (!user.path || user.path.length < 2) return null;
          const displayName = user.username || user.id.substring(0, 5);
          const color = user.isOffline ? "#6b7280" : stringToColor(displayName);
          return (
            <Polyline
              key={`path-${user.id}`}
              positions={user.path}
              pathOptions={{
                color,
                weight: 4,
                opacity: 0.6,
                lineCap: "round",
                lineJoin: "round",
              }}
            />
          );
        })}

        {myLocation && (
          <LerpMarker
            position={[myLocation.latitude, myLocation.longitude]}
            icon={createColoredIcon("#3b82f6")}
          >
            <Popup>
              <strong>You</strong>
            </Popup>
          </LerpMarker>
        )}

        {Object.values(users).map((user) => {
          const displayName = user.username || user.id.substring(0, 5);
          const color = user.isOffline ? "#6b7280" : stringToColor(displayName);
          return (
            <LerpMarker
              key={user.id}
              position={[user.latitude, user.longitude]}
              icon={createColoredIcon(color)}
            >
              <Popup>
                <strong>{displayName}</strong> <br />
                <span
                  className={`text-xs font-semibold ${user.isOffline ? "text-amber-500 animate-pulse" : "text-emerald-500"}`}
                >
                  {user.isOffline ? "Reconnecting..." : "Active"}
                </span>
              </Popup>
            </LerpMarker>
          );
        })}
      </MapContainer>
    </div>
  );
}
