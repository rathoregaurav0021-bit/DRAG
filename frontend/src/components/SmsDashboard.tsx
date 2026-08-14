"use client";
import React, { useState, useEffect, useRef } from 'react';
import { Smartphone, Send, ShieldAlert, CheckCircle2, User, Bot, AlertTriangle, MessageSquare } from 'lucide-react';

export default function SmsDashboard({ context }: { context?: any }) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<any[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [isAiTyping, setIsAiTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
      if (context) {
          if (context.phone_number) setPhoneNumber(context.phone_number);
          if (context.message) setMessage(context.message);
      }
  }, [context]);

  useEffect(() => {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isAiTyping]);

  useEffect(() => {
      if (context && chatHistory.length === 0 && !isAiTyping) {
          triggerAutoDraft();
      }
  }, [context]);

  const triggerAutoDraft = async () => {
      setIsAiTyping(true);
      try {
          const response = await fetch('/api/llm/chat', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                  prompt: "", 
                  history: [], 
                  context: context, 
                  is_initial: true 
              })
          });
          const data = await response.json();
          setIsAiTyping(false);
          if (data.status === 'success') {
              setChatHistory([{ role: 'assistant', content: data.message }]);
              setMessage(data.message); // Auto-fill the message box
          } else {
              setChatHistory([{ role: 'assistant', content: "Error: " + data.message, isError: true }]);
          }
      } catch (error) {
          setIsAiTyping(false);
          setChatHistory([{ role: 'assistant', content: "Failed to reach AI Engine.", isError: true }]);
      }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    const userMsg = message;
    setChatHistory(prev => [...prev, { role: 'user', content: userMsg }]);
    setMessage('');
    setIsAiTyping(true);

    try {
        const response = await fetch('/api/llm/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                prompt: userMsg,
                history: chatHistory,
                context: context,
                is_initial: false
            })
        });
        
        const data = await response.json();
        setIsAiTyping(false);

        if (data.status === 'success') {
            setChatHistory(prev => [...prev, { role: 'assistant', content: data.message }]);
            setMessage(data.message); // Auto-fill the message box
        } else {
            setChatHistory(prev => [...prev, { role: 'assistant', content: "Error: " + data.message, isError: true }]);
        }
    } catch (error) {
        setIsAiTyping(false);
        setChatHistory(prev => [...prev, { role: 'assistant', content: "Failed to reach AI Engine.", isError: true }]);
    }
  };

  const handleDirectSms = async () => {
    if (!phoneNumber.trim() || !message.trim()) return;
    setIsSending(true);
    try {
        const destName = context?.destinationName || "Unknown Safe Area";
        const destCoords = context?.destinationCoords ? `${context.destinationCoords[0].toFixed(4)}, ${context.destinationCoords[1].toFixed(4)}` : "";
        const res = await fetch('/api/sms', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                phone_number: phoneNumber, 
                message: message, 
                destination_name: destName, 
                destination_coords: destCoords,
                route_geojson: context?.routeGeoJSON || null
            })
        });
        const data = await res.json();
        
        if(res.ok) {
            setChatHistory(prev => [...prev, { role: 'system', content: `SMS Dispatched to ${phoneNumber}` }]);
            setMessage('');
        } else {
            setChatHistory(prev => [...prev, { role: 'system', content: `SMS Failed: ${data.detail}`, isError: true }]);
        }
    } catch (e) {
        setChatHistory(prev => [...prev, { role: 'system', content: `Network Error while sending SMS.`, isError: true }]);
    } finally {
        setIsSending(false);
    }
  };

  return (
    <div className="w-full h-full min-h-[500px] bg-white border border-gray-300 shadow-sm flex flex-col pointer-events-auto">
        
        {/* Header */}
        <div className="bg-slate-900 p-4 flex items-center justify-between shrink-0 border-b border-gray-300 z-10">
            <div className="flex items-center gap-3">
                <Smartphone className="w-5 h-5 text-blue-400" />
                <div>
                    <h2 className="text-white font-bold text-sm tracking-wide uppercase">Emergency Dispatch</h2>
                    <p className="text-slate-400 text-[10px] font-mono flex items-center gap-1 mt-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Qwen 2.5 Local Agent
                    </p>
                </div>
            </div>
        </div>

        {/* Action Bar (Direct SMS) */}
        <div className="bg-gray-50 p-3 border-b border-gray-200 flex flex-col gap-2 shrink-0">
            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Direct SMS</div>
            <div className="flex gap-2">
                <input 
                    type="text" 
                    placeholder="Recipient Number" 
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="flex-1 px-3 py-1.5 text-xs border border-gray-300 rounded-none focus:outline-none focus:border-blue-600 bg-white text-slate-800 font-mono font-semibold"
                />
                <button 
                    onClick={handleDirectSms}
                    disabled={isSending || !phoneNumber || !message}
                    className={`px-3 py-1.5 text-xs font-bold text-white transition-colors flex items-center gap-1 border ${isSending || !phoneNumber || !message ? 'bg-gray-300 border-gray-400 cursor-not-allowed' : 'bg-blue-600 border-blue-700 hover:bg-blue-700'}`}
                >
                    {isSending ? "Sending..." : "Send SMS"}
                </button>
            </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 p-4 overflow-y-auto bg-white flex flex-col gap-4 border-b border-gray-200">
            
            {/* Greeting */}
            {chatHistory.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center px-4">
                    <MessageSquare className="w-8 h-8 text-slate-300 mb-3" />
                    <p className="text-xs font-mono text-slate-400">
                        Chat with AI to draft evacuation plans, or type a message above and hit Send SMS.
                    </p>
                </div>
            )}

            {chatHistory.map((msg, idx) => (
                <div key={idx} className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {msg.role === 'system' ? (
                        <div className={`w-full text-center text-[10px] font-mono font-bold py-1 px-3 border ${msg.isError ? 'bg-red-50 text-red-700 border-red-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
                            {msg.content}
                        </div>
                    ) : (
                        <div className={`flex items-start gap-2 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                            
                            <div className={`w-6 h-6 flex items-center justify-center shrink-0 border ${msg.role === 'user' ? 'bg-blue-600 border-blue-700 text-white' : 'bg-slate-800 border-slate-900 text-white'}`}>
                                {msg.role === 'user' ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                            </div>

                            <div className={`p-3 text-xs leading-relaxed shadow-sm whitespace-pre-wrap border ${
                                msg.role === 'user' 
                                ? 'bg-blue-50 text-blue-900 border-blue-200' 
                                : msg.isError 
                                    ? 'bg-red-50 text-red-700 border-red-200'
                                    : 'bg-gray-50 text-slate-800 border-gray-200'
                            }`}>
                                {msg.content}
                            </div>
                        </div>
                    )}
                </div>
            ))}
            
            {isAiTyping && (
                <div className="flex w-full justify-start">
                    <div className="flex items-start gap-2">
                        <div className="w-6 h-6 flex items-center justify-center shrink-0 border bg-slate-800 border-slate-900 text-white">
                            <Bot className="w-3.5 h-3.5" />
                        </div>
                        <div className="bg-gray-50 border border-gray-200 p-3 shadow-sm flex items-center gap-1.5 h-[38px]">
                            <div className="w-1.5 h-1.5 bg-slate-400 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                            <div className="w-1.5 h-1.5 bg-slate-400 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                            <div className="w-1.5 h-1.5 bg-slate-400 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                        </div>
                    </div>
                </div>
            )}
            <div ref={chatEndRef} />
        </div>

        {/* Input Area */}
        <form onSubmit={handleSend} className="p-3 bg-gray-50 shrink-0">
            <div className="flex items-center gap-2 bg-white border border-gray-300 p-1 pr-2 focus-within:border-slate-800 focus-within:ring-1 focus-within:ring-slate-800 transition-all">
                <textarea 
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Draft alert message or ask AI..."
                    className="flex-1 bg-transparent border-none focus:outline-none text-xs text-slate-800 p-2 resize-none h-10 max-h-24 scrollbar-thin"
                    onKeyDown={(e) => {
                        if(e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSend(e);
                        }
                    }}
                />
                <button 
                    type="submit"
                    disabled={!message.trim() || isAiTyping}
                    className={`w-8 h-8 flex items-center justify-center shrink-0 border transition-colors ${!message.trim() || isAiTyping ? 'bg-gray-200 border-gray-300 text-gray-400 cursor-not-allowed' : 'bg-slate-900 border-slate-900 text-white hover:bg-slate-800'}`}
                >
                    <Send className="w-3.5 h-3.5 ml-0.5" />
                </button>
            </div>
        </form>

    </div>
  );
}
