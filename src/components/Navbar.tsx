"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();
  const isOnEthosPage = pathname === "/ethos";

  return (
    <nav className="bg-black shadow-sm border-b border-gray-800 px-4 py-3">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <Link
          href="/"
          className="text-xl font-bold text-white hover:text-gray-300 transition-colors"
        >
          Locked In
        </Link>
        <Link
          href={isOnEthosPage ? "/" : "/ethos"}
          className="text-gray-300 hover:text-white transition-colors font-medium"
        >
          {isOnEthosPage ? "Home" : "Ethos"}
        </Link>
      </div>
    </nav>
  );
}
