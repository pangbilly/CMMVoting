import type { Metadata } from "next";
import "./globals.css";
import { I18nProvider } from "@/lib/i18n-context";

export const metadata: Metadata = {
  title: "CMM Got Talent — 投票",
  description: "CMM Got Talent Voting System",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-Hant">
      <body className="bg-gray-50 min-h-screen">
        <I18nProvider>{children}</I18nProvider>
      </body>
    </html>
  );
}
