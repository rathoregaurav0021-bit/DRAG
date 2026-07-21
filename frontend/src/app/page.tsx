"use client";
import React, { useState } from 'react';
import { LayoutDashboard, CloudRain, Shield, Smartphone, Settings } from 'lucide-react';
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
      <div className="flex h-full w-full flex-col items-center justify-center bg-[#e5e3df]">
        <p className="text-gray-500 font-medium">Loading Map Engine...</p>
      </div>
    )
});

export default function Home() {
  const [activeTab, setActiveTab] = useState('overview');
  
  // GLOBAL MAP STATE
  const [layers, setLayers] = useState({
    dem: true,
    lulc: false,
    roads: true,
    floodDepth: false,
    shelters: false,
    aiSafeSpots: true
  });
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [aiSafeSpots, setAiSafeSpots] = useState<any[]>([]);
  const [routeGeoJSON, setRouteGeoJSON] = useState<any>(null);
  const [destinationName, setDestinationName] = useState<string | null>(null);
  
  // SMS STATE
  const [smsContext, setSmsContext] = useState<any>(null);

  const handleNavigateToSms = (context: any) => {
    setSmsContext(context);
    setActiveTab('sms');
  };

  const navItems = [
    { id: 'overview', label: 'Map Layers', icon: LayoutDashboard },
    { id: 'meteorology', label: 'Rainfall Setup', icon: CloudRain },
    { id: 'safe-spot', label: 'AI Evacuation', icon: Shield },
    { id: 'sms', label: 'SMS Dispatch', icon: Smartphone },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <main className="relative flex h-screen w-full bg-[#e5e3df] overflow-hidden font-sans text-slate-800">
      
      {/* GLOBAL BACKGROUND MAP */}
      <div className="absolute inset-0 z-0">
        <LeafletMap 
            layers={layers} 
            aiSafeSpots={aiSafeSpots} 
            userLocation={userLocation}
            setUserLocation={setUserLocation}
            routeGeoJSON={routeGeoJSON}
        />
      </div>

      {/* GOOGLE MAPS STYLE FLOATING NAVIGATION (Top Left) */}
      <div className="absolute top-6 left-6 z-[1000] flex gap-2 bg-white/90 backdrop-blur-md p-2 rounded-2xl shadow-lg border border-gray-100">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`relative flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-200 group ${
                isActive 
                  ? 'bg-blue-600 text-white shadow-md scale-105' 
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-500 group-hover:text-gray-900'}`} strokeWidth={isActive ? 2.5 : 2} />
              
              {/* Tooltip */}
              <div className="absolute top-full mt-3 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-gray-900 text-white text-xs font-bold rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-[1100] whitespace-nowrap pointer-events-none">
                {item.label}
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
              </div>
            </button>
          );
        })}
      </div>

      {/* FLOATING UI PANELS (Must be pointer-events-none so map is clickable) */}
      <div className="absolute inset-0 z-[500] pointer-events-none overflow-hidden">
        <AnimatePresence mode="wait">
          
          {activeTab === 'overview' && (
            <motion.div key="overview" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="absolute top-24 left-6">
              <MapOverview layers={layers} setLayers={setLayers} />
            </motion.div>
          )}

          {activeTab === 'meteorology' && (
            <motion.div key="meteorology" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="absolute inset-0">
              <RainfallDashboard />
            </motion.div>
          )}
          
          {activeTab === 'safe-spot' && (
            <motion.div key="safe-spot" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="absolute top-24 left-6">
              <SafeSpotDashboard 
                userLocation={userLocation}
                setAiSafeSpots={setAiSafeSpots}
                setRouteGeoJSON={setRouteGeoJSON}
                destinationName={destinationName}
                setDestinationName={setDestinationName}
                onNavigateToSms={handleNavigateToSms} 
              />
            </motion.div>
          )}

          {activeTab === 'sms' && (
            <motion.div key="sms" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} transition={{ duration: 0.2 }} className="absolute inset-x-6 bottom-6 h-96">
              <SmsDashboard context={smsContext} />
            </motion.div>
          )}

          {activeTab === 'settings' && (
            <motion.div key="settings" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-gray-800 max-w-md bg-white/95 backdrop-blur-xl p-12 rounded-[2rem] shadow-2xl border border-gray-100 pointer-events-auto">
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

    </main>
  );
}
