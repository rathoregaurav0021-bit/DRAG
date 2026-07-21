"use client";
import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Shield, Navigation, Smartphone } from 'lucide-react';

const LeafletMap = dynamic(() => import('@/components/LeafletMap'), { 
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full flex-col items-center justify-center bg-gray-100">
        <p className="text-gray-500 font-medium">Loading Map Engine...</p>
      </div>
    )
});

export default function SafeSpotDashboard({ onNavigateToSms }: { onNavigateToSms?: (context: any) => void }) {
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [aiSafeSpots, setAiSafeSpots] = useState<any[]>([]);
  const [routeGeoJSON, setRouteGeoJSON] = useState<any>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [destinationName, setDestinationName] = useState<string | null>(null);
  const [smsSent, setSmsSent] = useState(false);

  const [layers, setLayers] = useState({
    dem: true,
    lulc: false,
    roads: true,
    floodDepth: false,
    shelters: false,
    aiSafeSpots: true
  });

  const handleFindRoute = async () => {
    if (!userLocation) {
      alert("Please click on the map to set your starting location first!");
      return;
    }

    setIsSimulating(true);
    setSmsSent(false);
    try {
      const response = await fetch('/data/sample_rainfall.csv');
      const csvData = await response.text();

      const apiRes = await fetch('/api/wflow/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            csv_data: csvData, 
            soil_moisture: 'Normal',
            user_lat: userLocation[0],
            user_lng: userLocation[1]
        })
      });
      
      const result = await apiRes.json();
      if (result.status === 'success') {
        setAiSafeSpots(result.safe_spots || []);
        if (result.route_info) {
            setRouteGeoJSON(result.route_info.route);
            setDestinationName(result.route_info.safe_spot?.name || "Verified Safe Zone");
        } else {
            alert("No safe route could be found from this location during the Pre-Peak flood!");
            setRouteGeoJSON(null);
            setDestinationName(null);
        }
      }
    } catch (e: any) {
      console.error(e);
      alert("Error calculating route.");
    } finally {
      setIsSimulating(false);
    }
  };

  const handleSendSMS = async () => {
      try {
          await fetch('/api/sms', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ phone_number: "+1234567890", message: `EVACUATION ALERT: Proceed immediately to ${destinationName}. Follow the safe route provided.` })
          });
          setSmsSent(true);
      } catch (e) {
          alert("SMS Dispatch Failed.");
      }
  };

  return (
    <div className="relative flex h-full w-full bg-slate-50 overflow-hidden">
      {/* Map Area */}
      <div className="absolute inset-0 z-0">
        <LeafletMap 
            layers={layers} 
            aiSafeSpots={aiSafeSpots} 
            userLocation={userLocation}
            setUserLocation={setUserLocation}
            routeGeoJSON={routeGeoJSON}
        />
      </div>

      {/* Control Panel */}
      <div className="absolute top-6 left-6 z-[400] w-96 bg-white/95 backdrop-blur-md border border-gray-200 shadow-2xl rounded-3xl p-6 flex flex-col gap-6">
        <div>
            <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-emerald-100 rounded-full"><Shield className="w-6 h-6 text-emerald-600" /></div>
                <h2 className="text-xl font-black text-gray-900 tracking-tight">AI Evacuation</h2>
            </div>
            <p className="text-sm text-gray-500 font-medium leading-relaxed">
                Click anywhere on the map to set your location, then the AI will find the safest route to a verified shelter before the flood peaks.
            </p>
        </div>

        <button 
            onClick={handleFindRoute}
            disabled={!userLocation || isSimulating}
            className={`w-full py-4 rounded-2xl font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2 ${!userLocation ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 active:scale-[0.98]'}`}
        >
            {isSimulating ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <Navigation className="w-5 h-5" />}
            {isSimulating ? "Calculating Safest Route..." : "Find Safe Route"}
        </button>

        {destinationName && (
            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Destination</div>
                <div className="text-lg font-black text-emerald-700 leading-tight mb-4">{destinationName}</div>
                
                <button 
                    onClick={handleSendSMS}
                    className={`w-full py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${smsSent ? 'bg-green-100 text-green-700' : 'bg-gray-900 text-white hover:bg-gray-800'}`}
                >
                    <Smartphone className="w-4 h-4" />
                    {smsSent ? "SMS Dispatched Successfully" : "Send Route via SMS"}
                </button>
            </div>
        )}
      </div>
    </div>
  );
}
