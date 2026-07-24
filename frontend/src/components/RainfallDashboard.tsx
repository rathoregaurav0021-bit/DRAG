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
    <div className="pointer-events-auto bg-white/95 backdrop-blur-md p-5 rounded-2xl shadow-xl border border-[#92cce5]/30 max-w-[380px] w-full flex flex-col gap-4">
        
        {/* Header */}
        <div className="flex items-center gap-3">
            <div className="p-2 bg-[#e1f1ee] rounded-xl text-[#233a77]">
                <CloudRain className="w-5 h-5" />
            </div>
            <div>
                <h2 className="text-sm font-bold text-[#233a77] tracking-tight leading-none">Meteorology</h2>
                <p className="text-[10px] text-gray-500 font-medium mt-1">Configure precipitation data</p>
            </div>
        </div>

        {!rainfallData ? (
            <div className="flex flex-col gap-2 mt-1">
                <input 
                    type="file" 
                    accept=".csv" 
                    onChange={handleFileUpload} 
                    className="hidden" 
                    ref={fileInputRef} 
                />
                <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-2.5 bg-[#233a77] hover:bg-[#3f7ce0] text-white text-xs font-bold flex items-center justify-center gap-2 rounded-xl transition-all shadow-md"
                >
                    <Upload className="w-4 h-4" /> Upload CSV
                </button>
                <div className="text-[10px] text-center font-bold text-gray-300">OR</div>
                <button 
                    onClick={loadSampleData}
                    className="w-full py-2 bg-[#e1f1ee] hover:bg-[#92cce5]/30 text-[#233a77] text-xs font-bold rounded-xl transition-all"
                >
                    Use Sample Data
                </button>
            </div>
        ) : (
            <div className="flex flex-col gap-3 mt-1">
                <div className="bg-[#e1f1ee]/50 rounded-xl p-3 pb-2 border border-[#92cce5]/20 relative">
                    <button onClick={clearData} className="absolute top-1 right-1 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors">
                        <X className="w-3.5 h-3.5" />
                    </button>
                    
                    <div className="flex w-full justify-between items-end mb-2 pr-6 gap-2">
                        <div className="flex flex-col flex-1 items-start">
                            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wide mb-0.5 whitespace-nowrap">Duration</span>
                            <span className="text-sm font-black text-[#233a77]">{rainfallData.length} <span className="text-[10px] font-bold text-gray-500">hrs</span></span>
                        </div>
                        <div className="flex flex-col flex-1 items-center">
                            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wide mb-0.5 whitespace-nowrap">Peak Rain</span>
                            <span className="text-sm font-black text-[#3f7ce0]">
                                {hoveredData !== null ? hoveredData.precipitation : maxValues.precip}
                                <span className="text-[9px] text-gray-400 ml-0.5">mm</span>
                            </span>
                        </div>
                        <div className="flex flex-col flex-1 items-end">
                            <span className="text-[9px] font-bold text-[#eab308] uppercase tracking-wide mb-0.5 whitespace-nowrap">Peak Runoff</span>
                            <span className="text-sm font-black text-[#eab308]">
                                {hoveredData !== null ? hoveredData.discharge : maxValues.runoff}
                                <span className="text-[9px] text-gray-400 ml-0.5">mm</span>
                            </span>
                        </div>
                    </div>
                    
                    <div className="h-28 w-full mt-3">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={rainfallData} onMouseMove={(e: any) => { if(e && e.activePayload) setHoveredData(e.activePayload[0].payload) }} onMouseLeave={() => setHoveredData(null)}>
                                <defs>
                                    <linearGradient id="colorRain" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3f7ce0" stopOpacity={0.6}/>
                                        <stop offset="95%" stopColor="#3f7ce0" stopOpacity={0}/>
                                    </linearGradient>
                                    <linearGradient id="colorRunoff" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#eab308" stopOpacity={0.6}/>
                                        <stop offset="95%" stopColor="#eab308" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#92cce5" strokeOpacity={0.3} />
                                <Tooltip contentStyle={{ fontSize: '10px', borderRadius: '8px', padding: '4px', border: 'none', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }} />
                                <Area type="monotone" dataKey="precipitation" stroke="#233a77" strokeWidth={1.5} fill="url(#colorRain)" />
                                <Area type="monotone" dataKey="discharge" stroke="#eab308" strokeWidth={1.5} fill="url(#colorRunoff)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="flex items-center gap-3 bg-[#e1f1ee]/50 p-2 rounded-lg border border-[#92cce5]/20">
                    <span className="text-[10px] font-bold text-gray-500 uppercase px-1 whitespace-nowrap">Soil</span>
                    <select 
                        value={soilMoisture}
                        onChange={(e) => setSoilMoisture(e.target.value)}
                        className="flex-1 bg-white border border-[#92cce5]/50 text-[#233a77] text-xs font-bold rounded-lg block w-full p-1.5 focus:outline-none"
                    >
                        <option value="Dry">Dry</option>
                        <option value="Normal">Normal</option>
                        <option value="Wet">Wet</option>
                    </select>
                </div>

                <button 
                    onClick={handleWflowSimulate}
                    disabled={isSimulatingWflow}
                    className={`w-full py-2.5 rounded-xl font-bold text-white text-xs shadow-md transition-all flex items-center justify-center gap-2 ${isSimulatingWflow ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#233a77] hover:bg-[#3f7ce0]'}`}
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
  );
}
