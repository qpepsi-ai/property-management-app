"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { configureLeafletIcons } from "@/lib/leaflet-setup";
import Link from "next/link";

type Property = {
  id: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
};

function FitBounds({ points }: { points: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 0) return;
    if (points.length === 1) {
      map.setView(points[0], 15);
    } else {
      map.fitBounds(points, { padding: [24, 24] });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, JSON.stringify(points)]);
  return null;
}

export default function PortfolioMap({ properties }: { properties: Property[] }) {
  useEffect(() => {
    configureLeafletIcons();
  }, []);

  const located = properties.filter(
    (p): p is Property & { latitude: number; longitude: number } =>
      p.latitude !== null && p.longitude !== null,
  );

  if (located.length === 0) return null;

  const points: [number, number][] = located.map((p) => [p.latitude, p.longitude]);

  return (
    <div className="isolate overflow-hidden rounded-2xl" style={{ height: 280 }}>
      <MapContainer
        center={points[0]}
        zoom={12}
        scrollWheelZoom={false}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds points={points} />
        {located.map((p) => (
          <Marker key={p.id} position={[p.latitude, p.longitude]}>
            <Popup>
              <Link href={`/properties/${p.id}`}>{p.address}</Link>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
