"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  BrainCircuit, Send, Mic, Sparkles, User, Activity, 
  HelpCircle, Globe2, ShieldAlert, ArrowRight
} from "lucide-react";

interface Message {
  id: string;
  sender: "user" | "assistant";
  text: string;
  timestamp: Date;
}

const QUICK_CHIPS = [
  "Where is the nearest government hospital?",
  "How do I report a cleanliness issue?",
  "What emergency services are available nearby?",
  "How do I track my complaint?"
];

export default function AIAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Initial welcome message
    setMessages([
      {
        id: "msg-init",
        sender: "assistant",
        text: "Hello! I am your AarogyaPulse AI Health Assistant. 🏥\n\nI can help you navigate this portal, locate nearby government healthcare centers, explain how to file a complaint, or check emergency helpline numbers. How can I assist you today?",
        timestamp: new Date()
      }
    ]);
  }, []);

  useEffect(() => {
    // Scroll to bottom on new message
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const getAIResponse = (query: string): string => {
    const text = query.toLowerCase().trim();
    
    if (text.includes("near") || text.includes("hospital") || text.includes("phc") || text.includes("chc")) {
      return "To find the nearest government hospital, click on 'Nearby Centres' in the sidebar. You can also filter by PIN Code or Taluka in the 'Hospital Search' directory. \n\nCurrently, we monitor five major centres in Pune, Mumbai, Satara, and Nashik districts. The closest operational facility will be highlighted on the SVG interactive map.";
    }
    
    if (text.includes("report") || text.includes("complaint") || text.includes("file") || text.includes("grievance")) {
      return "You can submit an operational grievance by clicking 'File a Grievance' in the menu. \n\nYou can speak your issue directly in Marathi or Hindi via our voice memo recorder, or upload photographic evidence. Our AI pipeline will automatically classify the issue (e.g. medicine shortage or infrastructure damage) and route it to the correct government department.";
    }

    if (text.includes("track") || text.includes("status")) {
      return "To track an existing grievance, go to 'Track Complaint' in the sidebar and enter your ticket ID (e.g., GRI-883012).\n\nYou will see a vertical timeline of status changes, including updates from assigning officers and resolved evidence logs uploaded by engineers.";
    }

    if (text.includes("emergency") || text.includes("number") || text.includes("ambulance") || text.includes("helpline")) {
      return "For medical emergencies, call **108** for immediate ambulance dispatch. For public health consultations, call the national health helpline at **104**.\n\nYou can also find these quick helpline shortcuts directly on the main Citizen Dashboard.";
    }

    if (text.includes("diagnos") || text.includes("symptom") || text.includes("pain") || text.includes("fever") || text.includes("cure") || text.includes("disease")) {
      return "⚠️ **Disclaimer**: As an operational public health assistant, I cannot provide medical diagnoses, symptom assessments, or treatment recommendations.\n\nIf you are experiencing a medical emergency, please call **108** immediately or visit the nearest government emergency department.";
    }

    return "I apologize, I didn't quite understand that query. I can help you search government hospitals, explain how to file/track complaints, or provide national helplines. Could you please rephrase?";
  };

  const handleSendMessage = (text: string) => {
    if (!text.trim()) return;

    const userMsg: Message = {
      id: `msg-${Date.now()}`,
      sender: "user",
      text,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue("");
    setIsTyping(true);

    // Simulate AI response delay
    setTimeout(() => {
      setIsTyping(false);
      const reply = getAIResponse(text);
      const assistantMsg: Message = {
        id: `msg-ai-${Date.now()}`,
        sender: "assistant",
        text: reply,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, assistantMsg]);
    }, 1200);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] max-h-[700px] bg-white border border-slate-200/80 rounded-3xl shadow-sm overflow-hidden">
      
      {/* 1. CHAT HEADER */}
      <div className="bg-[#0F172A] text-white p-4 sm:p-5 flex items-center justify-between shrink-0 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-teal-500/15 to-transparent pointer-events-none"></div>
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-teal-400 to-blue-500 p-2 rounded-xl">
            <BrainCircuit className="h-5 w-5 text-white" />
          </div>
          <div>
            <h4 className="font-extrabold text-sm text-slate-100 flex items-center gap-1.5">
              AarogyaPulse Health Bot <Sparkles className="h-3.5 w-3.5 text-teal-400 animate-pulse" />
            </h4>
            <span className="text-[10px] text-teal-400 font-bold flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping"></span> Live Portal Assistant
            </span>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-[10px] font-bold text-slate-400 bg-slate-800 px-3 py-1 rounded-full border border-slate-700">
          <Globe2 className="h-3.5 w-3.5 text-teal-400" /> English / हिन्दी / मराठी
        </div>
      </div>

      {/* 2. MESSAGES VIEWPORT */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-50/50">
        
        {messages.map((msg) => {
          const isAI = msg.sender === "assistant";
          return (
            <div key={msg.id} className={`flex gap-3 max-w-[85%] sm:max-w-[75%] ${isAI ? "mr-auto" : "ml-auto flex-row-reverse"}`}>
              {/* Profile icon */}
              <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 shadow-sm border ${
                isAI 
                  ? "bg-slate-900 border-slate-800 text-teal-400" 
                  : "bg-teal-50 border-teal-100 text-teal-600"
              }`}>
                {isAI ? <BrainCircuit className="h-4.5 w-4.5" /> : <User className="h-4.5 w-4.5" />}
              </div>

              {/* Chat bubble */}
              <div className="space-y-1">
                <div className={`rounded-2xl p-4 shadow-sm border text-xs leading-relaxed whitespace-pre-wrap font-semibold ${
                  isAI 
                    ? "bg-white border-slate-100 text-slate-700" 
                    : "bg-gradient-to-r from-teal-600 to-teal-700 border-teal-700 text-white"
                }`}>
                  {msg.text}
                </div>
                <p className={`text-[9px] font-bold text-slate-400 ${isAI ? "text-left" : "text-right"}`}>
                  {msg.timestamp.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })}
                </p>
              </div>
            </div>
          );
        })}

        {/* AI Typing Indicator */}
        {isTyping && (
          <div className="flex gap-3 mr-auto max-w-[75%]">
            <div className="h-8 w-8 rounded-lg bg-slate-900 border border-slate-800 text-teal-400 flex items-center justify-center shrink-0">
              <BrainCircuit className="h-4.5 w-4.5" />
            </div>
            <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm flex items-center gap-1.5 h-10">
              <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0s" }}></span>
              <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></span>
              <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }}></span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 3. QUICK SUGGESTIONS BAR */}
      <div className="p-3 border-t border-slate-100 bg-white flex items-center gap-2 overflow-x-auto shrink-0 select-none no-scrollbar">
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1 mr-1">
          <HelpCircle className="h-3.5 w-3.5 text-slate-400" /> Suggestions:
        </span>
        {QUICK_CHIPS.map((chip, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleSendMessage(chip)}
            className="text-[10px] font-bold bg-slate-50 border border-slate-200/80 text-slate-600 hover:text-teal-600 hover:border-teal-400 hover:bg-teal-50 px-3 py-1.5 rounded-full shrink-0 transition-all"
          >
            {chip}
          </button>
        ))}
      </div>

      {/* 4. INPUT CONTROL PANEL */}
      <div className="p-4 border-t border-slate-100 bg-white shrink-0 flex gap-3">
        <input
          type="text"
          placeholder="Ask a question about government clinics or grievances..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSendMessage(inputValue);
          }}
          className="flex-1 bg-slate-50 hover:bg-slate-100/50 border border-slate-200 rounded-xl py-3 px-4 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all"
        />
        
        <button
          type="button"
          onClick={() => {
            const voicePrompts = [
              "Where is the closest medical centre with available beds?",
              "How to file a new paracetamol shortage complaint?",
              "Track my complaint status timeline GRI-883012"
            ];
            const selectedPrompt = voicePrompts[Math.floor(Math.random() * voicePrompts.length)];
            alert(`Simulating Speech-to-text intake...\n\nAudio Recognized: "${selectedPrompt}"`);
            handleSendMessage(selectedPrompt);
          }}
          className="p-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-colors relative"
          title="Simulate speech voice input"
        >
          <Mic className="h-4.5 w-4.5" />
        </button>

        <button
          type="button"
          onClick={() => handleSendMessage(inputValue)}
          className="p-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl shadow-md shadow-teal-500/10 hover:shadow-teal-500/20 transition-all"
        >
          <Send className="h-4.5 w-4.5" />
        </button>
      </div>

    </div>
  );
}
