"use client";

import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect } from "react";

if (typeof window !== "undefined") {
  // @ts-expect-error - _getIconUrl is not defined on the prototype
  delete L.Icon.Default.prototype._getIconUrl;

  L.Icon.Default.mergeOptions({
    iconRetinaUrl:
      "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",

    iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",

    shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
  });
}

interface UserLocation {
  id: string;
  latitude: number;
  longitude: number;
}

interface Props {
  users: Record<string, UserLocation>;
  myLocation: { latitude: number; longitude: number } | null;
}

function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();

  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);

  return null;
}

export default function Map({ users, myLocation }: Props) {
  const defaultCenter: [number, number] = myLocation
    ? [myLocation.latitude, myLocation.longitude]
    : [20, 77];

  return (
    <div style={{ height: "100%", width: "100%" }}>
      <MapContainer
        center={defaultCenter}
        zoom={15}
        style={{ height: "100%", width: "100%", background: "#18181b" }}
        zoomControl={false}
      >
        <TileLayer
          attribution="&copy; OpenStreetMap"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {myLocation && (
          <MapUpdater center={[myLocation.latitude, myLocation.longitude]} />
        )}

        {myLocation && (
          <Marker position={[myLocation.latitude, myLocation.longitude]}>
            <Popup>You</Popup>
          </Marker>
        )}

        {Object.values(users).map((user) => (
          <Marker key={user.id} position={[user.latitude, user.longitude]}>
            <Popup>User: {user.id}</Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
