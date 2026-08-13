"use client";
import React, { useState, useEffect } from 'react';
import { Users, MapPin, Clock, MessageSquare, AlertCircle, RefreshCw, Send, CheckCircle2, X } from 'lucide-react';
import dynamic from 'next/dynamic';

const MiniRouteMap = dynamic(() => import('./MiniRouteMap'), { ssr: false });

export default function RecipientsDashboard() {
  const [recipients, setRecipients] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<any | null>(null);

  useEffect(() => {
    fetchRecipients();
    const interval = setInterval(fetchRecipients, 5000); // Poll every 5s
    return () => clearInterval(interval);
  }, []);

  const fetchRecipients = async () => {
    try {
      const res = await fetch('/api/sms/recipients');
      const data = await res.json();
      if (data.status === 'success') {
        setRecipients(data.data);
      }
    } catch (e) {
      console.error("Failed to fetch recipients");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full h-full bg-white rounded-3xl shadow-[0_20px_50px_rgba(8,_112,_184,_0.1)] flex flex-col border border-gray-100 overflow-hidden">
      
      {/* Header Area */}
      <div className="bg-gradient-to-r from-[#233a77] to-[#3f7ce0] p-8 flex items-center justify-between shrink-0 shadow-sm z-10">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white/20 rounded-xl backdrop-blur-md">
            <Users className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-white font-extrabold text-2xl tracking-tight">Active Dispatches</h1>
            <p className="text-[#e1f1ee] text-sm mt-1 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> Real-time evacuation tracking log
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {isLoading && <RefreshCw className="w-5 h-5 text-white animate-spin opacity-70" />}
          <div className="bg-white px-5 py-2 rounded-xl text-[#233a77] font-extrabold text-lg shadow-lg flex items-center gap-2">
            Total Dispatched: <span className="text-[#3f7ce0]">{recipients.length}</span>
          </div>
        </div>
      </div>

      {/* Table Area */}
      <div className="flex-1 overflow-auto bg-gray-50/50 p-6">
        
        {isLoading && recipients.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-pulse flex flex-col items-center opacity-60">
               <RefreshCw className="w-12 h-12 text-[#233a77] animate-spin mb-4" />
               <span className="font-semibold text-gray-500">Syncing with backend...</span>
            </div>
          </div>
        ) : recipients.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full opacity-60">
            <AlertCircle className="w-16 h-16 text-gray-400 mb-4" />
            <h3 className="text-xl font-bold text-gray-600 mb-2">No Evacuations Dispatched</h3>
            <p className="text-gray-500 max-w-md text-center">Use the AI Evacuation tab to find a safe route, then dispatch an SMS warning to populate this list.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider w-40">Recipient Mobile</th>
                  <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider w-48">Coordinates</th>
                  <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider w-56">Safe Zone (Landmark)</th>
                  <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider w-40">Dispatch Time</th>
                  <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">SMS Payload</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recipients.slice().reverse().map((rec, idx) => (
                  <tr key={idx} className="hover:bg-[#f8fafc] transition-colors group">
                    <td className="py-5 px-6">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                        <span className="font-extrabold text-[#233a77] text-base">{rec.phone_number}</span>
                      </div>
                    </td>
                    <td className="py-5 px-6">
                      <div className="flex items-center gap-2 text-gray-600 font-mono text-xs bg-gray-100 py-1.5 px-3 rounded-lg w-max">
                        <MapPin className="w-3.5 h-3.5 text-gray-400" />
                        {rec.destination_coords || "N/A"}
                      </div>
                    </td>
                    <td className="py-5 px-6">
                      <div className="font-bold text-gray-800 flex items-center gap-2">
                        {rec.destination_name !== "Elevated Safe Zone" && rec.destination_name !== "Unknown Safe Area" ? (
                          <span className="bg-green-100 text-green-800 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full shrink-0">Verified</span>
                        ) : (
                          <span className="bg-yellow-100 text-yellow-800 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full shrink-0">Approx</span>
                        )}
                        <span className="truncate">{rec.destination_name}</span>
                      </div>
                    </td>
                    <td className="py-5 px-6 text-sm text-gray-500 font-medium">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4 opacity-50" />
                        {rec.timestamp}
                      </div>
                    </td>
                    <td className="py-5 px-6">
                      <div className="bg-[#f1f5f9] p-3 rounded-xl border border-[#e2e8f0] text-sm text-gray-700 font-medium relative transition-all flex flex-col gap-3">
                         <div>{rec.message}</div>
                         
                         {/* Map Screenshot (Mini Route Map) */}
                         {rec.destination_coords && (
                           <div 
                             className="rounded-lg overflow-hidden border border-gray-300 shadow-sm relative h-[150px] bg-gray-100 flex items-center justify-center cursor-pointer group/img"
                             onClick={() => setSelectedImage(rec)}
                           >
                             <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold z-10 pointer-events-none">
                               Click to Expand
                             </div>
                             <div className="absolute inset-0 z-10"></div> {/* Click capture overlay */}
                             <MiniRouteMap 
                               routeGeoJSON={rec.route_geojson} 
                               destinationCoords={[parseFloat(rec.destination_coords.split(',')[0]), parseFloat(rec.destination_coords.split(',')[1])]} 
                               interactive={false}
                             />
                           </div>
                         )}

                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Full Screen Image Modal */}
      {selectedImage && (
        <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-8" onClick={() => setSelectedImage(null)}>
          <div className="relative max-w-5xl w-full max-h-full flex flex-col items-center">
            <button 
              className="absolute -top-12 right-0 text-white bg-white/20 hover:bg-white/40 p-2 rounded-full transition-colors"
              onClick={() => setSelectedImage(null)}
            >
              <X className="w-6 h-6" />
            </button>
            <div className="w-full h-[70vh] rounded-xl overflow-hidden shadow-2xl border-2 border-white/20 bg-white" onClick={(e) => e.stopPropagation()}>
              <MiniRouteMap 
                routeGeoJSON={selectedImage.route_geojson} 
                destinationCoords={[parseFloat(selectedImage.destination_coords.split(',')[0]), parseFloat(selectedImage.destination_coords.split(',')[1])]} 
                interactive={true}
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
