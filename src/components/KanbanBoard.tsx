"use client";

import { useState, useEffect } from "react";

interface Task {
  id: string;
  text: string;
  status: "do" | "doing" | "done";
}

export default function KanbanBoard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState("");
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
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
          setTasks(parsedTasks);
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
    const defaultTasks: Task[] = [
      { id: "1", text: "Plan project structure", status: "do" },
      { id: "2", text: "Set up development environment", status: "doing" },
      { id: "3", text: "Create initial design mockups", status: "done" },
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
        console.log("KanbanBoard: Saving tasks to localStorage:", tasks);
        localStorage.setItem("lockedInTasks", JSON.stringify(tasks));
      } catch (error) {
        console.error("Error saving tasks to localStorage:", error);
      }
    }
  }, [tasks, isLoaded]);

  const addTask = () => {
    if (newTask.trim()) {
      const task: Task = {
        id: Date.now().toString(),
        text: newTask.trim(),
        status: "do",
      };
      setTasks([...tasks, task]);
      setNewTask("");
    }
  };

  const deleteTask = (taskId: string) => {
    setTasks(tasks.filter((task) => task.id !== taskId));
  };

  const getTasksByStatus = (status: Task["status"]) => {
    return tasks.filter((task) => task.status === status);
  };

  const handleDragStart = (e: React.DragEvent, task: Task) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, status: Task["status"]) => {
    e.preventDefault();
    if (draggedTask) {
      setTasks(
        tasks.map((task) =>
          task.id === draggedTask.id ? { ...task, status } : task
        )
      );
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
            <div className="space-y-3">
              {getTasksByStatus(column.id).map((task) => (
                <div
                  key={task.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, task)}
                  className="bg-black border-2 border-[#080808] p-4 rounded-lg shadow-sm cursor-move hover:border-[#1c1c1c] transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <p className="text-white mb-3 flex-1 pr-2">{task.text}</p>
                    <button
                      onClick={() => deleteTask(task.id)}
                      className="text-white hover:text-gray-300 transition-colors text-lg font-bold"
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
    </div>
  );
}
