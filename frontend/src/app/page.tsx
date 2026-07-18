"use client";
import React, { useState } from 'react';

export default function Home() {
  const [status, setStatus] = useState("Awaiting Simulation...");
  const [recommendation, setRecommendation] = useState("");

  const handleSimulate = async () => {
    setStatus("Running Simulation...");
    setRecommendation("");
    
    // Check backend health logic
    try {
        const res = await fetch('/api/health');
        if (res.ok) console.log("Backend Connected");
    } catch (e) {
        console.error("Backend offline", e);
    }

    // Simulate API call delay
    setTimeout(() => {
      setStatus("Simulation Complete");
      setRecommendation("Recommended Shelter: Govt High School (850m away). Evacuate via Market Road. Avoid River Embankment Road due to high flooding.");
    }, 2000);
  };

  return (
    <main className="flex h-screen flex-col bg-gray-50 overflow-hidden">
      {/* Premium Navbar */}
      <nav className="w-full h-16 bg-blue-700 text-white flex items-center justify-between px-8 shadow-md z-50 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white text-blue-700 rounded-xl flex items-center justify-center font-bold text-2xl shadow-inner">
            F
          </div>
          <h1 className="text-xl font-semibold tracking-wide">FloodShield</h1>
        </div>
        <button 
          onClick={handleSimulate}
          className="bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/30 px-6 py-2 rounded-full font-medium transition-all shadow-sm flex items-center gap-2"
        >
          {status === "Running Simulation..." ? (
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
          ) : null}
          {status === "Running Simulation..." ? "Simulating..." : "Run Simulation"}
        </button>
      </nav>

      {/* Main Content Area */}
      <div className="flex-1 relative flex">
        {/* Map Placeholder */}
        <div className="flex-1 bg-gradient-to-br from-blue-50 to-gray-200 flex flex-col items-center justify-center relative overflow-hidden">
          {/* Subtle Grid Background */}
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-400 via-gray-200 to-transparent"></div>
          
          <div className="z-10 bg-white/40 p-8 rounded-2xl backdrop-blur-md border border-white/50 shadow-sm text-center">
             <h2 className="text-3xl font-light text-gray-700 mb-4">Interactive Map View</h2>
             <p className="text-gray-500 text-sm max-w-md">The React-Leaflet component will render the Bhuragaon DEM, routing vectors, and flood depth rasters here.</p>
          </div>
        </div>

        {/* Glassmorphism Recommendation Panel */}
        <div className="absolute top-6 right-6 w-96 bg-white/70 backdrop-blur-xl border border-white shadow-[0_8px_30px_rgb(0,0,0,0.12)] rounded-3xl p-6 z-40 transition-all duration-300">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${status === "Running Simulation..." ? "bg-blue-500 animate-pulse" : recommendation ? "bg-green-500" : "bg-gray-300"}`}></span>
            AI Recommendations
          </h3>
          
          <div className="bg-gray-100/50 rounded-2xl p-5 border border-gray-200/50 min-h-[140px] flex flex-col justify-center transition-all duration-300">
            {recommendation ? (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <p className="text-green-700 font-semibold text-sm mb-3">Safe Route Found</p>
                <p className="text-gray-700 text-sm leading-relaxed">{recommendation}</p>
              </div>
            ) : (
              <p className="text-gray-400 text-sm text-center font-medium">{status}</p>
            )}
          </div>

          {recommendation && (
            <div className="mt-5 grid grid-cols-2 gap-4 animate-in zoom-in-95 duration-500">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 border border-blue-100 p-4 rounded-2xl shadow-sm">
                <p className="text-xs text-blue-500 font-bold uppercase tracking-wider mb-1">Evac Time</p>
                <p className="text-2xl font-bold text-blue-900">13 min</p>
              </div>
              <div className="bg-gradient-to-br from-orange-50 to-orange-100/50 border border-orange-100 p-4 rounded-2xl shadow-sm">
                <p className="text-xs text-orange-500 font-bold uppercase tracking-wider mb-1">Flood Arrival</p>
                <p className="text-2xl font-bold text-orange-900">42 min</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
