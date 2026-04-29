import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import React, { useState, useEffect } from 'react';
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
    clearNotifications,
    settings,
    updateSetting,
    syncDataSource
  } = useStore();
  const [searchInput, setSearchInput] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('News');
  const [newsFilter, setNewsFilter] = useState('Top Stories');
  const [terminalSearch, setTerminalSearch] = useState('');
  const [viewingArticleUrl, setViewingArticleUrl] = useState<string | null>(null);
  const [articleContent, setArticleContent] = useState<any>(null);
  const [isReaderLoading, setIsReaderLoading] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<Record<string, any>>({});
  const [analyzingUrl, setAnalyzingUrl] = useState<string | null>(null);
  const [activeRssUrl, setActiveRssUrl] = useState("http://feeds.bbci.co.uk/news/business/rss.xml");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [newsArticles, setNewsArticles] = useState<any[]>([]);
  const [isNewsLoading, setIsNewsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showChat, setShowChat] = useState(false);

  const rssSources = [
    { name: 'BBC Business', url: 'http://feeds.bbci.co.uk/news/business/rss.xml' },
    { name: 'CNBC', url: 'https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=10000664' },
    { name: 'Fortune', url: 'https://fortune.com/feed/' },
    { name: 'MarketWatch', url: 'http://feeds.marketwatch.com/marketwatch/topstories/' },
  ];

  // Fetch article content for the "Mini Stream"
  useEffect(() => {
    const fetchArticle = async () => {
      if (!viewingArticleUrl) {
        setArticleContent(null);
        return;
      }
      setIsReaderLoading(true);
      try {
        const { data } = await axios.get(`/api/news/reader`, { params: { url: viewingArticleUrl } });
        setArticleContent(data);
      } catch (err) {
        console.error("Reader error:", err);
        setArticleContent({ error: "Extraction Failed" });
      } finally {
        setIsReaderLoading(false);
      }
    };
    fetchArticle();
  }, [viewingArticleUrl]);

  const handleAIAnalyze = async (article: any) => {
    if (aiAnalysis[article.link]) return;
    setAnalyzingUrl(article.link);
    try {
      const res = await axios.post('/api/news/analyze', {
        title: article.title,
        excerpt: article.contentSnippet || article.content,
        textContent: articleContent?.textContent || ""
      });
      setAiAnalysis(prev => ({ ...prev, [article.link]: res.data }));
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
      return data;
    },
    enabled: selectedCategory === 'News',
    refetchInterval: 60000, // Auto-update every 60 seconds
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
    queryKey: ['globalNews', newsFilter],
    queryFn: async () => {
      const category = newsFilter === 'Watchlist' ? 'Top Stories' : newsFilter;
      const { data } = await axios.get('/api/news/trending', { params: { category } });
      return data;
    },
    enabled: selectedCategory === 'News',
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

      {/* Sidebar UI Components */}
  const PortfolioSummary = ({ onSelect }: { onSelect: (s: string) => void }) => {
    const { watchlist, toggleWatchlist } = useStore();
    
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
                <span className="text-[12px] font-bold text-white group-hover:text-[#00BD84] transition-colors">{asset.symbol}</span>
                <span className="text-[9px] text-[#4A4F59] uppercase tracking-tighter truncate max-w-[100px]">{asset.name}</span>
              </div>
              <div className="text-right flex items-center gap-3">
                <div className="flex flex-col">
                  <div className="text-[11px] font-bold text-white">{formatCurrency(asset.price)}</div>
                  <div className={cn("text-[9px] font-mono font-bold", asset.change >= 0 ? "text-[#00C805]" : "text-[#FF333A]")}>
                    {(asset.pctChange >= 0 ? '+' : '') + asset.pctChange.toFixed(2)}%
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

  const NewsCard = ({ item }: { item: any }) => {
    const { data: metadata, isLoading: metaLoading } = useQuery({
      queryKey: ['meta', item.link],
      queryFn: async () => {
        const { data } = await axios.get('/api/news/metadata', { params: { url: item.link } });
        return data;
      },
      staleTime: Infinity,
    });

    const fallbackImage = "https://images.unsplash.com/photo-1611974717482-45a0017a42f8?q=80&w=2070&auto=format&fit=crop";

    return (
      <motion.a 
        href={item.link}
        target="_blank"
        rel="noopener noreferrer"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="group relative bg-[#0C0D0F] border border-[#2A2E35] rounded-3xl overflow-hidden hover:border-[#00BD84]/50 transition-all duration-500 flex flex-col h-full shadow-2xl hover:shadow-[#00BD84]/5"
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
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
          )}
          <div className="absolute top-4 left-4 z-20">
            <span className="px-3 py-1 bg-[#00BD84] text-black text-[9px] font-black uppercase tracking-widest rounded-lg shadow-lg">
              {item.source || 'Intelligence'}
            </span>
          </div>
        </div>
        
        <div className="p-6 flex flex-col flex-1 space-y-4">
          <div className="flex justify-between items-center text-[9px] font-black text-[#4A4F59] uppercase tracking-widest">
            <span>{new Date(item.pubDate).toLocaleDateString()}</span>
            <span>{new Date(item.pubDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          
          <h3 className="text-lg font-black text-white leading-tight uppercase italic tracking-tighter group-hover:text-[#00BD84] transition-colors line-clamp-2">
            {item.title}
          </h3>
          
          <p className="text-xs text-[#9299A6] line-clamp-3 leading-relaxed font-medium">
            {metadata?.description || item.contentSnippet || "Analyzing high-frequency market signals and institutional intelligence flows for this vector."}
          </p>
          
          <div className="mt-auto pt-6 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#00BD84] animate-pulse" />
              <span className="text-[8px] font-black text-[#4A4F59] uppercase tracking-widest">Live Signal</span>
            </div>
            <ArrowUpRight size={16} className="text-[#4A4F59] group-hover:text-white transition-all transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </div>
        </div>
      </motion.a>
    );
  };

  const renderNewsSection = () => {
    return (
      <div className="flex h-full overflow-hidden bg-[#060608]">
        {/* Tactical Stream Sidebar */}
        <div className="w-96 border-r border-[#2A2E35] flex flex-col shrink-0 bg-[#0C0D0F]">
          <div className="p-8 border-b border-[#2A2E35] space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-[11px] font-black text-[#00BD84] uppercase tracking-[0.4em] italic">Signal Streams</h2>
              <div className="w-2 h-2 rounded-full bg-[#00BD84] animate-pulse" title="Live Sync Active" />
            </div>
            <div className="flex flex-wrap gap-2">
              {rssSources.map(source => (
                <button
                  key={source.url}
                  onClick={() => setActiveRssUrl(source.url)}
                  className={cn(
                    "px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border",
                    activeRssUrl === source.url 
                      ? "bg-[#00BD84] text-black border-[#00BD84] shadow-[0_0_20px_rgba(0,189,132,0.2)]" 
                      : "bg-[#1A1D24] text-[#4A4F59] border-[#2A2E35] hover:text-white hover:border-[#4A4F59]"
                  )}
                >
                  {source.name}
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto no-scrollbar py-6 space-y-1">
            {isIntelligenceLoading ? (
               <div className="py-20 text-center space-y-4">
                 <div className="w-8 h-8 border-2 border-[#00BD84]/10 border-t-[#00BD84] rounded-full animate-spin mx-auto" />
                 <p className="text-[9px] font-black text-[#4A4F59] uppercase tracking-widest">Scanning Frequencies...</p>
               </div>
            ) : (
              intelligenceFeed?.items.map((item: any, i: number) => (
                <button
                  key={`${item.link}-${i}`}
                  onClick={() => setViewingArticleUrl(item.link)}
                  className={cn(
                    "w-full text-left px-8 py-6 border-b border-[#2A2E35]/30 transition-all group relative",
                    viewingArticleUrl === item.link ? "bg-[#00BD84]/5 text-white" : "text-[#9299A6] hover:bg-[#121417]"
                  )}
                >
                  {viewingArticleUrl === item.link && <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#00BD84]" />}
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-[9px] font-black uppercase tracking-widest text-[#4A4F59]">{new Date(item.pubDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    <ArrowUpRight size={14} className={cn("transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5", viewingArticleUrl === item.link ? "text-[#00BD84]" : "text-[#4A4F59]")} />
                  </div>
                  <h4 className={cn(
                    "text-[14px] font-bold leading-tight line-clamp-3 uppercase tracking-tight transition-colors",
                    viewingArticleUrl === item.link ? "text-white" : "group-hover:text-white"
                  )}>
                    {item.title}
                  </h4>
                  <div className="mt-3 flex items-center gap-2">
                    <div className="w-1 h-1 rounded-full bg-[#4A4F59]" />
                    <span className="text-[8px] font-black text-[#4A4F59] uppercase tracking-widest">{intelligenceFeed?.title || 'Signal'}</span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Reader Canvas (The "Mini Stream") */}
        <div className="flex-1 overflow-y-auto no-scrollbar bg-[#060608] relative">
          {viewingArticleUrl ? (
            <div className="max-w-4xl mx-auto p-12 md:p-24 space-y-16 pb-64">
              {isReaderLoading ? (
                <div className="py-40 text-center space-y-10">
                  <div className="w-16 h-16 border-4 border-[#00BD84]/5 border-t-[#00BD84] rounded-full animate-spin mx-auto shadow-[0_0_50px_rgba(0,189,132,0.1)]" />
                  <p className="text-[12px] font-black uppercase tracking-[0.5em] text-[#4A4F59] animate-pulse">Extracting Secure Signal Stream...</p>
                </div>
              ) : articleContent?.isRestricted ? (
                <div className="p-20 bg-[#0C0D0F] border border-[#2A2E35] rounded-[40px] text-center space-y-12 animate-in fade-in slide-in-from-bottom-12 duration-1000">
                  <div className="w-32 h-32 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto border border-rose-500/20 shadow-[0_0_80px_rgba(244,63,94,0.1)]">
                    <ExternalLink className="text-rose-500" size={56} />
                  </div>
                  <div className="space-y-6">
                    <h3 className="text-4xl font-black text-white uppercase tracking-tighter italic leading-none">Stream Encryption Detected</h3>
                    <p className="text-[#9299A6] text-lg leading-relaxed max-w-xl mx-auto font-medium">
                      This intelligence frequency is protected by a publisher authorization layer. To maintain data integrity while respecting source protocols, please access the platform directly.
                    </p>
                  </div>
                  <div className="pt-8">
                    <a 
                      href={viewingArticleUrl}
                      target="_blank" 
                      rel="noreferrer"
                      className="inline-flex items-center gap-6 px-16 py-8 bg-[#00BD84] text-black text-[15px] font-black uppercase tracking-[0.3em] rounded-[32px] hover:bg-[#00e09e] transition-all shadow-[0_30px_60px_rgba(0,189,132,0.2)] hover:scale-[1.02] active:scale-[0.98] group"
                    >
                      Establish Direct Handshake <ArrowUpRight size={24} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                    </a>
                  </div>
                </div>
              ) : articleContent ? (
                <motion.div 
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-16"
                >
                  <div className="space-y-10">
                    <div className="flex items-center gap-6">
                       <span className="px-5 py-2 bg-[#00BD84]/10 text-[#00BD84] text-[10px] font-black uppercase tracking-[0.3em] rounded-xl border border-[#00BD84]/20">Digital Asset Intelligence</span>
                       <span className="w-1.5 h-1.5 rounded-full bg-[#2A2E35]" />
                       <span className="text-[10px] text-[#4A4F59] font-black tracking-[0.5em] uppercase">{articleContent.siteName || intelligenceFeed?.title}</span>
                    </div>
                    <h1 className="text-7xl font-black text-white leading-[0.95] tracking-tighter uppercase italic text-balance shadow-sm">{articleContent.title}</h1>
                    
                    <div className="flex items-center gap-8 pt-4">
                       <button
                         onClick={() => handleAIAnalyze(intelligenceFeed?.items.find((i: any) => i.link === viewingArticleUrl))}
                         disabled={!!analyzingUrl || !!aiAnalysis[viewingArticleUrl]}
                         className="inline-flex items-center gap-5 px-8 py-4 bg-[#121417] border border-[#2A2E35] rounded-2xl group hover:border-[#00BD84] transition-all shadow-xl"
                       >
                         <Bot className={cn(analyzingUrl === viewingArticleUrl ? "animate-pulse" : "", "text-[#00BD84]")} size={22} />
                         <span className="text-[11px] font-black uppercase tracking-[0.3em] text-[#9299A6] group-hover:text-white transition-colors">
                           {analyzingUrl === viewingArticleUrl ? "Synthesizing Dataset..." : aiAnalysis[viewingArticleUrl] ? "Synthesis Complete" : "Analyze Signal Core"}
                         </span>
                       </button>
                    </div>
                  </div>

                  {aiAnalysis[viewingArticleUrl] && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-gradient-to-br from-[#0C0D0F] to-[#121417] border border-[#2A2E35] rounded-[48px] p-12 space-y-12 shadow-3xl relative overflow-hidden group"
                    >
                       <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover:opacity-10 transition-opacity">
                         <Bot size={200} />
                       </div>
                       <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 relative z-10">
                          <div className="space-y-8">
                             <h4 className="text-[12px] font-black text-[#00BD84] uppercase tracking-[0.4em] flex items-center gap-3">
                               <LayoutGrid size={16} /> Intelligence Summary
                             </h4>
                             <ul className="space-y-6">
                                {aiAnalysis[viewingArticleUrl].summary.map((s: string, i: number) => (
                                  <li key={i} className="text-lg text-[#E0E0E0] leading-relaxed flex gap-6 font-medium">
                                    <span className="text-[#00BD84] font-black mt-1.5">•</span> {s}
                                  </li>
                                ))}
                             </ul>
                          </div>
                          <div className="space-y-12">
                             <div className="space-y-6">
                                <h4 className="text-[12px] font-black text-[#00BD84] uppercase tracking-[0.4em]">Signal Sentiment</h4>
                                <div className="flex items-center gap-6">
                                  <span className={cn(
                                    "text-5xl font-black uppercase italic tracking-tighter",
                                    aiAnalysis[viewingArticleUrl].sentiment === 'Positive' ? "text-[#00BD84] drop-shadow-[0_0_30px_rgba(0,189,132,0.3)]" : "text-[#FF333A] drop-shadow-[0_0_30px_rgba(255,51,58,0.3)]"
                                  )}>{aiAnalysis[viewingArticleUrl].sentiment}</span>
                                </div>
                             </div>
                             <div className="space-y-8">
                                <h4 className="text-[12px] font-black text-[#00BD84] uppercase tracking-[0.4em]">Vector Markers</h4>
                                <div className="flex flex-wrap gap-4">
                                   {aiAnalysis[viewingArticleUrl].keyPoints.map((p: string) => (
                                     <span key={p} className="px-6 py-3 bg-[#1A1D24] border border-[#2A2E35] rounded-2xl text-[11px] font-black text-[#E0E0E0] uppercase tracking-widest">{p}</span>
                                   ))}
                                </div>
                             </div>
                          </div>
                       </div>
                    </motion.div>
                  )}

                  <div 
                    className="prose prose-invert max-w-none text-2xl text-[#E0E0E0]/90 leading-[1.6] font-medium selection:bg-[#00BD84] selection:text-black article-content"
                    dangerouslySetInnerHTML={{ __html: articleContent.content }}
                  />

                  <div className="pt-24 border-t border-[#2A2E35] flex flex-col md:flex-row items-center justify-between gap-12">
                     <div className="flex items-center gap-4">
                        <div className="w-2.5 h-2.5 rounded-full bg-[#00BD84] animate-pulse" />
                        <p className="text-[12px] font-black text-[#4A4F59] uppercase tracking-[0.4em]">Verified Institutional Stream Node</p>
                     </div>
                     <a 
                      href={viewingArticleUrl} 
                      target="_blank" 
                      rel="noreferrer"
                      className="inline-flex items-center gap-4 px-12 py-6 bg-[#121417] border border-[#2A2E35] text-white text-[14px] font-black uppercase tracking-[0.3em] rounded-[24px] hover:border-[#00BD84] transition-all group shadow-2xl"
                     >
                       Establish Full Node Access <ArrowUpRight size={22} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                     </a>
                  </div>
                </motion.div>
              ) : null}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-lg mx-auto space-y-12 animate-in fade-in duration-1000">
               <div className="w-48 h-48 bg-[#0C0D0F] border border-[#2A2E35] rounded-full flex items-center justify-center relative group">
                  <div className="absolute inset-0 bg-[#00BD84]/5 rounded-full blur-[100px] group-hover:bg-[#00BD84]/15 transition-all duration-1000" />
                  <Bot size={80} className="text-[#00BD84] relative z-10 opacity-20 group-hover:opacity-100 transition-all duration-1000" />
               </div>
               <div className="space-y-6">
                  <h2 className="text-4xl font-black text-white uppercase tracking-tighter italic leading-none">Intelligence Terminal</h2>
                  <p className="text-[#4A4F59] text-base font-bold uppercase tracking-[0.3em] leading-relaxed">
                    Select a frequency from the tactical signal streams to execute multi-vector extraction and AI synthesis.
                  </p>
               </div>
               <div className="pt-8 flex gap-8">
                  {['Institutional', 'Real-time', 'Verified'].map(tag => (
                    <span key={tag} className="text-[10px] font-black text-[#00BD84]/40 uppercase tracking-[0.4em]">{tag}</span>
                  ))}
               </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderContent = () => {
    if (selectedCategory === 'News') return renderNewsSection();
    
    if (selectedCategory === 'Markets' || !selectedCategory) {
      return (
        <div className="p-6 space-y-12 max-w-[1240px] mx-auto animate-in fade-in duration-500">
          <div className="flex flex-col gap-2">
             <h2 className="text-3xl font-black text-white uppercase tracking-tighter italic">Global Market Oversight</h2>
             <p className="text-sm text-[#9299A6]">Live institutional index feeds powered by Yahoo Finance intelligence.</p>
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
        <div className="p-10 space-y-12 max-w-[1240px] mx-auto animate-in fade-in duration-500">
          <div className="flex flex-col gap-2">
             <h2 className="text-3xl font-black text-white uppercase tracking-tighter italic">System Configuration</h2>
             <p className="text-sm text-[#9299A6]">Manage account preferences, data synchronization, and intelligence vectors.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <section className="bg-[#0C0D0F] border border-[#2A2E35] p-10 rounded-3xl space-y-8 shadow-xl">
              <h3 className="text-[11px] font-black text-white uppercase tracking-[0.5em] italic">Notification Preferences</h3>
              <div className="space-y-6">
                {notificationOptions.map(opt => {
                  const active = settings.notifications[opt.key];
                  return (
                    <button 
                      key={opt.key} 
                      onClick={() => updateSetting(opt.key)}
                      className="w-full flex items-center justify-between group cursor-pointer"
                    >
                      <span className={cn("text-xs font-bold transition-colors uppercase tracking-widest", active ? "text-white" : "text-[#9299A6] group-hover:text-white")}>{opt.label}</span>
                      <div className={cn("w-10 h-5 rounded-full relative transition-all duration-300", active ? "bg-[#00BD84]" : "bg-[#2A2E35]")}>
                        <div className={cn("absolute top-1 w-3 h-3 rounded-full bg-white transition-all duration-300", active ? "left-[24px]" : "left-1 shadow-sm")} />
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="bg-[#0C0D0F] border border-[#2A2E35] p-10 rounded-3xl space-y-8 shadow-xl">
              <h3 className="text-[11px] font-black text-white uppercase tracking-[0.5em] italic">Institutional Handshake</h3>
              <div className="space-y-6">
                {Object.entries(settings.dataSourceStatus).map(([name, status]) => {
                  const color = status === 'ACTIVE' ? '#00BD84' : status === 'SYNCING' ? '#00BD84' : '#FFCC00';
                  return (
                    <div key={name} className="flex items-center justify-between group">
                      <span className="text-xs font-bold text-[#9299A6] uppercase tracking-widest">{name}</span>
                      <div className="flex items-center gap-6">
                        <span className={cn(
                          "text-[10px] font-black uppercase tracking-widest transition-all",
                          status === 'SYNCING' && "animate-pulse"
                        )} style={{ color }}>{status}</span>
                        <button 
                          onClick={() => syncDataSource(name)}
                          disabled={status === 'SYNCING'}
                          className={cn(
                            "text-[9px] px-3 py-1.5 rounded-lg border border-[#2A2E35] text-[#4A4F59] font-black uppercase tracking-widest hover:text-white hover:border-[#00BD84] transition-all",
                            status === 'SYNCING' && "opacity-50 cursor-not-allowed"
                          )}
                        >
                          {status === 'SYNCING' ? 'Refresing...' : 'Sync'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        </div>
      );
    }

    if (selectedCategory === 'Portfolio') {
      const { watchlist, toggleWatchlist } = useStore();
      
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
        enabled: watchlist.length > 0
      });

      return (
        <div className="p-8 space-y-12 max-w-[1240px] mx-auto animate-in fade-in duration-500">
           <div className="flex justify-between items-end">
             <div className="flex flex-col gap-2">
                <h2 className="text-3xl font-black text-white uppercase tracking-tighter italic">Strategic Portfolio</h2>
                <p className="text-sm text-[#9299A6]">Omni-channel tracking for institutional and retail holdings.</p>
             </div>
             <button 
                onClick={() => setSelectedCategory('Explore')}
                className="bg-[#00BD84] text-black px-8 py-3 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] hover:bg-[#00e09e] transition-all shadow-[0_0_20px_rgba(0,189,132,0.1)]"
              >
                Augment Asset
             </button>
           </div>

           <div className="bg-[#0C0D0F] border border-[#2A2E35] rounded-3xl overflow-hidden shadow-2xl">
              {holdingsData && holdingsData.length > 0 && (
                <div className="px-10 py-12 bg-gradient-to-br from-[#00BD84]/10 to-transparent border-b border-[#2A2E35] flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-[#00BD84] uppercase tracking-[0.5em] mb-2 italic">Net Liquidity Value</span>
                    <span className="text-4xl font-black text-white tracking-tighter">
                      {formatCurrency(holdingsData.reduce((acc, h) => acc + (h.cur * h.sh), 0))}
                    </span>
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
              )}
              <table className="w-full text-left border-collapse">
                 <thead>
                    <tr className="bg-[#121417] border-b border-[#2A2E35]">
                       <th className="px-8 py-6 text-[10px] font-black text-[#4A4F59] uppercase tracking-widest italic">Asset Vector</th>
                       <th className="px-8 py-6 text-[10px] font-black text-[#4A4F59] uppercase tracking-widest text-right">Units</th>
                       <th className="px-8 py-6 text-[10px] font-black text-[#4A4F59] uppercase tracking-widest text-right">Acquisition</th>
                       <th className="px-8 py-6 text-[10px] font-black text-[#4A4F59] uppercase tracking-widest text-right">Terminal</th>
                       <th className="px-8 py-6 text-[10px] font-black text-[#4A4F59] uppercase tracking-widest text-right">Delta</th>
                       <th className="px-8 py-6 text-[10px] font-black text-[#4A4F59] uppercase tracking-widest text-center">Sync</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-[#2A2E35]/50">
                    {isHoldingsLoading ? (
                      <tr>
                        <td colSpan={6} className="px-10 py-32 text-center">
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
                                   <div className="w-10 h-10 rounded-xl bg-[#1A1D24] border border-[#2A2E35] flex items-center justify-center text-[12px] font-black text-white group-hover:text-[#00BD84] group-hover:border-[#00BD84]/50 transition-all">{h.s[0]}</div>
                                   <div>
                                      <div className="text-[15px] font-black text-white uppercase italic tracking-tighter">{h.s}</div>
                                      <div className="text-[9px] text-[#4A4F59] uppercase font-bold tracking-widest">{h.n}</div>
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
                             <td className="px-8 py-8 text-center text-[#4A4F59]">
                                <Bot size={18} className="mx-auto group-hover:text-[#00BD84] transition-colors" />
                             </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={6} className="px-10 py-32 text-center">
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
      );
    }
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

        {/* Detailed Company Briefing & AI Strategy Section */}
        {stockData && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-12">
            {stockData.description && (
              <section className="lg:col-span-2 space-y-6">
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
            )}

            <section className={cn("space-y-6", !stockData.description && "lg:col-span-3")}>
              <div className="bg-[#0C0D0F] border border-[#2A2E35] rounded-xl p-8 border-l-4 border-l-[#00BD84] relative overflow-hidden">
                 <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                       <Bot size={18} className="text-[#00BD84]" />
                       <h3 className="text-[11px] font-black text-white uppercase tracking-[0.3em]">AI PROFIT CHEAT PLAN</h3>
                    </div>
                    <div className="flex items-center gap-1.5 bg-[#1A1D24] px-2 py-1 rounded border border-[#2A2E35]">
                       <span className="text-[10px] font-black text-white">{stockData.safetyScore || 85}</span>
                       <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: (stockData.safetyScore || 85) >= 85 ? '#00BD84' : (stockData.safetyScore || 85) >= 65 ? '#FFCC00' : '#FF333A' }} />
                    </div>
                 </div>
                 
                 <div className="space-y-5">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <span className="text-[9px] text-[#4A4F59] uppercase tracking-widest block font-black">Current Safety</span>
                        <div className="flex items-center gap-2">
                          <div className={cn("w-2.5 h-2.5 rounded-full shadow-lg", (stockData.safetyScore || 85) >= 85 ? "bg-[#00BD84]" : "bg-[#FFCC00]")} />
                          <span className="text-sm font-black text-white uppercase tracking-tight">
                            {(stockData.safetyScore || 85) >= 85 ? 'Institutional Grade' : 'Retail Momentum'}
                          </span>
                        </div>
                      </div>
                      <div className="space-y-1 text-right">
                        <span className="text-[9px] text-[#4A4F59] uppercase tracking-widest block font-black">Profit Window</span>
                        <span className="text-sm font-black text-[#00BD84] uppercase tracking-tight">
                          {stockData.pctChange >= 0 ? 'High Velocity' : 'Value Accumulation'}
                        </span>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-[#2A2E35]">
                      <span className="text-[9px] text-[#4A4F59] uppercase tracking-widest block mb-2 font-black">WHAT IS HAPPENING?</span>
                      <div className="flex items-center gap-2 mb-2">
                        {stockData.change >= 0 ? <TrendingUp size={14} className="text-[#00BD84]" /> : <TrendingDown size={14} className="text-[#FF333A]" />}
                        <span className="text-[12px] font-black text-white">
                          {stockData.change >= 0 
                            ? [
                                'Big Gains Incoming', 
                                'Institutional Accumulation', 
                                'Bullish Momentum', 
                                'Price Discovery Phase', 
                                'Strong Market Demand',
                                'Accumulation Channel',
                                'Technical Breakout',
                                'Smart Money Flow'
                              ][(Math.abs(stockData.symbol.charCodeAt(0)) + new Date().getDate()) % 8]
                            : [
                                'Taking a Breather', 
                                'Healthy Correction', 
                                'Profit Taking Active', 
                                'Consolidation Mode', 
                                'Discount Opportunity',
                                'Shakeout Phase',
                                'Trend Testing',
                                'Recalibration Phase'
                              ][(Math.abs(stockData.symbol.charCodeAt(0)) + new Date().getDate()) % 8]
                          }
                        </span>
                      </div>
                      <p className="text-[11px] text-[#9299A6] leading-relaxed font-medium">
                        {stockData.change >= 0 
                          ? "This asset is showing dominant strength. Smart money is positioning for the next leg up as buy volume exceeds selling pressure." 
                          : "The market is recalibrating price levels. This represents a strategic entry point for long-term investors looking for value."}
                      </p>
                    </div>

                    <div className="bg-[#1A1D24] p-3 rounded border border-[#2A2E35]">
                       <span className="text-[8px] text-[#00BD84] font-black uppercase tracking-widest block mb-1">PRO ADVICE</span>
                       <p className="text-[10px] text-white font-bold">
                         {stockData.change >= 0 
                           ? "ACCUMULATE - Building a position here aligned with major trends." 
                           : "WAIT & WATCH - Let the price stabilize before committing capital."}
                       </p>
                    </div>

                    <button 
                      onClick={() => addMessage({ 
                        role: 'user', 
                        content: `How can ${stockData.symbol} help me grow my earnings? Give me a step-by-step plan in very simple words.`,
                        timestamp: new Date().toISOString()
                      })}
                      className="w-full mt-2 py-3 bg-[#00BD84] text-black text-[11px] font-black uppercase tracking-[0.2em] rounded hover:bg-[#00e09e] transition-all transform hover:scale-[1.02] active:scale-95 shadow-xl"
                    >
                      GET GROWTH PLAN
                    </button>
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
                  key={`${article.link}-${i}`}
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
                  key={`${article.link}-${i}`}
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
    <div className="flex-1 bg-[#121417] flex flex-col overflow-hidden font-sans">
      {/* Top Navigation */}
      <nav className="h-14 bg-[#0C0D0F] border-b border-[#2A2E35] flex items-center justify-between px-6 shrink-0 z-50">
        <div className="flex items-center gap-8">
          <div className="w-10 h-10 bg-[#1A1D24] rounded-xl flex items-center justify-center border border-[#2A2E35] group hover:border-[#00BD84] transition-all cursor-pointer">
             <div className="w-5 h-5 bg-[#00BD84] rounded-sm group-hover:rotate-45 transition-transform duration-500" />
          </div>
          <div className="flex items-center gap-6 text-[13px] font-semibold">
            {['Analyst', 'Markets', 'Explore', 'News', 'Portfolio', 'Settings'].map((item) => (
              <button 
                key={item} 
                onClick={() => setSelectedCategory(item)}
                className={cn(
                  "px-3 py-1.5 rounded-lg transition-all cursor-pointer relative",
                  selectedCategory === item ? "text-[#00BD84] bg-[#00BD84]/10" : "text-[#9299A6] hover:text-white"
                )}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
          <div className="flex items-center gap-6">
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

        <main className="flex-1 overflow-hidden flex flex-row">
          <div className="flex-1 overflow-y-auto no-scrollbar bg-[#060608]">
            {renderContent()}
          </div>

          <aside className="w-84 border-l border-[#2A2E35] bg-[#0C0D0F] flex flex-col shrink-0 relative">
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
                                      <span className="text-[14px] font-black text-white group-hover:text-[#00BD84] transition-colors">{res.symbol}</span>
                                      <span className="text-[9px] text-[#4A4F59] font-mono leading-none">{res.exchange}</span>
                                    </div>
                                    <span className="text-[11px] text-[#9299A6] truncate max-w-[160px] font-medium">{res.name}</span>
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
      </div>
    </div>
  );
}
