import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { Analytics } from "@vercel/analytics/react";

export const metadata: Metadata = {
  title: "Locked In - Todo App",
  description: "A simple, focused todo app to keep you locked in on your goals",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-times antialiased">
        <Navbar />
        {children}
        <Analytics />
      </body>
    </html>
  );
}
