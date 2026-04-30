import { useEffect, useState } from "react";
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  CartesianGrid, ReferenceLine, ScatterChart, Scatter, ZAxis,
  ComposedChart,
} from "recharts";
import { TrendingUp, Target, AlertTriangle, Award, Zap, Activity } from "lucide-react";
import { useAppSession } from "../context/AppSession";
import { appApi } from "../lib/api";

const winRateData = [
  { week: "W1", rate: 55 }, { week: "W2", rate: 60 }, { week: "W3", rate: 52 },
  { week: "W4", rate: 68 }, { week: "W5", rate: 72 }, { week: "W6", rate: 65 },
  { week: "W7", rate: 70 }, { week: "W8", rate: 75 }, { week: "W9", rate: 68 },
  { week: "W10", rate: 80 }, { week: "W11", rate: 78 }, { week: "W12", rate: 82 },
];

const profitByAsset = [
  { asset: "BTC", profit: 4200, trades: 42 },
  { asset: "ETH", profit: 2800, trades: 38 },
  { asset: "SOL", profit: 1600, trades: 24 },
  { asset: "BNB", profit: -400, trades: 18 },
  { asset: "ADA", profit: 820, trades: 14 },
  { asset: "DOT", profit: -240, trades: 10 },
];

const profitByWeekday = [
  { day: "Mon", profit: 1240, trades: 28 },
  { day: "Tue", profit: 2180, trades: 35 },
  { day: "Wed", profit: -420, trades: 22 },
  { day: "Thu", profit: 3100, trades: 41 },
  { day: "Fri", profit: 1820, trades: 30 },
  { day: "Sat", profit: -280, trades: 12 },
  { day: "Sun", profit: 640, trades: 16 },
];

const tradeDurationProfit = [
  { duration: 0.5, profit: 320, rr: 1.2 },
  { duration: 1, profit: 680, rr: 1.8 },
  { duration: 2, profit: 1200, rr: 2.4 },
  { duration: 4, profit: 840, rr: 2.1 },
  { duration: 8, profit: -220, rr: 0.8 },
  { duration: 12, profit: 1560, rr: 3.1 },
  { duration: 24, profit: 2100, rr: 3.8 },
  { duration: 48, profit: -480, rr: 0.6 },
  { duration: 72, profit: 980, rr: 1.9 },
  { duration: 120, profit: 2800, rr: 4.2 },
];

const strategyComparison = [
  { name: "Breakout", winRate: 72, profitFactor: 2.4, trades: 48, profit: 4200 },
  { name: "RSI Reversal", winRate: 63, profitFactor: 1.9, trades: 38, profit: 2800 },
  { name: "Trend Follow", winRate: 58, profitFactor: 1.7, trades: 44, profit: 2100 },
  { name: "MA Cross", winRate: 51, profitFactor: 1.2, trades: 28, profit: -400 },
  { name: "Support Bounce", winRate: 68, profitFactor: 2.1, trades: 22, profit: 1800 },
  { name: "VWAP", winRate: 55, profitFactor: 1.4, trades: 18, profit: 620 },
];

const equityVolatility = [
  { date: "Jan", equity: 10000, vol: 8.2 },
  { date: "Feb", equity: 11200, vol: 12.4 },
  { date: "Mar", equity: 10500, vol: 18.1 },
  { date: "Apr", equity: 13000, vol: 9.6 },
  { date: "May", equity: 14800, vol: 6.8 },
  { date: "Jun", equity: 13500, vol: 14.2 },
  { date: "Jul", equity: 16200, vol: 7.4 },
  { date: "Aug", equity: 18400, vol: 5.9 },
  { date: "Sep", equity: 17100, vol: 11.8 },
  { date: "Oct", equity: 20000, vol: 8.3 },
  { date: "Nov", equity: 21500, vol: 6.1 },
  { date: "Dec", equity: 23800, vol: 4.8 },
];

const drawdownData = [
  { date: "Jan", dd: 0 }, { date: "Feb", dd: -3.2 }, { date: "Mar", dd: -1.4 },
  { date: "Apr", dd: -8.1 }, { date: "May", dd: -12.4 }, { date: "Jun", dd: -5.2 },
  { date: "Jul", dd: -2.8 }, { date: "Aug", dd: -4.1 }, { date: "Sep", dd: -1.9 },
  { date: "Oct", dd: -6.3 }, { date: "Nov", dd: -3.5 }, { date: "Dec", dd: -1.2 },
];

const equityVsBenchmark = [
  { month: "Jan", equity: 10000, benchmark: 10000 },
  { month: "Feb", equity: 11200, benchmark: 10280 },
  { month: "Mar", equity: 10500, benchmark: 10150 },
  { month: "Apr", equity: 13000, benchmark: 10620 },
  { month: "May", equity: 14800, benchmark: 11340 },
  { month: "Jun", equity: 13500, benchmark: 11180 },
  { month: "Jul", equity: 16200, benchmark: 12000 },
  { month: "Aug", equity: 18400, benchmark: 12800 },
  { month: "Sep", equity: 17100, benchmark: 12400 },
  { month: "Oct", equity: 20000, benchmark: 13600 },
  { month: "Nov", equity: 21500, benchmark: 14800 },
  { month: "Dec", equity: 23800, benchmark: 15900 },
];

// Expectancy = (WinRate × AvgWin) − (LossRate × AvgLoss), tracked over sessions
const expectancyData = [
  { session: "S1",  winRate: 0.52, avgWin: 310, avgLoss: 220, expectancy: 0.52*310 - 0.48*220 },
  { session: "S2",  winRate: 0.55, avgWin: 340, avgLoss: 210, expectancy: 0.55*340 - 0.45*210 },
  { session: "S3",  winRate: 0.50, avgWin: 280, avgLoss: 230, expectancy: 0.50*280 - 0.50*230 },
  { session: "S4",  winRate: 0.60, avgWin: 380, avgLoss: 200, expectancy: 0.60*380 - 0.40*200 },
  { session: "S5",  winRate: 0.58, avgWin: 400, avgLoss: 195, expectancy: 0.58*400 - 0.42*195 },
  { session: "S6",  winRate: 0.63, avgWin: 420, avgLoss: 202, expectancy: 0.63*420 - 0.37*202 },
  { session: "S7",  winRate: 0.61, avgWin: 410, avgLoss: 198, expectancy: 0.61*410 - 0.39*198 },
  { session: "S8",  winRate: 0.65, avgWin: 440, avgLoss: 190, expectancy: 0.65*440 - 0.35*190 },
  { session: "S9",  winRate: 0.68, avgWin: 460, avgLoss: 185, expectancy: 0.68*460 - 0.32*185 },
  { session: "S10", winRate: 0.66, avgWin: 450, avgLoss: 192, expectancy: 0.66*450 - 0.34*192 },
  { session: "S11", winRate: 0.70, avgWin: 475, avgLoss: 180, expectancy: 0.70*475 - 0.30*180 },
  { session: "S12", winRate: 0.68, avgWin: 480, avgLoss: 182, expectancy: 0.68*480 - 0.32*182 },
].map(d => ({ ...d, expectancy: Math.round(d.expectancy) }));

const summaryCards = [
  { icon: Target, label: "Avg Risk/Trade", value: "1.2%", desc: "of portfolio per trade", color: "#3B82F6" },
  { icon: Award, label: "Best Strategy", value: "Breakout", desc: "72.4% win rate", color: "#16C784" },
  { icon: AlertTriangle, label: "Worst Asset", value: "BNB/USDT", desc: "-$400 total P&L", color: "#EA3943" },
  { icon: Zap, label: "Best Session", value: "Thursday", desc: "+$3,100 avg profit", color: "#8B5CF6" },
  { icon: Activity, label: "Equity Volatility", value: "8.4%", desc: "avg monthly vol", color: "#F59E0B" },
  { icon: TrendingUp, label: "Alpha vs BTC", value: "+79%", desc: "outperformance YTD", color: "#16C784" },
];

const tooltipStyle = { background: "#1F2937", border: "1px solid #374151", borderRadius: 8, fontSize: 11, color: "#F8FAFC" };
const lightTooltip = { background: "#fff", border: "1px solid #E5E7EB", borderRadius: 8, fontSize: 11, color: "#111827" };

export function Analytics() {
  const { accessToken, user } = useAppSession();
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadAnalytics() {
      if (!accessToken) {
        setIsLoading(false);
        return;
      }

      try {
        setError("");
        const response = await appApi.getAnalytics(accessToken);
        if (!cancelled) {
          setData(response);
        }
      } catch (requestError) {
        if (!cancelled) {
          setError(requestError.message || "Failed to load analytics.");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    loadAnalytics();

    const refreshFromRealtime = () => {
      loadAnalytics();
    };
    window.addEventListener("app:trading-event", refreshFromRealtime);
    window.addEventListener("app:portfolio-updated", refreshFromRealtime);

    return () => {
      cancelled = true;
      window.removeEventListener("app:trading-event", refreshFromRealtime);
      window.removeEventListener("app:portfolio-updated", refreshFromRealtime);
    };
  }, [accessToken]);

  const showDemoFallback =
    Boolean(user?.demoDataFallbackEnabled) && Boolean(error) && !data;
  const analyticsData = data || (showDemoFallback
    ? {
        winRateData,
        profitByAsset,
        profitByWeekday,
        tradeDurationProfit,
        strategyComparison,
        equityVolatility,
        drawdownData,
        equityVsBenchmark,
        expectancyData,
        summaryCards,
        meta: {
          metricMode: "DEMO_FALLBACK",
          estimatedMetrics: ["tradeDurationProfit", "expectancyData"],
          notes: ["This is demo fallback analytics data because live analytics is unavailable."],
        },
      }
    : null);

  const winRateSeries = analyticsData?.winRateData || [];
  const assetProfitSeries = analyticsData?.profitByAsset || [];
  const weekdayProfitSeries = analyticsData?.profitByWeekday || [];
  const durationProfitSeries = analyticsData?.tradeDurationProfit || [];
  const strategyComparisonSeries = analyticsData?.strategyComparison || [];
  const equityVolatilitySeries = analyticsData?.equityVolatility || [];
  const drawdownSeries = analyticsData?.drawdownData || [];
  const equityBenchmarkSeries = analyticsData?.equityVsBenchmark || [];
  const expectancySeries = analyticsData?.expectancyData || [];
  const firstExpectancy = expectancySeries[0]?.expectancy || 0;
  const lastExpectancy = expectancySeries[expectancySeries.length - 1]?.expectancy || 0;
  const summaryCardItems = (analyticsData?.summaryCards || []).map((card) => ({
    ...card,
    icon:
      {
        avgRiskTrade: Target,
        bestStrategy: Award,
        worstAsset: AlertTriangle,
        bestSession: Zap,
        equityVolatility: Activity,
        alphaVsBtc: TrendingUp,
      }[card.key] || TrendingUp,
    color:
      {
        avgRiskTrade: "#3B82F6",
        bestStrategy: "#16C784",
        worstAsset: "#EA3943",
        bestSession: "#8B5CF6",
        equityVolatility: "#F59E0B",
        alphaVsBtc: "#16C784",
      }[card.key] || "#3B82F6",
  }));
  const analyticsMeta = analyticsData?.meta || null;
  const estimatedMetrics = new Set(analyticsMeta?.estimatedMetrics || []);

  return (
    <div className="p-4 min-h-full" style={{ background: "#F8FAFC", fontFamily: "Inter, sans-serif", color: "#111827" }}>
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-base mb-0.5" style={{ fontWeight: 700, color: "#111827", letterSpacing: "-0.02em" }}>Trading Analytics</h1>
        <p className="text-xs" style={{ color: "#6B7280" }}>Deep performance analysis. Understand exactly why you win or lose.</p>
      </div>

      {isLoading && (
        <div className="mb-4 p-3 rounded-xl text-xs" style={{ background: "#FFFFFF", border: "1px solid #E5E7EB", color: "#6B7280" }}>
          Loading analytics...
        </div>
      )}

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
            ? "Live analytics is unavailable right now. Showing demo analytics because the profile fallback is enabled."
            : error}
        </div>
      )}

      {analyticsMeta && (
        <div className="mb-4 p-3 rounded-xl text-xs" style={{ background: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.16)", color: "#1D4ED8" }}>
          <div style={{ fontWeight: 700, marginBottom: 4 }}>
            {analyticsMeta.metricMode === "HYBRID" ? "Analytics mode: hybrid" : "Analytics mode: demo fallback"}
          </div>
          {(analyticsMeta.notes || []).map((note) => (
            <div key={note} style={{ color: "#475569" }}>{note}</div>
          ))}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
        {summaryCardItems.map(({ icon: Icon, label, value, desc, color }) => (
          <div key={label} className="p-3.5 rounded-xl" style={{ background: "#FFFFFF", border: "1px solid #E5E7EB" }}>
            <div className="w-7 h-7 rounded-lg flex items-center justify-center mb-2.5" style={{ background: `${color}14` }}>
              <Icon size={14} style={{ color }} />
            </div>
            <div className="text-xs mb-0.5" style={{ color: "#9CA3AF" }}>{label}</div>
            <div className="text-sm mb-0.5" style={{ fontWeight: 700, color: "#111827" }}>{value}</div>
            <div className="text-xs" style={{ color: "#6B7280" }}>{desc}</div>
          </div>
        ))}
      </div>

      {/* Row 1: Win Rate + Profit by Asset */}
      <div className="grid lg:grid-cols-2 gap-3 mb-3">
        <div className="rounded-xl p-4" style={{ background: "#FFFFFF", border: "1px solid #E5E7EB" }}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm" style={{ fontWeight: 600, color: "#111827" }}>Win Rate Over Time</h3>
            <div className="flex items-center gap-1 text-xs" style={{ color: "#16C784", fontWeight: 500 }}>
              <TrendingUp size={11} /> Improving +27%
            </div>
          </div>
          <div style={{ height: 180 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={winRateSeries} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                <XAxis dataKey="week" tick={{ fill: "#9CA3AF", fontSize: 9 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#9CA3AF", fontSize: 9 }} axisLine={false} tickLine={false} domain={[40, 90]} tickFormatter={(v) => `${v}%`} />
                <Tooltip formatter={(v) => [`${v}%`, "Win Rate"]} contentStyle={lightTooltip} />
                <ReferenceLine y={65} stroke="#E5E7EB" strokeDasharray="4 4" strokeWidth={1.5} label={{ value: "Target 65%", position: "right", fill: "#9CA3AF", fontSize: 9 }} />
                <Line type="monotone" dataKey="rate" stroke="#3B82F6" strokeWidth={2.5} dot={{ fill: "#3B82F6", r: 3 }} activeDot={{ r: 5, fill: "#3B82F6", stroke: "#FFFFFF", strokeWidth: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl p-4" style={{ background: "#FFFFFF", border: "1px solid #E5E7EB" }}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm" style={{ fontWeight: 600, color: "#111827" }}>Profit by Asset</h3>
            <div className="text-xs" style={{ color: "#9CA3AF" }}>All time</div>
          </div>
          <div style={{ height: 180 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={assetProfitSeries} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                <XAxis dataKey="asset" tick={{ fill: "#9CA3AF", fontSize: 9 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#9CA3AF", fontSize: 9 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
                <Tooltip formatter={(v) => [`$${v}`, "Profit"]} contentStyle={lightTooltip} />
                <Bar dataKey="profit" radius={[4,4,0,0]} isAnimationActive={false}>
                  {assetProfitSeries.map((entry, index) => (
                    <Cell key={`asset-cell-${index}`} fill={entry.profit >= 0 ? "#16C784" : "#EA3943"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 2: Profit by Weekday + Trade Duration vs Profit */}
      <div className="grid lg:grid-cols-2 gap-3 mb-3">
        <div className="rounded-xl p-4" style={{ background: "#FFFFFF", border: "1px solid #E5E7EB" }}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm" style={{ fontWeight: 600, color: "#111827" }}>Profit by Weekday</h3>
            <div className="text-xs px-2 py-0.5 rounded" style={{ background: "rgba(22,199,132,0.08)", color: "#16C784", fontWeight: 600, border: "1px solid rgba(22,199,132,0.15)" }}>Best: Thu</div>
          </div>
          <div style={{ height: 170 }}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={weekdayProfitSeries} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                <XAxis dataKey="day" tick={{ fill: "#9CA3AF", fontSize: 9 }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="profit" tick={{ fill: "#9CA3AF", fontSize: 9 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                <YAxis yAxisId="trades" orientation="right" tick={{ fill: "#9CA3AF", fontSize: 9 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={lightTooltip} formatter={(v, name) => [name === "trades" ? `${v} trades` : `$${v}`, name === "trades" ? "Trades" : "Profit"]} />
                <Bar yAxisId="profit" dataKey="profit" radius={[4,4,0,0]} isAnimationActive={false}>
                  {weekdayProfitSeries.map((entry, index) => (
                    <Cell key={`wd-cell-${index}`} fill={entry.profit >= 0 ? "#3B82F6" : "#EA3943"} fillOpacity={0.8} />
                  ))}
                </Bar>
                <Line yAxisId="trades" type="monotone" dataKey="trades" stroke="#F59E0B" strokeWidth={1.5} dot={{ fill: "#F59E0B", r: 3 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center gap-4 mt-1 text-xs" style={{ color: "#6B7280" }}>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm inline-block" style={{ background: "#3B82F6" }} /> Profit</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm inline-block" style={{ background: "#F59E0B" }} /> Trade count</span>
          </div>
        </div>

        <div className="rounded-xl p-4" style={{ background: "#FFFFFF", border: "1px solid #E5E7EB" }}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm" style={{ fontWeight: 600, color: "#111827" }}>Trade Duration vs Profit</h3>
            <div className="flex items-center gap-2">
              <div className="text-xs" style={{ color: "#9CA3AF" }}>Hours held</div>
              {estimatedMetrics.has("tradeDurationProfit") && (
                <span className="text-xs px-2 py-0.5 rounded" style={{ background: "rgba(245,158,11,0.08)", color: "#B45309", border: "1px solid rgba(245,158,11,0.18)", fontWeight: 600 }}>
                  Estimated
                </span>
              )}
            </div>
          </div>
          <div style={{ height: 170 }}>
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                <XAxis dataKey="duration" name="Duration (h)" tick={{ fill: "#9CA3AF", fontSize: 9 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}h`} />
                <YAxis dataKey="profit" name="Profit" tick={{ fill: "#9CA3AF", fontSize: 9 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
                <ZAxis dataKey="rr" range={[40, 200]} />
                <Tooltip contentStyle={lightTooltip} formatter={(v, name) => [name === "duration" ? `${v}h` : `$${v}`, name === "duration" ? "Duration" : "Profit"]} />
                <ReferenceLine y={0} stroke="#E5E7EB" strokeWidth={1} />
                <Scatter data={durationProfitSeries} fill="#3B82F6" isAnimationActive={false}>
                  {durationProfitSeries.map((entry, index) => (
                    <Cell key={`dur-cell-${index}`} fill={entry.profit >= 0 ? "#3B82F6" : "#EA3943"} fillOpacity={0.7} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 3: Strategy Performance Comparison */}
      <div className="rounded-xl p-4 mb-3" style={{ background: "#FFFFFF", border: "1px solid #E5E7EB" }}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm" style={{ fontWeight: 600, color: "#111827" }}>Strategy Performance Comparison</h3>
          <div className="flex items-center gap-4 text-xs" style={{ color: "#6B7280" }}>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm inline-block" style={{ background: "#16C784" }} /> Win Rate</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm inline-block" style={{ background: "#3B82F6" }} /> Profit Factor</span>
          </div>
        </div>
        <div style={{ height: 170 }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={strategyComparisonSeries} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: "#9CA3AF", fontSize: 9 }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="wr" tick={{ fill: "#9CA3AF", fontSize: 9 }} axisLine={false} tickLine={false} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
              <YAxis yAxisId="pf" orientation="right" tick={{ fill: "#9CA3AF", fontSize: 9 }} axisLine={false} tickLine={false} domain={[0, 3]} />
              <Tooltip contentStyle={lightTooltip} />
              <Bar yAxisId="wr" dataKey="winRate" name="Win Rate %" fill="#16C784" fillOpacity={0.7} radius={[3,3,0,0]} />
              <Line yAxisId="pf" type="monotone" dataKey="profitFactor" name="Profit Factor" stroke="#3B82F6" strokeWidth={2} dot={{ fill: "#3B82F6", r: 4, stroke: "#fff", strokeWidth: 2 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Row 4: Equity Volatility + Drawdown */}
      <div className="grid lg:grid-cols-2 gap-3 mb-3">
        <div className="rounded-xl p-4" style={{ background: "#FFFFFF", border: "1px solid #E5E7EB" }}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm" style={{ fontWeight: 600, color: "#111827" }}>Equity Volatility</h3>
            <div className="text-xs" style={{ color: "#9CA3AF" }}>Portfolio value + monthly vol %</div>
          </div>
          <div style={{ height: 180 }}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={equityVolatilitySeries} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                <XAxis dataKey="date" tick={{ fill: "#9CA3AF", fontSize: 9 }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="eq" tick={{ fill: "#9CA3AF", fontSize: 9 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                <YAxis yAxisId="vol" orientation="right" tick={{ fill: "#9CA3AF", fontSize: 9 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
                <Tooltip contentStyle={lightTooltip} />
                <Area yAxisId="eq" type="monotone" dataKey="equity" name="Equity" stroke="#3B82F6" strokeWidth={2} fill="#3B82F6" fillOpacity={0.08} dot={false} />
                <Line yAxisId="vol" type="monotone" dataKey="vol" name="Volatility %" stroke="#F59E0B" strokeWidth={1.5} strokeDasharray="4 3" dot={{ fill: "#F59E0B", r: 2 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl p-4" style={{ background: "#FFFFFF", border: "1px solid #E5E7EB" }}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm" style={{ fontWeight: 600, color: "#111827" }}>Drawdown Curve</h3>
            <div className="text-xs px-2 py-0.5 rounded" style={{ background: "rgba(234,57,67,0.08)", color: "#EA3943", fontWeight: 600, border: "1px solid rgba(234,57,67,0.15)" }}>Max -12.4%</div>
          </div>
          <div style={{ height: 180 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={drawdownSeries} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                <XAxis dataKey="date" tick={{ fill: "#9CA3AF", fontSize: 9 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#9CA3AF", fontSize: 9 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} domain={[-15, 1]} />
                <Tooltip formatter={(v) => [`${v}%`, "Drawdown"]} contentStyle={lightTooltip} />
                <ReferenceLine y={0} stroke="#E5E7EB" strokeWidth={1} />
                <Area type="monotone" dataKey="dd" stroke="#EA3943" strokeWidth={2} fill="#EA3943" fillOpacity={0.1} dot={false} activeDot={{ r: 4, fill: "#EA3943", stroke: "#FFFFFF", strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 5: Equity vs Benchmark */}
      <div className="rounded-xl p-4 mb-3" style={{ background: "#FFFFFF", border: "1px solid #E5E7EB" }}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm" style={{ fontWeight: 600, color: "#111827" }}>Equity vs Benchmark (BTC)</h3>
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5" style={{ color: "#6B7280" }}><span className="inline-block w-3 h-0.5" style={{ background: "#3B82F6" }} />Portfolio</span>
            <span className="flex items-center gap-1.5" style={{ color: "#6B7280" }}><span className="inline-block w-3 h-0.5" style={{ background: "#F59E0B" }} />BTC</span>
            <span className="px-2 py-0.5 rounded text-xs" style={{ background: "rgba(22,199,132,0.08)", color: "#16C784", fontWeight: 600, border: "1px solid rgba(22,199,132,0.15)" }}>+138% vs BTC +59%</span>
          </div>
        </div>
        <div style={{ height: 200 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={equityBenchmarkSeries} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis dataKey="month" tick={{ fill: "#9CA3AF", fontSize: 9 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#9CA3AF", fontSize: 9 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={(v) => [`$${Number(v).toLocaleString()}`, ""]} contentStyle={lightTooltip} />
              <Area type="monotone" dataKey="benchmark" name="BTC" stroke="#F59E0B" strokeWidth={1.5} strokeDasharray="5 3" fill="#F59E0B" fillOpacity={0.06} dot={false} />
              <Area type="monotone" dataKey="equity" name="Portfolio" stroke="#3B82F6" strokeWidth={2} fill="#3B82F6" fillOpacity={0.08} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Row 6: Expectancy Over Time */}
      <div className="rounded-xl p-4" style={{ background: "#FFFFFF", border: "1px solid #E5E7EB" }}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm" style={{ fontWeight: 600, color: "#111827" }}>Expectancy Over Time</h3>
            <p className="text-xs" style={{ color: "#9CA3AF" }}>= (Win Rate × Avg Win) − (Loss Rate × Avg Loss) — per session</p>
          </div>
          <div className="flex items-center gap-2">
            {estimatedMetrics.has("expectancyData") && (
              <div className="text-xs px-2 py-0.5 rounded" style={{ background: "rgba(245,158,11,0.08)", color: "#B45309", fontWeight: 600, border: "1px solid rgba(245,158,11,0.18)" }}>
                Estimated
              </div>
            )}
            <div className="text-xs px-2 py-0.5 rounded" style={{ background: "rgba(34,197,94,0.08)", color: "#16A34A", fontWeight: 600, border: "1px solid rgba(34,197,94,0.15)" }}>
              Current: +${lastExpectancy}
            </div>
            <div className="text-xs px-2 py-0.5 rounded" style={{ background: "rgba(59,130,246,0.08)", color: "#2563EB", fontWeight: 600, border: "1px solid rgba(59,130,246,0.15)" }}>
              +{Math.round(((lastExpectancy - firstExpectancy) / Math.abs(firstExpectancy || 1)) * 100)}% improvement
            </div>
          </div>
        </div>
        <div style={{ height: 190 }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={expectancySeries} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
              <XAxis dataKey="session" tick={{ fill: "#9CA3AF", fontSize: 9 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#9CA3AF", fontSize: 9 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
              <Tooltip contentStyle={lightTooltip} formatter={(v, name) => [`$${v}`, name === "expectancy" ? "Expectancy" : name === "avgWin" ? "Avg Win" : "Avg Loss"]} />
              <ReferenceLine y={0} stroke="#E5E7EB" strokeWidth={1.5} />
              {/* Shaded area: positive = green, negative = red */}
              <Area type="monotone" dataKey="expectancy" name="expectancy" stroke="#3B82F6" strokeWidth={2} fill="#3B82F6" fillOpacity={0.08} dot={{ r: 3, fill: "#3B82F6", stroke: "#fff", strokeWidth: 2 }} activeDot={{ r: 5 }} />
              <Line type="monotone" dataKey="avgWin" name="avgWin" stroke="#22C55E" strokeWidth={1} strokeDasharray="4 3" dot={false} />
              <Line type="monotone" dataKey="avgLoss" name="avgLoss" stroke="#EF4444" strokeWidth={1} strokeDasharray="4 3" dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <div className="flex items-center gap-5 mt-2 text-xs" style={{ color: "#6B7280" }}>
          <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-0.5" style={{ background: "#3B82F6" }} />Expectancy</span>
          <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-0.5 border-dashed border-b" style={{ background: "#22C55E" }} />Avg Win</span>
          <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-0.5" style={{ background: "#EF4444" }} />Avg Loss</span>
          <span className="ml-auto text-xs" style={{ color: "#9CA3AF" }}>Positive expectancy = long-term edge</span>
        </div>
      </div>
    </div>
  );
}
