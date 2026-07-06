"use client";

import { useState, useRef, useEffect } from "react";
import type { ChatMessage } from "@/types";
import Header from "@/components/Header";
import { useDistrict } from "@/context/DistrictContext";
import {
  Bot,
  Send,
  Sparkles,
  TrendingUp,
  Bed,
  Pill,
  Users,
  AlertTriangle,
  Map,
} from "lucide-react";

const suggestedQueries = [
  { icon: AlertTriangle, text: "Which hospitals are at critical risk right now?", color: "#ef4444" },
  { icon: Pill, text: "What medicine shortages are predicted for this week?", color: "#8b5cf6" },
  { icon: Bed, text: "Show me bed occupancy across all facilities", color: "#3b82f6" },
  { icon: TrendingUp, text: "Which hospitals have declining performance trends?", color: "#f97316" },
  { icon: Map, text: "Where should I redirect patients from Worli?", color: "#14b8a6" },
  { icon: Users, text: "What staffing actions should I take today?", color: "#22c55e" },
];

const aiResponses = {
  "Which hospitals are at critical risk right now?": {
    text: "Based on current operational data, **2 hospitals** are classified as **Critical Risk**:\n\n**1. Dadar PHC – Ward 1** (AI Score: 28)\n- Medicine stock at 18% — emergency procurement needed\n- Only 1 of 4 doctors on duty (25% attendance)\n- 9 active unresolved issues\n- 31 citizen complaints in 7 days\n\n**2. Worli Critical Care Centre** (AI Score: 32)\n- Bed occupancy at 95% — ICU at 97%\n- 2 of 8 ventilators non-functional\n- Oxygen stock may last < 6 hours\n- 27 active complaints\n\n**Immediate Actions Recommended:**\n1. Approve emergency insulin procurement for Dadar PHC\n2. Redirect non-critical patients from Worli to Mulund Hospital (43% capacity)\n3. Deploy additional staff to both facilities",
    confidence: 0.94,
  },
  "What medicine shortages are predicted for this week?": {
    text: "Our AI Forecast Aggregator has identified **3 projected shortages** district-wide:\n\n**1. Insulin** — District-wide shortage expected within 5 days\n- 3 hospitals (Dadar PHC, Bandra PHC, Kurla Sub-District) report stock < 2-day supply\n- Projected deficit: 340 units\n- Current district stock: 520 units\n- **Recommended:** Immediate procurement of 500 units\n\n**2. Blood Units (O+)** — Andheri CHC and Dadar PHC showing declining stocks\n- Andheri: 12 units remaining (3-day supply)\n- Dadar: 8 units remaining (2-day supply)\n- **Recommended:** Transfer 30 units from Sion Hospital (surplus: 85)\n\n**3. Antibiotics (Ciprofloxacin)** — Thane District Hospital trending down\n- Consumption rate increased 22% week-over-week\n- Stock projected to reach critical in 4 days\n- **Recommended:** Increase procurement order by 150%",
    confidence: 0.91,
  },
  "Show me bed occupancy across all facilities": {
    text: "**District-Wide Bed Occupancy Summary:**\n\nTotal Available: **3,842 beds** (across 59 hospitals)\nICU Available: **486 beds**\n\n**Facility Breakdown:**\n\n| Hospital | Type | Total | Available | Occupancy |\n|---|---|---|---|---|\n| Mumbai Central GH | District | 500 | 182 | 64% |\n| Sion Hospital | District | 420 | 156 | 63% |\n| BKC Superspeciality | Sub-District | 300 | 88 | 71% |\n| Thane District | District | 350 | 98 | 72% |\n| Worli Critical Care | Sub-District | 150 | 8 | **95%** ⚠️ |\n| Kurla Sub-District | Sub-District | 200 | 44 | 78% |\n| Mulund General | Sub-District | 180 | 78 | 57% |\n\n**Key Insight:** Worli Critical Care Centre is at 95% capacity. I recommend redirecting non-critical patients to Mulund General (57% occupancy, 78 beds available).",
    confidence: 0.96,
  },
  default: {
    text: "I'm analyzing the district health data to provide you with actionable insights. Based on current patterns:\n\n• **2 hospitals** require immediate intervention\n• **3 medicine shortages** are projected within the week\n• **6 resource transfers** are pending approval\n• **12 infrastructure issues** need attention\n\nWould you like me to dive deeper into any specific area? I can provide detailed analysis on:\n- Hospital performance trends\n- Resource optimization\n- Staffing recommendations\n- Predictive forecasts\n- Citizen complaint analysis",
    confidence: 0.85,
  },
};

export default function AIDecisionAssistant() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 1,
      role: "assistant",
      content: "Welcome to the **ArogyaOne AI Decision Assistant**. I can help you analyze district health data, forecast resource needs, and recommend actions.\n\nAsk me anything about your district's healthcare operations, or try one of the suggested queries below.",
      timestamp: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState<string>("");
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = (text?: string) => {
    const query = text || input.trim();
    if (!query) return;

    const userMsg: ChatMessage = {
      id: Date.now(),
      role: "user",
      content: query,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    setTimeout(() => {
      const response = aiResponses[query as keyof typeof aiResponses] || aiResponses.default;
      const aiMsg: ChatMessage = {
        id: Date.now() + 1,
        role: "assistant",
        content: response.text,
        confidence: response.confidence,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, aiMsg]);
      setIsTyping(false);
    }, 1200);
  };

  return (
    <>
      <Header
        title="AI Decision Assistant"
        subtitle="Ask questions about district health data and receive AI-powered insights"
      />
      <div className="page" style={{ padding: "0 16px 16px" }}>
        <div className="card" style={{ height: "calc(100vh - 120px)", display: "flex", flexDirection: "column" }}>
          {/* Messages */}
          <div className="chat-messages" style={{ flex: 1, overflowY: "auto", padding: 24 }}>
            {messages.map((msg) => (
              <div key={msg.id} className={`chat-message chat-message--${msg.role}`}>
                <div className="chat-message__avatar">
                  {msg.role === "assistant" ? <Bot size={16} /> : "You"}
                </div>
                <div>
                  <div className="chat-message__bubble" style={{ whiteSpace: "pre-wrap" }}>
                    {msg.content.split("\n").map((line, i) => {
                      // Simple markdown bold
                      const parts = line.split(/\*\*(.*?)\*\*/g);
                      return (
                        <span key={i}>
                          {parts.map((part, pi) =>
                            pi % 2 === 1 ? (
                              <strong key={pi} style={{ color: msg.role === "user" ? "white" : "#0f172a" }}>
                                {part}
                              </strong>
                            ) : (
                              <span key={pi}>{part}</span>
                            )
                          )}
                          {i < msg.content.split("\n").length - 1 && "\n"}
                        </span>
                      );
                    })}
                  </div>
                  {msg.confidence && (
                    <div style={{ marginTop: 6, fontSize: 11, color: "#94a3b8" }}>
                      <Sparkles size={11} style={{ display: "inline" }} /> Confidence: {Math.round(msg.confidence * 100)}%
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="chat-message chat-message--assistant">
                <div className="chat-message__avatar">
                  <Bot size={16} />
                </div>
                <div className="chat-message__bubble">
                  <span className="typing-dots">Analyzing data</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggested Queries */}
          {messages.length <= 2 && (
            <div style={{ padding: "0 24px 12px", display: "flex", gap: 8, flexWrap: "wrap" }}>
              {suggestedQueries.map((q, i) => (
                <button
                  key={i}
                  className="btn btn--outline btn--sm"
                  onClick={() => handleSend(q.text)}
                  style={{ fontSize: 11.5, borderRadius: 20 }}
                >
                  <q.icon size={12} style={{ color: q.color }} />
                  {q.text.length > 45 ? q.text.slice(0, 45) + "…" : q.text}
                </button>
              ))}
            </div>
          )}

          {/* Input Bar */}
          <div className="chat-input-bar">
            <input
              className="chat-input"
              placeholder="Ask about district health data..."
              value={input}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInput(e.target.value)}
              onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === "Enter" && handleSend()}
              disabled={isTyping}
            />
            <button
              className="btn btn--primary"
              onClick={() => handleSend()}
              disabled={isTyping || !input.trim()}
              style={{ borderRadius: 10 }}
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
