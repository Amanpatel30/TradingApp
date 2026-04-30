import { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  CartesianGrid, LineChart, Line, AreaChart, Area, PieChart, Pie, Legend, ComposedChart,
} from "recharts";
import { AlertTriangle, TrendingDown, Repeat, ShieldOff, Target, AlertOctagon, TrendingUp, ArrowRight } from "lucide-react";
import { useAppSession } from "../context/AppSession";
import { appApi } from "../lib/api";

const mistakeFrequency = [
  { mistake: "Early Entry", count: 18, impact: -1840 },
  { mistake: "SL Too Tight", count: 14, impact: -1260 },
  { mistake: "FOMO Chase", count: 12, impact: -1620 },
  { mistake: "Overtrading", count: 10, impact: -890 },
  { mistake: "No SL Set", count: 8, impact: -2100 },
  { mistake: "Trend Fade", count: 7, impact: -980 },
  { mistake: "Size Too Large", count: 6, impact: -1440 },
  { mistake: "Moved SL", count: 5, impact: -720 },
];

const overtradingData = [
  { week: "W1", trades: 8, pnl: 420 },
  { week: "W2", trades: 22, pnl: -640 },
  { week: "W3", trades: 14, pnl: 280 },
  { week: "W4", trades: 28, pnl: -1240 },
  { week: "W5", trades: 11, pnl: 580 },
  { week: "W6", trades: 19, pnl: -380 },
  { week: "W7", trades: 9, pnl: 740 },
  { week: "W8", trades: 31, pnl: -1820 },
  { week: "W9", trades: 10, pnl: 620 },
  { week: "W10", trades: 16, pnl: -210 },
  { week: "W11", trades: 8, pnl: 880 },
  { week: "W12", trades: 12, pnl: 440 },
];

const slSizeData = [
  { size: "<0.5%", count: 8, winRate: 24 },
  { size: "0.5-1%", count: 18, winRate: 42 },
  { size: "1-2%", count: 32, winRate: 68 },
  { size: "2-3%", count: 24, winRate: 72 },
  { size: "3-5%", count: 14, winRate: 64 },
  { size: ">5%", count: 6, winRate: 48 },
];

const riskViolationTrend = [
  { month: "Jan", violations: 4 },
  { month: "Feb", violations: 7 },
  { month: "Mar", violations: 5 },
  { month: "Apr", violations: 9 },
  { month: "May", violations: 6 },
  { month: "Jun", violations: 3 },
  { month: "Jul", violations: 8 },
  { month: "Aug", violations: 4 },
  { month: "Sep", violations: 2 },
  { month: "Oct", violations: 5 },
  { month: "Nov", violations: 3 },
  { month: "Dec", violations: 1 },
];

const mistakePieData = [
  { name: "Early Entry", value: 18, fill: "#EA3943" },
  { name: "SL Too Tight", value: 14, fill: "#F59E0B" },
  { name: "FOMO Chase", value: 12, fill: "#8B5CF6" },
  { name: "Overtrading", value: 10, fill: "#3B82F6" },
  { name: "No SL Set", value: 8, fill: "#EC4899" },
  { name: "Other", value: 18, fill: "#94A3B8" },
];

const lightTooltip = { background: "#fff", border: "1px solid #E5E7EB", borderRadius: 8, fontSize: 11, color: "#111827" };

const summaryCards = [
  { icon: AlertOctagon, label: "Total Mistakes", value: "80", sub: "Last 12 months", color: "#EA3943", bg: "rgba(234,57,67,0.06)" },
  { icon: TrendingDown, label: "P&L Lost to Mistakes", value: "-$10,850", sub: "Recoverable losses", color: "#EA3943", bg: "rgba(234,57,67,0.06)" },
  { icon: ShieldOff, label: "Avg SL Size", value: "1.8%", sub: "Optimal: 1.5–2.5%", color: "#F59E0B", bg: "rgba(245,158,11,0.06)" },
  { icon: Repeat, label: "Overtrading Days", value: "18", sub: ">15 trades/day flagged", color: "#8B5CF6", bg: "rgba(139,92,246,0.06)" },
  { icon: AlertTriangle, label: "Risk Violations", value: "57", sub: "Trades exceeding 2%", color: "#F59E0B", bg: "rgba(245,158,11,0.06)" },
  { icon: Target, label: "Mistake-Free Rate", value: "58%", sub: "Trades without errors", color: "#16C784", bg: "rgba(22,199,132,0.06)" },
];

const improvements = [
  { area: "Stop Loss Discipline", before: 48, after: 72, trend: "improving" },
  { area: "Position Sizing", before: 52, after: 68, trend: "improving" },
  { area: "Entry Timing", before: 41, after: 58, trend: "improving" },
  { area: "Overtrading", before: 38, after: 44, trend: "slow" },
  { area: "Trend Alignment", before: 60, after: 71, trend: "improving" },
];

// Recovery Simulation — what-if you eliminated top mistakes
const recoveryScenarios = [
  { name: "Actual", pnl: 5390, label: "Current P&L" },
  { name: "No Overtrading", pnl: 6280, label: "–Overtrading" },
  { name: "No FOMO", pnl: 7100, label: "–FOMO" },
  { name: "Better SL", pnl: 7640, label: "–Tight SL" },
  { name: "All Fixed", pnl: 8240, label: "All fixed" },
];

export function MistakeAnalysis() {
  const { accessToken, user } = useAppSession();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadMistakes() {
      if (!accessToken) {
        return;
      }

      try {
        setError("");
        const response = await appApi.getMistakeAnalysis(accessToken);
        if (!cancelled) {
          setData(response);
        }
      } catch (requestError) {
        if (!cancelled) {
          setError(requestError.message || "Failed to load mistake analysis.");
        }
      }
    }

    loadMistakes();

    const refreshFromRealtime = () => {
      loadMistakes();
    };
    window.addEventListener("app:trading-event", refreshFromRealtime);

    return () => {
      cancelled = true;
      window.removeEventListener("app:trading-event", refreshFromRealtime);
    };
  }, [accessToken]);

  const showDemoFallback =
    Boolean(user?.demoDataFallbackEnabled) && Boolean(error) && !data;
  const mistakeData = data || (showDemoFallback
    ? {
        mistakeFrequency,
        overtradingData,
        slSizeData,
        riskViolationTrend,
        mistakePieData,
        summaryCards,
        improvements,
        recoveryScenarios,
      }
    : null);

  const mistakeFrequencySeries = mistakeData?.mistakeFrequency || [];
  const overtradingSeries = mistakeData?.overtradingData || [];
  const slSizeSeries = mistakeData?.slSizeData || [];
  const riskViolationSeries = mistakeData?.riskViolationTrend || [];
  const mistakePieSeries = mistakeData?.mistakePieData || [];
  const summaryCardItems = (mistakeData?.summaryCards || []).map((card) => ({
    ...card,
    icon:
      {
        totalMistakes: AlertOctagon,
        pnlLost: TrendingDown,
        avgRisk: ShieldOff,
        overtradingDays: Repeat,
        riskViolations: AlertTriangle,
        mistakeFreeRate: Target,
      }[card.key] || AlertTriangle,
    color:
      {
        totalMistakes: "#EA3943",
        pnlLost: "#EA3943",
        avgRisk: "#F59E0B",
        overtradingDays: "#8B5CF6",
        riskViolations: "#F59E0B",
        mistakeFreeRate: "#16C784",
      }[card.key] || "#EA3943",
    bg:
      {
        totalMistakes: "rgba(234,57,67,0.06)",
        pnlLost: "rgba(234,57,67,0.06)",
        avgRisk: "rgba(245,158,11,0.06)",
        overtradingDays: "rgba(139,92,246,0.06)",
        riskViolations: "rgba(245,158,11,0.06)",
        mistakeFreeRate: "rgba(22,199,132,0.06)",
      }[card.key] || "rgba(234,57,67,0.06)",
  }));
  const improvementItems = mistakeData?.improvements || [];
  const recoveryScenarioItems = mistakeData?.recoveryScenarios || [];

  return (
    <div className="p-4 min-h-full" style={{ background: "#F8FAFC", fontFamily: "Inter, sans-serif", color: "#111827" }}>
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-base mb-0.5" style={{ fontWeight: 700, color: "#111827", letterSpacing: "-0.02em" }}>Mistake Analysis</h1>
        <p className="text-xs" style={{ color: "#6B7280" }}>Identify patterns in your errors and eliminate costly habits.</p>
      </div>

      {error && (
        <div
          className="mb-4 p-3 rounded-xl text-xs"
          style={{
            background: showDemoFallback ? "rgba(59,130,246,0.06)" : "rgba(234,57,67,0.06)",
            border: showDemoFallback
              ? "1px solid rgba(59,130,246,0.18)"
              : "1px solid rgba(234,57,67,0.18)",
            color: showDemoFallback ? "#1D4ED8" : "#DC2626",
          }}
        >
          {showDemoFallback
            ? "Live mistake analysis is unavailable right now. Showing demo analysis because the profile fallback is enabled."
            : error}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
        {summaryCardItems.map(({ icon: Icon, label, value, sub, color, bg }) => (
          <div key={label} className="p-3.5 rounded-xl" style={{ background: "#FFFFFF", border: "1px solid #E5E7EB" }}>
            <div className="w-7 h-7 rounded-lg flex items-center justify-center mb-2.5" style={{ background: bg }}>
              <Icon size={14} style={{ color }} />
            </div>
            <div className="text-xs mb-0.5" style={{ color: "#9CA3AF" }}>{label}</div>
            <div className="text-sm mb-0.5" style={{ fontWeight: 700, color: "#111827" }}>{value}</div>
            <div className="text-xs" style={{ color: "#6B7280" }}>{sub}</div>
          </div>
        ))}
      </div>

      {/* Row 1: Mistake Frequency + Pie */}
      <div className="grid lg:grid-cols-3 gap-3 mb-3">
        <div className="lg:col-span-2 rounded-xl p-4" style={{ background: "#FFFFFF", border: "1px solid #E5E7EB" }}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm" style={{ fontWeight: 600, color: "#111827" }}>Most Common Mistakes</h3>
            <div className="text-xs" style={{ color: "#9CA3AF" }}>by frequency · last 12 months</div>
          </div>
          <div style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mistakeFrequencySeries} layout="vertical" margin={{ top: 5, right: 60, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" horizontal={false} />
                <XAxis type="number" tick={{ fill: "#9CA3AF", fontSize: 9 }} axisLine={false} tickLine={false} />
                <YAxis dataKey="mistake" type="category" tick={{ fill: "#6B7280", fontSize: 9 }} axisLine={false} tickLine={false} width={80} />
                <Tooltip contentStyle={lightTooltip} formatter={(v, name) => [name === "count" ? `${v} times` : `$${Math.abs(v)}`, name === "count" ? "Occurrences" : "P&L Impact"]} />
                <Bar dataKey="count" radius={[0,4,4,0]} fill="#EA3943" fillOpacity={0.75} label={{ position: "right", fill: "#EA3943", fontSize: 9, fontWeight: 600, formatter: (v) => `${v}x` }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl p-4" style={{ background: "#FFFFFF", border: "1px solid #E5E7EB" }}>
          <h3 className="text-sm mb-3" style={{ fontWeight: 600, color: "#111827" }}>Mistake Breakdown</h3>
          <div style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={mistakePieSeries} cx="50%" cy="50%" innerRadius={48} outerRadius={78} paddingAngle={3} dataKey="value" isAnimationActive={false}>
                  {mistakePieSeries.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip contentStyle={lightTooltip} formatter={(v) => [`${v} times`, ""]} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-1 mt-1">
            {mistakePieSeries.map((entry) => (
              <div key={entry.name} className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-sm shrink-0" style={{ background: entry.fill }} />
                <span className="text-xs" style={{ color: "#6B7280" }}>{entry.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 2: Overtrading + SL Size */}
      <div className="grid lg:grid-cols-2 gap-3 mb-3">
        <div className="rounded-xl p-4" style={{ background: "#FFFFFF", border: "1px solid #E5E7EB" }}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm" style={{ fontWeight: 600, color: "#111827" }}>Overtrading Frequency</h3>
            <div className="text-xs px-2 py-0.5 rounded" style={{ background: "rgba(234,57,67,0.08)", color: "#EA3943", fontWeight: 600, border: "1px solid rgba(234,57,67,0.15)" }}>Danger zone: &gt;20 trades/wk</div>
          </div>
          <div style={{ height: 175 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={overtradingSeries} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                <XAxis dataKey="week" tick={{ fill: "#9CA3AF", fontSize: 9 }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="trades" tick={{ fill: "#9CA3AF", fontSize: 9 }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="pnl" orientation="right" tick={{ fill: "#9CA3AF", fontSize: 9 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
                <Tooltip contentStyle={lightTooltip} />
                <Bar yAxisId="trades" dataKey="trades" name="Trades" radius={[3,3,0,0]} isAnimationActive={false}>
                  {overtradingSeries.map((entry, i) => (
                    <Cell key={`ot-cell-${i}`} fill={entry.trades > 20 ? "#EA3943" : "#3B82F6"} fillOpacity={0.7} />
                  ))}
                </Bar>
                <Line yAxisId="pnl" type="monotone" dataKey="pnl" name="P&L" stroke="#F59E0B" strokeWidth={1.5} dot={{ r: 2, fill: "#F59E0B" }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs mt-1" style={{ color: "#9CA3AF" }}>
            <span style={{ color: "#EA3943", fontWeight: 600 }}>Red bars = overtrading</span> — notice P&L drops on high-volume weeks.
          </p>
        </div>

        <div className="rounded-xl p-4" style={{ background: "#FFFFFF", border: "1px solid #E5E7EB" }}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm" style={{ fontWeight: 600, color: "#111827" }}>Average Stop Loss Size</h3>
            <div className="text-xs px-2 py-0.5 rounded" style={{ background: "rgba(22,199,132,0.08)", color: "#16C784", fontWeight: 600, border: "1px solid rgba(22,199,132,0.15)" }}>Sweet spot: 1–3%</div>
          </div>
          <div style={{ height: 175 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={slSizeSeries} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                <XAxis dataKey="size" tick={{ fill: "#9CA3AF", fontSize: 9 }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="count" tick={{ fill: "#9CA3AF", fontSize: 9 }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="wr" orientation="right" tick={{ fill: "#9CA3AF", fontSize: 9 }} axisLine={false} tickLine={false} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                <Tooltip contentStyle={lightTooltip} />
                <Bar yAxisId="count" dataKey="count" name="Trades" fill="#8B5CF6" fillOpacity={0.7} radius={[3,3,0,0]} />
                <Line yAxisId="wr" type="monotone" dataKey="winRate" name="Win Rate %" stroke="#16C784" strokeWidth={2} dot={{ r: 3, fill: "#16C784" }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 3: Risk Violations + Improvements */}
      <div className="grid lg:grid-cols-2 gap-3 mb-3">
        <div className="rounded-xl p-4" style={{ background: "#FFFFFF", border: "1px solid #E5E7EB" }}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm" style={{ fontWeight: 600, color: "#111827" }}>Risk Violations Over Time</h3>
            <div className="text-xs px-2 py-0.5 rounded" style={{ background: "rgba(22,199,132,0.08)", color: "#16C784", fontWeight: 600, border: "1px solid rgba(22,199,132,0.15)" }}>Trending down ✓</div>
          </div>
          <div style={{ height: 175 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={riskViolationSeries} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: "#9CA3AF", fontSize: 9 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#9CA3AF", fontSize: 9 }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v) => [`${v} violations`, "Risk Violations"]} contentStyle={lightTooltip} />
                <Area type="monotone" dataKey="violations" stroke="#F59E0B" strokeWidth={2} fill="#F59E0B" fillOpacity={0.12} dot={{ r: 3, fill: "#F59E0B" }} activeDot={{ r: 5, fill: "#F59E0B", stroke: "#fff", strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl p-4" style={{ background: "#FFFFFF", border: "1px solid #E5E7EB" }}>
          <h3 className="text-sm mb-4" style={{ fontWeight: 600, color: "#111827" }}>Improvement Tracker</h3>
          <div className="space-y-3">
            {improvementItems.map(({ area, before, after, trend }) => {
              const gain = after - before;
              const color = trend === "improving" ? "#16C784" : "#F59E0B";
              return (
                <div key={area}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs" style={{ color: "#374151", fontWeight: 500 }}>{area}</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs" style={{ color: "#9CA3AF" }}>{before}→</span>
                      <span className="text-xs" style={{ fontWeight: 700, color }}>{after}</span>
                      <span className="text-xs px-1 rounded" style={{ background: `${color}15`, color, fontWeight: 600 }}>+{gain}</span>
                    </div>
                  </div>
                  <div className="relative h-2 rounded-full overflow-hidden" style={{ background: "#F3F4F6" }}>
                    <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${before}%`, background: "#E5E7EB" }} />
                    <div className="absolute inset-y-0 left-0 rounded-full transition-all" style={{ width: `${after}%`, background: color }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Action tips */}
          <div className="mt-4 p-3 rounded-xl" style={{ background: "rgba(59,130,246,0.05)", border: "1px solid rgba(59,130,246,0.15)" }}>
            <div className="text-xs mb-1.5" style={{ color: "#2563EB", fontWeight: 600 }}>💡 TOP PRIORITY</div>
            <p className="text-xs leading-relaxed" style={{ color: "#374151" }}>
              Focus on reducing <strong>overtrading</strong> — your biggest recoverable P&L loss category. Limit to max 15 trades/week.
            </p>
          </div>
        </div>
      </div>

      {/* Recovery Simulation */}
      <div className="rounded-xl p-4" style={{ background: "#FFFFFF", border: "1px solid #E5E7EB" }}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm" style={{ fontWeight: 600, color: "#111827" }}>Recovery Simulation</h3>
            <p className="text-xs" style={{ color: "#9CA3AF" }}>If you eliminated these mistakes, your P&L would be…</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl" style={{ background: "rgba(34,197,94,0.07)", border: "1px solid rgba(34,197,94,0.18)" }}>
            <TrendingUp size={13} style={{ color: "#16A34A" }} />
            <span className="text-xs" style={{ color: "#16A34A", fontWeight: 700 }}>+$2,850 recoverable</span>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 items-center">
          {/* Bar chart */}
          <div style={{ height: 180 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={recoveryScenarioItems} margin={{ top: 5, right: 5, left: -15, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                <XAxis dataKey="label" tick={{ fill: "#9CA3AF", fontSize: 8 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#9CA3AF", fontSize: 9 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v/1000).toFixed(1)}k`} domain={[4000, 9000]} />
                <Tooltip contentStyle={lightTooltip} formatter={(v) => [`$${Number(v).toLocaleString()}`, "P&L"]} />
                <Bar dataKey="pnl" radius={[4,4,0,0]} isAnimationActive={false}>
                  {recoveryScenarioItems.map((entry, i) => (
                    <Cell key={`rc-cell-${i}`} fill={i === 0 ? "#94A3B8" : i === recoveryScenarioItems.length - 1 ? "#22C55E" : "#3B82F6"} fillOpacity={0.8} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Scenario list */}
          <div className="space-y-2">
            {[
              { label: "Eliminate Overtrading", gain: "+$890", color: "#3B82F6", desc: "Limit to ≤15 trades/week" },
              { label: "Eliminate FOMO trades", gain: "+$820", color: "#3B82F6", desc: "Wait for full confirmation" },
              { label: "Fix SL placement", gain: "+$540", color: "#3B82F6", desc: "Min 1.5% away from entry" },
              { label: "Remove no-SL trades", gain: "+$600", color: "#22C55E", desc: "Always set a stop loss" },
            ].map(({ label, gain, color, desc }) => (
              <div key={label} className="flex items-center justify-between p-2.5 rounded-xl" style={{ background: "#F9FAFB", border: "1px solid #E5E7EB" }}>
                <div className="flex items-start gap-2">
                  <ArrowRight size={12} style={{ color, marginTop: 2, flexShrink: 0 }} />
                  <div>
                    <div className="text-xs" style={{ fontWeight: 600, color: "#111827" }}>{label}</div>
                    <div className="text-xs" style={{ color: "#9CA3AF" }}>{desc}</div>
                  </div>
                </div>
                <span className="text-xs ml-3" style={{ fontWeight: 700, color: "#22C55E", whiteSpace: "nowrap" }}>{gain}</span>
              </div>
            ))}

            <div className="flex items-center justify-between p-3 rounded-xl mt-2" style={{ background: "rgba(34,197,94,0.07)", border: "1px solid rgba(34,197,94,0.2)" }}>
              <div>
                <div className="text-xs" style={{ color: "#6B7280" }}>Current P&L</div>
                <div className="text-sm" style={{ fontWeight: 700, color: "#374151" }}>+$5,390</div>
              </div>
              <ArrowRight size={16} style={{ color: "#9CA3AF" }} />
              <div>
                <div className="text-xs" style={{ color: "#6B7280" }}>Potential P&L</div>
                <div className="text-sm" style={{ fontWeight: 800, color: "#16A34A" }}>+$8,240</div>
              </div>
              <div className="text-xs px-2 py-1 rounded-lg ml-2" style={{ background: "rgba(34,197,94,0.15)", color: "#16A34A", fontWeight: 700 }}>+53%</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
