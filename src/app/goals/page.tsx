"use client";

import { useEffect, useState } from "react";

interface Goal {
  id: string;
  text: string;
}

const SHORT_KEY = "lockedInShortTermGoals";
const LONG_KEY = "lockedInLongTermGoals";

export default function GoalsPage() {
  const [shortTerm, setShortTerm] = useState<Goal[]>([]);
  const [longTerm, setLongTerm] = useState<Goal[]>([]);
  const [inputText, setInputText] = useState("");
  const [activeList, setActiveList] = useState<"short" | "long" | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [dragged, setDragged] = useState<{
    list: "short" | "long";
    goal: Goal;
  } | null>(null);

  // Load
  useEffect(() => {
    try {
      const s = localStorage.getItem(SHORT_KEY);
      const l = localStorage.getItem(LONG_KEY);
      if (s) setShortTerm(JSON.parse(s));
      if (l) setLongTerm(JSON.parse(l));
    } catch {
      // ignore
    }
    setIsLoaded(true);
  }, []);

  // Persist
  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem(SHORT_KEY, JSON.stringify(shortTerm));
    } catch {}
  }, [shortTerm, isLoaded]);
  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem(LONG_KEY, JSON.stringify(longTerm));
    } catch {}
  }, [longTerm, isLoaded]);

  function addShort(text: string) {
    setShortTerm((prev) => [...prev, { id: Date.now().toString(), text }]);
  }

  function addLong(text: string) {
    setLongTerm((prev) => [...prev, { id: Date.now().toString(), text }]);
  }

  function addActive() {
    const text = inputText.trim();
    if (!activeList || !text) return;
    if (activeList === "short") addShort(text);
    else addLong(text);
    setInputText("");
  }

  function deleteGoal(list: "short" | "long", id: string) {
    if (list === "short")
      setShortTerm((prev) => prev.filter((g) => g.id !== id));
    else setLongTerm((prev) => prev.filter((g) => g.id !== id));
  }

  function handleDragStart(list: "short" | "long", goal: Goal) {
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

  function renderList(title: string, list: Goal[], listKey: "short" | "long") {
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
              className="bg-black border-2 border-[#080808] p-4 rounded-lg hover:border-[#1c1c1c] transition-colors flex items-center justify-between cursor-move"
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
    </div>
  );
}
