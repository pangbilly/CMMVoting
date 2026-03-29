"use client";

import { useEffect, useState, useCallback, useRef } from "react";

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

function ChurchBadge({
  church,
  dimmed,
}: {
  church: string;
  dimmed?: boolean;
}) {
  const hex = CHURCH_COLORS[church] || "#6b7280";
  return (
    <span
      className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide transition-opacity duration-1000 ${dimmed ? "opacity-20" : ""}`}
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

const MEDAL_EMOJI: Record<number, string> = {
  1: "\u{1F947}",
  2: "\u{1F948}",
  3: "\u{1F949}",
};

// Reveal rounds:
// 0: idle — nothing shown
// 1: all acts race → then non-top-5 fade out
// 2: top 5 re-race → then non-top-3 fade out
// 3: top 3 re-race → then non-top-2 fade out
// 4: top 2 re-race → then #2 fades, winner glows
const ROUND_CONFIG = [
  { survivors: Infinity, nextLabel: "Start Race" },
  { survivors: 5, nextLabel: "Reveal Top 3" },
  { survivors: 3, nextLabel: "Reveal Top 2" },
  { survivors: 2, nextLabel: "Reveal Winner" },
  { survivors: 1, nextLabel: "" },
];

const GROW_DURATION = 10000; // 10 seconds
const FADE_DELAY = 1500; // pause before fade after growth

export default function DashboardPage() {
  const [password, setPassword] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [authError, setAuthError] = useState(false);
  const [results, setResults] = useState<ActResult[]>([]);
  const [uniqueVoters, setUniqueVoters] = useState(0);
  const [loading, setLoading] = useState(false);
  const [activeView, setActiveView] = useState<"reveal" | "analytics">(
    "reveal"
  );
  const [barsVisible, setBarsVisible] = useState(false);

  // Reveal state
  const [round, setRound] = useState(0); // 0-4
  const [phase, setPhase] = useState<"idle" | "growing" | "settled">("idle");
  const [barsGrowing, setBarsGrowing] = useState(false);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimers = () => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  };

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
      setUniqueVoters(data.uniqueVoters ?? 0);
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
      setUniqueVoters(data.uniqueVoters ?? 0);
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

  const sorted = [...results]
    .filter((a) => Number(a.stats.totalVotes) > 0)
    .sort(
      (a, b) =>
        Number(b.stats.totalScore) - Number(a.stats.totalScore) ||
        Number(b.stats.avgScore) - Number(a.stats.avgScore) ||
        a.nameEn.localeCompare(b.nameEn)
    );

  // Start next reveal round
  const startNextRound = useCallback(() => {
    if (phase === "growing" || round >= 4) return;

    const nextRound = round + 1;
    setRound(nextRound);
    setPhase("growing");

    // Step 1: reset bars to 0 (no transition)
    setBarsGrowing(false);

    // Step 2: after a tick, start growth (with 10s transition)
    const t1 = setTimeout(() => setBarsGrowing(true), 80);

    // Step 3: after 10s growth + short pause, settle (trigger elimination fade)
    const t2 = setTimeout(() => {
      setPhase("settled");
    }, GROW_DURATION + FADE_DELAY);

    timersRef.current = [t1, t2];
  }, [round, phase]);

  const resetReveal = () => {
    clearTimers();
    setRound(0);
    setPhase("idle");
    setBarsGrowing(false);
  };

  // Keyboard support
  useEffect(() => {
    if (activeView !== "reveal") return;
    const handler = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "ArrowRight") {
        e.preventDefault();
        startNextRound();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [activeView, startNextRound]);

  // Cleanup timers on unmount
  useEffect(() => clearTimers, []);

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
          sorted={sorted}
          round={round}
          phase={phase}
          barsGrowing={barsGrowing}
          onNext={startNextRound}
          onReset={resetReveal}
        />
      ) : (
        <AnalyticsView
          results={results}
          sorted={sorted}
          barsVisible={barsVisible}
          uniqueVoters={uniqueVoters}
        />
      )}
    </div>
  );
}

// =====================================================
// VIEW 1: STAGED BAR RACE REVEAL
// =====================================================
// Round 1: all bars grow → non-top-5 fade
// Round 2: top 5 re-grow → non-top-3 fade
// Round 3: top 3 re-grow → non-top-2 fade
// Round 4: top 2 re-grow → #2 fades → winner

function RevealView({
  sorted,
  round,
  phase,
  barsGrowing,
  onNext,
  onReset,
}: {
  sorted: ActResult[];
  round: number;
  phase: "idle" | "growing" | "settled";
  barsGrowing: boolean;
  onNext: () => void;
  onReset: () => void;
}) {
  const maxScore = sorted.length > 0 ? Number(sorted[0].stats.totalScore) : 1;

  // Only show scores at the very end (winner revealed)
  const scoresRevealed = round >= 4 && phase === "settled";

  // How many survivors at the CURRENT round (after elimination)
  const currentSurvivors = ROUND_CONFIG[round]?.survivors ?? Infinity;

  // How many survivors from the PREVIOUS round (what's visible during growth)
  const prevSurvivors =
    round > 0 ? (ROUND_CONFIG[round - 1]?.survivors ?? Infinity) : Infinity;

  // Title
  const title =
    round === 0
      ? "CMM GOT TALENT"
      : round === 1 && phase === "growing"
        ? "THE RACE IS ON..."
        : round === 1
          ? "TOP 5"
          : round === 2 && phase === "growing"
            ? "AND THE TOP 3..."
            : round === 2
              ? "TOP 3"
              : round === 3 && phase === "growing"
                ? "NARROWING DOWN..."
                : round === 3
                  ? "TOP 2"
                  : round === 4 && phase === "growing"
                    ? "AND THE WINNER IS..."
                    : "WINNER";

  const buttonDisabled = phase === "growing" || (round >= 4 && phase === "settled");
  const buttonLabel =
    phase === "growing"
      ? "Racing..."
      : round >= 4 && phase === "settled"
        ? "All Revealed!"
        : ROUND_CONFIG[round]?.nextLabel || "Start Race";

  return (
    <div className="flex flex-col min-h-[calc(100vh-56px)] px-6 lg:px-12 py-6 relative">
      {/* Title */}
      <h1
        className={`text-5xl lg:text-7xl font-black text-center mb-6 lg:mb-8 bg-gradient-to-r bg-clip-text text-transparent transition-all duration-1000 ${
          round >= 4 && phase === "settled"
            ? "from-yellow-300 via-yellow-400 to-amber-500"
            : phase === "growing"
              ? "from-yellow-400/70 via-amber-400/70 to-yellow-500/70"
              : "from-yellow-400 via-amber-400 to-yellow-500"
        }`}
      >
        {title}
      </h1>

      {/* Bar race chart */}
      <div className="flex-1 flex flex-col justify-center max-w-5xl mx-auto w-full">
        <div className="space-y-1.5 lg:space-y-2">
          {sorted.map((act, idx) => {
            const rank = idx + 1;
            const pct =
              maxScore > 0
                ? (Number(act.stats.totalScore) / maxScore) * 100
                : 0;
            const hex = CHURCH_COLORS[act.church] || "#6b7280";

            // Is this act still "in the race" for the current round's growth?
            const inRace = rank <= prevSurvivors;

            // Has this act been eliminated (settled phase, rank > survivors)?
            const eliminated = phase === "settled" && rank > currentSurvivors;

            // Was already eliminated in a previous round?
            const previouslyEliminated = round > 1 && rank > prevSurvivors;

            // Winner glow
            const isWinner = round >= 4 && phase === "settled" && rank === 1;

            // Show medal only at final reveal
            const showMedal = scoresRevealed && rank <= 3;

            // Determine visibility
            if (previouslyEliminated) {
              // Already gone from a previous round — render collapsed
              return (
                <div
                  key={act.id}
                  className="transition-all duration-1000 overflow-hidden"
                  style={{ maxHeight: 0, opacity: 0, marginTop: 0, marginBottom: 0 }}
                />
              );
            }

            // Bar width logic:
            // Rounds 1-3: all surviving bars grow to EQUAL length (no spoilers)
            // Round 4 (final): bars grow to ACTUAL proportional lengths
            const targetWidth =
              round >= 4 ? `${Math.max(pct, 3)}%` : "100%";

            const barWidth =
              round === 0
                ? "0%"
                : inRace && barsGrowing
                  ? targetWidth
                  : inRace
                    ? "0%"
                    : targetWidth; // eliminated acts keep their bar

            return (
              <div
                key={act.id}
                className={`flex items-center gap-2 lg:gap-3 transition-all duration-1000 ${
                  eliminated
                    ? "opacity-15 scale-[0.96]"
                    : isWinner
                      ? "scale-[1.03]"
                      : "opacity-100"
                }`}
              >
                {/* Rank / Medal */}
                <span className="text-lg lg:text-2xl w-8 lg:w-10 text-right">
                  {showMedal && MEDAL_EMOJI[rank] ? (
                    MEDAL_EMOJI[rank]
                  ) : (
                    <span
                      className={`text-xs lg:text-sm font-mono transition-colors duration-700 ${eliminated ? "text-gray-700" : "text-gray-500"}`}
                    >
                      {rank}
                    </span>
                  )}
                </span>

                {/* Name */}
                <div className="w-36 lg:w-52 truncate">
                  <span
                    className={`text-sm lg:text-base font-bold transition-colors duration-1000 ${eliminated ? "text-gray-700" : "text-white"}`}
                  >
                    {act.nameZh}
                  </span>
                  <span
                    className={`text-xs ml-1.5 hidden lg:inline transition-colors duration-1000 ${eliminated ? "text-gray-800" : "text-gray-400"}`}
                  >
                    {act.nameEn}
                  </span>
                </div>

                {/* Bar */}
                <div className="flex-1 h-8 lg:h-10 bg-gray-800/40 rounded-r-lg overflow-hidden relative">
                  <div
                    className={`h-full rounded-r-lg flex items-center justify-end pr-3 ${
                      isWinner
                        ? "shadow-[0_0_25px_rgba(234,179,8,0.5)]"
                        : ""
                    }`}
                    style={{
                      width: barWidth,
                      backgroundColor: eliminated ? "#1f2937" : hex,
                      transitionProperty: "width",
                      transitionTimingFunction: "cubic-bezier(0.25, 0.1, 0.25, 1)",
                      transitionDuration:
                        barsGrowing && inRace ? `${GROW_DURATION}ms` : "0ms",
                    }}
                  >
                    {scoresRevealed && pct > 18 && !eliminated && (
                      <span className="text-xs lg:text-sm font-bold text-white">
                        {act.stats.totalScore}
                      </span>
                    )}
                  </div>
                  {scoresRevealed && pct <= 18 && !eliminated && (
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">
                      {act.stats.totalScore}
                    </span>
                  )}
                </div>

                {/* Church badge */}
                <ChurchBadge church={act.church} dimmed={eliminated} />
              </div>
            );
          })}
        </div>
      </div>

      {/* Next stage button */}
      <button
        onClick={onNext}
        disabled={buttonDisabled}
        className={`fixed bottom-8 right-8 px-6 py-3 lg:px-8 lg:py-4 rounded-2xl font-bold text-base lg:text-xl transition-all ${
          round >= 4 && phase === "settled"
            ? "bg-green-600 text-white cursor-default"
            : buttonDisabled
              ? "bg-gray-700 text-gray-400 cursor-wait"
              : "bg-yellow-500 hover:bg-yellow-400 text-gray-950 shadow-[0_0_20px_rgba(234,179,8,0.4)] hover:shadow-[0_0_30px_rgba(234,179,8,0.6)]"
        }`}
      >
        {buttonLabel}
      </button>

      {/* Reset button */}
      {round > 0 && (
        <button
          onClick={onReset}
          className="fixed bottom-8 left-8 px-4 py-2 rounded-lg text-sm text-gray-500 hover:text-white border border-gray-700 hover:border-gray-500 transition-colors"
        >
          Reset
        </button>
      )}

      {/* Hint */}
      {round === 0 && (
        <p className="text-gray-600 text-sm text-center mt-4 animate-pulse">
          Press Space, Arrow Right, or click the button to begin
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
  uniqueVoters,
}: {
  results: ActResult[];
  sorted: ActResult[];
  barsVisible: boolean;
  uniqueVoters: number;
}) {
  const totalVotes = results.reduce(
    (sum, a) => sum + Number(a.stats.totalVotes),
    0
  );
  const totalScore = results.reduce(
    (sum, a) => sum + Number(a.stats.totalScore),
    0
  );
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 lg:gap-6 mb-8">
        <StatCard
          label="Total Voters"
          value={uniqueVoters.toLocaleString()}
        />
        <StatCard label="Total Votes" value={totalVotes.toLocaleString()} />
        <StatCard label="Average Score" value={avgScore} />
        <StatCard label="Total Acts" value={String(results.length)} />
      </div>

      {/* Racing bar chart — top 5 coloured, rest greyed */}
      <div className="bg-gray-900/50 rounded-2xl border border-gray-800/50 p-6 mb-8">
        <h2 className="text-lg font-bold text-white mb-6">
          All Acts — Ranked by Total Score
        </h2>
        <div className="space-y-2">
          {sorted.map((act, idx) => {
            const rank = idx + 1;
            const pct =
              maxScore > 0
                ? (Number(act.stats.totalScore) / maxScore) * 100
                : 0;
            const hex = CHURCH_COLORS[act.church] || "#6b7280";
            const isTop5 = rank <= 5;
            return (
              <div
                key={act.id}
                className={`flex items-center gap-3 transition-opacity duration-700 ${isTop5 ? "" : "opacity-40"}`}
              >
                <span
                  className={`text-xs w-6 text-right font-mono ${isTop5 ? "text-yellow-400 font-bold" : "text-gray-600"}`}
                >
                  {rank}
                </span>
                <div className="w-40 lg:w-56 truncate">
                  <span
                    className={`text-sm font-medium ${isTop5 ? "text-white" : "text-gray-500"}`}
                  >
                    {act.nameZh}
                  </span>
                  <span
                    className={`text-xs ml-2 hidden lg:inline ${isTop5 ? "text-gray-400" : "text-gray-600"}`}
                  >
                    {act.nameEn}
                  </span>
                </div>
                <div className="flex-1 h-8 lg:h-10 bg-gray-800/50 rounded-r-lg overflow-hidden relative">
                  <div
                    className="h-full rounded-r-lg transition-all duration-1000 ease-out flex items-center justify-end pr-3"
                    style={{
                      width: barsVisible ? `${Math.max(pct, 2)}%` : "0%",
                      backgroundColor: isTop5 ? hex : "#374151",
                      transitionDelay: `${idx * 80}ms`,
                    }}
                  >
                    {barsVisible && pct > 15 && (
                      <span
                        className={`text-xs font-bold ${isTop5 ? "text-white" : "text-gray-500"}`}
                      >
                        {act.stats.totalScore}
                      </span>
                    )}
                  </div>
                  {barsVisible && pct <= 15 && (
                    <span
                      className={`absolute right-2 top-1/2 -translate-y-1/2 text-xs font-bold ${isTop5 ? "text-gray-400" : "text-gray-600"}`}
                    >
                      {act.stats.totalScore}
                    </span>
                  )}
                </div>
                <ChurchBadge church={act.church} dimmed={!isTop5} />
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
                      (
                      {totalVotes > 0
                        ? Math.round((count / totalVotes) * 100)
                        : 0}
                      %)
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
