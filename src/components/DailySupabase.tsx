"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/contexts/UserContext";

interface Habit {
  id: string;
  text: string;
  completed: boolean;
}

interface AnimatedHabit extends Habit {
  isAnimatingIn?: boolean;
  isAnimatingOut?: boolean;
}

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

export default function DailySupabase() {
  const { user } = useUser();
  const [habits, setHabits] = useState<AnimatedHabit[]>([]);
  const [newHabitText, setNewHabitText] = useState("");
  const [resetTime, setResetTime] = useState<string>("08:00");
  const [lastResetAt, setLastResetAt] = useState<string>("");
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Load habits from Supabase
  useEffect(() => {
    if (user) {
      loadHabits();
    } else {
      setHabits([]);
    }
  }, [user]);

  const loadHabits = async () => {
    try {
      setLoading(true);
      console.log("Loading habits from Supabase...");

      const { data, error } = await supabase
        .from("daily_habits")
        .select("*")
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error loading habits:", error);
        return;
      }

      console.log("Loaded habits from Supabase:", data);

      // Add animation state to loaded habits
      const animatedHabits = (data || []).map(
        (habit: { id: string; text: string; completed: boolean }) => ({
          id: habit.id,
          text: habit.text,
          completed: habit.completed,
          isAnimatingIn: false,
          isAnimatingOut: false,
        })
      );

      setHabits(animatedHabits);

      // Load reset time and last reset from the first habit (they should all be the same)
      if (data && data.length > 0) {
        const firstHabit = data[0];
        if (firstHabit.reset_time) {
          setResetTime(firstHabit.reset_time);
        }
        if (firstHabit.last_reset_at) {
          const resetDate = new Date(firstHabit.last_reset_at);
          setLastResetAt(`${getTodayDateString()} ${getHHMM(resetDate)}`);
        }
      }
    } catch (error) {
      console.error("Error loading habits:", error);
    } finally {
      setLoading(false);
    }
  };

  const saveHabit = async (habit: AnimatedHabit) => {
    try {
      // Remove animation properties before saving to database
      const { isAnimatingIn: _, isAnimatingOut: __, ...habitData } = habit;

      const { error } = await supabase.from("daily_habits").insert([
        {
          ...habitData,
          user_id: user?.id,
          reset_time: resetTime,
          last_reset_at: lastResetAt
            ? new Date(lastResetAt).toISOString()
            : null,
        },
      ]);

      if (error) {
        console.error("Error saving habit:", error);
        throw error;
      }
    } catch (error) {
      console.error("Error saving habit:", error);
      throw error;
    }
  };

  const updateHabit = async (habitId: string, updates: Partial<Habit>) => {
    try {
      const { error } = await supabase
        .from("daily_habits")
        .update(updates)
        .eq("id", habitId);

      if (error) {
        console.error("Error updating habit:", error);
        throw error;
      }
    } catch (error) {
      console.error("Error updating habit:", error);
      throw error;
    }
  };

  const deleteHabitFromDB = async (habitId: string) => {
    try {
      const { error } = await supabase
        .from("daily_habits")
        .delete()
        .eq("id", habitId);

      if (error) {
        console.error("Error deleting habit:", error);
        throw error;
      }
    } catch (error) {
      console.error("Error deleting habit:", error);
      throw error;
    }
  };

  const updateResetTime = async () => {
    try {
      // Update reset time for all habits
      const { error } = await supabase
        .from("daily_habits")
        .update({ reset_time: resetTime })
        .eq("user_id", user?.id);

      if (error) {
        console.error("Error updating reset time:", error);
        throw error;
      }
    } catch (error) {
      console.error("Error updating reset time:", error);
      throw error;
    }
  };

  // Auto-reset when device clock hits the selected HH:MM
  useEffect(() => {
    function maybeReset() {
      const now = new Date();
      const nowHHMM = getHHMM(now);
      if (nowHHMM === resetTime) {
        const stamp = `${getTodayDateString()} ${resetTime}`;
        if (lastResetAt !== stamp) {
          // Reset all habits to incomplete
          setHabits((prev) => prev.map((h) => ({ ...h, completed: false })));
          setLastResetAt(stamp);

          // Update in database
          supabase
            .from("daily_habits")
            .update({
              completed: false,
              last_reset_at: new Date().toISOString(),
            })
            .eq("user_id", user?.id)
            .then(({ error }) => {
              if (error) {
                console.error("Error resetting habits:", error);
              }
            });
        }
      }
    }

    // Run on mount and then every 30s
    maybeReset();
    const id = setInterval(maybeReset, 30 * 1000);
    return () => clearInterval(id);
  }, [resetTime, lastResetAt, user?.id]);

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
    const habit: AnimatedHabit = {
      id: crypto.randomUUID(),
      text,
      completed: false,
      isAnimatingIn: true,
      isAnimatingOut: false,
    };

    // Optimistically update UI
    setHabits((prev) => [...prev, habit]);
    setNewHabitText("");

    // Save to database
    saveHabit(habit)
      .then(() => {
        // Remove animation state after animation completes
        setTimeout(() => {
          setHabits((prev) =>
            prev.map((h) =>
              h.id === habit.id ? { ...h, isAnimatingIn: false } : h
            )
          );
        }, 300);
      })
      .catch((error) => {
        // Revert on error
        setHabits((prev) => prev.filter((h) => h.id !== habit.id));
        console.error("Failed to save habit:", error);
        alert("Failed to save habit. Please try again.");
      });
  }

  function toggleHabit(id: string) {
    const habit = habits.find((h) => h.id === id);
    if (!habit) return;

    // Optimistically update UI
    setHabits((prev) =>
      prev.map((h) => (h.id === id ? { ...h, completed: !h.completed } : h))
    );

    // Update in database
    updateHabit(id, { completed: !habit.completed }).catch((error) => {
      // Revert on error
      setHabits((prev) =>
        prev.map((h) =>
          h.id === id ? { ...h, completed: habit.completed } : h
        )
      );
      console.error("Failed to update habit:", error);
      alert("Failed to update habit. Please try again.");
    });
  }

  function deleteHabit(id: string) {
    // Start fade-out animation
    setHabits((prev) =>
      prev.map((h) => (h.id === id ? { ...h, isAnimatingOut: true } : h))
    );

    // Remove from database
    deleteHabitFromDB(id)
      .then(() => {
        // Remove habit after animation completes
        setTimeout(() => {
          setHabits((prev) => prev.filter((h) => h.id !== id));
        }, 300);
      })
      .catch((error) => {
        // Revert on error
        setHabits((prev) =>
          prev.map((h) => (h.id === id ? { ...h, isAnimatingOut: false } : h))
        );
        console.error("Failed to delete habit:", error);
        alert("Failed to delete habit. Please try again.");
      });
  }

  function handleResetTimeSave() {
    updateResetTime()
      .then(() => {
        setIsResetModalOpen(false);
      })
      .catch((error) => {
        console.error("Failed to update reset time:", error);
        alert("Failed to update reset time. Please try again.");
      });
  }

  // Progress ring calculations (larger and thinner)
  const size = 400;
  const strokeWidth = 4;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - completionPercent / 100);

  if (loading) {
    return (
      <div className="min-h-screen bg-black px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="text-white text-lg">Loading habits...</div>
          </div>
        </div>
      </div>
    );
  }

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
                  className={`bg-black border-2 border-[#080808] p-4 rounded-lg hover:border-[#1c1c1c] transition-all duration-300 ease-in-out flex items-center justify-between ${
                    habit.isAnimatingIn
                      ? "animate-fadeIn"
                      : habit.isAnimatingOut
                        ? "animate-fadeOut"
                        : ""
                  }`}
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
                    <button
                      onClick={() => toggleHabit(habit.id)}
                      className={`w-6 h-6 rounded-full border-2 transition-all duration-200 flex items-center justify-center ${
                        habit.completed
                          ? "bg-[#8ace00] border-[#8ace00]"
                          : "bg-black border-[#8ace00]"
                      }`}
                    >
                      {habit.completed && (
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          className="text-black"
                        >
                          <path
                            d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"
                            fill="currentColor"
                          />
                        </svg>
                      )}
                    </button>
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
                    stroke="#000000"
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
                  fontSize="32"
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
                onClick={handleResetTimeSave}
                className="px-4 py-2 bg-white text-black rounded-lg hover:bg-black hover:text-white transition-colors border border-white"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes fadeOut {
          from {
            opacity: 1;
          }
          to {
            opacity: 0;
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
        }

        .animate-fadeOut {
          animation: fadeOut 0.3s ease-in forwards;
        }
      `}</style>
    </div>
  );
}
