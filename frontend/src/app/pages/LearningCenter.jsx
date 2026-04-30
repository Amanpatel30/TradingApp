import { useEffect, useState } from "react";
import { BookOpen, Play, CheckCircle, ChevronRight, Search, Star, Clock, BarChart2, Shield, Zap, TrendingUp, Cpu, Lock, Map, ChevronDown, Award, X } from "lucide-react";
import { useAppSession } from "../context/AppSession";
import { appApi } from "../lib/api";

const categories = [
  { id: "concepts", label: "Trading Concepts", icon: BookOpen, color: "#3B82F6" },
  { id: "strategies", label: "Strategy Tutorials", icon: TrendingUp, color: "#16C784" },
  { id: "risk", label: "Risk Management", icon: Shield, color: "#F59E0B" },
  { id: "platform", label: "Platform Guides", icon: Zap, color: "#8B5CF6" },
  { id: "quant", label: "Quant & Analytics", icon: BarChart2, color: "#EC4899" },
];

const lessons = [
  // Trading Concepts
  { id: 1, category: "concepts", title: "How Order Books Work", desc: "Understand bid/ask, depth of market, and how orders get filled.", duration: "12 min", level: "Beginner", completed: true, rating: 4.8, icon: BookOpen, color: "#3B82F6" },
  { id: 2, category: "concepts", title: "Candlestick Patterns", desc: "Master the 12 most important candlestick patterns for price action.", duration: "18 min", level: "Beginner", completed: true, rating: 4.9, icon: BarChart2, color: "#3B82F6" },
  { id: 3, category: "concepts", title: "Market Structure & Trends", desc: "Learn to identify higher highs, lower lows, and range environments.", duration: "22 min", level: "Intermediate", completed: false, rating: 4.7, icon: TrendingUp, color: "#3B82F6" },
  { id: 4, category: "concepts", title: "Understanding Leverage", desc: "How leverage amplifies both gains and losses — with real examples.", duration: "15 min", level: "Beginner", completed: false, rating: 4.6, icon: Zap, color: "#3B82F6" },
  { id: 5, category: "concepts", title: "Liquidity & Market Depth", desc: "Why liquidity matters and how to trade around thin order books.", duration: "20 min", level: "Advanced", completed: false, rating: 4.5, icon: BarChart2, color: "#3B82F6" },

  // Strategies
  { id: 6, category: "strategies", title: "Breakout Trading", desc: "Identify, enter, and manage breakout trades using volume confirmation.", duration: "25 min", level: "Intermediate", completed: true, rating: 4.9, icon: TrendingUp, color: "#16C784" },
  { id: 7, category: "strategies", title: "RSI Reversal Strategy", desc: "Using RSI divergence and oversold/overbought zones for entries.", duration: "20 min", level: "Intermediate", completed: false, rating: 4.7, icon: BarChart2, color: "#16C784" },
  { id: 8, category: "strategies", title: "Moving Average Crossovers", desc: "Building a systematic MA-based strategy from entry to exit rules.", duration: "16 min", level: "Beginner", completed: false, rating: 4.6, icon: TrendingUp, color: "#16C784" },
  { id: 9, category: "strategies", title: "VWAP Trading", desc: "Using VWAP as dynamic support/resistance on intraday charts.", duration: "22 min", level: "Advanced", completed: false, rating: 4.8, icon: BarChart2, color: "#16C784" },
  { id: 10, category: "strategies", title: "Swing Trading Setups", desc: "Capture multi-day moves with minimal screen time using daily charts.", duration: "30 min", level: "Intermediate", completed: false, rating: 4.7, icon: TrendingUp, color: "#16C784" },

  // Risk Management
  { id: 11, category: "risk", title: "The 1% Rule Explained", desc: "Why risking no more than 1-2% per trade protects your capital long term.", duration: "10 min", level: "Beginner", completed: true, rating: 5.0, icon: Shield, color: "#F59E0B" },
  { id: 12, category: "risk", title: "Position Sizing Formulas", desc: "Calculate the exact position size for any trade using ATR and account %.", duration: "18 min", level: "Intermediate", completed: false, rating: 4.8, icon: BarChart2, color: "#F59E0B" },
  { id: 13, category: "risk", title: "Stop Loss Placement", desc: "Where to set stop losses based on structure, ATR, and volatility.", duration: "20 min", level: "Intermediate", completed: false, rating: 4.9, icon: Shield, color: "#F59E0B" },
  { id: 14, category: "risk", title: "Portfolio Risk & Correlation", desc: "Avoid concentration risk when holding multiple correlated crypto positions.", duration: "24 min", level: "Advanced", completed: false, rating: 4.6, icon: BarChart2, color: "#F59E0B" },

  // Platform Guides
  { id: 15, category: "platform", title: "Using the Trade Simulator", desc: "Full walkthrough of the CryptoSim trade simulator interface.", duration: "14 min", level: "Beginner", completed: true, rating: 4.8, icon: Zap, color: "#8B5CF6" },
  { id: 16, category: "platform", title: "Setting Up Market Replay", desc: "How to select periods, speed, and use replay for deliberate practice.", duration: "12 min", level: "Beginner", completed: false, rating: 4.7, icon: Play, color: "#8B5CF6" },
  { id: 17, category: "platform", title: "Strategy Builder Deep Dive", desc: "Build, test, and optimize no-code strategies with the visual builder.", duration: "28 min", level: "Intermediate", completed: false, rating: 4.8, icon: Cpu, color: "#8B5CF6" },

  // Quant
  { id: 18, category: "quant", title: "Backtesting Fundamentals", desc: "How to correctly backtest a strategy without curve-fitting.", duration: "26 min", level: "Advanced", completed: false, rating: 4.7, icon: BarChart2, color: "#EC4899" },
  { id: 19, category: "quant", title: "Sharpe Ratio & Sortino", desc: "Evaluate strategy quality beyond raw returns using risk-adjusted metrics.", duration: "20 min", level: "Advanced", completed: false, rating: 4.6, icon: BarChart2, color: "#EC4899" },
  { id: 20, category: "quant", title: "Monte Carlo Simulation", desc: "Stress test strategies using random scenario generation.", duration: "35 min", level: "Expert", completed: false, rating: 4.8, icon: Cpu, color: "#EC4899", locked: true },
];

const levelColors = {
  Beginner: { bg: "rgba(22,199,132,0.1)", color: "#059669" },
  Intermediate: { bg: "rgba(59,130,246,0.1)", color: "#2563EB" },
  Advanced: { bg: "rgba(245,158,11,0.1)", color: "#D97706" },
  Expert: { bg: "rgba(139,92,246,0.1)", color: "#7C3AED" },
};

const learningPaths = [
  {
    id: "beginner",
    title: "Beginner Trader",
    subtitle: "Start from zero — build a solid foundation",
    color: "#22C55E",
    bg: "rgba(34,197,94,0.08)",
    border: "rgba(34,197,94,0.2)",
    icon: BookOpen,
    lessonIds: [1, 2, 3, 4, 11, 15],
    level: "Beginner",
    duration: "87 min",
    completedIds: [1, 2, 11, 15],
  },
  {
    id: "intermediate",
    title: "Intermediate Strategy Builder",
    subtitle: "Build repeatable edge with proven strategies",
    color: "#3B82F6",
    bg: "rgba(59,130,246,0.08)",
    border: "rgba(59,130,246,0.2)",
    icon: TrendingUp,
    lessonIds: [6, 7, 8, 9, 10, 12, 13, 17],
    level: "Intermediate",
    duration: "161 min",
    completedIds: [6],
  },
  {
    id: "advanced",
    title: "Advanced Quant Trading",
    subtitle: "Professional-grade analytics and systematic trading",
    color: "#8B5CF6",
    bg: "rgba(139,92,246,0.08)",
    border: "rgba(139,92,246,0.2)",
    icon: Cpu,
    lessonIds: [5, 14, 18, 19, 20],
    level: "Advanced",
    duration: "135 min",
    completedIds: [],
  },
];

function LessonCard({ lesson, onClick }) {
  const { bg: lvlBg, color: lvlColor } = levelColors[lesson.level] || {};
  return (
    <div
      onClick={() => !lesson.locked && onClick(lesson)}
      className="p-4 rounded-xl cursor-pointer transition-all hover:shadow-md group"
      style={{ background: "#FFFFFF", border: "1px solid #E5E7EB", opacity: lesson.locked ? 0.7 : 1 }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${lesson.color}14` }}>
          {lesson.locked ? <Lock size={14} style={{ color: "#9CA3AF" }} /> : <lesson.icon size={14} style={{ color: lesson.color }} />}
        </div>
        <div className="flex items-center gap-2">
          {lesson.completed && <CheckCircle size={14} style={{ color: "#16C784" }} />}
          {lesson.locked && <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: "rgba(139,92,246,0.1)", color: "#7C3AED", fontWeight: 600 }}>PRO</span>}
        </div>
      </div>

      <h3 className="text-sm mb-1" style={{ fontWeight: 600, color: "#111827" }}>{lesson.title}</h3>
      <p className="text-xs mb-3 leading-relaxed" style={{ color: "#6B7280" }}>{lesson.desc}</p>

      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: lvlBg, color: lvlColor, fontWeight: 500 }}>{lesson.level}</span>
        <div className="flex items-center gap-1 text-xs" style={{ color: "#9CA3AF" }}>
          <Clock size={10} />{lesson.duration}
        </div>
        <div className="flex items-center gap-0.5 ml-auto">
          <Star size={10} fill="#F59E0B" style={{ color: "#F59E0B" }} />
          <span className="text-xs" style={{ color: "#6B7280", fontWeight: 500 }}>{lesson.rating}</span>
        </div>
      </div>
    </div>
  );
}

// Quiz questions per lesson (keyed by lesson id)
const quizzes = {
  1: [
    { q: "What does the 'ask' price represent in an order book?", options: ["The price sellers are willing to accept", "The price buyers are willing to pay", "The last traded price", "The average price"], correct: 0 },
    { q: "Which side of the order book shows buy orders?", options: ["Ask side", "Bid side", "Both sides", "Neither"], correct: 1 },
  ],
  2: [
    { q: "A bullish engulfing candle means…", options: ["Buyers overwhelmed sellers", "Sellers overwhelmed buyers", "Price didn't move", "Volume was low"], correct: 0 },
    { q: "A doji candlestick typically signals…", options: ["Strong trend continuation", "Indecision in the market", "A confirmed reversal", "High volume"], correct: 1 },
  ],
  11: [
    { q: "The 1% rule states you should risk no more than…", options: ["1% of your total account per trade", "1% of your monthly profit", "1% of each trade's gross profit", "1% per day"], correct: 0 },
    { q: "Why is position sizing important?", options: ["It controls how much you risk per trade", "It determines your chart timeframe", "It sets your entry price", "It has no real effect"], correct: 0 },
  ],
};

function QuizPanel({ lessonId, onComplete }) {
  const questions = quizzes[lessonId] || [
    { q: "Which of these is a key risk management principle?", options: ["Never use a stop loss", "Risk a fixed % per trade", "Trade as large as possible", "Ignore drawdowns"], correct: 1 },
    { q: "What is a Risk:Reward ratio of 1:2?", options: ["Risk $2 to make $1", "Risk $1 to make $2", "Risk $1 to make $1", "Risk $2 to make $2"], correct: 1 },
  ];
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState(null);
  const [answered, setAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  const handleAnswer = (idx) => {
    if (answered) return;
    setSelected(idx);
    setAnswered(true);
    if (idx === questions[current].correct) setScore(s => s + 1);
  };

  const next = () => {
    if (current < questions.length - 1) {
      setCurrent(c => c + 1);
      setSelected(null);
      setAnswered(false);
    } else {
      setDone(true);
    }
  };

  if (done) {
    const pct = Math.round((score / questions.length) * 100);
    return (
      <div className="p-4 rounded-xl text-center" style={{ background: pct >= 50 ? "rgba(34,197,94,0.07)" : "rgba(245,158,11,0.07)", border: `1px solid ${pct >= 50 ? "rgba(34,197,94,0.2)" : "rgba(245,158,11,0.2)"}` }}>
        <Award size={28} style={{ color: pct >= 50 ? "#22C55E" : "#F59E0B", margin: "0 auto 8px" }} />
        <div style={{ fontWeight: 700, color: "#111827", fontSize: "1.1rem" }}>{pct}%</div>
        <div className="text-xs mb-3" style={{ color: "#6B7280" }}>{score}/{questions.length} correct · {pct >= 50 ? "Passed! 🎉" : "Try again"}</div>
        {pct >= 50 ? (
          <button onClick={onComplete} className="px-4 py-2 rounded-xl text-white text-xs" style={{ background: "linear-gradient(135deg, #3B82F6, #8B5CF6)", fontWeight: 600 }}>
            Complete Lesson ✓
          </button>
        ) : (
          <button onClick={() => { setCurrent(0); setSelected(null); setAnswered(false); setScore(0); setDone(false); }} className="px-4 py-2 rounded-xl text-xs" style={{ background: "#F3F4F6", color: "#6B7280", fontWeight: 600 }}>
            Retry Quiz
          </button>
        )}
      </div>
    );
  }

  const q = questions[current];
  return (
    <div className="rounded-xl overflow-hidden" style={{ border: "1px solid #E5E7EB" }}>
      <div className="px-4 py-3 flex items-center justify-between" style={{ background: "#F9FAFB", borderBottom: "1px solid #E5E7EB" }}>
        <div className="flex items-center gap-2">
          <Award size={13} style={{ color: "#8B5CF6" }} />
          <span className="text-xs" style={{ fontWeight: 600, color: "#6B7280" }}>QUIZ — Question {current+1}/{questions.length}</span>
        </div>
        <div className="flex gap-1">
          {questions.map((_, i) => (
            <div key={i} className="w-1.5 h-1.5 rounded-full" style={{ background: i < current ? "#22C55E" : i === current ? "#3B82F6" : "#E5E7EB" }} />
          ))}
        </div>
      </div>
      <div className="p-4">
        <p className="text-sm mb-4" style={{ fontWeight: 500, color: "#111827", lineHeight: 1.5 }}>{q.q}</p>
        <div className="space-y-2">
          {q.options.map((opt, i) => {
            let bg = "#F9FAFB", border = "#E5E7EB", color = "#374151";
            if (answered) {
              if (i === q.correct) { bg = "rgba(34,197,94,0.08)"; border = "rgba(34,197,94,0.35)"; color = "#059669"; }
              else if (i === selected && i !== q.correct) { bg = "rgba(239,68,68,0.08)"; border = "rgba(239,68,68,0.35)"; color = "#DC2626"; }
            } else if (selected === i) { bg = "rgba(59,130,246,0.08)"; border = "#3B82F6"; color = "#1D4ED8"; }
            return (
              <button key={i} onClick={() => handleAnswer(i)} className="w-full text-left px-3 py-2.5 rounded-xl text-xs transition-all"
                style={{ background: bg, border: `1px solid ${border}`, color, fontWeight: answered && i === q.correct ? 600 : 400 }}>
                {String.fromCharCode(65+i)}. {opt}
                {answered && i === q.correct && <span className="ml-2">✓</span>}
                {answered && i === selected && i !== q.correct && <span className="ml-2">✗</span>}
              </button>
            );
          })}
        </div>
        {answered && (
          <button onClick={next} className="w-full mt-3 py-2 rounded-xl text-xs text-white" style={{ background: "linear-gradient(135deg, #3B82F6, #8B5CF6)", fontWeight: 600 }}>
            {current < questions.length - 1 ? "Next Question →" : "See Results"}
          </button>
        )}
      </div>
    </div>
  );
}

export function LearningCenter() {
  const { accessToken } = useAppSession();
  const [activeCategory, setActiveCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [activeView, setActiveView] = useState("paths"); // "paths" | "lessons"
  const [expandedPath, setExpandedPath] = useState(null);
  const [lessonPhase, setLessonPhase] = useState("video"); // "video" | "quiz" | "done"
  const [learningData, setLearningData] = useState({ lessons: [], paths: [], completedLessonIds: [] });
  const [completedLessons, setCompletedLessons] = useState(new Set());
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadLearning() {
      if (!accessToken) {
        return;
      }

      try {
        setError("");
        const response = await appApi.getLearningOverview(accessToken);
        if (!cancelled) {
          setLearningData(response);
          setCompletedLessons(new Set(response.completedLessonIds || []));
        }
      } catch (requestError) {
        if (!cancelled) {
          setError(requestError.message || "Failed to load learning center.");
        }
      }
    }

    loadLearning();

    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  const iconByKey = {
    BookOpen,
    Play,
    BarChart2,
    Shield,
    Zap,
    TrendingUp,
    Cpu,
  };

  const lessons = (learningData.lessons || []).map((lesson) => ({
    ...lesson,
    icon: iconByKey[lesson.iconKey] || BookOpen,
    completed: completedLessons.has(lesson.id) || lesson.completed,
  }));
  const learningPaths = (learningData.paths || []).map((path) => ({
    ...path,
    icon: iconByKey[path.iconKey] || BookOpen,
    completedIds: path.completedIds || [],
  }));

  const filtered = lessons.filter((l) => {
    const matchCat = activeCategory === "all" || l.category === activeCategory;
    const matchSearch = l.title.toLowerCase().includes(search.toLowerCase()) || l.desc.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const completedCount = lessons.filter((l) => l.completed).length;
  const totalCount = lessons.length;
  const progressPct = Math.round((completedCount / totalCount) * 100);

  if (selectedLesson) {
    const { bg: lvlBg, color: lvlColor } = levelColors[selectedLesson.level] || {};
    const isDone = completedLessons.has(selectedLesson.id) || lessonPhase === "done";

    const handleComplete = () => {
      appApi.updateLearningProgress(accessToken, selectedLesson.id, {
        status: "COMPLETED",
        score: 100,
      })
        .then(async () => {
          setCompletedLessons(prev => new Set([...prev, selectedLesson.id]));
          const response = await appApi.getLearningOverview(accessToken);
          setLearningData(response);
          setLessonPhase("done");
        })
        .catch((requestError) => {
          setError(requestError.message || "Failed to save learning progress.");
        });
    };

    return (
      <div className="flex h-full" style={{ background: "#F8FAFC", fontFamily: "Inter, sans-serif" }}>
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-2xl mx-auto p-6">
            <button onClick={() => { setSelectedLesson(null); setLessonPhase("video"); }} className="flex items-center gap-1.5 text-xs mb-4 transition-colors hover:text-blue-600" style={{ color: "#6B7280" }}>
              ← Back to Learning Center
            </button>

            {/* Progress steps */}
            <div className="flex items-center gap-3 mb-5">
              {[["video","1. Lesson"],["quiz","2. Quiz"],["done","3. Complete"]].map(([phase, label], i) => {
                const active = lessonPhase === phase;
                const passed = (phase === "video" && (lessonPhase === "quiz" || lessonPhase === "done")) || (phase === "quiz" && lessonPhase === "done");
                return (
                  <div key={phase} className="flex items-center gap-2">
                    {i > 0 && <div style={{ width: 24, height: 1, background: "#E5E7EB" }} />}
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs" style={{ background: passed ? "#22C55E" : active ? "#3B82F6" : "#E5E7EB", color: passed || active ? "white" : "#9CA3AF", fontWeight: 700 }}>
                        {passed ? "✓" : i+1}
                      </div>
                      <span className="text-xs" style={{ color: active ? "#111827" : "#9CA3AF", fontWeight: active ? 600 : 400 }}>{label}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-5 rounded-2xl mb-4" style={{ background: "#FFFFFF", border: "1px solid #E5E7EB" }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${selectedLesson.color}14` }}>
                  <selectedLesson.icon size={18} style={{ color: selectedLesson.color }} />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: lvlBg, color: lvlColor, fontWeight: 500 }}>{selectedLesson.level}</span>
                    <span className="text-xs" style={{ color: "#9CA3AF" }}>{selectedLesson.duration}</span>
                    {isDone && <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: "rgba(34,197,94,0.1)", color: "#059669", fontWeight: 600 }}>✓ Completed</span>}
                  </div>
                  <h1 style={{ fontWeight: 700, color: "#111827", fontSize: "1.1rem" }}>{selectedLesson.title}</h1>
                </div>
              </div>

              {lessonPhase !== "quiz" && lessonPhase !== "done" && (
                <>
                  <div className="rounded-xl flex items-center justify-center mb-4" style={{ background: "#0B0F19", height: 200, border: "1px solid #1F2937" }}>
                    <div className="text-center">
                      <button className="w-14 h-14 rounded-full flex items-center justify-center mb-2 mx-auto transition-all hover:scale-110" style={{ background: "linear-gradient(135deg, #3B82F6, #8B5CF6)" }}>
                        <Play size={22} className="text-white" style={{ marginLeft: 2 }} />
                      </button>
                      <p className="text-xs" style={{ color: "#64748B" }}>Click to start lesson</p>
                    </div>
                  </div>
                  <p className="text-sm leading-relaxed mb-4" style={{ color: "#374151" }}>{selectedLesson.desc}</p>
                  <div className="p-4 rounded-xl mb-4" style={{ background: "#F9FAFB", border: "1px solid #E5E7EB" }}>
                    <div className="text-xs mb-3" style={{ fontWeight: 600, color: "#6B7280", letterSpacing: "0.05em" }}>KEY TAKEAWAYS</div>
                    {["Understand the fundamental principles behind this concept","Apply these techniques directly in your simulated trades","Recognize common mistakes and how to avoid them","Build a systematic process you can repeat consistently"].map((point, i) => (
                      <div key={i} className="flex items-start gap-2.5 mb-2">
                        <div className="w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ background: "rgba(34,197,94,0.15)" }}>
                          <CheckCircle size={10} style={{ color: "#22C55E" }} />
                        </div>
                        <p className="text-xs" style={{ color: "#4B5563", lineHeight: 1.6 }}>{point}</p>
                      </div>
                    ))}
                  </div>
                  <button onClick={() => setLessonPhase("quiz")} className="w-full py-2.5 rounded-xl text-white" style={{ background: "linear-gradient(135deg, #3B82F6, #8B5CF6)", fontWeight: 600 }}>
                    Take Quiz to Complete →
                  </button>
                </>
              )}

              {lessonPhase === "quiz" && (
                <QuizPanel lessonId={selectedLesson.id} onComplete={handleComplete} />
              )}

              {lessonPhase === "done" && (
                <div className="text-center py-6">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3" style={{ background: "rgba(34,197,94,0.12)" }}>
                    <Award size={28} style={{ color: "#22C55E" }} />
                  </div>
                  <div style={{ fontWeight: 700, color: "#111827", fontSize: "1.1rem", marginBottom: 4 }}>Lesson Complete! 🎉</div>
                  <p className="text-xs mb-4" style={{ color: "#6B7280" }}>Great job finishing <strong>{selectedLesson.title}</strong>. Your progress has been saved.</p>
                  <button onClick={() => { setSelectedLesson(null); setLessonPhase("video"); }} className="px-5 py-2.5 rounded-xl text-white text-xs" style={{ background: "linear-gradient(135deg, #3B82F6, #8B5CF6)", fontWeight: 600 }}>
                    Back to Learning Center
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="w-64 shrink-0 overflow-y-auto p-4" style={{ background: "#FFFFFF", borderLeft: "1px solid #E5E7EB" }}>
          <div className="text-xs mb-3" style={{ fontWeight: 600, color: "#6B7280", letterSpacing: "0.05em" }}>RELATED LESSONS</div>
          <div className="space-y-2">
            {lessons.filter((l) => l.category === selectedLesson.category && l.id !== selectedLesson.id).slice(0, 6).map((l) => (
              <div key={l.id} onClick={() => setSelectedLesson(l)} className="flex items-center gap-2.5 p-2.5 rounded-xl cursor-pointer transition-colors hover:bg-gray-50" style={{ border: "1px solid #F3F4F6" }}>
                <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${l.color}14` }}>
                  <l.icon size={11} style={{ color: l.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs truncate" style={{ fontWeight: 500, color: "#111827" }}>{l.title}</p>
                  <p className="text-xs" style={{ color: "#9CA3AF" }}>{l.duration}</p>
                </div>
                {l.completed && <CheckCircle size={11} style={{ color: "#22C55E", flexShrink: 0 }} />}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-5 min-h-full" style={{ background: "#F8FAFC", fontFamily: "Inter, sans-serif", color: "#111827" }}>
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="text-base mb-0.5" style={{ fontWeight: 700, color: "#111827", letterSpacing: "-0.02em" }}>Learning Center</h1>
          <p className="text-xs" style={{ color: "#6B7280" }}>Structured paths and individual lessons for every skill level.</p>
        </div>
        <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl" style={{ background: "#FFFFFF", border: "1px solid #E5E7EB" }}>
          <div className="text-right">
            <div className="text-xs" style={{ color: "#9CA3AF" }}>Your progress</div>
            <div className="text-sm" style={{ fontWeight: 700, color: "#111827" }}>{completedCount}/{totalCount} lessons</div>
          </div>
          <div className="relative w-12 h-12">
            <svg width="48" height="48" viewBox="0 0 48 48">
              <circle cx="24" cy="24" r="18" fill="none" stroke="#F3F4F6" strokeWidth="5" />
              <circle cx="24" cy="24" r="18" fill="none" stroke="#3B82F6" strokeWidth="5" strokeDasharray={`${(progressPct / 100) * 113} 113`} strokeLinecap="round" transform="rotate(-90 24 24)" />
              <text x="24" y="27" textAnchor="middle" style={{ fontSize: 9, fontWeight: 800, fill: "#111827" }}>{progressPct}%</text>
            </svg>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-xl text-xs" style={{ background: "rgba(234,57,67,0.06)", border: "1px solid rgba(234,57,67,0.18)", color: "#DC2626" }}>
          {error}
        </div>
      )}

      {/* View switcher */}
      <div className="flex items-center gap-2 mb-5">
        <div className="flex rounded-xl overflow-hidden" style={{ border: "1px solid #E5E7EB" }}>
          <button onClick={() => setActiveView("paths")} className="flex items-center gap-1.5 px-4 py-2 text-xs transition-colors" style={{ background: activeView === "paths" ? "#3B82F6" : "white", color: activeView === "paths" ? "white" : "#6B7280", fontWeight: activeView === "paths" ? 600 : 400 }}>
            <Map size={12} /> Learning Paths
          </button>
          <button onClick={() => setActiveView("lessons")} className="flex items-center gap-1.5 px-4 py-2 text-xs transition-colors" style={{ background: activeView === "lessons" ? "#3B82F6" : "white", color: activeView === "lessons" ? "white" : "#6B7280", fontWeight: activeView === "lessons" ? 600 : 400 }}>
            <BookOpen size={12} /> All Lessons
          </button>
        </div>
      </div>

      {/* Learning Paths View */}
      {activeView === "paths" && (
        <div className="space-y-4">
          {learningPaths.map((path) => {
            const pathLessons = lessons.filter((l) => path.lessonIds.includes(l.id));
            const completedInPath = pathLessons.filter((l) => path.completedIds.includes(l.id)).length;
            const pathProgress = Math.round((completedInPath / pathLessons.length) * 100);
            const isExpanded = expandedPath === path.id;

            return (
              <div key={path.id} className="rounded-2xl overflow-hidden" style={{ background: "#FFFFFF", border: `1px solid ${isExpanded ? path.border : "#E5E7EB"}` }}>
                {/* Path header */}
                <div
                  className="p-5 cursor-pointer"
                  style={{ background: isExpanded ? path.bg : "transparent" }}
                  onClick={() => setExpandedPath(isExpanded ? null : path.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: path.bg, border: `1px solid ${path.border}` }}>
                        <path.icon size={18} style={{ color: path.color }} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: path.bg, color: path.color, fontWeight: 600, border: `1px solid ${path.border}` }}>{path.level}</span>
                          <span className="text-xs" style={{ color: "#9CA3AF" }}>{path.lessonIds.length} lessons · {path.duration}</span>
                        </div>
                        <h3 style={{ fontWeight: 700, color: "#111827", fontSize: "0.95rem" }}>{path.title}</h3>
                        <p className="text-xs mt-0.5" style={{ color: "#6B7280" }}>{path.subtitle}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-xs mb-1" style={{ color: "#9CA3AF" }}>{completedInPath}/{pathLessons.length} done</div>
                        <div className="h-1.5 w-24 rounded-full overflow-hidden" style={{ background: "#F3F4F6" }}>
                          <div className="h-full rounded-full transition-all" style={{ width: `${pathProgress}%`, background: path.color }} />
                        </div>
                      </div>
                      <ChevronDown size={16} style={{ color: "#9CA3AF", transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }} />
                    </div>
                  </div>
                </div>

                {/* Expanded lesson list */}
                {isExpanded && (
                  <div style={{ borderTop: `1px solid ${path.border}` }}>
                    {pathLessons.map((lesson, idx) => {
                      const done = path.completedIds.includes(lesson.id);
                      const { bg: lvlBg, color: lvlColor } = levelColors[lesson.level] || {};
                      return (
                        <div
                          key={lesson.id}
                          onClick={() => !lesson.locked && setSelectedLesson(lesson)}
                          className="flex items-center gap-3 px-5 py-3 cursor-pointer transition-colors hover:bg-gray-50"
                          style={{ borderBottom: idx < pathLessons.length - 1 ? "1px solid #F3F4F6" : "none" }}
                        >
                          <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ background: done ? path.bg : "#F3F4F6", border: `1px solid ${done ? path.border : "#E5E7EB"}` }}>
                            {done ? <CheckCircle size={12} style={{ color: path.color }} /> : <span style={{ fontSize: "0.6rem", color: "#9CA3AF", fontWeight: 600 }}>{idx + 1}</span>}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs" style={{ fontWeight: 600, color: done ? "#9CA3AF" : "#111827", textDecoration: done ? "line-through" : "none" }}>{lesson.title}</span>
                              {lesson.locked && <Lock size={10} style={{ color: "#9CA3AF" }} />}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs" style={{ color: "#9CA3AF" }}>{lesson.duration}</span>
                              <span className="text-xs px-1 py-0 rounded" style={{ background: lvlBg, color: lvlColor, fontWeight: 500 }}>{lesson.level}</span>
                            </div>
                          </div>
                          <ChevronRight size={13} style={{ color: "#D1D5DB", flexShrink: 0 }} />
                        </div>
                      );
                    })}
                    <div className="px-5 py-3" style={{ background: path.bg }}>
                      <button
                        onClick={() => setSelectedLesson(pathLessons.find((l) => !path.completedIds.includes(l.id) && !l.locked) || pathLessons[0])}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs text-white"
                        style={{ background: path.color, fontWeight: 600 }}
                      >
                        <Play size={12} /> {completedInPath === 0 ? "Start Path" : completedInPath === pathLessons.length ? "Review Path" : "Continue →"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* All Lessons View */}
      {activeView === "lessons" && (
        <>
          {/* Filters */}
          <div className="flex items-center gap-3 mb-5 flex-wrap">
            <button onClick={() => setActiveCategory("all")} className="px-3 py-1.5 rounded-lg text-xs transition-colors" style={{ background: activeCategory === "all" ? "#3B82F6" : "#FFFFFF", color: activeCategory === "all" ? "white" : "#6B7280", border: activeCategory === "all" ? "none" : "1px solid #E5E7EB", fontWeight: activeCategory === "all" ? 600 : 400 }}>
              All ({lessons.length})
            </button>
            {categories.map(({ id, label, icon: Icon, color }) => {
              const count = lessons.filter((l) => l.category === id).length;
              const isActive = activeCategory === id;
              return (
                <button key={id} onClick={() => setActiveCategory(id)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors" style={{ background: isActive ? color : "#FFFFFF", color: isActive ? "white" : "#6B7280", border: isActive ? "none" : "1px solid #E5E7EB", fontWeight: isActive ? 600 : 400 }}>
                  <Icon size={11} /> {label} ({count})
                </button>
              );
            })}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg ml-auto" style={{ background: "#FFFFFF", border: "1px solid #E5E7EB" }}>
              <Search size={12} style={{ color: "#9CA3AF" }} />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search lessons..." className="bg-transparent outline-none text-xs" style={{ color: "#111827", width: 160 }} />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {filtered.map((lesson) => (
              <LessonCard key={lesson.id} lesson={lesson} onClick={setSelectedLesson} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
