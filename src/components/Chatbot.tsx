import React, { useState, useRef, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { MessageSquare, X, Send, Bot, User, Minimize2, Maximize2, RefreshCcw, Sparkles } from "lucide-react";
import axios from "axios";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const ThinkingText = () => {
  const [index, setIndex] = useState(0);
  const phrases = [
    "Analyzing inquiry",
    "Checking jurisdictions",
    "Verifying procedures",
    "Formatting response",
    "AI Patrol is thinking"
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % phrases.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return <>{phrases[index]}...</>;
};

interface Message {
  role: "user" | "model";
  parts: [{ text: string }];
}

export const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [message, setMessage] = useState("");
  const [history, setHistory] = useState<Message[]>([
    {
      role: "model",
      parts: [{ text: "Hello! I'm your AI Assistant for the Police Grievance Platform. How can I help you today?" }]
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  const getSuggestions = () => {
    if (location.pathname.includes("/report")) {
      return [
        "How to submit a report?",
        "What evidence is needed?",
        "Is my data secure?",
        "Upload video limit"
      ];
    }
    if (location.pathname.includes("/status")) {
      return [
        "Track my complaint",
        "Explain 'Under Investigation'",
        "Contact officer in charge",
        "Estimated resolution time"
      ];
    }
    if (location.pathname.includes("/dashboard") || location.pathname.includes("/admin")) {
      return [
        "Priority scoring logic",
        "Heatmap interpretation",
        "Department distribution",
        "Automation workflow"
      ];
    }
    return [
      "Report a grievance",
      "Check application status",
      "AI Patrol capabilities",
      "Emergency numbers"
    ];
  };

  const currentSuggestions = getSuggestions();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history, isOpen, isMinimized]);

  const handleSend = async () => {
    if (!message.trim() || isLoading) return;

    const userMessage: Message = {
      role: "user",
      parts: [{ text: message }]
    };

    setHistory(prev => [...prev, userMessage]);
    setMessage("");
    setIsLoading(true);

    try {
      const response = await axios.post("/api/chat", {
        message,
        history: history.slice(-6) // Send recent context
      });

      const botMessage: Message = {
        role: "model",
        parts: [{ text: response.data.text }]
      };

      setHistory(prev => [...prev, botMessage]);
    } catch (error) {
      setHistory(prev => [...prev, {
        role: "model",
        parts: [{ text: "I'm sorry, I encountered an error. Please try again later." }]
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setMessage(suggestion);
    // Auto-send if needed, but usually better to let user edit
    // but the prompt says "guiding users on what they can ask", so auto-send is more seamless
    setTimeout(() => {
        const sendBtn = document.getElementById('chat-send-btn');
        sendBtn?.click();
    }, 100);
  };

  return (
    <div className="fixed bottom-6 right-6 z-[999] flex flex-col items-end gap-4 pointer-events-none">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ 
              opacity: 1, 
              scale: 1, 
              y: 0,
              height: isMinimized ? "64px" : "500px",
              width: "380px"
            }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden pointer-events-auto"
          >
            {/* Header */}
            <div className="p-4 bg-indigo-600 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white tracking-tight leading-none">AI Patrol</h3>
                  <span className="text-[9px] font-bold text-white/60 uppercase tracking-widest">Digital Assistant</span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="p-1.5 hover:bg-white/10 rounded-lg text-white transition-colors"
                >
                  {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
                </button>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 hover:bg-white/10 rounded-lg text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {!isMinimized && (
              <>
                {/* Messages Container */}
                <div 
                  ref={scrollRef}
                  className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar"
                >
                  {history.map((msg, i) => (
                    <div 
                      key={i}
                      className={cn(
                        "flex items-end gap-2",
                        msg.role === "user" ? "flex-row-reverse" : "flex-row"
                      )}
                    >
                      <div className={cn(
                        "w-6 h-6 rounded-lg flex items-center justify-center shrink-0",
                        msg.role === "user" ? "bg-slate-100 dark:bg-slate-800" : "bg-indigo-50 dark:bg-indigo-900/30"
                      )}>
                        {msg.role === "user" ? <User className="w-3.5 h-3.5 text-slate-500" /> : <Bot className="w-3.5 h-3.5 text-indigo-600" />}
                      </div>
                      <div className={cn(
                        "max-w-[80%] p-3 text-sm rounded-2xl",
                        msg.role === "user" 
                          ? "bg-indigo-600 text-white rounded-br-none" 
                          : "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-none"
                      )}>
                        {msg.parts[0].text}
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-start gap-3 py-2"
                    >
                      <div className="relative group">
                        <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center relative z-10 border border-indigo-100 dark:border-indigo-800/50">
                          <Bot className="w-4 h-4 text-indigo-600 animate-pulse" />
                        </div>
                        <motion.div 
                          animate={{ 
                            scale: [1, 1.5, 1],
                            opacity: [0.3, 0, 0.3],
                            rotate: [0, 90, 180, 270, 360]
                          }}
                          transition={{ 
                            repeat: Infinity, 
                            duration: 3,
                            ease: "linear"
                          }}
                          className="absolute inset-0 bg-indigo-400 rounded-xl blur-lg"
                        />
                      </div>
                      <div className="flex flex-col gap-2 pt-1">
                        <div className="flex items-center gap-2">
                          <motion.span 
                            key="thinking-text"
                            animate={{ opacity: [0.4, 1, 0.4] }}
                            transition={{ repeat: Infinity, duration: 1.5 }}
                            className="text-[9px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.2em]"
                          >
                            <ThinkingText />
                          </motion.span>
                          <motion.div 
                            animate={{ rotate: 360 }}
                            transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                          >
                            <RefreshCcw className="w-2.5 h-2.5 text-indigo-400" />
                          </motion.div>
                        </div>
                        <div className="flex gap-1.5 ml-0.5 mt-0.5">
                          {[0, 1, 2].map((i) => (
                            <motion.div 
                              key={i}
                              animate={{ 
                                y: [-2, 2, -2],
                                scale: [1, 1.3, 1],
                                backgroundColor: ["#6366f1", "#a855f7", "#6366f1"]
                              }} 
                              transition={{ 
                                repeat: Infinity, 
                                duration: 1.2, 
                                delay: i * 0.15,
                                ease: "easeInOut"
                              }} 
                              className="w-1.5 h-1.5 rounded-full shadow-[0_0_8px_rgba(99,102,241,0.4)]" 
                            />
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Input Area */}
                <div className="p-4 border-t border-slate-100 dark:border-slate-800">
                  {/* Suggestions */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {currentSuggestions.map((s, i) => (
                      <motion.button
                        key={i}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.1 }}
                        onClick={() => handleSuggestionClick(s)}
                        className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 text-[11px] font-bold rounded-full border border-slate-200 dark:border-slate-700 hover:border-indigo-200 dark:hover:border-indigo-700/50 transition-all flex items-center gap-1.5 whitespace-nowrap"
                      >
                        <Sparkles className="w-3 h-3" />
                        {s}
                      </motion.button>
                    ))}
                  </div>

                  <div className="relative">
                    <textarea 
                      rows={1}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyDown={handleKeyPress}
                      placeholder="Type your question..."
                      className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl py-3 pl-4 pr-12 text-sm focus:ring-2 focus:ring-indigo-500 transition-all text-slate-900 dark:text-white resize-none"
                    />
                    <button 
                      id="chat-send-btn"
                      onClick={handleSend}
                      disabled={isLoading || !message.trim()}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-all"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-[10px] text-center text-slate-400 mt-2 font-bold uppercase tracking-widest">
                    AI Patrol can make mistakes. Check important info.
                  </p>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="pointer-events-auto h-14 w-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-2xl hover:bg-indigo-700 hover:scale-110 active:scale-95 transition-all group relative"
      >
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <MessageSquare className="w-6 h-6" />
        )}
        {!isOpen && (
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span>
          </span>
        )}
      </button>
    </div>
  );
};
