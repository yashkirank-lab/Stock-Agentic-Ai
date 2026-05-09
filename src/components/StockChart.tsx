import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid,
  BarChart,
  Bar
} from 'recharts';
import { formatCurrency, cn } from '../lib/utils';
import { Loader2, TrendingUp, TrendingDown, Clock, ChevronDown, Maximize2, Settings, LayoutGrid } from 'lucide-react';
import { useState } from 'react';

interface ChartProps {
  symbol: string;
  timeframe?: string;
}

export default function StockChart({ symbol, timeframe = '1D' }: ChartProps) {
  const [internalDays, setInternalDays] = useState<number | null>(null);
  const [showKeyEvents, setShowKeyEvents] = useState(true);
  const [chartType, setChartType] = useState<'mountain' | 'bar'>('mountain');

  // Map timeframe labels to days
  const daysMap: Record<string, number> = {
    '1D': 1,
    '5D': 5,
    '1M': 30,
    '6M': 180,
    'YTD': 120,
    '1Y': 365,
    '5Y': 1825,
    'ALL': 3650
  };

  const days = internalDays || daysMap[timeframe] || 1;
  
  const { data, isLoading } = useQuery({
    queryKey: ['history', symbol, days],
    queryFn: async () => {
      const { data } = await axios.get(`/api/stocks/${symbol}/history?days=${days}`);
      return data;
    },
    refetchInterval: 10000
  });

  if (isLoading) {
    return (
      <div className="h-[450px] flex items-center justify-center bg-[#121417]">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="animate-spin text-[#00BD84]" size={32} />
          <span className="text-[11px] font-bold text-[#9299A6] uppercase tracking-widest">Loading Chart Data...</span>
        </div>
      </div>
    );
  }

  const lastPrice = data?.[data.length - 1]?.close || 0;
  const firstPrice = data?.[0]?.close || 0;
  const isUp = lastPrice >= firstPrice;

  return (
    <div className="bg-[#121417] relative flex flex-col">
      {/* Chart Controls */}
      <div className="px-6 py-4 flex items-center justify-between border-b border-[#2A2E35]">
        <div className="flex bg-[#1E2228] p-1 rounded overflow-x-auto no-scrollbar max-w-[50%]">
          {[
            { label: '1D', val: 1 },
            { label: '5D', val: 5 },
            { label: '1M', val: 30 },
            { label: '6M', val: 180 },
            { label: 'YTD', val: 120 },
            { label: '1Y', val: 365 },
            { label: '5Y', val: 1825 },
            { label: 'All', val: 3650 }
          ].map((t) => (
            <button
              key={t.label}
              onClick={() => setInternalDays(t.val)}
              className={cn(
                "px-3 py-1.5 rounded text-[11px] font-bold transition-all whitespace-nowrap",
                days === t.val
                  ? 'bg-[#3A3F4B] text-white' 
                  : 'text-[#9299A6] hover:text-white'
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-6">
           <div className="flex items-center gap-2">
              <button 
                onClick={() => setShowKeyEvents(!showKeyEvents)}
                className={cn("w-8 h-4 rounded-full relative transition-colors duration-200", showKeyEvents ? "bg-[#00BD84]" : "bg-[#2A2E35]")}
              >
                 <div className={cn("w-3 h-3 bg-white rounded-full absolute top-0.5 transition-all duration-200", showKeyEvents ? "left-[18px]" : "left-0.5")} />
              </button>
              <span className="text-[12px] font-bold text-white">Key Events</span>
           </div>

           <button 
             onClick={() => setChartType(chartType === 'mountain' ? 'bar' : 'mountain')}
             className="flex items-center gap-1 text-[12px] font-bold text-white cursor-pointer hover:text-[#00BD84] transition-colors"
           >
              {chartType === 'bar' ? <LayoutGrid size={16} /> : <TrendingUp size={16} />}
              <span className="capitalize">{chartType}</span>
              <ChevronDown size={14} className="text-[#9299A6]" />
           </button>

          <a 
            href={`https://finance.yahoo.com/chart/${symbol}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-[12px] font-bold text-white cursor-pointer hover:text-[#00BD84] transition-colors"
          >
             <Maximize2 size={14} />
             Advanced Chart
          </a>

           <Settings size={16} className="text-[#9299A6] cursor-pointer hover:text-white" />
        </div>
      </div>

      {/* The Chart */}
      <div className="h-[460px] w-full p-6 relative overflow-hidden bg-gradient-to-b from-[#121417] to-[#0C0D0F]">
        <div className="absolute left-6 right-6 top-6 bottom-6 flex flex-col justify-between opacity-10 pointer-events-none">
          {[...Array(8)].map((_, i) => <div key={i} className="h-[1px] w-full bg-[#9299A6] border-t border-dashed border-[#9299A6]/20" />)}
        </div>
        
        {/* Baseline / Support Levels */}
        <div className="absolute w-full h-[1px] border-t border-dashed border-[#FF333A]/20 top-[60%] left-0 z-0" />
        <div className="absolute w-full h-[1px] border-t border-dashed border-[#00BD84]/10 top-[20%] left-0 z-0" />

        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'mountain' ? (
            <AreaChart data={data} margin={{ top: 20, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="mountain" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={isUp ? "#00BD84" : "#FF333A"} stopOpacity={0.4}/>
                  <stop offset="95%" stopColor={isUp ? "#00BD84" : "#FF333A"} stopOpacity={0}/>
                </linearGradient>
                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>
              <XAxis 
                dataKey="time" 
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#4A4F59', fontSize: 9, fontWeight: 900 }}
                minTickGap={40}
                padding={{ left: 20, right: 20 }}
              />
              <YAxis 
                orientation="right"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#4A4F59', fontSize: 9, fontWeight: 900 }}
                domain={['auto', 'auto']}
              />
              <Tooltip 
                cursor={{ stroke: '#00BD84', strokeWidth: 1, strokeDasharray: '4 4' }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const d = payload[0].payload;
                    return (
                      <div className="bg-[#0C0D0F]/95 border border-[#00BD84]/30 p-4 shadow-[0_20px_40px_rgba(0,0,0,0.8)] backdrop-blur-xl min-w-[200px] rounded-xl">
                        <div className="flex items-center gap-2 mb-3 border-b border-[#2A2E35] pb-2">
                           <Clock size={12} className="text-[#00BD84]" />
                           <span className="text-[10px] text-white font-black uppercase tracking-[0.2em]">{d.date} • {d.time}</span>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-[9px] text-[#4A4F59] font-black uppercase tracking-widest">Close</span>
                            <span className="text-[12px] text-white font-mono font-black italic">{d.close.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-[9px] text-[#4A4F59] font-black uppercase tracking-widest">High / Low</span>
                            <span className="text-[10px] text-[#00BD84] font-mono font-bold">{d.high.toFixed(2)} / {d.low.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between items-center border-t border-[#2A2E35] pt-2 mt-2">
                            <span className="text-[9px] text-[#4A4F59] font-black uppercase tracking-widest">Institutional Vol</span>
                            <span className="text-[11px] text-white font-mono font-bold">{(d.volume / 1000000).toFixed(2)}M</span>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area 
                type="monotone" 
                dataKey="close" 
                stroke={isUp ? "#00BD84" : "#FF333A"} 
                strokeWidth={2}
                fill="url(#mountain)"
                animationDuration={2000}
                activeDot={{ r: 6, fill: isUp ? "#00BD84" : "#FF333A", stroke: '#121417', strokeWidth: 3 }}
                style={{ filter: 'url(#glow)' }}
              />

              {/* Simulated SMA/EMA Lines */}
              <Area
                type="monotone"
                dataKey="close"
                stroke="#3A3F4B"
                strokeWidth={1}
                strokeDasharray="5 5"
                fill="none"
                opacity={0.3}
              />

              {/* Simulated Key Events */}
              {showKeyEvents && data && data.length > 0 && (
                [
                  data[Math.floor(data.length * 0.15)],
                  data[Math.floor(data.length * 0.45)],
                  data[Math.floor(data.length * 0.75)]
                ].map((event, i) => (
                  <Area
                    key={`event-${i}`}
                    type="monotone"
                    data={[event]}
                    dataKey="close"
                    stroke="none"
                    fill="none"
                    label={(props: any) => {
                      const { x, y } = props;
                      return (
                        <g transform={`translate(${x},${y - 25})`}>
                          <rect x="-35" y="-14" width="70" height="18" rx="4" fill="#00BD84" style={{ filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.4))' }} />
                          <text y="-2" textAnchor="middle" fill="black" fontSize="8" fontWeight="900" letterSpacing="1px">AI SIGNAL</text>
                          <line x1="0" y1="4" x2="0" y2="25" stroke="#00BD84" strokeWidth="1" strokeDasharray="2 2" />
                        </g>
                      );
                    }}
                  />
                ))
              )}
            </AreaChart>
          ) : (
            <BarChart data={data} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
              <XAxis 
                dataKey="time" 
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#9299A6', fontSize: 10, fontWeight: 600 }}
                minTickGap={30}
              />
              <YAxis 
                orientation="right"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#9299A6', fontSize: 10, fontWeight: 600 }}
                domain={['auto', 'auto']}
              />
              <Tooltip 
                cursor={{ fill: 'white', opacity: 0.05 }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const d = payload[0].payload;
                    return (
                      <div className="bg-[#121417]/95 border border-[#2A2E35] p-3 shadow-2xl backdrop-blur-md min-w-[160px] rounded">
                         <div className="flex justify-between gap-4 mb-2">
                          <span className="text-[10px] text-[#9299A6] font-bold">Price:</span>
                          <span className="text-[10px] text-white font-mono font-bold">{d.close.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar 
                dataKey="close" 
                fill={isUp ? "#00BD84" : "#FF333A"} 
                radius={[2, 2, 0, 0]}
                animationDuration={1000}
              />
            </BarChart>
          )}
        </ResponsiveContainer>

        {/* Current Price Marker */}
        <div className="absolute right-0 top-[40%] bg-[#FF333A] text-white text-[10px] font-bold px-2 py-1 rounded-l shadow-lg z-10">
           {lastPrice.toLocaleString(undefined, { minimumFractionDigits: 1 })}
        </div>
      </div>
    </div>
  );
}
