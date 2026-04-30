import { useNavigate } from "react-router";
import {
  Zap,
  TrendingUp,
  Cpu,
  BarChart2,
  ChevronRight,
  Shield,
  Globe,
  Twitter,
  Github,
  ArrowUpRight,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const chartData = [
  { time: "Jan", price: 28000 },
  { time: "Feb", price: 32000 },
  { time: "Mar", price: 29500 },
  { time: "Apr", price: 38000 },
  { time: "May", price: 42000 },
  { time: "Jun", price: 36000 },
  { time: "Jul", price: 45000 },
  { time: "Aug", price: 52000 },
  { time: "Sep", price: 47000 },
  { time: "Oct", price: 61000 },
  { time: "Nov", price: 58000 },
  { time: "Dec", price: 67500 },
];

const features = [
  {
    icon: TrendingUp,
    title: "Trade Simulator",
    desc: "Practice real market conditions with virtual capital and zero risk.",
    color: "#3B82F6",
    bg: "rgba(59,130,246,0.1)",
  },
  {
    icon: Cpu,
    title: "Strategy Builder",
    desc: "Create and backtest trading strategies without writing a single line of code.",
    color: "#8B5CF6",
    bg: "rgba(139,92,246,0.1)",
  },
  {
    icon: BarChart2,
    title: "Performance Analytics",
    desc: "Understand exactly why you win or lose trades with deep statistical insights.",
    color: "#10B981",
    bg: "rgba(16,185,129,0.1)",
  },
];

const stats = [
  { label: "Active Traders", value: "48,200+" },
  { label: "Trades Simulated", value: "12.4M+" },
  { label: "Strategies Built", value: "320K+" },
  { label: "Avg. Win Rate Gain", value: "+34%" },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div
        className="px-3 py-2 rounded-lg"
        style={{ background: "#1E2D40", border: "1px solid rgba(59,130,246,0.3)" }}
      >
        <div className="text-xs text-gray-400">{label}</div>
        <div className="text-sm text-white" style={{ fontWeight: 600 }}>
          ${payload[0].value.toLocaleString()}
        </div>
      </div>
    );
  }
  return null;
};

export function LandingPage() {
  const navigate = useNavigate();

  return (
    <div
      style={{
        background: "#0B0F19",
        fontFamily: "Inter, sans-serif",
        minHeight: "100vh",
        color: "white",
      }}
    >
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-4 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div
            className="flex items-center justify-center w-8 h-8 rounded-lg"
            style={{ background: "linear-gradient(135deg, #3B82F6, #8B5CF6)" }}
          >
            <Zap size={16} className="text-white" />
          </div>
          <span
            className="text-xl text-white"
            style={{ fontWeight: 700, letterSpacing: "-0.02em" }}
          >
            CryptoSim
          </span>
        </div>
        <div className="hidden md:flex items-center gap-6">
          {["Features", "Pricing", "Leaderboard", "Docs"].map((item) => (
            <a
              key={item}
              href="#"
              className="text-sm text-gray-400 hover:text-white transition-colors"
              style={{ fontWeight: 500 }}
            >
              {item}
            </a>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/login")}
            className="text-sm text-gray-300 hover:text-white transition-colors"
            style={{ fontWeight: 500 }}
          >
            Sign In
          </button>
          <button
            onClick={() => navigate("/register")}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm text-white transition-all hover:opacity-90"
            style={{
              background: "linear-gradient(135deg, #3B82F6, #8B5CF6)",
              fontWeight: 600,
            }}
          >
            Get Started <ChevronRight size={14} />
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-8 pt-20 pb-12 text-center">
        <div
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-8 text-xs"
          style={{
            background: "rgba(59,130,246,0.1)",
            border: "1px solid rgba(59,130,246,0.3)",
            color: "#60A5FA",
            fontWeight: 500,
          }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 inline-block" />
          Live market data · Risk-free trading · Advanced analytics
        </div>

        <h1
          className="max-w-4xl mx-auto mb-6"
          style={{
            fontSize: "clamp(2.5rem, 6vw, 4rem)",
            fontWeight: 800,
            lineHeight: 1.1,
            letterSpacing: "-0.03em",
            color: "#FFFFFF",
          }}
        >
          Trade Crypto.{" "}
          <span
            style={{
              background: "linear-gradient(90deg, #3B82F6, #8B5CF6, #EC4899)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Practice Risk-Free.
          </span>
        </h1>

        <p
          className="max-w-2xl mx-auto text-lg mb-10"
          style={{ color: "#94A3B8", lineHeight: 1.7 }}
        >
          A professional trading simulator with real-time market data and advanced analytics.
          Master the markets before you risk a single dollar.
        </p>

        <div className="flex items-center justify-center gap-4 flex-wrap">
          <button
            onClick={() => navigate("/register")}
            className="flex items-center gap-2 px-6 py-3 rounded-xl text-white transition-all hover:opacity-90 hover:scale-105"
            style={{
              background: "linear-gradient(135deg, #3B82F6, #8B5CF6)",
              fontWeight: 600,
              fontSize: "0.95rem",
            }}
          >
            Start Trading Free <ArrowUpRight size={16} />
          </button>
          <button
            onClick={() => navigate("/app/simulator")}
            className="flex items-center gap-2 px-6 py-3 rounded-xl text-white transition-all hover:bg-white/10"
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.12)",
              fontWeight: 600,
              fontSize: "0.95rem",
            }}
          >
            Explore Platform
          </button>
        </div>
      </section>

      {/* Chart Preview */}
      <section className="max-w-5xl mx-auto px-8 pb-16">
        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: "#111827", border: "1px solid rgba(255,255,255,0.08)" }}
        >
          {/* Chart header */}
          <div
            className="flex items-center justify-between px-6 pt-5 pb-4"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs"
                style={{ background: "#F7931A", color: "white", fontWeight: 700 }}
              >
                ₿
              </div>
              <div>
                <div className="text-white text-sm" style={{ fontWeight: 600 }}>
                  BTC / USDT
                </div>
                <div className="text-xs" style={{ color: "#10B981" }}>
                  +4.82% today
                </div>
              </div>
            </div>
            <div>
              <div className="text-white text-xl" style={{ fontWeight: 700 }}>
                $67,542.00
              </div>
              <div className="text-xs text-right" style={{ color: "#94A3B8" }}>
                Virtual Portfolio
              </div>
            </div>
          </div>
          {/* Chart */}
          <div className="px-2 pt-4 pb-2">
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart
                id="landing-btc-chart"
                data={chartData}
                margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
              >
                <XAxis
                  key="x"
                  dataKey="time"
                  tick={{ fill: "#64748B", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  key="y"
                  tick={{ fill: "#64748B", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip key="tooltip" content={<CustomTooltip />} />
                <Area
                  key="area-price"
                  type="monotone"
                  dataKey="price"
                  name="BTC Price"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  fill="#3B82F6"
                  fillOpacity={0.15}
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="max-w-5xl mx-auto px-8 pb-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map(({ label, value }) => (
            <div
              key={label}
              className="text-center py-6 rounded-xl"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <div
                className="text-3xl mb-1"
                style={{
                  fontWeight: 800,
                  background: "linear-gradient(90deg, #3B82F6, #8B5CF6)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                {value}
              </div>
              <div className="text-sm" style={{ color: "#64748B" }}>
                {label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Feature Cards */}
      <section className="max-w-5xl mx-auto px-8 pb-24">
        <div className="text-center mb-12">
          <h2
            className="text-3xl mb-3"
            style={{ fontWeight: 700, color: "white", letterSpacing: "-0.02em" }}
          >
            Everything you need to master trading
          </h2>
          <p className="text-base" style={{ color: "#64748B" }}>
            Professional-grade tools designed for serious traders.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {features.map(({ icon: Icon, title, desc, color, bg }) => (
            <div
              key={title}
              className="p-6 rounded-2xl transition-all hover:-translate-y-1 cursor-pointer"
              style={{ background: "#111827", border: "1px solid rgba(255,255,255,0.06)" }}
              onClick={() => navigate("/app/dashboard")}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                style={{ background: bg }}
              >
                <Icon size={20} style={{ color }} />
              </div>
              <h3 className="text-base mb-2" style={{ fontWeight: 600, color: "white" }}>
                {title}
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: "#64748B" }}>
                {desc}
              </p>
              <div
                className="flex items-center gap-1 mt-4 text-sm"
                style={{ color, fontWeight: 500 }}
              >
                Learn more <ChevronRight size={14} />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Banner */}
      <section className="max-w-5xl mx-auto px-8 pb-24">
        <div
          className="rounded-2xl p-10 text-center"
          style={{
            background:
              "linear-gradient(135deg, rgba(59,130,246,0.15), rgba(139,92,246,0.15))",
            border: "1px solid rgba(59,130,246,0.2)",
          }}
        >
          <h2
            className="text-3xl mb-3"
            style={{ fontWeight: 700, color: "white" }}
          >
            Ready to become a better trader?
          </h2>
          <p className="mb-8" style={{ color: "#94A3B8" }}>
            Join 48,000+ traders who practice daily with CryptoSim.
          </p>
          <button
            onClick={() => navigate("/register")}
            className="px-8 py-3 rounded-xl text-white text-sm transition-all hover:opacity-90"
            style={{
              background: "linear-gradient(135deg, #3B82F6, #8B5CF6)",
              fontWeight: 600,
            }}
          >
            Start for Free — No credit card required
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="max-w-7xl mx-auto px-8 py-10 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div
              className="flex items-center justify-center w-6 h-6 rounded-md"
              style={{ background: "linear-gradient(135deg, #3B82F6, #8B5CF6)" }}
            >
              <Zap size={12} className="text-white" />
            </div>
            <span className="text-sm" style={{ color: "#64748B", fontWeight: 500 }}>
              © 2026 CryptoSim. All rights reserved.
            </span>
          </div>
          <div className="flex items-center gap-6">
            {["Privacy", "Terms", "Support"].map((link) => (
              <a
                key={link}
                href="#"
                className="text-sm hover:text-white transition-colors"
                style={{ color: "#64748B" }}
              >
                {link}
              </a>
            ))}
            <div className="flex items-center gap-3">
              <Twitter
                size={16}
                className="text-gray-500 hover:text-white cursor-pointer transition-colors"
              />
              <Github
                size={16}
                className="text-gray-500 hover:text-white cursor-pointer transition-colors"
              />
              <Globe
                size={16}
                className="text-gray-500 hover:text-white cursor-pointer transition-colors"
              />
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
