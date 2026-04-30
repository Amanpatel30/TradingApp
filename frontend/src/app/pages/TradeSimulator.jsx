import { useState, useEffect, useRef, useCallback } from "react";
import { CandlestickChart } from "../components/CandlestickChart";
import {
  ChevronDown, TrendingUp, TrendingDown, X, BarChart2, PenLine,
  ShieldAlert, Activity, Keyboard, AlertCircle, CheckCircle2,
  Maximize2, RefreshCw, ChevronUp,
} from "lucide-react";
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine,
} from "recharts";
import { useAppSession } from "../context/AppSession";
import { appApi } from "../lib/api";

/* ─── Data helpers ─── */
function generateCandles(count, startPrice) {
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const candles = [];
  let price = startPrice;
  for (let i = 0; i < count; i++) {
    const change = (Math.random() - 0.48) * price * 0.028;
    const open = price;
    const close = price + change;
    const high = Math.max(open, close) + Math.random() * price * 0.014;
    const low  = Math.min(open, close) - Math.random() * price * 0.014;
    candles.push({ open, high, low, close, time: `${months[Math.floor(i/4)%12]} W${(i%4)+1}` });
    price = close;
  }
  return candles;
}

const BASE_CANDLES = generateCandles(52, 42000);

const rsiData = BASE_CANDLES.slice(-24).map((c, i) => ({
  t: c.time,
  rsi: Math.max(15, Math.min(85, 45 + Math.sin(i * 0.6) * 28 + (Math.random() - 0.5) * 8)),
}));

const volumeData = BASE_CANDLES.slice(-24).map((c) => ({
  t: c.time, vol: 600 + Math.random() * 1400, up: c.close >= c.open,
}));

/* ─── Order-book seed ─── */
const BASE_ASK_PRICE = 67548;
const BASE_BID_PRICE = 67542;

function makeOrderBook() {
  return {
    asks: [
      { price: (BASE_ASK_PRICE + 64).toFixed(0), size: (Math.random()*1.5+0.1).toFixed(3), depthPct: Math.round(15+Math.random()*20) },
      { price: (BASE_ASK_PRICE + 50).toFixed(0), size: (Math.random()*1.5+0.1).toFixed(3), depthPct: Math.round(25+Math.random()*20) },
      { price: (BASE_ASK_PRICE + 27).toFixed(0), size: (Math.random()*1.5+0.1).toFixed(3), depthPct: Math.round(40+Math.random()*20) },
      { price: (BASE_ASK_PRICE + 12).toFixed(0), size: (Math.random()*1.5+0.1).toFixed(3), depthPct: Math.round(50+Math.random()*20) },
      { price: BASE_ASK_PRICE.toFixed(0),         size: (Math.random()*2+0.5).toFixed(3), depthPct: Math.round(65+Math.random()*20) },
    ],
    bids: [
      { price: BASE_BID_PRICE.toFixed(0),         size: (Math.random()*2+0.5).toFixed(3), depthPct: Math.round(65+Math.random()*20) },
      { price: (BASE_BID_PRICE - 12).toFixed(0),  size: (Math.random()*1.5+0.1).toFixed(3), depthPct: Math.round(45+Math.random()*20) },
      { price: (BASE_BID_PRICE - 25).toFixed(0),  size: (Math.random()*1.5+0.1).toFixed(3), depthPct: Math.round(35+Math.random()*20) },
      { price: (BASE_BID_PRICE - 38).toFixed(0),  size: (Math.random()*1.5+0.1).toFixed(3), depthPct: Math.round(25+Math.random()*20) },
      { price: (BASE_BID_PRICE - 55).toFixed(0),  size: (Math.random()*1.5+0.1).toFixed(3), depthPct: Math.round(15+Math.random()*20) },
    ],
  };
}

function genSale(id) {
  const prices = [67542,67544,67540,67546,67538,67550,67535,67552,67558,67530];
  const price = prices[Math.floor(Math.random()*prices.length)];
  const size = (Math.random()*2+0.05).toFixed(3);
  const up = Math.random() > 0.48;
  const now = new Date();
  const time = `${String(now.getHours()).padStart(2,"0")}:${String(now.getMinutes()).padStart(2,"0")}:${String(now.getSeconds()).padStart(2,"0")}`;
  return { id: id ?? Date.now()+Math.random(), price, size, up, time };
}

const INDICATORS = ["RSI (14)","MACD","Volume","EMA (20)","EMA (50)","MA (200)","Bollinger Bands","ATR"];
const DARK_TIP = { background:"#1F2937", border:"1px solid #374151", borderRadius:8, fontSize:11, color:"#F8FAFC" };
const BUILT_IN_STRATEGIES = ["Breakout","Trend Follow","RSI Reversal","MA Cross","Support Bounce","VWAP","Other"];

/* ─── Sub-panels ─── */
function RsiPanel({ data }) {
  const last = data[data.length-1]?.rsi;
  const color = last>70?"#EF4444":last<30?"#22C55E":"#94A3B8";
  return (
    <div style={{ height:85 }}>
      <div className="flex items-center justify-between px-3 py-1" style={{ borderBottom:"1px solid rgba(255,255,255,0.06)" }}>
        <span style={{ color:"#64748B", fontWeight:600, fontSize:"0.68rem" }}>RSI (14)</span>
        <span style={{ fontSize:"0.68rem", fontWeight:700, color }}>{last?.toFixed(1)}</span>
      </div>
      <ResponsiveContainer width="100%" height={60}>
        <LineChart data={data} margin={{ top:4,right:8,left:0,bottom:0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
          <XAxis dataKey="t" hide /><YAxis domain={[0,100]} tick={{ fill:"#475569",fontSize:8 }} axisLine={false} tickLine={false} width={22} ticks={[30,50,70]} />
          <Tooltip contentStyle={DARK_TIP} formatter={(v)=>[v.toFixed(1),"RSI"]} />
          <ReferenceLine key="rl-70" y={70} stroke="#EF4444" strokeDasharray="3 3" strokeWidth={1} />
          <ReferenceLine key="rl-30" y={30} stroke="#22C55E" strokeDasharray="3 3" strokeWidth={1} />
          <Line type="monotone" dataKey="rsi" stroke="#8B5CF6" strokeWidth={1.5} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function VolumePanel({ data }) {
  return (
    <div style={{ height:70 }}>
      <div className="px-3 py-1" style={{ borderBottom:"1px solid rgba(255,255,255,0.06)" }}>
        <span style={{ color:"#64748B", fontWeight:600, fontSize:"0.68rem" }}>Volume</span>
      </div>
      <ResponsiveContainer width="100%" height={48}>
        <BarChart data={data} margin={{ top:3,right:8,left:0,bottom:0 }}>
          <XAxis dataKey="t" hide /><YAxis hide />
          <Tooltip contentStyle={DARK_TIP} formatter={(v)=>[(v/1000).toFixed(1)+"K","Vol"]} />
          <Bar dataKey="vol" radius={[1,1,0,0]} fill="#3B82F6" fillOpacity={0.7} isAnimationActive={false}>
            {data.map((d,i)=>(
              <Cell key={`vol-${i}`} fill={d.up?"rgba(34,197,94,0.7)":"rgba(239,68,68,0.7)"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function PositionViz({ entry, sl, tp }) {
  const eN=parseFloat(entry)||67542, slN=parseFloat(sl)||65000, tpN=parseFloat(tp)||70000;
  const minP=Math.min(eN,slN,tpN)*0.998, maxP=Math.max(eN,slN,tpN)*1.002, range=maxP-minP;
  const toY=(p)=>((maxP-p)/range)*100;
  const eY=toY(eN), slY=toY(slN), tpY=toY(tpN);
  return (
    <div style={{ position:"relative", height:80, background:"rgba(0,0,0,0.15)", borderTop:"1px solid rgba(255,255,255,0.06)", flexShrink:0 }}>
      <svg width="100%" height="100%" style={{ position:"absolute",inset:0 }}>
        <rect x="0" y={`${Math.min(tpY,eY)}%`} width="100%" height={`${Math.abs(tpY-eY)}%`} fill="rgba(34,197,94,0.07)" />
        <rect x="0" y={`${Math.min(eY,slY)}%`} width="100%" height={`${Math.abs(eY-slY)}%`} fill="rgba(239,68,68,0.07)" />
        <line x1="0" y1={`${tpY}%`} x2="100%" y2={`${tpY}%`} stroke="#22C55E" strokeWidth="1" strokeDasharray="6 4" />
        <line x1="0" y1={`${eY}%`}  x2="100%" y2={`${eY}%`}  stroke="#F59E0B" strokeWidth="1.5" />
        <line x1="0" y1={`${slY}%`} x2="100%" y2={`${slY}%`} stroke="#EF4444" strokeWidth="1" strokeDasharray="6 4" />
        <text x="8" y={`${tpY}%`} dy="-3" fill="#22C55E" fontSize="8" fontWeight="700">TP ${tpN.toLocaleString()}</text>
        <text x="8" y={`${eY}%`}  dy="-3" fill="#F59E0B" fontSize="8" fontWeight="700">Entry ${eN.toLocaleString()}</text>
        <text x="8" y={`${slY}%`} dy="-3" fill="#EF4444" fontSize="8" fontWeight="700">SL ${slN.toLocaleString()}</text>
      </svg>
    </div>
  );
}

/* ─── Modify-position modal ─── */
function ModifyModal({ position, onClose, onSave }) {
  const [sl, setSl] = useState(String(position.sl));
  const [tp, setTp] = useState(String(position.tp));
  const [trailing, setTrailing] = useState(position.trailing ?? false);
  const [trailDist, setTrailDist] = useState(String(position.trailDist ?? 500));
  return (
    <div style={{ position:"fixed",inset:0,zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,0.6)" }}
      onClick={onClose}>
      <div style={{ background:"#1E2937",border:"1px solid #374151",borderRadius:16,padding:24,width:300,boxShadow:"0 24px 64px rgba(0,0,0,0.5)" }}
        onClick={e=>e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <span style={{ color:"white",fontWeight:700 }}>Modify Position</span>
          <button onClick={onClose}><X size={15} style={{ color:"#64748B" }} /></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="block text-xs mb-1" style={{ color:"#64748B" }}>Stop Loss</label>
            <input value={sl} onChange={e=>setSl(e.target.value)} className="w-full px-3 py-2 rounded-lg text-xs outline-none"
              style={{ background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.25)",color:"#EF4444" }} />
          </div>
          <div>
            <label className="block text-xs mb-1" style={{ color:"#64748B" }}>Take Profit</label>
            <input value={tp} onChange={e=>setTp(e.target.value)} className="w-full px-3 py-2 rounded-lg text-xs outline-none"
              style={{ background:"rgba(34,197,94,0.06)",border:"1px solid rgba(34,197,94,0.25)",color:"#22C55E" }} />
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg" style={{ background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)" }}>
            <div>
              <div className="text-xs" style={{ color:"white",fontWeight:600 }}>Trailing Stop</div>
              <div className="text-xs" style={{ color:"#64748B" }}>Auto-adjusts SL with price</div>
            </div>
            <button onClick={()=>setTrailing(v=>!v)} className="w-10 h-5 rounded-full transition-all relative"
              style={{ background:trailing?"#22C55E":"rgba(255,255,255,0.1)" }}>
              <span className="absolute top-0.5 transition-all" style={{ left:trailing?"calc(100% - 18px)":"2px", width:16,height:16,borderRadius:"50%",background:"white",display:"block" }} />
            </button>
          </div>
          {trailing && (
            <div>
              <label className="block text-xs mb-1" style={{ color:"#64748B" }}>Trail Distance (USD)</label>
              <input value={trailDist} onChange={e=>setTrailDist(e.target.value)} className="w-full px-3 py-2 rounded-lg text-xs outline-none"
                style={{ background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",color:"white" }} />
            </div>
          )}
        </div>
        <div className="flex gap-2 mt-4">
          <button onClick={onClose} className="flex-1 py-2 rounded-lg text-xs" style={{ background:"rgba(255,255,255,0.06)",color:"#94A3B8",border:"1px solid rgba(255,255,255,0.1)" }}>Cancel</button>
          <button onClick={()=>onSave({ sl:parseFloat(sl), tp:parseFloat(tp), trailing, trailDist:parseFloat(trailDist) })}
            className="flex-1 py-2 rounded-lg text-xs text-white" style={{ background:"linear-gradient(135deg,#3B82F6,#8B5CF6)",fontWeight:600 }}>
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Trade Review Toast ─── */
function TradeReviewToast({ review, onClose }) {
  useEffect(()=>{
    const t = setTimeout(onClose, 7000);
    return ()=>clearTimeout(t);
  },[onClose]);
  return (
    <div style={{ position:"fixed",bottom:24,right:24,zIndex:300,width:320,background:"#1E2937",border:"1px solid #374151",borderRadius:16,padding:20,boxShadow:"0 24px 64px rgba(0,0,0,0.5)" }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Activity size={14} style={{ color:"#8B5CF6" }} />
          <span style={{ color:"white",fontWeight:700,fontSize:"0.8rem" }}>Trade Review — #{review.tradeNum}</span>
        </div>
        <button onClick={onClose}><X size={13} style={{ color:"#64748B" }} /></button>
      </div>
      <div className="space-y-1.5 mb-3">
        {[
          { label:"Entry Timing", value:review.entryTiming, good:review.entryTiming==="Good" },
          { label:"SL Placement", value:review.slPlacement, good:review.slPlacement==="Correct" },
          { label:"Exit Timing", value:review.exitTiming, good:review.exitTiming==="On target" },
        ].map(({ label,value,good })=>(
          <div key={label} className="flex items-center justify-between text-xs">
            <span style={{ color:"#64748B" }}>{label}:</span>
            <span style={{ color:good?"#22C55E":"#F59E0B",fontWeight:600 }}>{value}</span>
          </div>
        ))}
      </div>
      <div className="p-3 rounded-xl text-xs leading-relaxed" style={{ background:"rgba(139,92,246,0.08)",border:"1px solid rgba(139,92,246,0.2)",color:"#C4B5FD" }}>
        💡 {review.recommendation}
      </div>
    </div>
  );
}

/* ─── Hotkey badge ─── */
function HotkeyBadge({ children }) {
  return (
    <span style={{ display:"inline-flex",alignItems:"center",justifyContent:"center",minWidth:18,height:18,borderRadius:4,background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.12)",color:"#94A3B8",fontSize:"0.6rem",fontWeight:700,padding:"0 3px" }}>
      {children}
    </span>
  );
}

function toDisplayPair(symbol) {
  return symbol.endsWith("USDT") ? symbol.replace("USDT", "/USDT") : symbol;
}

function toMarketInterval(timeframe) {
  return String(timeframe || "4H").toLowerCase();
}

function formatMarketVolume(value) {
  const numeric = Number(value || 0);
  if (!numeric) {
    return "—";
  }

  if (numeric >= 1_000_000_000) {
    return `$${(numeric / 1_000_000_000).toFixed(1)}B`;
  }

  if (numeric >= 1_000_000) {
    return `$${(numeric / 1_000_000).toFixed(1)}M`;
  }

  if (numeric >= 1_000) {
    return `$${(numeric / 1_000).toFixed(1)}K`;
  }

  return `$${numeric.toFixed(0)}`;
}

function toPosition(order, marketPrice) {
  const entryPrice = Number(order.price || order.limitPrice || marketPrice || 0);
  const isLong = order.side === "BUY";
  const liveMarkPrice = Number(order.currentPrice || marketPrice || entryPrice || 0);
  const sl = Number(
    order.stopLoss ||
      (entryPrice * (isLong ? 0.97 : 1.03)).toFixed(2),
  );
  const tp = Number(
    order.takeProfit ||
      (entryPrice * (isLong ? 1.05 : 0.95)).toFixed(2),
  );

  return {
    id: order.id,
    entityType: order.entityType || "ORDER",
    pair: toDisplayPair(order.symbol),
    side: isLong ? "Long" : "Short",
    sizeNum: Number(order.quantity),
    entryPrice,
    markPrice: liveMarkPrice,
    sl,
    tp,
    trailing: false,
    trailDist: 0,
    leverage: 1,
    status: order.status || "OPEN",
    strategy: order.strategy || "Unlabeled",
  };
}

function toClosedTrade(trade) {
  return {
    id: trade.tradeId,
    pair: toDisplayPair(trade.symbol),
    side: trade.side === "BUY" ? "Long" : "Short",
    entryPrice: Number(trade.limitPrice || trade.price || 0),
    closePrice: Number(trade.price || 0),
    pnl: Number(trade.realizedPnL || 0),
    strategy: trade.strategy || "Unlabeled",
  };
}

/* ═══════════════════════════════ MAIN COMPONENT ═══════════════════════════════ */
export function TradeSimulator() {
  const { accessToken, user } = useAppSession();
  const [side, setSide] = useState("buy");
  const [orderType, setOrderType] = useState("limit");
  const [size, setSize] = useState("0.01");
  const [price, setPrice] = useState("67542");
  const [hasCustomPrice, setHasCustomPrice] = useState(false);
  const [stopLoss, setStopLoss] = useState("65000");
  const [takeProfit, setTakeProfit] = useState("70000");
  const [strategy, setStrategy] = useState("Breakout");
  const [availableStrategies, setAvailableStrategies] = useState(BUILT_IN_STRATEGIES);
  const [confidence, setConfidence] = useState("75");
  const [reason, setReason] = useState("");
  const [activeTab, setActiveTab] = useState("positions");
  const [activeTf, setActiveTf] = useState("4H");
  const [rightTab, setRightTab] = useState("order");
  const [activeIndicators, setActiveIndicators] = useState(["RSI (14)","Volume"]);
  const [showIndMenu, setShowIndMenu] = useState(false);
  const [orderBook, setOrderBook] = useState({ asks: [], bids: [] });
  const [sales, setSales] = useState([]);
  const [flashRows, setFlashRows] = useState({});
  const [positions, setPositions] = useState([]);
  const [closedTrades, setClosedTrades] = useState([]);
  const [modifyTarget, setModifyTarget] = useState(null);
  const [tradeReview, setTradeReview] = useState(null);
  const [hotkeysVisible, setHotkeysVisible] = useState(false);
  const [notification, setNotification] = useState(null);
  const [portfolioBalance, setPortfolioBalance] = useState(0);
  const [simulatorMarket, setSimulatorMarket] = useState({
    candles: [],
    rsiData: [],
    volumeData: [],
  });
  const [pageError, setPageError] = useState("");
  const [marketStatus, setMarketStatus] = useState({
    feedStatus: "DISCONNECTED",
    tradingEnabled: false,
    tradingDisabledReason: "Trading disabled while the live system status is loading.",
  });
  const [marketSnapshot, setMarketSnapshot] = useState({
    symbol: "BTCUSDT",
    price: 0,
    high: 0,
    low: 0,
    volume: 0,
    changePercent: 0,
  });
  const tradeCountRef = useRef(0);

  useEffect(() => {
    const entryPrice = parseFloat(price) || marketSnapshot.price || 0;
    if (!entryPrice) {
      return;
    }

    const nextStop =
      side === "buy"
        ? Number((entryPrice * 0.97).toFixed(2))
        : Number((entryPrice * 1.03).toFixed(2));
    const nextTakeProfit =
      side === "buy"
        ? Number((entryPrice * 1.05).toFixed(2))
        : Number((entryPrice * 0.95).toFixed(2));
    const currentStop = parseFloat(stopLoss);
    const currentTakeProfit = parseFloat(takeProfit);
    const stopInvalid =
      !currentStop || (side === "buy" ? currentStop >= entryPrice : currentStop <= entryPrice);
    const takeProfitInvalid =
      !currentTakeProfit ||
      (side === "buy" ? currentTakeProfit <= entryPrice : currentTakeProfit >= entryPrice);

    if (stopInvalid) {
      setStopLoss(String(nextStop));
    }

    if (takeProfitInvalid) {
      setTakeProfit(String(nextTakeProfit));
    }
  }, [marketSnapshot.price, price, side, stopLoss, takeProfit]);

  useEffect(() => {
    if (orderType === "market" && marketSnapshot.price) {
      const livePrice = Number(marketSnapshot.price);
      setPrice(String(Math.round(livePrice)));
      setStopLoss(
        String(
          Number(
            (side === "buy" ? livePrice * 0.97 : livePrice * 1.03).toFixed(2),
          ),
        ),
      );
      setTakeProfit(
        String(
          Number(
            (side === "buy" ? livePrice * 1.05 : livePrice * 0.95).toFixed(2),
          ),
        ),
      );
      setHasCustomPrice(false);
    }
  }, [marketSnapshot.price, orderType, side]);

  useEffect(() => {
    let cancelled = false;

    async function loadStrategies() {
      if (!accessToken) {
        setAvailableStrategies((current) =>
          Array.from(new Set([...current, ...BUILT_IN_STRATEGIES, strategy].filter(Boolean))),
        );
        return;
      }

      try {
        const response = await appApi.getStrategies(accessToken);
        if (cancelled) {
          return;
        }

        const savedStrategyNames = (response?.strategies || [])
          .map((item) => String(item?.name || "").trim())
          .filter(Boolean);

        setAvailableStrategies(
          Array.from(
            new Set([...savedStrategyNames, ...BUILT_IN_STRATEGIES, strategy].filter(Boolean)),
          ),
        );
      } catch {
        if (!cancelled) {
          setAvailableStrategies((current) =>
            Array.from(new Set([...current, ...BUILT_IN_STRATEGIES, strategy].filter(Boolean))),
          );
        }
      }
    }

    loadStrategies();
    window.addEventListener("focus", loadStrategies);
    window.addEventListener("app:strategies-updated", loadStrategies);

    return () => {
      cancelled = true;
      window.removeEventListener("focus", loadStrategies);
      window.removeEventListener("app:strategies-updated", loadStrategies);
    };
  }, [accessToken, strategy]);

  const showDemoFallback =
    Boolean(user?.demoDataFallbackEnabled) &&
    Boolean(pageError) &&
    !simulatorMarket.candles.length;
  const demoMarketSnapshot = {
    symbol: marketSnapshot.symbol || "BTCUSDT",
    price: Number(BASE_CANDLES[BASE_CANDLES.length - 1]?.close || 67542),
    high: Number(BASE_CANDLES[BASE_CANDLES.length - 1]?.high || 68170),
    low: Number(BASE_CANDLES[BASE_CANDLES.length - 1]?.low || 66971),
    volume: 820000,
    changePercent: 1.42,
  };
  const displayMarketSnapshot = marketSnapshot.price
    ? marketSnapshot
    : showDemoFallback
      ? demoMarketSnapshot
      : marketSnapshot;
  const displaySimulatorMarket = {
    candles: simulatorMarket.candles.length ? simulatorMarket.candles : showDemoFallback ? BASE_CANDLES : [],
    rsiData: simulatorMarket.rsiData.length ? simulatorMarket.rsiData : showDemoFallback ? rsiData : [],
    volumeData: simulatorMarket.volumeData.length ? simulatorMarket.volumeData : showDemoFallback ? volumeData : [],
  };
  const displayOrderBook =
    orderBook.asks?.length || orderBook.bids?.length
      ? orderBook
      : showDemoFallback
        ? makeOrderBook()
        : { asks: [], bids: [] };
  const displaySales = sales.length
    ? sales
    : showDemoFallback
      ? Array.from({ length: 8 }, (_, index) => genSale(index + 1))
      : [];

  const showNotif = (msg, type="success") => {
    setNotification({ msg, type });
    setTimeout(()=>setNotification(null), 2500);
  };

  const loadSimulatorData = useCallback(async () => {
    if (!accessToken) {
      return;
    }

    try {
      setPageError("");
      const results = await Promise.allSettled([
        appApi.getMarketOverview({
          symbol: marketSnapshot.symbol,
          interval: toMarketInterval(activeTf),
          limit: 52,
        }),
        appApi.getMarketTickers(),
        appApi.getOpenOrders(accessToken),
        appApi.getTradeHistory(accessToken),
        appApi.getPortfolio(accessToken),
      ]);

      const [
        marketOverviewResult,
        marketResult,
        openOrdersResult,
        tradeHistoryResult,
        portfolioResult,
      ] = results;

      const marketOverview =
        marketOverviewResult.status === "fulfilled" ? marketOverviewResult.value : null;
      const marketData =
        marketResult.status === "fulfilled" ? marketResult.value : null;
      const openOrdersData =
        openOrdersResult.status === "fulfilled" ? openOrdersResult.value : null;
      const tradeHistoryData =
        tradeHistoryResult.status === "fulfilled" ? tradeHistoryResult.value : null;
      const portfolioData =
        portfolioResult.status === "fulfilled" ? portfolioResult.value : null;

      const btcTicker =
        marketData?.tickers?.find((ticker) => ticker.symbol === marketSnapshot.symbol) ||
        marketData?.tickers?.[0];

      const nextPrice = Number(
        marketOverview?.marketSnapshot?.price ||
          btcTicker?.price ||
          marketSnapshot.price ||
          0,
      );

      if (marketOverview?.marketSnapshot || btcTicker) {
        setMarketSnapshot({
          symbol:
            marketOverview?.marketSnapshot?.symbol ||
            btcTicker?.symbol ||
            "BTCUSDT",
          price: nextPrice,
          high: Number(
            marketOverview?.marketSnapshot?.high ||
              btcTicker?.high ||
              marketSnapshot.high ||
              nextPrice,
          ),
          low: Number(
            marketOverview?.marketSnapshot?.low ||
              btcTicker?.low ||
              marketSnapshot.low ||
              nextPrice,
          ),
          volume: Number(
            marketOverview?.marketSnapshot?.volume ||
              btcTicker?.volume ||
              marketSnapshot.volume ||
              0,
          ),
          changePercent: Number(
            marketOverview?.marketSnapshot?.changePercent ||
              btcTicker?.changePercent ||
              marketSnapshot.changePercent ||
              0,
          ),
        });
      }

      if (marketOverview) {
        setSimulatorMarket({
          candles: marketOverview.candles || [],
          rsiData: marketOverview.rsiData || [],
          volumeData: marketOverview.volumeData || [],
        });
        setOrderBook(marketOverview.orderBook || { asks: [], bids: [] });
        setSales(marketOverview.sales || []);

        const flash = {};
        [
          ...(marketOverview.orderBook?.asks || []).map((_, index) => `a${index}`),
          ...(marketOverview.orderBook?.bids || []).map((_, index) => `b${index}`),
        ].forEach((key) => {
          flash[key] = true;
        });
        setFlashRows(flash);
        window.setTimeout(() => setFlashRows({}), 300);
      }

      if (openOrdersData) {
        const orders = Array.isArray(openOrdersData)
          ? openOrdersData
          : openOrdersData.orders || [];
        setPositions(
          orders.map((order) => toPosition(order, nextPrice)),
        );
      }

      if (tradeHistoryData) {
        setClosedTrades((tradeHistoryData.trades || []).map(toClosedTrade));
      }

      if (portfolioData) {
        setPortfolioBalance(
          Number(portfolioData.totalPortfolioValue || 0),
        );
      }

      if (nextPrice && (orderType === "market" || !hasCustomPrice || !price)) {
        setPrice(String(Math.round(Number(nextPrice))));
      }

      const failedCount = results.filter(
        (result) => result.status === "rejected",
      ).length;

      if (failedCount > 0) {
        setPageError(
          failedCount === results.length
            ? "Unable to load simulator market data."
            : "Some simulator modules are temporarily unavailable.",
        );
      }
    } catch (error) {
      setPageError(error.message || "Unable to load simulator data.");
    }
  }, [accessToken, activeTf, hasCustomPrice, marketSnapshot.symbol, orderType, price]);

  useEffect(() => {
    loadSimulatorData();
    const fallbackIntervalId = window.setInterval(loadSimulatorData, 60000);
    return () => window.clearInterval(fallbackIntervalId);
  }, [loadSimulatorData]);

  useEffect(() => {
    const handleTradingEvent = () => {
      loadSimulatorData();
    };

    const handlePriceUpdate = (event) => {
      const payload = event.detail || {};
      if (String(payload.symbol || "").toUpperCase() !== marketSnapshot.symbol) {
        return;
      }

      setMarketSnapshot((current) => ({
        ...current,
        symbol: payload.symbol || current.symbol,
        price: Number(payload.price || current.price || 0),
        high: Number(payload.high || current.high || 0),
        low: Number(payload.low || current.low || 0),
        volume: Number(payload.volume || current.volume || 0),
        changePercent: Number(payload.changePercent || current.changePercent || 0),
      }));
    };

    const handleMarketStatus = (event) => {
      setMarketStatus(event.detail || {
        feedStatus: "DISCONNECTED",
        tradingEnabled: false,
        tradingDisabledReason: "",
      });
    };

    window.addEventListener("app:trading-event", handleTradingEvent);
    window.addEventListener("app:portfolio-updated", handleTradingEvent);
    window.addEventListener("app:price-update", handlePriceUpdate);
    window.addEventListener("app:market-status", handleMarketStatus);

    return () => {
      window.removeEventListener("app:trading-event", handleTradingEvent);
      window.removeEventListener("app:portfolio-updated", handleTradingEvent);
      window.removeEventListener("app:price-update", handlePriceUpdate);
      window.removeEventListener("app:market-status", handleMarketStatus);
    };
  }, [loadSimulatorData, marketSnapshot.symbol]);

  const submitOrder = useCallback(async (forceSide) => {
    const tradeSide = forceSide ?? side;
    const quantity = Number(size);
    const limitPrice = Number(price);

    if (!accessToken) {
      showNotif("Please sign in to place orders", "warn");
      return;
    }

    if (!quantity || quantity <= 0) {
      showNotif("Enter a valid order size", "warn");
      return;
    }

    if (!marketStatus.tradingEnabled) {
      showNotif(marketStatus.tradingDisabledReason || "Trading is currently disabled", "warn");
      return;
    }

    try {
      const clientOrderId =
        typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
          ? crypto.randomUUID()
          : `order-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

      if (orderType === "market") {
        const response = await appApi.placeMarketOrder(accessToken, {
          symbol: marketSnapshot.symbol,
          side: tradeSide === "buy" ? "BUY" : "SELL",
          quantity,
          strategy,
          stopLoss: Number(stopLoss),
          takeProfit: Number(takeProfit),
          clientOrderId,
        });

        showNotif(
          `${tradeSide === "buy" ? "Buy" : "Sell"} market order filled at $${Number(
            response.order.price,
          ).toLocaleString()}`,
        );
        setActiveTab("history");
      } else {
        if (!limitPrice || limitPrice <= 0) {
          showNotif("Enter a valid limit price", "warn");
          return;
        }

        await appApi.placeLimitOrder(accessToken, {
          symbol: marketSnapshot.symbol,
          side: tradeSide === "buy" ? "BUY" : "SELL",
          quantity,
          limitPrice,
          strategy,
          stopLoss: Number(stopLoss),
          takeProfit: Number(takeProfit),
          clientOrderId,
        });

        showNotif(
          `${tradeSide === "buy" ? "Buy" : "Sell"} limit order placed`,
        );
        setActiveTab("positions");
      }

      await loadSimulatorData();
    } catch (error) {
      showNotif(error.message || "Order placement failed", "warn");
    }
  }, [
    accessToken,
    loadSimulatorData,
    marketSnapshot.symbol,
    orderType,
    price,
    side,
    size,
    strategy,
    marketStatus.tradingDisabledReason,
    marketStatus.tradingEnabled,
  ]);

  /* ─── Hotkeys ─── */
  const executeTrade = useCallback((tradeSide)=>{
    setSide(tradeSide);
    submitOrder(tradeSide);
  },[submitOrder]);

  const closeAllPositions = useCallback(async ()=>{
    if(!positions.length){
      showNotif("No open positions","warn");
      return;
    }

    try {
      await Promise.all(
        positions.map((position) => appApi.cancelOrder(accessToken, position.id)),
      );
      showNotif(`${positions.length} order(s) cancelled`);
      await loadSimulatorData();
    } catch (error) {
      showNotif(error.message || "Unable to cancel open orders", "warn");
    }
  },[accessToken, loadSimulatorData, positions]);

  useEffect(()=>{
    const handler = (e)=>{
      if(["INPUT","TEXTAREA","SELECT"].includes(e.target.tagName)) return;
      if(e.key==="b"||e.key==="B") executeTrade("buy");
      if(e.key==="s"||e.key==="S") executeTrade("sell");
      if(e.key==="c"||e.key==="C") closeAllPositions();
    };
    window.addEventListener("keydown",handler);
    return ()=>window.removeEventListener("keydown",handler);
  },[executeTrade,closeAllPositions]);

  const generateTradeReview = (pos)=>{
    const reviews = [
      { entryTiming:"Early", slPlacement:"Correct", exitTiming:"On target", recommendation:"Wait for the breakout candle to close before entering. Early entries increase risk of fakeouts." },
      { entryTiming:"Good", slPlacement:"Correct", exitTiming:"Premature", recommendation:"You exited before the target was hit. Trust your plan — let winners run to the TP." },
      { entryTiming:"Good", slPlacement:"Too tight", exitTiming:"On target", recommendation:"Your SL was placed too close to the entry. Structure-based stops reduce noise-stop outs." },
      { entryTiming:"Good", slPlacement:"Correct", exitTiming:"On target", recommendation:"Clean execution. Risk:Reward was solid. Keep building this consistency." },
    ];
    tradeCountRef.current += 1;
    setTradeReview({ ...reviews[tradeCountRef.current % reviews.length], tradeNum: tradeCountRef.current });
  };

  const partialClose=(posId, frac)=>{
    showNotif("Partial close is only available for live positions", "warn");
  };

  const closePosition=async(posId)=>{
    try {
      await appApi.cancelOrder(accessToken, posId);
      showNotif("Open order cancelled");
      await loadSimulatorData();
    } catch (error) {
      showNotif(error.message || "Unable to cancel order", "warn");
    }
  };

  const saveModify=(changes)=>{
    setPositions(prev=>prev.map(p=>p.id===modifyTarget?.id?{...p,...changes}:p));
    setModifyTarget(null);
    showNotif("Position updated");
  };

  const toggleIndicator=(ind)=>setActiveIndicators(prev=>prev.includes(ind)?prev.filter(i=>i!==ind):[...prev,ind]);

  const ep=parseFloat(price)||displayMarketSnapshot.price||0, sl=parseFloat(stopLoss)||0, tp=parseFloat(takeProfit)||0;
  const sn=parseFloat(size)||0.1, balance=Math.max(1, portfolioBalance);
  const riskAmt=Math.abs(ep-sl)*sn, profitAmt=Math.abs(tp-ep)*sn;
  const riskPct=(riskAmt/balance*100).toFixed(2);
  const rrRatio=(profitAmt/(riskAmt||1)).toFixed(2);
  const markPrice=displayMarketSnapshot.price || 0;
  const bestAsk = displayOrderBook.asks?.[displayOrderBook.asks.length-1]?.price || displayMarketSnapshot.price || 0;
  const bestBid = displayOrderBook.bids?.[0]?.price || displayMarketSnapshot.price || 0;
  const spreadValue = Math.max(0, bestAsk - bestBid);

  return (
    <div className="flex flex-col h-full" style={{ background:"#0B0F19",fontFamily:"Inter, sans-serif",color:"white" }}>

      {/* Notification */}
      {notification && (
        <div style={{ position:"fixed",top:16,right:16,zIndex:400,padding:"10px 16px",borderRadius:10,background:notification.type==="warn"?"rgba(245,158,11,0.15)":"rgba(34,197,94,0.12)",border:`1px solid ${notification.type==="warn"?"rgba(245,158,11,0.3)":"rgba(34,197,94,0.3)"}`,color:notification.type==="warn"?"#F59E0B":"#22C55E",fontWeight:600,fontSize:"0.78rem",display:"flex",alignItems:"center",gap:8,boxShadow:"0 8px 32px rgba(0,0,0,0.4)" }}>
          <CheckCircle2 size={13} />{notification.msg}
        </div>
      )}

      {/* Trade review toast */}
      {tradeReview && <TradeReviewToast review={tradeReview} onClose={()=>setTradeReview(null)} />}

      {/* Modify modal */}
      {modifyTarget && <ModifyModal position={modifyTarget} onClose={()=>setModifyTarget(null)} onSave={saveModify} />}

      {/* Hotkey guide */}
      {hotkeysVisible && (
        <div style={{ position:"fixed",top:60,right:16,zIndex:300,background:"#1E2937",border:"1px solid #374151",borderRadius:12,padding:16,width:220,boxShadow:"0 12px 40px rgba(0,0,0,0.5)" }}>
          <div className="flex items-center justify-between mb-3">
            <span style={{ color:"white",fontWeight:700,fontSize:"0.78rem" }}>Hotkeys</span>
            <button onClick={()=>setHotkeysVisible(false)}><X size={12} style={{ color:"#64748B" }} /></button>
          </div>
          {[["B","Buy / Long"],["S","Sell / Short"],["C","Close all positions"]].map(([k,d])=>(
            <div key={k} className="flex items-center justify-between mb-2 text-xs">
              <HotkeyBadge>{k}</HotkeyBadge>
              <span style={{ color:"#94A3B8" }}>{d}</span>
            </div>
          ))}
          <p className="text-xs mt-2" style={{ color:"#475569" }}>Focus the chart area (not an input) before using hotkeys.</p>
        </div>
      )}

      {/* ── Top Bar ── */}
      <div className="flex items-center gap-3 px-4 py-2 shrink-0" style={{ borderBottom:"1px solid #1F2937",background:"#111827" }}>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm cursor-pointer" style={{ background:"rgba(255,255,255,0.06)",border:"1px solid #1F2937" }}>
          <span className="w-4 h-4 rounded-full inline-flex items-center justify-center text-xs" style={{ background:"#F7931A",fontWeight:700 }}>₿</span>
          <span style={{ fontWeight:600 }}>{toDisplayPair(displayMarketSnapshot.symbol)}</span>
          <ChevronDown size={13} className="text-gray-400" />
        </div>
        <div style={{ fontWeight:700,fontSize:"0.95rem" }}>${displayMarketSnapshot.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
        <div style={{ color:displayMarketSnapshot.changePercent >= 0 ? "#22C55E" : "#EF4444",fontWeight:500,fontSize:"0.8rem" }}>
          {displayMarketSnapshot.changePercent >= 0 ? "+" : ""}{displayMarketSnapshot.changePercent.toFixed(2)}%
        </div>
        <div className="hidden lg:flex items-center gap-4 text-xs" style={{ color:"#475569" }}>
          <span>H <span style={{ color:"#22C55E" }}>${displayMarketSnapshot.high.toLocaleString()}</span></span>
          <span>L <span style={{ color:"#EF4444" }}>${displayMarketSnapshot.low.toLocaleString()}</span></span>
          <span>Vol <span style={{ color:"#94A3B8" }}>{formatMarketVolume(displayMarketSnapshot.volume)}</span></span>
          <span>Move <span style={{ color:displayMarketSnapshot.changePercent >= 0 ? "#22C55E" : "#EF4444" }}>{displayMarketSnapshot.changePercent >= 0 ? "+" : ""}{displayMarketSnapshot.changePercent.toFixed(2)}%</span></span>
          <span>Pair <span style={{ color:"#22C55E" }}>{toDisplayPair(displayMarketSnapshot.symbol)}</span></span>
        </div>

        {/* TF buttons */}
        <div className="flex items-center gap-0.5 ml-auto">
          {["1m","5m","15m","1H","4H","1D","1W"].map((tf)=>(
            <button key={tf} onClick={()=>setActiveTf(tf)} className="px-2 py-1 rounded text-xs transition-colors"
              style={{ background:activeTf===tf?"rgba(59,130,246,0.15)":"transparent",color:activeTf===tf?"#60A5FA":"#64748B",fontWeight:500 }}>{tf}</button>
          ))}
        </div>

        {/* Hotkey btn */}
        <button onClick={()=>setHotkeysVisible(v=>!v)} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs ml-2" style={{ background:hotkeysVisible?"rgba(139,92,246,0.15)":"rgba(255,255,255,0.05)",border:`1px solid ${hotkeysVisible?"rgba(139,92,246,0.3)":"rgba(255,255,255,0.08)"}`,color:hotkeysVisible?"#A78BFA":"#64748B" }}>
          <Keyboard size={11} /> Keys
        </button>
      </div>

      {pageError ? (
        <div
          className="px-4 py-2 text-xs"
          style={{
            background: showDemoFallback ? "rgba(59,130,246,0.12)" : "rgba(245,158,11,0.12)",
            borderBottom: showDemoFallback
              ? "1px solid rgba(59,130,246,0.2)"
              : "1px solid rgba(245,158,11,0.18)",
            color: showDemoFallback ? "#BFDBFE" : "#F59E0B",
          }}
        >
          {showDemoFallback
            ? "Live simulator market data is unavailable right now. Showing demo market data because the profile fallback is enabled."
            : pageError}
        </div>
      ) : null}

      {/* ── Indicator Toolbar ── */}
      <div className="flex items-center gap-2 px-4 py-1.5 shrink-0" style={{ borderBottom:"1px solid rgba(255,255,255,0.04)",background:"rgba(0,0,0,0.18)" }}>
        <div style={{ position:"relative" }}>
          <button onClick={()=>setShowIndMenu(v=>!v)} className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-all hover:bg-white/10"
            style={{ background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.08)",color:"#94A3B8",fontWeight:500 }}>
            <BarChart2 size={11} /> Indicators <ChevronDown size={9} />
          </button>
          {showIndMenu && (
            <div style={{ position:"absolute",top:"calc(100% + 6px)",left:0,zIndex:50,background:"#1E2D40",border:"1px solid rgba(255,255,255,0.12)",borderRadius:10,padding:8,minWidth:200,boxShadow:"0 12px 32px rgba(0,0,0,0.4)" }}>
              {INDICATORS.map((ind)=>(
                <div key={ind} onClick={()=>toggleIndicator(ind)} className="flex items-center justify-between px-2 py-1.5 rounded-lg cursor-pointer hover:bg-white/10 transition-colors"
                  style={{ color:activeIndicators.includes(ind)?"#60A5FA":"#94A3B8" }}>
                  <span style={{ fontSize:"0.75rem" }}>{ind}</span>
                  {activeIndicators.includes(ind)&&<span style={{ fontSize:"0.65rem",fontWeight:700 }}>✓</span>}
                </div>
              ))}
            </div>
          )}
        </div>
        <button className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs" style={{ background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.08)",color:"#64748B" }}>
          <PenLine size={11} /> Draw
        </button>
        <div className="flex items-center gap-1 ml-auto">
          {activeIndicators.map((ind)=>(
            <div key={ind} className="flex items-center gap-1 px-2 py-0.5 rounded text-xs" style={{ background:"rgba(59,130,246,0.1)",color:"#60A5FA",border:"1px solid rgba(59,130,246,0.18)" }}>
              {ind} <button onClick={()=>toggleIndicator(ind)}><X size={9} /></button>
            </div>
          ))}
        </div>
        <button className="ml-1 flex items-center gap-1 px-2 py-1 rounded text-xs" style={{ background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.06)",color:"#475569" }}>
          <Maximize2 size={10} /> Full
        </button>
      </div>

      {/* ── Main layout ── */}
      <div className="flex flex-1 min-h-0">

        {/* ── Order Book + T&S ── */}
        <div className="w-48 shrink-0 flex flex-col overflow-hidden" style={{ borderRight:"1px solid #1F2937" }}>
          {/* Book header */}
          <div className="grid grid-cols-3 px-2 py-1.5 text-xs" style={{ color:"#475569",borderBottom:"1px solid rgba(255,255,255,0.06)",background:"rgba(0,0,0,0.15)" }}>
            <span style={{ fontWeight:600,color:"#64748B",fontSize:"0.65rem" }}>ORDER BOOK</span>
            <span className="text-center" style={{ fontSize:"0.65rem" }}>Size</span>
            <span className="text-right" style={{ fontSize:"0.65rem" }}>Total</span>
          </div>

          {/* Asks */}
          {[...displayOrderBook.asks].map((row,i)=>{
            const isBest = i===displayOrderBook.asks.length-1;
            const total = (parseFloat(row.price)*parseFloat(row.size)).toLocaleString(undefined,{maximumFractionDigits:0});
            return (
              <div key={`a${i}`} className="grid grid-cols-3 px-2 py-0.5 text-xs relative transition-colors"
                style={{ background:flashRows[`a${i}`]?"rgba(239,68,68,0.08)":isBest?"rgba(239,68,68,0.06)":"transparent" }}>
                <div className="absolute inset-0 right-auto" style={{ width:`${row.depthPct}%`,background:"rgba(239,68,68,0.05)" }} />
                <span style={{ color:isBest?"#F87171":"#EF5350",fontWeight:isBest?700:500,fontSize:"0.68rem",position:"relative" }}>{Number(row.price).toLocaleString()}</span>
                <span className="text-center" style={{ color:"#64748B",fontSize:"0.68rem",position:"relative" }}>{row.size}</span>
                <span className="text-right" style={{ color:"#475569",fontSize:"0.65rem",position:"relative" }}>{total}</span>
              </div>
            );
          })}

          {/* Spread */}
          <div className="px-2 py-1 text-center" style={{ color:"#F59E0B",fontWeight:600,fontSize:"0.68rem",background:"rgba(245,158,11,0.06)",borderTop:"1px solid rgba(255,255,255,0.04)",borderBottom:"1px solid rgba(255,255,255,0.04)" }}>
            ${Math.round(bestAsk || displayMarketSnapshot.price || 0).toLocaleString()} · ${spreadValue.toFixed(2)} spread
          </div>

          {/* Bids */}
          {displayOrderBook.bids.map((row,i)=>{
            const isBest = i===0;
            const total = (parseFloat(row.price)*parseFloat(row.size)).toLocaleString(undefined,{maximumFractionDigits:0});
            return (
              <div key={`b${i}`} className="grid grid-cols-3 px-2 py-0.5 text-xs relative transition-colors"
                style={{ background:flashRows[`b${i}`]?"rgba(34,197,94,0.08)":isBest?"rgba(34,197,94,0.06)":"transparent" }}>
                <div className="absolute inset-0 right-auto" style={{ width:`${row.depthPct}%`,background:"rgba(38,166,154,0.05)" }} />
                <span style={{ color:isBest?"#4ADE80":"#26A69A",fontWeight:isBest?700:500,fontSize:"0.68rem",position:"relative" }}>{Number(row.price).toLocaleString()}</span>
                <span className="text-center" style={{ color:"#64748B",fontSize:"0.68rem",position:"relative" }}>{row.size}</span>
                <span className="text-right" style={{ color:"#475569",fontSize:"0.65rem",position:"relative" }}>{total}</span>
              </div>
            );
          })}

          {/* Time & Sales */}
          <div className="flex-1 overflow-hidden" style={{ borderTop:"1px solid rgba(255,255,255,0.06)" }}>
            <div className="grid grid-cols-3 px-2 py-1 text-xs" style={{ color:"#475569",background:"rgba(0,0,0,0.12)",borderBottom:"1px solid rgba(255,255,255,0.04)" }}>
              <span style={{ fontWeight:600,color:"#64748B",fontSize:"0.63rem" }}>T&S</span>
              <span className="text-center" style={{ fontSize:"0.63rem" }}>Qty</span>
              <span className="text-right" style={{ fontSize:"0.63rem" }}>Time</span>
            </div>
            <div style={{ overflowY:"hidden",maxHeight:120 }}>
              {displaySales.slice(0,8).map((s)=>(
                <div key={s.id} className="grid grid-cols-3 px-2 py-0.5"
                  style={{ borderBottom:"1px solid rgba(255,255,255,0.03)" }}>
                  <span style={{ color:s.up?"#22C55E":"#EF4444",fontWeight:600,fontSize:"0.65rem" }}>{s.price.toLocaleString()}</span>
                  <span className="text-center" style={{ color:"#64748B",fontSize:"0.65rem" }}>{s.size}</span>
                  <span className="text-right" style={{ color:"#475569",fontSize:"0.6rem" }}>{s.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Chart + sub-panels + tabs ── */}
        <div className="flex-1 min-w-0 flex flex-col">
          <div style={{ height: 400, flexShrink: 0 }}>
            <CandlestickChart candles={displaySimulatorMarket.candles} height={400} theme="dark" />
          </div>

          {/* Position Visualization */}
          {positions.length>0 && (
            <PositionViz entry={String(positions[0].entryPrice)} sl={String(positions[0].sl)} tp={String(positions[0].tp)} />
          )}

          {/* Indicator panels */}
          {(activeIndicators.includes("RSI (14)")||activeIndicators.includes("Volume"))&&(
            <div style={{ borderTop:"1px solid rgba(255,255,255,0.06)",flexShrink:0 }}>
              {activeIndicators.includes("RSI (14)")&&<RsiPanel data={displaySimulatorMarket.rsiData} />}
              {activeIndicators.includes("Volume")&&(
                <div style={{ borderTop:activeIndicators.includes("RSI (14)")?"1px solid rgba(255,255,255,0.04)":"none" }}>
                  <VolumePanel data={displaySimulatorMarket.volumeData} />
                </div>
              )}
            </div>
          )}

          {/* Bottom Tabs */}
          <div style={{ borderTop:"1px solid rgba(255,255,255,0.07)",flexShrink:0 }}>
            <div className="flex items-center px-4" style={{ borderBottom:"1px solid rgba(255,255,255,0.06)" }}>
              {["positions","history","notes"].map((t)=>(
                <button key={t} onClick={()=>setActiveTab(t)} className="px-4 py-2 text-xs capitalize transition-colors"
                  style={{ color:activeTab===t?"#60A5FA":"#64748B",borderBottom:activeTab===t?"2px solid #3B82F6":"2px solid transparent",fontWeight:500 }}>
                  {t==="positions"?`Open Orders (${positions.length})`:t==="history"?`History (${closedTrades.length})`:"Notes"}
                </button>
              ))}
            </div>

            <div style={{ minHeight:80,maxHeight:150,overflowY:"auto" }}>
              {/* Positions */}
              {activeTab==="positions"&&(
                positions.length===0
                  ? <div className="px-4 py-5 text-center text-xs" style={{ color:"#475569" }}>No open orders. Use the order form to place a backend-backed limit order.</div>
                  : (
                    <table className="w-full text-xs">
                      <thead>
                        <tr style={{ borderBottom:"1px solid rgba(255,255,255,0.06)" }}>
                          {["Pair","Side","Size","Entry","Mark","Unr. PnL","Lev","Liq","SL","TP","Actions"].map(h=>(
                            <th key={h} className="text-left px-2 py-2" style={{ color:"#475569",fontWeight:500,whiteSpace:"nowrap",fontSize:"0.67rem" }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {positions.map((pos)=>{
                          const unr=(markPrice-pos.entryPrice)*pos.sizeNum*(pos.side==="Long"?1:-1);
                          const liq=pos.side==="Long"?pos.entryPrice*(1-1/pos.leverage*0.9):pos.entryPrice*(1+1/pos.leverage*0.9);
                          return (
                            <tr key={pos.id} style={{ borderBottom:"1px solid rgba(255,255,255,0.03)" }}>
                              <td className="px-2 py-1.5" style={{ color:"#F8FAFC",fontWeight:600 }}>{pos.pair}</td>
                              <td className="px-2 py-1.5"><span className="px-1.5 py-0.5 rounded text-xs" style={{ background:pos.side==="Long"?"rgba(34,197,94,0.12)":"rgba(239,68,68,0.12)",color:pos.side==="Long"?"#4ADE80":"#F87171",fontWeight:600 }}>{pos.side}</span></td>
                              <td className="px-2 py-1.5" style={{ color:"#94A3B8" }}>{pos.sizeNum.toFixed(3)}</td>
                              <td className="px-2 py-1.5" style={{ color:"#94A3B8" }}>${pos.entryPrice.toLocaleString()}</td>
                              <td className="px-2 py-1.5" style={{ color:"#94A3B8" }}>${markPrice.toLocaleString()}</td>
                              <td className="px-2 py-1.5" style={{ color:unr>=0?"#22C55E":"#EF4444",fontWeight:600 }}>{unr>=0?"+":""}${unr.toFixed(2)}</td>
                              <td className="px-2 py-1.5" style={{ color:"#F59E0B",fontWeight:600 }}>{pos.leverage}x</td>
                              <td className="px-2 py-1.5" style={{ color:"#EF4444" }}>${liq.toFixed(0)}</td>
                              <td className="px-2 py-1.5" style={{ color:"#EF4444" }}>${pos.sl.toLocaleString()}{pos.trailing&&<span style={{ color:"#8B5CF6",marginLeft:4,fontSize:"0.6rem" }}>⟳</span>}</td>
                              <td className="px-2 py-1.5" style={{ color:"#22C55E" }}>${pos.tp.toLocaleString()}</td>
                              <td className="px-2 py-1.5">
                                <div className="flex items-center gap-1">
                                  <button onClick={()=>closePosition(pos.id)} className="px-1.5 py-0.5 rounded text-xs hover:bg-red-900/30 transition-colors" style={{ color:"#EF4444",border:"1px solid rgba(239,68,68,0.2)",fontSize:"0.62rem" }}>Cancel</button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )
              )}

              {/* History */}
              {activeTab==="history"&&(
                closedTrades.length===0
                  ? <div className="px-4 py-5 text-center text-xs" style={{ color:"#475569" }}>No trade history yet.</div>
                  : (
                    <table className="w-full text-xs">
                      <thead>
                        <tr style={{ borderBottom:"1px solid rgba(255,255,255,0.06)" }}>
                          {["Pair","Side","Entry","Close","PnL","Strategy"].map(h=>(
                            <th key={h} className="text-left px-3 py-2" style={{ color:"#475569",fontWeight:500,fontSize:"0.67rem" }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {closedTrades.map((t,i)=>(
                          <tr key={i} style={{ borderBottom:"1px solid rgba(255,255,255,0.03)" }}>
                            <td className="px-3 py-1.5" style={{ color:"#F8FAFC",fontWeight:600 }}>{t.pair||toDisplayPair(displayMarketSnapshot.symbol)}</td>
                            <td className="px-3 py-1.5"><span className="px-1.5 py-0.5 rounded" style={{ background:t.side==="Long"?"rgba(34,197,94,0.12)":"rgba(239,68,68,0.12)",color:t.side==="Long"?"#4ADE80":"#F87171",fontWeight:600 }}>{t.side}</span></td>
                            <td className="px-3 py-1.5" style={{ color:"#94A3B8" }}>${t.entryPrice?.toLocaleString()}</td>
                            <td className="px-3 py-1.5" style={{ color:"#94A3B8" }}>${t.closePrice?.toLocaleString()}</td>
                            <td className="px-3 py-1.5" style={{ color:t.pnl>=0?"#22C55E":"#EF4444",fontWeight:600 }}>{t.pnl>=0?"+":""}${t.pnl?.toFixed(2)}</td>
                            <td className="px-3 py-1.5"><span className="px-1.5 py-0.5 rounded" style={{ background:"rgba(255,255,255,0.06)",color:"#94A3B8" }}>{t.strategy}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )
              )}

              {activeTab==="notes"&&(
                <div className="p-3">
                  <textarea placeholder="Add session notes here…" className="w-full text-xs p-2 rounded-lg resize-none outline-none" style={{ background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",color:"#94A3B8",minHeight:64 }} />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Right Panel ── */}
        <div className="w-60 shrink-0 flex flex-col overflow-y-auto" style={{ borderLeft:"1px solid #1F2937" }}>
          <div className="flex" style={{ borderBottom:"1px solid rgba(255,255,255,0.06)" }}>
            {["order","risk"].map((t)=>(
              <button key={t} onClick={()=>setRightTab(t)} className="flex-1 py-2 text-xs capitalize transition-colors"
                style={{ color:rightTab===t?"#60A5FA":"#64748B",borderBottom:rightTab===t?"2px solid #3B82F6":"2px solid transparent",fontWeight:500 }}>
                {t==="order"?"Order":"Risk Calc"}
              </button>
            ))}
          </div>

          {rightTab==="order"&&(
            <>
              <div className="px-4 py-3" style={{ borderBottom:"1px solid rgba(255,255,255,0.06)" }}>
                {/* Buy / Sell */}
                <div className="flex rounded-lg overflow-hidden mb-2.5" style={{ border:"1px solid rgba(255,255,255,0.1)" }}>
                  <button onClick={()=>setSide("buy")} className="flex-1 py-2 text-sm transition-colors flex items-center justify-center gap-1.5"
                    style={{ background:side==="buy"?"#26A69A":"transparent",color:side==="buy"?"white":"#64748B",fontWeight:600 }}>
                    <TrendingUp size={12} /> Buy
                  </button>
                  <button onClick={()=>setSide("sell")} className="flex-1 py-2 text-sm transition-colors flex items-center justify-center gap-1.5"
                    style={{ background:side==="sell"?"#EF5350":"transparent",color:side==="sell"?"white":"#64748B",fontWeight:600 }}>
                    <TrendingDown size={12} /> Sell
                  </button>
                </div>

                {/* Order type */}
                <div className="flex gap-1 mb-3">
                  {["market","limit"].map((t)=>(
                    <button key={t} onClick={()=>setOrderType(t)} className="flex-1 py-1 text-xs rounded capitalize"
                      style={{ background:orderType===t?"rgba(59,130,246,0.15)":"transparent",color:orderType===t?"#60A5FA":"#64748B",border:"1px solid",borderColor:orderType===t?"rgba(59,130,246,0.3)":"rgba(255,255,255,0.08)",fontWeight:500 }}>{t}</button>
                  ))}
                </div>

                {/* Inputs */}
                <div className="space-y-2">
                  {orderType==="limit"&&(
                    <div>
                      <label className="block text-xs mb-1" style={{ color:"#64748B" }}>Price (USDT)</label>
                      <input value={price} onChange={e=>{ setPrice(e.target.value); setHasCustomPrice(true); }} className="w-full px-3 py-1.5 rounded-lg text-xs outline-none"
                        style={{ background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",color:"white" }} />
                    </div>
                  )}
                  <div>
                    <label className="block text-xs mb-1" style={{ color:"#64748B" }}>Size (BTC)</label>
                    <input value={size} onChange={e=>setSize(e.target.value)} className="w-full px-3 py-1.5 rounded-lg text-xs outline-none"
                      style={{ background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",color:"white" }} />
                  </div>
                  <div className="flex gap-1">
                    {["25%","50%","75%","100%"].map((p)=>(
                      <button key={p} onClick={()=>setSize(String((balance/ep*(parseInt(p)/100)).toFixed(3)))} className="flex-1 py-1 text-xs rounded"
                        style={{ background:"rgba(255,255,255,0.06)",color:"#64748B",fontWeight:500 }}>{p}</button>
                    ))}
                  </div>
                  <div>
                    <label className="block text-xs mb-1" style={{ color:"#64748B" }}>Stop Loss</label>
                    <input value={stopLoss} onChange={e=>setStopLoss(e.target.value)} className="w-full px-3 py-1.5 rounded-lg text-xs outline-none"
                      style={{ background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.2)",color:"#EF4444" }} />
                  </div>
                  <div>
                    <label className="block text-xs mb-1" style={{ color:"#64748B" }}>Take Profit</label>
                    <input value={takeProfit} onChange={e=>setTakeProfit(e.target.value)} className="w-full px-3 py-1.5 rounded-lg text-xs outline-none"
                      style={{ background:"rgba(34,197,94,0.06)",border:"1px solid rgba(34,197,94,0.2)",color:"#22C55E" }} />
                  </div>
                </div>
              </div>

              {/* Training */}
              <div className="px-4 py-3" style={{ borderBottom:"1px solid rgba(255,255,255,0.06)" }}>
                <div className="text-xs mb-2" style={{ color:"#475569",fontWeight:600,letterSpacing:"0.05em" }}>TRAINING LOG</div>
                <div className="space-y-2">
                  <div>
                    <label className="block text-xs mb-1" style={{ color:"#64748B" }}>Strategy</label>
                    <select value={strategy} onChange={e=>setStrategy(e.target.value)} className="w-full px-3 py-1.5 rounded-lg text-xs outline-none"
                      style={{ background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",color:"white" }}>
                      {availableStrategies.map(s=>(
                        <option key={s} value={s} style={{ background:"#1E2D40" }}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs mb-1" style={{ color:"#64748B" }}>Confidence: {confidence}%</label>
                    <input type="range" min="10" max="100" value={confidence} onChange={e=>setConfidence(e.target.value)} className="w-full accent-blue-500" />
                  </div>
                  <textarea value={reason} onChange={e=>setReason(e.target.value)} rows={2} placeholder="Why take this trade?" className="w-full px-3 py-2 rounded-lg text-xs outline-none resize-none"
                    style={{ background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",color:"white" }} />
                </div>
              </div>

              {/* Submit */}
              <div className="px-4 py-3">
                {!marketStatus.tradingEnabled && (
                  <div
                    className="mb-2 px-3 py-2 rounded-lg text-xs"
                    style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.18)", color: "#FCA5A5" }}
                  >
                    {marketStatus.tradingDisabledReason || "Trading disabled — database not fully supported."}
                  </div>
                )}
                {marketStatus.feedStatus !== "LIVE" && (
                  <div
                    className="mb-2 px-3 py-2 rounded-lg text-xs"
                    style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.18)", color: "#FCD34D" }}
                  >
                    Market feed is {marketStatus.feedStatus?.toLowerCase() || "unavailable"}. Live execution data may be delayed.
                  </div>
                )}
                <button
                  onClick={()=>submitOrder()}
                  disabled={!marketStatus.tradingEnabled}
                  className="w-full py-2.5 rounded-lg text-sm text-white transition-all hover:opacity-90 flex items-center justify-center gap-2 disabled:cursor-not-allowed"
                  style={{
                    background: !marketStatus.tradingEnabled
                      ? "linear-gradient(135deg,#475569,#334155)"
                      : side==="buy"
                        ? "linear-gradient(135deg,#26A69A,#10B981)"
                        : "linear-gradient(135deg,#EF5350,#DC2626)",
                    fontWeight:600,
                    opacity: !marketStatus.tradingEnabled ? 0.65 : 1,
                  }}
                >
                  {side==="buy"?<><TrendingUp size={13} /> Buy / Long</>:<><TrendingDown size={13} /> Sell / Short</>}
                </button>
                {positions.length>0&&(
                  <button onClick={closeAllPositions} className="w-full py-2 rounded-lg text-xs mt-2 transition-all hover:opacity-90"
                    style={{ background:"rgba(239,68,68,0.1)",border:"1px solid rgba(239,68,68,0.25)",color:"#EF4444",fontWeight:600 }}>
                    Cancel All <HotkeyBadge>C</HotkeyBadge>
                  </button>
                )}
                <div className="flex items-center justify-center gap-3 mt-2">
                  <div className="text-xs flex items-center gap-1" style={{ color:"#475569" }}><HotkeyBadge>B</HotkeyBadge>Buy</div>
                  <div className="text-xs flex items-center gap-1" style={{ color:"#475569" }}><HotkeyBadge>S</HotkeyBadge>Sell</div>
                </div>
              </div>
            </>
          )}

          {rightTab==="risk"&&(
            <div className="px-4 py-3 space-y-3">
              <div className="flex items-center gap-1.5 mb-1">
                <ShieldAlert size={12} style={{ color:"#F59E0B" }} />
                <span className="text-xs" style={{ color:"#F59E0B",fontWeight:600,letterSpacing:"0.05em" }}>RISK CALCULATOR</span>
              </div>
              {[
                { label:"Position Size", value:`$${(ep*sn).toLocaleString(undefined,{maximumFractionDigits:0})}`, color:"#94A3B8" },
                { label:"Risk Amount", value:`-$${riskAmt.toFixed(0)}`, color:"#EF4444" },
                { label:"Risk %", value:`${riskPct}%`, color:parseFloat(riskPct)>2?"#EF4444":"#F59E0B" },
                { label:"Reward Amount", value:`+$${profitAmt.toFixed(0)}`, color:"#22C55E" },
                { label:"Risk : Reward", value:`1:${rrRatio}`, color:parseFloat(rrRatio)>=2?"#22C55E":parseFloat(rrRatio)>=1?"#F59E0B":"#EF4444" },
                { label:"Leverage", value:"5x", color:"#F59E0B" },
                { label:"Liq. Price", value:`$${(ep*(1-0.18)).toFixed(0)}`, color:"#EF4444" },
              ].map(({ label,value,color })=>(
                <div key={label} className="flex items-center justify-between">
                  <span className="text-xs" style={{ color:"#475569" }}>{label}</span>
                  <span className="text-xs" style={{ fontWeight:700,color }}>{value}</span>
                </div>
              ))}
              <div className="mt-2">
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background:"rgba(255,255,255,0.08)" }}>
                  <div className="h-full rounded-full" style={{ width:`${Math.min(parseFloat(riskPct)*50,100)}%`,background:parseFloat(riskPct)>2?"#EF4444":"#F59E0B" }} />
                </div>
                <div className="flex justify-between text-xs mt-0.5" style={{ color:"#475569" }}><span>0%</span><span>2% max</span></div>
              </div>
              <div className="p-2.5 rounded-xl mt-2" style={{ background:"rgba(245,158,11,0.06)",border:"1px solid rgba(245,158,11,0.18)" }}>
                <div className="text-xs mb-1.5" style={{ color:"#64748B",fontWeight:600 }}>QUICK CHECK</div>
                {[
                  { check:"Risk ≤ 2%", pass:parseFloat(riskPct)<=2 },
                  { check:"R:R ≥ 2:1", pass:parseFloat(rrRatio)>=2 },
                  { check:"SL set", pass:!!stopLoss },
                  { check:"TP set", pass:!!takeProfit },
                  { check:"Reason logged", pass:reason.length>5 },
                ].map(({ check,pass })=>(
                  <div key={check} className="flex items-center justify-between text-xs py-0.5">
                    <span style={{ color:"#64748B" }}>{check}</span>
                    <span style={{ color:pass?"#22C55E":"#EF4444",fontWeight:700 }}>{pass?"✓":"✗"}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
