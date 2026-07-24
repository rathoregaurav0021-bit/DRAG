"use client";
import React, { useState } from 'react';
import { LayoutDashboard, CloudRain, Shield, Smartphone, Settings, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';

import MapOverview from '@/components/MapOverview';
import SafeSpotDashboard from '@/components/SafeSpotDashboard';
import SmsDashboard from '@/components/SmsDashboard';
import RainfallDashboard from '@/components/RainfallDashboard';

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
    { id: 'sms', label: 'SMS Dispatch', icon: Smartphone },
  ];

  return (
    <main className="relative flex h-screen w-full bg-[#e1f1ee] overflow-hidden font-sans text-slate-800">
      
      {/* GLOBAL BACKGROUND MAP */}
      <div className="absolute inset-0 z-0">
        <LeafletMap 
            layers={layers} 
            aiSafeSpots={activeTab === "safe-spot" ? aiSafeSpots : undefined} 
            userLocation={userLocation}
            setUserLocation={activeTab === "safe-spot" ? setUserLocation : undefined}
            routeGeoJSON={activeTab === "safe-spot" ? routeGeoJSON : undefined}
        />
      </div>

      {/* COMPACT HAMBURGER MENU */}
      <div className="absolute top-4 left-4 z-[1000] flex flex-col gap-2">
        <button 
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="w-12 h-12 bg-white shadow-xl rounded-xl flex items-center justify-center text-[#233a77] hover:bg-[#e1f1ee] transition-colors border border-gray-100"
        >
          {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>

        <AnimatePresence>
          {isMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col gap-1 bg-white/95 backdrop-blur-md p-2 rounded-2xl shadow-2xl border border-[#92cce5]/30"
            >
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => { setActiveTab(item.id); setIsMenuOpen(false); }}
                    className={`relative flex items-center justify-start px-4 py-3 rounded-xl transition-all duration-200 w-48 group ${
                      isActive 
                        ? 'bg-[#233a77] text-white shadow-md' 
                        : 'text-gray-600 hover:bg-[#e1f1ee] hover:text-[#233a77]'
                    }`}
                  >
                    <Icon className={`w-5 h-5 mr-3 ${isActive ? 'text-[#92cce5]' : 'text-gray-400 group-hover:text-[#3f7ce0]'}`} strokeWidth={2} />
                    <span className="font-bold text-sm tracking-tight">{item.label}</span>
                  </button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* FLOATING UI PANELS (Must be pointer-events-none so map is clickable) */}
      <div className="absolute inset-0 z-[500] pointer-events-none overflow-hidden flex items-center justify-center">
        <AnimatePresence mode="wait">
          
          {activeTab === 'overview' && (
            <motion.div key="overview" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="absolute bottom-12 left-6">
              <MapOverview layers={layers} setLayers={setLayers} />
            </motion.div>
          )}

          {activeTab === 'meteorology' && (
            <motion.div key="meteorology" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="absolute bottom-12 left-6">
              <RainfallDashboard setLayers={setLayers} setAiSafeSpots={setAiSafeSpots} />
            </motion.div>
          )}
          
          {activeTab === 'safe-spot' && (
            <motion.div key="safe-spot" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="absolute bottom-12 left-6">
              <SafeSpotDashboard 
                userLocation={userLocation}
                setUserLocation={setUserLocation}
                routeGeoJSON={routeGeoJSON}
                setAiSafeSpots={setAiSafeSpots}
                setRouteGeoJSON={setRouteGeoJSON}
                destinationName={destinationName}
                setDestinationName={setDestinationName}
                onNavigateToSms={handleNavigateToSms} 
              />
            </motion.div>
          )}

          {activeTab === 'sms' && (
            <motion.div key="sms" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} transition={{ duration: 0.2 }} className="absolute bottom-6 right-6 pointer-events-auto">
              <SmsDashboard context={smsContext} />
            </motion.div>
          )}



        </AnimatePresence>
      </div>

    </main>
  );
}
