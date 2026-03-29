"use client";

import { useI18n } from "@/lib/i18n-context";
import { t } from "@/lib/i18n";
import { LanguageToggle } from "@/components/LanguageToggle";
import Link from "next/link";

export default function GuidePage() {
  const { locale } = useI18n();

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {t(locale, "guideTitle")}
          </h1>
          <p className="text-sm text-gray-500">CMM Got Talent</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="text-sm bg-gray-900 text-white px-3 py-1.5 rounded-lg font-medium hover:bg-gray-800 transition-colors"
          >
            ← {t(locale, "backToVoting")}
          </Link>
          <LanguageToggle />
        </div>
      </div>

      {/* How to Vote — Online */}
      <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl border border-emerald-200 p-5 mb-4">
        <h2 className="text-lg font-bold text-emerald-900 mb-3">
          🗳️ {t(locale, "howToVoteTitle")}
        </h2>

        <div className="mb-4">
          <h3 className="text-sm font-bold text-emerald-800 mb-1">
            📱 {t(locale, "howToVoteOnline")}
          </h3>
          <p className="text-sm text-emerald-700">
            {t(locale, "howToVoteOnlineDesc")}
          </p>
        </div>

        <div>
          <h3 className="text-sm font-bold text-emerald-800 mb-1">
            ⭐ {t(locale, "howToVotePhysical")}
          </h3>
          <p className="text-sm text-emerald-700">
            {t(locale, "howToVotePhysicalDesc")}
          </p>
        </div>
      </div>

      {/* How to Pay */}
      <div className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-xl border border-violet-200 p-5 mb-4">
        <h2 className="text-lg font-bold text-violet-900 mb-3">
          💷 {t(locale, "howToPayTitle")}
        </h2>
        <ul className="space-y-2 text-sm text-violet-800">
          <li className="flex gap-2">
            <span>💵</span>
            <span>{t(locale, "howToPayCash")}</span>
          </li>
          <li className="flex gap-2">
            <span>🏦</span>
            <span>{t(locale, "howToPayTransfer")}</span>
          </li>
          <li className="flex gap-2">
            <span>💜</span>
            <span className="font-semibold">{t(locale, "howToPayJustGiving")}</span>
          </li>
        </ul>
        <div className="mt-3 bg-white/60 rounded-lg border border-violet-200 p-3">
          <p className="text-xs text-violet-700 font-medium">
            ⚠️ {t(locale, "howToPayJustGivingTip")}
          </p>
        </div>

        <a
          href="https://www.justgiving.com/team/kxmc-fundraisingteam-25"
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full text-center bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-4 rounded-lg mt-4 transition-colors"
        >
          💜 {t(locale, "justGivingLabel")}
        </a>
      </div>

      {/* Donation / Bank Transfer */}
      <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl border border-amber-200 p-5 mb-4">
        <h2 className="text-lg font-bold text-amber-900 mb-2">
          🙏 {t(locale, "donationTitle")}
        </h2>
        <p className="text-sm text-amber-800 mb-4">
          {t(locale, "donationDesc")}
        </p>

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

      {/* Find Out More */}
      <div className="bg-gradient-to-br from-sky-50 to-teal-50 rounded-xl border border-sky-200 p-5 mb-4">
        <h2 className="text-lg font-bold text-sky-900 mb-2">
          🔗 {t(locale, "findOutMoreTitle")}
        </h2>
        <p className="text-sm text-sky-800 mb-4">
          {t(locale, "findOutMoreDesc")}
        </p>

        <div className="grid grid-cols-2 gap-2 mb-3">
          <a
            href="https://www.kxmc.org/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-center bg-sky-600 hover:bg-sky-700 text-white font-semibold py-2.5 px-3 rounded-lg text-sm transition-colors"
          >
            🌐 {t(locale, "visitWebsite")}
          </a>
          <a
            href="https://www.kxmc.org/zh-hk"
            target="_blank"
            rel="noopener noreferrer"
            className="text-center bg-sky-600 hover:bg-sky-700 text-white font-semibold py-2.5 px-3 rounded-lg text-sm transition-colors"
          >
            🌐 網頁 (中文)
          </a>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-3">
          <a
            href="https://mailchi.mp/kxmc/eng-newsletter"
            target="_blank"
            rel="noopener noreferrer"
            className="text-center bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2.5 px-3 rounded-lg text-sm transition-colors"
          >
            📧 Newsletter
          </a>
          <a
            href="https://mailchi.mp/kxmc/chi-newsletter"
            target="_blank"
            rel="noopener noreferrer"
            className="text-center bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2.5 px-3 rounded-lg text-sm transition-colors"
          >
            📧 電子通訊 (中文)
          </a>
        </div>

        <p className="text-xs font-semibold text-sky-700 mb-2">
          📱 {t(locale, "connectSocial")}
        </p>
        <div className="grid grid-cols-2 gap-2">
          <a
            href="https://www.facebook.com/KingsCrossMethodistChurch"
            target="_blank"
            rel="noopener noreferrer"
            className="text-center bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-3 rounded-lg text-sm transition-colors"
          >
            Facebook
          </a>
          <a
            href="https://www.instagram.com/kxmc_church/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-center bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-2.5 px-3 rounded-lg text-sm transition-colors"
          >
            Instagram
          </a>
        </div>
      </div>

      {/* Back to voting */}
      <Link
        href="/"
        className="block w-full text-center bg-gray-900 hover:bg-gray-800 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
      >
        ← {t(locale, "backToVoting")}
      </Link>
    </div>
  );
}
