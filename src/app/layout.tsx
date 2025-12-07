import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Providers } from "@/components/providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Monitoring Bencana Alam - Real-time Disaster Monitoring",
  description: "Sistem monitoring bencana alam real-time dengan ESP32 dan sensor IoT",
  keywords: ["monitoring bencana", "ESP32", "IoT", "sensor", "disaster monitoring"],
  authors: [{ name: "Disaster Monitoring Team" }],
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "Monitoring Bencana Alam",
    description: "Sistem monitoring bencana alam real-time",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
