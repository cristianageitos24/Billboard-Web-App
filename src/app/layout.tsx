import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import GoogleMapsScriptLoader from "@/components/GoogleMapsScriptLoader";
import AuthNav from "@/components/AuthNav";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Houston Billboard Finder",
  description: "Houston billboard inventory map for small law firms",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <GoogleMapsScriptLoader />
        <header className="border-b border-neutral-200 dark:border-neutral-800">
          <AuthNav />
        </header>
        {children}
      </body>
    </html>
  );
}
