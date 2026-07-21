"use client";
import React, { useState, useEffect, useRef } from 'react';
import { Smartphone, ShieldAlert, Send, Bot, User, Loader2 } from 'lucide-react';

export default function SmsDashboard({ context }: { context?: any }) {
  const [messages, setMessages] = useState<{role: string, content: string}[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  useEffect(scrollToBottom, [messages]);

  useEffect(() => {
    if (context && messages.length === 0) {
      handleChat(null, true);
    }
  }, [context]);

  const handleChat = async (e?: React.FormEvent | null, isInitial: boolean = false) => {
    if (e) e.preventDefault();
    if (!isInitial && !input.trim()) return;

    const userMessage = input.trim();
    if (!isInitial) {
      setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
      setInput("");
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/llm/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          history: messages,
          prompt: isInitial ? "" : userMessage,
          context: context,
          is_initial: isInitial
        })
      });

      const result = await response.json();
      if (result.status === 'success') {
        setMessages(prev => [...prev, { role: 'assistant', content: result.message }]);
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: "Error communicating with local LLM. Ensure Ollama is running." }]);
      }
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'assistant', content: "Network error trying to reach backend LLM endpoint." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-full w-full bg-slate-100 p-8 gap-8">
      
      {/* Left Pane: Route Summary */}
      <div className="w-1/3 bg-white rounded-3xl shadow-lg border border-gray-100 flex flex-col overflow-hidden">
        <div className="bg-blue-600 p-6 text-white">
            <div className="flex items-center gap-3 mb-2">
                <Smartphone className="w-6 h-6 text-blue-200" />
                <h2 className="text-xl font-bold">Dispatch Context</h2>
            </div>
            <p className="text-blue-100 text-sm opacity-90">Auto-filled from AI Evacuation tab</p>
        </div>
        
        <div className="p-6 flex-1">
            {context ? (
                <div className="space-y-6">
                    <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-100 flex items-start gap-3">
                        <ShieldAlert className="w-5 h-5 mt-0.5 shrink-0" />
                        <div>
                            <div className="font-bold">Active Evacuation</div>
                            <div className="text-sm opacity-90">Pre-Peak Flood Condition</div>
                        </div>
                    </div>
                    
                    <div>
                        <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Destination Safe Zone</div>
                        <div className="text-xl font-black text-emerald-600">{context.destinationName}</div>
                    </div>

                    <div>
                        <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Route Waypoints</div>
                        <div className="text-sm font-mono text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-100 h-32 overflow-y-auto">
                            {context.routeGeoJSON?.coordinates?.length || 0} GPS coordinates calculated.
                        </div>
                    </div>
                </div>
            ) : (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
                    <Smartphone className="w-16 h-16 mb-4 text-gray-300" />
                    <p className="text-lg font-bold text-gray-400">No Context Received</p>
                    <p className="text-sm text-gray-400">Navigate here from the Safe Spot tab.</p>
                </div>
            )}
        </div>
      </div>

      {/* Right Pane: LLM Chat UI */}
      <div className="w-2/3 bg-white rounded-3xl shadow-lg border border-gray-100 flex flex-col overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Bot className="w-6 h-6 text-blue-600" /> Local LLM Assistant
            </h2>
            <p className="text-sm text-gray-500">Drafting SMS via Ollama (Qwen)</p>
        </div>
        
        {/* Chat History */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.length === 0 && !isLoading && (
                <div className="text-center text-gray-400 mt-10">Waiting to initialize...</div>
            )}
            
            {messages.map((msg, idx) => (
                <div key={idx} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-gray-800 text-white' : 'bg-blue-100 text-blue-600'}`}>
                        {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                    </div>
                    <div className={`px-5 py-3 rounded-2xl max-w-[80%] whitespace-pre-wrap text-[15px] ${msg.role === 'user' ? 'bg-gray-100 text-gray-800 rounded-tr-sm' : 'bg-blue-600 text-white rounded-tl-sm shadow-md'}`}>
                        {msg.content}
                    </div>
                </div>
            ))}
            {isLoading && (
                <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                        <Bot className="w-4 h-4" />
                    </div>
                    <div className="px-5 py-3 rounded-2xl bg-blue-600 text-white rounded-tl-sm shadow-md flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" /> Drafting...
                    </div>
                </div>
            )}
            <div ref={messagesEndRef} />
        </div>

        {/* Chat Input */}
        <div className="p-4 bg-white border-t border-gray-100">
            <form onSubmit={handleChat} className="relative">
                <input 
                    type="text" 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask the LLM to refine the SMS (e.g., 'Make it shorter')..."
                    className="w-full bg-gray-50 border border-gray-200 rounded-full px-6 py-4 pr-16 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    disabled={isLoading}
                />
                <button 
                    type="submit" 
                    disabled={isLoading || !input.trim()}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 transition-all"
                >
                    <Send className="w-5 h-5" />
                </button>
            </form>
        </div>

      </div>

    </div>
  );
}
