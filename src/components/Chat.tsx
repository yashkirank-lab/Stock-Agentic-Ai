import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Bot, User, Loader2, Trash2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useStore } from '../store/useStore';
import { analyzeStockAgent } from '../services/aiService';
import { cn } from '../lib/utils';

export default function Chat() {
  const store = useStore();
  const chatHistory = store.getChatHistory();
  const { addMessage, isChatLoading, setChatLoading, clearChat } = store;
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatHistory, isChatLoading]);

  useEffect(() => {
    const lastMessage = chatHistory[chatHistory.length - 1];
    if (lastMessage?.role === 'user' && !isChatLoading) {
      processAIResponse(lastMessage.content);
    }
  }, [chatHistory]);

  const processAIResponse = async (query: string) => {
    setChatLoading(true);
    try {
      const responseText = await analyzeStockAgent(query, chatHistory.slice(0, -1));

      addMessage({
        role: 'assistant',
        content: responseText,
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      console.error("AI Error:", error);
      addMessage({
        role: 'assistant',
        content: `**Error:** ${error.message}. Please check your connection.`,
        timestamp: new Date().toISOString()
      });
    } finally {
      setChatLoading(false);
    }
  };

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isChatLoading) return;

    const userMsg = {
      role: 'user' as const,
      content: input,
      timestamp: new Date().toISOString()
    };

    addMessage(userMsg);
    setInput('');
  };

  return (
    <div className="flex flex-col h-full bg-[#0C0D0F]">
      <div className="p-4 border-b border-[#2A2E35] bg-[#121417] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bot size={20} className="text-[#00BD84]" />
          <span className="text-[12px] uppercase tracking-widest font-black italic text-white leading-none">APEX AI</span>
        </div>
        <button 
          onClick={clearChat}
          className="text-[#4A4F59] hover:text-[#FF333A] transition-colors p-1"
          title="Clear Conversation"
        >
          <Trash2 size={16} />
        </button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-6 font-sans no-scrollbar">
        {chatHistory.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center px-6">
            <Bot size={48} className="text-[#2A2E35] mb-4" />
            <h3 className="text-white font-bold text-sm mb-2 uppercase tracking-tighter">Market Specialist Ready</h3>
            <p className="text-[11px] text-[#4A4F59] leading-relaxed max-w-[200px]">
              Ask me to explain any stock in simple terms or generate a research report.
            </p>
          </div>
        )}
        
        {chatHistory.map((msg, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              "flex flex-col gap-2 max-w-[95%]",
              msg.role === 'user' ? "ml-auto items-end" : "mr-auto items-start"
            )}
          >
            <div className={cn(
              "p-4 rounded-2xl text-[13px] leading-relaxed",
              msg.role === 'user' 
                ? "bg-[#00BD84] text-black font-semibold shadow-[0_4px_12px_rgba(0,189,132,0.1)] rounded-tr-none" 
                : "bg-[#16191E] text-[#E0E0E0] border border-[#2A2E35] rounded-tl-none prose prose-invert prose-xs max-w-none"
            )}>
              {msg.role === 'assistant' ? (
                <div className="markdown-body">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              ) : (
                msg.content
              )}
            </div>
          </motion.div>
        ))}
        
        {isChatLoading && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-3 msg-assistant"
          >
            <div className="p-4 bg-[#16191E] border border-[#2A2E35] rounded-2xl rounded-tl-none">
              <div className="flex gap-1.5">
                <span className="w-1.5 h-1.5 bg-[#00BD84] rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                <span className="w-1.5 h-1.5 bg-[#00BD84] rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                <span className="w-1.5 h-1.5 bg-[#00BD84] rounded-full animate-bounce"></span>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      <div className="p-4 bg-[#121417] border-t border-[#2A2E35]">
        <form onSubmit={handleSend} className="relative group">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isChatLoading}
            placeholder="Type a symbol or question..."
            className="w-full bg-[#0C0D0F] border border-[#3A3F4B] rounded-xl py-3 px-5 text-[13px] focus:outline-none focus:border-[#00BD84] placeholder-[#4A4F59] text-white transition-all shadow-inner"
          />
          <button 
            type="submit"
            disabled={!input.trim() || isChatLoading}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-[#4A4F59] hover:text-[#00BD84] disabled:opacity-0 transition-all"
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}
