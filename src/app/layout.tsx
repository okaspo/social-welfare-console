import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "S級AI事務局 葵さん | 社会福祉法人の法務DX",
  description: "社会福祉法人の法務業務をAIでサポート。議事録作成、役員管理、定款管理を効率化します。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body>
        {children}
      </body>
    </html>
  );
}
