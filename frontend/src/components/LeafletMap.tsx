"use client";
import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, ZoomControl } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icons in Leaflet with Next.js/Webpack
const icon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

export default function LeafletMap({ layers }: { layers: any }) {
  // Approximate center of Bhuragaon, Assam
  const bhuragaonPosition: [number, number] = [26.3, 92.3]; 

  useEffect(() => {
    // This forces a resize event when the map mounts to prevent the classic Leaflet "grey tile" rendering bug
    setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
    }, 100);
  }, []);

  return (
    <div className="w-full h-full absolute inset-0 z-0">
      <MapContainer 
        center={bhuragaonPosition} 
        zoom={12} 
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
      >
        <ZoomControl position="bottomright" />
        
        {/* Base Map Layer */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Conditional Layer: Shelters */}
        {layers.shelters && (
          <Marker position={bhuragaonPosition} icon={icon}>
            <Popup>
              <strong>Govt High School</strong> <br /> Designated Safe Shelter
            </Popup>
          </Marker>
        )}

        {/* Note: GeoJSON roads and DEM raster layers will be injected here in the future! */}
      </MapContainer>
    </div>
  );
}
