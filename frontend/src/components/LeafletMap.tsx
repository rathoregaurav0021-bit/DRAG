"use client";
import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, ZoomControl, GeoJSON, useMap, ImageOverlay, useMapEvents, Circle, Rectangle } from 'react-leaflet';
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

const PrecipitationHeatmap = ({ rainfall }: { rainfall: number | null }) => {
  const map = useMap();
  
  useEffect(() => {
    // Create a custom pane for the heatmap to guarantee it renders above ALL raster/vector layers
    if (!map.getPane('heatmapPane')) {
      map.createPane('heatmapPane');
      const pane = map.getPane('heatmapPane');
      if (pane) {
        pane.style.zIndex = '650';
        pane.style.pointerEvents = 'none';
      }
    }
  }, [map]);

  if (rainfall === null || rainfall === 0) return null;
  
  let color = 'transparent';
  let opacity = Math.min(0.8, 0.3 + (rainfall / 200));
  
  if (rainfall < 20) color = '#22c55e'; // Green
  else if (rainfall < 60) color = '#eab308'; // Yellow
  else if (rainfall < 100) color = '#f97316'; // Orange
  else color = '#ef4444'; // Red

  // Exact bounding box matching the Bhuragaon DEM Raster image
  const bounds: [number, number][] = [[26.322, 92.192], [26.421, 92.342]];

  return (
    <Rectangle 
       key={`heatmap-${rainfall}`}
       bounds={bounds} 
       pathOptions={{ fillColor: color, fillOpacity: opacity, stroke: false, pane: 'heatmapPane' }} 
    />
  );
};

const MapClickHandler = () => {
  const [clickPos, setClickPos] = useState<[number, number] | null>(null);
  useMapEvents({
    click(e) {
      setClickPos([e.latlng.lat, e.latlng.lng]);
    },
  });

  if (!clickPos) return null;

  return (
    <>
      <Circle 
        center={clickPos} 
        radius={2500} 
        pathOptions={{ fillColor: '#3b82f6', fillOpacity: 0.3, color: 'transparent', className: 'animate-pulse' }} 
      />
      <Circle 
        center={clickPos} 
        radius={1000} 
        pathOptions={{ fillColor: '#1e40af', fillOpacity: 0.6, color: 'transparent' }} 
      >
        <Popup>
           <strong className="text-blue-800">Simulated Rain Cell Epicenter</strong><br/>
           Coordinates: {clickPos[0].toFixed(4)}, {clickPos[1].toFixed(4)}
        </Popup>
      </Circle>
    </>
  );
};

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

export default function LeafletMap({ layers, hoveredRainfall }: { layers: any, hoveredRainfall?: number | null }) {
  // Exact center of Bhuragaon, Assam based on GeoJSON limits
  const bhuragaonPosition: [number, number] = [26.386, 92.302]; 
  
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
    <div className="h-full w-full relative z-0">
      {hoveredRainfall !== undefined && hoveredRainfall !== null && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-white/90 text-blue-600 px-6 py-2 rounded-full shadow-2xl font-bold z-[9999] border border-blue-200 pointer-events-none transition-all">
          Map Engine Received Rainfall: {hoveredRainfall} mm
        </div>
      )}
      <MapContainer 
        center={bhuragaonPosition} 
        zoom={13} 
        className="h-full w-full"
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

        {/* Dynamic Rainfall Click Overlay */}
        <MapClickHandler />

        {/* Global Precipitation Heatmap (Driven by Timeline Hover) */}
        <PrecipitationHeatmap rainfall={hoveredRainfall ?? null} />
      </MapContainer>
    </div>
  );
}
