"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { configureLeafletIcons } from "@/lib/leaflet-setup";

export default function PropertyMap({
  latitude,
  longitude,
  address,
}: {
  latitude: number;
  longitude: number;
  address: string;
}) {
  useEffect(() => {
    configureLeafletIcons();
  }, []);

  return (
    <div className="overflow-hidden rounded-2xl" style={{ height: 240 }}>
      <MapContainer
        center={[latitude, longitude]}
        zoom={15}
        scrollWheelZoom={false}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[latitude, longitude]}>
          <Popup>{address}</Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}
