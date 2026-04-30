import { Layers, RotateCcw, BarChart2, BookOpen, Cpu, ShieldCheck } from "lucide-react";

const valueProps = [
  {
    icon: ShieldCheck,
    color: "#00C98D",
    bg: "rgba(0,201,141,0.15)",
    title: "Practice trading risk-free",
    desc: "Execute real strategies with simulated capital. No real money at risk.",
  },
  {
    icon: RotateCcw,
    color: "#3B82F6",
    bg: "rgba(59,130,246,0.15)",
    title: "Replay historical markets",
    desc: "Go back in time and train on real price data from any crypto market.",
  },
  {
    icon: BarChart2,
    color: "#8B5CF6",
    bg: "rgba(139,92,246,0.15)",
    title: "Analyze your trading mistakes",
    desc: "AI coaching identifies patterns in your errors and shows recovery potential.",
  },
  {
    icon: Cpu,
    color: "#06B6D4",
    bg: "rgba(6,182,212,0.15)",
    title: "Build and test strategies",
    desc: "Create no-code strategies and backtest them on years of historical data.",
  },
];

const liveMarket = [
  { symbol: "BTC", price: "$67,542", change: "+4.82%", vol: "$42.8B", up: true },
  { symbol: "ETH", price: "$3,580", change: "+2.14%", vol: "$18.2B", up: true },
  { symbol: "SOL", price: "$142.40", change: "-1.32%", vol: "$4.1B", up: false },
];

export function AuthSidePanel() {
  return (
    <div
      className="flex flex-col h-full p-8"
      style={{
        background: "linear-gradient(160deg, #0D1421 0%, #0A1628 60%, #0D1B2A 100%)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Decorative orbs */}
      <div style={{ position: "absolute", top: -60, right: -60, width: 220, height: 220, borderRadius: "50%", background: "radial-gradient(circle, rgba(0,201,141,0.07) 0%, transparent 70%)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: 80, left: -40, width: 180, height: 180, borderRadius: "50%", background: "radial-gradient(circle, rgba(59,130,246,0.07) 0%, transparent 70%)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", top: "40%", right: -30, width: 140, height: 140, borderRadius: "50%", background: "radial-gradient(circle, rgba(139,92,246,0.05) 0%, transparent 70%)", pointerEvents: "none" }} />

      {/* Logo */}
      <div className="flex items-center gap-2.5 mb-8">
        <div className="flex items-center justify-center rounded-xl" style={{ width: 36, height: 36, background: "linear-gradient(135deg, #00C98D, #0EA5E9)" }}>
          <Layers size={18} className="text-white" />
        </div>
        <div>
          <div style={{ color: "white", fontWeight: 800, fontSize: "1.1rem", letterSpacing: "-0.02em", lineHeight: 1 }}>CryptoSim</div>
          <div style={{ color: "#4A6175", fontSize: "0.65rem", letterSpacing: "0.06em", lineHeight: 1.4 }}>TRADING SIMULATOR</div>
        </div>
      </div>

      {/* Headline */}
      <div className="mb-7">
        <h2 style={{ color: "white", fontWeight: 800, fontSize: "1.55rem", lineHeight: 1.2, letterSpacing: "-0.02em", marginBottom: 4 }}>
          Trade smarter.
        </h2>
        <h2 style={{ fontWeight: 800, fontSize: "1.55rem", lineHeight: 1.2, letterSpacing: "-0.02em", background: "linear-gradient(90deg, #00C98D, #0EA5E9)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", marginBottom: 12 }}>
          Learn faster.
        </h2>
        <p style={{ color: "#6B7E94", fontSize: "0.82rem", lineHeight: 1.65 }}>
          The professional trading simulator built for serious skill development. Not a game — a real training tool.
        </p>
      </div>

      {/* Value Props */}
      <div className="space-y-3.5 mb-8">
        {valueProps.map(({ icon: Icon, color, bg, title, desc }) => (
          <div key={title} className="flex items-start gap-3">
            <div className="flex items-center justify-center rounded-lg shrink-0" style={{ width: 32, height: 32, background: bg, border: `1px solid ${color}30` }}>
              <Icon size={14} style={{ color }} />
            </div>
            <div>
              <div style={{ color: "white", fontWeight: 600, fontSize: "0.78rem", marginBottom: 2 }}>{title}</div>
              <div style={{ color: "#6B7E94", fontSize: "0.7rem", lineHeight: 1.5 }}>{desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Live Market */}
      <div className="mt-auto">
        <div style={{ color: "#4A5E72", fontSize: "0.66rem", fontWeight: 600, letterSpacing: "0.09em", textTransform: "uppercase", marginBottom: 10 }}>
          Live market
        </div>
        <div className="space-y-2">
          {liveMarket.map(({ symbol, price, change, vol, up }) => (
            <div key={symbol} className="flex items-center justify-between px-3 py-2 rounded-lg" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <span style={{ color: "#94A3B8", fontWeight: 600, fontSize: "0.76rem", minWidth: 32 }}>{symbol}</span>
              <span style={{ color: "white", fontWeight: 700, fontSize: "0.76rem" }}>{price}</span>
              <span style={{ color: "#475569", fontSize: "0.68rem" }}>{vol}</span>
              <span style={{ fontWeight: 700, fontSize: "0.72rem", color: up ? "#00C98D" : "#EF4444", background: up ? "rgba(0,201,141,0.12)" : "rgba(239,68,68,0.12)", padding: "2px 7px", borderRadius: 20 }}>
                {change}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
