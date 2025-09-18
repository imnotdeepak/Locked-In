import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Analytics } from "@vercel/analytics/react";
import { UserProvider } from "@/contexts/UserContext";

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
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans antialiased">
        <UserProvider>
          <ProtectedRoute>
            <Navbar />
            {children}
          </ProtectedRoute>
        </UserProvider>
        <Analytics />
      </body>
    </html>
  );
}
