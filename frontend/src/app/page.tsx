"use client";
import React, { useState } from 'react';
import { LayoutDashboard, CloudRain, Shield, Smartphone, Menu, X, Users, LifeBuoy, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';

import MapOverview from '@/components/MapOverview';
import SafeSpotDashboard from '@/components/SafeSpotDashboard';
import SmsDashboard from '@/components/SmsDashboard';
import RainfallDashboard from '@/components/RainfallDashboard';
import RecipientsDashboard from '@/components/RecipientsDashboard';
import RescueDashboard from '@/components/RescueDashboard';
import NewsDashboard from '@/components/NewsDashboard';

// Dynamically import LeafletMap for the global background
const LeafletMap = dynamic(() => import('@/components/LeafletMap'), { 
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full flex-col items-center justify-center bg-[#e1f1ee]">
        <p className="text-[#233a77] font-bold animate-pulse">Initializing Map Engine...</p>
      </div>
    )
});

export default function Home() {
  const [activeTab, setActiveTab] = useState('overview');
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);
  const [isRightPanelCollapsed, setIsRightPanelCollapsed] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // GLOBAL MAP STATE
  const [layers, setLayers] = useState({
    dem: false,
    lulc: false,
    buildings: false,
    roads: true,
    shelters: false,
    floodDepth: false,
    aiSafeSpots: true
  });
  
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [aiSafeSpots, setAiSafeSpots] = useState<any[]>([]);
  const [routeGeoJSON, setRouteGeoJSON] = useState<any>(null);
  const [destinationName, setDestinationName] = useState<string | null>(null);
  const [smsContext, setSmsContext] = useState<any>(null);
  const [activeRescueGroup, setActiveRescueGroup] = useState<any>(null);
  const [strandedGroups, setStrandedGroups] = useState<any[]>([]);
  
  const [status, setStatus] = useState("Awaiting Simulation...");
  const [recommendation, setRecommendation] = useState("");

  const handleNavigateToSms = (context: any) => {
    setSmsContext(context);
    setActiveTab('sms');
    setIsMenuOpen(false); // Auto close menu
  };

  const navItems = [
    { id: 'overview', label: 'Map Layers', icon: LayoutDashboard },
    { id: 'meteorology', label: 'Rainfall Setup', icon: CloudRain },
    { id: 'safe-spot', label: 'AI Evacuation', icon: Shield },
    { id: 'rescue', label: 'Rescue Dispatch', icon: LifeBuoy },
    { id: 'sms', label: 'SMS Dispatch', icon: Smartphone },
    { id: 'recipients', label: 'Recipients Log', icon: Users },
  ];

  return (
    <>
    <main className="relative flex h-screen w-full bg-[#e1f1ee] overflow-hidden font-sans text-slate-800">
      
      {/* GLOBAL BACKGROUND MAP */}
      <div className={`absolute inset-0 z-0 ${activeTab === 'recipients' ? 'hidden' : ''}`}>
        <LeafletMap 
            layers={layers} 
            aiSafeSpots={activeTab === "safe-spot" ? aiSafeSpots : undefined} 
            userLocation={userLocation}
            setUserLocation={activeTab === "safe-spot" ? setUserLocation : undefined}
            routeGeoJSON={activeTab === "safe-spot" ? routeGeoJSON : undefined}
            strandedGroups={activeTab === "rescue" ? strandedGroups : undefined}
            activeRescueGroup={activeTab === "rescue" ? activeRescueGroup : undefined}
            showRescueLayer={activeTab === "rescue"}
        />
      </div>

      {/* UI OVERLAY - Top Left (Title, Search, Pills) */}
      <div className="absolute top-0 left-0 p-4 z-[1000] pointer-events-none flex flex-col gap-3 w-full">
        
        {/* Header Row: Hamburger + Title + Map Layers Pill */}
        <div className="flex flex-row items-center gap-3 w-full max-w-[calc(100vw-32px)]">
          {/* Floating Top Search/Title Bar */}
          <div className="bg-white rounded-full shadow-md px-4 py-3 flex items-center w-max pointer-events-auto border border-gray-200 shrink-0">
            <button onClick={() => setIsMenuOpen(true)} className="p-1 mr-2 rounded-full hover:bg-gray-100 transition-colors">
              <Menu className="w-5 h-5 text-slate-800" />
            </button>
            <h1 className="text-lg font-bold text-slate-800 tracking-tight pr-2">FloodShield</h1>
          </div>

          {/* Map Layers Pill (Outside Hamburger) */}
          <div className="pointer-events-auto">
            {navItems.filter(i => i.id === 'overview').map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    if (isActive) {
                      setIsPanelCollapsed(!isPanelCollapsed);
                    } else {
                      setActiveTab(item.id);
                      setIsPanelCollapsed(false);
                    }
                  }}
                  className={`flex items-center px-4 py-2 text-xs font-bold rounded-full shadow-sm border transition-colors whitespace-nowrap ${
                    isActive 
                      ? 'bg-slate-900 border-slate-900 text-white' 
                      : 'bg-white border-gray-200 text-slate-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 mr-2 ${isActive ? 'text-blue-400' : 'text-slate-500'}`} strokeWidth={2.5} />
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Floating Left Panel for Active Tab Content */}
        <AnimatePresence>
          {activeTab && activeTab !== 'recipients' && (
            <motion.div 
               className="relative flex items-start"
               animate={{ x: isPanelCollapsed ? -496 : 0 }}
               transition={{ duration: 0.3, ease: "easeInOut" }}
               // Move panels from bottom to just below the header horizontally
               style={{ top: '80px', left: '16px', position: 'absolute' }}
            >
              <div className="pointer-events-auto bg-white shadow-xl border border-gray-200 rounded-2xl flex flex-col overflow-hidden w-[480px] max-h-[calc(100vh-140px)] z-[1000]">
                {/* Content switching based on activeTab */}
                {activeTab === 'overview' && <MapOverview layers={layers} setLayers={setLayers} />}
                {activeTab === 'meteorology' && <RainfallDashboard setLayers={setLayers} setAiSafeSpots={setAiSafeSpots} />}
                {activeTab === 'safe-spot' && (
                  <SafeSpotDashboard 
                    setLayers={setLayers}
                    userLocation={userLocation}
                    setUserLocation={setUserLocation}
                    routeGeoJSON={routeGeoJSON}
                    setAiSafeSpots={setAiSafeSpots}
                    setRouteGeoJSON={setRouteGeoJSON}
                    destinationName={destinationName}
                    setDestinationName={setDestinationName}
                    onNavigateToSms={handleNavigateToSms} 
                  />
                )}
                {activeTab === 'rescue' && (
                  <RescueDashboard 
                    onSelectGroup={(group) => setActiveRescueGroup(group)} 
                    onStrandedLoaded={(groups) => setStrandedGroups(groups)}
                  />
                )}
                {activeTab === 'sms' && (
                  <SmsDashboard context={smsContext} />
                )}
              </div>
              
              {/* Collapse Button attached to the right of the panel */}
              <button
                 onClick={() => setIsPanelCollapsed(!isPanelCollapsed)}
                 className="pointer-events-auto bg-white border border-gray-200 border-l-0 shadow-md flex items-center justify-center w-6 h-12 rounded-r-md hover:bg-gray-50 text-gray-500 mt-4 relative z-[990]"
                 title={isPanelCollapsed ? "Expand Panel" : "Collapse Panel"}
              >
                 {isPanelCollapsed ? <ChevronRight className="w-4 h-4 text-blue-600" /> : <ChevronLeft className="w-4 h-4" />}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Recipients Full Screen Overlay */}
      <AnimatePresence>
         {activeTab === 'recipients' && (
           <motion.div 
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             exit={{ opacity: 0 }}
             className="absolute inset-0 z-[2000] bg-white flex flex-col pointer-events-auto"
           >
              {/* Back Button for full screen */}
              <div className="absolute top-6 right-6 z-[2010]">
                 <button 
                   onClick={() => setActiveTab('')} 
                   className="bg-slate-900 text-white p-2 rounded-full shadow-lg hover:bg-slate-800 transition-colors"
                 >
                    <X className="w-5 h-5" />
                 </button>
              </div>
              <RecipientsDashboard />
           </motion.div>
         )}
      </AnimatePresence>

      {/* FLOATING RIGHT PANELS (For global widgets like News) */}
      <div className="absolute top-16 right-0 p-4 z-[500] pointer-events-none flex items-start justify-end w-max">
         <AnimatePresence>
           {(!activeTab || activeTab === 'overview') && (
             <motion.div 
               className="relative flex items-start"
               animate={{ x: isRightPanelCollapsed ? 396 : 0 }}
               transition={{ duration: 0.3, ease: "easeInOut" }}
             >
                {/* Collapse Button attached to the left of the right panel */}
                <button
                    onClick={() => setIsRightPanelCollapsed(!isRightPanelCollapsed)}
                    className="pointer-events-auto bg-white border border-gray-200 border-r-0 shadow-md flex items-center justify-center w-10 h-12 rounded-l-xl hover:bg-slate-50 transition-colors mt-4 relative z-[1010]"
                    title={isRightPanelCollapsed ? "Expand Panel" : "Collapse Panel"}
                >
                    <div className="w-6 h-6 bg-[#1e88e5] rounded-full flex items-center justify-center text-white font-bold font-serif shadow-sm text-sm">
                        i
                    </div>
                </button>

                <div className="pointer-events-auto bg-white shadow-lg border border-gray-200 rounded-xl flex flex-col overflow-hidden w-[380px] max-h-[calc(100vh-250px)]">
                    <NewsDashboard />
                </div>
             </motion.div>
           )}
         </AnimatePresence>
      </div>

    </main>

      {/* Sidebar Drawer (Google Maps style) */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
              className="fixed inset-0 bg-black/40 z-[3000] pointer-events-auto"
            />
            {/* Drawer */}
            <motion.div 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.15 }}
              className="fixed top-0 left-0 h-full w-80 bg-white shadow-2xl z-[3010] pointer-events-auto flex flex-col"
            >
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <Shield className="w-6 h-6 text-blue-600" />
                  <h2 className="text-xl font-bold text-slate-800">FloodShield Menu</h2>
                </div>
                <button onClick={() => setIsMenuOpen(false)} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>
              <div className="flex flex-col py-2 overflow-y-auto">
                {navItems.filter(i => i.id !== 'overview').map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        setIsPanelCollapsed(false);
                        setIsMenuOpen(false); // Close drawer on selection
                      }}
                      className={`flex items-center px-6 py-4 text-sm font-bold transition-colors w-full text-left ${
                        isActive 
                          ? 'bg-blue-50 text-blue-700 border-r-4 border-blue-600' 
                          : 'bg-transparent text-slate-700 hover:bg-gray-50 border-r-4 border-transparent'
                      }`}
                    >
                      <Icon className={`w-5 h-5 mr-4 ${isActive ? 'text-blue-600' : 'text-slate-500'}`} strokeWidth={2} />
                      {item.label}
                    </button>
                  );
                })}
                <div className="border-t border-gray-200 my-2"></div>
                <div className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">System Status</div>
                <div className="px-6 py-2 text-sm text-slate-600 flex items-center justify-between">
                   <span>Backend Link</span>
                   <span className="text-green-500 font-bold flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-green-500"></div> Active</span>
                </div>
                <div className="px-6 py-2 text-sm text-slate-600 flex items-center justify-between">
                   <span>OSM Cache</span>
                   <span className="font-mono text-xs">Synced</span>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </>
  );
}
