"use client";
import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, ZoomControl, GeoJSON, useMap, ImageOverlay } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import parseGeoraster from 'georaster';
import GeoRasterLayer from 'georaster-layer-for-leaflet';

// Fix for default marker icons in Leaflet with Next.js/Webpack
const icon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const RasterLayer = ({ url, options }: { url: string; options?: any }) => {
  const map = useMap();
  useEffect(() => {
    let layer: any;
    let isMounted = true;
    
    fetch(url)
      .then((response) => response.arrayBuffer())
      .then((arrayBuffer) => parseGeoraster(arrayBuffer))
      .then((georaster) => {
        if (!isMounted) return; // Prevent "ghost layers" if unchecked quickly
        
        layer = new GeoRasterLayer({
          georaster: georaster,
          opacity: 0.7,
          resolution: 256,
          ...options
        });
        layer.addTo(map);
      })
      .catch(err => console.error("Raster load error:", err));
      
    return () => {
      isMounted = false;
      if (layer && map.hasLayer(layer)) {
        map.removeLayer(layer);
      }
    };
  }, [map, url, options]);
  return null;
};

export default function LeafletMap({ layers }: { layers: any }) {
  // Approximate center of Bhuragaon, Assam
  const bhuragaonPosition: [number, number] = [26.26, 92.22]; 
  
  const [roadsData, setRoadsData] = useState(null);
  const [sheltersData, setSheltersData] = useState(null);

  useEffect(() => {
    // Fetch Vector Data
    fetch('/data/roads.geojson').then(r => r.json()).then(setRoadsData).catch(e => console.error("Roads error", e));
    fetch('/data/shelters.geojson').then(r => r.json()).then(setSheltersData).catch(e => console.error("Shelters error", e));
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

        {/* Raster Layer: DEM */}
        {layers.dem && (
          <RasterLayer url="/data/dem.tif" options={{ opacity: 0.5 }} />
        )}

        {/* Raster Layer: Land Use / Land Cover (ESA WorldCover) */}
        {layers.floodDepth && ( // Temporarily mapping floodDepth toggle to LULC for visualization
          <ImageOverlay 
            url="/data/lulc_color.png" 
            bounds={[[26.302083333333332, 92.172], [26.441333333333333, 92.36266666666667]]}
            opacity={0.55}
          />
        )}

        {/* Vector Layer: Roads */}
        {layers.roads && roadsData && (
          <GeoJSON 
            data={roadsData} 
            style={{ color: '#555', weight: 2, opacity: 0.8 }} 
          />
        )}

        {/* Vector Layer: Shelters */}
        {layers.shelters && sheltersData && (
          <GeoJSON 
            data={sheltersData} 
            pointToLayer={(feature, latlng) => {
              return L.marker(latlng, { icon }).bindPopup(`<strong>Safe Shelter</strong><br/>${feature.properties.name || "Unknown Area"}`);
            }} 
          />
        )}
      </MapContainer>
    </div>
  );
}
