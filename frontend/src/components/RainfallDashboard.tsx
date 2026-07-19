"use client";
import React, { useState, useRef } from 'react';
import { Layers, Map as MapIcon, Navigation, CloudRain, Upload, X } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import Papa from 'papaparse';
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

export default function RainfallDashboard({ status, recommendation, onSimulate }: any) {
  // Mock layers for the GIS dashboard
  const [layers, setLayers] = useState({
    dem: true,
    roads: true,
    floodDepth: false,
    shelters: true
  });
  
  // Rainfall Data State
  const [rainfallData, setRainfallData] = useState<any[] | null>(null);
  const [hoveredRainfall, setHoveredRainfall] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      Papa.parse(file, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: (results) => {
          // Map dynamic CSV headers to standard 'time' and 'precipitation' keys for the chart
          const formatted = results.data.map((row: any, i) => {
             const keys = Object.keys(row);
             return {
                time: row[keys[0]] ?? i,
                precipitation: row[keys[1]] ?? 0
             };
          });
          setRainfallData(formatted);
        }
      });
    }
  };

  const toggleLayer = (layer: keyof typeof layers) => {
    setLayers(prev => ({ ...prev, [layer]: !prev[layer] }));
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    React.useEffect(() => {
      if (active && payload && payload.length) {
        setHoveredRainfall(payload[0].payload.precipitation);
      } else if (!active) {
        setHoveredRainfall(null);
      }
    }, [active, payload]);

    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-xl shadow-lg border border-gray-100 z-50">
          <p className="font-semibold text-gray-700">Hour {label}</p>
          <p className="text-blue-600 font-bold">Rainfall: {payload[0].value} mm</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex h-full w-full bg-gray-50 overflow-hidden">
      {/* Map Area (Main Content) */}
      <div className="flex-1 relative flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-gray-200">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-400 via-gray-200 to-transparent"></div>
        
        {/* Interactive Leaflet Map */}
        <LeafletMap layers={layers} hoveredRainfall={hoveredRainfall} />

        {/* Rainfall Timeline Overlay */}
        {rainfallData && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-11/12 max-w-3xl bg-white/90 backdrop-blur-md border border-white/40 shadow-xl rounded-2xl p-4 z-[400] transition-all animate-in slide-in-from-bottom-10 fade-in duration-500">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <CloudRain className="w-5 h-5 text-blue-500" />
                <h3 className="font-semibold text-gray-800 text-sm">Storm Hyetograph (Rainfall Intensity)</h3>
              </div>
              {hoveredRainfall !== null && (
                <div className="text-xs font-bold text-red-500 bg-red-50 px-2 py-1 rounded">
                   Target: {hoveredRainfall}mm
                </div>
              )}
            </div>
            <div className="h-32 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={rainfallData} onMouseLeave={() => setHoveredRainfall(null)}>
                  <defs>
                    <linearGradient id="colorRain" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="time" 
                    type="number"
                    domain={[0, 24]}
                    ticks={[0, 4, 8, 12, 16, 20, 24]}
                    tick={{fontSize: 12, fill: '#6b7280'}} 
                    axisLine={false} 
                    tickLine={false} 
                  />
                  <YAxis tick={{fontSize: 12, fill: '#6b7280'}} axisLine={false} tickLine={false} width={30} />
                  <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#9ca3af', strokeWidth: 1, strokeDasharray: '3 3' }} />
                  <Area type="monotone" dataKey="precipitation" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#colorRain)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

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
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Meteorological Data</h4>
            <input 
               type="file" 
               accept=".csv" 
               className="hidden" 
               ref={fileInputRef} 
               onChange={handleFileUpload} 
            />
            <button 
               onClick={() => fileInputRef.current?.click()}
               className="w-full flex items-center justify-center gap-2 py-2 px-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
            >
               <Upload className="w-4 h-4 text-gray-500" />
               {rainfallData ? "Change Rainfall CSV" : "Upload Rainfall CSV"}
            </button>
            {rainfallData && (
              <div className="flex items-center justify-between text-xs text-blue-700 bg-blue-50 p-2.5 rounded-lg border border-blue-200 shadow-sm animate-in fade-in">
                <span className="flex items-center gap-1.5 font-medium"><CloudRain className="w-3.5 h-3.5" /> CSV Loaded Successfully</span>
                <button onClick={() => setRainfallData(null)}><X className="w-4 h-4 hover:text-red-500 transition-colors" /></button>
              </div>
            )}
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
