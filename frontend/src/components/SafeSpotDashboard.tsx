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
    <div className="bg-white w-full flex flex-col pointer-events-auto rounded-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-zinc-200 bg-white text-zinc-900">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 rounded-lg">
                    <Shield className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                    <h2 className="text-lg font-bold tracking-tight text-zinc-900">Evacuation Route</h2>
                    <p className="text-sm text-zinc-500 font-medium mt-0.5">Click the map to set a start point.</p>
                </div>
            </div>
            {userLocation && (
                <button onClick={handleReset} className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors" title="Clear Location">
                    <XCircle className="w-5 h-5" />
                </button>
            )}
        </div>

        {/* Coordinates Display */}
        <div className="p-5 flex flex-col gap-5">
            <div className={`p-4 rounded-xl flex flex-col gap-1.5 transition-all ${userLocation ? 'bg-zinc-50 border-2 border-zinc-200' : 'bg-zinc-50/50 border-2 border-dashed border-zinc-200'}`}>
                <div className="flex items-center gap-2 text-xs font-bold text-zinc-500 uppercase tracking-widest">
                    <MapPin className="w-3.5 h-3.5" /> Start Position
                </div>
                {userLocation ? (
                    <div className="text-lg font-bold text-zinc-900 tracking-tight">
                        {userLocation[0].toFixed(5)}, {userLocation[1].toFixed(5)}
                    </div>
                ) : (
                    <div className="text-sm font-medium text-zinc-400">
                        Waiting for map selection...
                    </div>
                )}
            </div>
            
            {destinationCoords && (
                <div className="p-4 rounded-xl border-2 bg-emerald-50 border-emerald-200 flex flex-col gap-1.5">
                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 uppercase tracking-widest">
                        <MapPin className="w-3.5 h-3.5" /> Safe Zone Target
                    </div>
                    <div className="text-lg font-bold text-emerald-900 tracking-tight">
                        {destinationCoords[0].toFixed(5)}, {destinationCoords[1].toFixed(5)}
                    </div>
                </div>
            )}

            <button 
                onClick={handleFindRoute}
                disabled={!userLocation || isSimulating}
                className={`w-full py-3.5 rounded-xl font-bold text-sm shadow-sm transition-all flex items-center justify-center gap-2 ${!userLocation ? 'bg-zinc-100 text-zinc-400 cursor-not-allowed' : 'bg-zinc-900 hover:bg-black text-white active:scale-[0.98]'}`}
            >
                {isSimulating ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <Navigation className="w-4 h-4" />}
                {isSimulating ? "Calculating Route..." : (routeGeoJSON ? "Recalculate Route" : "Find Safe Route")}
            </button>

            {destinationName && (
                <div className="mt-2 pt-5 border-t border-zinc-200 flex flex-col gap-4">
                    <div>
                        <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Destination</div>
                        <div className="text-xl font-bold text-zinc-900 leading-tight" title={destinationName}>{destinationName}</div>
                    </div>
                    
                    <button 
                        onClick={handlePrepareSMS}
                        className="w-full py-3.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 bg-blue-600 shadow-md shadow-blue-600/20 text-white hover:bg-blue-700 active:scale-[0.98]"
                    >
                        <Smartphone className="w-4 h-4" />
                        Open SMS Dispatch
                    </button>
                </div>
            )}
        </div>
    </div>
  );
}
