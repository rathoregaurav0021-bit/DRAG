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
    <div className="bg-white border border-gray-300 shadow-sm w-full flex flex-col pointer-events-auto h-full max-h-[80vh]">
      
      {/* Header */}
      <div className="flex justify-between items-start p-4 border-b border-gray-200 bg-slate-900 text-white">
          <div className="flex items-center gap-3">
              <LifeBuoy className="w-5 h-5 text-red-500" />
              <div>
                  <h2 className="text-sm font-bold tracking-tight leading-none uppercase">Rescue Dispatch</h2>
                  <p className="text-xs text-slate-400 font-mono mt-1 leading-tight">Live SOS Triage</p>
              </div>
          </div>

      </div>

      <div className="p-3 bg-gray-50 border-b border-gray-200">
          <p className="text-xs text-gray-700 font-medium">
              Triaging {strandedGroups.length} locations based on elevation data.
          </p>
      </div>

      {/* List */}
      <div className="flex flex-col overflow-y-auto custom-scrollbar">
          {isLoading ? (
              <div className="py-10 flex justify-center text-red-500">
                  <Loader2 className="w-6 h-6 animate-spin" />
              </div>
          ) : (
              strandedGroups.map((group, index) => (
                  <div 
                      key={group.id} 
                      onClick={() => onSelectGroup(group)}
                      className="p-4 border-b border-gray-200 bg-white hover:bg-red-50 hover:border-red-200 transition-colors cursor-pointer flex flex-col gap-3 group/card"
                  >
                      <div className="flex justify-between items-center">
                          <div className="text-sm font-black text-slate-800 flex items-center gap-2">
                              <span className="text-gray-400 font-mono">#{index + 1}</span> {group.id}
                          </div>
                          <div className={`text-[10px] font-black uppercase px-2 py-1 border ${getTierColor(group.tier)}`}>
                              {group.tier}
                          </div>
                      </div>

                      <div className="flex justify-between items-end">
                          <div className="flex flex-col gap-1.5">
                              <div className="flex items-center gap-1.5 text-xs font-bold text-gray-700">
                                  <AlertTriangle className="w-4 h-4 text-orange-600" />
                                  Elev: {group.elevation}m
                              </div>
                          </div>
                          <div className="flex items-center gap-1 text-[11px] font-bold text-slate-400 group-hover/card:text-red-600 transition-colors uppercase tracking-wider">
                              <MapPin className="w-3.5 h-3.5" />
                              View <ArrowRight className="w-3.5 h-3.5" />
                          </div>
                      </div>
                  </div>
              ))
          )}
      </div>

    </div>
  );
}
