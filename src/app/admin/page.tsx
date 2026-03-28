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

const CHURCHES = [
  "Derby",
  "King's Cross",
  "Woking",
  "Norwich",
  "Birmingham",
  "Epsom",
];

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [results, setResults] = useState<ActResult[]>([]);
  const [votingLocked, setVotingLocked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editingAct, setEditingAct] = useState<ActResult | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newAct, setNewAct] = useState({
    nameZh: "",
    nameEn: "",
    church: CHURCHES[0],
    orderNumber: 16,
  });
  const [filterChurch, setFilterChurch] = useState<string>("all");
  const [authError, setAuthError] = useState(false);

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${password}`,
  };

  const fetchResults = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin", {
        headers: { Authorization: `Bearer ${password}` },
      });
      if (res.status === 401) {
        setAuthenticated(false);
        setAuthError(true);
        return;
      }
      const data = await res.json();
      setResults(data.results || []);
      setVotingLocked(data.votingLocked || false);
    } catch (error) {
      console.error("Failed to fetch:", error);
    } finally {
      setLoading(false);
    }
  }, [password]);

  const handleLogin = async () => {
    setAuthError(false);
    const res = await fetch("/api/admin", {
      headers: { Authorization: `Bearer ${password}` },
    });
    if (res.ok) {
      setAuthenticated(true);
      const data = await res.json();
      setResults(data.results || []);
      setVotingLocked(data.votingLocked || false);
    } else {
      setAuthError(true);
    }
  };

  useEffect(() => {
    if (authenticated) {
      fetchResults();
      const interval = setInterval(fetchResults, 10000);
      return () => clearInterval(interval);
    }
  }, [authenticated, fetchResults]);

  const toggleVotingLock = async () => {
    await fetch("/api/admin/settings", {
      method: "POST",
      headers,
      body: JSON.stringify({
        key: "voting_locked",
        value: !votingLocked ? "true" : "false",
      }),
    });
    setVotingLocked(!votingLocked);
  };

  const moveAct = async (actId: number, direction: "up" | "down") => {
    const sorted = [...results].sort(
      (a, b) => a.orderNumber - b.orderNumber
    );
    const idx = sorted.findIndex((a) => a.id === actId);
    if (
      (direction === "up" && idx === 0) ||
      (direction === "down" && idx === sorted.length - 1)
    )
      return;

    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    const orders = sorted.map((a, i) => {
      if (i === idx)
        return { id: a.id, orderNumber: sorted[swapIdx].orderNumber };
      if (i === swapIdx)
        return { id: a.id, orderNumber: sorted[idx].orderNumber };
      return { id: a.id, orderNumber: a.orderNumber };
    });

    await fetch("/api/admin/reorder", {
      method: "POST",
      headers,
      body: JSON.stringify({ orders }),
    });
    fetchResults();
  };

  const saveEdit = async () => {
    if (!editingAct) return;
    await fetch("/api/admin/acts", {
      method: "PUT",
      headers,
      body: JSON.stringify({
        id: editingAct.id,
        nameZh: editingAct.nameZh,
        nameEn: editingAct.nameEn,
        church: editingAct.church,
      }),
    });
    setEditingAct(null);
    fetchResults();
  };

  const addAct = async () => {
    await fetch("/api/admin/acts", {
      method: "POST",
      headers,
      body: JSON.stringify(newAct),
    });
    setShowAddForm(false);
    setNewAct({ nameZh: "", nameEn: "", church: CHURCHES[0], orderNumber: results.length + 1 });
    fetchResults();
  };

  const deleteAct = async (id: number, name: string) => {
    if (!confirm(`Delete "${name}"?`)) return;
    await fetch("/api/admin/acts", {
      method: "DELETE",
      headers,
      body: JSON.stringify({ id }),
    });
    fetchResults();
  };

  // Login screen
  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-sm">
          <h1 className="text-xl font-bold text-center mb-6">
            CMM Got Talent — Admin
          </h1>
          <input
            type="password"
            placeholder="Admin password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            className="w-full border rounded-lg px-4 py-2 mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {authError && (
            <p className="text-red-500 text-sm mb-3">
              Invalid password. Try again.
            </p>
          )}
          <button
            onClick={handleLogin}
            className="w-full bg-gray-900 text-white rounded-lg py-2 font-medium hover:bg-gray-800"
          >
            Login
          </button>
        </div>
      </div>
    );
  }

  const filteredResults =
    filterChurch === "all"
      ? results
      : results.filter((r) => r.church === filterChurch);

  const sortedResults = [...filteredResults].sort(
    (a, b) => a.orderNumber - b.orderNumber
  );

  const totalVoters = Math.max(
    ...results.map((r) => Number(r.stats.totalVotes)),
    0
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          CMM Got Talent — Admin
        </h1>
        <div className="flex gap-2">
          <button
            onClick={toggleVotingLock}
            className={`px-4 py-2 rounded-lg font-medium text-sm ${
              votingLocked
                ? "bg-green-600 text-white hover:bg-green-700"
                : "bg-red-600 text-white hover:bg-red-700"
            }`}
          >
            {votingLocked ? "🔓 Unlock Voting" : "🔒 Lock Voting"}
          </button>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white font-medium text-sm hover:bg-blue-700"
          >
            + Add Act
          </button>
        </div>
      </div>

      {/* Summary bar */}
      <div className="bg-white rounded-lg border p-4 mb-4 flex gap-6 text-sm">
        <div>
          <span className="text-gray-500">Total Acts:</span>{" "}
          <strong>{results.length}</strong>
        </div>
        <div>
          <span className="text-gray-500">Max Voters:</span>{" "}
          <strong>{totalVoters}</strong>
        </div>
        <div>
          <span className="text-gray-500">Voting:</span>{" "}
          <strong className={votingLocked ? "text-red-600" : "text-green-600"}>
            {votingLocked ? "LOCKED" : "OPEN"}
          </strong>
        </div>
      </div>

      {/* Top 5 Leaderboard */}
      {results.length > 0 && (() => {
        const ranked = [...results]
          .filter((r) => Number(r.stats.totalVotes) > 0)
          .sort((a, b) => Number(b.stats.totalScore) - Number(a.stats.totalScore))
          .slice(0, 5);
        const topScore = Number(ranked[0]?.stats.totalScore) || 1;
        const medals = ["🥇", "🥈", "🥉", "4", "5"];
        return ranked.length > 0 ? (
          <div className="bg-gradient-to-br from-yellow-50 to-amber-50 border border-yellow-200 rounded-xl p-4 mb-4">
            <h2 className="font-bold text-sm text-yellow-800 mb-3 uppercase tracking-wide">
              Top 5 Acts
            </h2>
            <div className="space-y-2">
              {ranked.map((act, i) => {
                const pct = (Number(act.stats.totalScore) / topScore) * 100;
                return (
                  <div key={act.id} className="flex items-center gap-3">
                    <span className={`w-7 text-center flex-shrink-0 ${i < 3 ? "text-lg" : "text-sm font-bold text-gray-400"}`}>
                      {medals[i]}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-sm font-medium text-gray-900 truncate">
                          {act.nameZh}
                        </span>
                        <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                          {act.church}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2.5 bg-yellow-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              i === 0
                                ? "bg-yellow-500"
                                : i === 1
                                ? "bg-yellow-400"
                                : i === 2
                                ? "bg-amber-400"
                                : "bg-amber-300"
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-sm font-bold text-yellow-700 w-12 text-right flex-shrink-0">
                          {act.stats.totalScore} pts
                        </span>
                        <span className="text-[10px] text-gray-400 w-14 flex-shrink-0">
                          ({act.stats.totalVotes} vote{Number(act.stats.totalVotes) !== 1 ? "s" : ""})
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null;
      })()}

      {/* Church filter */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <button
          onClick={() => setFilterChurch("all")}
          className={`px-3 py-1 rounded-full text-xs font-medium ${
            filterChurch === "all"
              ? "bg-gray-900 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          All
        </button>
        {CHURCHES.map((c) => (
          <button
            key={c}
            onClick={() => setFilterChurch(c)}
            className={`px-3 py-1 rounded-full text-xs font-medium ${
              filterChurch === c
                ? "bg-gray-900 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Add act form */}
      {showAddForm && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <h3 className="font-semibold mb-3">Add New Act</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              placeholder="Chinese name (中文名稱)"
              value={newAct.nameZh}
              onChange={(e) =>
                setNewAct({ ...newAct, nameZh: e.target.value })
              }
              className="border rounded px-3 py-2 text-sm"
            />
            <input
              placeholder="English name"
              value={newAct.nameEn}
              onChange={(e) =>
                setNewAct({ ...newAct, nameEn: e.target.value })
              }
              className="border rounded px-3 py-2 text-sm"
            />
            <select
              value={newAct.church}
              onChange={(e) =>
                setNewAct({ ...newAct, church: e.target.value })
              }
              className="border rounded px-3 py-2 text-sm"
            >
              {CHURCHES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <input
              type="number"
              placeholder="Order number"
              value={newAct.orderNumber}
              onChange={(e) =>
                setNewAct({
                  ...newAct,
                  orderNumber: parseInt(e.target.value) || 0,
                })
              }
              className="border rounded px-3 py-2 text-sm"
            />
          </div>
          <div className="mt-3 flex gap-2">
            <button
              onClick={addAct}
              className="px-4 py-2 bg-blue-600 text-white rounded text-sm font-medium"
            >
              Save
            </button>
            <button
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Edit act modal */}
      {editingAct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="font-semibold mb-4">Edit Act</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500">Chinese Name</label>
                <input
                  value={editingAct.nameZh}
                  onChange={(e) =>
                    setEditingAct({ ...editingAct, nameZh: e.target.value })
                  }
                  className="w-full border rounded px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500">English Name</label>
                <input
                  value={editingAct.nameEn}
                  onChange={(e) =>
                    setEditingAct({ ...editingAct, nameEn: e.target.value })
                  }
                  className="w-full border rounded px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500">Church</label>
                <select
                  value={editingAct.church}
                  onChange={(e) =>
                    setEditingAct({ ...editingAct, church: e.target.value })
                  }
                  className="w-full border rounded px-3 py-2 text-sm"
                >
                  {CHURCHES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <button
                onClick={saveEdit}
                className="px-4 py-2 bg-blue-600 text-white rounded text-sm font-medium"
              >
                Save
              </button>
              <button
                onClick={() => setEditingAct(null)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Results table */}
      {loading && results.length === 0 ? (
        <p className="text-center text-gray-500 py-8">Loading...</p>
      ) : (
        <div className="space-y-3">
          {sortedResults.map((act, index) => (
            <div
              key={act.id}
              className="bg-white rounded-lg border border-gray-200 p-4"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  {/* Reorder buttons */}
                  <div className="flex flex-col gap-0.5">
                    <button
                      onClick={() => moveAct(act.id, "up")}
                      className="text-gray-400 hover:text-gray-700 text-xs px-1"
                      title="Move up"
                    >
                      ▲
                    </button>
                    <span className="text-xs text-gray-400 text-center">
                      {act.orderNumber}
                    </span>
                    <button
                      onClick={() => moveAct(act.id, "down")}
                      className="text-gray-400 hover:text-gray-700 text-xs px-1"
                      title="Move down"
                    >
                      ▼
                    </button>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-gray-900 leading-tight">
                      {act.nameZh}
                    </p>
                    <p className="text-xs text-gray-500">{act.nameEn}</p>
                    <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600">
                      {act.church}
                    </span>
                  </div>
                </div>
                {/* Actions */}
                <div className="flex gap-1">
                  <button
                    onClick={() => setEditingAct(act)}
                    className="text-xs px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-700"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteAct(act.id, act.nameEn)}
                    className="text-xs px-2 py-1 rounded bg-red-50 hover:bg-red-100 text-red-700"
                  >
                    Delete
                  </button>
                </div>
              </div>

              {/* Stats */}
              <div className="mt-3 flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <span className="text-2xl font-bold text-yellow-500">
                    {act.stats.avgScore || "—"}
                  </span>
                  <span className="text-gray-400 text-xs">avg</span>
                </div>
                <div className="text-gray-500 text-xs">
                  {act.stats.totalVotes} vote
                  {Number(act.stats.totalVotes) !== 1 && "s"}
                </div>
                {/* Score distribution bar */}
                <div className="flex-1 flex items-center gap-1">
                  {[5, 4, 3, 2, 1].map((score) => {
                    const count = Number(
                      act.stats[
                        `score${score}` as keyof typeof act.stats
                      ]
                    );
                    const total = Number(act.stats.totalVotes) || 1;
                    const pct = (count / total) * 100;
                    return (
                      <div key={score} className="flex-1" title={`${score}★: ${count}`}>
                        <div className="text-[10px] text-gray-400 text-center">
                          {score}★
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-yellow-400 rounded-full"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <div className="text-[10px] text-gray-400 text-center">
                          {count}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
