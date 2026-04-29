import { create } from 'zustand';

interface Stock {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  marketCap: string;
  pe: number;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'price' | 'news' | 'earnings';
  timestamp: string;
  read: boolean;
}

interface Settings {
  notifications: {
    priceChanges: boolean;
    earnings: boolean;
    breakingNews: boolean;
    ratingChanges: boolean;
  };
  dataSourceStatus: Record<string, 'ACTIVE' | 'STANDBY' | 'SYNCING'>;
}

interface AppState {
  selectedSymbol: string | null;
  watchlist: string[];
  chatHistory: Message[];
  isChatLoading: boolean;
  notifications: Notification[];
  settings: Settings;
  
  setSelectedSymbol: (symbol: string) => void;
  addToWatchlist: (symbol: string) => void;
  removeFromWatchlist: (symbol: string) => void;
  toggleWatchlist: (symbol: string) => void;
  addMessage: (message: Message) => void;
  clearChat: () => void;
  setChatLoading: (loading: boolean) => void;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markNotificationRead: (id: string) => void;
  clearNotifications: () => void;
  updateSetting: (key: keyof Settings['notifications']) => void;
  syncDataSource: (source: string) => void;
}

export const useStore = create<AppState>((set) => ({
  selectedSymbol: '005930.KS',
  watchlist: ['005930.KS', 'AAPL', 'NVDA', 'BTC-USD'],
  chatHistory: [
    {
      role: 'assistant',
      content: 'Hello! I am APEX, your agentic AI investment analyst. How can I help you research the markets today?',
      timestamp: new Date().toISOString()
    }
  ],
  isChatLoading: false,
  notifications: [],
  settings: {
    notifications: {
      priceChanges: true,
      earnings: true,
      breakingNews: false,
      ratingChanges: true,
    },
    dataSourceStatus: {
      'Yahoo Finance API': 'ACTIVE',
      'SEC EDGAR Feed': 'ACTIVE',
      'Twitter Sentiment Engine': 'STANDBY',
      'Neural Strategy Engine': 'ACTIVE',
    }
  },

  setSelectedSymbol: (symbol) => set({ selectedSymbol: symbol.toUpperCase() }),
  
  addToWatchlist: (symbol) => set((state) => ({
    watchlist: state.watchlist.includes(symbol.toUpperCase()) 
      ? state.watchlist 
      : [...state.watchlist, symbol.toUpperCase()]
  })),

  removeFromWatchlist: (symbol) => set((state) => ({
    watchlist: state.watchlist.filter((s) => s !== symbol.toUpperCase())
  })),

  toggleWatchlist: (symbol) => set((state) => {
    const s = symbol.toUpperCase();
    return {
      watchlist: state.watchlist.includes(s)
        ? state.watchlist.filter((item) => item !== s)
        : [...state.watchlist, s]
    };
  }),

  addMessage: (msg) => set((state) => ({
    chatHistory: [...state.chatHistory, msg]
  })),

  clearChat: () => set({ 
    chatHistory: [{
      role: 'assistant',
      content: 'Hello! I am APEX, your agentic AI investment analyst. How can I help you research the markets today?',
      timestamp: new Date().toISOString()
    }] 
  }),

  setChatLoading: (loading) => set({ isChatLoading: loading }),

  addNotification: (note) => set((state) => ({
    notifications: [{
      ...note,
      id: Math.random().toString(36).substring(7),
      timestamp: new Date().toISOString(),
      read: false
    }, ...state.notifications].slice(0, 50)
  })),

  markNotificationRead: (id) => set((state) => ({
    notifications: state.notifications.map(n => n.id === id ? { ...n, read: true } : n)
  })),

  clearNotifications: () => set({ notifications: [] }),

  updateSetting: (key) => set((state) => ({
    settings: {
      ...state.settings,
      notifications: {
        ...state.settings.notifications,
        [key]: !state.settings.notifications[key]
      }
    }
  })),

  syncDataSource: (source) => {
    set((state) => ({
      settings: {
        ...state.settings,
        dataSourceStatus: {
          ...state.settings.dataSourceStatus,
          [source]: 'SYNCING'
        }
      }
    }));
    
    // Simulate sync completion
    setTimeout(() => {
      set((state) => ({
        settings: {
          ...state.settings,
          dataSourceStatus: {
            ...state.settings.dataSourceStatus,
            [source]: 'ACTIVE'
          }
        }
      }));
    }, 2000);
  }
}));
