import type { Metadata } from "next";
import { Orbitron, Geist_Mono } from "next/font/google";
import "./globals.css";

const orbitron = Orbitron({
  variable: "--font-orbitron",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Argus Command Center",
  description: "Global Information Terminal",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${orbitron.variable} ${geistMono.variable} font-orbitron min-h-full flex flex-col antialiased`}>
        {children}
      </body>
    </html>
  );
}
