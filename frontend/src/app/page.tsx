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
        
        {/* Header Row: Search + Pills */}
        <div className="flex flex-row items-center gap-3 w-full max-w-[calc(100vw-32px)]">
          {/* Floating Top Search/Title Bar */}
          <div className="bg-white rounded-full shadow-md px-5 py-3 flex items-center w-max pointer-events-auto border border-gray-200 shrink-0">
            <Shield className="w-5 h-5 mr-3 text-blue-600" />
            <h1 className="text-lg font-bold text-slate-800 tracking-tight pr-2">FloodShield</h1>
          </div>

          {/* Category Pills */}
          <div className="flex gap-2 pointer-events-auto overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] shrink-0 max-w-full">
            {navItems.map((item) => {
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
               className="relative flex items-start mt-1"
               animate={{ x: isPanelCollapsed ? -416 : 0 }}
               transition={{ duration: 0.3, ease: "easeInOut" }}
            >
                <div className="pointer-events-auto bg-white shadow-lg border border-gray-200 rounded-xl flex flex-col overflow-hidden w-[400px] max-h-[calc(100vh-140px)]">
                    <div className="flex-1 overflow-y-auto bg-gray-50 w-full relative">
                        {activeTab === 'overview' && (
                            <MapOverview layers={layers} setLayers={setLayers} />
                        )}
                        {activeTab === 'meteorology' && (
                            <RainfallDashboard setLayers={setLayers} setAiSafeSpots={setAiSafeSpots} />
                        )}
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
                </div>
                
                {/* Collapse Button attached to the panel */}
                <button
                    onClick={() => setIsPanelCollapsed(!isPanelCollapsed)}
                    className="pointer-events-auto bg-white border border-gray-200 border-l-0 shadow-md flex items-center justify-center w-6 h-12 rounded-r-md hover:bg-gray-50 text-gray-500 mt-4 relative z-[1010]"
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
      <div className="absolute top-4 right-0 p-4 z-[500] pointer-events-none flex items-start justify-end w-max">
         <AnimatePresence>
           {(!activeTab || activeTab === 'overview') && (
             <motion.div 
               className="relative flex items-start"
               animate={{ x: isRightPanelCollapsed ? 416 : 0 }}
               transition={{ duration: 0.3, ease: "easeInOut" }}
             >
                {/* Collapse Button attached to the left of the right panel */}
                <button
                    onClick={() => setIsRightPanelCollapsed(!isRightPanelCollapsed)}
                    className="pointer-events-auto bg-white border border-gray-200 border-r-0 shadow-md flex items-center justify-center w-6 h-12 rounded-l-md hover:bg-gray-50 text-gray-500 mt-4 relative z-[1010]"
                    title={isRightPanelCollapsed ? "Expand Panel" : "Collapse Panel"}
                >
                    {isRightPanelCollapsed ? <ChevronLeft className="w-4 h-4 text-blue-600" /> : <ChevronRight className="w-4 h-4" />}
                </button>

                <div className="pointer-events-auto bg-white shadow-lg border border-gray-200 rounded-xl flex flex-col overflow-hidden w-[400px] max-h-[calc(100vh-140px)]">
                    <NewsDashboard />
                </div>
             </motion.div>
           )}
         </AnimatePresence>
      </div>

    </main>
  );
}
