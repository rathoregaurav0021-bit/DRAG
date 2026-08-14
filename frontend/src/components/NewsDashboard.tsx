import React, { useState, useEffect } from 'react';
import { CloudRain, Wind, Droplets, ThermometerSun, AlertCircle, Newspaper, Radio, Loader2 } from 'lucide-react';

export default function NewsDashboard() {
  const [weatherData, setWeatherData] = useState({
    temp: '--°C',
    condition: 'Loading...',
    humidity: '--%',
    wind: '-- km/h'
  });

  const [newsItems, setNewsItems] = useState<any[]>([]);
  const [isLoadingNews, setIsLoadingNews] = useState(true);

  useEffect(() => {
    // Fetch Weather
    fetch('/api/weather')
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success') {
          setWeatherData(data.data);
        }
      })
      .catch(err => console.error(err));

    // Fetch News
    fetch('/api/news')
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success') {
          setNewsItems(data.data);
        }
        setIsLoadingNews(false);
      })
      .catch(err => {
        console.error(err);
        setIsLoadingNews(false);
      });
  }, []);



  return (
    <div className="pointer-events-auto bg-white/80 backdrop-blur-xl p-5 rounded-3xl shadow-2xl border border-white/50 w-[340px] flex flex-col gap-5">
      
      {/* Weather Header */}
      <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-4 text-white shadow-inner relative overflow-hidden">
        {/* Decorative background circle */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
        
        <div className="flex justify-between items-start relative z-10">
          <div>
            <h2 className="text-sm font-bold text-blue-100 uppercase tracking-widest mb-1">Bhuragaon, Assam</h2>
            <div className="flex items-center gap-2">
              <span className="text-4xl font-black">{weatherData.temp}</span>
              <CloudRain className="w-8 h-8 text-blue-200" />
            </div>
            <p className="text-sm font-medium mt-1">{weatherData.condition}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-white/20 relative z-10">
          <div className="flex items-center gap-2">
            <Droplets className="w-4 h-4 text-blue-200" />
            <span className="text-xs font-semibold">{weatherData.humidity} Humidity</span>
          </div>
          <div className="flex items-center gap-2">
            <Wind className="w-4 h-4 text-blue-200" />
            <span className="text-xs font-semibold">{weatherData.wind} Wind</span>
          </div>
        </div>
      </div>

      {/* News Feed */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2 text-[#233a77]">
            <Radio className="w-4 h-4 animate-pulse text-red-500" />
            <h3 className="font-black text-sm uppercase tracking-wider">Live Updates</h3>
          </div>
        </div>
        
        <div className="flex flex-col gap-3">
          {isLoadingNews ? (
            <div className="flex justify-center py-4">
              <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
            </div>
          ) : newsItems.length > 0 ? (
            newsItems.map(item => (
              <div key={item.id} className="group bg-white p-3 rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-200 transition-all cursor-pointer flex gap-3 items-start">
                <div className={`mt-0.5 p-1.5 rounded-lg shrink-0 ${
                  item.type === 'alert' ? 'bg-red-100 text-red-600' :
                  item.type === 'warning' ? 'bg-orange-100 text-orange-600' :
                  'bg-blue-100 text-blue-600'
                }`}>
                  {item.type === 'news' ? <Newspaper className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                </div>
                <div className="flex flex-col gap-1">
                  <h4 className="text-xs font-bold text-gray-800 leading-tight group-hover:text-blue-600 transition-colors">{item.title}</h4>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wide truncate max-w-[150px]">{item.source}</span>
                    <span className="text-[9px] font-bold text-blue-400 whitespace-nowrap">{item.time}</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-xs text-gray-400 text-center py-4">No live updates available.</div>
          )}
        </div>
      </div>

    </div>
  );
}
