import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { ShieldCheck, AlertTriangle, ExternalLink, Info, Activity, Bot } from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';
import { motion } from 'motion/react';

import { useStore } from '../store/useStore';

interface ResearchProps {
  symbol: string;
}

export default function ResearchPanel({ symbol }: ResearchProps) {
  const store = useStore();
  const watchlist = store.getWatchlist();
  const toggleWatchlist = store.toggleWatchlist;
  const isInWatchlist = watchlist.includes(symbol.toUpperCase());

  const { data, isLoading } = useQuery({
    queryKey: ['research', symbol],
    queryFn: async () => {
      const { data } = await axios.get(`/api/research/${symbol}`);
      return data;
    },
    refetchInterval: 300000
  });

  if (isLoading) return (
    <div className="h-full bg-[#0A0B0E] p-6 space-y-6">
      <div className="h-8 bg-[#1A1D24] animate-pulse rounded w-1/2" />
      <div className="h-40 bg-[#1A1D24] animate-pulse rounded" />
      <div className="h-40 bg-[#1A1D24] animate-pulse rounded" />
    </div>
  );

  return (
    <div className="bg-[#0C0D0F] h-full flex flex-col font-sans">
      <div className="p-6 border-b border-[#24272E] flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Bot size={18} className="text-[#00BD84]" />
          <span className="text-[11px] font-black text-white uppercase tracking-[0.2em]">Strategy Terminal</span>
        </div>
        <div 
          className="px-3 py-1 rounded-full text-[10px] font-black border"
          style={{ 
            backgroundColor: `${data.colorScheme}1A`, // 10% opacity
            color: data.colorScheme,
            borderColor: `${data.colorScheme}33` // 20% opacity
          }}
        >
          {data.safetyLevel}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        {/* Safety Score Section */}
        <section className="bg-gradient-to-br from-[#16191E] to-[#0C0D0F] p-8 rounded-2xl border border-[#24272E] text-center shadow-lg">
          <div 
            className="text-6xl font-black font-mono tracking-tighter mb-2"
            style={{ color: data.colorScheme }}
          >
            {data.safetyScore}
          </div>
          <div className="text-[10px] font-black text-[#4A4F59] uppercase tracking-widest leading-none">Safety Score</div>
          <p className="mt-4 text-[11px] text-[#9299A6] italic">"Based on how many big banks are buying and how much money the company keeps."</p>
        </section>

        {/* Growth Potential */}
        <section className="space-y-4">
          <h3 className="text-[10px] font-black text-white uppercase tracking-[0.2em] flex items-center gap-3">
             <span className="w-6 h-[1px] bg-[#00BD84]"></span> The Profit Plan
          </h3>
          <div className="grid grid-cols-1 gap-4">
            {data.strategy.map((item: any, i: number) => (
              <div key={i} className="bg-[#16191E] p-4 rounded-xl border border-[#24272E] hover:border-[#00BD84]/30 transition-all">
                <span className="block text-[9px] text-[#4A4F59] font-black uppercase tracking-widest mb-1">{item.goal}</span>
                <span className="text-[13px] font-bold text-white leading-tight">{item.value}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Simple Facts */}
        <section className="space-y-4">
          <h3 className="text-[10px] font-black text-white uppercase tracking-[0.2em] flex items-center gap-3">
             <span className="w-6 h-[1px] bg-[#00BD84]"></span> Simple Truths
          </h3>
          <div className="space-y-4">
            {data.simpleFacts.map((fact: any, i: number) => (
              <div key={i} className="flex gap-4 items-start group">
                <div className="mt-1 w-1.5 h-1.5 rounded-full bg-[#00BD84] shrink-0 shadow-[0_0_8px_rgba(0,189,132,0.4)] group-hover:scale-125 transition-transform" />
                <div>
                  <h4 className="text-[11px] font-black text-white uppercase tracking-tight mb-1">{fact.title}</h4>
                  <p className="text-[12px] text-[#9299A6] leading-relaxed">{fact.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Analyst Ratings */}
        {data.analystRatings && (
          <section className="space-y-4">
            <h3 className="text-[10px] font-black text-white uppercase tracking-[0.2em] flex items-center gap-3">
               <span className="w-6 h-[1px] bg-[#00BD84]"></span> Analyst Consensus
            </h3>
            <div className="bg-[#16191E] border border-[#24272E] rounded-xl overflow-hidden shadow-sm">
               <div className="p-4 border-b border-[#24272E] flex flex-wrap justify-between items-end gap-2">
                  <div className="min-w-0">
                    <span className="text-[9px] text-[#4A4F59] font-black uppercase tracking-widest block mb-1">Target Price</span>
                    <span className="text-lg font-bold text-white truncate block">{formatCurrency(data.analystRatings.targetPrice)}</span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[9px] text-[#4A4F59] font-black uppercase tracking-widest block mb-1">Rating</span>
                    <span className={cn("text-[10px] font-black px-2 py-0.5 rounded inline-block", 
                      data.analystRatings.recommendation.includes('BUY') ? "bg-[#00BD84]/10 text-[#00BD84]" :
                      data.analystRatings.recommendation.includes('SELL') ? "bg-rose-500/10 text-rose-500" :
                      "bg-amber-400/10 text-amber-400"
                    )}>
                      {data.analystRatings.recommendation}
                    </span>
                  </div>
               </div>
               
               {data.analystRatings.trends && (
                 <div className="p-4 space-y-3">
                   <div className="flex justify-between items-center text-[10px] uppercase font-bold text-[#9299A6]">
                     <span>Trend Breakdown</span>
                     <span>{data.analystRatings.ratingCount} Analysts</span>
                   </div>
                   <div className="flex h-2 w-full rounded-full overflow-hidden bg-[#0C0D0F]">
                     <div style={{ width: `${data.analystRatings.ratingCount > 0 ? (data.analystRatings.trends.strongBuy + data.analystRatings.trends.buy) / data.analystRatings.ratingCount * 100 : 0}%` }} className="bg-[#00BD84]" />
                     <div style={{ width: `${data.analystRatings.ratingCount > 0 ? data.analystRatings.trends.hold / data.analystRatings.ratingCount * 100 : 0}%` }} className="bg-amber-400" />
                     <div style={{ width: `${data.analystRatings.ratingCount > 0 ? (data.analystRatings.trends.sell + data.analystRatings.trends.strongSell) / data.analystRatings.ratingCount * 100 : 0}%` }} className="bg-rose-500" />
                   </div>
                   <div className="flex justify-between text-[9px] font-black uppercase tracking-tighter">
                     <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-[#00BD84]" /> Buy</div>
                     <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-amber-400" /> Hold</div>
                     <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-rose-500" /> Sell</div>
                   </div>
                 </div>
               )}
            </div>
          </section>
        )}

        {/* AI Insight Section */}
        <section className="bg-[#00BD84]/5 border-l-4 border-l-[#00BD84] p-5 rounded-r-xl space-y-4">
           <div className="flex items-center gap-2">
              <Bot size={16} className="text-[#00BD84]" />
              <h3 className="text-[10px] font-black text-white uppercase tracking-[0.2em]">AI PROFIT CHEAT PLAN</h3>
           </div>
           
           <div className="space-y-3">
              <div>
                <span className="text-[8px] text-[#4A4F59] uppercase tracking-widest block mb-1 font-black">MARKET PULSE</span>
                <p className="text-[11px] text-white font-bold leading-tight">
                  {data.analystRatings?.recommendation.includes('BUY') 
                    ? "Asset showing dominant technical strength. Institutional smart money is currently positioning for expansion."
                    : "Market is currently evaluating new price floor. Strategic patience is advised until key levels are reclaimed."}
                </p>
              </div>
              
              <div className="bg-[#1A1D24] p-3 rounded border border-[#00BD84]/20">
                <span className="text-[8px] text-[#00BD84] font-black uppercase tracking-widest block mb-1">PRO ADVICE</span>
                <p className="text-[10px] text-white font-black">
                   {data.analystRatings?.recommendation.includes('BUY') 
                     ? "ACCUMULATE - Ride the wave with tight stops." 
                     : "WATCH LIST - Wait for confirmed bounce."}
                </p>
              </div>
           </div>
        </section>

        {/* System Guide */}
        <section className="bg-[#0C0D0F] border border-[#24272E] rounded-xl p-5 space-y-4">
           <h4 className="text-[10px] font-black text-[#4A4F59] uppercase tracking-[0.3em]">SYSTEM GUIDE</h4>
           <div className="grid grid-cols-1 gap-3">
              {[
                { dot: '#00BD84', range: '85-100', label: 'ALPHA SIGNAL', desc: 'Secure institutional accumulation.' },
                { dot: '#FFCC00', range: '65-84', label: 'MARKET STEADY', desc: 'Balanced risk/reward ratio.' },
                { dot: '#FF333A', range: '0-64', label: 'VOLATILE', desc: 'High chaos, avoid leverage.' }
              ].map(item => (
                <div key={item.range} className="flex gap-3 items-start">
                   <div className="w-1.5 h-1.5 rounded-full shrink-0 mt-1" style={{ backgroundColor: item.dot }} />
                   <div>
                      <p className="text-[10px] text-white font-black uppercase tracking-tight">{item.range}: {item.label}</p>
                      <p className="text-[9px] text-[#4A4F59] leading-tight">{item.desc}</p>
                   </div>
                </div>
              ))}
           </div>
        </section>

        <button 
          onClick={() => toggleWatchlist(symbol)}
          className={cn(
            "w-full py-4 text-[11px] font-black uppercase tracking-[0.2em] rounded-xl transition-all transform hover:scale-[1.02] active:scale-95 shadow-lg flex items-center justify-center gap-2",
            isInWatchlist 
              ? "bg-[#16191E] text-[#9299A6] border border-[#24272E] hover:bg-[#1A1D24] shadow-none" 
              : "bg-[#00BD84] text-black hover:bg-[#00e09e] shadow-[0_10px_20px_rgba(0,189,132,0.15)]"
          )}
        >
          {isInWatchlist ? 'In Watchlist' : 'Add to Watchlist'}
        </button>
      </div>
    </div>
  );
}
