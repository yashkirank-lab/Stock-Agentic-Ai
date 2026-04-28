import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import React, { useState } from 'react';
import { 
  Briefcase, 
  TrendingUp, 
  TrendingDown, 
  Plus, 
  ArrowUpRight, 
  PieChart as PieIcon,
  Search,
  LayoutGrid,
  Bell,
  Star,
  Clock,
  Bot,
  ExternalLink
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { formatCurrency, formatNumber, cn } from '../lib/utils';
import StockChart from './StockChart';
import ResearchPanel from './ResearchPanel';
import Chat from './Chat';
import { motion, AnimatePresence } from 'motion/react';

const currencySymbols: Record<string, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  KRW: '₩',
  CNY: '¥',
  INR: '₹',
};

export default function Dashboard() {
  const { 
    selectedSymbol, 
    setSelectedSymbol, 
    watchlist, 
    toggleWatchlist, 
    addMessage, 
    notifications,
    addNotification,
    markNotificationRead,
    clearNotifications
  } = useStore();
  const [searchInput, setSearchInput] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Analyst');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showChat, setShowChat] = useState(false);

  const { data: stockData, error: quoteError, isLoading: isQuoteLoading } = useQuery({
    queryKey: ['quote', selectedSymbol],
    queryFn: async () => {
      try {
        const { data } = await axios.get(`/api/stocks/${selectedSymbol}`);
        setSearchError(null);
        
        // Simulate notifications for price movements
        if (Math.abs(data.pctChange) > 5) {
          addNotification({
            title: 'Significant Movement',
            message: `${data.symbol} is ${data.pctChange > 0 ? 'up' : 'down'} ${data.pctChange.toFixed(2)}% today!`,
            type: 'price'
          });
        }
        
        return data;
      } catch (err: any) {
        setSearchError(`Symbol "${selectedSymbol}" not found or service unavailable.`);
        throw err;
      }
    },
    refetchInterval: 5000,
    enabled: !!selectedSymbol,
    retry: false
  });

  const { data: stockNews } = useQuery({
    queryKey: ['news', selectedSymbol],
    queryFn: async () => {
      const { data } = await axios.get(`/api/stocks/${selectedSymbol}/news`);
      return data;
    },
    enabled: !!selectedSymbol,
    refetchInterval: 60000,
  });

  const { data: marketNews } = useQuery({
    queryKey: ['marketNews'],
    queryFn: async () => {
      const { data } = await axios.get(`/api/stocks/^GSPC/news`);
      return data;
    },
    refetchInterval: 60000,
  });

  React.useEffect(() => {
    if (notifications.length === 0) {
      addNotification({
        title: 'App Initialized',
        message: 'APEX AI Market Oversight is active and synchronizing data.',
        type: 'news'
      });
      
      // Delay second notification
      setTimeout(() => {
        addNotification({
          title: 'Earnings Alert: NVDA',
          message: 'NVIDIA reports in 2 days. Expect significant volatility.',
          type: 'earnings'
        });
      }, 3000);
    }
  }, []);

  const handleSearchChange = async (val: string) => {
    setSearchInput(val);
    if (val.length > 1) {
      setIsSearching(true);
      try {
        const { data } = await axios.get(`/api/search?q=${val}`);
        setSearchResults(data);
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        setIsSearching(false);
      }
    } else {
      setSearchResults([]);
    }
  };

  const handleSelectSymbol = (symbol: string) => {
    setSelectedSymbol(symbol);
    setSearchInput('');
    setSearchResults([]);
    setSelectedCategory('Analyst');
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchResults.length > 0) {
      handleSelectSymbol(searchResults[0].symbol);
    } else if (searchInput.trim()) {
      handleSelectSymbol(searchInput.trim().toUpperCase());
    }
  };

  const { data: marketIndices } = useQuery({
    queryKey: ['marketIndices'],
    queryFn: async () => {
      const symbols = ['^GSPC', '^DJI', '^IXIC', '^RUT', '^VIX', 'GC=F', 'BTC-USD'];
      const results = await Promise.all(symbols.map(s => axios.get(`/api/stocks/${s}`).then(res => res.data)));
      const names = ['S&P 500', 'Dow 30', 'Nasdaq', 'Russell 2000', 'Volatility (VIX)', 'Gold', 'Bitcoin'];
      return results.map((data, i) => ({
        name: names[i],
        symbol: symbols[i],
        value: formatCurrency(data.price),
        change: (data.change >= 0 ? '+' : '') + formatCurrency(data.change),
        pct: (data.pctChange >= 0 ? '+' : '') + data.pctChange.toFixed(2) + '%',
        up: data.change >= 0
      }));
    },
    refetchInterval: 15000, // Refresh indices every 15s
  });

  const displayIndices = marketIndices || [
    { name: 'S&P 500', value: 'Updating...', change: '0.00', pct: '0.00%', up: true },
    { name: 'Dow 30', value: 'Updating...', change: '0.00', pct: '0.00%', up: true },
    { name: 'Nasdaq', value: 'Updating...', change: '0.00', pct: '0.00%', up: true },
    { name: 'Russell 2000', value: 'Updating...', change: '0.00', pct: '0.00%', up: true },
    { name: 'Volatility (VIX)', value: 'Updating...', change: '0.00', pct: '0.00%', up: true },
    { name: 'Gold', value: 'Updating...', change: '0.00', pct: '0.00%', up: true },
    { name: 'Bitcoin', value: 'Updating...', change: '0.00', pct: '0.00%', up: true },
  ];

  const renderContent = () => {
    if (selectedCategory === 'Markets' || !selectedCategory) {
      return (
        <div className="p-6 space-y-12 max-w-[1240px] mx-auto animate-in fade-in duration-500">
          <div className="flex flex-col gap-2">
             <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Global Market Oversight</h2>
             <p className="text-sm text-[#9299A6]">Live institutional index feeds powered by Yahoo Finance.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayIndices.map((idx, i) => (
              <div 
                key={i} 
                className="bg-[#0C0D0F] border border-[#2A2E35] p-6 rounded-xl hover:border-[#00BD84]/50 transition-all group cursor-pointer"
                onClick={() => handleSelectSymbol(idx.symbol)}
              >
                <div className="flex justify-between items-start mb-4">
                  <span className="text-[11px] font-black text-[#4A4F59] uppercase tracking-widest">{idx.name}</span>
                  <div className={cn("px-2 py-1 rounded text-[10px] font-bold", idx.up ? "bg-[#00BD84]/10 text-[#00BD84]" : "bg-[#FF333A]/10 text-[#FF333A]")}>
                    {idx.pct}
                  </div>
                </div>
                <div className="flex items-baseline gap-3">
                  <span className="text-2xl font-black text-white font-mono">{idx.value}</span>
                  <span className={cn("text-xs font-bold font-mono", idx.up ? "text-[#00BD84]" : "text-[#FF333A]")}>{idx.change}</span>
                </div>
                <div className="mt-6 h-12 w-full overflow-hidden opacity-30 group-hover:opacity-60 transition-opacity">
                   <div className={cn("w-full h-full", idx.up ? "bg-[#00BD84]" : "bg-[#FF333A]")} style={{ clipPath: 'polygon(0% 100%, 15% 85%, 30% 90%, 45% 60%, 60% 70%, 75% 40%, 90% 45%, 100% 0%, 100% 100%)' }} />
                </div>
              </div>
            ))}
          </div>

          <div className="bg-[#0C0D0F] border border-[#2A2E35] rounded-xl p-8">
            <h3 className="text-[11px] font-black text-white uppercase tracking-[0.3em] mb-8">Active Movers</h3>
            <div className="space-y-4">
              {[
                { s: 'NVDA', n: 'NVIDIA Corp', p: '902.50', c: '+12.40', up: true },
                { s: 'TSLA', n: 'Tesla, Inc.', p: '175.22', c: '-4.15', up: false },
                { s: 'AAPL', n: 'Apple Inc.', p: '170.12', c: '+0.45', up: true },
                { s: 'AMD', n: 'AMD Inc.', p: '180.44', c: '-2.10', up: false },
              ].map(m => (
                <div 
                  key={m.s} 
                  className="flex items-center justify-between p-4 hover:bg-[#1A1D24] rounded-lg transition-colors cursor-pointer group"
                  onClick={() => handleSelectSymbol(m.s)}
                >
                  <div className="flex gap-4 items-center">
                    <div className="w-10 h-10 bg-[#1A1D24] rounded flex items-center justify-center font-bold text-white group-hover:text-[#00BD84]">{m.s[0]}</div>
                    <div>
                      <div className="text-[13px] font-bold text-white uppercase tracking-tight">{m.s}</div>
                      <div className="text-[10px] text-[#4A4F59]">{m.n}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[13px] font-bold text-white font-mono">{formatCurrency(parseFloat(m.p))}</div>
                    <div className={cn("text-[10px] font-bold font-mono", m.up ? "text-[#00BD84]" : "text-[#FF333A]")}>{m.c}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    if (selectedCategory === 'Explore') {
      return (
        <div className="p-6 space-y-12 max-w-[1240px] mx-auto animate-in fade-in duration-500">
          <div className="flex flex-col gap-2">
             <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Market Discovery</h2>
             <p className="text-sm text-[#9299A6]">Explore high-velocity sectors and hidden institutional gems.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { t: 'AI Infrastructure', d: 'The backbone of the machine learning revolution.', s: 'SMCI', c: 'Technology' },
              { t: 'Energy Storage', d: 'Battery technology and lithium supply chain leaders.', s: 'ALB', c: 'Energy' },
              { t: 'Digital Assets', d: 'Institutional crypto adoption and blockchain tech.', s: 'COIN', c: 'Finance' },
              { t: 'High-Yield Yield', d: 'Reliable cash flow from market-leading dividends.', s: 'O', c: 'Real Estate' },
              { t: 'Green Mobility', d: 'EV manufacturers and charging network providers.', s: 'RIVN', c: 'Automotive' },
              { t: 'Cloud Security', d: 'Protecting the global digital enterprise landscape.', s: 'CRWD', c: 'Cybersecurity' },
            ].map(sec => (
              <div 
                key={sec.t} 
                onClick={() => handleSelectSymbol(sec.s)}
                className="bg-[#0C0D0F] border border-[#2A2E35] p-6 rounded-xl hover:border-[#00BD84]/50 transition-all cursor-pointer group"
              >
                <div className="flex justify-between items-start mb-4">
                  <span className="text-[10px] font-black text-[#4A4F59] uppercase tracking-widest">{sec.c}</span>
                  <ArrowUpRight size={14} className="text-[#4A4F59] group-hover:text-white" />
                </div>
                <h4 className="text-lg font-bold text-white mb-2 group-hover:text-[#00BD84]">{sec.t}</h4>
                <p className="text-xs text-[#9299A6] leading-relaxed mb-4">{sec.d}</p>
                <div className="text-[10px] font-black text-[#00BD84] uppercase tracking-widest">Featured: {sec.s}</div>
              </div>
            ))}
          </div>

          <div className="bg-[#0C0D0F] border border-[#2A2E35] rounded-xl overflow-hidden">
            <div className="p-6 border-b border-[#2A2E35] bg-[#121417]">
               <h3 className="text-[11px] font-black text-white uppercase tracking-[0.3em]">Hidden Gems (High Growth)</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 divide-x divide-y md:divide-y-0 divide-[#2A2E35]">
              {[
                { s: 'ARM', n: 'Arm Holdings', g: 'High' },
                { s: 'PLTR', n: 'Palantir Tech', g: 'V. High' },
                { s: 'MSTR', n: 'MicroStrategy', g: 'Extreme' },
                { s: 'SQ', n: 'Block Inc.', g: 'Medium' },
                { s: 'SOFI', n: 'SoFi Technologies', g: 'High' },
                { s: 'HOOD', n: 'Robinhood Markets', g: 'Medium' },
                { s: 'U', n: 'Unity Software', g: 'High' },
                { s: 'RDDT', n: 'Reddit Inc.', g: 'Medium' },
              ].map(gem => (
                <div 
                  key={gem.s} 
                  onClick={() => handleSelectSymbol(gem.s)}
                  className="p-6 hover:bg-[#1A1D24] transition-colors cursor-pointer group"
                >
                  <div className="text-xs font-black text-[#00BD84] mb-1">{gem.g} UPSIDE</div>
                  <div className="text-lg font-black text-white">{gem.s}</div>
                  <div className="text-[10px] text-[#4A4F59] uppercase font-bold">{gem.n}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-6 bg-[#00BD84]" />
              <h3 className="text-xl font-black text-white uppercase tracking-tighter">Global Market News</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {marketNews?.map((article: any, i: number) => (
                <a 
                  key={i}
                  href={article.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-[#0C0D0F] border border-[#2A2E35] p-6 rounded-xl hover:border-[#00BD84]/50 transition-all flex flex-col group shadow-lg"
                >
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-[10px] font-black text-[#00BD84] uppercase tracking-widest">{article.publisher}</span>
                    <ExternalLink size={14} className="text-[#4A4F59] group-hover:text-white" />
                  </div>
                  <h4 className="text-sm font-bold text-white group-hover:text-[#00BD84] transition-colors leading-snug mb-4">{article.title}</h4>
                  <div className="mt-auto pt-4 border-t border-[#2A2E35] text-[9px] text-[#4A4F59] font-mono uppercase">
                    {new Date(article.providerPublishTime * 1000).toLocaleString()}
                  </div>
                </a>
              ))}
            </div>
          </div>
        </div>
      );
    }

    if (selectedCategory === 'Settings') {
      return (
        <div className="p-6 space-y-12 max-w-[1240px] mx-auto animate-in fade-in duration-500">
          <div className="flex flex-col gap-2">
             <h2 className="text-3xl font-black text-white uppercase tracking-tighter">System Configuration</h2>
             <p className="text-sm text-[#9299A6]">Manage account preferences and data synchronization.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <section className="bg-[#0C0D0F] border border-[#2A2E35] p-8 rounded-xl space-y-6">
              <h3 className="text-[11px] font-black text-white uppercase tracking-[0.3em]">Notification Preferences</h3>
              <div className="space-y-4">
                {[
                  { label: 'Significant Price Changes', active: true },
                  { label: 'Earnings Announcements', active: true },
                  { label: 'Breaking Sector News', active: false },
                  { label: 'Analyst Rating Changes', active: true },
                ].map(opt => (
                  <div key={opt.label} className="flex items-center justify-between group">
                    <span className="text-sm text-[#9299A6] group-hover:text-white transition-colors">{opt.label}</span>
                    <div className={cn("w-8 h-4 rounded-full relative transition-colors", opt.active ? "bg-[#00BD84]" : "bg-[#2A2E35]")}>
                      <div className={cn("absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all", opt.active ? "left-[18px]" : "left-0.5")} />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="bg-[#0C0D0F] border border-[#2A2E35] p-8 rounded-xl space-y-6">
              <h3 className="text-[11px] font-black text-white uppercase tracking-[0.3em]">Data Source Status</h3>
              <div className="space-y-4">
                {[
                  { label: 'Yahoo Finance API', status: 'ACTIVE', color: '#00BD84' },
                  { label: 'SEC EDGAR Feed', status: 'ACTIVE', color: '#00BD84' },
                  { label: 'Twitter Sentiment Engine', status: 'STANDBY', color: '#FFCC00' },
                  { label: 'Neural Strategy Engine', status: 'ACTIVE', color: '#00BD84' },
                ].map(src => (
                  <div key={src.label} className="flex items-center justify-between">
                    <span className="text-sm text-[#9299A6]">{src.label}</span>
                    <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: src.color }}>{src.status}</span>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      );
    }

    if (selectedCategory === 'Research') {
      return (
        <div className="p-6 space-y-12 max-w-[1240px] mx-auto animate-in slide-in-from-bottom-4 duration-500">
           <div className="flex justify-between items-end">
             <div className="flex flex-col gap-2">
                <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Research Terminal</h2>
                <p className="text-sm text-[#9299A6]">Deep-dive institutional logic and proprietary APEX signals.</p>
             </div>
             <div className="flex gap-2">
                {['All', 'Trending', 'Bearish', 'Bullish'].map(f => (
                  <button key={f} className="px-4 py-1.5 rounded-full border border-[#2A2E35] text-[10px] font-bold text-[#9299A6] hover:text-white transition-colors uppercase tracking-widest">{f}</button>
                ))}
             </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { title: 'The Lithium Supply Chain Crunch', symbol: 'LAC', type: 'Commodity Report', color: '#00BD84' },
                { title: 'AI Infrastructure: Beyond NVIDIA', symbol: 'MU', type: 'Tech Deep-Dive', color: '#00C805' },
                { title: 'Consumer Sentiment & Retail Pulse', symbol: 'WMT', type: 'Macro Vectors', color: '#FF333A' },
                { title: 'Cloud Integration Multipliers', symbol: 'MSFT', type: 'Software Alpha', color: '#00BD84' },
              ].map((r, i) => (
                <div 
                  key={i} 
                  className="bg-[#0C0D0F] border border-[#2A2E35] p-8 rounded-xl hover:border-white/20 transition-all cursor-pointer group"
                  onClick={() => handleSelectSymbol(r.symbol)}
                >
                  <div className="flex items-center gap-3 mb-6">
                    <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">{r.type}</span>
                    <span className="w-4 h-[1px] bg-[#2A2E35]"></span>
                    <span className="text-[10px] font-black text-[#00BD84] uppercase tracking-[0.2em]">{r.symbol}</span>
                  </div>
                  <h4 className="text-xl font-bold text-white mb-4 group-hover:text-[#00BD84] transition-colors">{r.title}</h4>
                  <p className="text-sm text-[#4A4F59] leading-relaxed mb-6">Analyzing the structural supply deficit and institutional accumulation patterns over the last 90 trading days.</p>
                  <div className="flex items-center justify-between">
                    <div className="flex -space-x-2">
                      {[1,2,3].map(a => (
                        <div key={a} className="w-6 h-6 rounded-full bg-[#1A1D24] border border-[#0C0D0F] flex items-center justify-center text-[8px] font-bold text-[#9299A6]">A{a}</div>
                      ))}
                      <span className="pl-4 text-[10px] text-[#4A4F59] font-medium">+12 Analysts</span>
                    </div>
                    <ArrowUpRight size={16} className="text-[#4A4F59] group-hover:text-white transition-colors" />
                  </div>
                </div>
              ))}
           </div>
        </div>
      );
    }

    // Default Analyst/Quote View
    return (
      <div className="p-6 space-y-8 max-w-[1240px] mx-auto animate-in fade-in duration-500">
        {searchError && (
          <div className="bg-[#FF333A]/10 border border-[#FF333A]/20 p-4 rounded-xl flex items-center gap-3 text-[#FF333A] text-xs font-bold animate-in slide-in-from-top-2">
            <span className="w-2 h-2 rounded-full bg-[#FF333A] animate-pulse" />
            {searchError}
            <button 
              onClick={() => setSearchError(null)}
              className="ml-auto hover:text-white"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Stock Header Section */}
        {isQuoteLoading ? (
           <div className="h-20 animate-pulse bg-[#0C0D0F] rounded-xl" />
        ) : stockData ? (
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 text-[10px] text-[#4A4F59] font-mono uppercase tracking-[0.2em] mb-2">
                <Clock size={10} className="text-[#00BD84]" /> Real-time • {stockData.symbol} • Exchange Data Active
              </div>
              <div className="flex items-center gap-4 mb-3">
                <h1 className="text-4xl font-black text-white tracking-tighter uppercase">{stockData.name}</h1>
                <button 
                  onClick={() => toggleWatchlist(stockData.symbol)}
                  className={cn(
                    "transition-all duration-200 hover:scale-110 active:scale-95",
                    watchlist.includes(stockData.symbol.toUpperCase()) ? "text-[#00BD84]" : "text-[#4A4F59] hover:text-white"
                  )}
                >
                  <Star size={24} fill={watchlist.includes(stockData.symbol.toUpperCase()) ? "currentColor" : "none"} />
                </button>
              </div>
              <div className="flex items-baseline gap-4">
                <span className="text-5xl font-black text-white tracking-tighter leading-none font-mono">
                  {formatCurrency(stockData.price)}
                </span>
                <div className={cn("flex items-center gap-1 text-xl font-bold font-mono", stockData.change >= 0 ? "text-[#00BD84]" : "text-[#FF333A]")}>
                  {stockData.change >= 0 ? '+' : ''}{formatCurrency(stockData.change)} 
                  <span className="text-sm font-medium opacity-80">({stockData.pctChange >= 0 ? '+' : ''}{stockData.pctChange.toFixed(2)}%)</span>
                  {stockData.change >= 0 ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                </div>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button 
                onClick={() => addMessage({ 
                  role: 'user', 
                  content: `Please explain ${stockData.symbol} to me in simple terms. What does it do and why is it moving?`,
                  timestamp: new Date().toISOString()
                })}
                className="flex items-center gap-2 bg-[#00BD84] text-black px-6 py-3 rounded text-[11px] font-black uppercase tracking-[0.15em] hover:bg-[#00e09e] transition-all transform hover:scale-[1.02] active:scale-95 shadow-[0_0_20px_rgba(0,189,132,0.2)]"
              >
                <Bot size={16} />
                Explain Simpler
              </button>
            </div>
          </div>
        ) : null}

        {/* Main Interactive Chart Section */}
        <div className="bg-[#0C0D0F] border border-[#2A2E35] rounded-xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
          <div className="h-[480px] w-full">
            {selectedSymbol && <StockChart symbol={selectedSymbol} />}
          </div>
          
          {stockData && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-y-8 p-8 border-t border-[#2A2E35] bg-[#0C0D0F]/50">
              {[
                { label: 'Previous Close', value: formatCurrency(stockData.prevClose) },
                { label: 'Day\'s Range', value: stockData.dayRange || 'N/A' },
                { label: 'Market Cap', value: stockData.marketCap },
                { label: 'Price/Earnings', value: stockData.pe },
              ].map((stat) => (
                <div key={stat.label} className="group">
                  <p className="text-[10px] text-[#4A4F59] font-mono uppercase tracking-[0.2em] mb-1.5 transition-colors group-hover:text-[#9299A6]">{stat.label}</p>
                  <p className="text-[14px] font-bold text-white font-mono">{stat.value}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Detailed Company Briefing Section */}
        {stockData && stockData.description && (
          <div className="pb-12">
            <section className="space-y-6">
              <div className="bg-[#0C0D0F] border border-[#2A2E35] rounded-xl p-8 hover:border-[#3A3F4B] transition-colors">
                <h3 className="text-[11px] font-black text-white uppercase tracking-[0.3em] mb-6 flex items-center gap-3">
                  <span className="w-8 h-[1px] bg-[#00BD84]"></span> Simple Breakdown
                </h3>
                <p className="text-[14px] leading-[1.8] text-[#9299A6] font-medium">
                  {stockData.description}
                </p>
                
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 mt-10 pt-8 border-t border-[#2A2E35]">
                  {[
                    { label: 'Sector', value: stockData.sector },
                    { label: 'Industry', value: stockData.industry },
                    { label: 'Employees', value: stockData.employees },
                    { label: 'Recommendation', value: stockData.recommendation, highlight: true },
                  ].map((info) => (
                    <div key={info.label}>
                      <span className="block text-[10px] text-[#4A4F59] font-mono uppercase tracking-widest mb-1.5">{info.label}</span>
                      <span className={cn("text-[12px] font-bold", info.highlight ? "text-[#00BD84]" : "text-white")}>{info.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </div>
        )}

        {/* Relevant News Section */}
        {selectedSymbol && stockNews && stockNews.length > 0 && (
          <div className="max-w-[1240px] mx-auto mt-12 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-6 bg-[#00BD84]" />
              <h3 className="text-xl font-black text-white uppercase tracking-tighter">Market Intelligence</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {stockNews.map((article: any, i: number) => (
                <a 
                  key={i}
                  href={article.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-[#0C0D0F] border border-[#2A2E35] p-5 rounded-xl hover:border-[#00BD84]/50 transition-all flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex justify-between items-start mb-3">
                      <span className="text-[10px] font-black text-[#4A4F59] uppercase tracking-widest">{article.publisher}</span>
                      <ExternalLink size={14} className="text-[#4A4F59] group-hover:text-white" />
                    </div>
                    <h4 className="text-[13px] font-bold text-white group-hover:text-[#00BD84] transition-colors leading-tight mb-3 line-clamp-2">{article.title}</h4>
                  </div>
                  <div className="text-[9px] text-[#4A4F59] font-mono uppercase">
                    {new Date(article.providerPublishTime * 1000).toLocaleString()}
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Global Market News Section */}
        {marketNews && marketNews.length > 0 && (
          <div className="max-w-[1240px] mx-auto mt-12 mb-12 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-6 bg-[#00BD84]" />
              <h3 className="text-xl font-black text-white uppercase tracking-tighter">Global Market Feed</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {marketNews.map((article: any, i: number) => (
                <a 
                  key={i}
                  href={article.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-[#0C0D0F] border border-[#2A2E35] p-6 rounded-xl hover:border-[#00BD84]/50 transition-all flex flex-col group shadow-lg"
                >
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-[10px] font-black text-[#00BD84] uppercase tracking-widest">{article.publisher}</span>
                    <ExternalLink size={14} className="text-[#4A4F59] group-hover:text-white" />
                  </div>
                  <h4 className="text-sm font-bold text-white group-hover:text-[#00BD84] transition-colors leading-snug mb-4">{article.title}</h4>
                  <div className="mt-auto pt-4 border-t border-[#2A2E35] text-[9px] text-[#4A4F59] font-mono uppercase">
                    {new Date(article.providerPublishTime * 1000).toLocaleString()}
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex-1 bg-[#121417] flex flex-col overflow-hidden">
      {/* Top Navigation */}
      <nav className="h-12 bg-[#0C0D0F] border-b border-[#2A2E35] flex items-center justify-between px-6 shrink-0 font-sans z-50">
        <div className="flex items-center gap-8 text-[13px] font-semibold text-[#E0E0E0]">
          {['Analyst', 'Markets', 'Explore', 'Research', 'Settings'].map((item) => (
            <button 
              key={item} 
              onClick={() => setSelectedCategory(item)}
              className={cn(
                "hover:text-white transition-all cursor-pointer relative py-2",
                selectedCategory === item ? "text-white font-bold" : "text-[#9299A6]"
              )}
            >
              {item}
              {selectedCategory === item && (
                <motion.div layoutId="nav-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#00BD84]" />
              )}
            </button>
          ))}
        </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setShowChat(!showChat)}
              className={cn(
                "p-1.5 rounded hover:bg-[#1A1D24] transition-colors relative",
                showChat ? "bg-[#1A1D24] text-[#00BD84]" : "text-[#9299A6]"
              )}
            >
              <Bot size={18} />
            </button>
            <div className="relative">
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className={cn(
                "p-1.5 rounded hover:bg-[#1A1D24] transition-colors relative",
                showNotifications ? "bg-[#1A1D24] text-[#00BD84]" : "text-[#9299A6]"
              )}
            >
              <Bell size={18} />
              {notifications.some(n => !n.read) && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#00BD84] rounded-full border border-[#0C0D0F]" />
              )}
            </button>

            {showNotifications && (
              <div className="absolute top-full right-0 mt-2 w-80 bg-[#0C0D0F] border border-[#2A2E35] rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-[100] animate-in slide-in-from-top-2">
                <div className="p-4 border-b border-[#2A2E35] flex justify-between items-center">
                  <h4 className="text-[10px] font-black text-white uppercase tracking-widest">Global Notifications</h4>
                  <button onClick={clearNotifications} className="text-[9px] text-[#4A4F59] hover:text-white uppercase">Clear All</button>
                </div>
                <div className="max-h-96 overflow-y-auto no-scrollbar">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center">
                      <p className="text-[10px] text-[#4A4F59] uppercase tracking-widest">No active alerts</p>
                    </div>
                  ) : (
                    notifications.map(n => (
                      <div 
                        key={n.id} 
                        onClick={() => markNotificationRead(n.id)}
                        className={cn(
                          "p-4 border-b border-[#2A2E35]/50 hover:bg-[#1A1D24] transition-colors cursor-pointer relative",
                          !n.read && "bg-[#00BD84]/5"
                        )}
                      >
                        {!n.read && <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-[#00BD84]" />}
                        <div className="flex items-center gap-2 mb-1">
                          <span className={cn(
                            "text-[8px] font-black uppercase tracking-tighter px-1 rounded",
                            n.type === 'price' ? "bg-[#00BD84]/10 text-[#00BD84]" : "bg-blue-500/10 text-blue-500"
                          )}>
                            {n.type}
                          </span>
                          <span className="text-[8px] text-[#4A4F59] font-mono">{new Date(n.timestamp).toLocaleTimeString()}</span>
                        </div>
                        <h5 className="text-[11px] font-bold text-white mb-0.5">{n.title}</h5>
                        <p className="text-[10px] text-[#9299A6] leading-tight">{n.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs text-[#00BD84] font-bold">
             <div className="w-4 h-4 bg-[#00BD84] rounded-full flex items-center justify-center text-[10px] text-black">✓</div>
             FREE UNLOCKED
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#00BD84] to-[#008A61] flex items-center justify-center text-black font-black text-[10px]">
              YK
            </div>
            <span className="text-[11px] font-bold text-white hidden sm:inline">Yash Kiran K</span>
          </div>
        </div>
      </nav>

      {/* Indices Ticker */}
      <div className="h-14 bg-[#0C0D0F] border-b border-[#2A2E35] flex items-center overflow-hidden shrink-0 pointer-events-none select-none relative">
        <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-[#0C0D0F] to-transparent z-10" />
        <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-[#0C0D0F] to-transparent z-10" />
        
        <motion.div 
          className="flex whitespace-nowrap"
          animate={{ x: [0, -2000] }}
          transition={{ 
            duration: 40, 
            repeat: Infinity, 
            ease: "linear" 
          }}
        >
          {[...displayIndices, ...displayIndices, ...displayIndices, ...displayIndices, ...displayIndices].map((idx, i) => (
            <div key={`${idx.name}-${i}`} className="flex-none px-8 border-r border-[#2A2E35]/50 flex flex-col justify-center h-12">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-[11px] font-bold text-[#E0E0E0]">{idx.name}</span>
                <div className="w-1.5 h-1.5 rounded-full bg-[#00BD84] animate-pulse" />
              </div>
              <div className="flex items-center gap-2 font-mono">
                <span className="text-[12px] font-bold text-white">{idx.value}</span>
                <span className={cn("text-[10px] font-bold", idx.up ? "text-[#00C805]" : "text-[#FF333A]")}>
                  {idx.change} ({idx.pct})
                </span>
              </div>
            </div>
          ))}
        </motion.div>
      </div>

      <main className="flex-1 overflow-hidden flex font-sans">
        {/* Left Scrollable Area */}
        <div className="flex-1 overflow-y-auto no-scrollbar bg-[#121417]">
          {renderContent()}
        </div>

        {/* Right Sidebar */}
        <aside className="w-80 border-l border-[#2A2E35] bg-[#0C0D0F] flex flex-col shrink-0 relative">
          <AnimatePresence>
            {showChat && (
              <motion.div 
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="absolute inset-0 z-50 bg-[#0C0D0F] border-l border-[#2A2E35]"
              >
                <div className="h-full flex flex-col">
                  <div className="p-4 border-b border-[#2A2E35] flex justify-between items-center bg-[#121417]">
                    <h3 className="text-[10px] font-black text-white uppercase tracking-widest">AI Terminal</h3>
                    <button onClick={() => setShowChat(false)} className="text-[#4A4F59] hover:text-white transition-colors">
                      <Plus className="rotate-45" size={16} />
                    </button>
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <Chat />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="p-4 border-b border-[#2A2E35]">
             <form onSubmit={handleSearchSubmit} className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4A4F59]" size={16} />
                <input 
                  type="text" 
                  value={searchInput}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  placeholder="Quote Lookup (e.g. Hollister)"
                  className="w-full bg-[#1A1D24] border border-[#2A2E35] rounded py-2 pl-10 pr-4 text-xs font-mono text-white focus:outline-none focus:border-[#00BD84]"
                />
                
                {/* Search Results Dropdown */}
                {searchInput.length > 1 && (searchResults.length > 0 || isSearching) && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-[#121417] border border-[#2A2E35] shadow-2xl z-[100] max-h-60 overflow-y-auto rounded py-1">
                    {isSearching ? (
                      <div className="px-4 py-2 text-[10px] text-[#9299A6] animate-pulse">SEARCHING...</div>
                    ) : (
                      searchResults.map((res) => (
                        <button
                          key={res.symbol}
                          type="button"
                          onClick={() => handleSelectSymbol(res.symbol)}
                          className="w-full text-left px-4 py-2 hover:bg-[#1A1D24] group transition-colors flex justify-between items-center"
                        >
                          <div className="flex flex-col">
                            <span className="text-[12px] font-bold text-white group-hover:text-[#00BD84]">{res.symbol}</span>
                            <span className="text-[10px] text-[#9299A6] truncate max-w-[140px]">{res.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                             <span className="text-[9px] text-[#4A4F59] font-mono">{res.exchange}</span>
                             <button 
                               onClick={(e) => {
                                 e.stopPropagation();
                                 toggleWatchlist(res.symbol);
                               }}
                               className="p-1 hover:text-[#00BD84] transition-colors"
                             >
                               <Plus size={14} className={cn(watchlist.includes(res.symbol.toUpperCase()) && "rotate-45 text-[#00BD84]")} />
                             </button>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                )}
             </form>
          </div>

          <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-8">
             <section>
                <h3 className="text-sm font-bold text-white mb-4">Trending tickers</h3>
                <div className="space-y-4">
                  {[
                    { symbol: 'LAC', name: 'Lithium Americas' },
                    { symbol: 'SNAP', name: 'Snap Inc.' },
                    { symbol: 'BTC-USD', name: 'Bitcoin USD' },
                    { symbol: 'JOBY', name: 'Joby Aviation, Inc.' },
                    { symbol: 'HTCO', name: 'High-Trend Inc.' },
                  ].map(ticker => (
                    <div key={ticker.symbol} className="flex flex-col cursor-pointer hover:bg-[#1A1D24] p-1 -m-1 rounded transition-colors" onClick={() => setSelectedSymbol(ticker.symbol)}>
                      <span className="text-[12px] font-bold text-white">{ticker.symbol}</span>
                      <span className="text-[10px] text-[#9299A6] truncate">{ticker.name}</span>
                    </div>
                  ))}
                </div>
             </section>

             <section className="bg-[#121417] p-4 border border-[#2A2E35] rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-bold text-white uppercase tracking-tighter">My Portfolio</h3>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => {
                        const input = document.querySelector('input[type="text"]') as HTMLInputElement;
                        input?.focus();
                      }}
                      className="p-1 text-[#4A4F59] hover:text-[#00BD84] transition-colors"
                      title="Add Symbol"
                    >
                      <Plus size={14} />
                    </button>
                    <Briefcase size={14} className="text-[#00BD84]" />
                  </div>
                </div>
                <p className="text-[11px] text-[#9299A6] mb-3 leading-tight italic">Portfolio tracking is enabled. All AI features are free and unlocked for your account.</p>
                <div className="w-full py-2 bg-[#00BD84]/10 text-[#00BD84] text-[10px] font-black uppercase tracking-widest text-center rounded border border-[#00BD84]/20">
                  verified profile active
                </div>
             </section>

             <section>
                <ResearchPanel symbol={selectedSymbol || 'AAPL'} />
             </section>
          </div>
        </aside>
      </main>

      {/* Footer Status Bar */}
      <footer className="h-8 border-t border-[#2A2E35] px-4 flex items-center justify-between bg-[#0C0D0F] text-[10px] font-mono">
        <div className="flex gap-6 text-[#9299A6]">
          <span>WS: <span className="text-white italic">ENCRYPTED</span></span>
          <span>LATENCY: <span className="text-[#00BD84]">12ms</span></span>
          <span>STATUS: <span className="text-white">SYNCHRONIZED</span></span>
        </div>
        <div className="text-[#4A4F59] uppercase tracking-wider hidden md:block">THIS IS ANALYSIS FOR EDUCATIONAL PURPOSES ONLY. NOT FINANCIAL ADVICE.</div>
      </footer>
    </div>
  );
}
