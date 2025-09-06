"use client";

import { useEffect, useMemo, useState } from "react";

interface Habit {
  id: string;
  text: string;
  completed: boolean;
}

const DAILY_HABITS_KEY = "lockedInDailyHabits";
const DAILY_RESET_TIME_KEY = "lockedInDailyResetTime"; // HH:MM (24h)
const DAILY_LAST_RESET_AT_KEY = "lockedInDailyLastResetAt"; // YYYY-MM-DD HH:MM

function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getHHMM(date: Date): string {
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

export default function DailyPage() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [newHabitText, setNewHabitText] = useState("");
  const [resetTime, setResetTime] = useState<string>("08:00");
  const [lastResetAt, setLastResetAt] = useState<string>("");
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage
  useEffect(() => {
    try {
      const savedHabits = localStorage.getItem(DAILY_HABITS_KEY);
      const parsedHabits: Habit[] = savedHabits ? JSON.parse(savedHabits) : [];
      if (Array.isArray(parsedHabits)) {
        setHabits(parsedHabits);
      }

      const savedResetTime = localStorage.getItem(DAILY_RESET_TIME_KEY);
      if (savedResetTime) setResetTime(savedResetTime);

      const savedLastResetAt = localStorage.getItem(DAILY_LAST_RESET_AT_KEY);
      if (savedLastResetAt) setLastResetAt(savedLastResetAt);
    } catch {
      // ignore
    }
    setIsLoaded(true);
  }, []);

  // Persist habits
  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem(DAILY_HABITS_KEY, JSON.stringify(habits));
    } catch {
      // ignore
    }
  }, [habits, isLoaded]);

  // Persist reset time
  useEffect(() => {
    try {
      localStorage.setItem(DAILY_RESET_TIME_KEY, resetTime);
    } catch {
      // ignore
    }
  }, [resetTime]);

  // Persist last reset timestamp (YYYY-MM-DD HH:MM)
  useEffect(() => {
    try {
      if (lastResetAt) {
        localStorage.setItem(DAILY_LAST_RESET_AT_KEY, lastResetAt);
      }
    } catch {
      // ignore
    }
  }, [lastResetAt]);

  // Auto-reset when device clock hits the selected HH:MM
  useEffect(() => {
    function maybeReset() {
      const now = new Date();
      const nowHHMM = getHHMM(now);
      if (nowHHMM === resetTime) {
        const stamp = `${getTodayDateString()} ${resetTime}`;
        if (lastResetAt !== stamp) {
          setHabits((prev) => prev.map((h) => ({ ...h, completed: false })));
          setLastResetAt(stamp);
        }
      }
    }

    // Run on mount and then every 30s
    maybeReset();
    const id = setInterval(maybeReset, 30 * 1000);
    return () => clearInterval(id);
  }, [resetTime, lastResetAt]);

  const totalCount = habits.length;
  const completedCount = useMemo(
    () => habits.filter((h) => h.completed).length,
    [habits]
  );
  const completionPercent =
    totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);

  function addHabit() {
    const text = newHabitText.trim();
    if (!text) return;
    const habit: Habit = {
      id: Date.now().toString(),
      text,
      completed: false,
    };
    setHabits((prev) => [...prev, habit]);
    setNewHabitText("");
  }

  function toggleHabit(id: string) {
    setHabits((prev) =>
      prev.map((h) => (h.id === id ? { ...h, completed: !h.completed } : h))
    );
  }

  function deleteHabit(id: string) {
    setHabits((prev) => prev.filter((h) => h.id !== id));
  }

  // Progress ring calculations (larger and thinner)
  const size = 320;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - completionPercent / 100);

  return (
    <div className="min-h-screen bg-black px-4 py-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-12 text-center">
          Daily Habits
        </h1>

        {/* Input row centered with Add and Reset Time buttons */}
        <div className="mb-8 flex justify-center">
          <div className="flex items-center gap-2 w-full max-w-2xl">
            <input
              type="text"
              value={newHabitText}
              onChange={(e) => setNewHabitText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addHabit()}
              placeholder="Add a new daily habit..."
              className="flex-1 px-4 py-2 border border-white rounded-lg focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent bg-black text-white placeholder-gray-400"
            />
            <button
              onClick={addHabit}
              className="px-6 py-2 bg-white text-black rounded-lg hover:bg-black hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-white border border-white"
            >
              Add
            </button>
            <button
              onClick={() => setIsResetModalOpen(true)}
              className="px-4 py-2 border border-white rounded-lg text-white hover:bg-white hover:text-black transition-colors"
            >
              Reset Time
            </button>
          </div>
        </div>

        {/* Center habits and circle in viewport */}
        <div
          className="flex items-center justify-center"
          style={{ minHeight: "calc(100vh - 260px)" }}
        >
          <div className="flex flex-col md:flex-row items-center justify-center gap-16 md:gap-64">
            <div className="w-full md:w-[28rem] mx-auto md:mx-0 space-y-2">
              {habits.map((habit) => (
                <div
                  key={habit.id}
                  className="bg-black border-2 border-[#080808] p-4 rounded-lg hover:border-[#1c1c1c] transition-colors flex items-center justify-between"
                >
                  <span className="text-white break-all flex-1 pr-4">
                    {habit.text}
                  </span>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => deleteHabit(habit.id)}
                      className="text-black hover:text-white text-lg font-bold"
                      title="Delete habit"
                    >
                      ×
                    </button>
                    <input
                      type="checkbox"
                      checked={habit.completed}
                      onChange={() => toggleHabit(habit.id)}
                      className="h-5 w-5 accent-white"
                    />
                  </div>
                </div>
              ))}
              {habits.length === 0 && (
                <p className="text-gray-400 text-center">
                  No habits yet. Add your first daily habit above.
                </p>
              )}
            </div>

            <div className="flex-1 flex justify-center">
              <svg width={size} height={size} className="block">
                {completionPercent === 0 ? (
                  <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="transparent"
                    stroke="#3a3a3a"
                    strokeWidth={strokeWidth}
                  />
                ) : (
                  <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="transparent"
                    stroke="#ffffff"
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={dashOffset}
                    style={{
                      transform: "rotate(-90deg)",
                      transformOrigin: "50% 50%",
                      transition: "stroke-dashoffset 0.4s ease",
                    }}
                  />
                )}
                <text
                  x="50%"
                  y="50%"
                  dominantBaseline="middle"
                  textAnchor="middle"
                  fill="#ffffff"
                  fontSize="28"
                  fontWeight={700}
                >
                  {completionPercent}%
                </text>
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Reset Time Modal */}
      {isResetModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-black border border-white rounded-lg p-6 w-full max-w-sm">
            <h2 className="text-white font-semibold mb-4">Select reset time</h2>
            <input
              type="time"
              value={resetTime}
              onChange={(e) => setResetTime(e.target.value)}
              className="w-full px-4 py-2 border border-white rounded-lg focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent bg-black text-white"
            />
            <p className="text-gray-400 text-sm mt-2">
              All habits reset to unchecked at the selected time each day.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setIsResetModalOpen(false)}
                className="px-4 py-2 border border-white rounded-lg text-white hover:bg-white hover:text-black transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => setIsResetModalOpen(false)}
                className="px-4 py-2 bg-white text-black rounded-lg hover:bg-black hover:text-white transition-colors border border-white"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
