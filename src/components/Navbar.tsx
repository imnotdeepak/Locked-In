"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser } from "@/contexts/UserContext";

export default function Navbar() {
  const pathname = usePathname();
  const { user, signOut } = useUser();
  const isHomePage = pathname === "/";

  const navLinks = [
    { href: "/daily", label: "Daily" },
    { href: "/todo", label: "Todo" },
    { href: "/goals", label: "Goals" },
  ];

  return (
    <nav className="bg-black shadow-sm border-b border-gray-800 px-4 py-3">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        {/* Left side - Locked In */}
        <Link
          href="/"
          className="text-xl font-bold text-white hover:text-gray-300 transition-colors"
        >
          Locked In
        </Link>

        {/* Center navigation links - only show when not on home page */}
        {!isHomePage && (
          <div className="flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`transition-colors font-medium ${
                  pathname === link.href
                    ? "text-white"
                    : "text-gray-300 hover:text-white"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        )}

        {/* Right side - Ethos and Sign Out */}
        <div className="flex items-center gap-4">
          <Link
            href="/ethos"
            className="text-gray-300 hover:text-white transition-colors font-medium"
          >
            Ethos
          </Link>
          {user && (
            <button
              onClick={signOut}
              className="text-gray-300 hover:text-white transition-colors text-sm"
            >
              Sign Out
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
