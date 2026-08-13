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
    <div className="w-[340px] h-[520px] bg-white rounded-2xl shadow-2xl flex flex-col border border-gray-200 overflow-hidden">
        
        {/* Header */}
        <div className="bg-[#233a77] p-4 flex items-center justify-between shrink-0 shadow-md z-10">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-full">
                    <Smartphone className="w-5 h-5 text-white" />
                </div>
                <div>
                    <h2 className="text-white font-bold text-sm tracking-wide">Emergency Dispatch</h2>
                    <p className="text-[#92cce5] text-[10px] font-medium flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Qwen 2.5 Local Agent
                    </p>
                </div>
            </div>
        </div>

        {/* Action Bar (Direct SMS) */}
        <div className="bg-[#e1f1ee]/50 p-3 border-b border-[#92cce5]/20 flex flex-col gap-2 shrink-0">
            <div className="text-[10px] font-bold text-gray-400 uppercase">Direct SMS</div>
            <div className="flex gap-2">
                <input 
                    type="text" 
                    placeholder="Recipient Number" 
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="flex-1 px-3 py-1.5 text-xs border border-[#92cce5]/50 rounded-lg focus:outline-none focus:border-[#3f7ce0] bg-white text-[#233a77] font-semibold"
                />
                <button 
                    onClick={handleDirectSms}
                    disabled={isSending || !phoneNumber || !message}
                    className={`px-3 py-1.5 text-xs font-bold text-white rounded-lg transition-all flex items-center gap-1 ${isSending || !phoneNumber || !message ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#3f7ce0] hover:bg-[#233a77]'}`}
                >
                    {isSending ? "Sending..." : "Send SMS"}
                </button>
            </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 p-4 overflow-y-auto bg-gray-50 flex flex-col gap-3">
            
            {/* Greeting */}
            {chatHistory.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center px-4 opacity-60">
                    <MessageSquare className="w-10 h-10 text-[#233a77] mb-3 opacity-50" />
                    <p className="text-xs font-semibold text-gray-500">
                        Chat with the AI to draft evacuation plans, or type a message above and hit Send SMS.
                    </p>
                </div>
            )}

            {chatHistory.map((msg, idx) => (
                <div key={idx} className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {msg.role === 'system' ? (
                        <div className={`w-full text-center text-[10px] font-bold py-1 px-3 rounded-full my-1 mx-4 ${msg.isError ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-700'}`}>
                            {msg.content}
                        </div>
                    ) : (
                        <div className={`flex items-end gap-2 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                            
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-[#3f7ce0] text-white' : 'bg-[#233a77] text-white'}`}>
                                {msg.role === 'user' ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                            </div>

                            <div className={`p-3 text-xs leading-relaxed shadow-sm whitespace-pre-wrap ${
                                msg.role === 'user' 
                                ? 'bg-[#3f7ce0] text-white rounded-2xl rounded-br-sm' 
                                : msg.isError 
                                    ? 'bg-red-50 text-red-700 border border-red-200 rounded-2xl rounded-bl-sm'
                                    : 'bg-white text-gray-700 border border-gray-100 rounded-2xl rounded-bl-sm'
                            }`}>
                                {msg.content}
                            </div>
                        </div>
                    )}
                </div>
            ))}
            
            {isAiTyping && (
                <div className="flex w-full justify-start">
                    <div className="flex items-end gap-2">
                        <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 bg-[#233a77] text-white">
                            <Bot className="w-3.5 h-3.5" />
                        </div>
                        <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-sm p-3 shadow-sm flex items-center gap-1.5 h-[38px]">
                            <div className="w-1.5 h-1.5 bg-[#92cce5] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                            <div className="w-1.5 h-1.5 bg-[#92cce5] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                            <div className="w-1.5 h-1.5 bg-[#92cce5] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                        </div>
                    </div>
                </div>
            )}
            <div ref={chatEndRef} />
        </div>

        {/* Input Area */}
        <form onSubmit={handleSend} className="p-3 bg-white border-t border-gray-100 shrink-0">
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl p-1 pr-2 focus-within:border-[#3f7ce0] focus-within:bg-white transition-all shadow-inner">
                <textarea 
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Draft alert message or ask AI..."
                    className="flex-1 bg-transparent border-none focus:outline-none text-xs text-gray-800 p-2 resize-none h-10 max-h-24 scrollbar-thin"
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
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all ${!message.trim() || isAiTyping ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-[#233a77] text-white hover:bg-[#3f7ce0] shadow-md'}`}
                >
                    <Send className="w-3.5 h-3.5 ml-0.5" />
                </button>
            </div>
        </form>

    </div>
  );
}
