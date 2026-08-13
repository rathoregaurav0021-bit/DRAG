"use client";
import React, { useState } from 'react';
import { Shield, Navigation, Smartphone, MapPin, XCircle } from 'lucide-react';

export default function SafeSpotDashboard({ 
    setLayers,
    userLocation, 
    setUserLocation,
    routeGeoJSON,
    setAiSafeSpots, 
    setRouteGeoJSON, 
    destinationName, 
    setDestinationName,
    onNavigateToSms 
}: any) {
  const [isSimulating, setIsSimulating] = useState(false);
  const [destinationCoords, setDestinationCoords] = useState<[number, number] | null>(null);

  const handleFindRoute = async () => {
    if (!userLocation) {
      alert("Please click on the map to set your starting location first!");
      return;
    }

    setIsSimulating(true);
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
        if(setAiSafeSpots) setAiSafeSpots(result.safe_spots || []);
        if (result.route_info) {
            if(setRouteGeoJSON) setRouteGeoJSON(result.route_info.route);
            if(setDestinationName) setDestinationName(result.route_info.safe_spot?.name || "Verified Safe Zone");
            if(setLayers) setLayers((prev: any) => ({ ...prev, prePeakFlood: true, floodDepth: false }));
            
            // Extract destination coords from routeGeoJSON (last coordinate)
            if (result.route_info.route?.geometry?.coordinates) {
                const coords = result.route_info.route.geometry.coordinates;
                if (coords.length > 0) {
                    const lastCoord = coords[coords.length - 1];
                    setDestinationCoords([lastCoord[1], lastCoord[0]]); // Leaflet uses [lat, lng], GeoJSON uses [lng, lat]
                }
            } else if (result.route_info.safe_spot) {
                setDestinationCoords([result.route_info.safe_spot.lat, result.route_info.safe_spot.lng]);
            }
            
            // Register this safe spot location as awaiting evac!
            try {
                let destLat = userLocation[0];
                let destLng = userLocation[1];
                if (result.route_info.route?.geometry?.coordinates?.length > 0) {
                    const lastCoord = result.route_info.route.geometry.coordinates[result.route_info.route.geometry.coordinates.length - 1];
                    destLat = lastCoord[1];
                    destLng = lastCoord[0];
                } else if (result.route_info.safe_spot) {
                    destLat = result.route_info.safe_spot.lat;
                    destLng = result.route_info.safe_spot.lng;
                }

                await fetch('/api/rescue/stranded', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        lat: destLat,
                        lng: destLng,
                        population: 1, // Hidden in UI
                        elevation: Math.floor(Math.random() * 20) + 2    // Random elevation 2-22m
                    })
                });
            } catch(e) {
                console.error("Failed to register rescue group", e);
            }

        } else {
            alert("No safe route could be found from this location during the Pre-Peak flood!");
            if(setRouteGeoJSON) setRouteGeoJSON(null);
            if(setDestinationName) setDestinationName(null);
            setDestinationCoords(null);
        }
      }
    } catch (e: any) {
      console.error(e);
      alert("Error calculating route.");
    } finally {
      setIsSimulating(false);
    }
  };

  const handleReset = () => {
      if(setUserLocation) setUserLocation(null);
      if(setRouteGeoJSON) setRouteGeoJSON(null);
      if(setDestinationName) setDestinationName(null);
      setDestinationCoords(null);
  };

  const handlePrepareSMS = () => {
      if(onNavigateToSms) {
          onNavigateToSms({
              phone_number: "",
              destinationName: destinationName,
              destinationCoords: destinationCoords,
              routeGeoJSON: routeGeoJSON
          });
      }
  };

  return (
    <div className="pointer-events-auto bg-white/95 backdrop-blur-md p-5 rounded-2xl shadow-xl border border-[#92cce5]/30 max-w-[300px] w-full flex flex-col gap-4">
        
        {/* Header */}
        <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-[#e1f1ee] rounded-xl text-[#233a77]"><Shield className="w-5 h-5" /></div>
                <div>
                    <h2 className="text-sm font-bold text-[#233a77] tracking-tight leading-none">AI Evacuation</h2>
                    <p className="text-[10px] text-gray-500 font-medium mt-1 leading-tight">Map click sets location.</p>
                </div>
            </div>
            {userLocation && (
                <button onClick={handleReset} className="text-gray-400 hover:text-red-500 transition-colors" title="Clear Location">
                    <XCircle className="w-5 h-5" />
                </button>
            )}
        </div>

        {/* Coordinates Display */}
        <div className="flex flex-col gap-2">
            <div className={`p-3 rounded-xl border flex flex-col gap-1 ${userLocation ? 'bg-blue-50 border-blue-100' : 'bg-gray-50 border-gray-100'}`}>
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    <MapPin className="w-3 h-3" /> Current Location
                </div>
                {userLocation ? (
                    <div className="text-xs font-black text-[#233a77] font-mono">
                        {userLocation[0].toFixed(5)}, {userLocation[1].toFixed(5)}
                    </div>
                ) : (
                    <div className="text-xs font-semibold text-gray-400 italic">
                        Click on map to set start point...
                    </div>
                )}
            </div>
            
            {destinationCoords && (
                <div className="p-3 rounded-xl border bg-emerald-50 border-emerald-100 flex flex-col gap-1">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 uppercase tracking-wider">
                        <MapPin className="w-3 h-3" /> Safe Zone Coords
                    </div>
                    <div className="text-xs font-black text-emerald-800 font-mono">
                        {destinationCoords[0].toFixed(5)}, {destinationCoords[1].toFixed(5)}
                    </div>
                </div>
            )}
        </div>

        <button 
            onClick={handleFindRoute}
            disabled={!userLocation || isSimulating}
            className={`w-full py-2.5 rounded-xl font-bold text-white text-xs shadow-md transition-all flex items-center justify-center gap-2 ${!userLocation ? 'bg-gray-300 cursor-not-allowed' : 'bg-[#233a77] hover:bg-[#3f7ce0] active:scale-[0.98]'}`}
        >
            {isSimulating ? <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <Navigation className="w-3.5 h-3.5" />}
            {isSimulating ? "Calculating..." : (routeGeoJSON ? "Recalculate Route" : "Find Safe Route")}
        </button>

        {destinationName && (
            <div className="bg-[#e1f1ee]/50 rounded-xl p-3 border border-[#92cce5]/20 mt-1">
                <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Destination Name</div>
                <div className="text-sm font-black text-[#233a77] leading-tight mb-3 truncate" title={destinationName}>{destinationName}</div>
                
                <button 
                    onClick={handlePrepareSMS}
                    className="w-full py-2 rounded-lg font-bold text-[11px] transition-all flex items-center justify-center gap-1.5 bg-[#3f7ce0] text-white hover:bg-[#233a77]"
                >
                    <Smartphone className="w-3.5 h-3.5" />
                    Open SMS Dispatch
                </button>
            </div>
        )}
    </div>
  );
}
