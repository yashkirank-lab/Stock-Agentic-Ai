/**
 * Copyright (c) 2026 Yash Killamsetty
 * All rights reserved.
 * Unauthorized copying, modification, or distribution of this
 * software, via any medium, is strictly prohibited.
 * Proprietary and confidential.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Dashboard from './components/Dashboard';
import Chat from './components/Chat';
import { useState, useEffect } from 'react';
import { ChevronRight, ChevronLeft, Menu, ChevronDown, Bot } from 'lucide-react';
import { cn } from './lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { useStore } from './store/useStore';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export default function App() {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const store = useStore();
  const chatHistory = store.getChatHistory();

  useEffect(() => {
    // If the last message was a user message just added (likely from a dashboard button), open chat
    if (chatHistory.length > 0 && chatHistory[chatHistory.length - 1].role === 'user') {
      setIsChatOpen(true);
    }
  }, [chatHistory]);

  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex h-screen w-full bg-[#0C0D0F] text-[#E0E0E0] overflow-hidden font-sans selection:bg-[#00BD84]/30 relative">
        
        {/* Main Application Area */}
        <Dashboard />

        {/* Floating Chat Overlay */}
        <AnimatePresence>
          {isChatOpen && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="absolute bottom-24 right-6 w-[400px] h-[600px] z-[100] shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-[#2A2E35] rounded-2xl overflow-hidden"
            >
              <Chat />
              <button 
                onClick={() => setIsChatOpen(false)}
                className="absolute top-4 right-4 text-[#9299A6] hover:text-white"
              >
                <div className="text-[10px] font-bold uppercase tracking-widest">[CLOSE]</div>
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* FAB Bot Button */}
        <div className="absolute bottom-6 right-6 z-50">
           <button 
             onClick={() => setIsChatOpen(!isChatOpen)}
             className={cn(
               "w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all hover:scale-105 active:scale-95",
               isChatOpen ? "bg-[#2A2E35] text-white" : "bg-[#00BD84] text-black"
             )}
           >
             {isChatOpen ? <ChevronDown size={28} /> : <Bot size={28} />}
           </button>
        </div>
      </div>
    </QueryClientProvider>
  );
}

