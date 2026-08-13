import React, { useState, useEffect } from 'react';
import { LifeBuoy, AlertTriangle, Users, MapPin, Loader2, ArrowRight } from 'lucide-react';

export default function RescueDashboard({ onSelectGroup, onStrandedLoaded }: { onSelectGroup: (group: any) => void, onStrandedLoaded: (groups: any[]) => void }) {
  const [strandedGroups, setStrandedGroups] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStranded();
  }, []);

  const fetchStranded = async () => {
    try {
      const res = await fetch('/api/rescue/stranded');
      const data = await res.json();
      if (data.status === 'success') {
        setStrandedGroups(data.data);
        onStrandedLoaded(data.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const getTierColor = (tier: string) => {
    if (tier === 'CRITICAL') return 'bg-red-100 text-red-700 border-red-200';
    if (tier === 'HIGH') return 'bg-orange-100 text-orange-700 border-orange-200';
    return 'bg-yellow-100 text-yellow-700 border-yellow-200';
  };

  return (
    <div className="pointer-events-auto bg-white/95 backdrop-blur-md p-5 rounded-2xl shadow-xl border border-red-200/50 max-w-[380px] w-full flex flex-col gap-4 max-h-[80vh]">
      
      {/* Header */}
      <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
              <div className="p-2 bg-red-50 rounded-xl text-red-600">
                  <LifeBuoy className="w-5 h-5" />
              </div>
              <div>
                  <h2 className="text-sm font-bold text-red-900 tracking-tight leading-none">Rescue Dispatch</h2>
                  <p className="text-[10px] text-red-500 font-medium mt-1 leading-tight">Live SOS Triage</p>
              </div>
          </div>
          <div className="flex items-center gap-1 bg-red-100 px-2 py-1 rounded-full text-red-700 font-bold text-[9px]">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
            LIVE
          </div>
      </div>

      <p className="text-xs text-gray-600 font-medium">
          Triaging {strandedGroups.length} locations based on elevation data.
      </p>

      {/* List */}
      <div className="flex flex-col gap-3 overflow-y-auto pr-1 pb-2 custom-scrollbar">
          {isLoading ? (
              <div className="py-10 flex justify-center text-red-300">
                  <Loader2 className="w-6 h-6 animate-spin" />
              </div>
          ) : (
              strandedGroups.map((group, index) => (
                  <div 
                      key={group.id} 
                      onClick={() => onSelectGroup(group)}
                      className="p-3 rounded-xl border border-gray-100 bg-white shadow-sm hover:shadow-md hover:border-red-200 transition-all cursor-pointer flex flex-col gap-2 group/card"
                  >
                      <div className="flex justify-between items-center">
                          <div className="text-xs font-black text-gray-800 flex items-center gap-1.5">
                              <span className="text-gray-400">#{index + 1}</span> {group.id}
                          </div>
                          <div className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border ${getTierColor(group.tier)}`}>
                              {group.tier}
                          </div>
                      </div>

                      <div className="flex justify-between items-end mt-1">
                          <div className="flex flex-col gap-1.5">
                              <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-600">
                                  <AlertTriangle className="w-3.5 h-3.5 text-orange-500" />
                                  Elev: {group.elevation}m
                              </div>
                          </div>
                          <div className="flex items-center gap-1 text-[10px] font-bold text-gray-400 group-hover/card:text-red-500 transition-colors">
                              <MapPin className="w-3 h-3" />
                              View <ArrowRight className="w-3 h-3" />
                          </div>
                      </div>
                  </div>
              ))
          )}
      </div>

    </div>
  );
}
