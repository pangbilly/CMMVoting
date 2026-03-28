export type Locale = "zh" | "en";

export const translations = {
  zh: {
    title: "CMM Got Talent",
    subtitle: "投票系統",
    voteFor: "為表演評分",
    score: "評分",
    submit: "提交投票",
    submitted: "已提交",
    update: "更新投票",
    updated: "已更新",
    stars: "星",
    church: "教會",
    votingLocked: "投票已關閉",
    votingLockedDesc: "感謝參與！投票已結束。",
    tapToRate: "點擊評分",
    yourVote: "你的評分",
    act: "表演",
    noActs: "暫無表演項目",
    loading: "載入中...",
    error: "發生錯誤",
    selectScore: "請選擇評分",
  },
  en: {
    title: "CMM Got Talent",
    subtitle: "Voting System",
    voteFor: "Rate the performance",
    score: "Score",
    submit: "Submit Vote",
    submitted: "Submitted",
    update: "Update Vote",
    updated: "Updated",
    stars: "stars",
    church: "Church",
    votingLocked: "Voting Closed",
    votingLockedDesc: "Thank you for participating! Voting has ended.",
    tapToRate: "Tap to rate",
    yourVote: "Your vote",
    act: "Act",
    noActs: "No acts available",
    loading: "Loading...",
    error: "An error occurred",
    selectScore: "Please select a score",
  },
} as const;

export function t(locale: Locale, key: keyof (typeof translations)["zh"]) {
  return translations[locale][key];
}
