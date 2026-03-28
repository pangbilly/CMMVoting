"use client";

import { useI18n } from "@/lib/i18n-context";

export function LanguageToggle() {
  const { locale, setLocale } = useI18n();

  return (
    <button
      onClick={() => setLocale(locale === "zh" ? "en" : "zh")}
      className="px-3 py-1.5 rounded-full bg-white border border-gray-300 text-sm font-medium shadow-sm hover:bg-gray-50 transition-colors"
    >
      {locale === "zh" ? "EN" : "中文"}
    </button>
  );
}
