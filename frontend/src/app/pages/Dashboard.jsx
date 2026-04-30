import { useEffect, useState } from "react";
import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Target,
  DollarSign,
  Award,
  AlertTriangle,
  Clock,
  Zap,
} from "lucide-react";
import { useAppSession } from "../context/AppSession";
import { appApi } from "../lib/api";

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const statCardIcons = {
  "Portfolio Value": DollarSign,
  "Net Profit": TrendingUp,
  "Win Rate": Target,
  "Profit Factor": Activity,
  "Max Drawdown": AlertTriangle,
  "Sharpe Ratio": Award,
};

function getHeatmapColor(val) {
  if (val === 0) return { bg: "#F9FAFB", text: "#D1D5DB" };
  if (val > 15) return { bg: "rgba(22,199,132,0.22)", text: "#059669" };
  if (val > 8) return { bg: "rgba(22,199,132,0.14)", text: "#10B981" };
  if (val > 0) return { bg: "rgba(22,199,132,0.07)", text: "#34D399" };
  if (val > -5) return { bg: "rgba(234,57,67,0.07)", text: "#F87171" };
  return { bg: "rgba(234,57,67,0.18)", text: "#EA3943" };
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div
        className="px-3 py-2.5 rounded-lg"
        style={{ background: "#1F2937", border: "1px solid #374151", fontSize: 11 }}
      >
        <div className="text-xs mb-1.5" style={{ color: "#9CA3AF" }}>
          {label}
        </div>
        {payload
          .filter((p) => p.value != null && p.value !== 0)
          .map((p) => (
            <div key={p.name} className="flex items-center justify-between gap-4">
              <span style={{ color: p.color, fontWeight: 500 }}>{p.name}</span>
              <span style={{ color: "#F8FAFC", fontWeight: 600 }}>
                {p.name === "Drawdown"
                  ? `${p.value.toFixed(1)}%`
                  : `$${Number(p.value).toLocaleString()}`}
              </span>
            </div>
          ))}
      </div>
    );
  }
  return null;
};

const emptySessionSummary = {
  badge: "No Session",
  badgeTone: "neutral",
  metrics: [
    { label: "Trades", value: "0", color: "#3B82F6" },
    { label: "Win Rate", value: "0.0%", color: "#22C55E" },
    { label: "Session P&L", value: "+$0", color: "#22C55E" },
    { label: "Mistakes", value: "0", color: "#F59E0B" },
    { label: "Main Issue", value: "No closed trades", color: "#EF4444" },
  ],
  score: 55,
};

const fallbackChartConfig = {
  selectedWindow: "15M",
  availableWindows: [
    { key: "6M", label: "6M" },
    { key: "12M", label: "12M" },
    { key: "15M", label: "15M" },
    { key: "24M", label: "24M" },
    { key: "MAX", label: "Max" },
  ],
  drawdownDomain: [-15, 5],
  referenceMarkers: [],
  series: {
    portfolio: { label: "Portfolio", color: "#3B82F6", fill: "#3B82F6", fillOpacity: 0.08 },
    benchmark: { label: "BTC Benchmark", color: "#F59E0B", strokeDasharray: "5 3" },
    drawdown: { label: "Drawdown", color: "#EF4444", fill: "#EF4444", fillOpacity: 0.1 },
  },
};

const demoDashboardData = {
  greeting: {
    name: "Demo Trader",
  },
  rangeLabel: "Jan 2025 – Mar 2026",
  selectedWindow: "15M",
  chartConfig: {
    ...fallbackChartConfig,
    referenceMarkers: [
      { key: "jan-2026", label: "Jan'26" },
    ],
  },
  statCards: [
    { label: "Portfolio Value", value: "$24,758", change: "+$1,258", pct: "+5.4%", up: true, color: "#3B82F6" },
    { label: "Net Profit", value: "+$3,824", change: "+$562", pct: "realized + unrealized", up: true, color: "#10B981" },
    { label: "Win Rate", value: "68.4%", change: "13/19", pct: "profitable trades", up: true, color: "#8B5CF6" },
    { label: "Profit Factor", value: "2.18", change: "+0.42", pct: "vs prior window", up: true, color: "#F59E0B" },
    { label: "Max Drawdown", value: "-6.7%", change: "15 data points", pct: "equity curve", up: true, color: "#EF4444" },
    { label: "Sharpe Ratio", value: "1.82", change: "+0.26", pct: "approx. risk-adjusted return", up: true, color: "#22C55E" },
  ],
  portfolioData: [
    { date: "Jan'25", value: 22000, benchmark: 22000, drawdown: 0 },
    { date: "Feb", value: 21800, benchmark: 20500, drawdown: -1.0 },
    { date: "Mar", value: 22450, benchmark: 20250, drawdown: 0 },
    { date: "Apr", value: 22840, benchmark: 21700, drawdown: 0 },
    { date: "May", value: 23110, benchmark: 22900, drawdown: 0 },
    { date: "Jun", value: 23720, benchmark: 24050, drawdown: 0 },
    { date: "Jul", value: 23640, benchmark: 25500, drawdown: -0.4 },
    { date: "Aug", value: 24090, benchmark: 24820, drawdown: 0 },
    { date: "Sep", value: 23980, benchmark: 25450, drawdown: -0.5 },
    { date: "Oct", value: 24320, benchmark: 24800, drawdown: 0 },
    { date: "Nov", value: 24650, benchmark: 22600, drawdown: 0 },
    { date: "Dec", value: 24720, benchmark: 22050, drawdown: 0 },
    { date: "Jan'26", value: 24710, benchmark: 20680, drawdown: 0 },
    { date: "Feb", value: 24490, benchmark: 18150, drawdown: -1.0 },
    { date: "Mar", value: 23530, benchmark: 18840, drawdown: -6.7 },
  ],
  monthlyReturns: {
    2025: [4.2, -2.1, 6.4, 3.1, 1.7, 4.9, -0.6, 2.4, -1.9, 3.2, 2.7, 1.4],
    2026: [1.8, -1.4, 5.4, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  },
  recentTrades: [
    { asset: "BTC/USDT", side: "Long", entry: "$67,100", exit: "$68,540", profit: "+$820", profitable: true, strategy: "Breakout" },
    { asset: "ETH/USDT", side: "Long", entry: "$3,180", exit: "$3,420", profit: "+$540", profitable: true, strategy: "Trend Follow" },
    { asset: "SOL/USDT", side: "Short", entry: "$146", exit: "$139", profit: "+$280", profitable: true, strategy: "RSI Reversal" },
    { asset: "BNB/USDT", side: "Long", entry: "$602", exit: "$589", profit: "-$190", profitable: false, strategy: "MA Cross" },
  ],
  sessionSummary: {
    badge: "Demo",
    badgeTone: "info",
    metrics: [
      { label: "Trades", value: "4", color: "#3B82F6" },
      { label: "Win Rate", value: "75.0%", color: "#22C55E" },
      { label: "Session P&L", value: "+$466", color: "#22C55E" },
      { label: "Mistakes", value: "1", color: "#F59E0B" },
      { label: "Main Issue", value: "Late entry", color: "#EF4444" },
    ],
    score: 84,
  },
};

function getBadgeStyle(tone) {
  if (tone === "success") {
    return { background: "rgba(34,197,94,0.1)", color: "#16A34A" };
  }

  if (tone === "info") {
    return { background: "rgba(59,130,246,0.1)", color: "#2563EB" };
  }

  if (tone === "warn") {
    return { background: "rgba(245,158,11,0.12)", color: "#D97706" };
  }

  return { background: "rgba(107,114,128,0.12)", color: "#6B7280" };
}

export function Dashboard() {
  const { accessToken, user } = useAppSession();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedWindow, setSelectedWindow] = useState("15M");

  useEffect(() => {
    let ignore = false;

    async function loadDashboard() {
      if (!accessToken) {
        if (!ignore) {
          setLoading(false);
        }
        return;
      }

      if (!ignore) {
        setLoading(true);
        setError("");
      }

      try {
        const response = await appApi.getDashboardSummary(accessToken, {
          window: selectedWindow,
        });
        if (!ignore) {
          setDashboardData(response);
          if (response?.selectedWindow) {
            setSelectedWindow(response.selectedWindow);
          }
          setLoading(false);
        }
      } catch (loadError) {
        if (!ignore) {
          setError(loadError.message || "Unable to load dashboard data.");
          setLoading(false);
        }
      }
    }

    loadDashboard();

    const refreshFromRealtime = () => {
      loadDashboard();
    };
    window.addEventListener("app:trading-event", refreshFromRealtime);
    window.addEventListener("app:portfolio-updated", refreshFromRealtime);

    return () => {
      ignore = true;
      window.removeEventListener("app:trading-event", refreshFromRealtime);
      window.removeEventListener("app:portfolio-updated", refreshFromRealtime);
    };
  }, [accessToken, selectedWindow]);

  const showDemoFallback =
    Boolean(user?.demoDataFallbackEnabled) && Boolean(error) && !dashboardData;
  const effectiveDashboardData = dashboardData || (showDemoFallback ? demoDashboardData : null);
  const portfolioSeries = effectiveDashboardData?.portfolioData || [];
  const monthlyReturnData = effectiveDashboardData?.monthlyReturns || {};
  const statCardData = effectiveDashboardData?.statCards || [];
  const tradeRows = effectiveDashboardData?.recentTrades || [];
  const sessionSummary = effectiveDashboardData?.sessionSummary || emptySessionSummary;
  const chartConfig = effectiveDashboardData?.chartConfig || fallbackChartConfig;
  const chartSeries = chartConfig.series || fallbackChartConfig.series;
  const welcomeName = effectiveDashboardData?.greeting?.name || user?.name || "Alex";
  const rangeLabel = effectiveDashboardData?.rangeLabel || "";
  const portfolioPerformance = statCardData.find((card) => card.label === "Portfolio Value");
  const badgeStyle = getBadgeStyle(sessionSummary.badgeTone);

  if (loading && !dashboardData) {
    return (
      <div className="p-4 min-h-full" style={{ background: "#F8FAFC", fontFamily: "Inter, sans-serif" }}>
        <div className="mb-4">
          <h1 className="text-base mb-0.5" style={{ fontWeight: 700, color: "#111827", letterSpacing: "-0.02em" }}>
            Dashboard
          </h1>
          <p className="text-xs" style={{ color: "#6B7280" }}>
            Loading your trading overview.
          </p>
        </div>
        <div className="grid grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="rounded-xl p-3 animate-pulse"
              style={{ background: "#FFFFFF", border: "1px solid #E5E7EB", minHeight: 106 }}
            />
          ))}
        </div>
        <div className="grid gap-3 mb-3" style={{ gridTemplateColumns: "1fr 220px" }}>
          <div className="rounded-xl p-4 animate-pulse" style={{ background: "#FFFFFF", border: "1px solid #E5E7EB", minHeight: 320 }} />
          <div className="rounded-xl p-4 animate-pulse" style={{ background: "#FFFFFF", border: "1px solid #E5E7EB", minHeight: 320 }} />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 min-h-full" style={{ background: "#F8FAFC", fontFamily: "Inter, sans-serif" }}>
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1
            className="text-base mb-0.5"
            style={{ fontWeight: 700, color: "#111827", letterSpacing: "-0.02em" }}
          >
            Dashboard
          </h1>
          <p className="text-xs" style={{ color: "#6B7280" }}>
            Welcome back, {welcomeName}. Here's your trading overview.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs" style={{ color: "#6B7280" }}>
          <div
            className="flex items-center gap-1 rounded-lg px-1 py-1"
            style={{ background: "#FFFFFF", border: "1px solid #E5E7EB" }}
          >
            {(chartConfig.availableWindows || []).map((option) => (
              <button
                key={option.key}
                type="button"
                onClick={() => setSelectedWindow(option.key)}
                className="px-2 py-1 rounded text-xs transition-colors"
                style={{
                  background: selectedWindow === option.key ? "rgba(59,130,246,0.1)" : "transparent",
                  color: selectedWindow === option.key ? "#2563EB" : "#6B7280",
                  fontWeight: 600,
                }}
              >
                {option.label}
              </button>
            ))}
          </div>
          <span
            className="px-2 py-1 rounded"
            style={{
              background: "rgba(59,130,246,0.08)",
              color: "#3B82F6",
              fontWeight: 500,
              border: "1px solid rgba(59,130,246,0.18)",
            }}
          >
            {rangeLabel}
          </span>
        </div>
      </div>

      {error ? (
        <div
          className="mb-3 rounded-xl px-3 py-2 text-xs"
          style={{
            background: showDemoFallback ? "rgba(59,130,246,0.08)" : "rgba(239,68,68,0.08)",
            border: showDemoFallback
              ? "1px solid rgba(59,130,246,0.16)"
              : "1px solid rgba(239,68,68,0.16)",
            color: showDemoFallback ? "#1D4ED8" : "#B91C1C",
          }}
        >
          {showDemoFallback
            ? "Live dashboard data is unavailable right now. Showing demo data because the profile fallback is enabled."
            : error}
        </div>
      ) : null}

      {/* Stat Cards */}
      <div className="grid grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
        {statCardData.map((card) => {
          const Icon = card.icon || statCardIcons[card.label] || Activity;

          return (
            <div
              key={card.label}
              className="rounded-xl p-3"
              style={{ background: "#FFFFFF", border: "1px solid #E5E7EB" }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs" style={{ color: "#9CA3AF", fontWeight: 500 }}>
                  {card.label}
                </span>
                <Icon size={13} style={{ color: card.color }} />
              </div>
              <div className="text-base mb-1" style={{ fontWeight: 700, color: "#111827" }}>
                {card.value}
              </div>
              <div className="flex items-center gap-1 text-xs">
                {card.up ? (
                  <TrendingUp size={10} style={{ color: "#22C55E" }} />
                ) : (
                  <TrendingDown size={10} style={{ color: "#EF4444" }} />
                )}
                <span style={{ color: card.up ? "#22C55E" : "#EF4444", fontWeight: 500 }}>
                  {card.change}
                </span>
                <span style={{ color: "#9CA3AF" }}>{card.pct}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Last Trading Session Widget + Chart */}
      <div className="grid gap-3 mb-3" style={{ gridTemplateColumns: "1fr 220px" }}>
        {/* Equity Chart */}
        <div
          className="rounded-xl p-4"
          style={{ background: "#FFFFFF", border: "1px solid #E5E7EB" }}
        >
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm mb-0.5" style={{ fontWeight: 600, color: "#111827" }}>
                Portfolio Equity Curve
              </h3>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1.5">
                  <span className="inline-block w-3 h-0.5" style={{ background: chartSeries.portfolio?.color }} />
                  <span style={{ color: "#6B7280" }}>{chartSeries.portfolio?.label || "Portfolio"}</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span
                    className="inline-block w-3 h-0.5"
                    style={{
                      background: chartSeries.benchmark?.color,
                      borderBottom: `2px dashed ${chartSeries.benchmark?.color}`,
                    }}
                  />
                  <span style={{ color: "#6B7280" }}>{chartSeries.benchmark?.label || "BTC Benchmark"}</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block w-3 h-0.5" style={{ background: chartSeries.drawdown?.color }} />
                  <span style={{ color: "#6B7280" }}>{chartSeries.drawdown?.label || "Drawdown"}</span>
                </span>
              </div>
            </div>
            <div
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs"
              style={{
                background: "rgba(34,197,94,0.08)",
                border: "1px solid rgba(34,197,94,0.18)",
              }}
            >
              <TrendingUp size={11} style={{ color: portfolioPerformance?.up ? "#22C55E" : "#EF4444" }} />
              <span style={{ color: portfolioPerformance?.up ? "#22C55E" : "#EF4444", fontWeight: 600 }}>
                {portfolioPerformance?.pct || "+0.0%"}
              </span>
            </div>
          </div>
          <div style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                id="dash-equity-chart"
                data={portfolioSeries}
                margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
              >
                <CartesianGrid key="grid" strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                <XAxis
                  key="x"
                  dataKey="date"
                  tick={{ fill: "#9CA3AF", fontSize: 9 }}
                  axisLine={false}
                  tickLine={false}
                  interval={2}
                />
                <YAxis
                  key="y-equity"
                  yAxisId="equity"
                  tick={{ fill: "#9CA3AF", fontSize: 9 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                  width={40}
                />
                <YAxis
                  key="y-dd"
                  yAxisId="dd"
                  orientation="right"
                  tick={{ fill: "#9CA3AF", fontSize: 9 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `${v}%`}
                  width={35}
                  domain={chartConfig.drawdownDomain || [-15, 5]}
                />
                <Tooltip key="tooltip" content={<CustomTooltip />} />
                {(chartConfig.referenceMarkers || []).map((marker) => (
                    <ReferenceLine
                      key={marker.key}
                      x={marker.label}
                      yAxisId="equity"
                      stroke="#E5E7EB"
                      strokeDasharray="4 4"
                      label={{ value: marker.label, position: "top", fill: "#D1D5DB", fontSize: 8 }}
                    />
                  ))}
                <Area
                  key="area-portfolio"
                  yAxisId="equity"
                  type="monotone"
                  dataKey="value"
                  name={chartSeries.portfolio?.label || "Portfolio"}
                  stroke={chartSeries.portfolio?.color || "#3B82F6"}
                  strokeWidth={2}
                  fill={chartSeries.portfolio?.fill || "#3B82F6"}
                  fillOpacity={chartSeries.portfolio?.fillOpacity ?? 0.08}
                  dot={false}
                  activeDot={{ r: 4, fill: chartSeries.portfolio?.color || "#3B82F6", stroke: "#FFFFFF", strokeWidth: 2 }}
                />
                <Line
                  key="line-benchmark"
                  yAxisId="equity"
                  type="monotone"
                  dataKey="benchmark"
                  name={chartSeries.benchmark?.label || "BTC Benchmark"}
                  stroke={chartSeries.benchmark?.color || "#F59E0B"}
                  strokeWidth={1.5}
                  strokeDasharray={chartSeries.benchmark?.strokeDasharray || "5 3"}
                  dot={false}
                />
                <Area
                  key="area-drawdown"
                  yAxisId="dd"
                  type="monotone"
                  dataKey="drawdown"
                  name={chartSeries.drawdown?.label || "Drawdown"}
                  stroke={chartSeries.drawdown?.color || "#EF4444"}
                  strokeWidth={1.5}
                  fill={chartSeries.drawdown?.fill || "#EF4444"}
                  fillOpacity={chartSeries.drawdown?.fillOpacity ?? 0.1}
                  dot={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Last Trading Session Widget */}
        <div className="rounded-xl p-4 flex flex-col" style={{ background: "#FFFFFF", border: "1px solid #E5E7EB" }}>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: "rgba(139,92,246,0.12)" }}>
              <Clock size={12} style={{ color: "#8B5CF6" }} />
            </div>
            <h3 className="text-xs" style={{ fontWeight: 700, color: "#111827" }}>Last Session</h3>
            <span className="text-xs ml-auto px-1.5 py-0.5 rounded" style={{ ...badgeStyle, fontWeight: 600 }}>
              {sessionSummary.badge}
            </span>
          </div>

          <div className="space-y-2.5 flex-1">
            {sessionSummary.metrics.map(({ label, value, color }) => {
              const iconMap = {
                Trades: Zap,
                "Win Rate": Target,
                "Session P&L": TrendingUp,
                Mistakes: AlertTriangle,
                "Main Issue": Activity,
              };
              const Icon = iconMap[label] || Activity;

              return (
              <div key={label} className="flex items-center justify-between py-2" style={{ borderBottom: "1px solid #F3F4F6" }}>
                <div className="flex items-center gap-2">
                  <Icon size={11} style={{ color }} />
                  <span className="text-xs" style={{ color: "#9CA3AF" }}>{label}</span>
                </div>
                <span className="text-xs" style={{ fontWeight: 700, color: label === "Mistakes" ? "#F59E0B" : label === "Main Issue" ? "#EF4444" : "#111827" }}>
                  {value}
                </span>
              </div>
              );
            })}
          </div>

          <div className="mt-3 pt-3" style={{ borderTop: "1px solid #F3F4F6" }}>
            <div className="text-xs mb-1.5 flex justify-between" style={{ color: "#9CA3AF" }}>
              <span>Session Score</span>
              <span style={{ color: "#F59E0B", fontWeight: 700 }}>{sessionSummary.score}/100</span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "#F3F4F6" }}>
              <div className="h-full rounded-full" style={{ width: `${sessionSummary.score}%`, background: "linear-gradient(90deg, #F59E0B, #EF4444)" }} />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row: Heatmap + Recent Trades */}
      <div className="grid gap-3" style={{ gridTemplateColumns: "1fr 1fr" }}>
        {/* Monthly Returns Heatmap */}
        <div
          className="rounded-xl p-4"
          style={{ background: "#FFFFFF", border: "1px solid #E5E7EB" }}
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm" style={{ fontWeight: 600, color: "#111827" }}>
              Monthly Returns Heatmap
            </h3>
            <div className="flex items-center gap-2 text-xs" style={{ color: "#6B7280" }}>
              <span
                className="inline-block w-2.5 h-2.5 rounded-sm"
                style={{ background: "rgba(22,199,132,0.22)" }}
              />
              <span>Profit</span>
              <span
                className="inline-block w-2.5 h-2.5 rounded-sm"
                style={{ background: "rgba(234,57,67,0.18)" }}
              />
              <span>Loss</span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <div className="min-w-max">
              <div className="grid mb-1" style={{ gridTemplateColumns: "40px repeat(12, 1fr)" }}>
                <div />
                {months.map((m) => (
                  <div
                    key={m}
                    className="text-center text-xs"
                    style={{ color: "#9CA3AF", fontWeight: 500 }}
                  >
                    {m}
                  </div>
                ))}
              </div>
              {Object.entries(monthlyReturnData).map(([year, vals]) => (
                <div
                  key={year}
                  className="grid mb-1.5"
                  style={{ gridTemplateColumns: "40px repeat(12, 1fr)", gap: "3px" }}
                >
                  <div
                    className="text-xs flex items-center"
                    style={{ color: "#6B7280", fontWeight: 500 }}
                  >
                    {year}
                  </div>
                  {vals.map((val, i) => {
                    const { bg, text } = getHeatmapColor(val);
                    return (
                      <div
                        key={i}
                        className="rounded text-center py-1.5"
                        style={{ background: bg }}
                        title={`${months[i]} ${year}: ${val !== 0 ? `${val > 0 ? "+" : ""}${val}%` : "—"}`}
                      >
                        <span style={{ color: text, fontSize: 9, fontWeight: 600 }}>
                          {val !== 0 ? `${val > 0 ? "+" : ""}${val}%` : "—"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Trades */}
        <div
          className="rounded-xl overflow-hidden"
          style={{ background: "#FFFFFF", border: "1px solid #E5E7EB" }}
        >
          <div
            className="flex items-center justify-between px-4 py-3"
            style={{ borderBottom: "1px solid #E5E7EB" }}
          >
            <h3 className="text-sm" style={{ fontWeight: 600, color: "#111827" }}>
              Recent Trades
            </h3>
            <button
              className="text-xs px-2.5 py-1 rounded-lg transition-colors hover:bg-blue-50"
              style={{
                color: "#3B82F6",
                fontWeight: 500,
                border: "1px solid rgba(59,130,246,0.2)",
              }}
            >
              View All
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: "1px solid #F3F4F6" }}>
                  {["Asset", "Side", "Entry", "Exit", "P&L", "Strategy"].map((col) => (
                    <th
                      key={col}
                      className="text-left px-4 py-2.5 text-xs"
                      style={{ color: "#9CA3AF", fontWeight: 500 }}
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tradeRows.map((trade, i) => (
                  <tr
                    key={i}
                    className="transition-colors hover:bg-gray-50"
                    style={{
                      borderBottom: i < tradeRows.length - 1 ? "1px solid #F9FAFB" : "none",
                    }}
                  >
                    <td
                      className="px-4 py-2.5 text-xs"
                      style={{ fontWeight: 600, color: "#111827" }}
                    >
                      {trade.asset}
                    </td>
                    <td className="px-4 py-2.5">
                      <span
                        className="text-xs px-1.5 py-0.5 rounded"
                        style={{
                          background:
                            trade.side === "Long"
                              ? "rgba(22,199,132,0.1)"
                              : "rgba(234,57,67,0.1)",
                          color: trade.side === "Long" ? "#16C784" : "#EA3943",
                          fontWeight: 600,
                        }}
                      >
                        {trade.side}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-xs" style={{ color: "#9CA3AF" }}>
                      {trade.entry}
                    </td>
                    <td className="px-4 py-2.5 text-xs" style={{ color: "#9CA3AF" }}>
                      {trade.exit}
                    </td>
                    <td
                      className="px-4 py-2.5 text-xs"
                      style={{
                        fontWeight: 600,
                        color: trade.profitable ? "#16C784" : "#EA3943",
                      }}
                    >
                      {trade.profit}
                    </td>
                    <td className="px-4 py-2.5">
                      <span
                        className="text-xs px-1.5 py-0.5 rounded"
                        style={{ background: "#F3F4F6", color: "#6B7280", fontWeight: 500 }}
                      >
                        {trade.strategy}
                      </span>
                    </td>
                  </tr>
                ))}
                {!tradeRows.length ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-6 text-center text-xs"
                      style={{ color: "#9CA3AF" }}
                    >
                      No trades yet for this account.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
