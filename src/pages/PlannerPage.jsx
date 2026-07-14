import React, { useState, useEffect } from "react";
import {
  Plus,
  Trash2,
  Calendar,
  CheckCircle2,
  Circle,
  Clock,
  X,
} from "lucide-react";
import { apiEndpoints } from "../config/apiConfig";

const PlannerPage = ({ darkMode }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    due_date: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const response = await fetch(apiEndpoints.planner.getAll, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setTasks(data.tasks || []);
      }
    } catch (error) {
      console.error("Error fetching tasks:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!newTask.title.trim()) return;
    setIsSubmitting(true);
    try {
      const response = await fetch(apiEndpoints.planner.create, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newTask),
      });
      if (response.ok) {
        setShowAddModal(false);
        setNewTask({ title: "", description: "", due_date: "" });
        fetchTasks();
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleTask = async (id, completed) => {
    try {
      const response = await fetch(apiEndpoints.planner.update(id), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ completed: !completed ? 1 : 0 }),
      });
      if (response.ok) fetchTasks();
    } catch (error) {
      console.error(error);
    }
  };

  const deleteTask = async (id) => {
    if (!window.confirm("Delete this task?")) return;
    try {
      await fetch(apiEndpoints.planner.delete(id), {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchTasks();
    } catch (error) {
      console.error(error);
    }
  };

  if (loading)
    return (
      <div className="p-8 text-center animate-pulse">Loading Planner...</div>
    );

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1
          className={`text-3xl font-bold ${darkMode ? "text-white" : "text-gray-900"}`}
        >
          Study Planner
        </h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-5 py-2 bg-indigo-600 text-white rounded-xl shadow-lg"
        >
          <Plus size={20} /> Add Task
        </button>
      </div>

      <div className="space-y-3">
        {tasks.length === 0 ? (
          <div className="text-center py-20 opacity-50">
            <Calendar size={48} className="mx-auto mb-4" />
            No tasks scheduled
          </div>
        ) : (
          tasks.map((task) => (
            <div
              key={task.id}
              className={`flex items-center gap-4 p-4 rounded-xl border ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100"}`}
            >
              <button
                onClick={() => toggleTask(task.id, task.completed)}
                className={task.completed ? "text-green-500" : "text-gray-400"}
              >
                {task.completed ? <CheckCircle2 /> : <Circle />}
              </button>
              <div className="flex-1">
                <h3
                  className={`font-bold ${task.completed ? "line-through opacity-50" : ""}`}
                >
                  {task.title}
                </h3>
                {task.due_date && (
                  <p className="text-xs text-indigo-500 flex items-center gap-1">
                    <Clock size={12} /> {task.due_date}
                  </p>
                )}
              </div>
              <button
                onClick={() => deleteTask(task.id)}
                className="text-gray-400 hover:text-red-500"
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div
            className={`w-full max-w-md rounded-2xl p-6 ${darkMode ? "bg-gray-800 text-white" : "bg-white"}`}
          >
            <div className="flex justify-between mb-4">
              <h2 className="text-xl font-bold">New Study Task</h2>
              <button onClick={() => setShowAddModal(false)}>
                <X />
              </button>
            </div>
            <form onSubmit={handleAddTask} className="space-y-4">
              <input
                type="text"
                required
                placeholder="Task title"
                className="w-full p-2 rounded-lg border dark:bg-gray-700 dark:border-gray-600"
                value={newTask.title}
                onChange={(e) =>
                  setNewTask({ ...newTask, title: e.target.value })
                }
              />
              <input
                type="date"
                className="w-full p-2 rounded-lg border dark:bg-gray-700 dark:border-gray-600"
                value={newTask.due_date}
                onChange={(e) =>
                  setNewTask({ ...newTask, due_date: e.target.value })
                }
              />
              <textarea
                placeholder="Description"
                className="w-full p-2 rounded-lg border dark:bg-gray-700 dark:border-gray-600"
                value={newTask.description}
                onChange={(e) =>
                  setNewTask({ ...newTask, description: e.target.value })
                }
              />
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold"
              >
                {isSubmitting ? "Adding..." : "Add to Schedule"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlannerPage;
