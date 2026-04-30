import { useState, useEffect, useRef } from "react";
import { CandlestickChart } from "../components/CandlestickChart";
import {
  Play, Pause, SkipForward, SkipBack, Gauge, AlertTriangle, CheckCircle,
  XCircle, TrendingUp, TrendingDown, Target, RefreshCw, BookOpen, ChevronRight,
} from "lucide-react";
import { useAppSession } from "../context/AppSession";
import { appApi } from "../lib/api";

function generateCandles(count, startPrice) {
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const candles = [];
  let price = startPrice;
  for (let i = 0; i < count; i++) {
    const change = (Math.random() - 0.48) * price * 0.025;
    const open = price;
    const close = price + change;
    const high = Math.max(open, close) + Math.random() * price * 0.012;
    const low  = Math.min(open, close) - Math.random() * price * 0.012;
    candles.push({ open, high, low, close, time: `${months[Math.floor(i/4)%12]} W${(i%4)+1}` });
    price = close;
  }
  return candles;
}

const BASE_REPLAY_CANDLES = generateCandles(80, 28000);

/* Mistake markers — at certain candle indices */
const BASE_MISTAKE_MARKERS = [
  { candleIdx: 18, type: "warning", label: "⚠ Early Entry",    color: "#F59E0B" },
  { candleIdx: 31, type: "error",   label: "⚠ Overtrading",    color: "#EF4444" },
  { candleIdx: 47, type: "error",   label: "⚠ Stop Moved",     color: "#EF4444" },
];

/* Entry / exit markers */
const BASE_TRADE_MARKERS = [
  { candleIdx: 14, type: "entry", label: "Long Entry", color: "#22C55E",  side: "Long" },
  { candleIdx: 22, type: "exit",  label: "Exit +$820",  color: "#22C55E",  side: "Long" },
  { candleIdx: 34, type: "entry", label: "Short Entry", color: "#EF4444", side: "Short" },
  { candleIdx: 40, type: "exit",  label: "Exit -$320",  color: "#EF4444", side: "Short" },
];

const BASE_COACH_FEEDBACK = [
  { id:1, tradeNum:1, type:"warning", icon:AlertTriangle, color:"#F59E0B", msg:"You entered before the confirmation candle closed. Wait for candle close above resistance." },
  { id:2, tradeNum:1, type:"error",   icon:XCircle,       color:"#EF4444", msg:"Stop loss was too tight — placed only 0.6% from entry. Volatility alone could trigger it." },
  { id:3, tradeNum:2, type:"error",   icon:XCircle,       color:"#EF4444", msg:"Risk per trade exceeded recommended 2% account limit. Size was 2.8% of balance." },
  { id:4, tradeNum:2, type:"good",    icon:CheckCircle,   color:"#22C55E", msg:"Good Risk:Reward ratio of 2.4:1 on Trade #2. Keep targeting setups like this." },
  { id:5, tradeNum:3, type:"error",   icon:XCircle,       color:"#EF4444", msg:"Stop loss was moved after price moved against you — violated your trading plan." },
];

const BASE_SESSION_TRADES = [
  { id:1, side:"Long",  entry:"$28,420", exit:"$29,240", pnl:"+$820",  pct:"+2.9%", ok:true,  mistake:"Early Entry" },
  { id:2, side:"Short", entry:"$29,100", exit:"$28,600", pnl:"+$500",  pct:"+1.7%", ok:true,  mistake:null },
  { id:3, side:"Long",  entry:"$28,800", exit:"$27,900", pnl:"-$320",  pct:"-1.1%", ok:false, mistake:"Stop Moved" },
];

const MISTAKE_SCORES = { "Early Entry":12, "Overtrading":18, "Stop Moved":20 };
const BASE_SESSION_SCORE = 72;
const REPLAY_CHART_PLOT_PADDING = { left: 10, right: 70 };

export function MarketReplay() {
  const { accessToken, user } = useAppSession();
  const [asset, setAsset]       = useState("BTC/USDT");
  const [year, setYear]         = useState("2023");
  const [timeframe, setTimeframe] = useState("4H");
  const [speed, setSpeed]       = useState(1);
  const [playing, setPlaying]   = useState(false);
  const [visibleCount, setVisibleCount] = useState(30);
  const [side, setSide]         = useState("buy");
  const [tradeSize, setTradeSize] = useState("0.1");
  const [sl, setSl]             = useState("27000");
  const [tp, setTp]             = useState("31000");
  const [activeTab, setActiveTab] = useState("trade");
  const [activeFeedback, setActiveFeedback] = useState(null);
  const [sessionData, setSessionData] = useState({
    candles: [],
    sessionTrades: [],
    coachFeedback: [],
    tradeMarkers: [],
    mistakeMarkers: [],
    sessionStats: { trades:0, wins:0, pnl:0 },
    sessionScore: 0,
    options: { assets: [], years: [], timeframes: [] },
  });
  const [error, setError] = useState("");
  const intervalRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    async function loadReplay() {
      if (!accessToken) {
        return;
      }

      try {
        setError("");
        const response = await appApi.getReplaySession(accessToken, {
          symbol: asset,
          year,
          timeframe,
        });

        if (!cancelled) {
          setSessionData(response);
        }
      } catch (requestError) {
        if (!cancelled) {
          setError(requestError.message || "Failed to load replay session.");
        }
      }
    }

    loadReplay();

    return () => {
      cancelled = true;
    };
  }, [accessToken, asset, year, timeframe]);

  const showDemoFallback =
    Boolean(user?.demoDataFallbackEnabled) && Boolean(error) && !sessionData.candles?.length;
  const allCandles = sessionData.candles?.length
    ? sessionData.candles
    : showDemoFallback
      ? BASE_REPLAY_CANDLES
      : [];
  const coachFeedback = ((showDemoFallback ? BASE_COACH_FEEDBACK : sessionData.coachFeedback) || []).map((item) => ({
    ...item,
    msg: item.msg || item.message || "",
    icon:
      item.icon ||
      {
        warning: AlertTriangle,
        error: XCircle,
        good: CheckCircle,
      }[item.type] ||
      AlertTriangle,
  }));
  const tradeMarkers = showDemoFallback ? BASE_TRADE_MARKERS : sessionData.tradeMarkers || [];
  const mistakeMarkers = showDemoFallback ? BASE_MISTAKE_MARKERS : sessionData.mistakeMarkers || [];
  const sessionTrades = showDemoFallback ? BASE_SESSION_TRADES : sessionData.sessionTrades || [];
  const sessionStats = showDemoFallback
    ? { trades: 3, wins: 2, pnl: 1000 }
    : sessionData.sessionStats || { trades:0, wins:0, pnl:0 };
  const SESSION_SCORE = showDemoFallback ? BASE_SESSION_SCORE : sessionData.sessionScore || 0;
  const totalCandles = Math.max(1, allCandles.length);
  const marketMeta = sessionData.marketMeta || null;
  const mistakeBreakdown = sessionTrades.reduce((accumulator, trade) => {
    if (!trade.mistake) {
      return accumulator;
    }

    const next = accumulator;
    next[trade.mistake] = (next[trade.mistake] || 0) + 1;
    return next;
  }, {});
  const recommendations = Object.keys(mistakeBreakdown).length
    ? Object.keys(mistakeBreakdown).map((mistake, index) => {
        const advice = {
          "Early Entry": "Wait for the confirmation candle to close before taking the setup.",
          "Risk Too High": "Scale the position so the replay risk stays under your account rule.",
          "Stop Moved": "Lock the stop before entry and avoid widening it after the trade is live.",
          Overtrading: "Slow the replay down and focus on only the highest-quality setups.",
        };
        return advice[mistake] || `${mistake}: review the setup checklist before the next replay trade.`;
      })
    : [
        "Start a replay trade to generate coaching recommendations from your saved session.",
      ];
  const visibleCandles = allCandles.slice(0, visibleCount);

  useEffect(() => {
    if (playing) {
      intervalRef.current = setInterval(() => {
        setVisibleCount((c) => {
          if (c >= allCandles.length) { setPlaying(false); return c; }
          return c + 1;
        });
      }, 1000 / speed);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [playing, speed]);

  const currentCandle = visibleCandles[visibleCandles.length - 1];
  const prevCandle    = visibleCandles[visibleCandles.length - 2];
  const priceChange   = currentCandle && prevCandle ? currentCandle.close - prevCandle.close : 0;
  const priceUp       = priceChange >= 0;
  const progressPct   = Math.round((visibleCount / totalCandles) * 100);

  /* Which markers are visible */
  const visibleMistakes = mistakeMarkers.filter(m => m.candleIdx < visibleCount);
  const visibleTrades   = tradeMarkers.filter(m => m.candleIdx < visibleCount);

  const entryPriceNum = currentCandle ? currentCandle.close : 28800;
  const slNum   = parseFloat(sl) || 27000;
  const tpNum   = parseFloat(tp) || 31000;
  const sizeNum = parseFloat(tradeSize) || 0.1;
  const riskAmt   = Math.abs(entryPriceNum - slNum) * sizeNum;
  const profitAmt = Math.abs(tpNum - entryPriceNum) * sizeNum;

  const placeTrade = () => {
    appApi.saveReplayTrade(accessToken, {
      symbol: asset,
      year,
      timeframe,
      side: side === "buy" ? "Long" : "Short",
      size: sizeNum,
      entry: entryPriceNum,
      sl: slNum,
      tp: tpNum,
      visibleCount,
    })
      .then(() => appApi.getReplaySession(accessToken, { symbol: asset, year, timeframe }))
      .then((response) => {
        setSessionData(response);
        setActiveTab("history");
      })
      .catch((requestError) => {
        setError(requestError.message || "Failed to save replay trade.");
      });
  };

  const reset = () => {
    setPlaying(false);
    setVisibleCount(30);
    appApi.resetReplaySession(accessToken, {
      symbol: asset,
      year,
      timeframe,
    })
      .then(() => appApi.getReplaySession(accessToken, { symbol: asset, year, timeframe }))
      .then((response) => {
        setSessionData(response);
      })
      .catch((requestError) => {
        setError(requestError.message || "Failed to reset replay session.");
      });
  };

  return (
    <div
      className="flex h-full min-h-full"
      style={{ background:"#0B0F19",fontFamily:"Inter, sans-serif",color:"white", minHeight: "100%" }}
    >

      {/* ── Main area ── */}
      <div className="flex-1 min-w-0 flex flex-col min-h-full">

        {/* Controls bar */}
        <div className="flex items-center gap-3 px-4 py-2.5 shrink-0" style={{ borderBottom:"1px solid rgba(255,255,255,0.07)",background:"#111827" }}>
          <div className="text-xs px-2 py-1 rounded-md" style={{ background:"rgba(139,92,246,0.15)",color:"#A78BFA",fontWeight:700,border:"1px solid rgba(139,92,246,0.3)" }}>
            REPLAY MODE
          </div>
          {marketMeta && (
            <div className="text-xs px-2 py-1 rounded-md" style={{ background:"rgba(59,130,246,0.12)",color:"#93C5FD",fontWeight:600,border:"1px solid rgba(59,130,246,0.25)" }}>
              {marketMeta.source === "BINANCE_HISTORICAL" ? "Real historical candles" : "Stored fallback candles"}
            </div>
          )}
          <div className="h-4 w-px" style={{ background:"rgba(255,255,255,0.1)" }} />

          <div className="flex items-center gap-1.5">
            <span className="text-xs" style={{ color:"#64748B" }}>Asset</span>
            <select value={asset} onChange={e=>setAsset(e.target.value)} className="px-2 py-1 rounded-lg text-xs outline-none"
              style={{ background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.1)",color:"white" }}>
              {(sessionData.options?.assets?.length ? sessionData.options.assets : ["BTC/USDT","ETH/USDT","SOL/USDT","BNB/USDT","ADA/USDT"]).map(a=>(
                <option key={a} value={a} style={{ background:"#1E2D40" }}>{a}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-xs" style={{ color:"#64748B" }}>Year</span>
            <select value={year} onChange={e=>setYear(e.target.value)} className="px-2 py-1 rounded-lg text-xs outline-none"
              style={{ background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.1)",color:"white" }}>
              {(sessionData.options?.years?.length ? sessionData.options.years : ["2020","2021","2022","2023","2024","2025"]).map(y=>(
                <option key={y} value={y} style={{ background:"#1E2D40" }}>{y}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-0.5">
            {(sessionData.options?.timeframes?.length ? sessionData.options.timeframes : ["1H","4H","1D","1W"]).map(tf=>(
              <button key={tf} onClick={()=>setTimeframe(tf)} className="px-2 py-1 rounded text-xs transition-colors"
                style={{ background:timeframe===tf?"rgba(59,130,246,0.2)":"rgba(255,255,255,0.06)",color:timeframe===tf?"#60A5FA":"#64748B",fontWeight:500 }}>{tf}</button>
            ))}
          </div>

          <div className="ml-auto flex items-center gap-3">
            <div className="text-sm" style={{ fontWeight:700 }}>
              ${currentCandle ? currentCandle.close.toLocaleString(undefined,{maximumFractionDigits:0}) : "—"}
            </div>
            <div className="text-xs flex items-center gap-1" style={{ color:priceUp?"#22C55E":"#EF4444" }}>
              {priceUp?<TrendingUp size={12}/>:<TrendingDown size={12}/>}
              {priceChange>=0?"+":""}{priceChange.toLocaleString(undefined,{maximumFractionDigits:0})}
            </div>
            <div className="text-xs" style={{ color:"#64748B" }}>Candle {visibleCount}/{allCandles.length || 0}</div>
          </div>
        </div>

        {marketMeta?.fallbackUsed && marketMeta.source !== "BINANCE_HISTORICAL" && (
          <div className="px-4 py-2 text-xs" style={{ background:"rgba(245,158,11,0.08)", color:"#FBBF24", borderBottom:"1px solid rgba(245,158,11,0.18)" }}>
            Live historical replay candles were unavailable, so the session is using the stored fallback candle set.
          </div>
        )}

        {error && (
          <div
            className="px-4 py-2 text-xs"
            style={{
              background: showDemoFallback ? "rgba(59,130,246,0.12)" : "rgba(239,68,68,0.12)",
              color: showDemoFallback ? "#BFDBFE" : "#FCA5A5",
              borderBottom: "1px solid rgba(255,255,255,0.05)",
            }}
          >
            {showDemoFallback
              ? "Live replay data is unavailable right now. Showing demo replay data because the profile fallback is enabled."
              : error}
          </div>
        )}

        {/* Timeline / progress bar */}
        <div className="px-4 py-2 flex items-center gap-3 shrink-0"
          style={{ background:"rgba(0,0,0,0.2)",borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
          <span className="text-xs" style={{ color:"#64748B",fontWeight:600,minWidth:56 }}>SESSION</span>
          <div
            className="flex-1 min-w-0"
            style={{
              paddingLeft: REPLAY_CHART_PLOT_PADDING.left,
              paddingRight: REPLAY_CHART_PLOT_PADDING.right,
            }}
          >
            <div className="relative h-3 rounded-full overflow-hidden cursor-pointer" style={{ background:"rgba(255,255,255,0.07)" }}
              onClick={(e)=>{
                const rect = e.currentTarget.getBoundingClientRect();
                const frac = (e.clientX - rect.left) / rect.width;
                setVisibleCount(Math.round(frac * totalCandles));
              }}>
              {/* Progress fill */}
              <div className="h-full rounded-full transition-all" style={{ width:`${progressPct}%`,background:"linear-gradient(90deg, #3B82F6, #8B5CF6)" }} />

              {/* Mistake markers */}
              {mistakeMarkers.map(m=>{
                const pct = (m.candleIdx/totalCandles)*100;
                const visible = m.candleIdx < visibleCount;
                return (
                  <div key={m.candleIdx} style={{ position:"absolute",left:`${pct}%`,top:"50%",transform:"translate(-50%,-50%)",zIndex:10 }}>
                    <div style={{ width:8,height:8,borderRadius:"50%",background:m.color,border:"2px solid #0B0F19",opacity:visible?1:0.4,transition:"opacity 0.3s",cursor:"pointer" }}
                      title={m.label} />
                  </div>
                );
              })}

              {/* Entry/exit markers */}
              {tradeMarkers.map(m=>{
                const pct = (m.candleIdx/totalCandles)*100;
                const visible = m.candleIdx < visibleCount;
                return (
                  <div key={`${m.candleIdx}-${m.type}`} style={{ position:"absolute",left:`${pct}%`,top:"50%",transform:"translate(-50%,-50%)",zIndex:11 }}>
                    <div style={{ width:6,height:6,borderRadius:1,background:m.color,border:"1.5px solid #0B0F19",opacity:visible?1:0.3,transform:"rotate(45deg)",transition:"opacity 0.3s",cursor:"pointer" }}
                      title={m.label} />
                  </div>
                );
              })}
            </div>
          </div>
          <span className="text-xs" style={{ color:"#94A3B8",fontWeight:700,minWidth:30 }}>{progressPct}%</span>

          {/* Legend */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full" style={{ background:"#EF4444" }} />
              <span className="text-xs" style={{ color:"#64748B" }}>{visibleMistakes.length} mistakes</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-sm" style={{ background:"#22C55E",transform:"rotate(45deg)" }} />
              <span className="text-xs" style={{ color:"#64748B" }}>{visibleTrades.length} trades</span>
            </div>
          </div>
        </div>

        <div className="flex-1 min-h-0 flex flex-col">
          {/* Chart */}
          <div style={{ flex: 1, minHeight: 420 }}>
            <CandlestickChart candles={visibleCandles} height="fill" theme="dark" />
          </div>

          <div className="shrink-0">
            {/* Mistake markers overlay — shown below chart */}
            {visibleMistakes.length>0&&(
              <div className="px-4 py-2 flex items-center gap-2 flex-wrap" style={{ background:"rgba(0,0,0,0.25)",borderTop:"1px solid rgba(255,255,255,0.05)" }}>
                {visibleMistakes.map(m=>(
                  <div key={m.candleIdx} className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs" style={{ background:`${m.color}15`,border:`1px solid ${m.color}40`,color:m.color }}>
                    {m.label}
                  </div>
                ))}
              </div>
            )}

            {/* Playback controls */}
            <div className="px-4 py-3" style={{ borderTop:"1px solid rgba(255,255,255,0.07)",background:"rgba(0,0,0,0.2)" }}>
              <div className="flex items-center justify-center gap-4">
            {/* Step back */}
            <button onClick={()=>setVisibleCount(c=>Math.max(1,c-1))}
              className="flex items-center justify-center w-8 h-8 rounded-full transition-all hover:bg-white/10"
              style={{ background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.1)" }}>
              <SkipBack size={14} />
            </button>

            {/* Play/Pause */}
            <button onClick={()=>setPlaying(p=>!p)}
              className="flex items-center justify-center w-10 h-10 rounded-full transition-all hover:scale-105"
              style={{ background:"linear-gradient(135deg, #3B82F6, #8B5CF6)" }}>
              {playing ? <Pause size={17} /> : <Play size={17} style={{ marginLeft:2 }} />}
            </button>

            {/* Step forward */}
            <button onClick={()=>setVisibleCount(c=>Math.min(c+1,totalCandles))}
              className="flex items-center justify-center w-8 h-8 rounded-full transition-all hover:bg-white/10"
              style={{ background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.1)" }}>
              <SkipForward size={14} />
            </button>

            {/* Speed */}
            <div className="flex items-center gap-2">
              <Gauge size={13} style={{ color:"#64748B" }} />
              <div className="flex gap-1">
                {[0.5,1,2,4,8].map(s=>(
                  <button key={s} onClick={()=>setSpeed(s)} className="px-2 py-1 rounded text-xs transition-colors"
                    style={{ background:speed===s?"rgba(59,130,246,0.2)":"rgba(255,255,255,0.06)",color:speed===s?"#60A5FA":"#64748B",fontWeight:500 }}>{s}x</button>
                ))}
              </div>
            </div>

            <button onClick={reset} className="text-xs px-3 py-1.5 rounded-lg transition-colors ml-auto flex items-center gap-1.5"
              style={{ background:"rgba(255,255,255,0.06)",color:"#64748B",border:"1px solid rgba(255,255,255,0.08)" }}>
              <RefreshCw size={11} /> Reset
            </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right Panel ── */}
      <div className="w-64 shrink-0 flex flex-col overflow-hidden" style={{ borderLeft:"1px solid rgba(255,255,255,0.07)" }}>
        <div className="flex" style={{ borderBottom:"1px solid rgba(255,255,255,0.06)" }}>
          {[["trade","Trade"],["coach","Coach"],["history","History"]].map(([t,l])=>(
            <button key={t} onClick={()=>setActiveTab(t)} className="flex-1 py-2.5 text-xs transition-colors"
              style={{ color:activeTab===t?"#60A5FA":"#64748B",borderBottom:activeTab===t?"2px solid #3B82F6":"2px solid transparent",fontWeight:500 }}>
              {l}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto">

          {/* ── Trade Tab ── */}
          {activeTab==="trade"&&(
            <div className="p-4 space-y-3">
              <div className="flex rounded-lg overflow-hidden" style={{ border:"1px solid rgba(255,255,255,0.1)" }}>
                <button onClick={()=>setSide("buy")} className="flex-1 py-2 text-sm transition-colors"
                  style={{ background:side==="buy"?"#26A69A":"transparent",color:side==="buy"?"white":"#64748B",fontWeight:600 }}>Buy</button>
                <button onClick={()=>setSide("sell")} className="flex-1 py-2 text-sm transition-colors"
                  style={{ background:side==="sell"?"#EF5350":"transparent",color:side==="sell"?"white":"#64748B",fontWeight:600 }}>Sell</button>
              </div>

              {[
                { label:"Size",        val:tradeSize, setter:setTradeSize, color:"default" },
                { label:"Stop Loss",   val:sl,        setter:setSl,        color:"red" },
                { label:"Take Profit", val:tp,        setter:setTp,        color:"green" },
              ].map(({ label,val,setter,color })=>(
                <div key={label}>
                  <label className="block text-xs mb-1" style={{ color:"#64748B" }}>{label}</label>
                  <input value={val} onChange={e=>setter(e.target.value)} className="w-full px-3 py-2 rounded-lg text-xs outline-none"
                    style={{ background:color==="red"?"rgba(239,83,80,0.08)":color==="green"?"rgba(38,166,154,0.08)":"rgba(255,255,255,0.06)",border:`1px solid ${color==="red"?"rgba(239,83,80,0.2)":color==="green"?"rgba(38,166,154,0.2)":"rgba(255,255,255,0.1)"}`,color:color==="red"?"#EF5350":color==="green"?"#26A69A":"white" }} />
                </div>
              ))}

              <div className="rounded-lg p-3 space-y-1.5" style={{ background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.06)" }}>
                <div className="text-xs mb-1.5" style={{ color:"#475569",fontWeight:600 }}>RISK PREVIEW</div>
                {[
                  { label:"Risk",    value:`-$${riskAmt.toFixed(0)}`,                         color:"#EF4444" },
                  { label:"Reward",  value:`+$${profitAmt.toFixed(0)}`,                       color:"#22C55E" },
                  { label:"R:R",     value:`1:${(profitAmt/(riskAmt||1)).toFixed(2)}`,        color:"#94A3B8" },
                  { label:"Risk %",  value:`${((riskAmt/25840)*100).toFixed(2)}%`,            color:riskAmt/25840>0.02?"#EF4444":"#F59E0B" },
                ].map(({ label,value,color })=>(
                  <div key={label} className="flex items-center justify-between text-xs">
                    <span style={{ color:"#64748B" }}>{label}</span>
                    <span style={{ fontWeight:600,color }}>{value}</span>
                  </div>
                ))}
              </div>

              <button onClick={placeTrade} className="w-full py-2.5 rounded-lg text-sm text-white hover:opacity-90 transition-all"
                style={{ background:side==="buy"?"linear-gradient(135deg,#26A69A,#10B981)":"linear-gradient(135deg,#EF5350,#DC2626)",fontWeight:600 }}>
                {side==="buy"?"Buy / Long":"Sell / Short"}
              </button>

              {/* Session stats */}
              <div className="rounded-lg p-3 space-y-1.5" style={{ background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.06)" }}>
                <div className="text-xs mb-1.5" style={{ color:"#475569",fontWeight:600 }}>SESSION STATS</div>
                {[
                  { label:"Trades",   value:String(sessionStats.trades),                                        color:"#94A3B8" },
                  { label:"Win Rate", value:sessionStats.trades?`${Math.round((sessionStats.wins/sessionStats.trades)*100)}%`:"—", color:"#22C55E" },
                  { label:"P&L",      value:sessionStats.pnl>=0?`+$${sessionStats.pnl.toFixed(0)}`:`-$${Math.abs(sessionStats.pnl).toFixed(0)}`, color:sessionStats.pnl>=0?"#22C55E":"#EF4444" },
                  { label:"Mistakes", value:String(visibleMistakes.length),                                    color:"#EF4444" },
                ].map(({ label,value,color })=>(
                  <div key={label} className="flex items-center justify-between text-xs">
                    <span style={{ color:"#64748B" }}>{label}</span>
                    <span style={{ fontWeight:600,color }}>{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Coach Tab ── */}
          {activeTab==="coach"&&(
            <div className="p-4 space-y-3">
              <div className="text-xs mb-1" style={{ color:"#64748B" }}>AI coaching feedback from your replay session.</div>

              {/* Session score */}
              <div className="rounded-xl p-3 text-center mb-2" style={{ background:"rgba(245,158,11,0.06)",border:"1px solid rgba(245,158,11,0.18)" }}>
                <div className="text-xs mb-1" style={{ color:"#94A3B8" }}>Session Score</div>
                <div style={{ fontSize:"2rem",fontWeight:800,color:"#F59E0B" }}>{SESSION_SCORE}</div>
                <div className="text-xs" style={{ color:"#64748B" }}>/ 100 — Fair</div>
                <div className="h-1.5 rounded-full overflow-hidden mt-2" style={{ background:"rgba(255,255,255,0.08)" }}>
                  <div className="h-full rounded-full" style={{ width:`${SESSION_SCORE}%`,background:"#F59E0B" }} />
                </div>
              </div>

              {/* Feedback items */}
              {coachFeedback.map(({ id,tradeNum,icon:Icon,color,msg })=>(
                <div key={id} className="rounded-xl p-3 cursor-pointer transition-all hover:opacity-90"
                  style={{ background:`${color}10`,border:`1px solid ${color}30` }}
                  onClick={()=>setActiveFeedback(activeFeedback===id?null:id)}>
                  <div className="flex items-start gap-2.5">
                    <Icon size={13} style={{ color,flexShrink:0,marginTop:1 }} />
                    <div className="flex-1">
                      <div className="text-xs mb-0.5" style={{ color,fontWeight:600 }}>Trade #{tradeNum}</div>
                      <p className="text-xs leading-relaxed" style={{ color }}>{msg}</p>
                    </div>
                  </div>
                </div>
              ))}

              {/* Mistake breakdown */}
              <div className="rounded-xl p-3 mt-1" style={{ background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.07)" }}>
                <div className="text-xs mb-2.5" style={{ color:"#64748B",fontWeight:600 }}>MISTAKE BREAKDOWN</div>
                {(Object.keys(mistakeBreakdown).length
                  ? Object.entries(mistakeBreakdown).map(([label, count]) => ({
                      label,
                      count,
                      color: label === "Early Entry" ? "#F59E0B" : "#EF4444",
                      pct: Math.round((count / Math.max(1, sessionTrades.length)) * 100),
                    }))
                  : [{ label: "No mistakes yet", count: 0, color: "#22C55E", pct: 0 }]).map(({ label,count,color,pct })=>(
                  <div key={label} className="mb-2">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-xs" style={{ color:"#94A3B8" }}>{label}</span>
                      <span className="text-xs px-1.5 py-0.5 rounded" style={{ background:`${color}15`,color,fontWeight:600 }}>{count}x</span>
                    </div>
                    <div className="h-1 rounded-full overflow-hidden" style={{ background:"rgba(255,255,255,0.06)" }}>
                      <div className="h-full rounded-full" style={{ width:`${pct}%`,background:color }} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Improvement tips */}
              <div className="rounded-xl p-3" style={{ background:"rgba(139,92,246,0.08)",border:"1px solid rgba(139,92,246,0.2)" }}>
                <div className="text-xs mb-2" style={{ color:"#A78BFA",fontWeight:600 }}>COACH RECOMMENDATIONS</div>
                {recommendations.map((tip,i)=>(
                  <div key={i} className="flex items-start gap-2 mb-1.5">
                    <span style={{ color:"#8B5CF6",fontWeight:700,fontSize:"0.7rem",marginTop:1 }}>{i+1}.</span>
                    <p className="text-xs leading-relaxed" style={{ color:"#C4B5FD" }}>{tip}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── History Tab ── */}
          {activeTab==="history"&&(
            <div className="p-4 space-y-2">
              <div className="text-xs mb-1" style={{ color:"#64748B" }}>Trades executed this session.</div>

              {/* Combine static + dynamic trades */}
              {sessionTrades.map((t,i)=>(
                <div key={t.id??i} className="p-3 rounded-xl" style={{ background:"rgba(255,255,255,0.04)",border:`1px solid ${t.ok||t.pnl?.startsWith("+")?"rgba(34,197,94,0.15)":"rgba(239,68,68,0.15)"}` }}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-1.5 py-0.5 rounded" style={{ background:t.side==="Long"?"rgba(34,197,94,0.12)":"rgba(239,68,68,0.12)",color:t.side==="Long"?"#4ADE80":"#F87171",fontWeight:600 }}>{t.side}</span>
                      {(t.mistake)&&<span className="text-xs px-1.5 py-0.5 rounded" style={{ background:"rgba(245,158,11,0.1)",color:"#F59E0B",fontSize:"0.62rem" }}>⚠ {t.mistake}</span>}
                    </div>
                    <span className="text-xs" style={{ fontWeight:700,color:(t.ok||t.pnl?.startsWith("+"))?"#22C55E":"#EF4444" }}>{t.pnl}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs" style={{ color:"#475569" }}>
                    <span>Entry {t.entry}</span>
                    <ChevronRight size={10} />
                    <span>Exit {t.exit}</span>
                  </div>
                </div>
              ))}

              {sessionTrades.length===0&&(
                <div className="text-center py-8 text-xs" style={{ color:"#475569" }}>No trades yet. Use the Trade tab to place orders.</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
