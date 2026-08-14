"use client";
import React, { useState, useRef, useMemo } from 'react';
import { CloudRain, Upload, X } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, CartesianGrid, Tooltip } from 'recharts';
import Papa from 'papaparse';

export default function RainfallDashboard({ setLayers, setAiSafeSpots }: any) {
  const [rainfallData, setRainfallData] = useState<any[] | null>(null);
  const [hoveredData, setHoveredData] = useState<any | null>(null);
  const [isSimulatingWflow, setIsSimulatingWflow] = useState(false);
  const [soilMoisture, setSoilMoisture] = useState("Normal");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const maxValues = useMemo(() => {
      if (!rainfallData) return { precip: 0, runoff: 0 };
      return {
          precip: Math.max(...rainfallData.map(d => d.precipitation || 0)),
          runoff: Math.max(...rainfallData.map(d => d.discharge || 0))
      };
  }, [rainfallData]);

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
        setRainfallData(result.data);
        if(setAiSafeSpots) setAiSafeSpots(result.safe_spots || []);
        if(setLayers) setLayers((prev: any) => ({ ...prev, floodDepth: true }));
      } else {
        alert("WFlow API Error: " + result.message);
      }
    } catch (e: any) {
      alert("Network Error: Could not reach the FastAPI server.");
    } finally {
      setIsSimulatingWflow(false);
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
          const formatted = results.data.map((row: any, i) => {
             const keys = Object.keys(row);
             return {
                time: row[keys[0]] ?? i,
                precipitation: row[keys[1]] ?? 0,
                discharge: 0
             };
          });
          setRainfallData(formatted);
        }
      });
    }
  };

  const clearData = () => {
      setRainfallData(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const loadSampleData = async () => {
      try {
          const response = await fetch('/data/sample_rainfall.csv');
          const csvData = await response.text();
          Papa.parse(csvData, {
              header: true,
              dynamicTyping: true,
              skipEmptyLines: true,
              complete: (results) => {
                  const formatted = results.data.map((row: any, i) => {
                      const keys = Object.keys(row);
                      return {
                          time: row[keys[0]] ?? i,
                          precipitation: row[keys[1]] ?? 0,
                          discharge: 0
                      };
                  });
                  setRainfallData(formatted);
              }
          });
      } catch (e) {
          alert("Could not load sample data.");
      }
  };

  return (
    <div className="bg-white border border-gray-300 shadow-sm w-full flex flex-col pointer-events-auto">
        
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b border-gray-200 bg-slate-900 text-white">
            <CloudRain className="w-5 h-5 text-slate-300" />
            <div>
                <h2 className="text-sm font-bold tracking-tight leading-none uppercase">Meteorology Setup</h2>
                <p className="text-xs text-slate-400 font-mono mt-1">Configure precipitation data</p>
            </div>
        </div>

        <div className="p-4">
            {!rainfallData ? (
                <div className="flex flex-col gap-3">
                    <input 
                        type="file" 
                        accept=".csv" 
                        onChange={handleFileUpload} 
                        className="hidden" 
                        ref={fileInputRef} 
                    />
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center justify-center gap-2 border border-slate-900 transition-colors"
                    >
                        <Upload className="w-4 h-4" /> Upload CSV
                    </button>
                    <div className="text-xs text-center font-bold text-gray-400 uppercase">OR</div>
                    <button 
                        onClick={loadSampleData}
                        className="w-full py-2 bg-white hover:bg-gray-50 text-slate-800 text-xs font-bold border border-gray-300 transition-colors"
                    >
                        Use Sample Data
                    </button>
                </div>
            ) : (
                <div className="flex flex-col gap-4">
                    <div className="bg-gray-50 p-3 border border-gray-200 relative">
                        <button onClick={clearData} className="absolute top-2 right-2 text-gray-400 hover:text-red-600 transition-colors">
                            <X className="w-4 h-4" />
                        </button>
                        
                        <div className="flex w-full justify-between items-end mb-4 pr-6 gap-2">
                            <div className="flex flex-col flex-1 items-start">
                                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">Duration</span>
                                <span className="text-sm font-black text-slate-800">{rainfallData.length} <span className="text-[10px] text-gray-500">hrs</span></span>
                            </div>
                            <div className="flex flex-col flex-1 items-center">
                                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">Peak Rain</span>
                                <span className="text-sm font-black text-blue-600">
                                    {hoveredData !== null ? hoveredData.precipitation : maxValues.precip}
                                    <span className="text-[10px] text-gray-500 ml-0.5">mm</span>
                                </span>
                            </div>
                            <div className="flex flex-col flex-1 items-end">
                                <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wide mb-1">Peak Runoff</span>
                                <span className="text-sm font-black text-amber-600">
                                    {hoveredData !== null ? hoveredData.discharge : maxValues.runoff}
                                    <span className="text-[10px] text-amber-600 ml-0.5">mm</span>
                                </span>
                            </div>
                        </div>
                        
                        <div className="h-32 w-full border border-gray-200 bg-white">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={rainfallData} onMouseMove={(e: any) => { if(e && e.activePayload) setHoveredData(e.activePayload[0].payload) }} onMouseLeave={() => setHoveredData(null)}>
                                    <defs>
                                        <linearGradient id="colorRain" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#2563eb" stopOpacity={0.8}/>
                                            <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                                        </linearGradient>
                                        <linearGradient id="colorRunoff" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#d97706" stopOpacity={0.8}/>
                                            <stop offset="95%" stopColor="#d97706" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="2 2" vertical={false} stroke="#e5e7eb" />
                                    <Tooltip contentStyle={{ fontSize: '10px', borderRadius: '0', padding: '6px', border: '1px solid #d1d5db', boxShadow: 'none' }} />
                                    <Area type="step" dataKey="precipitation" stroke="#1e40af" strokeWidth={1} fill="url(#colorRain)" />
                                    <Area type="monotone" dataKey="discharge" stroke="#b45309" strokeWidth={1} fill="url(#colorRunoff)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 bg-gray-50 p-2 border border-gray-200">
                        <span className="text-[10px] font-bold text-gray-600 uppercase px-1">Soil</span>
                        <select 
                            value={soilMoisture}
                            onChange={(e) => setSoilMoisture(e.target.value)}
                            className="flex-1 bg-white border border-gray-300 text-slate-800 text-xs font-bold block w-full p-1.5 focus:outline-none focus:border-slate-800"
                        >
                            <option value="Dry">Dry</option>
                            <option value="Normal">Normal</option>
                            <option value="Wet">Wet</option>
                        </select>
                    </div>

                    <button 
                        onClick={handleWflowSimulate}
                        disabled={isSimulatingWflow}
                        className={`w-full py-2.5 font-bold text-white text-xs border transition-colors flex items-center justify-center gap-2 ${isSimulatingWflow ? 'bg-gray-400 border-gray-500 cursor-not-allowed' : 'bg-slate-900 border-slate-900 hover:bg-slate-800'}`}
                    >
                        {isSimulatingWflow ? (
                            <>
                                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                Calculating...
                            </>
                        ) : (
                            "Generate Runoff"
                        )}
                    </button>
                </div>
            )}
        </div>
    </div>
  );
}
