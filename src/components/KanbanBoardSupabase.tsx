"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/contexts/UserContext";

interface Task {
  id: string;
  text: string;
  status: "do" | "doing" | "done";
}

interface AnimatedTask extends Task {
  isAnimatingIn?: boolean;
  isAnimatingOut?: boolean;
}

export default function KanbanBoardSupabase() {
  const { user } = useUser();
  const [tasks, setTasks] = useState<AnimatedTask[]>([]);
  const [newTask, setNewTask] = useState("");
  const [draggedTask, setDraggedTask] = useState<AnimatedTask | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [loading, setLoading] = useState(false);

  // Load tasks from Supabase on component mount
  useEffect(() => {
    if (user) {
      loadTasks();
    }
  }, [user]);

  const loadTasks = async () => {
    try {
      setLoading(true);
      console.log("Loading tasks from Supabase...");

      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error loading tasks:", error);
        return;
      }

      console.log("Loaded tasks from Supabase:", data);

      // Add animation state to loaded tasks
      const animatedTasks = (data || []).map((task: any) => ({
        id: task.id,
        text: task.text,
        status: task.status,
        isAnimatingIn: false,
        isAnimatingOut: false,
      }));

      setTasks(animatedTasks);
    } catch (error) {
      console.error("Error loading tasks:", error);
    } finally {
      setLoading(false);
      setIsLoaded(true);
    }
  };

  const saveTask = async (task: Task) => {
    try {
      // Remove animation properties before saving to database
      const { isAnimatingIn, isAnimatingOut, ...taskData } = task as any;

      const { error } = await supabase.from("tasks").insert([
        {
          ...taskData,
          user_id: user?.id,
        },
      ]);

      if (error) {
        console.error("Error saving task:", error);
        throw error;
      }
    } catch (error) {
      console.error("Error saving task:", error);
      throw error;
    }
  };

  const updateTask = async (taskId: string, updates: Partial<Task>) => {
    try {
      const { error } = await supabase
        .from("tasks")
        .update(updates)
        .eq("id", taskId);

      if (error) {
        console.error("Error updating task:", error);
        throw error;
      }
    } catch (error) {
      console.error("Error updating task:", error);
      throw error;
    }
  };

  const deleteTaskFromDB = async (taskId: string) => {
    try {
      const { error } = await supabase.from("tasks").delete().eq("id", taskId);

      if (error) {
        console.error("Error deleting task:", error);
        throw error;
      }
    } catch (error) {
      console.error("Error deleting task:", error);
      throw error;
    }
  };

  const addTask = async () => {
    if (newTask.trim()) {
      const task: AnimatedTask = {
        id: crypto.randomUUID(),
        text: newTask.trim(),
        status: "do",
        isAnimatingIn: true,
        isAnimatingOut: false,
      };

      // Optimistically update UI
      setTasks([...tasks, task]);
      setNewTask("");

      try {
        // Save to database
        await saveTask(task);

        // Remove animation state after animation completes
        setTimeout(() => {
          setTasks((prevTasks) =>
            prevTasks.map((t) =>
              t.id === task.id ? { ...t, isAnimatingIn: false } : t
            )
          );
        }, 300);
      } catch (error) {
        // Revert on error
        setTasks(tasks);
        console.error("Failed to save task:", error);
        alert("Failed to save task. Please try again.");
      }
    }
  };

  const deleteTask = async (taskId: string) => {
    // Start fade-out animation
    setTasks((prevTasks) =>
      prevTasks.map((task) =>
        task.id === taskId ? { ...task, isAnimatingOut: true } : task
      )
    );

    // Remove from database
    try {
      await deleteTaskFromDB(taskId);

      // Remove task after animation completes
      setTimeout(() => {
        setTasks((prevTasks) => prevTasks.filter((task) => task.id !== taskId));
      }, 300);
    } catch (error) {
      // Revert on error
      setTasks((prevTasks) =>
        prevTasks.map((task) =>
          task.id === taskId ? { ...task, isAnimatingOut: false } : task
        )
      );
      console.error("Failed to delete task:", error);
      alert("Failed to delete task. Please try again.");
    }
  };

  const getTasksByStatus = (status: Task["status"]) => {
    return tasks.filter((task) => task.status === status);
  };

  const handleDragStart = (e: React.DragEvent, task: AnimatedTask) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = async (
    e: React.DragEvent,
    status: Task["status"],
    dropIndex?: number
  ) => {
    e.preventDefault();
    console.log("Drop event:", { status, dropIndex, draggedTask });

    if (draggedTask) {
      if (draggedTask.status === status && dropIndex !== undefined) {
        // Reordering within the same column
        console.log("Reordering within same column");
        const columnTasks = getTasksByStatus(status);
        const draggedIndex = columnTasks.findIndex(
          (task) => task.id === draggedTask.id
        );

        console.log("Column tasks:", columnTasks);
        console.log("Dragged index:", draggedIndex, "Drop index:", dropIndex);

        if (draggedIndex !== dropIndex) {
          // Create new array with reordered tasks
          const newColumnTasks = [...columnTasks];
          const [movedTask] = newColumnTasks.splice(draggedIndex, 1);
          newColumnTasks.splice(dropIndex, 0, movedTask);

          console.log("New column tasks:", newColumnTasks);

          // Update the main tasks array with the new order
          const otherTasks = tasks.filter((task) => task.status !== status);
          const reorderedTasks = [...otherTasks, ...newColumnTasks];
          console.log("Final reordered tasks:", reorderedTasks);
          setTasks(reorderedTasks);
        }
      } else if (draggedTask.status !== status) {
        // Moving to a different column
        console.log("Moving to different column");

        // Optimistically update UI
        setTasks(
          tasks.map((task) =>
            task.id === draggedTask.id ? { ...task, status } : task
          )
        );

        try {
          // Update in database
          await updateTask(draggedTask.id, { status });
        } catch (error) {
          // Revert on error
          setTasks(
            tasks.map((task) =>
              task.id === draggedTask.id
                ? { ...task, status: draggedTask.status }
                : task
            )
          );
          console.error("Failed to update task:", error);
          alert("Failed to update task. Please try again.");
        }
      }
      setDraggedTask(null);
    }
  };

  const columns = [
    { id: "do", title: "Do" },
    { id: "doing", title: "Doing" },
    { id: "done", title: "Done" },
  ] as const;

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-white text-lg">Loading tasks...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Add Task Section - Centered */}
      <div className="mb-8 flex justify-center">
        <div className="flex gap-2 max-w-md w-full">
          <input
            type="text"
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && addTask()}
            placeholder="Add a new task..."
            className="flex-1 px-4 py-2 border border-white rounded-lg focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent bg-black text-white placeholder-gray-400"
          />
          <button
            onClick={addTask}
            className="px-6 py-2 bg-white text-black rounded-lg hover:bg-black hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-white border border-white"
          >
            Add
          </button>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {columns.map((column) => (
          <div
            key={column.id}
            className="rounded-lg p-4 min-h-screen"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, column.id)}
          >
            <h3 className="text-lg font-semibold mb-4 text-white border-b border-white pb-2">
              {column.title}
            </h3>
            <div className="space-y-2 min-h-[200px]">
              {getTasksByStatus(column.id).map((task, index) => (
                <div
                  key={task.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, task)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, column.id, index)}
                  className={`bg-black border-2 border-[#080808] p-4 rounded-lg shadow-sm cursor-move hover:border-[#1c1c1c] transition-all duration-300 ease-in-out ${
                    task.isAnimatingIn
                      ? "animate-fadeIn"
                      : task.isAnimatingOut
                        ? "animate-fadeOut"
                        : ""
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <p className="text-white flex-1 pr-2 text-left break-all hyphens-auto">
                      {task.text}
                    </p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteTask(task.id);
                      }}
                      className="text-white hover:text-gray-300 transition-colors text-lg font-bold flex-shrink-0"
                      title="Delete task"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
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
