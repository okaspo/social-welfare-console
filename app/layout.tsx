import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "GovAI Social Welfare Console",
  description: "AI-powered governance operating system for social welfare corporations.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className={cn(inter.className, "min-h-screen bg-background text-foreground antialiased")}>
        {children}
      </body>
    </html>
  );
}
