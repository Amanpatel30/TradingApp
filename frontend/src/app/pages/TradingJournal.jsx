import { useEffect, useState } from "react";
import { Search, ChevronRight, X, BookOpen, TrendingUp, Star } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid,
  RadarChart, PolarGrid, PolarAngleAxis, Radar,
} from "recharts";
import { useAppSession } from "../context/AppSession";
import { appApi } from "../lib/api";

const emotions = ["Confident","Fearful","Greedy","Calm","Anxious","FOMO","Patient","Impulsive"];

const emotionColors = {
  Confident: { bg: "rgba(59,130,246,0.1)", color: "#2563EB" },
  Fearful: { bg: "rgba(234,57,67,0.1)", color: "#DC2626" },
  Greedy: { bg: "rgba(245,158,11,0.1)", color: "#D97706" },
  Calm: { bg: "rgba(22,199,132,0.1)", color: "#059669" },
  Anxious: { bg: "rgba(249,115,22,0.1)", color: "#EA580C" },
  FOMO: { bg: "rgba(192,38,211,0.1)", color: "#9333EA" },
  Patient: { bg: "rgba(34,197,94,0.1)", color: "#16A34A" },
  Impulsive: { bg: "rgba(239,68,68,0.1)", color: "#DC2626" },
};

const demoJournalTrades = [
  { id: 1, date: "Apr 18, 2026", asset: "BTC/USDT", side: "Long", entry: "$65,200", exit: "$67,542", profit: "+$1,170", profitNum: 1170, strategy: "Breakout", emotion: "Confident", rr: "2.4R", notes: "Clean breakout above $65k resistance with high volume. Target was the previous ATH zone.", mistake: "Position size was slightly too large for the risk level.", riskScore: 74 },
  { id: 2, date: "Apr 15, 2026", asset: "ETH/USDT", side: "Long", entry: "$3,240", exit: "$3,580", profit: "+$680", profitNum: 680, strategy: "Trend Follow", emotion: "Calm", rr: "2.1R", notes: "Following BTC lead, ETH was in a clear uptrend. EMA stacked perfectly.", mistake: "", riskScore: 92 },
  { id: 3, date: "Apr 12, 2026", asset: "SOL/USDT", side: "Short", entry: "$142", exit: "$128", profit: "+$420", profitNum: 420, strategy: "RSI Reversal", emotion: "Patient", rr: "1.8R", notes: "RSI hit 78 on the daily, bearish divergence on 4H. Waited for confirmation candle.", mistake: "Should have taken partial profits at $134.", riskScore: 81 },
  { id: 4, date: "Apr 10, 2026", asset: "BNB/USDT", side: "Long", entry: "$580", exit: "$560", profit: "-$200", profitNum: -200, strategy: "MA Cross", emotion: "FOMO", rr: "-1.0R", notes: "Chased the move after seeing BTC pump. Entered too late without proper setup.", mistake: "Classic FOMO trade. Should have waited for a pullback to the MA.", riskScore: 32 },
  { id: 5, date: "Apr 8, 2026", asset: "BTC/USDT", side: "Short", entry: "$69,800", exit: "$71,200", profit: "-$420", profitNum: -420, strategy: "Breakdown", emotion: "Anxious", rr: "-1.4R", notes: "Tried to short a strong trend. Sentiment was still bullish but I ignored it.", mistake: "Trading against the trend. Should have waited for clear reversal signals.", riskScore: 28 },
  { id: 6, date: "Apr 5, 2026", asset: "ETH/USDT", side: "Long", entry: "$3,100", exit: "$3,440", profit: "+$680", profitNum: 680, strategy: "Support Bounce", emotion: "Confident", rr: "2.8R", notes: "Perfect bounce off the $3,100 daily support. Volume spike confirmed the level.", mistake: "", riskScore: 96 },
];

// Emotion P&L chart data
const demoEmotionPnlData = [
  { emotion: "Confident", pnl: 1850, trades: 8 },
  { emotion: "Calm", pnl: 680, trades: 4 },
  { emotion: "Patient", pnl: 420, trades: 3 },
  { emotion: "FOMO", pnl: -200, trades: 2 },
  { emotion: "Anxious", pnl: -420, trades: 3 },
  { emotion: "Greedy", pnl: -180, trades: 2 },
  { emotion: "Fearful", pnl: 120, trades: 2 },
  { emotion: "Impulsive", pnl: -340, trades: 3 },
];

const lightTooltip = { background: "#fff", border: "1px solid #E5E7EB", borderRadius: 8, fontSize: 11, color: "#111827" };

function RiskScoreRing({ score }) {
  const color = score >= 80 ? "#16C784" : score >= 60 ? "#F59E0B" : "#EA3943";
  const label = score >= 80 ? "Excellent" : score >= 60 ? "Good" : score >= 40 ? "Fair" : "Poor";
  const r = 24, circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  return (
    <div className="flex flex-col items-center">
      <svg width="64" height="64" viewBox="0 0 64 64">
        <circle cx="32" cy="32" r={r} fill="none" stroke="#F3F4F6" strokeWidth="6" />
        <circle cx="32" cy="32" r={r} fill="none" stroke={color} strokeWidth="6" strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" transform="rotate(-90 32 32)" style={{ transition: "stroke-dasharray 0.6s ease" }} />
        <text x="32" y="36" textAnchor="middle" style={{ fontSize: 13, fontWeight: 800, fill: color }}>{score}</text>
      </svg>
      <span className="text-xs mt-0.5" style={{ color, fontWeight: 600 }}>{label}</span>
    </div>
  );
}

export function TradingJournal() {
  const { accessToken, user } = useAppSession();
  const [journalData, setJournalData] = useState({ trades: [], emotionPnlData: [] });
  const [selectedTrade, setSelectedTrade] = useState(null);
  const [search, setSearch] = useState("");
  const [filterEmotion, setFilterEmotion] = useState("all");
  const [detailTab, setDetailTab] = useState("overview");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const showDemoFallback =
    Boolean(user?.demoDataFallbackEnabled) &&
    Boolean(error) &&
    !(journalData.trades?.length || journalData.emotionPnlData?.length);
  const effectiveJournalData = showDemoFallback
    ? { trades: demoJournalTrades, emotionPnlData: demoEmotionPnlData }
    : journalData;

  const journalTrades = effectiveJournalData.trades || [];
  const emotionPnlData = effectiveJournalData.emotionPnlData || [];

  useEffect(() => {
    let cancelled = false;

    async function loadJournal() {
      if (!accessToken) {
        return;
      }

      try {
        setError("");
        const response = await appApi.getJournal(accessToken);
        if (!cancelled) {
          setJournalData(response);
          setSelectedTrade((current) =>
            current
              ? response.trades.find((trade) => trade.id === current.id) || current
              : null
          );
        }
      } catch (requestError) {
        if (!cancelled) {
          setError(requestError.message || "Failed to load journal.");
        }
      }
    }

    loadJournal();

    const refreshFromRealtime = () => {
      loadJournal();
    };
    window.addEventListener("app:trading-event", refreshFromRealtime);

    return () => {
      cancelled = true;
      window.removeEventListener("app:trading-event", refreshFromRealtime);
    };
  }, [accessToken]);

  const refreshJournal = async () => {
    const response = await appApi.getJournal(accessToken);
    setJournalData(response);
    return response;
  };

  const updateSelectedTrade = (updates) =>
    setSelectedTrade((current) => (current ? { ...current, ...updates } : current));

  const saveSelectedTrade = async () => {
    if (!selectedTrade || !accessToken) {
      return;
    }

    try {
      setIsSaving(true);
      setError("");
      const payload = {
        orderId: selectedTrade.orderId || undefined,
        symbol: selectedTrade.asset?.replace("/", "") || selectedTrade.symbol || "BTCUSDT",
        strategy: selectedTrade.strategy,
        emotion: selectedTrade.emotion,
        notes: selectedTrade.notes,
        mistake: selectedTrade.mistake,
        mistakeType: selectedTrade.mistakeType,
        riskScore: Number(selectedTrade.riskScore || 70),
      };
      const savedEntry = await appApi.saveJournalEntry(
        accessToken,
        payload,
        selectedTrade.source === "MANUAL" && !selectedTrade.orderId
          ? selectedTrade.id
          : undefined,
      );
      const response = await refreshJournal();
      const savedEntryId = savedEntry?.id || savedEntry?._id || null;
      const nextSelected =
        response.trades.find((trade) =>
          selectedTrade.orderId
            ? trade.orderId === selectedTrade.orderId
            : trade.id === savedEntryId || trade.id === selectedTrade.id
        ) || null;
      setSelectedTrade(nextSelected);
    } catch (requestError) {
      setError(requestError.message || "Failed to save journal entry.");
    } finally {
      setIsSaving(false);
    }
  };

  const deleteSelectedTrade = async () => {
    if (!selectedTrade || !accessToken) {
      return;
    }

    try {
      setIsSaving(true);
      setError("");
      await appApi.deleteJournalEntry(accessToken, selectedTrade.id);
      await refreshJournal();
      setSelectedTrade(null);
    } catch (requestError) {
      setError(requestError.message || "Failed to delete journal entry.");
    } finally {
      setIsSaving(false);
    }
  };

  const filtered = journalTrades.filter((t) => {
    const matchSearch = t.asset.toLowerCase().includes(search.toLowerCase()) || t.strategy.toLowerCase().includes(search.toLowerCase());
    const matchEmotion = filterEmotion === "all" || t.emotion === filterEmotion;
    return matchSearch && matchEmotion;
  });

  return (
    <div className="flex h-full" style={{ background: "#F7F9FC", fontFamily: "Inter, sans-serif", color: "#111827" }}>
      {/* List */}
      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4" style={{ borderBottom: "1px solid #E5E7EB", background: "#FFFFFF" }}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-base mb-0.5" style={{ fontWeight: 700, color: "#111827" }}>Trading Journal</h1>
              <p className="text-xs" style={{ color: "#6B7280" }}>Track, review and learn from every trade you take.</p>
            </div>
            <button
              onClick={() => {
                setSelectedTrade({
                  id: null,
                  orderId: null,
                  asset: "BTC/USDT",
                  side: "Long",
                  entry: "$0",
                  exit: "$0",
                  profit: "$0",
                  profitNum: 0,
                  strategy: "Manual",
                  emotion: "Calm",
                  rr: "0.0R",
                  notes: "",
                  mistake: "",
                  mistakeType: "",
                  riskScore: 70,
                  source: "MANUAL",
                  date: new Date().toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  }),
                });
                setDetailTab("overview");
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-white"
              style={{ background: "linear-gradient(135deg, #3B82F6, #8B5CF6)", fontWeight: 600 }}
            >
              <BookOpen size={12} /> New Entry
            </button>
          </div>
          {error && (
            <div className="mb-3 p-2.5 rounded-lg text-xs" style={{ background: "rgba(234,57,67,0.06)", border: "1px solid rgba(234,57,67,0.18)", color: "#DC2626" }}>
              {showDemoFallback
                ? "Live journal data is unavailable right now. Showing demo journal data because the profile fallback is enabled."
                : error}
            </div>
          )}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg flex-1 max-w-xs" style={{ background: "#F9FAFB", border: "1px solid #E5E7EB" }}>
              <Search size={13} style={{ color: "#9CA3AF" }} />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search trades..." className="bg-transparent outline-none text-xs flex-1" style={{ color: "#111827" }} />
            </div>
            <select value={filterEmotion} onChange={(e) => setFilterEmotion(e.target.value)} className="px-3 py-1.5 rounded-lg text-xs outline-none" style={{ background: "#F9FAFB", border: "1px solid #E5E7EB", color: "#6B7280" }}>
              <option value="all">All Emotions</option>
              {emotions.map((e) => <option key={e} value={e}>{e}</option>)}
            </select>
            <div className="flex items-center gap-1.5 text-xs ml-auto" style={{ color: "#9CA3AF" }}>
              <span>{filtered.length} trades</span>
              <span>·</span>
              <span style={{ color: "#16C784", fontWeight: 600 }}>
                +${filtered.filter((t) => t.profitNum > 0).reduce((s, t) => s + t.profitNum, 0).toLocaleString()} P&L
              </span>
            </div>
          </div>
        </div>

        {/* Emotion Tracking Chart */}
        <div className="px-5 py-3" style={{ background: "#FFFFFF", borderBottom: "1px solid #E5E7EB" }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs" style={{ fontWeight: 600, color: "#6B7280" }}>EMOTION TRACKING — P&L BY MINDSET</span>
          </div>
          <div style={{ height: 80 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={emotionPnlData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <XAxis dataKey="emotion" tick={{ fill: "#9CA3AF", fontSize: 8 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#9CA3AF", fontSize: 8 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
                <Tooltip contentStyle={lightTooltip} formatter={(v) => [`$${v}`, "P&L"]} />
                <Bar dataKey="pnl" radius={[3,3,0,0]} isAnimationActive={false}>
                  {emotionPnlData.map((entry, index) => (
                    <Cell key={`emo-cell-${index}`} fill={entry.pnl >= 0 ? "#16C784" : "#EA3943"} fillOpacity={0.75} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-y-auto flex-1" style={{ background: "#FFFFFF" }}>
          <table className="w-full">
            <thead className="sticky top-0" style={{ borderBottom: "1px solid #E5E7EB", background: "#F9FAFB" }}>
              <tr>
                {["Date","Asset","Side","Entry","Exit","P&L","R:R","Strategy","Emotion","Risk",""].map((col) => (
                  <th key={col} className="text-left px-4 py-2.5 text-xs" style={{ color: "#9CA3AF", fontWeight: 500 }}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((trade) => {
                const emo = emotionColors[trade.emotion] || { bg: "#F3F4F6", color: "#6B7280" };
                const scoreColor = trade.riskScore >= 80 ? "#16C784" : trade.riskScore >= 60 ? "#F59E0B" : "#EA3943";
                return (
                  <tr key={trade.id} onClick={() => setSelectedTrade(trade)} className="cursor-pointer transition-colors hover:bg-blue-50/40"
                    style={{ borderBottom: "1px solid #F3F4F6", background: selectedTrade?.id === trade.id ? "rgba(59,130,246,0.05)" : "transparent" }}>
                    <td className="px-4 py-3 text-xs" style={{ color: "#9CA3AF" }}>{trade.date}</td>
                    <td className="px-4 py-3 text-xs" style={{ fontWeight: 600, color: "#111827" }}>{trade.asset}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: trade.side === "Long" ? "rgba(22,199,132,0.1)" : "rgba(234,57,67,0.1)", color: trade.side === "Long" ? "#059669" : "#DC2626", fontWeight: 600 }}>{trade.side}</span>
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: "#6B7280" }}>{trade.entry}</td>
                    <td className="px-4 py-3 text-xs" style={{ color: "#6B7280" }}>{trade.exit}</td>
                    <td className="px-4 py-3 text-xs" style={{ fontWeight: 600, color: trade.profitNum > 0 ? "#059669" : "#DC2626" }}>{trade.profit}</td>
                    <td className="px-4 py-3 text-xs" style={{ color: trade.profitNum > 0 ? "#059669" : "#DC2626", fontWeight: 500 }}>{trade.rr}</td>
                    <td className="px-4 py-3"><span className="text-xs px-1.5 py-0.5 rounded" style={{ background: "#F3F4F6", color: "#4B5563", fontWeight: 500 }}>{trade.strategy}</span></td>
                    <td className="px-4 py-3"><span className="text-xs px-1.5 py-0.5 rounded" style={{ background: emo.bg, color: emo.color, fontWeight: 500 }}>{trade.emotion}</span></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "#E5E7EB", width: 36 }}>
                          <div className="h-full rounded-full" style={{ width: `${trade.riskScore}%`, background: scoreColor }} />
                        </div>
                        <span className="text-xs" style={{ fontWeight: 600, color: scoreColor }}>{trade.riskScore}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3"><ChevronRight size={13} style={{ color: "#D1D5DB" }} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Panel */}
      {selectedTrade && (
        <div className="w-80 shrink-0 overflow-y-auto flex flex-col" style={{ background: "#FFFFFF", borderLeft: "1px solid #E5E7EB" }}>
          <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid #E5E7EB" }}>
            <div>
              <div className="text-sm" style={{ fontWeight: 700, color: "#111827" }}>{selectedTrade.asset}</div>
              <div className="text-xs" style={{ color: "#9CA3AF" }}>{selectedTrade.date}</div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={saveSelectedTrade}
                disabled={isSaving}
                className="px-2.5 py-1 rounded-lg text-xs text-white"
                style={{ background: "linear-gradient(135deg, #3B82F6, #8B5CF6)", fontWeight: 600, opacity: isSaving ? 0.7 : 1 }}
              >
                {isSaving ? "Saving..." : "Save"}
              </button>
              {selectedTrade.id && selectedTrade.source !== "AUTO" && (
                <button
                  onClick={deleteSelectedTrade}
                  disabled={isSaving}
                  className="px-2.5 py-1 rounded-lg text-xs"
                  style={{ background: "rgba(234,57,67,0.08)", color: "#DC2626", fontWeight: 600 }}
                >
                  Delete
                </button>
              )}
              <button onClick={() => setSelectedTrade(null)} className="transition-colors" style={{ color: "#D1D5DB" }} onMouseEnter={(e) => (e.currentTarget.style.color = "#6B7280")} onMouseLeave={(e) => (e.currentTarget.style.color = "#D1D5DB")}>
                <X size={15} />
              </button>
            </div>
          </div>

          {/* Sub-tabs */}
          <div className="flex" style={{ borderBottom: "1px solid #E5E7EB" }}>
            {["overview","analysis","emotion"].map((t) => (
              <button key={t} onClick={() => setDetailTab(t)} className="flex-1 py-2.5 text-xs capitalize transition-colors" style={{ color: detailTab === t ? "#3B82F6" : "#9CA3AF", borderBottom: detailTab === t ? "2px solid #3B82F6" : "2px solid transparent", fontWeight: detailTab === t ? 600 : 400 }}>
                {t === "overview" ? "Overview" : t === "analysis" ? "Analysis" : "Emotions"}
              </button>
            ))}
          </div>

          <div className="p-4 space-y-4">
            {detailTab === "overview" && (
              <>
                {/* P&L highlight */}
                <div className="p-4 rounded-xl text-center" style={{ background: selectedTrade.profitNum > 0 ? "rgba(22,199,132,0.07)" : "rgba(234,57,67,0.07)", border: `1px solid ${selectedTrade.profitNum > 0 ? "rgba(22,199,132,0.2)" : "rgba(234,57,67,0.2)"}` }}>
                  <div style={{ fontSize: "1.6rem", fontWeight: 800, color: selectedTrade.profitNum > 0 ? "#059669" : "#DC2626" }}>{selectedTrade.profit}</div>
                  <div className="text-xs" style={{ color: selectedTrade.profitNum > 0 ? "#34D399" : "#F87171" }}>{selectedTrade.rr} · {selectedTrade.strategy}</div>
                </div>

                {/* Chart snapshot placeholder */}
                <div className="rounded-xl overflow-hidden" style={{ background: "#0B0F19", border: "1px solid #1F2937" }}>
                  <div className="px-3 py-2 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                    <span className="text-xs" style={{ color: "#64748B", fontWeight: 600 }}>{selectedTrade.asset} · 4H Snapshot</span>
                    <span className="text-xs" style={{ color: selectedTrade.profitNum > 0 ? "#16C784" : "#EA3943", fontWeight: 600 }}>{selectedTrade.profit}</span>
                  </div>
                  <div className="flex items-center justify-center" style={{ height: 80, background: "rgba(255,255,255,0.02)" }}>
                    <div style={{ width: "90%", position: "relative" }}>
                      {/* Simple fake candlestick SVG */}
                      <svg width="100%" height="60" viewBox="0 0 200 60">
                        {[20,35,28,42,38,55,48,60,52,68,62,74,65,72].map((v, i) => {
                          const x = 10 + i * 14;
                          const h = Math.abs(v - (i > 0 ? [20,35,28,42,38,55,48,60,52,68,62,74,65,72][i-1] : v)) * 0.5 + 4;
                          const up = i > 0 && v > [20,35,28,42,38,55,48,60,52,68,62,74,65,72][i-1];
                          return (
                            <g key={i}>
                              <line x1={x} y1={60 - v * 0.75} x2={x} y2={60 - v * 0.75 + h + 8} stroke={up ? "#26A69A" : "#EF5350"} strokeWidth="1" />
                              <rect x={x-3} y={60 - v * 0.75} width="6" height={h} fill={up ? "#26A69A" : "#EF5350"} rx="1" />
                            </g>
                          );
                        })}
                        {/* Entry line */}
                        <line x1="0" y1="28" x2="200" y2="28" stroke="#F59E0B" strokeWidth="1" strokeDasharray="4 3" />
                        {/* TP line */}
                        <line x1="0" y1="12" x2="200" y2="12" stroke="#16C784" strokeWidth="1" strokeDasharray="4 3" />
                        {/* SL line */}
                        <line x1="0" y1="46" x2="200" y2="46" stroke="#EA3943" strokeWidth="1" strokeDasharray="4 3" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Details grid */}
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: "Side", value: selectedTrade.side },
                    { label: "Strategy", value: selectedTrade.strategy },
                    { label: "Entry", value: selectedTrade.entry },
                    { label: "Exit", value: selectedTrade.exit },
                    { label: "Risk:Reward", value: selectedTrade.rr },
                    { label: "Emotion", value: selectedTrade.emotion },
                  ].map(({ label, value }) => (
                    <div key={label} className="p-2.5 rounded-xl" style={{ background: "#F9FAFB", border: "1px solid #E5E7EB" }}>
                      <div className="text-xs mb-0.5" style={{ color: "#9CA3AF" }}>{label}</div>
                      <div className="text-xs" style={{ fontWeight: 600, color: "#111827" }}>{value}</div>
                    </div>
                  ))}
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-xs mb-1.5" style={{ color: "#6B7280", fontWeight: 500 }}>Trade Notes / Entry Reason</label>
                  <textarea
                    value={selectedTrade.notes || ""}
                    onChange={(event) => updateSelectedTrade({ notes: event.target.value })}
                    className="w-full p-3 rounded-xl text-xs leading-relaxed outline-none resize-none"
                    rows={5}
                    style={{ background: "#F9FAFB", border: "1px solid #E5E7EB", color: "#4B5563" }}
                  />
                </div>
              </>
            )}

            {detailTab === "analysis" && (
              <>
                {/* Risk management score */}
                <div className="flex items-center justify-between p-4 rounded-xl" style={{ background: "#F9FAFB", border: "1px solid #E5E7EB" }}>
                  <div>
                    <div className="text-xs mb-0.5" style={{ color: "#9CA3AF" }}>Risk Management Score</div>
                    <div className="text-xs" style={{ color: "#6B7280" }}>Based on position sizing, R:R & SL placement</div>
                  </div>
                  <RiskScoreRing score={selectedTrade.riskScore} />
                </div>

                {/* Mistake analysis */}
                {selectedTrade.mistake ? (
                  <div>
                    <label className="block text-xs mb-1.5" style={{ color: "#DC2626", fontWeight: 500 }}>⚠ Mistake Analysis</label>
                    <textarea
                      value={selectedTrade.mistake || ""}
                      onChange={(event) => updateSelectedTrade({ mistake: event.target.value })}
                      className="w-full p-3 rounded-xl text-xs leading-relaxed outline-none resize-none"
                      rows={4}
                      style={{ background: "rgba(234,57,67,0.06)", border: "1px solid rgba(234,57,67,0.18)", color: "#DC2626" }}
                    />
                  </div>
                ) : (
                  <textarea
                    value={selectedTrade.mistake || ""}
                    onChange={(event) => updateSelectedTrade({ mistake: event.target.value })}
                    placeholder="Add a review note or keep blank for a clean execution."
                    className="w-full p-3 rounded-xl text-xs outline-none resize-none"
                    rows={4}
                    style={{ background: "rgba(22,199,132,0.07)", border: "1px solid rgba(22,199,132,0.2)", color: "#059669" }}
                  />
                )}

                {/* Risk breakdown bars */}
                <div>
                  <div className="text-xs mb-2" style={{ color: "#6B7280", fontWeight: 600 }}>RISK BREAKDOWN</div>
                  {[
                    { label: "Position Sizing", score: selectedTrade.riskScore - 10, max: 100 },
                    { label: "SL Placement", score: selectedTrade.riskScore + 8, max: 100 },
                    { label: "R:R Quality", score: selectedTrade.profitNum > 0 ? 85 : 30, max: 100 },
                    { label: "Entry Timing", score: selectedTrade.riskScore - 5, max: 100 },
                  ].map(({ label, score, max }) => {
                    const s = Math.max(0, Math.min(100, score));
                    const c = s >= 80 ? "#16C784" : s >= 60 ? "#F59E0B" : "#EA3943";
                    return (
                      <div key={label} className="mb-2">
                        <div className="flex justify-between text-xs mb-0.5" style={{ color: "#6B7280" }}>
                          <span>{label}</span>
                          <span style={{ color: c, fontWeight: 600 }}>{s}/100</span>
                        </div>
                        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "#F3F4F6" }}>
                          <div className="h-full rounded-full transition-all" style={{ width: `${s}%`, background: c }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {detailTab === "emotion" && (
              <>
                <div className="text-xs mb-1" style={{ color: "#6B7280" }}>Emotional state during this trade.</div>

                {/* Emotion tag selector */}
                <div>
                  <label className="block text-xs mb-1.5" style={{ color: "#6B7280", fontWeight: 500 }}>Emotion Tag</label>
                  <div className="flex flex-wrap gap-1.5">
                    {emotions.map((e) => {
                      const emo = emotionColors[e] || { bg: "#F3F4F6", color: "#6B7280" };
                      const isActive = selectedTrade.emotion === e;
                      return (
                        <span key={e} onClick={() => updateSelectedTrade({ emotion: e })} className="text-xs px-2 py-0.5 rounded-full cursor-pointer transition-all" style={{ background: isActive ? emo.bg : "#F3F4F6", color: isActive ? emo.color : "#9CA3AF", border: isActive ? `1px solid ${emo.color}40` : "1px solid transparent", fontWeight: isActive ? 600 : 400 }}>
                          {e}
                        </span>
                      );
                    })}
                  </div>
                </div>

                {/* Emotion P&L chart */}
                <div>
                  <div className="text-xs mb-2" style={{ color: "#6B7280", fontWeight: 600 }}>EMOTION P&L ACROSS ALL TRADES</div>
                  <div style={{ height: 140 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={emotionPnlData} margin={{ top: 5, right: 0, left: -25, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                        <XAxis dataKey="emotion" tick={{ fill: "#9CA3AF", fontSize: 7 }} axisLine={false} tickLine={false} angle={-30} textAnchor="end" interval={0} />
                        <YAxis tick={{ fill: "#9CA3AF", fontSize: 8 }} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={lightTooltip} formatter={(v) => [`$${v}`, "P&L"]} />
                        <Bar dataKey="pnl" radius={[3,3,0,0]} isAnimationActive={false}>
                          {emotionPnlData.map((entry, i) => (
                            <Cell key={`emo-bar-${i}`} fill={entry.pnl >= 0 ? "#16C784" : "#EA3943"} fillOpacity={entry.emotion === selectedTrade.emotion ? 1 : 0.4} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Insight */}
                <div className="p-3 rounded-xl text-xs leading-relaxed" style={{ background: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.15)", color: "#2563EB" }}>
                  💡 You perform best when <strong>Confident</strong> or <strong>Patient</strong>. FOMO and Anxious trades show negative P&L on average.
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
