import { useEffect, useState } from "react";
import { Trophy, TrendingUp, Medal, Search, Crown, Users, UserCheck, ShieldCheck } from "lucide-react";
import { useAppSession } from "../context/AppSession";
import { appApi } from "../lib/api";

const avatarColors = [
  "#3B82F6","#8B5CF6","#10B981","#F59E0B","#EF4444","#EC4899",
  "#14B8A6","#F97316","#6366F1","#84CC16","#06B6D4","#A855F7",
];

const periods = ["All Time","This Month","This Week","Today"];

const podiumColors = [
  { bg: "rgba(251,191,36,0.1)", border: "rgba(251,191,36,0.2)", text: "#D97706", icon: "#D97706" },
  { bg: "rgba(251,191,36,0.12)", border: "rgba(251,191,36,0.25)", text: "#D97706", icon: "#D97706" },
  { bg: "rgba(180,120,60,0.08)", border: "rgba(180,120,60,0.18)", text: "#B45309", icon: "#B45309" },
];

function ScoreBar({ score, color }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "#E5E7EB", width: 36 }}>
        <div className="h-full rounded-full" style={{ width: `${score}%`, background: color }} />
      </div>
      <span className="text-xs" style={{ fontWeight: 600, color }}>{score}</span>
    </div>
  );
}

function TraderRow({ trader, i, total, isYou, avatarColor }) {
  const [hovered, setHovered] = useState(false);
  const riskColor = trader.riskScore >= 80 ? "#16C784" : trader.riskScore >= 65 ? "#F59E0B" : "#EA3943";
  const conColor = trader.consistency >= 80 ? "#16C784" : trader.consistency >= 65 ? "#3B82F6" : "#F59E0B";

  return (
    <tr
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="transition-colors"
      style={{ borderBottom: i < total - 1 ? "1px solid #F3F4F6" : "none", background: isYou ? "rgba(59,130,246,0.04)" : hovered ? "#F9FAFB" : "transparent" }}
    >
      <td className="px-4 py-3.5">
        <div className="flex items-center justify-center w-7 h-7 rounded-lg text-sm" style={{ background: trader.rank === 1 ? "rgba(251,191,36,0.12)" : trader.rank === 2 ? "rgba(148,163,184,0.1)" : trader.rank === 3 ? "rgba(180,120,60,0.1)" : "#F3F4F6", color: trader.rank === 1 ? "#D97706" : trader.rank === 2 ? "#64748B" : trader.rank === 3 ? "#B45309" : "#6B7280", fontWeight: 700 }}>
          {trader.rank <= 3 ? ["🥇","🥈","🥉"][trader.rank - 1] : trader.rank}
        </div>
      </td>
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs shrink-0" style={{ background: avatarColor, fontWeight: 700 }}>{trader.avatar}</div>
          <div>
            <div className="text-xs flex items-center gap-2" style={{ fontWeight: 600, color: isYou ? "#2563EB" : "#111827" }}>
              {trader.name}
              {trader.badge && !trader.badge.includes("You") && <span>{trader.badge}</span>}
              {isYou && <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: "rgba(59,130,246,0.1)", color: "#2563EB", fontWeight: 500 }}>You</span>}
            </div>
          </div>
        </div>
      </td>
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-1.5">
          <TrendingUp size={12} style={{ color: "#059669" }} />
          <span className="text-xs" style={{ fontWeight: 700, color: "#059669" }}>{trader.profit}</span>
        </div>
      </td>
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-2">
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "#E5E7EB", width: 40 }}>
            <div className="h-full rounded-full" style={{ width: trader.winRate, background: parseFloat(trader.winRate) >= 70 ? "#16C784" : "#3B82F6" }} />
          </div>
          <span className="text-xs" style={{ fontWeight: 600, color: "#111827" }}>{trader.winRate}</span>
        </div>
      </td>
      <td className="px-4 py-3.5 text-xs" style={{ color: "#6B7280" }}>{trader.trades}</td>
      <td className="px-4 py-3.5"><span className="text-xs px-2 py-0.5 rounded" style={{ background: "#F3F4F6", color: "#4B5563", fontWeight: 500 }}>{trader.strategy}</span></td>
      <td className="px-4 py-3.5"><ScoreBar score={trader.riskScore} color={riskColor} /></td>
      <td className="px-4 py-3.5"><ScoreBar score={trader.consistency} color={conColor} /></td>
    </tr>
  );
}

export function Leaderboard() {
  const { accessToken } = useAppSession();
  const [period, setPeriod] = useState("All Time");
  const [mode, setMode] = useState("COMPETITIVE");
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("global");
  const [sortBy, setSortBy] = useState("profit");
  const [sortDir, setSortDir] = useState("desc");
  const [data, setData] = useState({ traders: [], friends: [], fairnessNote: "", mode: "COMPETITIVE" });
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadLeaderboard() {
      if (!accessToken) {
        return;
      }

      try {
        setError("");
        const response = await appApi.getLeaderboard(accessToken, period, mode);
        if (!cancelled) {
          setData({
            traders: response.traders || [],
            friends: response.friends || [],
            fairnessNote: response.fairnessNote || "",
            mode: response.mode || mode,
          });
        }
      } catch (requestError) {
        if (!cancelled) {
          setError(requestError.message || "Failed to load leaderboard.");
        }
      }
    }

    loadLeaderboard();

    const refreshFromRealtime = () => {
      loadLeaderboard();
    };
    window.addEventListener("app:trading-event", refreshFromRealtime);
    window.addEventListener("app:portfolio-updated", refreshFromRealtime);

    return () => {
      cancelled = true;
      window.removeEventListener("app:trading-event", refreshFromRealtime);
      window.removeEventListener("app:portfolio-updated", refreshFromRealtime);
    };
  }, [accessToken, mode, period]);

  const sortKey = { profit: "profitNum", winRate: "winRate", risk: "riskScore", consistency: "consistency", trades: "trades" }[sortBy] || "profitNum";

  const traders = data.traders || [];
  const friendsTraders = data.friends || [];
  const allTraders = tab === "global" ? traders : friendsTraders;
  const sorted = [...allTraders].sort((a, b) => {
    const av = sortKey === "winRate" ? parseFloat(a[sortKey]) : a[sortKey];
    const bv = sortKey === "winRate" ? parseFloat(b[sortKey]) : b[sortKey];
    return sortDir === "desc" ? bv - av : av - bv;
  });
  const filtered = sorted.filter((t) => t.name.toLowerCase().includes(search.toLowerCase()));
  const top3 = sorted.slice(0, 3);
  const podiumOrder = [top3[1], top3[0], top3[2]];
  const podiumHeights = [56, 80, 44];

  const handleSort = (col) => {
    if (sortBy === col) setSortDir(d => d === "desc" ? "asc" : "desc");
    else { setSortBy(col); setSortDir("desc"); }
  };

  return (
    <div className="p-5 min-h-full" style={{ background: "#F8FAFC", fontFamily: "Inter, sans-serif", color: "#111827" }}>
      {/* Header */}
      <div className="mb-5">
        <h1 className="text-base mb-0.5" style={{ fontWeight: 700, color: "#111827", letterSpacing: "-0.02em" }}>Leaderboard</h1>
        <p className="text-xs" style={{ color: "#6B7280" }}>Top performing traders in the CryptoSim community.</p>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-xl text-xs" style={{ background: "rgba(234,57,67,0.06)", border: "1px solid rgba(234,57,67,0.18)", color: "#DC2626" }}>
          {error}
        </div>
      )}

      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex rounded-lg overflow-hidden" style={{ border: "1px solid #E5E7EB", background: "#FFFFFF" }}>
          {[
            { key: "COMPETITIVE", label: "Competitive" },
            { key: "DEMO", label: "Demo" },
          ].map((option) => (
            <button
              key={option.key}
              onClick={() => setMode(option.key)}
              className="px-3 py-1.5 text-xs transition-colors"
              style={{
                background: mode === option.key ? "#111827" : "transparent",
                color: mode === option.key ? "#FFFFFF" : "#6B7280",
                fontWeight: mode === option.key ? 600 : 500,
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
        <div className="text-xs px-3 py-1.5 rounded-lg" style={{ background: "#FFFFFF", border: "1px solid #E5E7EB", color: "#6B7280" }}>
          {data.fairnessNote || "Ranks are normalized by return %, not raw balance."}
        </div>
      </div>

      {/* Top 3 Podium */}
      <div className="flex items-end justify-center gap-3 mb-6 max-w-xl mx-auto">
        {podiumOrder.map((trader, idx) => {
          if (!trader) return null;
          const style = podiumColors[idx];
          const isFirst = idx === 1;
          return (
            <div key={trader.rank} className="flex flex-col items-center" style={{ width: 120 }}>
              {isFirst && <Crown size={18} style={{ color: "#D97706", marginBottom: 4 }} />}
              <div className="rounded-full flex items-center justify-center text-white mb-1.5" style={{ width: isFirst ? 56 : 48, height: isFirst ? 56 : 48, background: trader.avatarColor || avatarColors[trader.rank - 1] || "#3B82F6", fontWeight: 700, fontSize: isFirst ? "1rem" : "0.875rem", border: isFirst ? "2px solid #F59E0B" : "2px solid #E5E7EB" }}>
                {trader.avatar}
              </div>
              <div className="text-xs text-center truncate w-full mb-0.5" style={{ fontWeight: isFirst ? 700 : 600, color: "#111827" }}>{trader.name}</div>
              <div className="text-xs mb-2 text-center" style={{ color: "#059669", fontWeight: 600 }}>{trader.profit}</div>
              <div className="w-full rounded-t-xl flex flex-col items-center justify-center" style={{ background: style.bg, border: `1px solid ${style.border}`, borderBottom: "none", minHeight: podiumHeights[idx] }}>
                {isFirst ? <Trophy size={18} style={{ color: style.icon }} /> : <Medal size={16} style={{ color: style.icon }} />}
                <span className="text-xs mt-0.5" style={{ fontWeight: 700, color: style.text }}>{trader.rank === 1 ? "1st" : trader.rank === 2 ? "2nd" : "3rd"}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1">
          {/* Tab switcher */}
          <div className="flex rounded-lg overflow-hidden mr-2" style={{ border: "1px solid #E5E7EB" }}>
            <button onClick={() => setTab("global")} className="flex items-center gap-1.5 px-3 py-1.5 text-xs transition-colors" style={{ background: tab === "global" ? "#3B82F6" : "white", color: tab === "global" ? "white" : "#6B7280", fontWeight: tab === "global" ? 600 : 400 }}>
              <Users size={11} /> Global
            </button>
            <button onClick={() => setTab("friends")} className="flex items-center gap-1.5 px-3 py-1.5 text-xs transition-colors" style={{ background: tab === "friends" ? "#3B82F6" : "white", color: tab === "friends" ? "white" : "#6B7280", fontWeight: tab === "friends" ? 600 : 400 }}>
              <UserCheck size={11} /> Friends
            </button>
          </div>

          {periods.map((p) => (
            <button key={p} onClick={() => setPeriod(p)} className="px-3 py-1.5 rounded-lg text-xs transition-colors" style={{ background: period === p ? "rgba(59,130,246,0.08)" : "transparent", color: period === p ? "#2563EB" : "#6B7280", fontWeight: period === p ? 600 : 400, border: period === p ? "1px solid rgba(59,130,246,0.2)" : "1px solid transparent" }}>
              {p}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: "#FFFFFF", border: "1px solid #E5E7EB" }}>
          <Search size={12} style={{ color: "#9CA3AF" }} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search traders..." className="bg-transparent outline-none text-xs" style={{ color: "#111827", width: 140 }} />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl overflow-hidden" style={{ background: "#FFFFFF", border: "1px solid #E5E7EB" }}>
        <table className="w-full">
          <thead style={{ borderBottom: "1px solid #E5E7EB", background: "#F9FAFB" }}>
            <tr>
              {[
                { label: "Rank",        key: null },
                { label: "Trader",      key: null },
                { label: "Profit %",    key: "profit" },
                { label: "Win Rate",    key: "winRate" },
                { label: "Trades",      key: "trades" },
                { label: "Strategy",    key: null },
                { label: "Risk Score",  key: "risk" },
                { label: "Consistency", key: "consistency" },
              ].map(({ label, key }) => (
                <th key={label} className="text-left px-4 py-3 text-xs" style={{ color: "#9CA3AF", fontWeight: 500, cursor: key ? "pointer" : "default", userSelect: "none" }}
                  onClick={() => key && handleSort(key)}>
                  <div className="flex items-center gap-1">
                    {label === "Risk Score" && <ShieldCheck size={10} style={{ color: "#16C784" }} />}
                    {label}
                    {key && sortBy === key && <span style={{ color: "#3B82F6" }}>{sortDir === "desc" ? " ↓" : " ↑"}</span>}
                    {key && sortBy !== key && <span style={{ color: "#E5E7EB" }}> ↕</span>}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((trader, i) => {
              const isYou = trader.badge?.includes("You");
              return (
                <TraderRow
                  key={trader.rank}
                  trader={trader}
                  i={i}
                  total={filtered.length}
                  isYou={isYou}
                  avatarColor={trader.avatarColor || avatarColors[i % avatarColors.length]}
                />
              );
            })}
          </tbody>
        </table>
      </div>

      {!filtered.length && (
        <div className="mt-4 p-4 rounded-xl text-center" style={{ background: "#FFFFFF", border: "1px solid #E5E7EB" }}>
          <Trophy size={24} style={{ color: "#D1D5DB", margin: "0 auto 8px" }} />
          <p className="text-xs" style={{ color: "#6B7280" }}>
            {mode === "COMPETITIVE"
              ? "No eligible competitive accounts are available yet. Switch to Demo to see all practice traders."
              : "No demo traders matched the current filters."}
          </p>
        </div>
      )}

      {tab === "friends" && filtered.length < 5 && (
        <div className="mt-4 p-4 rounded-xl text-center" style={{ background: "#FFFFFF", border: "1px solid #E5E7EB" }}>
          <UserCheck size={24} style={{ color: "#D1D5DB", margin: "0 auto 8px" }} />
          <p className="text-xs" style={{ color: "#9CA3AF" }}>Invite more friends to see them on the leaderboard.</p>
          <button className="mt-2 text-xs px-3 py-1.5 rounded-lg text-white" style={{ background: "linear-gradient(135deg, #3B82F6, #8B5CF6)", fontWeight: 600 }}>
            Invite Friends
          </button>
        </div>
      )}
    </div>
  );
}
