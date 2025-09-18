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
