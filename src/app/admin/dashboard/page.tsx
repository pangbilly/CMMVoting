"use client";

import { useEffect, useState, useCallback } from "react";

type ActResult = {
  id: number;
  nameZh: string;
  nameEn: string;
  church: string;
  orderNumber: number;
  isActive: boolean;
  stats: {
    avgScore: number;
    totalScore: number;
    totalVotes: number;
    score1: number;
    score2: number;
    score3: number;
    score4: number;
    score5: number;
  };
};

const CHURCH_COLORS: Record<string, string> = {
  Derby: "#3b82f6",
  "King's Cross": "#a855f7",
  Woking: "#10b981",
  Norwich: "#f97316",
  Birmingham: "#ef4444",
  Epsom: "#06b6d4",
};

function ChurchBadge({ church }: { church: string }) {
  const hex = CHURCH_COLORS[church] || "#6b7280";
  return (
    <span
      className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide"
      style={{
        backgroundColor: `${hex}20`,
        color: hex,
        boxShadow: `inset 0 0 0 1px ${hex}40`,
      }}
    >
      {church}
    </span>
  );
}

const MEDAL_STYLES: Record<number, { emoji: string; bg: string }> = {
  1: {
    emoji: "🥇",
    bg: "bg-gradient-to-r from-yellow-900/40 to-yellow-700/20 border border-yellow-500/30",
  },
  2: {
    emoji: "🥈",
    bg: "bg-gradient-to-r from-gray-700/40 to-gray-500/20 border border-gray-400/30",
  },
  3: {
    emoji: "🥉",
    bg: "bg-gradient-to-r from-amber-900/40 to-amber-700/20 border border-amber-600/30",
  },
};

export default function DashboardPage() {
  const [password, setPassword] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [authError, setAuthError] = useState(false);
  const [results, setResults] = useState<ActResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeView, setActiveView] = useState<"reveal" | "analytics">(
    "reveal"
  );
  const [revealedCount, setRevealedCount] = useState(0);
  const [barsVisible, setBarsVisible] = useState(false);
  const [justRevealed, setJustRevealed] = useState<number | null>(null);

  const fetchResults = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin", {
        headers: { Authorization: `Bearer ${password}` },
      });
      if (res.status === 401) {
        setAuthenticated(false);
        return;
      }
      const data = await res.json();
      setResults(data.results);
      setAuthenticated(true);
      setAuthError(false);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [password]);

  const handleLogin = async () => {
    const res = await fetch("/api/admin", {
      headers: { Authorization: `Bearer ${password}` },
    });
    if (res.ok) {
      const data = await res.json();
      setResults(data.results);
      setAuthenticated(true);
      setAuthError(false);
    } else {
      setAuthError(true);
    }
  };

  // Auto-refresh every 10s
  useEffect(() => {
    if (!authenticated) return;
    const interval = setInterval(fetchResults, 10000);
    return () => clearInterval(interval);
  }, [authenticated, fetchResults]);

  // Trigger bar animations when switching to analytics
  useEffect(() => {
    if (activeView === "analytics") {
      setBarsVisible(false);
      const t = setTimeout(() => setBarsVisible(true), 100);
      return () => clearTimeout(t);
    }
  }, [activeView]);

  // Keyboard support for reveal mode
  useEffect(() => {
    if (activeView !== "reveal") return;
    const handler = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "ArrowRight") {
        e.preventDefault();
        setRevealedCount((c) => {
          if (c < 5) {
            const next = c + 1;
            setJustRevealed(next);
            setTimeout(() => setJustRevealed(null), 1500);
            return next;
          }
          return c;
        });
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [activeView]);

  const sorted = [...results]
    .filter((a) => Number(a.stats.totalVotes) > 0)
    .sort(
      (a, b) =>
        Number(b.stats.totalScore) - Number(a.stats.totalScore) ||
        Number(b.stats.avgScore) - Number(a.stats.avgScore) ||
        a.nameEn.localeCompare(b.nameEn)
    );

  const top5 = sorted.slice(0, 5);

  const revealNext = () => {
    if (revealedCount < 5) {
      const next = revealedCount + 1;
      setRevealedCount(next);
      setJustRevealed(next);
      setTimeout(() => setJustRevealed(null), 1500);
    }
  };

  // --- Login screen ---
  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <div className="bg-gray-900 rounded-2xl p-8 w-full max-w-sm border border-gray-800">
          <h1 className="text-2xl font-bold text-white mb-1">
            CMM Got Talent
          </h1>
          <p className="text-gray-400 text-sm mb-6">Dashboard Login</p>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            placeholder="Admin password"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 mb-3 focus:outline-none focus:ring-2 focus:ring-yellow-500/50"
          />
          {authError && (
            <p className="text-red-400 text-sm mb-3">Incorrect password</p>
          )}
          <button
            onClick={handleLogin}
            className="w-full bg-yellow-500 hover:bg-yellow-400 text-gray-950 font-bold py-3 rounded-lg transition-colors"
          >
            Enter
          </button>
        </div>
      </div>
    );
  }

  // --- Main dashboard ---
  return (
    <div className="min-h-screen bg-gray-950">
      {/* Top nav */}
      <nav className="flex items-center justify-between px-6 py-3 border-b border-gray-800/50">
        <span className="text-white font-bold text-sm">CMM Got Talent</span>
        <div className="flex gap-1">
          <button
            onClick={() => setActiveView("reveal")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeView === "reveal"
                ? "bg-yellow-500 text-gray-950"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Top 5 Reveal
          </button>
          <button
            onClick={() => setActiveView("analytics")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeView === "analytics"
                ? "bg-yellow-500 text-gray-950"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Analytics
          </button>
        </div>
        <button
          onClick={fetchResults}
          className="text-gray-500 hover:text-white text-sm transition-colors"
        >
          {loading ? "..." : "Refresh"}
        </button>
      </nav>

      {activeView === "reveal" ? (
        <RevealView
          top5={top5}
          revealedCount={revealedCount}
          justRevealed={justRevealed}
          onRevealNext={revealNext}
          onReset={() => {
            setRevealedCount(0);
            setJustRevealed(null);
          }}
        />
      ) : (
        <AnalyticsView
          results={results}
          sorted={sorted}
          barsVisible={barsVisible}
        />
      )}
    </div>
  );
}

// =====================================================
// VIEW 1: TOP 5 REVEAL
// =====================================================

function RevealView({
  top5,
  revealedCount,
  justRevealed,
  onRevealNext,
  onReset,
}: {
  top5: ActResult[];
  revealedCount: number;
  justRevealed: number | null;
  onRevealNext: () => void;
  onReset: () => void;
}) {
  // Display order: #5 at top → #1 at bottom
  const displayOrder = [...top5].reverse();

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-56px)] px-4 py-8 relative">
      {/* Title */}
      <h1 className="text-6xl lg:text-8xl font-black mb-8 lg:mb-12 bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 bg-clip-text text-transparent">
        TOP 5
      </h1>

      {/* Cards */}
      <div className="flex flex-col gap-3 lg:gap-4 w-full max-w-3xl">
        {displayOrder.map((act, displayIdx) => {
          const rank = 5 - displayIdx; // 5, 4, 3, 2, 1
          const revealSlot = 6 - rank; // rank 5 → slot 1, rank 1 → slot 5
          const isVisible = revealedCount >= revealSlot;
          const isJustRevealed = justRevealed === revealSlot;
          const medal = MEDAL_STYLES[rank];

          return (
            <div
              key={act.id}
              className={`flex items-center gap-4 lg:gap-6 p-4 lg:p-6 rounded-2xl transition-all duration-700 ease-out ${
                isVisible
                  ? `opacity-100 scale-100 ${medal?.bg || "bg-gray-800/50 border border-gray-700/30"}`
                  : "opacity-0 scale-95 bg-gray-900/20 border border-gray-800/10"
              } ${isJustRevealed ? "ring-2 ring-yellow-400/60 shadow-[0_0_30px_rgba(234,179,8,0.3)]" : ""}`}
            >
              {/* Rank */}
              <span className="text-4xl lg:text-5xl min-w-[60px] text-center">
                {isVisible ? (medal?.emoji || `#${rank}`) : "?"}
              </span>

              {/* Name */}
              <div className="flex-1 min-w-0">
                <p
                  className={`text-xl lg:text-2xl font-bold transition-colors duration-700 ${isVisible ? "text-white" : "text-gray-700"}`}
                >
                  {isVisible ? act.nameZh : "???"}
                </p>
                <p
                  className={`text-sm lg:text-lg transition-colors duration-700 ${isVisible ? "text-gray-400" : "text-gray-800"}`}
                >
                  {isVisible ? act.nameEn : "???"}
                </p>
              </div>

              {/* Church badge */}
              {isVisible && <ChurchBadge church={act.church} />}

              {/* Score */}
              <div className="text-right min-w-[80px]">
                <p
                  className={`text-3xl lg:text-4xl font-black transition-colors duration-700 ${isVisible ? "text-white" : "text-gray-800"}`}
                >
                  {isVisible ? act.stats.totalScore : "—"}
                </p>
                {isVisible && (
                  <p className="text-xs lg:text-sm text-gray-500">
                    {act.stats.totalVotes} votes
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Reveal button */}
      <button
        onClick={onRevealNext}
        disabled={revealedCount >= 5}
        className={`fixed bottom-8 right-8 px-6 py-3 lg:px-8 lg:py-4 rounded-2xl font-bold text-lg lg:text-xl transition-all ${
          revealedCount >= 5
            ? "bg-green-600 text-white cursor-default"
            : "bg-yellow-500 hover:bg-yellow-400 text-gray-950 shadow-[0_0_20px_rgba(234,179,8,0.4)] hover:shadow-[0_0_30px_rgba(234,179,8,0.6)]"
        }`}
      >
        {revealedCount >= 5
          ? "All Revealed!"
          : revealedCount === 0
            ? "Start Reveal"
            : `Reveal #${5 - revealedCount}`}
      </button>

      {/* Reset button */}
      {revealedCount > 0 && (
        <button
          onClick={onReset}
          className="fixed bottom-8 left-8 px-4 py-2 rounded-lg text-sm text-gray-500 hover:text-white border border-gray-700 hover:border-gray-500 transition-colors"
        >
          Reset
        </button>
      )}

      {/* Hint */}
      {revealedCount === 0 && (
        <p className="text-gray-600 text-sm mt-8 animate-pulse">
          Press Space, Arrow Right, or click the button to reveal
        </p>
      )}
    </div>
  );
}

// =====================================================
// VIEW 2: ANALYTICS DASHBOARD
// =====================================================

function AnalyticsView({
  results,
  sorted,
  barsVisible,
}: {
  results: ActResult[];
  sorted: ActResult[];
  barsVisible: boolean;
}) {
  const totalVotes = results.reduce(
    (sum, a) => sum + Number(a.stats.totalVotes),
    0
  );
  const totalScore = results.reduce(
    (sum, a) => sum + Number(a.stats.totalScore),
    0
  );
  const actsWithVotes = results.filter(
    (a) => Number(a.stats.totalVotes) > 0
  ).length;
  const avgScore =
    totalVotes > 0 ? (totalScore / totalVotes).toFixed(2) : "0.00";

  const maxScore = sorted.length > 0 ? Number(sorted[0].stats.totalScore) : 1;

  // Aggregated star distribution
  const starDist = [5, 4, 3, 2, 1].map((star) => {
    const key = `score${star}` as keyof ActResult["stats"];
    const count = results.reduce((sum, a) => sum + Number(a.stats[key]), 0);
    return { star, count };
  });
  const maxStarCount = Math.max(...starDist.map((s) => s.count), 1);

  // Church aggregates
  const churchMap = new Map<string, { score: number; votes: number }>();
  results.forEach((a) => {
    const entry = churchMap.get(a.church) || { score: 0, votes: 0 };
    entry.score += Number(a.stats.totalScore);
    entry.votes += Number(a.stats.totalVotes);
    churchMap.set(a.church, entry);
  });
  const churches = [...churchMap.entries()]
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.score - a.score);
  const maxChurchScore = churches.length > 0 ? churches[0].score : 1;

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      {/* Stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6 mb-8">
        <StatCard label="Total Votes" value={totalVotes.toLocaleString()} />
        <StatCard label="Average Score" value={avgScore} />
        <StatCard
          label="Acts with Votes"
          value={`${actsWithVotes} / ${results.length}`}
        />
      </div>

      {/* Racing bar chart */}
      <div className="bg-gray-900/50 rounded-2xl border border-gray-800/50 p-6 mb-8">
        <h2 className="text-lg font-bold text-white mb-6">
          All Acts — Ranked by Total Score
        </h2>
        <div className="space-y-2">
          {sorted.map((act, idx) => {
            const pct =
              maxScore > 0
                ? (Number(act.stats.totalScore) / maxScore) * 100
                : 0;
            const hex = CHURCH_COLORS[act.church] || "#6b7280";
            return (
              <div key={act.id} className="flex items-center gap-3">
                <span className="text-gray-500 text-xs w-6 text-right font-mono">
                  {idx + 1}
                </span>
                <div className="w-40 lg:w-56 truncate">
                  <span className="text-white text-sm font-medium">
                    {act.nameZh}
                  </span>
                  <span className="text-gray-500 text-xs ml-2 hidden lg:inline">
                    {act.nameEn}
                  </span>
                </div>
                <div className="flex-1 h-8 lg:h-10 bg-gray-800/50 rounded-r-lg overflow-hidden relative">
                  <div
                    className="h-full rounded-r-lg transition-all duration-1000 ease-out flex items-center justify-end pr-3"
                    style={{
                      width: barsVisible ? `${Math.max(pct, 2)}%` : "0%",
                      backgroundColor: hex,
                      transitionDelay: `${idx * 80}ms`,
                    }}
                  >
                    {barsVisible && pct > 15 && (
                      <span className="text-white text-xs font-bold">
                        {act.stats.totalScore}
                      </span>
                    )}
                  </div>
                  {barsVisible && pct <= 15 && (
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">
                      {act.stats.totalScore}
                    </span>
                  )}
                </div>
                <ChurchBadge church={act.church} />
              </div>
            );
          })}
        </div>
      </div>

      {/* Two-column: Score distribution + Church summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Score distribution */}
        <div className="bg-gray-900/50 rounded-2xl border border-gray-800/50 p-6">
          <h2 className="text-lg font-bold text-white mb-4">
            Score Distribution
          </h2>
          <div className="space-y-3">
            {starDist.map(({ star, count }) => {
              const pct =
                maxStarCount > 0 ? (count / maxStarCount) * 100 : 0;
              const starColors = [
                "",
                "#ef4444",
                "#f97316",
                "#eab308",
                "#84cc16",
                "#22c55e",
              ];
              return (
                <div key={star} className="flex items-center gap-3">
                  <span className="text-yellow-400 text-sm w-12 text-right">
                    {"★".repeat(star)}
                  </span>
                  <div className="flex-1 h-7 bg-gray-800/50 rounded-lg overflow-hidden">
                    <div
                      className="h-full rounded-lg transition-all duration-700 ease-out"
                      style={{
                        width: barsVisible ? `${Math.max(pct, 1)}%` : "0%",
                        backgroundColor: starColors[star],
                        transitionDelay: `${(5 - star) * 100}ms`,
                      }}
                    />
                  </div>
                  <span className="text-gray-400 text-sm w-16 text-right font-mono">
                    {count}{" "}
                    <span className="text-gray-600">
                      ({totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0}%)
                    </span>
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Church summary */}
        <div className="bg-gray-900/50 rounded-2xl border border-gray-800/50 p-6">
          <h2 className="text-lg font-bold text-white mb-4">
            Church Summary
          </h2>
          <div className="space-y-3">
            {churches.map((church, idx) => {
              const pct =
                maxChurchScore > 0
                  ? (church.score / maxChurchScore) * 100
                  : 0;
              const hex = CHURCH_COLORS[church.name] || "#6b7280";
              return (
                <div key={church.name} className="flex items-center gap-3">
                  <span className="text-gray-500 text-xs w-4 text-right font-mono">
                    {idx + 1}
                  </span>
                  <span className="text-white text-sm font-medium w-28 truncate">
                    {church.name}
                  </span>
                  <div className="flex-1 h-7 bg-gray-800/50 rounded-lg overflow-hidden">
                    <div
                      className="h-full rounded-lg transition-all duration-1000 ease-out"
                      style={{
                        width: barsVisible ? `${Math.max(pct, 2)}%` : "0%",
                        backgroundColor: hex,
                        transitionDelay: `${idx * 120}ms`,
                      }}
                    />
                  </div>
                  <span className="text-gray-300 text-sm w-16 text-right font-mono font-bold">
                    {church.score}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer */}
      <p className="text-center text-gray-700 text-xs">
        CMM Got Talent 2025 — Results Dashboard
      </p>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-900/50 rounded-2xl border border-gray-800/50 p-6 text-center">
      <p className="text-3xl lg:text-4xl font-black text-white mb-1">
        {value}
      </p>
      <p className="text-gray-500 text-sm">{label}</p>
    </div>
  );
}
