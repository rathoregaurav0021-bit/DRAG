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
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition-all mb-2 ${
                layers[item.id as keyof typeof layers] 
                ? 'bg-slate-900 text-white shadow-md' 
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200 shadow-sm'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-4 h-4 rounded-sm border-2 flex items-center justify-center transition-colors ${layers[item.id as keyof typeof layers] ? 'bg-blue-500 border-blue-500' : 'bg-transparent border-slate-400'}`}>
                 {layers[item.id as keyof typeof layers] && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
              </div>
              <span>{item.label}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
