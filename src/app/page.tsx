"use client";

import { useEffect, useState, useCallback } from "react";
import { useI18n } from "@/lib/i18n-context";
import { t } from "@/lib/i18n";
import { getVoterId } from "@/lib/voter";
import { LanguageToggle } from "@/components/LanguageToggle";
import { StarRating } from "@/components/StarRating";
import type { Act } from "@/db/schema";

type VoteMap = Record<number, number>;

const CHURCH_COLORS: Record<string, string> = {
  Derby: "bg-blue-100 text-blue-800",
  "King's Cross": "bg-purple-100 text-purple-800",
  Woking: "bg-green-100 text-green-800",
  Norwich: "bg-orange-100 text-orange-800",
  Birmingham: "bg-red-100 text-red-800",
  Epsom: "bg-teal-100 text-teal-800",
};

export default function VotingPage() {
  const { locale } = useI18n();
  const [acts, setActs] = useState<Act[]>([]);
  const [myVotes, setMyVotes] = useState<VoteMap>({});
  const [votingLocked, setVotingLocked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState<Record<number, boolean>>({});

  const fetchData = useCallback(async () => {
    try {
      const voterId = getVoterId();
      const [actsRes, votesRes] = await Promise.all([
        fetch("/api/acts"),
        fetch(`/api/votes?voterId=${voterId}`),
      ]);
      const actsData = await actsRes.json();
      const votesData = await votesRes.json();

      setActs(actsData.acts || []);
      setVotingLocked(actsData.votingLocked || false);

      const voteMap: VoteMap = {};
      for (const v of votesData.votes || []) {
        voteMap[v.actId] = v.score;
      }
      setMyVotes(voteMap);
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleVote = async (actId: number, score: number) => {
    setMyVotes((prev) => ({ ...prev, [actId]: score }));
    setSubmitting(actId);

    try {
      const res = await fetch("/api/votes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          actId,
          voterId: getVoterId(),
          score,
        }),
      });

      if (res.ok) {
        setSubmitted((prev) => ({ ...prev, [actId]: true }));
        setTimeout(() => {
          setSubmitted((prev) => ({ ...prev, [actId]: false }));
        }, 2000);
      }
    } catch (error) {
      console.error("Vote failed:", error);
    } finally {
      setSubmitting(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500 text-lg">{t(locale, "loading")}</p>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      {/* Logo */}
      <div className="flex justify-center mb-4">
        <img
          src="/logo.png"
          alt="Rooted in King's Cross — Rebuild Renew Transform"
          className="w-full max-w-xs"
        />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {t(locale, "title")}
          </h1>
          <p className="text-sm text-gray-500">{t(locale, "subtitle")}</p>
        </div>
        <LanguageToggle />
      </div>

      {/* Voting locked banner */}
      {votingLocked && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-center">
          <p className="font-semibold text-red-800">
            {t(locale, "votingLocked")}
          </p>
          <p className="text-sm text-red-600 mt-1">
            {t(locale, "votingLockedDesc")}
          </p>
        </div>
      )}

      {/* Acts list */}
      {acts.length === 0 ? (
        <p className="text-center text-gray-500 py-12">
          {t(locale, "noActs")}
        </p>
      ) : (
        <div className="space-y-4">
          {acts.map((act, index) => (
            <div
              key={act.id}
              className={`bg-white rounded-xl shadow-sm border p-4 transition-all ${
                act.isActive
                  ? "border-yellow-400 ring-2 ring-yellow-200"
                  : "border-gray-200"
              }`}
            >
              {/* Act number and name */}
              <div className="flex items-start gap-3 mb-3">
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center text-sm font-bold">
                  {index + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 leading-tight">
                    {locale === "zh" ? act.nameZh : act.nameEn}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                        CHURCH_COLORS[act.church] ||
                        "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {act.church}
                    </span>
                  </div>
                </div>
              </div>

              {/* Star rating */}
              <div className="flex items-center justify-between">
                <StarRating
                  value={myVotes[act.id] || 0}
                  onChange={(score) => handleVote(act.id, score)}
                  disabled={votingLocked || submitting === act.id}
                />
                <div className="text-sm">
                  {submitting === act.id && (
                    <span className="text-gray-400">...</span>
                  )}
                  {submitted[act.id] && (
                    <span className="text-green-600 font-medium">
                      ✓ {t(locale, "submitted")}
                    </span>
                  )}
                  {!submitting && !submitted[act.id] && myVotes[act.id] && (
                    <span className="text-gray-400">
                      {t(locale, "yourVote")}: {myVotes[act.id]}★
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Donation Section */}
      <div className="mt-8 bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl border border-amber-200 p-5">
        <h2 className="text-lg font-bold text-amber-900 mb-2">
          🙏 {t(locale, "donationTitle")}
        </h2>
        <p className="text-sm text-amber-800 mb-4">
          {t(locale, "donationDesc")}
        </p>

        {/* JustGiving */}
        <a
          href="https://www.justgiving.com/team/kxmc-fundraisingteam-25"
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full text-center bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-4 rounded-lg mb-4 transition-colors"
        >
          💜 {t(locale, "justGivingLabel")}
        </a>

        {/* Bank Transfer */}
        <div className="bg-white rounded-lg border border-amber-200 p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">
            🏦 {t(locale, "bankTransferLabel")}
          </h3>
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">{t(locale, "accountName")}:</span>
              <span className="font-mono font-semibold text-gray-900">KCMC</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">{t(locale, "sortCode")}:</span>
              <span className="font-mono font-semibold text-gray-900">40-11-18</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">{t(locale, "accountNumber")}:</span>
              <span className="font-mono font-semibold text-gray-900">75876788</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
