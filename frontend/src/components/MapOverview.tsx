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
    <div className="pointer-events-auto flex items-center bg-white/95 backdrop-blur-md shadow-xl rounded-full border border-[#92cce5]/30 h-10 overflow-hidden transition-all duration-500 ease-in-out" style={{ width: isPanelOpen ? 'max-content' : '130px' }}>
      
      {/* Label section (Clickable to toggle) */}
      <button 
        onClick={() => setIsPanelOpen(!isPanelOpen)}
        className="flex items-center justify-between gap-2 px-3 h-full bg-[#e1f1ee] hover:bg-[#92cce5]/30 border-r border-[#92cce5]/30 transition-colors shrink-0"
      >
        <div className="flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-[#233a77]" />
            <span className="font-bold text-xs text-[#233a77] whitespace-nowrap">Map Layers</span>
        </div>
        {isPanelOpen ? <ChevronLeft className="w-3.5 h-3.5 text-[#233a77]" /> : <ChevronRight className="w-3.5 h-3.5 text-[#233a77]" />}
      </button>

      {/* Layer Toggles */}
      <div className={`flex items-center gap-1.5 px-2 h-full overflow-hidden transition-all duration-300 ${isPanelOpen ? 'opacity-100 w-auto' : 'opacity-0 w-0 px-0'}`}>
        {layerOptions.map(item => (
          <button 
            key={item.id} 
            onClick={() => toggleLayer(item.id as keyof typeof layers)}
            className={`px-3 py-1 rounded-full text-[11px] font-bold flex items-center gap-1.5 border transition-all whitespace-nowrap ${
                layers[item.id] 
                ? 'bg-[#233a77] border-[#233a77] text-white shadow-sm' 
                : 'bg-transparent border-transparent text-gray-600 hover:bg-[#e1f1ee] hover:text-[#3f7ce0]'
            }`}
          >
            <div className={`w-2 h-2 rounded-full ${layers[item.id as keyof typeof layers] ? 'bg-[#92cce5]' : 'bg-gray-300'}`}></div>
            <span>{item.label}</span>
          </button>
        ))}
      </div>
      
    </div>
  );
}
