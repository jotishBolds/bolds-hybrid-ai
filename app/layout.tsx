/**
 * Root Layout Component
 *
 * Main layout wrapper for the entire Next.js application
 * Sets up HTML structure, metadata, and global styles
 */

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/**
 * Application metadata for SEO and browser display
 */
export const metadata: Metadata = {
  title: "Sikkim Government Service Assistant - Hybrid AI Chatbot",
  description:
    "AI-powered assistant for Sikkim Government Services. Get instant answers about service rules, policies, procedures, and regulations using advanced RAG technology.",
  keywords: [
    "Sikkim",
    "government",
    "service",
    "rules",
    "AI",
    "chatbot",
    "RAG",
    "assistant",
  ],
};

/**
 * Root layout component
 * Wraps all pages in the application
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-50`}
      >
        {children}
      </body>
    </html>
  );
}
