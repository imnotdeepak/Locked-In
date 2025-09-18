"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/contexts/UserContext";

interface Goal {
  id: string;
  text: string;
}

interface AnimatedGoal extends Goal {
  isAnimatingIn?: boolean;
  isAnimatingOut?: boolean;
}

export default function GoalsSupabase() {
  const { user } = useUser();
  const [shortTerm, setShortTerm] = useState<AnimatedGoal[]>([]);
  const [longTerm, setLongTerm] = useState<AnimatedGoal[]>([]);
  const [inputText, setInputText] = useState("");
  const [activeList, setActiveList] = useState<"short" | "long" | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dragged, setDragged] = useState<{
    list: "short" | "long";
    goal: AnimatedGoal;
  } | null>(null);

  // Load goals from Supabase
  useEffect(() => {
    if (user) {
      loadGoals();
    } else {
      setShortTerm([]);
      setLongTerm([]);
    }
  }, [user]);

  const loadGoals = async () => {
    try {
      setLoading(true);
      console.log("Loading goals from Supabase...");

      const { data, error } = await supabase
        .from("goals")
        .select("*")
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error loading goals:", error);
        return;
      }

      console.log("Loaded goals from Supabase:", data);

      // Separate short and long term goals
      const shortGoals = (data || [])
        .filter((goal: any) => goal.type === "short")
        .map((goal: any) => ({
          id: goal.id,
          text: goal.text,
          isAnimatingIn: false,
          isAnimatingOut: false,
        }));

      const longGoals = (data || [])
        .filter((goal: any) => goal.type === "long")
        .map((goal: any) => ({
          id: goal.id,
          text: goal.text,
          isAnimatingIn: false,
          isAnimatingOut: false,
        }));

      setShortTerm(shortGoals);
      setLongTerm(longGoals);
    } catch (error) {
      console.error("Error loading goals:", error);
    } finally {
      setLoading(false);
      setIsLoaded(true);
    }
  };

  const saveGoal = async (goal: Goal & { type: string }) => {
    try {
      // Remove animation properties before saving to database
      const { isAnimatingIn, isAnimatingOut, ...goalData } = goal as any;

      const { error } = await supabase.from("goals").insert([
        {
          ...goalData,
          user_id: user?.id,
        },
      ]);

      if (error) {
        console.error("Error saving goal:", error);
        throw error;
      }
    } catch (error) {
      console.error("Error saving goal:", error);
      throw error;
    }
  };

  const deleteGoalFromDB = async (goalId: string) => {
    try {
      const { error } = await supabase.from("goals").delete().eq("id", goalId);

      if (error) {
        console.error("Error deleting goal:", error);
        throw error;
      }
    } catch (error) {
      console.error("Error deleting goal:", error);
      throw error;
    }
  };

  function addShort(text: string) {
    const goal: AnimatedGoal = {
      id: crypto.randomUUID(),
      text,
      isAnimatingIn: true,
      isAnimatingOut: false,
    };

    // Optimistically update UI
    setShortTerm((prev) => [...prev, goal]);

    // Save to database
    saveGoal({ ...goal, type: "short" })
      .then(() => {
        // Remove animation state after animation completes
        setTimeout(() => {
          setShortTerm((prev) =>
            prev.map((g) =>
              g.id === goal.id ? { ...g, isAnimatingIn: false } : g
            )
          );
        }, 300);
      })
      .catch((error) => {
        // Revert on error
        setShortTerm((prev) => prev.filter((g) => g.id !== goal.id));
        console.error("Failed to save goal:", error);
        alert("Failed to save goal. Please try again.");
      });
  }

  function addLong(text: string) {
    const goal: AnimatedGoal = {
      id: crypto.randomUUID(),
      text,
      isAnimatingIn: true,
      isAnimatingOut: false,
    };

    // Optimistically update UI
    setLongTerm((prev) => [...prev, goal]);

    // Save to database
    saveGoal({ ...goal, type: "long" })
      .then(() => {
        // Remove animation state after animation completes
        setTimeout(() => {
          setLongTerm((prev) =>
            prev.map((g) =>
              g.id === goal.id ? { ...g, isAnimatingIn: false } : g
            )
          );
        }, 300);
      })
      .catch((error) => {
        // Revert on error
        setLongTerm((prev) => prev.filter((g) => g.id !== goal.id));
        console.error("Failed to save goal:", error);
        alert("Failed to save goal. Please try again.");
      });
  }

  function addActive() {
    const text = inputText.trim();
    if (!activeList || !text) return;
    if (activeList === "short") addShort(text);
    else addLong(text);
    setInputText("");
  }

  function deleteGoal(list: "short" | "long", id: string) {
    // Start fade-out animation
    if (list === "short") {
      setShortTerm((prev) =>
        prev.map((g) => (g.id === id ? { ...g, isAnimatingOut: true } : g))
      );
    } else {
      setLongTerm((prev) =>
        prev.map((g) => (g.id === id ? { ...g, isAnimatingOut: true } : g))
      );
    }

    // Remove from database
    deleteGoalFromDB(id)
      .then(() => {
        // Remove goal after animation completes
        setTimeout(() => {
          if (list === "short") {
            setShortTerm((prev) => prev.filter((g) => g.id !== id));
          } else {
            setLongTerm((prev) => prev.filter((g) => g.id !== id));
          }
        }, 300);
      })
      .catch((error) => {
        // Revert on error
        if (list === "short") {
          setShortTerm((prev) =>
            prev.map((g) => (g.id === id ? { ...g, isAnimatingOut: false } : g))
          );
        } else {
          setLongTerm((prev) =>
            prev.map((g) => (g.id === id ? { ...g, isAnimatingOut: false } : g))
          );
        }
        console.error("Failed to delete goal:", error);
        alert("Failed to delete goal. Please try again.");
      });
  }

  function handleDragStart(list: "short" | "long", goal: AnimatedGoal) {
    setDragged({ list, goal });
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
  }

  function handleDrop(list: "short" | "long", dropIndex: number) {
    if (!dragged) return;
    if (dragged.list !== list) {
      // Only reorder within the same list
      setDragged(null);
      return;
    }

    const sourceList = list === "short" ? shortTerm : longTerm;
    const draggedIndex = sourceList.findIndex((g) => g.id === dragged.goal.id);
    if (draggedIndex === -1 || draggedIndex === dropIndex) {
      setDragged(null);
      return;
    }

    const newList = [...sourceList];
    const [moved] = newList.splice(draggedIndex, 1);
    newList.splice(dropIndex, 0, moved);

    if (list === "short") setShortTerm(newList);
    else setLongTerm(newList);
    setDragged(null);
  }

  function renderList(
    title: string,
    list: AnimatedGoal[],
    listKey: "short" | "long"
  ) {
    return (
      <div className="bg-black border-2 border-[#080808] rounded-lg p-6">
        <h2 className="text-white font-semibold text-lg mb-4">{title}</h2>
        <div className="space-y-2 min-h-[200px]" onDragOver={handleDragOver}>
          {list.map((goal, index) => (
            <div
              key={goal.id}
              draggable
              onDragStart={() => handleDragStart(listKey, goal)}
              onDrop={() => handleDrop(listKey, index)}
              className={`bg-black border-2 border-[#080808] p-4 rounded-lg hover:border-[#1c1c1c] transition-all duration-300 ease-in-out flex items-center justify-between cursor-move ${
                goal.isAnimatingIn
                  ? "animate-fadeIn"
                  : goal.isAnimatingOut
                    ? "animate-fadeOut"
                    : ""
              }`}
            >
              <p className="text-white break-all pr-2">{goal.text}</p>
              <button
                onClick={() => deleteGoal(listKey, goal.id)}
                className="text-white hover:text-gray-300 transition-colors text-lg font-bold"
                title="Delete goal"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black px-4 py-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="text-white text-lg">Loading goals...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black px-4 py-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-6 text-center">
          Goals
        </h1>

        {/* Single centered input with Long/Short toggle and Add */}
        <div className="mb-10 flex justify-center">
          <div className="flex items-center gap-2 w-full max-w-2xl">
            <input
              type="text"
              value={inputText}
              onChange={(e) => {
                const v = e.target.value;
                setInputText(v);
              }}
              onKeyDown={(e) =>
                activeList &&
                e.key === "Enter" &&
                inputText.trim() &&
                addActive()
              }
              placeholder="Add a goal..."
              className="flex-1 px-4 py-2 border border-white rounded-lg focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent bg-black text-white placeholder-gray-400"
            />
            <div className="flex">
              <button
                onClick={() => setActiveList("short")}
                className={`px-4 py-2 border border-white transition-colors rounded-l-lg ${
                  activeList === "short"
                    ? "bg-white text-black"
                    : "text-white hover:bg-white hover:text-black"
                }`}
              >
                Short
              </button>
              <button
                onClick={() => setActiveList("long")}
                className={`px-4 py-2 border border-white transition-colors -ml-px rounded-r-lg ${
                  activeList === "long"
                    ? "bg-white text-black"
                    : "text-white hover:bg-white hover:text-black"
                }`}
              >
                Long
              </button>
            </div>
            <button
              onClick={addActive}
              disabled={!activeList || !inputText.trim()}
              className={`px-6 py-2 rounded-lg transition-colors border border-white ${
                activeList && inputText.trim()
                  ? "bg-white text-black hover:bg-black hover:text-white"
                  : "bg-transparent text-gray-500 cursor-not-allowed"
              }`}
            >
              Add
            </button>
          </div>
        </div>

        {/* Two lists below */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {renderList("Short Term", shortTerm, "short")}
          {renderList("Long Term", longTerm, "long")}
        </div>
      </div>

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
