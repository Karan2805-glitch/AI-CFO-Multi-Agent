import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, Sparkles, User, Loader2 } from 'lucide-react';

// ── Mock AI responses ─────────────────────────────────────────────────────────
const AI_RESPONSES = {
  default: [
    "Based on your current financial data, revenue is up **8.3%** YoY while expenses have grown by only **4.1%** — a healthy divergence indicating improving operational efficiency.",
    "The March anomaly in marketing spend (2σ above baseline at **$142k**) appears to be a seasonal campaign. If ROI aligns with projections, this is acceptable. I recommend reviewing attribution data.",
    "Your **profit margin of 23.4%** is above the industry median of ~18%. Key driver: salary optimization reduced headcount costs by 6% this quarter.",
    "Cash flow projection for Q3 looks stable. Given the current **expense ratio of 68.2%**, you have a **$340k buffer** before hitting your liquidity threshold.",
    "Anomaly detected: Accounts Receivable turnover dropped 2.1 days last month. This could signal delayed collections — I'd recommend a 30-day AR aging report review.",
  ],
  revenue: "Revenue currently stands at **$2.4M** for the trailing 12 months, with a month-over-month growth rate of **+3.2%**. The highest revenue month was November at **$248k**, driven by Q4 enterprise contracts.",
  expense: "Total expenses for the period are **$1.64M**, led by salaries (**39.2%**), followed by operations (**18.1%**) and marketing (**13.4%**). The March spike in marketing is flagged as an anomaly.",
  anomaly: "**2 anomalies** were detected this period:\n1. 📍 March – Marketing Expense: **+127%** above baseline (2.4σ)\n2. 📍 October – Revenue dip: **-11%** vs 3-month moving average\n\nBoth are outside the ±2σ confidence band.",
  forecast: "The 6-month revenue forecast (ARIMA model) projects **$1.38M** in H2, with a 90% confidence interval of [$1.21M – $1.55M]. Expense growth is expected to moderate to **+2.8%** QoQ.",
  profit: "Net profit for the period is **$563k**, yielding a **23.4% profit margin** — up from 20.1% last year. If current trends hold, you're on track to close the year at **~$610k net profit**.",
};

const SUGGESTED_PROMPTS = [
  "Analyze revenue trends",
  "Explain the March anomaly",
  "Show expense breakdown",
  "Forecast next quarter",
  "Summarize profit margins",
];

const getAIResponse = (input) => {
  const lower = input.toLowerCase();
  if (lower.includes('revenue')) return AI_RESPONSES.revenue;
  if (lower.includes('expense') || lower.includes('cost')) return AI_RESPONSES.expense;
  if (lower.includes('anomaly') || lower.includes('anomal')) return AI_RESPONSES.anomaly;
  if (lower.includes('forecast') || lower.includes('predict')) return AI_RESPONSES.forecast;
  if (lower.includes('profit') || lower.includes('margin')) return AI_RESPONSES.profit;
  const pool = AI_RESPONSES.default;
  return pool[Math.floor(Math.random() * pool.length)];
};

// ── Markdown-lite renderer ────────────────────────────────────────────────────
const renderMd = (text) => {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) =>
    p.startsWith('**') && p.endsWith('**')
      ? <strong key={i} className="text-blue-300 font-semibold">{p.slice(2, -2)}</strong>
      : p.split('\n').reduce((acc, line, j) => {
          if (j > 0) acc.push(<br key={`br-${i}-${j}`} />);
          acc.push(<span key={`s-${i}-${j}`}>{line}</span>);
          return acc;
        }, [])
  );
};

// ── Message Bubble ────────────────────────────────────────────────────────────
const MessageBubble = ({ msg, isNew }) => {
  const isUser = msg.role === 'user';
  return (
    <div
      className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'} ${isNew ? 'msg-enter' : ''}`}
    >
      {/* Avatar */}
      <div className={`w-7 h-7 rounded-lg flex-shrink-0 flex items-center justify-center mt-0.5 ${
        isUser
          ? 'bg-blue-500/20 border border-blue-500/30'
          : 'bg-purple-500/20 border border-purple-500/30'
      }`}>
        {isUser
          ? <User size={13} className="text-blue-400" />
          : <Bot size={13} className="text-purple-400" />
        }
      </div>

      {/* Bubble */}
      <div className={`max-w-[82%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
        isUser
          ? 'bg-blue-600/20 border border-blue-500/20 text-slate-200 rounded-tr-sm'
          : 'bg-white/5 border border-white/8 text-slate-300 rounded-tl-sm'
      }`}>
        {renderMd(msg.content)}
        <p className="text-[10px] text-slate-600 mt-1.5">{msg.time}</p>
      </div>
    </div>
  );
};

// ── Typing Indicator ──────────────────────────────────────────────────────────
const TypingIndicator = () => (
  <div className="flex gap-3 msg-enter">
    <div className="w-7 h-7 rounded-lg flex-shrink-0 flex items-center justify-center bg-purple-500/20 border border-purple-500/30">
      <Bot size={13} className="text-purple-400" />
    </div>
    <div className="bg-white/5 border border-white/8 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5">
      {[0, 1, 2].map(i => (
        <span key={i} className="w-1.5 h-1.5 rounded-full bg-purple-400/60 typing-dot" style={{ animationDelay: `${i * 0.18}s` }} />
      ))}
    </div>
  </div>
);

// ── AIChatbot Component ───────────────────────────────────────────────────────
const AIChatbot = () => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: 'ai',
      content: "Hello! I'm your **AI CFO Assistant**. I've analyzed your financial data and I'm ready to provide insights, detect anomalies, and answer any questions about your financial performance.",
      time: 'Just now',
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [newMsgId, setNewMsgId] = useState(null);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const isFirstMount = useRef(true);

  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const getTime = () =>
    new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  const sendMessage = async (text) => {
    const trimmed = (text || input).trim();
    if (!trimmed) return;

    const userMsg = { id: Date.now(), role: 'user', content: trimmed, time: getTime() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    // Simulate AI thinking delay
    await new Promise(r => setTimeout(r, 900 + Math.random() * 700));

    const aiContent = getAIResponse(trimmed);
    const aiMsg = { id: Date.now() + 1, role: 'ai', content: aiContent, time: getTime() };
    setNewMsgId(aiMsg.id);
    setMessages(prev => [...prev, aiMsg]);
    setIsTyping(false);
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="glass border border-purple-500/15 rounded-2xl flex flex-col overflow-hidden chatbot-glow" style={{ height: '480px' }}>

      {/* ── Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/6 bg-purple-500/5 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500/30 to-blue-500/30 border border-purple-500/30 flex items-center justify-center">
            <Sparkles size={15} className="text-purple-300" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-200">AI CFO Assistant</p>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] text-slate-500">Online · Powered by Gemini</span>
            </div>
          </div>
        </div>
        <div className="px-2.5 py-1 rounded-lg bg-purple-500/10 border border-purple-500/20">
          <span className="text-[10px] text-purple-300 font-semibold uppercase tracking-wider">AI Agent</span>
        </div>
      </div>

      {/* ── Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4 min-h-0">
        {messages.map(msg => (
          <MessageBubble key={msg.id} msg={msg} isNew={msg.id === newMsgId} />
        ))}
        {isTyping && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>

      {/* ── Suggested Prompts */}
      <div className="px-4 pb-2 flex gap-2 overflow-x-auto flex-shrink-0 scrollbar-hide">
        {SUGGESTED_PROMPTS.map(prompt => (
          <button
            key={prompt}
            onClick={() => sendMessage(prompt)}
            className="flex-shrink-0 text-[11px] text-slate-400 px-2.5 py-1 rounded-lg border border-white/8 bg-white/3 hover:bg-white/8 hover:text-slate-200 hover:border-purple-500/30 transition-all duration-200 whitespace-nowrap"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* ── Input Row */}
      <div className="px-4 pb-4 pt-2 flex-shrink-0">
        <div className="flex items-center gap-2 bg-white/4 border border-white/10 rounded-xl px-3 py-2 focus-within:border-purple-500/40 transition-colors">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Ask about revenue, expenses, anomalies…"
            className="flex-1 bg-transparent text-sm text-slate-200 placeholder-slate-600 outline-none"
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || isTyping}
            className="w-7 h-7 rounded-lg bg-blue-600/80 hover:bg-blue-500 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95"
          >
            {isTyping
              ? <Loader2 size={13} className="text-white animate-spin" />
              : <Send size={13} className="text-white" />
            }
          </button>
        </div>
        <p className="text-[10px] text-slate-700 text-center mt-1.5">AI responses are based on your uploaded financial data</p>
      </div>
    </div>
  );
};

export default AIChatbot;
