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
    <div className="w-full h-full flex flex-col bg-white">
      
      {/* Weather Header */}
      <div className="bg-slate-900 text-white p-4 border-b border-gray-300">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-xs font-bold text-slate-300 uppercase tracking-widest mb-1">Bhuragaon, Assam</h2>
            <div className="flex items-center gap-2">
              <span className="text-3xl font-black">{weatherData.temp}</span>
              <CloudRain className="w-6 h-6 text-slate-300" />
            </div>
            <p className="text-sm font-medium mt-1">{weatherData.condition}</p>
          </div>
        </div>

        <div className="flex gap-4 mt-4 pt-3 border-t border-slate-700">
          <div className="flex items-center gap-2">
            <Droplets className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-semibold">{weatherData.humidity} Humidity</span>
          </div>
          <div className="flex items-center gap-2">
            <Wind className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-semibold">{weatherData.wind} Wind</span>
          </div>
        </div>
      </div>

      {/* News Feed */}
      <div className="p-4 flex flex-col gap-3">
        <div className="flex items-center gap-2 text-slate-800 mb-2 border-b border-gray-200 pb-2">
          <Radio className="w-4 h-4 text-red-600" />
          <h3 className="font-bold text-xs uppercase tracking-wider">Live Updates</h3>
        </div>
        
        <div className="flex flex-col gap-2">
          {isLoadingNews ? (
            <div className="flex justify-center py-4">
              <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
            </div>
          ) : newsItems.length > 0 ? (
            newsItems.map(item => (
              <div key={item.id} className="group bg-white p-3 border border-gray-200 hover:border-slate-800 transition-colors cursor-pointer flex gap-3 items-start">
                <div className={`mt-0.5 shrink-0 ${
                  item.type === 'alert' ? 'text-red-600' :
                  item.type === 'warning' ? 'text-orange-600' :
                  'text-blue-600'
                }`}>
                  {item.type === 'news' ? <Newspaper className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                </div>
                <div className="flex flex-col gap-1 w-full">
                  <h4 className="text-xs font-bold text-slate-800 leading-tight group-hover:underline">{item.title}</h4>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide truncate max-w-[150px]">{item.source}</span>
                    <span className="text-[10px] font-mono text-slate-500 whitespace-nowrap">{item.time}</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-xs text-slate-500 text-center py-4">No live updates available.</div>
          )}
        </div>
      </div>

    </div>
  );
}
