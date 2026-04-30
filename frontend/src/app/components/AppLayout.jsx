import { Outlet, NavLink, Navigate, useNavigate } from "react-router";
import {
  LayoutDashboard, TrendingUp, RotateCcw, Cpu, BarChart2, BookOpen,
  Trophy, Bell, ChevronDown, Zap, LogOut, AlertTriangle, GraduationCap,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useAppSession } from "../context/AppSession";
import { appApi } from "../lib/api";
import {
  addRealtimeListener,
  connectRealtime,
  disconnectRealtime,
  subscribeRealtimeSymbol,
} from "../lib/realtime";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/app/dashboard" },
  { icon: TrendingUp, label: "Trade Simulator", path: "/app/simulator" },
  { icon: RotateCcw, label: "Replay Market", path: "/app/replay" },
  { icon: Cpu, label: "Strategy Builder", path: "/app/strategy" },
  { icon: BarChart2, label: "Analytics", path: "/app/analytics" },
  { icon: BookOpen, label: "Trading Journal", path: "/app/journal" },
  { icon: Trophy, label: "Leaderboard", path: "/app/leaderboard" },
  { icon: AlertTriangle, label: "Mistake Analysis", path: "/app/mistakes" },
  { icon: GraduationCap, label: "Learning Center", path: "/app/learn" },
];

function generateSparkline(up, seed) {
  const pts = [];
  let v = 50;
  for (let i = 0; i < 8; i++) {
    const change = ((((seed * (i + 1) * 37) % 100) / 100) - (up ? 0.35 : 0.65)) * 18;
    v = Math.max(10, Math.min(90, v + change));
    pts.push(v);
  }
  const w = 48, h = 22;
  const min = Math.min(...pts), max = Math.max(...pts);
  const xs = pts.map((_, i) => (i / (pts.length - 1)) * w);
  const ys = pts.map((p) => h - ((p - min) / (max - min + 0.01)) * h);
  return xs.map((x, i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${ys[i].toFixed(1)}`).join(" ");
}

const compactFormatter = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});

const demoTickerItems = [
  {
    symbol: "BTC/USDT",
    price: "$67,542",
    change: "+1.42%",
    vol: "$20.7K",
    oi: "+2.15%",
    funding: "-0.90%",
    up: true,
    seed: 101,
  },
  {
    symbol: "ADA/USDT",
    price: "$0.264",
    change: "+1.62%",
    vol: "$129.1M",
    oi: "+3.35%",
    funding: "-1.08%",
    up: true,
    seed: 102,
  },
  {
    symbol: "XRP/USDT",
    price: "$1.42",
    change: "+0.54%",
    vol: "$126.5M",
    oi: "+3.60%",
    funding: "-0.93%",
    up: true,
    seed: 103,
  },
  {
    symbol: "BNB/USDT",
    price: "$639.22",
    change: "-0.30%",
    vol: "$197.1K",
    oi: "+1.31%",
    funding: "-2.18%",
    up: false,
    seed: 104,
  },
  {
    symbol: "SOL/USDT",
    price: "$91.95",
    change: "+2.91%",
    vol: "$3.5M",
    oi: "+3.26%",
    funding: "-1.14%",
    up: true,
    seed: 105,
  },
];

function formatPrice(value) {
  if (value == null) {
    return "—";
  }

  if (value >= 1000) {
    return `$${Math.round(value).toLocaleString()}`;
  }

  if (value >= 1) {
    return `$${value.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  return `$${value.toLocaleString(undefined, {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  })}`;
}

function formatPercent(value) {
  const numericValue = Number(value || 0);
  return `${numericValue >= 0 ? "+" : ""}${numericValue.toFixed(2)}%`;
}

function resolveAvatarLabel(user) {
  const explicit = String(user?.avatarLabel || "")
    .replace(/[^a-z0-9]/gi, "")
    .slice(0, 2)
    .toUpperCase();

  if (explicit) {
    return explicit;
  }

  return String(user?.name || user?.email || "U")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("") || "U";
}

function toTickerAsset(asset, index) {
  const priceChange = Number(asset.changePercent || 0);

  return {
    rawSymbol: asset.symbol,
    symbol: asset.symbol.replace("USDT", "/USDT"),
    price: formatPrice(Number(asset.price)),
    change: formatPercent(priceChange),
    vol: asset.volume ? `$${compactFormatter.format(asset.volume)}` : "—",
    oi:
      asset.openInterestChangePercent != null
        ? formatPercent(asset.openInterestChangePercent)
        : "—",
    funding:
      asset.fundingRate != null
        ? formatPercent(asset.fundingRate)
        : "—",
    up: priceChange >= 0,
    seed: 90 + index,
  };
}

function applyRealtimeTickerUpdate(currentTickers, marketData) {
  const normalizedSymbol = String(marketData?.symbol || "").toUpperCase();
  if (!normalizedSymbol) {
    return currentTickers;
  }

  return currentTickers.map((ticker, index) => {
    if (ticker.rawSymbol !== normalizedSymbol) {
      return ticker;
    }

    const nextPrice = Number(marketData.price || 0);
    const nextChange = Number(marketData.changePercent || 0);

    return {
      ...ticker,
      price: formatPrice(nextPrice),
      change: formatPercent(nextChange),
      vol: marketData.volume ? `$${compactFormatter.format(marketData.volume)}` : ticker.vol,
      up: nextChange >= 0,
      seed: ticker.seed || 90 + index,
    };
  });
}

function getStatusTone(status) {
  if (status === "LIVE") {
    return { dot: "#22C55E", label: "Live", text: "#16A34A", bg: "rgba(34,197,94,0.08)", border: "rgba(34,197,94,0.18)" };
  }
  if (status === "DELAYED") {
    return { dot: "#F59E0B", label: "Delayed", text: "#D97706", bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.18)" };
  }
  return { dot: "#EF4444", label: "Disconnected", text: "#DC2626", bg: "rgba(239,68,68,0.08)", border: "rgba(239,68,68,0.18)" };
}

function Sparkline({ up, seed }) {
  const path = generateSparkline(up, seed);
  const color = up ? "#22C55E" : "#EF4444";
  return (
    <svg width="44" height="20" viewBox="0 0 44 20" fill="none" style={{ display: "block", flexShrink: 0 }}>
      <path d={path} stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ScrollingTicker({ items }) {
  const trackRef = useRef(null);
  const [offset, setOffset] = useState(0);
  const animRef = useRef(null);
  const speedRef = useRef(0.45);

  useEffect(() => {
    let lastTime = null;
    const step = (ts) => {
      if (lastTime !== null) {
        const delta = ts - lastTime;
        setOffset((prev) => {
          const trackW = trackRef.current ? trackRef.current.scrollWidth / 2 : 900;
          return (prev + speedRef.current * (delta / 16)) % trackW;
        });
      }
      lastTime = ts;
      animRef.current = requestAnimationFrame(step);
    };
    animRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animRef.current);
  }, []);

  const tickerItems = [...items, ...items];

  return (
    <div
      style={{
        overflow: "hidden", flex: 1, minWidth: 0, cursor: "default", position: "relative",
        maskImage: "linear-gradient(to right, transparent, black 48px, black calc(100% - 48px), transparent)",
        WebkitMaskImage: "linear-gradient(to right, transparent, black 48px, black calc(100% - 48px), transparent)",
      }}
      onMouseEnter={() => { speedRef.current = 0; }}
      onMouseLeave={() => { speedRef.current = 0.45; }}
    >
      <div
        ref={trackRef}
        style={{ display: "flex", alignItems: "center", transform: `translateX(-${offset}px)`, willChange: "transform", width: "max-content" }}
      >
        {tickerItems.map((a, i) => (
          <div
            key={i}
            className="flex items-center gap-3 px-4"
            style={{ borderRight: "1px solid rgba(255,255,255,0.06)", height: 44, flexShrink: 0 }}
          >
            {/* Symbol */}
            <span style={{ color: "#64748B", fontWeight: 600, fontSize: "0.7rem", whiteSpace: "nowrap", minWidth: 58 }}>{a.symbol}</span>
            {/* Price */}
            <span style={{ fontWeight: 700, color: "#F8FAFC", fontSize: "0.72rem", whiteSpace: "nowrap" }}>{a.price}</span>
            {/* Sparkline */}
            <Sparkline up={a.up} seed={a.seed} />
            {/* Change */}
            <span style={{ fontWeight: 600, fontSize: "0.7rem", color: a.up ? "#22C55E" : "#EF4444", whiteSpace: "nowrap", minWidth: 44 }}>{a.change}</span>
            {/* Extra metrics */}
            {a.vol !== "—" && (
              <div className="flex items-center gap-2" style={{ borderLeft: "1px solid rgba(255,255,255,0.06)", paddingLeft: 10 }}>
                <span style={{ fontSize: "0.65rem", color: "#475569" }}>Vol <span style={{ color: "#64748B" }}>{a.vol}</span></span>
                <span style={{ fontSize: "0.65rem", color: "#475569" }}>OI <span style={{ color: a.oi.startsWith("+") ? "#22C55E" : "#EF4444" }}>{a.oi}</span></span>
                <span style={{ fontSize: "0.65rem", color: "#475569" }}>Fund <span style={{ color: a.funding.startsWith("-") ? "#EF4444" : "#22C55E" }}>{a.funding}</span></span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function AppLayout() {
  const navigate = useNavigate();
  const { accessToken, isAuthenticated, isReady, logout, user } = useAppSession();
  const [tickers, setTickers] = useState([]);
  const [portfolioValue, setPortfolioValue] = useState(0);
  const [marketStatus, setMarketStatus] = useState({
    feedStatus: "DISCONNECTED",
    tradingEnabled: false,
    tradingDisabledReason: "",
  });

  useEffect(() => {
    let ignore = false;

    async function loadChromeData() {
      try {
        const [marketResponse, portfolioResponse] = await Promise.allSettled([
          appApi.getMarketTickers(),
          accessToken ? appApi.getPortfolio(accessToken) : Promise.resolve(null),
        ]);

        if (
          !ignore &&
          marketResponse.status === "fulfilled" &&
          marketResponse.value?.tickers?.length
        ) {
          setTickers(marketResponse.value.tickers.slice(0, 8).map(toTickerAsset));
        } else if (!ignore && user?.demoDataFallbackEnabled) {
          setTickers(demoTickerItems);
        } else if (!ignore) {
          setTickers([]);
        }

        if (
          !ignore &&
          portfolioResponse.status === "fulfilled" &&
          portfolioResponse.value?.totalPortfolioValue != null
        ) {
          setPortfolioValue(portfolioResponse.value.totalPortfolioValue);
        } else if (!ignore && user?.demoDataFallbackEnabled) {
          setPortfolioValue(Number(user?.wallet?.USDT || 0));
        } else if (!ignore) {
          setPortfolioValue(0);
        }
      } catch {
        if (!ignore && user?.demoDataFallbackEnabled) {
          setTickers(demoTickerItems);
          setPortfolioValue(Number(user?.wallet?.USDT || 0));
        }
      }
    }

    loadChromeData();
    const refreshChrome = () => {
      loadChromeData();
    };
    window.addEventListener("app:refresh-chrome", refreshChrome);

    return () => {
      ignore = true;
      window.removeEventListener("app:refresh-chrome", refreshChrome);
    };
  }, [accessToken, user?.demoDataFallbackEnabled, user?.wallet?.USDT]);

  useEffect(() => {
    if (!accessToken) {
      disconnectRealtime();
      return undefined;
    }

    connectRealtime(accessToken);
    const unsubscribeListener = addRealtimeListener((message) => {
      if (!message?.event) {
        return;
      }

      if (message.event === "price_update") {
        setTickers((current) => applyRealtimeTickerUpdate(current, message.data || {}));
        window.dispatchEvent(new CustomEvent("app:price-update", { detail: message.data || {} }));
      }

      if (message.event === "portfolio_updated") {
        setPortfolioValue(Number(message.data?.totalPortfolioValue || 0));
        window.dispatchEvent(new CustomEvent("app:portfolio-updated", { detail: message.data || {} }));
        window.dispatchEvent(new CustomEvent("app:trading-event", { detail: message }));
      }

      if (["order_placed", "order_filled", "order_cancelled", "position_closed"].includes(message.event)) {
        window.dispatchEvent(new CustomEvent("app:trading-event", { detail: message }));
      }

      if (message.event === "market_status") {
        setMarketStatus(message.data || {});
        window.dispatchEvent(new CustomEvent("app:market-status", { detail: message.data || {} }));
      }

      if (message.event === "socket_closed" || message.event === "socket_error") {
        const fallbackStatus = {
          feedStatus: "DISCONNECTED",
          tradingEnabled: marketStatus.tradingEnabled,
          tradingDisabledReason: marketStatus.tradingDisabledReason || "",
        };
        setMarketStatus(fallbackStatus);
        window.dispatchEvent(new CustomEvent("app:market-status", { detail: fallbackStatus }));
      }
    });

    return () => {
      unsubscribeListener();
      disconnectRealtime();
    };
  }, [accessToken]);

  const tickerSubscriptionKey = tickers.map((ticker) => ticker.rawSymbol).join(",");

  useEffect(() => {
    if (!tickerSubscriptionKey) {
      return undefined;
    }

    const unsubscribers = tickers.map((ticker) => subscribeRealtimeSymbol(ticker.rawSymbol));
    return () => {
      unsubscribers.forEach((unsubscribe) => unsubscribe());
    };
  }, [tickerSubscriptionKey]);

  if (!isReady) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const displayName = user?.name || "Alex Trader";
  const avatarLetter = resolveAvatarLabel(user);
  const avatarColor = user?.avatarColor || "#4F46E5";
  const accountLabel = user?.status === "active" ? "Active Account" : "Demo Account";
  const statusTone = getStatusTone(marketStatus.feedStatus);

  return (
    <div className="flex h-screen overflow-hidden" style={{ fontFamily: "Inter, sans-serif", background: "#0B0F19" }}>
      {/* Sidebar */}
      <aside className="flex flex-col w-56 shrink-0 h-full" style={{ background: "#0B0F19", borderRight: "1px solid #1F2937" }}>
        {/* Logo */}
        <div className="flex items-center gap-2 px-5 py-4" style={{ borderBottom: "1px solid #1F2937" }}>
          <div className="flex items-center justify-center w-7 h-7 rounded-lg" style={{ background: "linear-gradient(135deg, #3B82F6, #8B5CF6)" }}>
            <Zap size={14} className="text-white" />
          </div>
          <span className="text-white" style={{ fontWeight: 700, letterSpacing: "-0.02em", fontSize: "1rem" }}>CryptoSim</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
          {navItems.map(({ icon: Icon, label, path }) => (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all duration-150 ${isActive ? "text-white" : "text-gray-500 hover:text-gray-300 hover:bg-white/5"}`
              }
              style={({ isActive }) => isActive ? { background: "rgba(59,130,246,0.15)", color: "#60A5FA" } : {}}
            >
              {({ isActive }) => (
                <>
                  <Icon size={15} style={{ color: isActive ? "#60A5FA" : undefined }} />
                  <span className="text-xs" style={{ fontWeight: 500 }}>{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User */}
        <div className="px-3 py-3" style={{ borderTop: "1px solid #1F2937" }}>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => navigate("/app/profile")}
              aria-label="Open profile"
              className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs shrink-0"
              style={{ background: avatarColor, fontWeight: 600 }}
            >
              {avatarLetter}
            </button>
            <div className="flex-1 min-w-0">
              <div className="text-white text-xs truncate" style={{ fontWeight: 500 }}>{displayName}</div>
              <div className="text-xs truncate" style={{ color: "#22C55E" }}>{accountLabel}</div>
            </div>
            <LogOut
              size={13}
              className="text-gray-600 hover:text-gray-300 cursor-pointer transition-colors shrink-0"
              onClick={async () => {
                await logout();
                navigate("/login");
              }}
            />
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Ticker Bar */}
        <header
          className="flex items-center shrink-0"
          style={{ borderBottom: "1px solid #1F2937", background: "#111827", height: 44, overflow: "hidden" }}
        >
          {tickers.length ? (
            <ScrollingTicker items={tickers} />
          ) : (
            <div className="flex flex-1 items-center px-4 text-xs" style={{ color: "#64748B" }}>
              Loading live market data...
            </div>
          )}
          {/* Right controls */}
          <div className="flex items-center gap-3 px-3 shrink-0" style={{ borderLeft: "1px solid #1F2937" }}>
            <div
              className="hidden md:flex items-center gap-1.5 px-2 py-1 rounded-lg"
              style={{ background: statusTone.bg, border: `1px solid ${statusTone.border}` }}
              title={marketStatus.tradingEnabled ? statusTone.label : marketStatus.tradingDisabledReason}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: statusTone.dot }} />
              <span className="text-xs" style={{ color: statusTone.text, fontWeight: 700 }}>
                {statusTone.label}
              </span>
            </div>
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg" style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.15)" }}>
              <span className="text-xs" style={{ color: "#475569" }}>Portfolio Value</span>
              <span className="text-xs" style={{ fontWeight: 700, color: "#22C55E" }}>
                ${Math.round(portfolioValue).toLocaleString()}
              </span>
            </div>
            {!marketStatus.tradingEnabled && (
              <div className="hidden lg:flex items-center gap-1.5 px-2 py-1 rounded-lg" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.18)" }}>
                <AlertTriangle size={12} style={{ color: "#DC2626" }} />
                <span className="text-xs" style={{ color: "#DC2626", fontWeight: 600 }}>
                  Trading disabled
                </span>
              </div>
            )}
            <button className="relative flex items-center justify-center w-7 h-7 rounded-lg hover:bg-white/5 transition-colors">
              <Bell size={15} className="text-gray-500" />
              <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full" style={{ background: "#EF4444" }} />
            </button>
            <div
              className="flex items-center gap-1.5 cursor-pointer"
              onClick={() => navigate("/app/profile")}
              aria-label="Open profile"
            >
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs" style={{ background: avatarColor, fontWeight: 600 }}>{avatarLetter}</div>
              <ChevronDown size={12} className="text-gray-500" />
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto" style={{ background: "#F8FAFC" }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
