import React, { useState } from 'react';
import { Layers, Map as MapIcon, Navigation } from 'lucide-react';
import dynamic from 'next/dynamic';

const LeafletMap = dynamic(() => import('@/components/LeafletMap'), { 
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-gray-200 z-10 absolute inset-0">
        <MapIcon className="w-10 h-10 text-blue-400 mb-3 animate-pulse" />
        <p className="text-gray-500 font-medium">Initializing Map Engine...</p>
      </div>
    )
});

export default function MapOverview({ status, recommendation, onSimulate }: any) {
  // Mock layers for the GIS dashboard (we will connect these to real Leaflet layers later)
  const [layers, setLayers] = useState({
    dem: true,
    roads: true,
    floodDepth: false,
    shelters: true
  });

  const toggleLayer = (layer: keyof typeof layers) => {
    setLayers(prev => ({ ...prev, [layer]: !prev[layer] }));
  };

  return (
    <div className="flex h-full w-full bg-gray-50 overflow-hidden">
      {/* Map Area (Main Content) */}
      <div className="flex-1 relative flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-gray-200">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-400 via-gray-200 to-transparent"></div>
        
        {/* Interactive Leaflet Map */}
        <LeafletMap layers={layers} />

      </div>

      {/* QGIS-Style Layer Control Panel (Right Sidebar) */}
      <div className="w-72 bg-white border-l border-gray-200 shadow-sm flex flex-col shrink-0 z-20">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2">
          <Layers className="w-5 h-5 text-gray-600" />
          <h3 className="font-semibold text-gray-800">Map Layers</h3>
        </div>
        
        <div className="p-4 flex-1 overflow-y-auto space-y-4">
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Base Topography</h4>
            <label className="flex items-center gap-3 cursor-pointer group">
              <input type="checkbox" checked={layers.dem} onChange={() => toggleLayer('dem')} className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-gray-300" />
              <span className="text-sm text-gray-700 group-hover:text-blue-600 transition-colors">DEM (Bhuragaon)</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer group">
              <input type="checkbox" checked={layers.roads} onChange={() => toggleLayer('roads')} className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-gray-300" />
              <span className="text-sm text-gray-700 group-hover:text-blue-600 transition-colors">OSM Road Network</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer group">
              <input type="checkbox" checked={layers.shelters} onChange={() => toggleLayer('shelters')} className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-gray-300" />
              <span className="text-sm text-gray-700 group-hover:text-blue-600 transition-colors">Safe Shelters</span>
            </label>
          </div>
          
          <div className="pt-4 border-t border-gray-100 space-y-3">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Simulation Outputs</h4>
            <label className="flex items-center gap-3 cursor-pointer group">
              <input type="checkbox" checked={layers.floodDepth} onChange={() => toggleLayer('floodDepth')} className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-gray-300" />
              <span className="text-sm text-gray-700 group-hover:text-blue-600 transition-colors">Flood Depth Raster</span>
            </label>
          </div>
        </div>

        {/* Action Bottom */}
        <div className="p-4 border-t border-gray-100 bg-gray-50/50">
          <button 
            onClick={onSimulate}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl font-medium transition-colors shadow-sm flex justify-center items-center gap-2"
          >
            {status === "Running Simulation..." ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : <Navigation className="w-4 h-4" />}
            {status === "Running Simulation..." ? "Simulating..." : "Run AI Simulation"}
          </button>
        </div>
      </div>
    </div>
  );
}
