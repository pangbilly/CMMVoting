"use client";

import { useEffect, useState, useCallback, useRef } from "react";

type ActInfo = {
  id: number;
  nameZh: string;
  nameEn: string;
  church: string;
  orderNumber: number;
};

type VoteRecord = {
  actId: number;
  score: number;
  createdAt: string;
};

const CHURCH_COLORS: Record<string, string> = {
  Derby: "#3b82f6",
  "King's Cross": "#a855f7",
  Woking: "#10b981",
  Norwich: "#f97316",
  Birmingham: "#ef4444",
  Epsom: "#06b6d4",
};

// Replay speed: compress full timeline into this many seconds
const REPLAY_DURATION_SECS = 60;

export default function DashboardTestPage() {
  const [password, setPassword] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [authError, setAuthError] = useState(false);
  const [acts, setActs] = useState<ActInfo[]>([]);
  const [allVotes, setAllVotes] = useState<VoteRecord[]>([]);

  // Replay state
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0); // 0-1
  const [scores, setScores] = useState<Record<number, number>>({}); // actId → running total score
  const [voteCounts, setVoteCounts] = useState<Record<number, number>>({}); // actId → count
  const [currentVoteIdx, setCurrentVoteIdx] = useState(0);
  const [elapsed, setElapsed] = useState("");
  const [speed, setSpeed] = useState(1); // 1x, 2x, 4x
  const rafRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const pausedAtRef = useRef<number>(0);

  const handleLogin = async () => {
    const res = await fetch("/api/admin/timeline", {
      headers: { Authorization: `Bearer ${password}` },
    });
    if (res.ok) {
      const data = await res.json();
      setActs(data.acts);
      setAllVotes(data.votes);
      setAuthenticated(true);
      setAuthError(false);
    } else {
      setAuthError(true);
    }
  };

  // Timeline boundaries
  const timeMin = allVotes.length > 0 ? new Date(allVotes[0].createdAt).getTime() : 0;
  const timeMax = allVotes.length > 0 ? new Date(allVotes[allVotes.length - 1].createdAt).getTime() : 1;
  const timeSpan = timeMax - timeMin || 1;

  // Compute scores up to a given vote index
  const computeScoresUpTo = useCallback(
    (idx: number) => {
      const s: Record<number, number> = {};
      const c: Record<number, number> = {};
      for (const act of acts) {
        s[act.id] = 0;
        c[act.id] = 0;
      }
      for (let i = 0; i < idx && i < allVotes.length; i++) {
        const v = allVotes[i];
        s[v.actId] = (s[v.actId] || 0) + v.score;
        c[v.actId] = (c[v.actId] || 0) + 1;
      }
      return { scores: s, counts: c };
    },
    [acts, allVotes]
  );

  // Animation loop
  const animate = useCallback(
    (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;

      const replayDuration = (REPLAY_DURATION_SECS * 1000) / speed;
      const elapsed = timestamp - startTimeRef.current + pausedAtRef.current;
      const p = Math.min(elapsed / replayDuration, 1);
      setProgress(p);

      // Map progress to timeline position
      const currentTime = timeMin + p * timeSpan;

      // Find how many votes have been cast by this time
      let idx = 0;
      while (idx < allVotes.length && new Date(allVotes[idx].createdAt).getTime() <= currentTime) {
        idx++;
      }

      setCurrentVoteIdx(idx);
      const { scores: s, counts: c } = computeScoresUpTo(idx);
      setScores(s);
      setVoteCounts(c);

      // Format elapsed event time
      const eventElapsedMs = currentTime - timeMin;
      const mins = Math.floor(eventElapsedMs / 60000);
      const secs = Math.floor((eventElapsedMs % 60000) / 1000);
      setElapsed(`${mins}:${secs.toString().padStart(2, "0")}`);

      if (p < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        setPlaying(false);
      }
    },
    [allVotes, timeMin, timeSpan, computeScoresUpTo, speed]
  );

  const play = () => {
    if (progress >= 1) {
      // Reset if finished
      pausedAtRef.current = 0;
      startTimeRef.current = 0;
      setProgress(0);
    }
    setPlaying(true);
    startTimeRef.current = 0;
    rafRef.current = requestAnimationFrame(animate);
  };

  const pause = () => {
    setPlaying(false);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    const replayDuration = (REPLAY_DURATION_SECS * 1000) / speed;
    pausedAtRef.current = progress * replayDuration;
  };

  const reset = () => {
    setPlaying(false);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    pausedAtRef.current = 0;
    startTimeRef.current = 0;
    setProgress(0);
    setCurrentVoteIdx(0);
    setElapsed("0:00");
    const s: Record<number, number> = {};
    const c: Record<number, number> = {};
    for (const act of acts) {
      s[act.id] = 0;
      c[act.id] = 0;
    }
    setScores(s);
    setVoteCounts(c);
  };

  // When speed changes, adjust pause point
  useEffect(() => {
    if (playing) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      const replayDuration = (REPLAY_DURATION_SECS * 1000) / speed;
      pausedAtRef.current = progress * replayDuration;
      startTimeRef.current = 0;
      rafRef.current = requestAnimationFrame(animate);
    }
  }, [speed, playing, progress, animate]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // Max score for bar scaling
  const maxScore = Math.max(...Object.values(scores), 1);

  // Sort acts by current score for ranking display
  const rankedActs = [...acts].sort(
    (a, b) => (scores[b.id] || 0) - (scores[a.id] || 0)
  );

  // --- Login ---
  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <div className="bg-gray-900 rounded-2xl p-8 w-full max-w-sm border border-gray-800">
          <h1 className="text-2xl font-bold text-white mb-1">
            CMM Got Talent
          </h1>
          <p className="text-gray-400 text-sm mb-1">Timeline Race Dashboard</p>
          <p className="text-yellow-500 text-xs mb-6">TEST PAGE</p>
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

  return (
    <div className="min-h-screen bg-gray-950 p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 max-w-5xl mx-auto">
        <div>
          <h1 className="text-3xl lg:text-4xl font-black bg-gradient-to-r from-yellow-400 to-amber-500 bg-clip-text text-transparent">
            LIVE RACE
          </h1>
          <p className="text-gray-500 text-xs">
            TEST — {allVotes.length} votes over {Math.round(timeSpan / 60000)} mins
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Clock */}
          <div className="text-right">
            <p className="text-2xl font-mono font-bold text-white">{elapsed || "0:00"}</p>
            <p className="text-xs text-gray-500">
              {currentVoteIdx} / {allVotes.length} votes
            </p>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="max-w-5xl mx-auto mb-2">
        <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-yellow-500 rounded-full transition-none"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      </div>

      {/* Controls */}
      <div className="max-w-5xl mx-auto flex items-center gap-3 mb-6">
        {!playing ? (
          <button
            onClick={play}
            className="px-5 py-2 rounded-lg bg-yellow-500 hover:bg-yellow-400 text-gray-950 font-bold text-sm"
          >
            {progress >= 1 ? "⟳ Replay" : progress > 0 ? "▶ Resume" : "▶ Play"}
          </button>
        ) : (
          <button
            onClick={pause}
            className="px-5 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white font-bold text-sm"
          >
            ⏸ Pause
          </button>
        )}
        <button
          onClick={reset}
          className="px-4 py-2 rounded-lg border border-gray-700 text-gray-400 hover:text-white text-sm"
        >
          Reset
        </button>
        <div className="flex items-center gap-1 ml-auto">
          {[1, 2, 4].map((s) => (
            <button
              key={s}
              onClick={() => setSpeed(s)}
              className={`px-3 py-1.5 rounded text-xs font-bold ${
                speed === s
                  ? "bg-yellow-500 text-gray-950"
                  : "text-gray-500 hover:text-white"
              }`}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>

      {/* Bar race — sorted by current score (dynamic reordering!) */}
      <div className="max-w-5xl mx-auto space-y-1.5">
        {rankedActs.map((act, idx) => {
          const score = scores[act.id] || 0;
          const count = voteCounts[act.id] || 0;
          const pct = maxScore > 0 ? (score / maxScore) * 100 : 0;
          const hex = CHURCH_COLORS[act.church] || "#6b7280";
          const isLeader = idx === 0 && score > 0;

          return (
            <div
              key={act.id}
              className="flex items-center gap-2 lg:gap-3"
              style={{
                transition: "transform 0.5s ease, opacity 0.5s ease",
                opacity: score > 0 ? 1 : 0.3,
              }}
            >
              {/* Rank */}
              <span
                className={`text-xs lg:text-sm font-mono w-6 text-right ${
                  isLeader ? "text-yellow-400 font-bold" : "text-gray-500"
                }`}
              >
                {idx + 1}
              </span>

              {/* Name */}
              <div className="w-36 lg:w-48 truncate">
                <span className="text-sm lg:text-base font-bold text-white">
                  {act.nameZh}
                </span>
                <span className="text-xs ml-1.5 hidden lg:inline text-gray-400">
                  {act.nameEn}
                </span>
              </div>

              {/* Bar */}
              <div className="flex-1 h-8 lg:h-10 bg-gray-800/40 rounded-r-lg overflow-hidden relative">
                <div
                  className={`h-full rounded-r-lg flex items-center justify-end pr-3 ${
                    isLeader ? "shadow-[0_0_15px_rgba(234,179,8,0.3)]" : ""
                  }`}
                  style={{
                    width: `${Math.max(pct, score > 0 ? 2 : 0)}%`,
                    backgroundColor: hex,
                    transition: "width 0.3s ease-out",
                  }}
                >
                  {pct > 20 && (
                    <span className="text-xs font-bold text-white">
                      {score}
                    </span>
                  )}
                </div>
                {score > 0 && pct <= 20 && (
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">
                    {score}
                  </span>
                )}
              </div>

              {/* Vote count */}
              <span className="text-xs text-gray-600 w-12 text-right font-mono">
                {count}v
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
