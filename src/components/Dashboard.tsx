/**
 * Copyright (c) 2026 Yash Killamsetty
 * All rights reserved.
 * Unauthorized copying, modification, or distribution of this
 * software, via any medium, is strictly prohibited.
 * Proprietary and confidential.
 */
import { GoogleGenAI } from "@google/genai";
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import React, { useState, useEffect } from 'react';
import { 
  Bot, 
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
  ExternalLink,
  ChevronRight,
  Bot as BotIcon,
  Loader2,
  Briefcase,
  Activity,
  Info,
  Settings,
  X
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip as RechartsTooltip, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { useStore } from '../store/useStore';
import { motion, AnimatePresence } from 'motion/react';
import { formatCurrency, formatNumber, cn } from '../lib/utils';
import StockChart from './StockChart';
import ResearchPanel from './ResearchPanel';
import Chat from './Chat';

const currencySymbols: Record<string, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  KRW: '₩',
  CNY: '¥',
  INR: '₹',
};

const PortfolioSummary = ({ onSelect }: { onSelect: (s: string) => void }) => {
  const store = useStore();
  const watchlist = store.getWatchlist();
  const toggleWatchlist = store.toggleWatchlist;
  
  const { data: watchlistData } = useQuery({
    queryKey: ['watchlistQuotes', watchlist],
    queryFn: async () => {
      if (watchlist.length === 0) return [];
      const results = await Promise.all(
        watchlist.slice(0, 8).map(s => axios.get(`/api/stocks/${s}`).then(res => res.data).catch(() => null))
      );
      return results.filter(r => r !== null);
    },
    refetchInterval: 10000,
    enabled: watchlist.length > 0
  });

  return (
    <div className="space-y-4">
      {watchlistData && watchlistData.length > 0 ? (
        watchlistData.map(asset => (
          <div 
            key={asset.symbol} 
            onClick={() => onSelect(asset.symbol)}
            className="flex justify-between items-center group cursor-pointer"
          >
            <div className="flex flex-col">
              <span className="text-[12px] font-bold text-white group-hover:text-[#00BD84] transition-colors">{asset.name}</span>
              <span className="text-[9px] text-[#4A4F59] uppercase tracking-tighter truncate max-w-[100px]">{asset.symbol}</span>
            </div>
            <div className="text-right flex items-center gap-3">
              <div className="flex flex-col">
                <div className="text-[11px] font-bold text-white">{asset.price ? formatCurrency(asset.price) : 'N/A'}</div>
                <div className={cn("text-[9px] font-mono font-bold", (asset.change || 0) >= 0 ? "text-[#00C805]" : "text-[#FF333A]")}>
                  {typeof asset.pctChange === 'number' ? (asset.pctChange >= 0 ? '+' : '') + asset.pctChange.toFixed(2) + '%' : '---'}
                </div>
              </div>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  toggleWatchlist(asset.symbol);
                }}
                className="p-1 px-2 rounded-md bg-[#FF333A]/10 text-[#FF333A] opacity-0 group-hover:opacity-100 transition-all text-[8px] font-black uppercase"
              >
                DEL
              </button>
            </div>
          </div>
        ))
      ) : (
        <div className="py-8 text-center border border-dashed border-[#2A2E35] rounded-xl">
           <p className="text-[9px] text-[#4A4F59] uppercase tracking-widest">Awaiting Signals...</p>
        </div>
      )}
    </div>
  );
};

const ArticleReader = ({ article, onClose }: { article: any, onClose: () => void }) => {
  const { data, isLoading } = useQuery({
    queryKey: ['reader', article.link],
    queryFn: async () => {
      const { data } = await axios.get('/api/news/reader', { params: { url: article.link } });
      return data;
    },
    enabled: !!article,
  });

  return (
    <motion.div 
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      className="fixed inset-y-0 right-0 w-full md:w-[600px] bg-[#0C0D0F] border-l border-[#2A2E35] z-[100] shadow-[0_0_100px_rgba(0,0,0,0.8)] flex flex-col"
    >
      <div className="p-6 border-b border-[#2A2E35] flex items-center justify-between bg-[#121417]">
        <div className="flex items-center gap-4">
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl transition-colors text-white">
            <ChevronRight className="rotate-180" />
          </button>
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-[#00BD84] uppercase tracking-widest">{data?.siteName || article.source || "Intelligence"}</span>
            <span className="text-[8px] text-[#4A4F59] font-mono uppercase tracking-tighter">Secure Feed Active</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <a 
            href={article.link} 
            target="_blank" 
            rel="noopener noreferrer"
            className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl transition-colors text-[#4A4F59] hover:text-white"
            title="Open Original"
          >
            <ExternalLink size={18} />
          </a>
          <button 
            onClick={onClose}
            className="p-2.5 bg-[#FF333A]/10 text-[#FF333A] hover:bg-[#FF333A]/20 rounded-xl transition-colors text-[10px] font-black uppercase"
          >
            Close
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8 md:p-12 custom-scrollbar space-y-10">
        {isLoading ? (
          <div className="py-40 text-center space-y-6">
            <div className="w-12 h-12 border-4 border-[#00BD84]/10 border-t-[#00BD84] rounded-full animate-spin mx-auto shadow-[0_0_30px_rgba(0,189,132,0.1)]" />
            <div className="space-y-4">
              <span className="text-[11px] font-black text-[#4A4F59] uppercase tracking-[0.5em] animate-pulse block">Decoding Intelligence...</span>
              <p className="text-[9px] text-[#4A4F59] font-bold uppercase tracking-widest">Applying heuristic extraction filters</p>
            </div>
          </div>
        ) : data?.isRestricted ? (
          <div className="py-20 text-center space-y-8 animate-in fade-in zoom-in duration-500">
            <div className="w-20 h-20 bg-[#FFCC00]/10 rounded-full flex items-center justify-center mx-auto border border-[#FFCC00]/20">
              <Info className="text-[#FFCC00]" size={36} />
            </div>
            <div className="space-y-4">
              <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter italic">Handshake Denied</h3>
              <p className="text-[13px] text-[#9299A6] max-w-sm mx-auto leading-relaxed font-medium">
                {data.message}
              </p>
            </div>
            <div className="pt-8">
              <a 
                href={article.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 bg-[#00BD84] text-black px-10 py-5 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] hover:bg-[#00e09e] transition-all shadow-[0_20px_40px_rgba(0,189,132,0.2)]"
              >
                Access Source Terminal <ArrowUpRight size={16} />
              </a>
            </div>
          </div>
        ) : (
          <article className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h1 className="text-4xl font-black text-white leading-[1.1] uppercase italic tracking-tighter mb-10 selection:bg-[#00BD84] selection:text-black">
              {data?.title || article.title}
            </h1>
            <div 
              className="prose prose-invert max-w-none 
                prose-p:text-[#E0E0E0] prose-p:leading-[1.8] prose-p:text-lg prose-p:mb-6
                prose-headings:text-white prose-headings:uppercase prose-headings:italic prose-headings:tracking-tighter
                prose-a:text-[#00BD84] prose-a:no-underline hover:prose-a:underline
                prose-strong:text-white prose-strong:font-black
                article-content"
              style={{
                fontFamily: 'Inter, sans-serif'
              }}
              dangerouslySetInnerHTML={{ __html: data?.content }}
            />
            <div className="mt-20 pt-10 border-t border-[#2A2E35] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-[#00BD84]" />
                <span className="text-[10px] font-black text-[#4A4F59] uppercase tracking-widest">End of Stream</span>
              </div>
              <button 
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="text-[10px] font-black text-[#4A4F59] uppercase tracking-widest hover:text-white transition-colors"
              >
                Back to Top
              </button>
            </div>
          </article>
        )}
      </div>
    </motion.div>
  );
};

const NewsCard = ({ item, onAnalyze, onRead, analyzingUrl, aiAnalysis }: { 
  item: any, 
  onAnalyze: (item: any) => void, 
  onRead: (item: any) => void,
  analyzingUrl: string | null,
  aiAnalysis: Record<string, any>
}) => {
  const restrictedSources = [
    'BLOOMBERG', 'REUTERS', 'WSJ', 'NYTIMES', 'FT.COM', 
    'SUBSTACK', 'YAHOO', 'CNBC', 'TECHCRUNCH', 'BARRONS', 
    'MARKETWATCH', 'INVESTORS.COM', 'FORBES', 'FORTUNE',
    'THEINFORMATION', 'BUSINESSINSIDER', 'REUTERS.COM'
  ];

  const { data: metadata, isLoading: metaLoading } = useQuery({
    queryKey: ['meta', item.link],
    queryFn: async () => {
      const { data } = await axios.get('/api/news/metadata', { params: { url: item.link } });
      return data;
    },
    staleTime: Infinity,
  });

  const handleRead = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    const isRestricted = restrictedSources.some(s => 
      item.source?.toUpperCase().includes(s) || 
      item.link?.toUpperCase().includes(s)
    );

    if (isRestricted) {
      window.open(item.link, '_blank', 'noopener,noreferrer');
    } else {
      onRead(item);
    }
  };

  const isLikelyRestricted = restrictedSources.some(s => 
    item.source?.toUpperCase().includes(s) || 
    item.link?.toUpperCase().includes(s)
  );

  const isAnalyzing = analyzingUrl === item.link;
  const analysis = aiAnalysis[item.link];

  const fallbackImage = "https://images.unsplash.com/photo-1611974717482-45a0017a42f8?q=80&w=2070&auto=format&fit=crop";

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={handleRead}
      className="group relative bg-[#0C0D0F] border border-[#2A2E35] rounded-3xl overflow-hidden hover:border-[#00BD84]/30 transition-all duration-300 flex flex-col h-full shadow-2xl cursor-pointer"
    >
      <div className="aspect-video w-full overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-t from-[#0C0D0F] to-transparent z-10 opacity-60" />
        {metaLoading ? (
          <div className="w-full h-full bg-[#1A1D24] animate-pulse" />
        ) : (
          <img 
            src={metadata?.image || fallbackImage} 
            alt=""
            loading="lazy"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        )}
        <div className="absolute top-4 left-4 z-20 flex gap-2">
          <span className="px-3 py-1 bg-[#00BD84] text-black text-[9px] font-black uppercase tracking-widest rounded-lg shadow-lg">
            {item.source || 'Intelligence'}
          </span>
        </div>
        
        <div className="absolute top-4 right-4 z-20">
          <button 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onAnalyze(item);
            }}
            disabled={isAnalyzing}
            className={cn(
              "p-2 rounded-xl border transition-all",
              analysis 
                ? "bg-[#00BD84] border-[#00BD84] text-black" 
                : "bg-black/60 border-white/10 text-white hover:bg-[#00BD84] hover:text-black hover:border-[#00BD84]"
            )}
            title="AI Analyze"
          >
            {isAnalyzing ? <Loader2 className="animate-spin" size={16} /> : <Bot size={16} />}
          </button>
        </div>
      </div>
      
      <div className="p-6 flex flex-col flex-1 space-y-4">
        <div className="flex justify-between items-center text-[9px] font-black text-[#4A4F59] uppercase tracking-widest">
          <span>{new Date(item.pubDate).toLocaleDateString()}</span>
          <span>{new Date(item.pubDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
        
        <button 
          onClick={handleRead}
          className="text-lg font-black text-white leading-tight uppercase italic tracking-tighter hover:text-[#00BD84] transition-colors line-clamp-2 text-left"
        >
          {item.title}
        </button>
        
        <AnimatePresence mode="wait">
          {analysis ? (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="bg-[#00BD84]/5 border-l-2 border-[#00BD84] p-3 space-y-2 rounded-r-lg"
            >
              <div className="flex items-center gap-2 text-[9px] font-black text-[#00BD84] uppercase tracking-widest">
                <Bot size={12} /> AI Synthesis
              </div>
              <p className="text-[11px] text-[#E0E0E0] leading-relaxed line-clamp-4">
                {analysis.summary[0]}
              </p>
              <div className="flex items-center gap-2 mt-2">
                 <span className={cn(
                   "text-[9px] font-black uppercase px-2 py-0.5 rounded",
                   analysis.sentiment === 'Positive' ? "bg-[#00BD84]/10 text-[#00BD84]" : "bg-[#FF333A]/10 text-[#FF333A]"
                 )}>{analysis.sentiment}</span>
              </div>
            </motion.div>
          ) : (
            <p className="text-xs text-[#9299A6] line-clamp-3 leading-relaxed font-medium">
              {metadata?.description || item.contentSnippet || "Analyzing market signals..."}
            </p>
          )}
        </AnimatePresence>
        
          <div className="mt-auto pt-6 flex items-center justify-between border-t border-[#2A2E35]/50">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-[#00BD84] animate-pulse" />
            <span className="text-[9px] font-black text-[#00BD84] uppercase tracking-widest">Live Signal Active</span>
          </div>
          <button 
            onClick={handleRead}
            className="flex items-center gap-2 text-[10px] font-black text-white uppercase tracking-widest hover:text-[#00BD84] transition-colors group/link"
          >
            {isLikelyRestricted ? 'Direct Link' : 'Secure Reader'} 
            {isLikelyRestricted ? <ExternalLink size={14} className="group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform" /> : <Activity size={14} className="group-hover/link:animate-pulse" />}
          </button>
        </div>
      </div>
    </motion.div>
  );
};

const SpaceSwitcher = () => {
  const { spaces, activeSpaceId, switchSpace, createSpace, deleteSpace, updateSpaceName } = useStore();
  const [isNamingSpace, setIsNamingSpace] = useState(false);
  const [newSpaceName, setNewSpaceName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const currentSpace = spaces.find(s => s.id === activeSpaceId) || spaces[0];

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSpaceName.trim()) {
      createSpace(newSpaceName);
      setNewSpaceName('');
      setIsNamingSpace(false);
    }
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId && editName.trim()) {
      updateSpaceName(editingId, editName);
      setEditingId(null);
    }
  };

  return (
    <div className="space-y-4 mb-8">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">Intelligence Spaces</h3>
        <button 
          onClick={() => setIsNamingSpace(true)}
          className="text-[#00BD84] hover:text-[#00e09e] transition-colors p-1 bg-[#00BD84]/10 rounded-md"
          title="New Workspace"
        >
          <Plus size={14} />
        </button>
      </div>

      <div className="space-y-2">
        {spaces.map(space => (
          <div 
            key={space.id} 
            className={cn(
              "group relative flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer overflow-hidden",
              activeSpaceId === space.id 
                ? "bg-[#00BD84]/5 border-[#00BD84]/40 shadow-[0_0_15px_rgba(0,189,132,0.1)]" 
                : "bg-transparent border-[#2A2E35] hover:border-[#4A4F59]"
            )}
            onClick={() => switchSpace(space.id)}
          >
            {activeSpaceId === space.id && (
              <motion.div 
                layoutId="active-pill"
                className="absolute left-0 top-0 bottom-0 w-1 bg-[#00BD84]"
              />
            )}
            
            <div className="flex items-center gap-3 min-w-0">
               <div className={cn(
                 "w-8 h-8 rounded-lg flex items-center justify-center border transition-colors shrink-0",
                 activeSpaceId === space.id ? "bg-[#00BD84] border-[#00BD84] text-black" : "bg-[#1A1D24] border-[#2A2E35] text-[#4A4F59]"
               )}>
                 <LayoutGrid size={14} />
               </div>
               
               {editingId === space.id ? (
                 <form onSubmit={handleUpdate} className="flex-1 min-w-0" onClick={e => e.stopPropagation()}>
                    <input 
                      autoFocus
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      onBlur={() => setEditingId(null)}
                      className="bg-[#0C0D0F] border border-[#00BD84] text-white text-[11px] font-black uppercase tracking-tighter w-full px-2 py-1 rounded"
                    />
                 </form>
               ) : (
                 <div className="flex flex-col min-w-0">
                    <span className={cn(
                      "text-[11px] font-black uppercase tracking-tighter truncate",
                      activeSpaceId === space.id ? "text-white" : "text-[#9299A6]"
                    )}>
                      {space.name}
                    </span>
                    <span className="text-[8px] text-[#4A4F59] font-mono leading-none tracking-tight">
                      {space.watchlist.length} Assets • {space.followedTopics.length} Vectors
                    </span>
                 </div>
               )}
            </div>

            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
               <button 
                 onClick={(e) => {
                   e.stopPropagation();
                   setEditingId(space.id);
                   setEditName(space.name);
                 }}
                 className="p-1 hover:text-[#00BD84] text-[#4A4F59] transition-colors"
                >
                 <Settings size={12} />
               </button>
               {spaces.length > 1 && (
                 <button 
                   onClick={(e) => {
                     e.stopPropagation();
                     deleteSpace(space.id);
                   }}
                   className="p-1 hover:text-[#FF333A] text-[#4A4F59] transition-colors"
                  >
                   <X size={12} />
                 </button>
               )}
            </div>
          </div>
        ))}

        <AnimatePresence>
          {isNamingSpace && (
            <motion.form 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              onSubmit={handleCreate}
              className="mt-4 p-4 bg-[#121417] border border-[#00BD84]/30 rounded-2xl space-y-3"
            >
              <div className="flex flex-col gap-2">
                <span className="text-[9px] font-black text-[#00BD84] uppercase tracking-widest leading-none">Space Designation</span>
                <input 
                  autoFocus
                  placeholder="e.g. Venture Growth..."
                  value={newSpaceName}
                  onChange={e => setNewSpaceName(e.target.value)}
                  className="bg-[#0C0D0F] border border-[#2A2E35] rounded-xl px-3 py-2 text-[11px] text-white focus:outline-none focus:border-[#00BD84] transition-all"
                />
              </div>
              <div className="flex gap-2">
                <button 
                  type="submit"
                  className="flex-1 bg-[#00BD84] text-black text-[9px] font-black uppercase tracking-widest py-2 rounded-lg hover:bg-[#00e09e] transition-all"
                >
                  Initialize
                </button>
                <button 
                  type="button"
                  onClick={() => setIsNamingSpace(false)}
                  className="px-3 bg-[#1A1D24] text-white border border-[#2A2E35] text-[9px] font-black uppercase tracking-widest py-2 rounded-lg"
                >
                  Abort
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default function Dashboard() {
  const store = useStore();
  const { 
    selectedSymbol, 
    setSelectedSymbol, 
    toggleWatchlist, 
    toggleFollowTopic,
    addMessage, 
    notifications,
    addNotification,
    markNotificationRead,
    clearNotifications,
    settings,
    updateSetting,
    syncDataSource,
    spaces,
    activeSpaceId,
    createSpace,
    deleteSpace,
    switchSpace
  } = store;

  const watchlist = store.getWatchlist();
  const followedTopics = store.getFollowedTopics();

  const [searchInput, setSearchInput] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('News');
  const [newsFilter, setNewsFilter] = useState('All');
  const [newsSearch, setNewsSearch] = useState('');
  const [newsSearchInput, setNewsSearchInput] = useState('');
  const deferredNewsSearch = React.useDeferredValue(newsSearchInput);
  const [timeframe, setTimeframe] = useState('1D');
  const [terminalSearch, setTerminalSearch] = useState('');
  const [activeRssUrl, setActiveRssUrl] = useState("http://feeds.bbci.co.uk/news/business/rss.xml");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [aiAnalysis, setAiAnalysis] = useState<Record<string, any>>({});
  const [analyzingUrl, setAnalyzingUrl] = useState<string | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [showChat, setShowChat] = useState(false);
  const [viewingArticle, setViewingArticle] = useState<any | null>(null);
  const [isAsideOpen, setIsAsideOpen] = useState(false);

  const rssSources = [
    { name: 'BBC Business', url: 'http://feeds.bbci.co.uk/news/business/rss.xml' },
    { name: 'CNBC', url: 'https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=10000664' },
    { name: 'Fortune', url: 'https://fortune.com/feed/' },
    { name: 'MarketWatch', url: 'http://feeds.marketwatch.com/marketwatch/topstories/' },
  ];

  const handleAIAnalyze = async (article: any) => {
    if (aiAnalysis[article.link]) return;
    setAnalyzingUrl(article.link);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const prompt = `Analyze this news article and provide institutional-grade synthesis:
      TITLE: ${article.title}
      SOURCE: ${article.source}
      CONTENT: ${article.contentSnippet || article.content || "No excerpt available."}
      
      Return perfectly formatted JSON.`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "object" as any,
            properties: {
              summary: { type: "array" as any, items: { type: "string" as any } },
              sentiment: { type: "string" as any, enum: ["Positive", "Negative", "Neutral"] },
              keyPoints: { type: "array" as any, items: { type: "string" as any } }
            },
            required: ["summary", "sentiment", "keyPoints"]
          }
        }
      });

      if (response.text) {
        setAiAnalysis(prev => ({ ...prev, [article.link]: JSON.parse(response.text) }));
      }
    } catch (err) {
      console.error("Analysis error:", err);
    } finally {
      setAnalyzingUrl(null);
    }
  };

  const { data: intelligenceFeed, isLoading: isIntelligenceLoading } = useQuery({
    queryKey: ['rss-feed', activeRssUrl],
    queryFn: async () => {
      const { data } = await axios.get('/api/news/rss', { params: { url: activeRssUrl } });
      return (data.items || []).map((item: any) => ({
        ...item,
        url: item.link,
        publishedAt: item.pubDate || new Date().toISOString(),
        summaryText: item.contentSnippet || item.content
      }));
    },
    enabled: selectedCategory === 'News' && newsFilter === 'All' && !newsSearch,
    refetchInterval: 60000,
  });

  const { data: stockData, isLoading: isQuoteLoading } = useQuery({
    queryKey: ['quote', selectedSymbol],
    queryFn: async () => {
      const { data } = await axios.get(`/api/stocks/${selectedSymbol}`);
      return data;
    },
    enabled: !!selectedSymbol,
    refetchInterval: 10000,
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

  const { data: globalNews, isLoading: isNewsLoadingGlobal } = useQuery({
    queryKey: ['globalNews', newsFilter, newsSearch, watchlist, followedTopics],
    queryFn: async () => {
      let query = newsSearch;
      let category = newsFilter;

      if (newsFilter === 'Watchlist' && !newsSearch) {
        const terms = [...watchlist, ...followedTopics];
        query = terms.length > 0 ? terms.join(' OR ') : undefined;
        category = terms.length > 0 ? 'Search' : 'Markets';
      } else if (newsFilter === 'Following' && !newsSearch) {
        // Optimized search for followed vectors - add industry context to help search hit
        query = followedTopics.length > 0 ? followedTopics.map(t => `"${t}"`).join(' OR ') : undefined;
        category = followedTopics.length > 0 ? 'Search' : 'Markets';
      } else if (newsFilter === 'All' && !newsSearch) {
        if (followedTopics.length > 0) {
          // Priority mix: followed topics as primary search
          query = followedTopics.map(t => `"${t}"`).join(' OR ');
          category = 'Search';
        } else {
          category = 'Top Stories';
          query = undefined;
        }
      } else if (newsSearch) {
        query = newsSearch;
        category = 'Search';
      } else {
        // Handle standard categories and custom company filters
        const standardFilters = ['Markets', 'Capital', 'Tech', 'Energy', 'Fashion', 'Crypto', 'AI', 'Tesla', 'Top Stories'];
        const matched = standardFilters.find(f => f.toUpperCase() === newsFilter.toUpperCase());
        
        if (matched) {
          category = matched;
          query = undefined;
        } else {
          // Custom followed topic filter
          query = `"${newsFilter}" news`;
          category = 'Search';
        }
      }

      const { data } = await axios.get('/api/news/trending', { 
        params: { 
          category,
          q: query || undefined
        } 
      });

      return data.map((item: any) => ({
        ...item,
        link: item.url,
        pubDate: item.publishedAt,
        contentSnippet: item.summary
      }));
    },
    enabled: selectedCategory === 'News',
    staleTime: 60000,
    refetchInterval: 60000,
  });

  const activeNewsFeed = React.useMemo(() => {
    // If we have a specific search or filter (other than 'All'), prefer globalNews (which handles search + categories)
    if (newsSearch || newsFilter !== 'All') return globalNews;
    
    // For 'All' filter, we blend general RSS and the search-based globalNews (which contains followed topics)
    const gNews = globalNews || [];
    const iFeed = intelligenceFeed || [];
    const blended = [...gNews, ...iFeed];
    
    if (blended.length === 0) return [];

    return blended.sort((a, b) => {
      const dateA = new Date(a.pubDate || a.publishedAt || 0).getTime();
      const dateB = new Date(b.pubDate || b.publishedAt || 0).getTime();
      return dateB - dateA;
    }).filter((item, index, self) => 
      index === self.findIndex((t) => t.link === item.link || t.title === item.title)
    );
  }, [newsSearch, newsFilter, globalNews, intelligenceFeed]);

  const isNewsLoading = selectedCategory === 'News' && (isNewsLoadingGlobal || isIntelligenceLoading);

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

  const renderStockDetail = () => {
    return (
      <div className="p-4 md:p-8 space-y-8 max-w-[1400px] mx-auto animate-in fade-in duration-500 pb-32">
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

        {/* Unified Terminal View */}
        <div className="flex flex-col gap-6">
          {/* Header Info - Cleaned up */}
          {!isQuoteLoading && stockData && (
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 px-4">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-[10px] text-[#4A4F59] font-mono uppercase tracking-[0.25em] mb-2 font-black">
                  <div className="w-2 h-2 rounded-full bg-[#00BD84] animate-pulse" />
                  Terminal Sync Active • {stockData.symbol} • {stockData.exchange}
                </div>
                <div className="flex items-center gap-4">
                  <h1 className="text-3xl sm:text-4xl md:text-6xl font-black text-white tracking-tighter uppercase italic leading-none truncate max-w-[70vw]">{stockData.name}</h1>
                  <button 
                    onClick={() => toggleWatchlist(stockData.symbol)}
                    className={cn(
                      "transition-all duration-200 hover:scale-110 active:scale-95 shrink-0",
                      watchlist.includes(stockData.symbol.toUpperCase()) ? "text-[#00BD84]" : "text-[#4A4F59] hover:text-white"
                    )}
                  >
                    <Star size={24} className="md:w-8 md:h-8" fill={watchlist.includes(stockData.symbol.toUpperCase()) ? "currentColor" : "none"} />
                  </button>
                </div>
              </div>
              
              <div className="flex items-baseline gap-6 lg:text-right">
                <div className="flex flex-col lg:items-end">
                   <span className="text-4xl sm:text-5xl md:text-7xl font-black text-white tracking-tighter leading-none font-mono italic">
                    {formatCurrency(stockData.price)}
                  </span>
                  <div className={cn("flex items-center gap-2 text-lg md:text-2xl font-black font-mono italic mt-2", stockData.change >= 0 ? "text-[#00BD84]" : "text-[#FF333A]")}>
                    {stockData.change >= 0 ? '+' : ''}{formatCurrency(stockData.change)} 
                    <span className="text-xs md:text-base font-bold opacity-80">({stockData.pctChange >= 0 ? '+' : ''}{stockData.pctChange.toFixed(2)}%)</span>
                    {stockData.change >= 0 ? <TrendingUp size={20} className="md:w-6 md:h-6" /> : <TrendingDown size={20} className="md:w-6 md:h-6" />}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Main Chart Card with Toolbar */}
          <div className="bg-[#0C0D0F] border border-[#2A2E35] rounded-3xl overflow-hidden shadow-[0_40px_80px_rgba(0,0,0,0.6)] relative group">
            {/* NEW CONSOLIDATED TOOLBAR */}
            <div className="px-4 sm:px-6 py-4 bg-[#121417] border-b border-[#2A2E35] flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1.5 bg-[#0C0D0F] border border-[#2A2E35] rounded-xl px-3 py-2 shrink-0">
                   <Clock size={12} className="text-[#00BD84]" />
                   <span className="text-[10px] font-black text-white uppercase tracking-widest leading-none">{timeframe} View</span>
                </div>
                <div className="hidden sm:flex items-center gap-1.5 bg-[#0C0D0F]/50 border border-[#2A2E35]/50 rounded-xl px-3 py-2 shrink-0">
                   <div className="w-1 h-1 bg-[#00BD84] rounded-full animate-pulse" />
                   <span className="text-[9px] font-bold text-[#4A4F59] uppercase tracking-widest leading-none">Signal: 3.4GHz</span>
                </div>
                <div className="hidden sm:block h-6 w-[1px] bg-[#2A2E35] mx-1" />
                <div className="flex items-center gap-3 sm:gap-4 text-[10px] font-black uppercase tracking-widest overflow-x-auto no-scrollbar py-1">
                   {['1D', '5D', '1M', '6M', '1Y', 'ALL'].map(t => (
                     <button 
                        key={t} 
                        onClick={() => setTimeframe(t)}
                        className={cn(
                          "transition-colors whitespace-nowrap",
                          timeframe === t ? "text-[#00BD84]" : "text-[#4A4F59] hover:text-white"
                        )}
                     >
                       {t}
                     </button>
                   ))}
                </div>
              </div>

              <div className="flex items-center gap-2 sm:gap-3 ml-auto sm:ml-0">
                <button 
                  onClick={() => setShowChat(true)}
                  className="flex items-center gap-2 bg-[#1A1D24] border border-[#2A2E35] text-white p-2.5 sm:px-4 sm:py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:border-[#00BD84] transition-all group/chat"
                  title="Advanced Chat"
                >
                  <Bot size={14} className="text-[#00BD84] group-hover/chat:animate-pulse" />
                  <span className="hidden sm:inline">Advanced Chat</span>
                </button>
                
                <button 
                  onClick={() => setSelectedCategory('Explore')}
                  className="flex items-center gap-2 bg-[#00BD84]/10 border border-[#00BD84]/20 text-[#00BD84] p-2.5 sm:px-4 sm:py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#00BD84]/20 transition-all font-black"
                  title="Analyst Intelligence"
                >
                  <BotIcon size={14} />
                  <span className="hidden sm:inline">Analyst Intelligence</span>
                </button>

                <a 
                  href={`https://finance.yahoo.com/chart/${selectedSymbol}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 bg-[#1A1D24] border border-[#2A2E35] text-white p-2.5 sm:px-4 sm:py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:border-[#9299A6] transition-all"
                  title="Advanced Chart"
                >
                  <span className="hidden sm:inline">Chart</span> <ArrowUpRight size={14} />
                </a>
              </div>
            </div>

            <div className="h-[300px] sm:h-[400px] md:h-[520px] w-full relative">
               {selectedSymbol && <StockChart symbol={selectedSymbol} timeframe={timeframe} />}
            </div>
            
            {stockData && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-8 p-6 sm:p-10 border-t border-[#2A2E35] bg-gradient-to-br from-[#0C0D0F] to-[#121417]">
                {[
                  { label: 'Market Cap', value: stockData.marketCap },
                  { label: 'PE Ratio', value: stockData.pe },
                  { label: '52W High', value: formatCurrency(stockData.high52 || 0) },
                  { label: '52W Low', value: formatCurrency(stockData.low52 || 0) },
                ].map((stat) => (
                  <div key={stat.label} className="space-y-1">
                    <p className="text-[9px] sm:text-[10px] text-[#4A4F59] font-black uppercase tracking-[0.2em]">{stat.label}</p>
                    <p className="text-[14px] sm:text-[16px] font-black text-white font-mono italic tracking-tighter truncate">{stat.value}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Detailed Company Briefing & AI Strategy Section */}
        {stockData && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {stockData.description && (
              <section className="lg:col-span-2 space-y-8">
                <div className="bg-[#0C0D0F] border border-[#2A2E35] rounded-3xl p-10 shadow-xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-10 opacity-[0.02] group-hover:opacity-10 transition-opacity">
                    <Briefcase size={120} />
                  </div>
                  <h3 className="text-[12px] font-black text-[#00BD84] uppercase tracking-[0.4em] mb-8 flex items-center gap-4 italic font-black">
                    <span className="w-12 h-[1px] bg-[#00BD84]"></span> Institutional Briefing
                  </h3>
                  <p className="text-[16px] leading-[1.8] text-[#E0E0E0] font-medium selection:bg-[#00BD84] selection:text-black">
                    {stockData.description}
                  </p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mt-12 pt-10 border-t border-[#2A2E35]/50">
                    {[
                      { label: 'Sector Vector', value: stockData.sector },
                      { label: 'Industry Focus', value: stockData.industry },
                      { label: 'Capitalization', value: stockData.marketCap },
                      { label: 'Analyst Rating', value: stockData.recommendation, highlight: true },
                    ].map((info) => (
                      <div key={info.label} className="space-y-1">
                        <span className="block text-[9px] text-[#4A4F59] font-black uppercase tracking-widest leading-none mb-1">{info.label}</span>
                        <span className={cn("text-[13px] font-black uppercase tracking-tighter italic", info.highlight ? "text-[#00BD84] shadow-[0_0_20px_rgba(0,189,132,0.2)]" : "text-white")}>{info.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}

            <section className={cn("space-y-8", !stockData.description && "lg:col-span-3")}>
              <div className="bg-[#0C0D0F] border border-[#2A2E35] rounded-3xl p-10 border-l-[6px] border-l-[#00BD84] shadow-2xl relative overflow-hidden group">
                 <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                       <Bot size={22} className="text-[#00BD84]" />
                       <h3 className="text-[12px] font-black text-white uppercase tracking-[0.4em] italic font-black">AI PROFIT CHEAT</h3>
                    </div>
                    <div className="flex items-center gap-2 bg-[#1A1D24] px-3 py-1.5 rounded-xl border border-[#2A2E35]/50 shadow-inner">
                       <span className="text-[13px] font-black text-white font-mono">{stockData.safetyScore || 85}</span>
                       <div className="w-2 h-2 rounded-full shadow-[0_0_10px_rgba(0,189,132,0.4)]" style={{ backgroundColor: (stockData.safetyScore || 85) >= 85 ? '#00BD84' : (stockData.safetyScore || 85) >= 65 ? '#FFCC00' : '#FF333A' }} />
                    </div>
                 </div>
                 
                 <div className="space-y-8 flex flex-col h-full">
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-1.5">
                        <span className="text-[9px] text-[#4A4F59] uppercase tracking-widest block font-black">Liquidity Grade</span>
                        <div className="flex items-center gap-2.5">
                          <div className={cn("w-2.5 h-2.5 rounded-full shadow-[0_0_10px_rgba(0,189,132,0.4)]", (stockData.safetyScore || 85) >= 85 ? "bg-[#00BD84]" : "bg-[#FFCC00]")} />
                          <span className="text-[13px] font-black text-white uppercase italic tracking-tighter">
                            {(stockData.safetyScore || 85) >= 85 ? 'Alpha Prime' : 'Beta Stream'}
                          </span>
                        </div>
                      </div>
                      <div className="space-y-1.5 text-right">
                        <span className="text-[9px] text-[#4A4F59] uppercase tracking-widest block font-black">Momentum Phase</span>
                        <span className="text-[13px] font-black text-[#00BD84] uppercase italic tracking-tighter block">
                          {stockData.pctChange >= 0 ? 'Expansion' : 'Consolidation'}
                        </span>
                      </div>
                    </div>

                    <div className="pt-8 border-t border-[#2A2E35]/50 space-y-4">
                      <span className="text-[9px] text-[#4A4F59] uppercase tracking-widest block font-black">STRATEGIC SIGNAL</span>
                      <div className="flex items-center gap-3">
                        {stockData.change >= 0 ? <TrendingUp size={18} className="text-[#00BD84]" /> : <TrendingDown size={18} className="text-[#FF333A]" />}
                        <span className="text-[15px] font-black text-white italic tracking-tighter uppercase">
                          {stockData.change >= 0 ? 'Active Accumulation' : 'Value Calibration'}
                        </span>
                      </div>
                      <p className="text-[12px] text-[#9299A6] leading-relaxed font-bold">
                        {stockData.change >= 0 
                          ? "Signals indicate high institutional buy pressure. Accumulation core is stabilizing for modular expansion." 
                          : "Asset recalibration in progress. Market discovery phase active as smart money tests new liquidity floors."}
                      </p>
                    </div>

                    <div className="bg-[#1A1D24] p-5 rounded-2xl border border-[#2A2E35] mt-auto">
                       <span className="text-[9px] text-[#00BD84] font-black uppercase tracking-[0.3em] block mb-2">SYSTEM ADVICE</span>
                       <p className="text-[11px] text-white font-black leading-snug">
                         {stockData.change >= 0 
                           ? "EXECUTE ACCUMULATION - Proactive positioning recommended." 
                           : "STANDBY FOR SYNC - Await structural base confirmation."}
                       </p>
                    </div>

                    <button 
                      onClick={() => addMessage({ 
                        role: 'user', 
                        content: `How can ${stockData.symbol} help me grow my earnings? Give me a step-by-step plan in very simple words.`,
                        timestamp: new Date().toISOString()
                      })}
                      className="w-full py-5 bg-[#00BD84] text-black text-[12px] font-black uppercase tracking-[0.25em] rounded-2xl hover:bg-[#00e09e] transition-all transform hover:scale-[1.02] active:scale-95 shadow-[0_20px_40px_rgba(0,189,132,0.2)]"
                    >
                      DOWNLOAD GROWTH MAP
                    </button>
                 </div>
              </div>
            </section>
          </div>
        )}

        {/* Technical Signals Section */}
        {stockData && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { label: 'RSI (14)', value: '62.4', status: 'NEUTRAL', color: '#9299A6' },
              { label: 'MACD (12,26)', value: '+1.42', status: 'BULLISH', color: '#00BD84' },
              { label: 'ADX (20)', value: '28.1', status: 'TRENDING', color: '#00BD84' },
              { label: 'Stoch (K,D)', value: '74, 68', status: 'OVERBOUGHT', color: '#FFCC00' },
            ].map((signal) => (
              <div key={signal.label} className="bg-[#0C0D0F] border border-[#2A2E35] p-6 rounded-2xl shadow-lg relative overflow-hidden group">
                 <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                    <Activity size={40} />
                 </div>
                 <span className="text-[9px] text-[#4A4F59] font-black uppercase tracking-widest block mb-1">{signal.label}</span>
                 <div className="flex items-end justify-between">
                    <span className="text-xl font-black text-white italic">{signal.value}</span>
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded" style={{ backgroundColor: `${signal.color}1A`, color: signal.color }}>{signal.status}</span>
                 </div>
              </div>
            ))}
          </div>
        )}
        {selectedSymbol && stockNews && stockNews.length > 0 && (
          <div className="max-w-[1240px] mx-auto mt-20 space-y-10 pb-20">
            <div className="flex items-center gap-4 justify-between border-b border-[#2A2E35] pb-6">
              <div className="flex items-center gap-4">
                <h3 className="text-3xl font-black text-white uppercase tracking-tighter italic">Intelligence Vectors</h3>
                <span className="px-3 py-1 bg-[#00BD84]/10 text-[#00BD84] text-[9px] font-black uppercase tracking-widest rounded-lg">Real-time Feed</span>
              </div>
              <p className="text-[11px] font-bold text-[#4A4F59] uppercase tracking-[0.2em] hidden md:block">Streaming {selectedSymbol} Institutional Signals</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {stockNews.map((article: any, i: number) => (
                <NewsCard 
                  key={`${article.link}-${i}`}
                  item={{
                    ...article,
                    link: article.link,
                    source: article.publisher,
                    pubDate: article.providerPublishTime * 1000
                  }}
                  onAnalyze={handleAIAnalyze}
                  onRead={(a) => setViewingArticle(a)}
                  analyzingUrl={analyzingUrl}
                  aiAnalysis={aiAnalysis}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    );
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

  const { data: holdingsData, isLoading: isHoldingsLoading } = useQuery({
    queryKey: ['holdingsData', watchlist],
    queryFn: async () => {
      if (watchlist.length === 0) return [];
      const results = await Promise.all(
        watchlist.map(async s => {
           try {
             const res = await axios.get(`/api/stocks/${s}`);
             const data = res.data;
             const sh = (s.charCodeAt(0) % 20) + 5;
             const avg = data.price * (0.8 + (s.charCodeAt(1) % 10) / 25);
             return { 
               s: data.symbol, 
               n: data.name, 
               sh, 
               avg, 
               cur: data.price, 
               up: data.price > avg 
             };
           } catch (e) {
             return null;
           }
        })
      );
      return results.filter(r => r !== null);
    },
    enabled: selectedCategory === 'Portfolio' && watchlist.length > 0
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
    if (selectedCategory === 'News') {
      return (
        <div className="p-8 space-y-8 max-w-[1240px] mx-auto animate-in fade-in duration-500">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-[#2A2E35] pb-8">
             <div className="flex flex-col gap-2">
                <h2 className="text-4xl font-black text-white uppercase tracking-tighter italic">Intelligence Terminal</h2>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-[#00BD84] rounded-full animate-pulse shadow-[0_0_10px_rgba(0,189,132,0.6)]" />
                  <p className="text-sm text-[#9299A6] uppercase tracking-[0.2em] font-bold">Encrypted Handshake Complete • Real-time Stream</p>
                </div>
             </div>
             
             <div className="flex flex-col gap-2 w-full max-w-md">
               <AnimatePresence mode="wait">
                 {newsSearchInput && newsSearchInput.length > 2 && (
                   <motion.div 
                     key="follow-button"
                     initial={{ opacity: 0, height: 0, y: 5 }}
                     animate={{ opacity: 1, height: 'auto', y: 0 }}
                     exit={{ opacity: 0, height: 0, y: 5 }}
                     className="flex justify-start mb-1"
                   >
                      <button 
                         onClick={() => toggleFollowTopic(newsSearchInput)}
                         className={cn(
                           "px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] transition-all shadow-xl flex items-center gap-2.5 border backdrop-blur-md",
                           followedTopics.includes(newsSearchInput.toUpperCase()) 
                             ? "bg-[#00BD84] text-black border-[#00BD84]" 
                             : "bg-black/40 text-[#00BD84] border-[#00BD84]/40 hover:bg-[#00BD84]/20"
                         )}
                      >
                        {followedTopics.includes(newsSearchInput.toUpperCase()) ? (
                          <><Star size={10} fill="currentColor" /> SIGNAL TRACKED</>
                        ) : (
                          <><Activity size={10} /> INITIALIZE VECTOR FOLLOW</>
                        )}
                      </button>
                   </motion.div>
                 )}
               </AnimatePresence>

               <div className="relative group/search w-full">
                 <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#4A4F59] group-focus-within/search:text-[#00BD84] transition-all duration-300" />
                 <input 
                   type="text"
                   placeholder="SEARCH INTEL..."
                   value={newsSearchInput}
                   onChange={(e) => setNewsSearchInput(e.target.value)}
                   onKeyDown={(e) => {
                     if (e.key === 'Enter' && newsSearchInput.trim()) {
                       setNewsSearch(newsSearchInput);
                       setNewsFilter('Search');
                     }
                   }}
                   className="w-full bg-[#0C0D0F] border border-[#2A2E35] rounded-xl py-2.5 pl-11 pr-12 text-xs font-black text-white placeholder-[#4A4F59] focus:border-[#00BD84] focus:ring-2 focus:ring-[#00BD84]/5 transition-all uppercase tracking-widest"
                 />
                 <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {newsSearchInput && (
                    <button 
                      onClick={() => {
                        setNewsSearch('');
                        setNewsSearchInput('');
                        setNewsFilter('All');
                      }}
                      className="px-2 py-1 text-[#FF333A] hover:bg-[#FF333A]/10 rounded-lg transition-colors text-[8px] font-black uppercase"
                    >
                      Clear
                    </button>
                  )}
                 </div>
               </div>

               {newsFilter === 'All' && !newsSearch && (
                 <div className="flex bg-[#0C0D0F] p-2 rounded-3xl border-2 border-[#2A2E35] h-fit self-center">
                  {rssSources.slice(0, 2).map(source => (
                    <button
                      key={source.url}
                      onClick={() => setActiveRssUrl(source.url)}
                      className={cn(
                        "px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
                        activeRssUrl === source.url ? "bg-[#00BD84] text-black shadow-lg" : "text-[#4A4F59] hover:text-white"
                      )}
                    >
                      {source.name}
                    </button>
                  ))}
                 </div>
               )}
             </div>
          </div>

          <div className="flex items-center gap-4 overflow-x-auto no-scrollbar pb-2">
            {Array.from(new Set([
              'All', 
              'Following',
              'Watchlist',
              'Markets', 
              'Capital', 
              'Tech', 
              'AI',
              'Tesla',
              'Energy', 
              'Fashion', 
              'Crypto', 
              ...followedTopics.map(t => {
                const standard = ['Markets', 'Capital', 'Tech', 'AI', 'Tesla', 'Energy', 'Fashion', 'Crypto'];
                const match = standard.find(s => s.toUpperCase() === t.toUpperCase());
                return match || t.split(' ').map(word => word.length <= 2 ? word.toUpperCase() : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
              })
            ])).map(filter => (
               <button
                  key={filter}
                  onClick={() => {
                    setNewsFilter(filter);
                    setNewsSearch('');
                    setNewsSearchInput(filter === 'All' ? '' : filter);
                  }}
                  className={cn(
                    "text-[10px] font-black uppercase tracking-widest px-6 py-2.5 border rounded-2xl transition-all whitespace-nowrap",
                    newsFilter === filter 
                      ? "border-[#00BD84] text-[#00BD84] bg-[#00BD84]/5 shadow-[0_0_15px_rgba(0,189,132,0.1)]" 
                      : "border-[#2A2E35] text-[#4A4F59] hover:border-[#9299A6] bg-[#0C0D0F]"
                  )}
               >
                 {filter}
               </button>
            ))}
          </div>

          {newsSearch && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[#121417] border border-[#2A2E35] rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between gap-6 mb-8 mt-4 shadow-2xl relative overflow-hidden group"
            >
              <div className="absolute top-0 left-0 w-1 h-full bg-[#00BD84] opacity-50" />
              <div className="flex items-center gap-6 z-10">
                <div className="w-16 h-16 bg-[#00BD84]/10 border border-[#00BD84]/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Activity size={32} className="text-[#00BD84]" />
                </div>
                <div className="text-center md:text-left">
                  <h2 className="text-4xl md:text-5xl font-black text-white uppercase italic tracking-tighter leading-none mb-2">{newsSearch}</h2>
                  <div className="flex items-center justify-center md:justify-start gap-4">
                    <span className="text-[9px] font-black text-[#00BD84] uppercase tracking-widest bg-[#00BD84]/10 px-2 py-0.5 rounded border border-[#00BD84]/20 animate-pulse">Deep Intel Active</span>
                    <span className="text-[10px] font-black text-[#4A4F59] uppercase tracking-widest">{activeNewsFeed?.length || 0} Data Signals Found</span>
                  </div>
                </div>
              </div>
              
              <button 
                onClick={() => toggleFollowTopic(newsSearch)}
                className={cn(
                  "px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center gap-3 z-10",
                  followedTopics.includes(newsSearch.toUpperCase()) 
                    ? "bg-[#00BD84] text-black shadow-[0_0_30px_rgba(0,189,132,0.3)] scale-105" 
                    : "bg-[#1A1D24] text-white border border-[#2A2E35] hover:border-[#9299A6]"
                )}
              >
                {followedTopics.includes(newsSearch.toUpperCase()) ? (
                  <>
                    <Star size={14} fill="currentColor" />
                    Following intelligence
                  </>
                ) : (
                  <>
                    <Star size={14} />
                    Follow Topic
                  </>
                )}
              </button>
            </motion.div>
          )}

          {isNewsLoading ? (
             <div className="py-40 text-center space-y-8">
               <div className="w-16 h-16 border-4 border-[#00BD84]/10 border-t-[#00BD84] rounded-full animate-spin mx-auto shadow-[0_0_40px_rgba(0,189,132,0.1)]" />
               <div className="space-y-4">
                 <p className="text-sm font-black text-white uppercase tracking-[0.4em]">Calibrating Vector Streams</p>
                 <div className="flex items-center justify-center gap-2">
                    <span className="w-1.5 h-1.5 bg-[#00BD84] rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                    <span className="w-1.5 h-1.5 bg-[#00BD84] rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                    <span className="w-1.5 h-1.5 bg-[#00BD84] rounded-full animate-bounce"></span>
                 </div>
                 <p className="text-[9px] text-[#4A4F59] font-bold uppercase tracking-[0.2em] max-w-xs mx-auto">Establishing encrypted handshake with {newsFilter === 'All' ? rssSources.find(s => s.url === activeRssUrl)?.name : newsFilter} intelligence node...</p>
               </div>
             </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-32">
              {activeNewsFeed && activeNewsFeed.length > 0 ? (
                activeNewsFeed.map((item: any, i: number) => (
                  <NewsCard 
                    key={`${item.link}-${i}`} 
                    item={item} 
                    onAnalyze={handleAIAnalyze}
                    onRead={(article) => setViewingArticle(article)}
                    analyzingUrl={analyzingUrl}
                    aiAnalysis={aiAnalysis}
                  />
                ))
              ) : (
                <div className="col-span-full py-40 text-center space-y-6 bg-[#0C0D0F] border-2 border-dashed border-[#2A2E35] rounded-3xl">
                  <Search size={48} className="mx-auto text-[#4A4F59] opacity-20" />
                  <div className="space-y-4">
                    <p className="text-xl font-black text-white uppercase italic tracking-tighter">No Specific Signals In This Vector</p>
                    <p className="text-[10px] text-[#4A4F59] font-black uppercase tracking-widest max-w-sm mx-auto">The intelligence nodes are currently scanning for fresh data on {newsFilter}. Try broadening your search or following more vectors.</p>
                  </div>
                  <button 
                    onClick={() => {
                      setNewsFilter('All');
                      setNewsSearch('');
                      setNewsSearchInput('');
                    }}
                    className="px-8 py-3 bg-[#1A1D24] text-[#00BD84] border border-[#00BD84]/30 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#00BD84]/10 transition-all"
                  >
                    Reset Terminal Feed
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      );
    }
    
    if (selectedCategory === 'Analyst') {
      if (!selectedSymbol) {
        return (
          <div className="h-full flex flex-col items-center justify-center text-center p-20 space-y-8 animate-in fade-in duration-500">
            <div className="w-32 h-32 bg-[#0C0D0F] border border-[#2A2E35] rounded-full flex items-center justify-center shadow-2xl">
              <Search size={48} className="text-[#00BD84] opacity-20" />
            </div>
            <div className="space-y-4">
              <h2 className="text-3xl font-black text-white uppercase tracking-tighter italic">Analyst Terminal Idle</h2>
              <p className="text-sm text-[#9299A6] uppercase tracking-[0.2em] font-bold max-w-sm">Select an institutional asset to initiate deep-dive intelligence synthesis.</p>
            </div>
            <button 
              onClick={() => setSelectedCategory('Explore')}
              className="px-10 py-4 bg-[#00BD84] text-black text-[11px] font-black uppercase tracking-widest rounded-2xl hover:bg-[#00e09e] transition-all"
            >
              Discover Assets
            </button>
          </div>
        );
      }
      return renderStockDetail();
    }

    if (selectedCategory === 'Markets' || !selectedCategory) {
      return (
        <div className="p-4 md:p-8 space-y-8 md:space-y-12 max-w-[1240px] mx-auto animate-in fade-in duration-500">
          <div className="flex flex-col gap-2">
             <h2 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tighter italic">Global Market Oversight</h2>
             <p className="text-xs md:text-sm text-[#9299A6]">Live institutional index feeds powered by Yahoo Finance intelligence.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayIndices.map((idx, i) => (
              <div 
                key={i} 
                className="bg-[#0C0D0F] border border-[#2A2E35] p-8 rounded-2xl hover:border-[#00BD84]/50 transition-all group cursor-pointer shadow-xl"
                onClick={() => handleSelectSymbol(idx.symbol)}
              >
                <div className="flex justify-between items-start mb-6">
                  <span className="text-[11px] font-black text-[#4A4F59] uppercase tracking-[0.3em] italic">{idx.name}</span>
                  <div className={cn("px-2.5 py-1 rounded-lg text-[10px] font-black", idx.up ? "bg-[#00BD84]/10 text-[#00BD84]" : "bg-[#FF333A]/10 text-[#FF333A]")}>
                    {idx.pct}
                  </div>
                </div>
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl font-black text-white tracking-tighter">{idx.value}</span>
                  <span className={cn("text-xs font-bold font-mono", idx.up ? "text-[#00BD84]" : "text-[#FF333A]")}>{idx.change}</span>
                </div>
                <div className="mt-8 h-12 w-full overflow-hidden opacity-20 group-hover:opacity-100 transition-all duration-700">
                   <div className={cn("w-full h-full", idx.up ? "bg-[#00BD84]" : "bg-[#FF333A]")} style={{ clipPath: 'polygon(0% 100%, 15% 85%, 30% 95%, 45% 60%, 60% 75%, 75% 30%, 90% 45%, 100% 0%, 100% 100%)' }} />
                </div>
              </div>
            ))}
          </div>

          <div className="bg-[#0C0D0F] border border-[#2A2E35] rounded-3xl p-10 overflow-hidden relative">
            <div className="absolute top-0 right-0 p-10 opacity-5">
              <LayoutGrid size={120} className="text-white" />
            </div>
            <h3 className="text-[11px] font-black text-white uppercase tracking-[0.5em] mb-10 italic">Intelligence Vectors</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                { s: 'NVDA', n: 'NVIDIA Corp', p: '902.50', c: '+12.40', up: true },
                { s: 'TSLA', n: 'Tesla, Inc.', p: '175.22', c: '-4.15', up: false },
                { s: 'AAPL', n: 'Apple Inc.', p: '170.12', c: '+0.45', up: true },
                { s: 'AMD', n: 'AMD Inc.', p: '180.44', c: '-2.10', up: false },
              ].map(m => (
                <div 
                  key={m.s} 
                  className="p-6 bg-[#121417] border border-[#2A2E35] rounded-2xl hover:border-[#00BD84]/30 transition-all group cursor-pointer"
                  onClick={() => handleSelectSymbol(m.s)}
                >
                  <div className="flex justify-between items-center mb-4">
                    <div className="text-[13px] font-black text-white uppercase tracking-tighter italic">{m.s}</div>
                    <div className={cn("text-[10px] font-bold font-mono", m.up ? "text-[#00BD84]" : "text-[#FF333A]")}>{m.c}</div>
                  </div>
                  <div className="text-xl font-black text-white mb-1 group-hover:text-[#00BD84] transition-colors">{formatCurrency(parseFloat(m.p))}</div>
                  <div className="text-[9px] text-[#4A4F59] font-black uppercase tracking-widest">{m.n}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Global Market News Section */}
          {marketNews && marketNews.length > 0 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-6 bg-[#00BD84]" />
                <h3 className="text-xl font-black text-white uppercase tracking-tighter italic">Global Market Feed</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {marketNews.map((article: any, i: number) => (
                  <NewsCard 
                    key={`${article.link}-${i}`}
                    item={{
                      ...article,
                      link: article.link,
                      source: article.publisher,
                      pubDate: article.providerPublishTime * 1000
                    }}
                    onAnalyze={handleAIAnalyze}
                    onRead={(a) => setViewingArticle(a)}
                    analyzingUrl={analyzingUrl}
                    aiAnalysis={aiAnalysis}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      );
    }

    if (selectedCategory === 'Explore') {
      return (
        <div className="p-6 space-y-12 max-w-[1240px] mx-auto animate-in fade-in duration-500">
          <div className="flex flex-col gap-2">
             <h2 className="text-3xl font-black text-white uppercase tracking-tighter italic">Market Discovery</h2>
             <p className="text-sm text-[#9299A6]">Explore high-velocity sectors and hidden institutional gems.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { t: 'AI Infrastructure', d: 'The backbone of the machine learning revolution and data center expansion.', s: 'SMCI', c: 'Technology' },
              { t: 'Energy Storage', d: 'Battery technology and lithium supply chain leaders powering the grid.', s: 'ALB', c: 'Energy' },
              { t: 'Digital Assets', d: 'Institutional crypto adoption and blockchain infrastructure providers.', s: 'COIN', c: 'Finance' },
              { t: 'High-Yield Assets', d: 'Reliable cash flow from market-leading dividends and REIT structures.', s: 'O', c: 'Real Estate' },
              { t: 'Green Mobility', d: 'EV manufacturers and charging network providers driving transit shifts.', s: 'RIVN', c: 'Automotive' },
              { t: 'Cloud Security', d: 'Protecting the global digital enterprise landscape from systemic threats.', s: 'CRWD', c: 'Cybersecurity' },
            ].map(sec => (
              <div 
                key={sec.t} 
                onClick={() => handleSelectSymbol(sec.s)}
                className="bg-[#0C0D0F] border border-[#2A2E35] p-8 rounded-3xl hover:border-[#00BD84]/50 transition-all cursor-pointer group relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#00BD84]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="flex justify-between items-start mb-6">
                  <span className="text-[10px] font-black text-[#4A4F59] uppercase tracking-[0.3em] italic">{sec.c}</span>
                  <ArrowUpRight size={16} className="text-[#4A4F59] group-hover:text-white transition-colors" />
                </div>
                <h4 className="text-xl font-black text-white mb-3 group-hover:text-[#00BD84] transition-colors uppercase italic">{sec.t}</h4>
                <p className="text-[13px] text-[#9299A6] leading-relaxed mb-6 font-medium">{sec.d}</p>
                <div className="flex items-center gap-3">
                   <div className="px-3 py-1 bg-[#121417] border border-[#2A2E35] rounded-lg text-[10px] font-black text-[#00BD84] uppercase tracking-widest">
                     Primary: {sec.s}
                   </div>
                   <div className="w-1 h-1 rounded-full bg-[#4A4F59]" />
                   <span className="text-[9px] text-[#4A4F59] uppercase font-black tracking-widest">Buy Rating</span>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-[#0C0D0F] border border-[#2A2E35] rounded-3xl overflow-hidden shadow-2xl">
            <div className="p-8 border-b border-[#2A2E35] bg-[#121417] flex justify-between items-center">
               <div className="flex items-center gap-4">
                  <h3 className="text-[11px] font-black text-white uppercase tracking-[0.5em] italic">Institutional Focus</h3>
                  <span className="px-3 py-1 bg-[#00BD84]/10 text-[#00BD84] text-[9px] font-black uppercase tracking-widest rounded-lg">High Performance</span>
               </div>
               <span className="text-[10px] text-[#4A4F59] font-black uppercase tracking-widest">Q4 Alpha Stream</span>
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
              ].map((gem, i) => (
                <div 
                  key={`${gem.s}-${i}`} 
                  onClick={() => handleSelectSymbol(gem.s)}
                  className="p-8 hover:bg-[#1A1D24] transition-all cursor-pointer group flex flex-col justify-between"
                >
                  <div>
                    <div className="text-[9px] font-black text-[#00BD84] mb-2 uppercase tracking-widest">{gem.g} Target Projection</div>
                    <div className="text-2xl font-black text-white italic uppercase tracking-tighter mb-1">{gem.s}</div>
                    <div className="text-[10px] text-[#4A4F59] uppercase font-black tracking-widest">{gem.n}</div>
                  </div>
                  <div className="mt-6 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity">
                     <span className="text-[9px] text-white/40 uppercase font-black tracking-widest">Inspect Vector</span>
                     <ArrowUpRight size={14} className="text-[#00BD84]" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    if (selectedCategory === 'Settings') {
      const notificationOptions: { label: string; key: 'priceChanges' | 'earnings' | 'breakingNews' | 'ratingChanges' }[] = [
        { label: 'Significant Price Changes', key: 'priceChanges' },
        { label: 'Earnings Announcements', key: 'earnings' },
        { label: 'Breaking Sector News', key: 'breakingNews' },
        { label: 'Analyst Rating Changes', key: 'ratingChanges' },
      ];

      return (
        <div className="p-8 md:p-12 space-y-12 max-w-[1240px] mx-auto animate-in fade-in duration-500 pb-32">
          <div className="flex flex-col gap-2 text-center md:text-left">
             <h2 className="text-4xl font-black text-white uppercase tracking-tighter italic">System Configuration</h2>
             <p className="text-sm text-[#9299A6] font-bold uppercase tracking-[0.3em] max-w-xl">Manage account preferences, data synchronization, and institutional intelligence vectors.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <section className="bg-[#0C0D0F] border border-[#2A2E35] p-10 rounded-3xl space-y-10 shadow-2xl flex flex-col relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#00BD84]/10 to-transparent opacity-20" />
              <div className="flex items-center gap-4 mb-2">
                <Bell size={20} className="text-[#00BD84]" />
                <h3 className="text-[12px] font-black text-white uppercase tracking-[0.5em] italic">Alert Matrix</h3>
              </div>
              <div className="space-y-8 flex-1">
                {notificationOptions.map(opt => {
                  const active = settings.notifications[opt.key];
                  return (
                    <div 
                      key={opt.key} 
                      className="flex items-center justify-between group/opt py-2 border-b border-[#2A2E35]/30"
                    >
                      <div className="flex flex-col">
                        <span className={cn("text-xs font-black transition-colors uppercase tracking-[0.1em]", active ? "text-white" : "text-[#4A4F59] group-hover/opt:text-[#9299A6]")}>{opt.label}</span>
                        <span className="text-[9px] text-[#4A4F59] font-bold uppercase mt-1">Institutional Notification</span>
                      </div>
                      <button 
                        onClick={() => updateSetting(opt.key)}
                        className={cn("w-14 h-7 rounded-full relative transition-all duration-300 shadow-inner", active ? "bg-[#00BD84]" : "bg-[#2A2E35]")}
                      >
                        <div className={cn("absolute top-1 w-5 h-5 rounded-full bg-white transition-all duration-300 shadow-lg", active ? "left-[32px]" : "left-1")} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="bg-[#0C0D0F] border border-[#2A2E35] p-10 rounded-3xl space-y-10 shadow-2xl flex flex-col relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-transparent opacity-20" />
              <div className="flex items-center gap-4 mb-2">
                <LayoutGrid size={20} className="text-[#00BD84]" />
                <h3 className="text-[12px] font-black text-white uppercase tracking-[0.5em] italic">Institutional Handshake</h3>
              </div>
              <div className="space-y-8 flex-1">
                {Object.entries(settings.dataSourceStatus).map(([name, status]) => {
                  const color = status === 'ACTIVE' ? '#00BD84' : status === 'SYNCING' ? '#00BD84' : '#FFCC00';
                  return (
                    <div key={name} className="flex items-center justify-between group/node py-2 border-b border-[#2A2E35]/30">
                      <div className="flex flex-col">
                        <span className="text-xs font-black text-white uppercase tracking-[0.1em]">{name}</span>
                        <span className="text-[9px] text-[#4A4F59] font-black uppercase tracking-widest mt-1">Provider Intelligence Node</span>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                           <div className={cn("w-1.5 h-1.5 rounded-full", status === 'SYNCING' ? "bg-[#00BD84] animate-ping" : "")} style={{ backgroundColor: color }} />
                           <span className={cn(
                             "text-[10px] font-black uppercase tracking-widest transition-all",
                           )} style={{ color }}>{status}</span>
                        </div>
                        <button 
                          onClick={() => syncDataSource(name)}
                          disabled={status === 'SYNCING'}
                          className={cn(
                            "text-[9px] px-5 py-2.5 rounded-xl border border-[#2A2E35] text-white font-black uppercase tracking-widest hover:bg-[#00BD84] hover:text-black hover:border-[#00BD84] transition-all transform active:scale-95 shadow-lg",
                            status === 'SYNCING' && "opacity-50 cursor-not-allowed"
                          )}
                        >
                          {status === 'SYNCING' ? 'Refreshing Node...' : 'Sync Node'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
          
          <div className="bg-[#0C0D0F] border border-[#2A2E35] p-10 rounded-3xl shadow-xl flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="space-y-2">
               <h4 className="text-[11px] font-black text-white uppercase tracking-[0.4em] italic leading-none">Institutional Security</h4>
               <p className="text-[11px] text-[#4A4F59] font-bold uppercase tracking-widest">End-to-end encrypted market surveillance tunnel active.</p>
            </div>
            <button className="px-8 py-3 bg-[#1A1D24] border border-[#2A2E35] text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:border-[#FF333A] hover:text-[#FF333A] transition-all">
               Purge System Cache
            </button>
          </div>
        </div>
      );
    }

    if (selectedCategory === 'Portfolio') {
      return (
        <div className="p-4 md:p-8 space-y-8 md:space-y-12 max-w-[1240px] mx-auto animate-in fade-in duration-500">
           <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
             <div className="flex flex-col gap-2">
                <h2 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tighter italic">Strategic Portfolio</h2>
                <p className="text-xs md:text-sm text-[#9299A6]">Omni-channel tracking for institutional and retail holdings.</p>
             </div>
             <button 
                onClick={() => setSelectedCategory('Explore')}
                className="w-full sm:w-auto bg-[#00BD84] text-black px-8 py-3 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] hover:bg-[#00e09e] transition-all shadow-[0_0_20px_rgba(0,189,132,0.1)]"
              >
                Augment Asset
             </button>
           </div>
           <div className="bg-[#0C0D0F] border border-[#2A2E35] rounded-3xl overflow-hidden shadow-2xl">
              {holdingsData && holdingsData.length > 0 && (
                <>
                <div className="px-6 py-8 md:px-10 md:py-12 bg-gradient-to-br from-[#00BD84]/10 to-transparent border-b border-[#2A2E35] flex flex-col lg:flex-row items-center justify-between gap-8 md:gap-12">
                   <div className="flex flex-col text-center lg:text-left">
                    <span className="text-[10px] font-black text-[#00BD84] uppercase tracking-[0.5em] mb-2 italic">Net Liquidity Value</span>
                    <span className="text-3xl md:text-4xl font-black text-white tracking-tighter">
                      {formatCurrency(holdingsData.reduce((acc, h) => acc + (h.cur * h.sh), 0))}
                    </span>
                  </div>

                  <div className="flex-1 w-full h-[100px] md:h-[120px]">
                     <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={[
                          { name: 'W1', value: 92000 },
                          { name: 'W2', value: 95000 },
                          { name: 'W3', value: 93500 },
                          { name: 'W4', value: 98000 },
                          { name: 'W5', value: 102000 },
                          { name: 'W6', value: 108000 },
                        ]}>
                           <defs>
                              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#00BD84" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#00BD84" stopOpacity={0}/>
                              </linearGradient>
                           </defs>
                           <Area type="monotone" dataKey="value" stroke="#00BD84" fillOpacity={1} fill="url(#colorValue)" strokeWidth={2} />
                        </AreaChart>
                     </ResponsiveContainer>
                  </div>

                  <div className="flex flex-col items-end">
                    <span className="text-[10px] font-black text-[#9299A6] uppercase tracking-[0.3em] mb-2 italic">Cumulative Performance</span>
                    <span className={cn(
                      "text-2xl font-black italic tracking-tighter",
                      holdingsData.reduce((acc, h) => acc + ((h.cur - h.avg) * h.sh), 0) >= 0 ? "text-[#00BD84]" : "text-[#FF333A]"
                    )}>
                      {holdingsData.reduce((acc, h) => acc + ((h.cur - h.avg) * h.sh), 0) >= 0 ? '+' : ''}
                      {formatCurrency(holdingsData.reduce((acc, h) => acc + ((h.cur - h.avg) * h.sh), 0))}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-10 border-b border-[#2A2E35] bg-[#0A0B0E]">
                   <div className="h-[240px] bg-[#121417] rounded-2xl p-6 border border-[#2A2E35] flex flex-col">
                      <span className="text-[10px] font-black text-[#4A4F59] uppercase tracking-widest mb-4">Asset Diversification</span>
                      <div className="flex-1">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={holdingsData.map(h => ({ name: h.n, value: h.cur * h.sh }))}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={80}
                              paddingAngle={5}
                              dataKey="value"
                            >
                              {holdingsData.map((_entry, index) => (
                                <Cell key={`cell-${index}`} fill={[
                                  '#00BD84', '#00A1F1', '#F25022', '#7FBA00', '#FFB900'
                                ][index % 5]} />
                              ))}
                            </Pie>
                            <RechartsTooltip 
                               contentStyle={{ backgroundColor: '#0C0D0F', border: '1px solid #2A2E35', borderRadius: '8px' }}
                               itemStyle={{ color: '#white', fontSize: '10px', textTransform: 'uppercase' }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                   </div>
                   <div className="h-[240px] bg-[#121417] rounded-2xl p-6 border border-[#2A2E35] flex flex-col">
                      <span className="text-[10px] font-black text-[#4A4F59] uppercase tracking-widest mb-4">Sector Exposure</span>
                      <div className="flex flex-col justify-center flex-1 space-y-4">
                         {[
                           { name: 'Technology', value: 65, color: '#00BD84' },
                           { name: 'Finance', value: 15, color: '#00A1F1' },
                           { name: 'Communication', value: 10, color: '#F25022' },
                           { name: 'Others', value: 10, color: '#7FBA00' }
                         ].map(item => (
                           <div key={item.name} className="space-y-1">
                              <div className="flex justify-between items-center text-[9px] font-black text-white uppercase italic">
                                 <span>{item.name}</span>
                                 <span>{item.value}%</span>
                              </div>
                              <div className="h-1 w-full bg-[#2A2E35] rounded-full overflow-hidden">
                                 <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${item.value}%`, backgroundColor: item.color }} />
                              </div>
                           </div>
                         ))}
                      </div>
                   </div>
                </div>
                </>
              )}
              <div className="overflow-x-auto no-scrollbar">
                <table className="w-full text-left border-collapse min-w-[1000px]">
                 <thead>
                    <tr className="bg-[#121417] border-b border-[#2A2E35]">
                       <th className="px-8 py-6 text-[10px] font-black text-[#4A4F59] uppercase tracking-widest italic">Asset Vector</th>
                       <th className="px-8 py-6 text-[10px] font-black text-[#4A4F59] uppercase tracking-widest text-right">Units</th>
                       <th className="px-8 py-6 text-[10px] font-black text-[#4A4F59] uppercase tracking-widest text-right">Acquisition</th>
                       <th className="px-8 py-6 text-[10px] font-black text-[#4A4F59] uppercase tracking-widest text-right">Terminal</th>
                       <th className="px-8 py-6 text-[10px] font-black text-[#4A4F59] uppercase tracking-widest text-right">Delta</th>
                       <th className="px-8 py-6 text-[10px] font-black text-[#4A4F59] uppercase tracking-widest text-right">Trend</th>
                       <th className="px-8 py-6 text-[10px] font-black text-[#4A4F59] uppercase tracking-widest text-center">Sync</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-[#2A2E35]/50">
                    {isHoldingsLoading ? (
                      <tr>
                        <td colSpan={7} className="px-10 py-32 text-center">
                          <div className="w-12 h-12 border-4 border-[#00BD84]/10 border-t-[#00BD84] rounded-full animate-spin mx-auto mb-6 shadow-[0_0_30px_rgba(0,189,132,0.1)]" />
                          <span className="text-[11px] font-black text-[#4A4F59] uppercase tracking-[0.5em] animate-pulse">Synchronizing Ledger State...</span>
                        </td>
                      </tr>
                    ) : holdingsData && holdingsData.length > 0 ? (
                      holdingsData.map(h => {
                        const pl = (h.cur - h.avg) * h.sh;
                        const plPct = ((h.cur - h.avg) / h.avg) * 100;
                        return (
                          <tr key={h.s} className="hover:bg-[#1A1D24] transition-all group cursor-pointer" onClick={() => handleSelectSymbol(h.s)}>
                             <td className="px-8 py-8">
                                <div className="flex items-center gap-4">
                                   <div className="w-10 h-10 rounded-xl bg-[#1A1D24] border border-[#2A2E35] flex items-center justify-center text-[12px] font-black text-[#00BD84] group-hover:bg-[#00BD84] group-hover:text-black group-hover:border-[#00BD84] transition-all">{h.s[0]}</div>
                                   <div>
                                      <div className="text-[15px] font-black text-white uppercase italic tracking-tighter transition-colors group-hover:text-[#00BD84]">{h.n}</div>
                                      <div className="text-[9px] text-[#4A4F59] uppercase font-bold tracking-[0.15em]">{h.s}</div>
                                   </div>
                                </div>
                             </td>
                             <td className="px-8 py-8 text-right font-black text-[13px] text-white tracking-tight">{h.sh}</td>
                             <td className="px-8 py-8 text-right font-medium text-[13px] text-[#9299A6]">{formatCurrency(h.avg)}</td>
                             <td className="px-8 py-8 text-right font-black text-[13px] text-white tracking-tight">{formatCurrency(h.cur)}</td>
                             <td className={cn("px-8 py-8 text-right font-black text-[13px] tracking-tight", pl >= 0 ? "text-[#00BD84]" : "text-[#FF333A]")}>
                                {pl >= 0 ? '+' : ''}{formatCurrency(pl)}
                                <span className="block text-[10px] opacity-60 italic tracking-widest font-bold">({pl >= 0 ? '+' : ''}{plPct.toFixed(2)}%)</span>
                             </td>
                             <td className="px-8 py-8">
                                <div className="w-24 h-10 ml-auto grayscale opacity-50 group-hover:grayscale-0 group-hover:opacity-100 transition-all">
                                   <ResponsiveContainer width="100%" height="100%">
                                      <AreaChart data={[
                                        { v: 10 + (h.s.charCodeAt(0)%10) },
                                        { v: 12 + (h.s.charCodeAt(1)%10) },
                                        { v: 8  + (h.s.charCodeAt(2)%10) },
                                        { v: 15 + (h.s.charCodeAt(0)%10) },
                                        { v: 14 + (h.s.charCodeAt(1)%10) },
                                      ]}>
                                         <Area type="monotone" dataKey="v" stroke={pl >= 0 ? "#00BD84" : "#FF333A"} fillOpacity={0.1} fill={pl >= 0 ? "#00BD84" : "#FF333A"} strokeWidth={1} />
                                      </AreaChart>
                                   </ResponsiveContainer>
                                </div>
                             </td>
                             <td className="px-8 py-8 text-center text-[#4A4F59]">
                                <Bot size={18} className="mx-auto group-hover:text-[#00BD84] transition-colors" />
                             </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={7} className="px-10 py-32 text-center">
                          <p className="text-[11px] text-[#4A4F59] font-black uppercase tracking-[0.5em] mb-8">No Active Vectors Detected</p>
                          <button 
                            onClick={() => setSelectedCategory('Explore')}
                            className="text-[#00BD84] text-[10px] font-black uppercase tracking-widest border-b-2 border-[#00BD84]/30 hover:border-[#00BD84] transition-all pb-1"
                          >
                            Explore Growth Sectors
                          </button>
                        </td>
                      </tr>
                    )}
                 </tbody>
              </table>
            </div>
           </div>
        </div>
      );
    }

    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-20 space-y-8 animate-in fade-in duration-500">
        <div className="w-32 h-32 bg-[#0C0D0F] border border-[#2A2E35] rounded-full flex items-center justify-center shadow-2xl">
          <TrendingUp size={48} className="text-[#00BD84] opacity-20" />
        </div>
        <div className="space-y-4">
          <h2 className="text-3xl font-black text-white uppercase tracking-tighter italic">Selection Required</h2>
          <p className="text-sm text-[#9299A6] uppercase tracking-[0.2em] font-bold max-w-sm">No institutional focus selected. Return to markets or discovery to pivot.</p>
        </div>
        <button 
          onClick={() => setSelectedCategory('Markets')}
          className="px-10 py-4 bg-[#00BD84] text-black text-[11px] font-black uppercase tracking-widest rounded-2xl hover:bg-[#00e09e] transition-all"
        >
          Return to Markets
        </button>
      </div>
    );
  };

  return (
    <div className="flex-1 bg-[#121417] flex flex-col overflow-hidden font-sans">
      {/* Top Navigation */}
      <nav className="h-14 bg-[#0C0D0F] border-b border-[#2A2E35] flex items-center justify-between px-6 shrink-0 z-50">
        <div className="flex items-center gap-4 lg:gap-8 min-w-0">
          <div className="w-10 h-10 bg-[#1A1D24] rounded-xl flex items-center justify-center border border-[#2A2E35] group hover:border-[#00BD84] transition-all cursor-pointer shrink-0">
             <div className="w-5 h-5 bg-[#00BD84] rounded-sm group-hover:rotate-45 transition-transform duration-500" />
          </div>
          <div className="flex items-center gap-2 lg:gap-6 text-[13px] font-semibold overflow-x-auto no-scrollbar py-2">
            {['Analyst', 'Markets', 'Explore', 'News', 'Portfolio', 'Settings'].map((item) => (
              <button 
                key={item} 
                onClick={() => setSelectedCategory(item)}
                className={cn(
                  "px-3 py-1.5 rounded-lg transition-all cursor-pointer relative whitespace-nowrap",
                  selectedCategory === item ? "text-[#00BD84] bg-[#00BD84]/10" : "text-[#9299A6] hover:text-white"
                )}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
          <div className="flex items-center gap-3 sm:gap-6 shrink-0 ml-4">
            <button 
              onClick={() => setIsAsideOpen(!isAsideOpen)}
              className={cn(
                "p-1.5 rounded hover:bg-[#1A1D24] transition-colors relative lg:hidden",
                isAsideOpen ? "text-[#00BD84]" : "text-[#4A4F59]"
              )}
              title="Toggle Sidebar"
            >
              <Search size={20} />
            </button>
            <button 
              onClick={() => setShowChat(!showChat)}
              className={cn(
                "p-1.5 rounded hover:bg-[#1A1D24] transition-colors relative",
                showChat ? "text-[#00BD84]" : "text-[#4A4F59]"
              )}
            >
              <Bot size={20} />
            </button>
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className={cn(
                  "p-1.5 rounded hover:bg-[#1A1D24] transition-colors relative",
                  showNotifications ? "bg-[#1A1D24] text-[#00BD84]" : "text-[#4A4F59]"
                )}
              >
                <Bell size={20} />
                {notifications.some(n => !n.read) && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#00BD84] rounded-full border border-[#0C0D0F]" />
                )}
              </button>

              <AnimatePresence>
                {showNotifications && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute top-full right-0 mt-2 w-80 bg-[#0C0D0F] border border-[#2A2E35] rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-[100]"
                  >
                    <div className="p-4 border-b border-[#2A2E35] flex justify-between items-center">
                      <h4 className="text-[10px] font-black text-white uppercase tracking-widest">Global Alerts</h4>
                      <button onClick={clearNotifications} className="text-[9px] text-[#4A4F59] hover:text-white uppercase">Clear All</button>
                    </div>
                    <div className="max-h-96 overflow-y-auto no-scrollbar">
                      {notifications.length === 0 ? (
                        <div className="p-8 text-center text-[10px] text-[#4A4F59] uppercase tracking-widest">No active alerts</div>
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
                                "text-[8px] font-black uppercase px-1 rounded",
                                n.type === 'price' ? "bg-[#00BD84]/10 text-[#00BD84]" : "bg-blue-500/10 text-blue-500"
                              )}>{n.type}</span>
                              <span className="text-[8px] text-[#4A4F59] font-mono">{new Date(n.timestamp).toLocaleTimeString()}</span>
                            </div>
                            <h5 className="text-[11px] font-bold text-white mb-0.5">{n.title}</h5>
                            <p className="text-[10px] text-[#9299A6] leading-tight">{n.message}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#00BD84] to-[#008A61] flex items-center justify-center text-black font-black text-[10px] border border-[#2A2E35]">
              YK
            </div>
          </div>
      </nav>

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Secondary Header / Indices Ticker */}
        <div className="h-14 bg-[#0C0D0F] border-b border-[#2A2E35] flex items-center overflow-hidden shrink-0 pointer-events-none select-none relative">
          <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-[#0C0D0F] to-transparent z-10" />
          <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-[#0C0D0F] to-transparent z-10" />
          
          <motion.div 
            className="flex whitespace-nowrap"
            animate={{ x: [0, -2000] }}
            transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
          >
            {[...displayIndices, ...displayIndices, ...displayIndices, ...displayIndices, ...displayIndices].map((idx, i) => (
              <div key={`${idx.name}-${i}`} className="flex-none px-8 border-r border-[#2A2E35]/50 flex flex-col justify-center h-12">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[11px] font-bold text-[#E0E0E0]">{idx.name}</span>
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

        <main className="flex-1 overflow-hidden flex flex-col lg:flex-row relative">
          <div className="flex-1 overflow-y-auto no-scrollbar bg-[#060608]">
            {renderContent()}
          </div>

          {/* Sidebar Overlay for Mobile */}
          <AnimatePresence>
            {isAsideOpen && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsAsideOpen(false)}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
              />
            )}
          </AnimatePresence>

          <aside className={cn(
            "fixed inset-y-0 right-0 z-50 lg:static lg:block bg-[#0C0D0F] border-l border-[#2A2E35] flex flex-col shrink-0 transition-transform duration-300 ease-in-out",
            isAsideOpen ? "translate-x-0 w-full sm:w-84" : "translate-x-full lg:translate-x-0 w-84 shadow-2xl lg:shadow-none"
          )}>
            <div className="p-4 border-b border-[#2A2E35] lg:hidden flex justify-between items-center bg-[#121417]">
               <span className="text-[10px] font-black text-white uppercase tracking-widest">Oversight Terminal</span>
               <button onClick={() => setIsAsideOpen(false)} className="p-2 text-[#4A4F59] hover:text-white">
                  <X size={20} />
               </button>
            </div>
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
                      <button onClick={() => setShowChat(false)} className="text-[#4A4F59] hover:text-white transition-all">
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

            <div className="p-4 border-b border-[#2A2E35] bg-[#0C0D0F]/80 backdrop-blur">
               <form onSubmit={handleSearchSubmit} className="relative group">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4A4F59]" size={14} />
                  <input 
                    type="text" 
                    value={searchInput}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    placeholder="Search Markets..."
                    className="w-full bg-[#1A1D24] border border-[#2A2E35] rounded-xl py-2.5 pl-10 pr-4 text-xs font-medium text-white focus:outline-none focus:border-[#00BD84] transition-all"
                  />
                  
                  <AnimatePresence>
                    {searchInput.length > 1 && (searchResults.length > 0 || isSearching) && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute top-full left-0 right-0 mt-3 bg-[#0C0D0F] border border-[#2A2E35] shadow-[0_30px_60px_rgba(0,0,0,0.8)] z-[100] max-h-96 overflow-y-auto rounded-2xl py-3 flex flex-col divide-y divide-[#2A2E35]/50"
                      >
                        {isSearching ? (
                          <div className="px-6 py-10 flex flex-col items-center gap-4">
                             <div className="w-6 h-6 border-2 border-[#00BD84]/20 border-t-[#00BD84] rounded-full animate-spin" />
                             <span className="text-[10px] text-[#4A4F59] font-black uppercase tracking-widest">Identifying Assets...</span>
                          </div>
                        ) : (
                          searchResults.map((res) => (
                            <button
                              key={res.symbol}
                              type="button"
                              onClick={() => handleSelectSymbol(res.symbol)}
                              className="w-full text-left px-5 py-4 hover:bg-[#1A1D24] group transition-all flex justify-between items-center"
                            >
                              <div className="flex gap-4 items-center">
                                <div className="w-10 h-10 rounded-xl bg-[#121417] border border-[#2A2E35] flex items-center justify-center font-black text-white group-hover:text-[#00BD84] transition-colors shadow-inner">{res.symbol[0]}</div>
                                <div className="flex flex-col min-w-0">
                                    <div className="flex items-center gap-2">
                                      <span className="text-[14px] font-black text-white group-hover:text-[#00BD84] transition-colors">{res.name}</span>
                                      <span className="text-[9px] text-[#4A4F59] font-mono leading-none">{res.exchange}</span>
                                    </div>
                                    <span className="text-[11px] text-[#9299A6] truncate max-w-[160px] font-medium">{res.symbol}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleWatchlist(res.symbol);
                                    if (!watchlist.includes(res.symbol.toUpperCase())) {
                                      addNotification({
                                        title: 'Asset Added',
                                        message: `Successfully synchronized ${res.symbol} to your Oversight Portfolio.`,
                                        type: 'news'
                                      });
                                    }
                                  }}
                                  className="p-1"
                                >
                                  <Star 
                                    size={14} 
                                    className={cn("transition-colors", watchlist.includes(res.symbol.toUpperCase()) ? "text-[#00BD84] fill-current" : "text-[#4A4F59] hover:text-white")} 
                                  />
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleWatchlist(res.symbol);
                                    if (!watchlist.includes(res.symbol.toUpperCase())) {
                                      addNotification({
                                        title: 'Asset Added',
                                        message: `Successfully synchronized ${res.symbol} to your Oversight Portfolio.`,
                                        type: 'news'
                                      });
                                    }
                                  }}
                                  className={cn(
                                    "px-3 py-1 rounded text-[9px] font-black uppercase tracking-widest transition-all",
                                    watchlist.includes(res.symbol.toUpperCase()) 
                                      ? "bg-rose-500/10 text-rose-500 hover:bg-rose-500/20" 
                                      : "bg-[#00BD84]/10 text-[#00BD84] hover:bg-[#00BD84]/20"
                                  )}
                                >
                                  {watchlist.includes(res.symbol.toUpperCase()) ? 'Remove' : 'Add'}
                                </button>
                              </div>
                            </button>
                          ))
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
               </form>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-12 scrollbar-hide">
               <SpaceSwitcher />
               
               <section className="space-y-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">Core Holdings</h3>
                    <button 
                      onClick={() => {
                        const input = document.querySelector('input[placeholder="Search Markets..."]') as HTMLInputElement;
                        if (input) input.focus();
                      }}
                      className="text-[#00BD84] hover:text-white transition-colors"
                      title="Add Asset"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  <PortfolioSummary onSelect={setSelectedSymbol} />
                  <button 
                    onClick={() => setSelectedCategory('Portfolio')}
                    className="w-full py-2.5 bg-[#00BD84]/10 text-[#00BD84] text-[10px] font-black uppercase tracking-widest text-center rounded-xl border border-[#00BD84]/20 hover:bg-[#00BD84]/20 transition-all"
                  >
                    Expand Portfolio
                  </button>
               </section>

               <section>
                  <ResearchPanel symbol={selectedSymbol || 'AAPL'} />
               </section>
            </div>
          </aside>
        </main>

        {/* Global Footer */}
        <footer className="h-8 border-t border-[#2A2E35] px-6 flex items-center justify-between bg-[#0C0D0F] text-[10px] font-mono shrink-0">
          <div className="flex gap-8 text-[#4A4F59]">
            <div className="flex gap-2">STATUS: <span className="text-[#00BD84] font-bold animate-pulse">OPTIMIZED</span></div>
            <div className="flex gap-2 uppercase tracking-tight">System v2.4.0 • Enterprise Active</div>
          </div>
          <div className="text-[#4A4F59] tracking-widest uppercase text-[9px] hidden md:block">Institutional Grade Intelligence Interface</div>
        </footer>
        
        <AnimatePresence>
          {viewingArticle && (
            <>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setViewingArticle(null)}
                className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[90]"
              />
              <ArticleReader 
                article={viewingArticle} 
                onClose={() => setViewingArticle(null)} 
              />
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
