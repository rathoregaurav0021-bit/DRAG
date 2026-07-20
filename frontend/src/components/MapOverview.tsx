import React, { useState } from 'react';
import { Layers, Map as MapIcon, Navigation, ChevronLeft, ChevronRight } from 'lucide-react';
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
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  
  // Mock layers for the GIS dashboard
  const [layers, setLayers] = useState({
    dem: true,
    lulc: false,
    roads: true,
    floodDepth: false,
    shelters: true
  });

  const toggleLayer = (layer: keyof typeof layers) => {
    setLayers(prev => ({ ...prev, [layer]: !prev[layer] }));
  };

  return (
    <div className="relative flex h-full w-full bg-transparent overflow-hidden">
      {/* Interactive Leaflet Map (Base Layer) */}
      <div className="absolute inset-0 z-0 bg-slate-950" style={{ '--panel-offset': isPanelOpen ? '340px' : '90px' } as React.CSSProperties}>
        <LeafletMap layers={layers} />
      </div>

      {/* Floating Toolbar (Bottom Left) - Horizontal Unfold */}
      <div className={`absolute left-6 bottom-10 z-[500] bg-white shadow-[0_4px_24px_rgba(0,0,0,0.15)] rounded-full border border-gray-100 transition-all duration-500 ease-in-out flex items-center overflow-hidden ${isPanelOpen ? 'max-w-[800px] w-max' : 'max-w-[52px] w-[52px]'}`} style={{ height: '52px' }}>
        
        {/* Toggle Button */}
        <button 
          onClick={() => setIsPanelOpen(!isPanelOpen)}
          className="flex-shrink-0 w-[52px] h-[52px] flex items-center justify-center text-gray-600 hover:text-blue-600 hover:bg-gray-50 transition-colors rounded-full"
          title="Toggle Layers"
        >
          {isPanelOpen ? <ChevronLeft className="w-5 h-5" /> : <Layers className="w-6 h-6" />}
        </button>

        {/* Toolbar Content */}
        <div className={`flex items-center gap-2 whitespace-nowrap transition-opacity duration-300 pr-2 ${isPanelOpen ? 'opacity-100 delay-100' : 'opacity-0 pointer-events-none'}`}>
          <div className="w-px h-6 bg-gray-200 mx-1"></div>
          
          {/* Layer Toggles */}
          {[
            { id: 'dem', label: 'DEM' },
            { id: 'lulc', label: 'World Cover' },
            { id: 'roads', label: 'Roads' },
            { id: 'shelters', label: 'Shelters' },
            { id: 'floodDepth', label: 'Flood Depth' }
          ].map(item => (
            <button 
              key={item.id} 
              onClick={() => toggleLayer(item.id as keyof typeof layers)}
              className={`px-3 py-1.5 rounded-full text-[13px] font-semibold flex items-center gap-2 border transition-all ${layers[item.id as keyof typeof layers] ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-transparent border-transparent text-gray-600 hover:bg-gray-100 hover:border-gray-200'}`}
            >
              <div className={`w-2 h-2 rounded-full ${layers[item.id as keyof typeof layers] ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
