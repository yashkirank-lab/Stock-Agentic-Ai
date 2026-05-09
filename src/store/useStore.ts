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

interface Space {
  id: string;
  name: string;
  icon?: string;
  watchlist: string[];
  followedTopics: string[];
  chatHistory: Message[];
}

interface AppState {
  selectedSymbol: string | null;
  spaces: Space[];
  activeSpaceId: string;
  isChatLoading: boolean;
  notifications: Notification[];
  settings: Settings;
  
  // Space Management
  createSpace: (name: string) => void;
  deleteSpace: (id: string) => void;
  switchSpace: (id: string) => void;
  updateSpaceName: (id: string, name: string) => void;
  
  // Active Space Helpers (Getters)
  getWatchlist: () => string[];
  getFollowedTopics: () => string[];
  getChatHistory: () => Message[];
  getActiveSpace: () => Space;

  setSelectedSymbol: (symbol: string) => void;
  toggleWatchlist: (symbol: string) => void;
  toggleFollowTopic: (topic: string) => void;
  addMessage: (message: Message) => void;
  clearChat: () => void;
  setChatLoading: (loading: boolean) => void;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markNotificationRead: (id: string) => void;
  clearNotifications: () => void;
  updateSetting: (key: keyof Settings['notifications']) => void;
  syncDataSource: (source: string) => void;
}

const DEFAULT_SPACES: Space[] = [
  {
    id: 'space-prime',
    name: 'Prime Vector',
    watchlist: ['005930.KS', 'AAPL', 'NVDA', 'BTC-USD'],
    followedTopics: ['FASHION', 'TESLA', 'AI'],
    chatHistory: [
      {
        role: 'assistant',
        content: 'Hello! I am APEX, your agentic AI investment analyst. How can I help you research the markets today?',
        timestamp: new Date().toISOString()
      }
    ]
  }
];

export const useStore = create<AppState>((set, get) => ({
  selectedSymbol: '005930.KS',
  spaces: DEFAULT_SPACES,
  activeSpaceId: 'space-prime',
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

  // Space Management
  createSpace: (name) => set((state) => {
    const newSpace: Space = {
      id: `space-${Math.random().toString(36).substring(7)}`,
      name: name || `Secondary Vector ${state.spaces.length}`,
      watchlist: [],
      followedTopics: [],
      chatHistory: [{
        role: 'assistant',
        content: `Intelligence Space "${name}" initialized. Awaiting commands.`,
        timestamp: new Date().toISOString()
      }]
    };
    return { 
      spaces: [...state.spaces, newSpace],
      activeSpaceId: newSpace.id
    };
  }),

  deleteSpace: (id) => set((state) => {
    if (state.spaces.length <= 1) return state;
    const newSpaces = state.spaces.filter(s => s.id !== id);
    const newActiveId = state.activeSpaceId === id ? newSpaces[0].id : state.activeSpaceId;
    return { spaces: newSpaces, activeSpaceId: newActiveId };
  }),

  switchSpace: (id) => set({ activeSpaceId: id }),

  updateSpaceName: (id, name) => set((state) => ({
    spaces: state.spaces.map(s => s.id === id ? { ...s, name } : s)
  })),

  // Getters
  getActiveSpace: () => {
    const state = get();
    return state.spaces.find(s => s.id === state.activeSpaceId) || state.spaces[0];
  },
  getWatchlist: () => get().getActiveSpace().watchlist,
  getFollowedTopics: () => get().getActiveSpace().followedTopics,
  getChatHistory: () => get().getActiveSpace().chatHistory,

  setSelectedSymbol: (symbol) => set({ selectedSymbol: symbol.toUpperCase() }),
  
  toggleWatchlist: (symbol) => set((state) => {
    const s = symbol.toUpperCase();
    return {
      spaces: state.spaces.map(space => 
        space.id === state.activeSpaceId 
          ? {
              ...space,
              watchlist: space.watchlist.includes(s)
                ? space.watchlist.filter(item => item !== s)
                : [...space.watchlist, s]
            }
          : space
      )
    };
  }),

  toggleFollowTopic: (topic) => set((state) => {
    const t = topic.toUpperCase();
    return {
      spaces: state.spaces.map(space => 
        space.id === state.activeSpaceId 
          ? {
              ...space,
              followedTopics: space.followedTopics.includes(t)
                ? space.followedTopics.filter(item => item !== t)
                : [...space.followedTopics, t]
            }
          : space
      )
    };
  }),

  addMessage: (msg) => set((state) => ({
    spaces: state.spaces.map(space => 
      space.id === state.activeSpaceId 
        ? { ...space, chatHistory: [...space.chatHistory, msg] }
        : space
    )
  })),

  clearChat: () => set((state) => ({
    spaces: state.spaces.map(space => 
      space.id === state.activeSpaceId 
        ? {
            ...space,
            chatHistory: [{
              role: 'assistant',
              content: 'Intelligence Buffer Purged. Awaiting new input.',
              timestamp: new Date().toISOString()
            }]
          }
        : space
    )
  })),

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
