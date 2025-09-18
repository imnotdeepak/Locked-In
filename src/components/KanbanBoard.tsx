"use client";

import { useState, useEffect } from "react";

interface Task {
  id: string;
  text: string;
  status: "do" | "doing" | "done";
}

interface AnimatedTask extends Task {
  isAnimatingIn?: boolean;
  isAnimatingOut?: boolean;
}

export default function KanbanBoard() {
  const [tasks, setTasks] = useState<AnimatedTask[]>([]);
  const [newTask, setNewTask] = useState("");
  const [draggedTask, setDraggedTask] = useState<AnimatedTask | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load tasks from localStorage on component mount
  useEffect(() => {
    console.log("KanbanBoard: Component mounting, checking localStorage...");
    try {
      const savedTasks = localStorage.getItem("lockedInTasks");
      console.log("KanbanBoard: Retrieved from localStorage:", savedTasks);
      if (savedTasks) {
        const parsedTasks = JSON.parse(savedTasks);
        if (Array.isArray(parsedTasks)) {
          console.log("KanbanBoard: Loading saved tasks:", parsedTasks);
          // Add animation state to loaded tasks
          const animatedTasks = parsedTasks.map((task: Task) => ({
            ...task,
            isAnimatingIn: false,
            isAnimatingOut: false,
          }));
          setTasks(animatedTasks);
        } else {
          console.log(
            "KanbanBoard: Saved data is not an array, setting defaults"
          );
          setDefaultTasks();
        }
      } else {
        console.log("KanbanBoard: No saved tasks found, setting defaults");
        setDefaultTasks();
      }
    } catch (error) {
      console.error("Error loading tasks from localStorage:", error);
      setDefaultTasks();
    } finally {
      setIsLoaded(true);
    }

    // Cleanup function to log when component unmounts
    return () => {
      console.log("KanbanBoard: Component unmounting");
    };
  }, []);

  const setDefaultTasks = () => {
    console.log("KanbanBoard: Setting default tasks");
    const defaultTasks: AnimatedTask[] = [
      {
        id: "1",
        text: "Plan project structure",
        status: "do",
        isAnimatingIn: false,
        isAnimatingOut: false,
      },
      {
        id: "2",
        text: "Set up development environment",
        status: "doing",
        isAnimatingIn: false,
        isAnimatingOut: false,
      },
      {
        id: "3",
        text: "Create initial design mockups",
        status: "done",
        isAnimatingIn: false,
        isAnimatingOut: false,
      },
    ];
    setTasks(defaultTasks);
    try {
      localStorage.setItem("lockedInTasks", JSON.stringify(defaultTasks));
      console.log("KanbanBoard: Default tasks saved to localStorage");
    } catch (error) {
      console.error("Error saving default tasks to localStorage:", error);
    }
  };

  // Save tasks to localStorage whenever tasks change
  useEffect(() => {
    if (isLoaded) {
      try {
        // Save tasks without animation states
        const tasksToSave = tasks.map(
          ({ isAnimatingIn: _, isAnimatingOut: __, ...task }) => task
        );
        console.log("KanbanBoard: Saving tasks to localStorage:", tasksToSave);
        localStorage.setItem("lockedInTasks", JSON.stringify(tasksToSave));
      } catch (error) {
        console.error("Error saving tasks to localStorage:", error);
      }
    }
  }, [tasks, isLoaded]);

  const addTask = () => {
    if (newTask.trim()) {
      const task: AnimatedTask = {
        id: Date.now().toString(),
        text: newTask.trim(),
        status: "do",
        isAnimatingIn: true,
        isAnimatingOut: false,
      };
      setTasks([...tasks, task]);
      setNewTask("");

      // Remove animation state after animation completes
      setTimeout(() => {
        setTasks((prevTasks) =>
          prevTasks.map((t) =>
            t.id === task.id ? { ...t, isAnimatingIn: false } : t
          )
        );
      }, 300);
    }
  };

  const deleteTask = (taskId: string) => {
    // Start fade-out animation
    setTasks((prevTasks) =>
      prevTasks.map((task) =>
        task.id === taskId ? { ...task, isAnimatingOut: true } : task
      )
    );

    // Remove task after animation completes
    setTimeout(() => {
      setTasks((prevTasks) => prevTasks.filter((task) => task.id !== taskId));
    }, 300);
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

  const handleDrop = (
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
        setTasks(
          tasks.map((task) =>
            task.id === draggedTask.id ? { ...task, status } : task
          )
        );
      }
      setDraggedTask(null);
    }
  };

  const columns = [
    { id: "do", title: "Do" },
    { id: "doing", title: "Doing" },
    { id: "done", title: "Done" },
  ] as const;

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
