import React, { useState } from 'react';
import { Layers, ChevronRight, ChevronLeft } from 'lucide-react';

export default function MapOverview({ layers, setLayers }: any) {
  const [isPanelOpen, setIsPanelOpen] = useState(true);

  const toggleLayer = (layer: keyof typeof layers) => {
    setLayers((prev: any) => {
      return { ...prev, [layer]: !prev[layer] };
    });
  };

  const layerOptions = [
    { id: 'dem', label: 'DEM' },
    { id: 'lulc', label: 'World Cover' },
    { id: 'roads', label: 'Roads' },
    { id: 'buildings', label: 'Buildings' },
    { id: 'shelters', label: 'Shelters' },
    { id: 'prePeakFlood', label: 'Pre-Peak Flood' },
    { id: 'floodDepth', label: 'Peak Flood' }
  ];

  return (
    <div className="bg-white border border-gray-200 pointer-events-auto">
      <div className="flex items-center gap-2 p-3 border-b border-gray-200 bg-gray-50">
        <Layers className="w-5 h-5 text-gray-700" />
        <h2 className="font-bold text-sm text-gray-800">Active Map Layers</h2>
      </div>

      <div className="p-2 space-y-1">
        {layerOptions.map(item => (
          <button 
            key={item.id} 
            onClick={() => toggleLayer(item.id as keyof typeof layers)}
            className={`w-full flex items-center justify-between px-3 py-2 text-sm font-medium border transition-colors ${
                layers[item.id as keyof typeof layers] 
                ? 'bg-blue-50 border-blue-200 text-blue-800' 
                : 'bg-white border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-200'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 border ${layers[item.id as keyof typeof layers] ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-400'}`}></div>
              <span>{item.label}</span>
            </div>
            <span className="text-xs text-gray-400 font-mono">
              {layers[item.id as keyof typeof layers] ? 'ON' : 'OFF'}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
