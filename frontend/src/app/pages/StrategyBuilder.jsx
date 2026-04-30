import { useEffect, useRef, useState } from "react";
import { Plus, Trash2, Play, TrendingUp, TrendingDown, AlertCircle, ArrowDown, Cpu, RefreshCw, GitBranch, Layers } from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, CartesianGrid, LineChart, Line, ReferenceLine, ComposedChart,
} from "recharts";
import { useAppSession } from "../context/AppSession";
import { appApi } from "../lib/api";

const indicators = ["RSI","MACD","EMA(20)","EMA(50)","MA(200)","Bollinger Bands","Volume","ATR","Stochastic","Price"];
const operators = ["<",">","=","crosses above","crosses below","is above","is below"];

const equityCurve = [
  { t: "Jan", v: 10000 }, { t: "Feb", v: 11200 }, { t: "Mar", v: 10500 },
  { t: "Apr", v: 13000 }, { t: "May", v: 14800 }, { t: "Jun", v: 13500 },
  { t: "Jul", v: 16200 }, { t: "Aug", v: 18400 }, { t: "Sep", v: 17100 },
  { t: "Oct", v: 20000 }, { t: "Nov", v: 21500 }, { t: "Dec", v: 23800 },
];

// Monte Carlo simulation: 5 scenario paths
function generateMonteCarloPath(seed, winRate, avgWin, avgLoss, trades = 12) {
  let equity = 10000;
  const path = [{ t: "Start", v: equity }];
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  let rng = seed;
  for (let i = 0; i < trades; i++) {
    rng = (rng * 1664525 + 1013904223) & 0xffffffff;
    const win = (Math.abs(rng) % 100) / 100 < winRate;
    const change = win ? avgWin * (0.7 + (Math.abs(rng) % 60) / 100) : -avgLoss * (0.7 + (Math.abs(rng) % 60) / 100);
    equity += change;
    equity = Math.max(equity, 3000);
    path.push({ t: months[i], v: Math.round(equity) });
  }
  return path;
}

const monteCarloData = (() => {
  const seeds = [12345, 98765, 54321, 11111, 77777];
  const paths = seeds.map((s) => generateMonteCarloPath(s, 0.63, 420, 200));
  return paths[0].map((_, i) => {
    const obj = { t: paths[0][i].t };
    paths.forEach((p, j) => { obj[`s${j}`] = p[i]?.v; });
    const vals = paths.map((p) => p[i]?.v).filter(Boolean);
    obj.worst = Math.min(...vals);
    obj.best = Math.max(...vals);
    obj.median = vals.sort((a,b) => a-b)[Math.floor(vals.length/2)];
    return obj;
  });
})();

const monthlyReturns = [
  { m: "Jan", r: 12 }, { m: "Feb", r: -5 }, { m: "Mar", r: 24 },
  { m: "Apr", r: 14 }, { m: "May", r: -8 }, { m: "Jun", r: 20 },
  { m: "Jul", r: 16 }, { m: "Aug", r: -3 }, { m: "Sep", r: 18 },
  { m: "Oct", r: 11 }, { m: "Nov", r: 23 }, { m: "Dec", r: -6 },
];

const tradeDurationData = [
  { dur: "<1h", count: 8 }, { dur: "1-4h", count: 24 },
  { dur: "4-12h", count: 38 }, { dur: "12-24h", count: 30 },
  { dur: "1-3d", count: 22 }, { dur: ">3d", count: 10 },
];

const drawdownTimeline = [
  { t: "Jan", dd: 0 }, { t: "Feb", dd: -4.2 }, { t: "Mar", dd: -1.8 },
  { t: "Apr", dd: -9.1 }, { t: "May", dd: -12.4 }, { t: "Jun", dd: -6.2 },
  { t: "Jul", dd: -3.1 }, { t: "Aug", dd: -4.8 }, { t: "Sep", dd: -2.2 },
  { t: "Oct", dd: -7.4 }, { t: "Nov", dd: -3.8 }, { t: "Dec", dd: -1.4 },
];

const backtestMetrics = [
  { label: "Win Rate", value: "63.4%", color: "#16C784", up: true },
  { label: "Profit Factor", value: "2.08", color: "#3B82F6", up: true },
  { label: "Max Drawdown", value: "-12.4%", color: "#EA3943", up: false },
  { label: "Total Trades", value: "148", color: "#8B5CF6", up: true },
  { label: "Avg. Win", value: "+$420", color: "#16C784", up: true },
  { label: "Avg. Loss", value: "-$202", color: "#EA3943", up: false },
  { label: "Sharpe Ratio", value: "1.84", color: "#3B82F6", up: true },
  { label: "Net Profit", value: "+138%", color: "#16C784", up: true },
];

const tooltipStyle = { background: "#1F2937", border: "1px solid #374151", borderRadius: 8, fontSize: 11, color: "#F8FAFC" };
const lightTooltip = { background: "#fff", border: "1px solid #E5E7EB", borderRadius: 8, fontSize: 11, color: "#111827" };

// Enhanced Strategy Flow Visualization with AND/OR/nested logic grouping
function StrategyFlowViz({ conditions, actions }) {
  const groups = [];
  let currentGroup = [];
  conditions.forEach((cond, i) => {
    if (i === 0) { currentGroup = [cond]; }
    else if (cond.connector === "OR" && currentGroup.length > 0) {
      groups.push({ items: currentGroup });
      currentGroup = [cond];
    } else {
      currentGroup.push(cond);
    }
  });
  if (currentGroup.length) groups.push({ items: currentGroup });

  return (
    <div className="p-4 rounded-xl mb-5" style={{ background: "#FFFFFF", border: "1px solid #E5E7EB" }}>
      <div className="flex items-center gap-2 mb-4">
        <GitBranch size={11} style={{ color: "#6B7280" }} />
        <h3 className="text-xs" style={{ fontWeight: 600, color: "#6B7280", letterSpacing: "0.05em" }}>STRATEGY FLOW DIAGRAM</h3>
      </div>
      <div className="flex flex-col items-center">
        <div className="w-full max-w-xs px-4 py-2.5 rounded-xl text-center" style={{ background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.25)", color: "#2563EB", fontWeight: 700, fontSize: "0.78rem" }}>
          ENTRY CONDITIONS
        </div>
        <div className="flex flex-col items-center">
          <div style={{ width: 2, height: 10, background: "#E5E7EB" }} />
          <ArrowDown size={12} style={{ color: "#D1D5DB" }} />
        </div>

        {groups.map((group, gi) => (
          <div key={gi} className="w-full flex flex-col items-center">
            {gi > 0 && (
              <div className="flex items-center gap-2 my-1 w-full">
                <div style={{ flex: 1, height: 1, background: "#E5E7EB" }} />
                <div className="px-2 py-0.5 rounded text-xs" style={{ background: "rgba(245,158,11,0.1)", color: "#D97706", border: "1px solid rgba(245,158,11,0.25)", fontWeight: 700 }}>OR</div>
                <div style={{ flex: 1, height: 1, background: "#E5E7EB" }} />
              </div>
            )}
            <div className="w-full space-y-1">
              {group.items.map((cond, ci) => (
                <div key={cond.id} className="flex flex-col items-center">
                  <div className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs" style={{ background: "#F9FAFB", border: "1px solid #E5E7EB" }}>
                    <span className="px-1.5 py-0.5 rounded text-xs" style={{ background: ci === 0 && gi === 0 ? "rgba(59,130,246,0.1)" : "rgba(139,92,246,0.1)", color: ci === 0 && gi === 0 ? "#2563EB" : "#7C3AED", fontWeight: 700 }}>
                      {ci === 0 && gi === 0 ? "IF" : "AND"}
                    </span>
                    <span style={{ color: "#374151", fontWeight: 500 }}>{cond.indicator}</span>
                    <span style={{ color: "#6B7280" }}>{cond.operator}</span>
                    <span style={{ color: "#111827", fontWeight: 700 }}>{cond.value}</span>
                    {cond.timeframe && <span style={{ color: "#9CA3AF", fontSize: "0.63rem" }}>({cond.timeframe})</span>}
                  </div>
                  {ci < group.items.length - 1 && <div style={{ width: 2, height: 8, background: "#E5E7EB" }} />}
                </div>
              ))}
            </div>
          </div>
        ))}

        <div className="flex flex-col items-center">
          <div style={{ width: 2, height: 10, background: "#E5E7EB" }} />
          <ArrowDown size={12} style={{ color: "#D1D5DB" }} />
        </div>
        {actions.map((action) => (
          <div key={action.id} className="w-full max-w-xs px-4 py-2.5 rounded-xl text-center" style={{ background: "rgba(22,199,132,0.08)", border: "1px solid rgba(22,199,132,0.25)" }}>
            <div style={{ color: "#059669", fontWeight: 700, fontSize: "0.75rem" }}>THEN</div>
            <div style={{ color: "#111827", fontWeight: 600, fontSize: "0.82rem", marginTop: 2 }}>{action.action} · SL {action.sl} · TP {action.tp}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function StrategyBuilder() {
  const { accessToken, user } = useAppSession();
  const nextIdRef = useRef(10);
  const [conditions, setConditions] = useState([
    { id: 1, connector: "IF",  indicator: "RSI",    operator: "<",            value: "30",      timeframe: "4H" },
    { id: 2, connector: "AND", indicator: "Price",  operator: "is above",     value: "MA(200)", timeframe: "1D" },
    { id: 3, connector: "AND", indicator: "Volume", operator: "crosses above", value: "EMA(20)", timeframe: "4H" },
  ]);
  const [actions, setActions] = useState([
    { id: 1, action: "Buy Market", size: "2%", sl: "5%", tp: "10%" },
  ]);
  const [stratName, setStratName] = useState("RSI Oversold + Trend");
  const [backtested, setBacktested] = useState(false);
  const [running, setRunning] = useState(false);
  const [activeBacktestTab, setActiveBacktestTab] = useState("metrics");
  const [savedStrategies, setSavedStrategies] = useState([]);
  const [activeStrategyId, setActiveStrategyId] = useState("");
  const [backtestData, setBacktestData] = useState(null);
  const [error, setError] = useState("");
  const timeframes = ["1m","5m","15m","1H","4H","1D","1W"];
  const applyStrategy = (strategy) => {
    if (!strategy) {
      return;
    }

    setActiveStrategyId(strategy.id);
    setStratName(strategy.name);
    setConditions(
      (strategy.conditions || []).map((condition, index) => ({
        id: index + 1,
        ...condition,
      }))
    );
    setActions(
      (strategy.actions || []).map((action, index) => ({
        id: index + 1,
        ...action,
      }))
    );
    setBacktestData(strategy.latestBacktest || null);
    setBacktested(Boolean(strategy.latestBacktest));
  };

  useEffect(() => {
    let cancelled = false;

    async function loadStrategies() {
      if (!accessToken) {
        return;
      }

      try {
        setError("");
        const response = await appApi.getStrategies(accessToken);
        if (cancelled) {
          return;
        }

        const strategies = response.strategies || [];
        setSavedStrategies(strategies);
        if (strategies.length) {
          applyStrategy(strategies[0]);
          nextIdRef.current = Math.max(10, (strategies[0].conditions || []).length + 10);
        }
      } catch (requestError) {
        if (!cancelled) {
          setError(requestError.message || "Failed to load saved strategies.");
        }
      }
    }

    loadStrategies();

    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  const addCondition = (connector = "AND") => {
    setConditions((prev) => [...prev, { id: nextIdRef.current++, connector, indicator: "RSI", operator: "<", value: "50", timeframe: "4H" }]);
  };
  const removeCondition = (id) => setConditions((prev) => prev.filter((c) => c.id !== id));
  const updateCondition = (id, field, val) => setConditions(prev => prev.map(c => c.id === id ? { ...c, [field]: val } : c));
  const handleStrategySelection = (strategyId) => {
    const strategy = savedStrategies.find((item) => item.id === strategyId);
    applyStrategy(strategy);
  };

  const saveCurrentStrategy = async () => {
    if (!accessToken) {
      return;
    }

    try {
      setError("");
      const payload = { name: stratName, conditions, actions };
      if (activeStrategyId) {
        await appApi.updateStrategy(accessToken, activeStrategyId, payload);
      } else {
        const created = await appApi.createStrategy(accessToken, payload);
        setActiveStrategyId(created.id || created._id || "");
      }
      const response = await appApi.getStrategies(accessToken);
      setSavedStrategies(response.strategies || []);
      window.dispatchEvent(new CustomEvent("app:strategies-updated"));
    } catch (requestError) {
      setError(requestError.message || "Failed to save strategy.");
    }
  };

  const deleteCurrentStrategy = async () => {
    if (!accessToken || !activeStrategyId) {
      return;
    }

    try {
      setError("");
      await appApi.deleteStrategy(accessToken, activeStrategyId);
      const response = await appApi.getStrategies(accessToken);
      const strategies = response.strategies || [];
      setSavedStrategies(strategies);
      if (strategies.length) {
        applyStrategy(strategies[0]);
      } else {
        setActiveStrategyId("");
      }
      window.dispatchEvent(new CustomEvent("app:strategies-updated"));
    } catch (requestError) {
      setError(requestError.message || "Failed to delete strategy.");
    }
  };

  const runBacktest = async () => {
    if (!accessToken) {
      return;
    }

    try {
      setRunning(true);
      setError("");
      const result = await appApi.backtestStrategy(accessToken, {
        strategyId: activeStrategyId || undefined,
        name: stratName,
        conditions,
        actions,
      });
      setBacktestData(result);
      setBacktested(true);
      const response = await appApi.getStrategies(accessToken);
      setSavedStrategies(response.strategies || []);
    } catch (requestError) {
      setError(requestError.message || "Backtest failed.");
    } finally {
      setRunning(false);
    }
  };

  const showDemoFallback =
    Boolean(user?.demoDataFallbackEnabled) && Boolean(error) && !backtestData;
  const effectiveBacktestData = backtestData || (showDemoFallback
    ? {
        equityCurve,
        tradeDurationData,
        drawdownTimeline,
        backtestMetrics,
        monthlyReturns,
        monteCarloData,
        meta: {
          engineMode: "BACKTEST_ONLY",
          dataSource: "DEMO_FALLBACK",
          estimatedMetrics: ["tradeDurationData", "monteCarloData", "performanceDistribution"],
          notes: [
            "This is demo fallback backtest data because live strategy results are unavailable.",
          ],
        },
      }
    : null);
  const equityCurveSeries = effectiveBacktestData?.equityCurve || [];
  const tradeDurationSeries = effectiveBacktestData?.tradeDurationData || [];
  const drawdownTimelineSeries = effectiveBacktestData?.drawdownTimeline || [];
  const backtestMetricItems = effectiveBacktestData?.backtestMetrics || [];
  const monthlyReturnSeries = effectiveBacktestData?.monthlyReturns || [];
  const monteCarloSeries = effectiveBacktestData?.monteCarloData || [];
  const performanceDistribution = effectiveBacktestData?.performanceDistribution || [
    { label: "Breakout", wins: 72, losses: 28 },
    { label: "RSI Reversal", wins: 63, losses: 37 },
    { label: "Trend Follow", wins: 58, losses: 42 },
    { label: "MA Cross", wins: 51, losses: 49 },
  ];
  const monteCarloSummary = effectiveBacktestData?.monteCarloSummary || [
    { label: "Worst DD", value: "-18.4%", color: "#EF4444" },
    { label: "P(Loss)", value: "18%", color: "#F59E0B" },
    { label: "Exp. Return", value: "+124%", color: "#22C55E" },
  ];
  const backtestMeta = effectiveBacktestData?.meta || null;
  const hasBacktestResults = backtested || Boolean(effectiveBacktestData);

  const connectorColor = (c) => {
    if (c === "IF") return { bg: "rgba(59,130,246,0.1)", color: "#2563EB", border: "rgba(59,130,246,0.25)" };
    if (c === "OR") return { bg: "rgba(245,158,11,0.1)", color: "#D97706", border: "rgba(245,158,11,0.25)" };
    return { bg: "rgba(139,92,246,0.1)", color: "#7C3AED", border: "rgba(139,92,246,0.25)" };
  };

  const inputStyle = { background: "#F9FAFB", border: "1px solid #E5E7EB", color: "#111827" };

  return (
    <div className="flex h-full" style={{ background: "#F8FAFC", fontFamily: "Inter, sans-serif", color: "#111827" }}>
      {/* Left: Builder */}
      <div className="flex-1 min-w-0 flex flex-col overflow-y-auto p-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-base mb-0.5" style={{ fontWeight: 700, color: "#111827", letterSpacing: "-0.02em" }}>Strategy Builder</h1>
            <p className="text-xs" style={{ color: "#6B7280" }}>Build no-code trading strategies with visual condition blocks.</p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={activeStrategyId}
              onChange={(event) => handleStrategySelection(event.target.value)}
              className="px-3 py-2 rounded-lg text-xs outline-none"
              style={{ ...inputStyle, minWidth: 170 }}
            >
              <option value="">Unsaved strategy</option>
              {savedStrategies.map((strategy) => (
                <option key={strategy.id} value={strategy.id}>
                  {strategy.name}
                </option>
              ))}
            </select>
            <input value={stratName} onChange={(e) => setStratName(e.target.value)} className="px-3 py-2 rounded-lg text-xs outline-none" style={{ ...inputStyle, minWidth: 180, fontWeight: 500 }} />
            <button onClick={saveCurrentStrategy} className="px-3 py-2 rounded-lg text-xs" style={{ background: "#FFFFFF", border: "1px solid #E5E7EB", color: "#374151", fontWeight: 600 }}>
              Save
            </button>
            {activeStrategyId && (
              <button onClick={deleteCurrentStrategy} className="px-3 py-2 rounded-lg text-xs" style={{ background: "rgba(234,57,67,0.08)", border: "1px solid rgba(234,57,67,0.18)", color: "#DC2626", fontWeight: 600 }}>
                Delete
              </button>
            )}
            <button onClick={runBacktest} className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs text-white transition-all hover:opacity-90" style={{ background: "linear-gradient(135deg, #3B82F6, #8B5CF6)", fontWeight: 600 }}>
              <Play size={12} />{running ? "Running..." : "Run Backtest"}
            </button>
          </div>
        </div>

        <div className="mb-4 flex items-center gap-2 flex-wrap">
          <span className="text-xs px-2.5 py-1 rounded-lg" style={{ background: "rgba(59,130,246,0.08)", color: "#2563EB", border: "1px solid rgba(59,130,246,0.18)", fontWeight: 600 }}>
            Backtest only
          </span>
          <span className="text-xs px-2.5 py-1 rounded-lg" style={{ background: "rgba(245,158,11,0.08)", color: "#B45309", border: "1px solid rgba(245,158,11,0.18)", fontWeight: 600 }}>
            Batch simulation
          </span>
          <span className="text-xs" style={{ color: "#6B7280" }}>
            Strategies are analyzed in historical backtests here. They are not auto-executed live.
          </span>
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
              ? "Live strategy data is unavailable right now. Showing demo backtest data because the profile fallback is enabled."
              : error}
          </div>
        )}

        {/* Strategy Flow Visualization */}
        <StrategyFlowViz conditions={conditions} actions={actions} />

        {/* Entry Conditions */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <h2 className="text-xs" style={{ fontWeight: 600, color: "#6B7280", letterSpacing: "0.05em" }}>ENTRY CONDITIONS</h2>
              <div className="flex items-center gap-1 text-xs px-2 py-0.5 rounded" style={{ background: "rgba(139,92,246,0.08)", color: "#7C3AED", border: "1px solid rgba(139,92,246,0.18)" }}>
                <Layers size={10} /> Multi-TF
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <button onClick={() => addCondition("AND")} className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg transition-colors hover:bg-purple-50" style={{ color: "#7C3AED", border: "1px solid rgba(139,92,246,0.25)", fontWeight: 500 }}>
                <Plus size={11} /> AND
              </button>
              <button onClick={() => addCondition("OR")} className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg transition-colors hover:bg-amber-50" style={{ color: "#D97706", border: "1px solid rgba(245,158,11,0.25)", fontWeight: 500 }}>
                <Plus size={11} /> OR
              </button>
            </div>
          </div>
          <div className="space-y-2">
            {conditions.map((cond, i) => {
              const { bg, color, border } = connectorColor(cond.connector);
              return (
                <div key={cond.id} className="flex items-center gap-2 p-3 rounded-xl" style={{ background: "#FFFFFF", border: "1px solid #E5E7EB" }}>
                  {i === 0 ? (
                    <div className="w-10 text-center py-1 rounded-md text-xs shrink-0" style={{ background: bg, color, border: `1px solid ${border}`, fontWeight: 700 }}>IF</div>
                  ) : (
                    <select value={cond.connector} onChange={e => updateCondition(cond.id, "connector", e.target.value)} className="w-12 text-center py-1 rounded-md text-xs outline-none cursor-pointer shrink-0" style={{ background: bg, color, border: `1px solid ${border}`, fontWeight: 700 }}>
                      <option value="AND">AND</option>
                      <option value="OR">OR</option>
                    </select>
                  )}
                  <select value={cond.indicator} onChange={e => updateCondition(cond.id, "indicator", e.target.value)} className="flex-1 px-3 py-2 rounded-lg text-xs outline-none" style={inputStyle}>
                    {indicators.map(ind => <option key={ind} value={ind}>{ind}</option>)}
                  </select>
                  <select value={cond.operator} onChange={e => updateCondition(cond.id, "operator", e.target.value)} className="flex-1 px-3 py-2 rounded-lg text-xs outline-none" style={inputStyle}>
                    {operators.map(op => <option key={op} value={op}>{op}</option>)}
                  </select>
                  <input value={cond.value} onChange={e => updateCondition(cond.id, "value", e.target.value)} className="w-20 px-3 py-2 rounded-lg text-xs outline-none" style={inputStyle} />
                  <select value={cond.timeframe || "4H"} onChange={e => updateCondition(cond.id, "timeframe", e.target.value)} className="w-16 px-2 py-2 rounded-lg text-xs outline-none" style={{ ...inputStyle, color: "#6B7280" }}>
                    {timeframes.map(tf => <option key={tf} value={tf}>{tf}</option>)}
                  </select>
                  {i > 0 && (
                    <button onClick={() => removeCondition(cond.id)} className="transition-colors shrink-0" style={{ color: "#D1D5DB" }}
                      onMouseEnter={e => e.currentTarget.style.color = "#EF4444"}
                      onMouseLeave={e => e.currentTarget.style.color = "#D1D5DB"}>
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="mb-5">
          <h2 className="text-xs mb-3" style={{ fontWeight: 600, color: "#6B7280", letterSpacing: "0.05em" }}>ACTIONS (THEN)</h2>
          {actions.map((action) => (
            <div key={action.id} className="p-4 rounded-xl" style={{ background: "#FFFFFF", border: "1px solid #E5E7EB" }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="px-2.5 py-1 rounded-md text-xs" style={{ background: "rgba(22,199,132,0.1)", color: "#059669", border: "1px solid rgba(22,199,132,0.2)", fontWeight: 700 }}>THEN</div>
                <select value={action.action} onChange={(e) => setActions((prev) => prev.map((a) => (a.id === action.id ? { ...a, action: e.target.value } : a)))} className="flex-1 px-3 py-2 rounded-lg text-xs outline-none" style={inputStyle}>
                  {["Buy Market","Buy Limit","Sell Market","Sell Limit"].map((a) => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[{ label: "Position Size", val: action.size, key: "size" }, { label: "Stop Loss", val: action.sl, key: "sl" }, { label: "Take Profit", val: action.tp, key: "tp" }].map(({ label, val, key }) => (
                  <div key={key}>
                    <label className="block text-xs mb-1" style={{ color: "#6B7280" }}>{label}</label>
                    <input value={val} onChange={(e) => setActions((prev) => prev.map((a) => a.id === action.id ? { ...a, [key]: e.target.value } : a))} className="w-full px-3 py-2 rounded-lg text-xs outline-none" style={inputStyle} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Equity Curve */}
        {hasBacktestResults && (
          <div className="rounded-xl p-4 mb-4" style={{ background: "#FFFFFF", border: "1px solid #E5E7EB" }}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs" style={{ fontWeight: 600, color: "#6B7280", letterSpacing: "0.05em" }}>EQUITY CURVE — BACKTEST 2024</h3>
              <div className="flex items-center gap-2">
                <span className="text-xs px-2 py-0.5 rounded" style={{ background: "rgba(22,199,132,0.1)", color: "#059669", fontWeight: 600, border: "1px solid rgba(22,199,132,0.2)" }}>{backtestMetricItems[7]?.value || "+0%"} Return</span>
                <span className="text-xs px-2 py-0.5 rounded" style={{ background: "rgba(59,130,246,0.08)", color: "#2563EB", fontWeight: 600, border: "1px solid rgba(59,130,246,0.16)" }}>
                  Snapshot-driven
                </span>
              </div>
            </div>
            <div style={{ height: 150 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={equityCurveSeries} margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                  <XAxis dataKey="t" tick={{ fill: "#9CA3AF", fontSize: 9 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#9CA3AF", fontSize: 9 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v) => [`$${Number(v).toLocaleString()}`, "Portfolio"]} contentStyle={lightTooltip} />
                  <Area type="monotone" dataKey="v" stroke="#16C784" strokeWidth={2} fill="#16C784" fillOpacity={0.1} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Trade Duration Distribution */}
        {hasBacktestResults && (
          <div className="rounded-xl p-4 mb-4" style={{ background: "#FFFFFF", border: "1px solid #E5E7EB" }}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs" style={{ fontWeight: 600, color: "#6B7280", letterSpacing: "0.05em" }}>TRADE DURATION DISTRIBUTION</h3>
              <span className="text-xs px-2 py-0.5 rounded" style={{ background: "rgba(245,158,11,0.08)", color: "#B45309", fontWeight: 600, border: "1px solid rgba(245,158,11,0.18)" }}>
                Estimated
              </span>
            </div>
            <div style={{ height: 130 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={tradeDurationSeries} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                  <XAxis dataKey="dur" tick={{ fill: "#9CA3AF", fontSize: 9 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#9CA3AF", fontSize: 9 }} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(v) => [`${v} trades`, "Count"]} contentStyle={lightTooltip} />
                  <Bar dataKey="count" fill="#8B5CF6" fillOpacity={0.8} radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Drawdown Timeline */}
        {hasBacktestResults && (
          <div className="rounded-xl p-4" style={{ background: "#FFFFFF", border: "1px solid #E5E7EB" }}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs" style={{ fontWeight: 600, color: "#6B7280", letterSpacing: "0.05em" }}>DRAWDOWN TIMELINE</h3>
              <span className="text-xs px-2 py-0.5 rounded" style={{ background: "rgba(234,57,67,0.08)", color: "#EA3943", fontWeight: 600, border: "1px solid rgba(234,57,67,0.15)" }}>Max {backtestMetricItems[2]?.value || "-0.0%"}</span>
            </div>
            <div style={{ height: 130 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={drawdownTimelineSeries} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                  <XAxis dataKey="t" tick={{ fill: "#9CA3AF", fontSize: 9 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#9CA3AF", fontSize: 9 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} domain={[-15, 1]} />
                  <Tooltip formatter={(v) => [`${v}%`, "Drawdown"]} contentStyle={lightTooltip} />
                  <ReferenceLine y={0} stroke="#E5E7EB" strokeWidth={1} />
                  <Area type="monotone" dataKey="dd" stroke="#EA3943" strokeWidth={1.5} fill="#EA3943" fillOpacity={0.1} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* Right: Backtest Results */}
      {hasBacktestResults && (
          <div className="shrink-0 overflow-y-auto p-4" style={{ background: "#FFFFFF", borderLeft: "1px solid #E5E7EB", width: 260 }}>
          <h2 className="text-xs mb-1" style={{ fontWeight: 700, color: "#6B7280", letterSpacing: "0.05em" }}>BACKTEST RESULTS</h2>
          <div className="text-xs mb-0.5" style={{ color: "#9CA3AF" }}>Strategy: <span style={{ fontWeight: 600, color: "#111827" }}>{stratName}</span></div>
          <div className="text-xs mb-4" style={{ color: "#9CA3AF" }}>Period: <span style={{ fontWeight: 600, color: "#111827" }}>{effectiveBacktestData?.periodLabel || "Saved market snapshot window"}</span></div>

          {backtestMeta && (
            <div className="mb-4 p-3 rounded-xl" style={{ background: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.16)" }}>
              <div className="text-xs mb-1" style={{ fontWeight: 700, color: "#2563EB" }}>
                {backtestMeta.engineMode === "BACKTEST_ONLY" ? "Backtest only" : backtestMeta.engineMode}
              </div>
              <div className="text-xs mb-1" style={{ color: "#6B7280" }}>
                Source: <span style={{ fontWeight: 600, color: "#111827" }}>{backtestMeta.dataSource}</span>
              </div>
              {(backtestMeta.notes || []).slice(0, 2).map((note) => (
                <div key={note} className="text-xs leading-relaxed" style={{ color: "#6B7280" }}>
                  {note}
                </div>
              ))}
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 mb-4">
            {backtestMetricItems.map(({ label, value, color, up }) => (
              <div key={label} className="p-2.5 rounded-xl" style={{ background: "#F9FAFB", border: "1px solid #E5E7EB" }}>
                <div className="text-xs mb-1" style={{ color: "#9CA3AF" }}>{label}</div>
                <div className="text-sm flex items-center gap-1" style={{ fontWeight: 700, color }}>
                  {value}
                  {up ? <TrendingUp size={11} style={{ color }} /> : <TrendingDown size={11} style={{ color }} />}
                </div>
              </div>
            ))}
          </div>

          {/* Strategy Performance Distribution */}
          <h3 className="text-xs mb-2" style={{ fontWeight: 600, color: "#6B7280", letterSpacing: "0.05em" }}>PERFORMANCE DIST.</h3>
          <div className="space-y-1.5 mb-4">
            {performanceDistribution.map(({ label, wins, losses }) => (
              <div key={label}>
                <div className="flex justify-between text-xs mb-0.5" style={{ color: "#6B7280" }}>
                  <span>{label}</span>
                  <span style={{ color: "#16C784", fontWeight: 600 }}>{wins}%</span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "#F3F4F6" }}>
                  <div className="h-full rounded-full" style={{ width: `${wins}%`, background: wins >= 60 ? "#16C784" : wins >= 50 ? "#3B82F6" : "#EA3943" }} />
                </div>
              </div>
            ))}
          </div>

          <h3 className="text-xs mb-2" style={{ fontWeight: 600, color: "#6B7280", letterSpacing: "0.05em" }}>MONTHLY RETURNS (%)</h3>
          <div style={{ height: 110 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyReturnSeries} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                <XAxis dataKey="m" tick={{ fill: "#9CA3AF", fontSize: 8 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#9CA3AF", fontSize: 8 }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v) => [`${v}%`, "Return"]} contentStyle={lightTooltip} />
                <Bar dataKey="r" radius={[2,2,0,0]} isAnimationActive={false}>
                  {monthlyReturnSeries.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.r >= 0 ? "#16C784" : "#EA3943"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-3 p-2.5 rounded-xl flex items-start gap-2" style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.18)" }}>
            <AlertCircle size={12} style={{ color: "#F59E0B", marginTop: 1, flexShrink: 0 }} />
            <p className="text-xs leading-relaxed" style={{ color: "#92400E" }}>Past backtest results don't guarantee future performance.</p>
          </div>

          {/* Monte Carlo Simulation */}
          <div className="mt-4">
            <div className="flex items-center gap-2 mb-3">
              <Cpu size={11} style={{ color: "#8B5CF6" }} />
              <h3 className="text-xs" style={{ fontWeight: 700, color: "#6B7280", letterSpacing: "0.05em" }}>MONTE CARLO SIM.</h3>
              <span className="text-xs px-2 py-0.5 rounded" style={{ background: "rgba(245,158,11,0.08)", color: "#B45309", border: "1px solid rgba(245,158,11,0.18)", fontWeight: 600 }}>
                Estimated
              </span>
              <button
                onClick={runBacktest}
                className="ml-auto flex items-center gap-1 text-xs px-2 py-0.5 rounded"
                style={{ background: "rgba(139,92,246,0.1)", color: "#7C3AED", border: "1px solid rgba(139,92,246,0.2)", fontWeight: 500 }}
              >
                <RefreshCw size={9} /> Run
              </button>
            </div>
            <div style={{ height: 130 }}>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={monteCarloSeries} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                  <XAxis dataKey="t" tick={{ fill: "#9CA3AF", fontSize: 8 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#9CA3AF", fontSize: 8 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                  <Tooltip contentStyle={lightTooltip} formatter={(v, name) => [`$${Number(v).toLocaleString()}`, name === "median" ? "Median" : name === "best" ? "Best" : "Worst"]} />
                  {/* Individual paths faded */}
                  {["s0","s1","s2","s3","s4"].map((k, i) => (
                    <Line key={k} type="monotone" dataKey={k} stroke="#8B5CF6" strokeWidth={0.8} dot={false} opacity={0.25} />
                  ))}
                  {/* Worst / Best / Median */}
                  <Line type="monotone" dataKey="worst" stroke="#EF4444" strokeWidth={1.5} dot={false} strokeDasharray="4 3" name="worst" />
                  <Line type="monotone" dataKey="best" stroke="#22C55E" strokeWidth={1.5} dot={false} strokeDasharray="4 3" name="best" />
                  <Line type="monotone" dataKey="median" stroke="#8B5CF6" strokeWidth={2} dot={false} name="median" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-3 gap-1.5 mt-2">
              {monteCarloSummary.map(({ label, value, color }) => (
                <div key={label} className="p-2 rounded-lg text-center" style={{ background: "#F9FAFB", border: "1px solid #E5E7EB" }}>
                  <div style={{ color: "#9CA3AF", fontSize: "0.62rem" }}>{label}</div>
                  <div style={{ color, fontWeight: 700, fontSize: "0.78rem" }}>{value}</div>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-3 mt-2 text-xs" style={{ color: "#9CA3AF" }}>
              <span className="flex items-center gap-1"><span className="w-3 h-0.5 inline-block" style={{ background: "#22C55E" }}/>Best</span>
              <span className="flex items-center gap-1"><span className="w-3 h-0.5 inline-block" style={{ background: "#8B5CF6" }}/>Median</span>
              <span className="flex items-center gap-1"><span className="w-3 h-0.5 inline-block" style={{ background: "#EF4444" }}/>Worst</span>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
