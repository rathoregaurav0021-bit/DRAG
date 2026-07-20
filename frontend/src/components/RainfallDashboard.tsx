"use client";
import React, { useState, useRef } from 'react';
import { Layers, Map as MapIcon, Navigation, CloudRain, Upload, X, ChevronLeft, ChevronRight } from 'lucide-react';
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
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  
  // Mock layers for the GIS dashboard
  const [layers, setLayers] = useState({
    dem: true,
    lulc: false,
    roads: true,
    floodDepth: false,
    shelters: true
  });
  
  // Rainfall Data State
  const [rainfallData, setRainfallData] = useState<any[] | null>(null);
  const [hoveredRainfall, setHoveredRainfall] = useState<number | null>(null);
  const [isSimulatingWflow, setIsSimulatingWflow] = useState(false);
  const [soilMoisture, setSoilMoisture] = useState("Normal");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleWflowSimulate = async () => {
    if (!rainfallData) return;
    setIsSimulatingWflow(true);
    
    try {
      const csvString = Papa.unparse(rainfallData);
      const response = await fetch('/api/wflow/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csv_data: csvString, soil_moisture: soilMoisture })
      });
      
      const result = await response.json();
      if (result.status === 'success') {
        // Replace existing rainfall data with enriched Wflow data
        setRainfallData(result.data);
        // Success! Auto-toggle the Flood Depth layer so the user sees the physics instantly!
        setLayers(prev => ({ ...prev, floodDepth: true }));
        alert("Success! WFlow Engine generated the Surface Runoff data!");
      } else {
        console.error("Wflow error:", result.message);
        alert("WFlow API Error: " + result.message);
      }
    } catch (e: any) {
      console.error(e);
      alert("Network Error: Could not reach the FastAPI server. " + e.message);
    } finally {
      setIsSimulatingWflow(false);
      // Trigger parent onSimulate if needed for ANUGA later
      if (onSimulate) onSimulate();
    }
  };

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
        <div className="bg-white p-3 rounded-xl shadow-lg border border-gray-100 z-[1000]">
          <p className="font-semibold text-gray-700">Hour {label}</p>
          <p className="text-blue-600 font-bold">Rainfall: {payload[0].value} mm</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="relative flex h-full w-full bg-transparent overflow-hidden">
      {/* Interactive Leaflet Map (Base Layer) */}
      <div className="absolute inset-0 z-0 bg-slate-950" style={{ '--panel-offset': isPanelOpen ? '340px' : '90px' } as React.CSSProperties}>
        <LeafletMap layers={layers} hoveredRainfall={hoveredRainfall} />
      </div>

      {/* Rainfall Timeline Overlay */}
      {rainfallData && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-11/12 max-w-3xl bg-white border border-gray-100 shadow-[0_4px_24px_rgba(0,0,0,0.15)] rounded-2xl p-5 z-[400] transition-all animate-in slide-in-from-bottom-10 fade-in duration-500">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <CloudRain className="w-5 h-5 text-blue-600" />
              <h3 className="font-bold text-gray-900 text-sm tracking-wide">Storm Hyetograph (Rainfall Intensity)</h3>
            </div>
            {hoveredRainfall !== null && (
              <div className="text-xs font-bold text-blue-900 bg-blue-100 px-3 py-1.5 rounded-md shadow-sm border border-blue-200">
                 Target: {hoveredRainfall}mm
              </div>
            )}
          </div>
          <div className="h-36 w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={rainfallData} onMouseLeave={() => setHoveredRainfall(null)}>
                <defs>
                  <linearGradient id="colorRain" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorRunoff" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#059669" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#059669" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis 
                  dataKey="time" 
                  type="number"
                  domain={[0, 24]}
                  ticks={[0, 4, 8, 12, 16, 20, 24]}
                  tick={{fontSize: 12, fill: '#64748b', fontWeight: 500}} 
                  axisLine={false} 
                  tickLine={false} 
                />
                <YAxis tick={{fontSize: 12, fill: '#64748b', fontWeight: 500}} axisLine={false} tickLine={false} width={30} />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#94a3b8', strokeWidth: 1, strokeDasharray: '3 3' }} />
                <Area type="monotone" dataKey="precipitation" name="Rainfall (mm)" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#colorRain)" />
                <Area type="monotone" dataKey="discharge" name="Surface Runoff (mm)" stroke="#059669" strokeWidth={3} fillOpacity={1} fill="url(#colorRunoff)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Layer Toggles Toolbar (Bottom Left) */}
      <div className={`absolute left-6 bottom-10 z-[500] bg-white shadow-[0_4px_24px_rgba(0,0,0,0.15)] rounded-full border border-gray-100 transition-all duration-500 ease-in-out flex items-center overflow-hidden ${isPanelOpen ? 'max-w-fit px-2' : 'max-w-[52px] w-[52px]'}`} style={{ height: '52px' }}>
        
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

      {/* Actions Toolbar (Top Right) */}
      <div className="absolute right-6 top-6 z-[500] bg-white shadow-[0_4px_24px_rgba(0,0,0,0.15)] rounded-full border border-gray-100 px-3 py-2 flex items-center gap-3">
          
          {/* Soil Moisture Dropdown */}
          <div className="flex items-center gap-2 border-r border-gray-200 pr-3">
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Groundwater:</span>
            <select 
              value={soilMoisture}
              onChange={(e) => setSoilMoisture(e.target.value)}
              className="text-[13px] font-semibold text-gray-700 bg-gray-50 border border-gray-200 rounded-full px-3 py-1 outline-none hover:border-blue-300 focus:border-blue-500 transition-colors cursor-pointer"
            >
              <option value="Dry">Dry (AMC I)</option>
              <option value="Normal">Normal (AMC II)</option>
              <option value="Saturated">Saturated (AMC III)</option>
            </select>
          </div>

          {/* File Upload for Rainfall Dashboard */}
          <input 
             type="file" 
             accept=".csv" 
             className="hidden" 
             ref={fileInputRef} 
             onChange={handleFileUpload} 
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 rounded-full text-[13px] font-semibold flex items-center gap-2 border border-dashed border-gray-300 bg-gray-50 text-gray-600 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 transition-all"
            title="Upload CSV Hyetograph"
          >
            <Upload className="w-4 h-4" /> Upload CSV
          </button>
          
          {/* Simulate Button */}
          <button 
            onClick={handleWflowSimulate}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-full text-[13px] font-bold flex items-center gap-2 shadow-sm transform active:scale-95 transition-all"
          >
            {isSimulatingWflow || status === "Running Simulation..." ? (
              <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
            ) : <Navigation className="w-4 h-4" />}
            {isSimulatingWflow ? "Simulating..." : "Run AI Simulation"}
          </button>
      </div>
    </div>
  );
}
