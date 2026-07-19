"use client";
import React, { useState } from 'react';
import { LayoutDashboard, History, Settings, LogOut, CloudRain, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import MapOverview from '@/components/MapOverview';
import RainfallDashboard from '@/components/RainfallDashboard';

const CustomFloodIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* House Body */}
    <path d="M15 3l7 6v6H10V9l5-6z" fill="currentColor" />
    {/* House Window */}
    <rect x="14.5" y="9" width="3.5" height="3.5" rx="1" fill="white" />
    {/* Circle Outline to cut out house */}
    <circle cx="8.5" cy="9" r="6" fill="white" />
    {/* Dark Circle */}
    <circle cx="8.5" cy="9" r="5" fill="currentColor" />
    {/* Arrow */}
    <path d="M5.5 9h5m-2-2l2 2-2 2" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    {/* Waves */}
    <path d="M2 17.5 q 1.66 -1.5, 3.33 0 t 3.33 0 t 3.33 0 t 3.33 0 t 3.33 0 t 3.33 0" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M2 21.5 q 1.66 -1.5, 3.33 0 t 3.33 0 t 3.33 0 t 3.33 0 t 3.33 0 t 3.33 0" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export default function Home() {
  const [activeTab, setActiveTab] = useState('overview');
  const [status, setStatus] = useState("Awaiting Simulation...");
  const [recommendation, setRecommendation] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isTopMenuOpen, setIsTopMenuOpen] = useState(false);

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
    <main className="flex h-screen w-full bg-white overflow-hidden font-sans text-slate-800">
      
      {/* Thin White Sidebar (Google Maps Style) */}
      <aside className="w-[72px] bg-white border-r border-gray-200 flex flex-col items-center shrink-0 z-50 shadow-sm py-4 relative">

        {/* Navigation Links */}
        <div className="flex flex-col items-center gap-5 flex-1 w-full">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <div key={item.id} className="relative group flex flex-col items-center">
                <button
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center justify-center w-12 h-12 rounded-full transition-all duration-200 ${
                    isActive 
                      ? 'bg-blue-50 text-blue-600 shadow-sm' 
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-blue-600' : 'text-gray-500 group-hover:text-gray-900'}`} strokeWidth={isActive ? 2.5 : 2} />
                </button>
                
                {/* Custom Tooltip */}
                <div className="absolute left-full top-6 -translate-y-1/2 ml-3 px-2.5 py-1 bg-gray-800 text-white text-xs font-semibold rounded-md shadow-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-[100] whitespace-nowrap">
                  {item.label}
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Profile/Logout */}
        <div className="flex flex-col items-center gap-4 mt-auto mb-2 relative w-full">
          <button className="w-10 h-10 bg-teal-700 text-white rounded-full flex items-center justify-center font-bold text-sm shadow-md hover:shadow-lg transition-shadow">
            U
          </button>
          
          <div className="relative group flex flex-col items-center w-full mt-2">
            <button className="text-gray-400 hover:bg-red-50 hover:text-red-500 p-2.5 rounded-full transition-colors">
              <LogOut className="w-5 h-5" strokeWidth={2} />
            </button>
            <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-2.5 py-1 bg-gray-800 text-white text-xs font-semibold rounded-md shadow-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-[100] whitespace-nowrap">
              Sign Out
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <section className="flex-1 flex flex-col relative overflow-hidden bg-[#e5e3df]">
        
        {/* Floating Top Bar (Google Maps Search Bar Style) */}
        <div className="absolute top-6 left-6 z-[40] flex items-center gap-3">
          <div 
            className="group relative"
            onMouseEnter={() => setIsTopMenuOpen(true)}
            onMouseLeave={() => setIsTopMenuOpen(false)}
          >
            <div className={`flex items-center bg-white shadow-[0_4px_24px_rgba(0,0,0,0.15)] rounded-full border border-gray-100 transition-all duration-500 ease-in-out overflow-hidden ${isTopMenuOpen ? 'max-w-[400px] w-max' : 'max-w-[52px] w-[52px]'}`} style={{ height: '52px' }}>
              <button className="flex-shrink-0 w-[52px] h-[52px] flex items-center justify-center text-[#2A3F5A] hover:bg-gray-50 transition-colors rounded-full">
                 <CustomFloodIcon className="w-8 h-8" />
              </button>
              <div className={`flex items-center gap-2 whitespace-nowrap transition-opacity duration-300 pr-2 ${isTopMenuOpen ? 'opacity-100 delay-100' : 'opacity-0 pointer-events-none'}`}>
                 <div className="w-px h-6 bg-gray-200 mx-1"></div>
                 <button 
                   onClick={() => setActiveTab('meteorology')}
                   className="px-3 py-1.5 rounded-full text-[13px] font-semibold flex items-center gap-2 text-gray-600 hover:bg-blue-50 hover:text-blue-700 transition-all"
                 >
                    <CloudRain className="w-4 h-4"/> AI Forecast
                 </button>
                 <button 
                   onClick={() => setActiveTab('simulations')}
                   className="px-3 py-1.5 rounded-full text-[13px] font-semibold flex items-center gap-2 text-gray-600 hover:bg-blue-50 hover:text-blue-700 transition-all"
                 >
                    <History className="w-4 h-4"/> Past Logs
                 </button>
              </div>
            </div>
          </div>


        </div>

        {/* Dynamic Content Views */}
        <div className="flex-1 relative overflow-hidden bg-transparent">
          <AnimatePresence mode="wait">
            {activeTab === 'overview' && (
              <motion.div key="overview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="h-full w-full absolute">
                <MapOverview status={status} recommendation={recommendation} onSimulate={handleSimulate} />
              </motion.div>
            )}

            {activeTab === 'meteorology' && (
              <motion.div key="meteorology" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="h-full w-full absolute">
                <RainfallDashboard status={status} recommendation={recommendation} onSimulate={handleSimulate} />
              </motion.div>
            )}
            
            {activeTab === 'simulations' && (
              <motion.div key="simulations" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="p-8 flex items-center justify-center h-full w-full absolute">
                 <div className="text-center text-gray-800 max-w-md bg-white p-12 rounded-[2rem] shadow-xl border border-gray-100">
                     <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <History className="w-10 h-10 text-blue-500" />
                     </div>
                     <h3 className="text-2xl font-bold text-gray-900 mb-3">Simulation History</h3>
                     <p className="text-[15px] leading-relaxed text-gray-500">Past ANUGA flood simulations and WFlow runoff logs will be archived and accessible here.</p>
                 </div>
              </motion.div>
            )}

            {activeTab === 'settings' && (
              <motion.div key="settings" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="p-8 flex items-center justify-center h-full w-full absolute">
                 <div className="text-center text-gray-800 max-w-md bg-white p-12 rounded-[2rem] shadow-xl border border-gray-100">
                     <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Settings className="w-10 h-10 text-slate-500" />
                     </div>
                     <h3 className="text-2xl font-bold text-gray-900 mb-3">Project Settings</h3>
                     <p className="text-[15px] leading-relaxed text-gray-500">Configure API keys, simulation engine endpoints, and database connections.</p>
                 </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

    </main>
  );
}
