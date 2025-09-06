import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="flex items-center justify-center gap-16 md:gap-32">
        <Link
          href="/daily"
          className="text-white text-4xl md:text-6xl font-medium tracking-wide hover:opacity-80 transition-opacity"
        >
          Daily
        </Link>
        <Link
          href="/todo"
          className="text-white text-4xl md:text-6xl font-medium tracking-wide hover:opacity-80 transition-opacity"
        >
          Todo
        </Link>
        <Link
          href="/goals"
          className="text-white text-4xl md:text-6xl font-medium tracking-wide hover:opacity-80 transition-opacity"
        >
          Goals
        </Link>
      </div>
    </main>
  );
}
