"use client";
import React, { useState } from 'react';
import { LayoutDashboard, History, Settings, LogOut, CloudRain, ChevronLeft, ChevronRight } from 'lucide-react';
import MapOverview from '@/components/MapOverview';
import RainfallDashboard from '@/components/RainfallDashboard';

export default function Home() {
  const [activeTab, setActiveTab] = useState('overview');
  const [status, setStatus] = useState("Awaiting Simulation...");
  const [recommendation, setRecommendation] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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
      // In the future, this will automatically toggle the 'floodDepth' layer in MapOverview
    }, 2000);
  };

  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'meteorology', label: 'Rainfall Setup', icon: CloudRain },
    { id: 'simulations', label: 'Simulations', icon: History },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <main className="flex h-screen w-full bg-gray-100 overflow-hidden font-sans">
      
      {/* Sidebar Navigation */}
      <aside className={`transition-all duration-300 ${isSidebarOpen ? 'w-64' : 'w-20'} bg-slate-900 text-slate-300 flex flex-col shrink-0 z-50 relative`}>
        {/* Toggle Button */}
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="absolute -right-3 top-6 bg-blue-600 text-white rounded-full p-1 shadow-md z-50 hover:bg-blue-700 transition-colors border-2 border-slate-900"
        >
          {isSidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>

        {/* Logo Area */}
        <div className={`h-16 flex items-center ${isSidebarOpen ? 'px-6' : 'justify-center'} bg-slate-950 border-b border-slate-800`}>
          <div className="w-8 h-8 bg-blue-500 text-white rounded-lg flex items-center justify-center font-bold text-xl shadow-inner shrink-0">
            F
          </div>
          {isSidebarOpen && <h1 className="text-lg font-bold text-white tracking-wide ml-3 whitespace-nowrap">FloodShield</h1>}
        </div>

        {/* Navigation Links */}
        <div className="flex-1 py-6 px-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center ${isSidebarOpen ? 'px-4' : 'justify-center'} py-3 rounded-xl transition-all duration-200 ${
                  isActive 
                    ? 'bg-blue-600 text-white shadow-md' 
                    : 'hover:bg-slate-800 hover:text-white'
                }`}
                title={!isSidebarOpen ? item.label : undefined}
              >
                <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                {isSidebarOpen && <span className="font-medium text-sm ml-3 whitespace-nowrap">{item.label}</span>}
              </button>
            );
          })}
        </div>

        <div className="p-4 border-t border-slate-800">
          <button 
            className={`w-full flex items-center ${isSidebarOpen ? 'px-4' : 'justify-center'} py-3 rounded-xl hover:bg-slate-800 transition-colors text-slate-400 hover:text-white`}
            title={!isSidebarOpen ? "Sign Out" : undefined}
          >
            <LogOut className="w-5 h-5 shrink-0" />
            {isSidebarOpen && <span className="font-medium text-sm ml-3 whitespace-nowrap">Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <section className="flex-1 flex flex-col relative overflow-hidden">
        {/* Top Header Bar */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 shrink-0 z-30 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800 capitalize">{activeTab} Dashboard</h2>
          <div className="flex items-center gap-4">
             <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center border border-blue-200 shadow-sm">
                <span className="text-blue-700 font-bold text-xs">U</span>
             </div>
          </div>
        </header>

        {/* Dynamic Content Views */}
        <div className="flex-1 relative overflow-hidden">
          {activeTab === 'overview' && (
             <MapOverview 
                status={status} 
                recommendation={recommendation} 
                onSimulate={handleSimulate} 
             />
          )}

          {activeTab === 'meteorology' && (
             <RainfallDashboard 
                status={status} 
                recommendation={recommendation} 
                onSimulate={handleSimulate} 
             />
          )}
          
          {activeTab === 'simulations' && (
             <div className="p-8 flex items-center justify-center h-full bg-gray-50">
                <div className="text-center text-gray-400">
                    <History className="w-16 h-16 mx-auto mb-4 opacity-30" />
                    <h3 className="text-xl font-medium text-gray-600">Simulation History</h3>
                    <p className="mt-2 text-sm">Past ANUGA flood simulations will appear here.</p>
                </div>
             </div>
          )}

          {activeTab === 'settings' && (
             <div className="p-8 flex items-center justify-center h-full bg-gray-50">
                <div className="text-center text-gray-400">
                    <Settings className="w-16 h-16 mx-auto mb-4 opacity-30" />
                    <h3 className="text-xl font-medium text-gray-600">Project Settings</h3>
                    <p className="mt-2 text-sm">Configure API keys, API proxy targets, and database connections.</p>
                </div>
             </div>
          )}
        </div>
      </section>

    </main>
  );
}
