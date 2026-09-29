import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckSquare, Plus, Edit2, Trash2, ChevronDown, ChevronRight, Check } from "lucide-react";

export default function GlobalNotesModal({
  isOpen,
  onClose,
  tasks = [],
  setTasks,
}) {
  const [newTaskText, setNewTaskText] = useState("");
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editingTaskText, setEditingTaskText] = useState("");
  const [expandedTasks, setExpandedTasks] = useState({});
  const [isCompletedSectionOpen, setIsCompletedSectionOpen] = useState(true);

  if (!isOpen) return null;

  const activeTasks = tasks.filter(t => !t.completed);
  const completedTasks = tasks.filter(t => t.completed);

  const handleAddTask = (e) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;
    const newTask = {
      id: Date.now().toString(),
      text: newTaskText.trim(),
      completed: false,
      createdAt: new Date().toISOString(),
    };
    setTasks(prev => [newTask, ...prev]);
    setNewTaskText("");
  };

  const handleToggleTask = (id) => {
    setTasks(prev =>
      prev.map(t => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  };

  const handleSaveEdit = (id) => {
    if (!editingTaskText.trim()) return;
    setTasks(prev =>
      prev.map(t => (t.id === id ? { ...t, text: editingTaskText.trim() } : t))
    );
    setEditingTaskId(null);
    setEditingTaskText("");
  };

  const handleDeleteTask = (id) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const toggleExpand = (id) => {
    setExpandedTasks(prev => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const renderTaskItem = (task) => {
    const isExpanded = !!expandedTasks[task.id];
    const isLongText = task.text && task.text.length > 35;
    const isEditing = editingTaskId === task.id;

    return (
      <motion.div
        key={task.id}
        layout
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className={`task-item flex border border-white/5 bg-[#06040c]/50 hover:border-cyber-yellow/25 rounded-xl p-2.5 transition-colors gap-2.5 ${
          isExpanded ? "ring-1 ring-cyber-yellow/30 items-start" : "items-center"
        } ${task.completed ? "opacity-75 bg-[#06040c]/30" : ""}`}
      >
        {isEditing ? (
          <div className="flex-1 flex items-center gap-1.5 min-w-0">
            <input
              type="text"
              value={editingTaskText}
              onChange={(e) => setEditingTaskText(e.target.value)}
              className="flex-1 bg-black/70 border border-cyber-yellow/60 text-white rounded-lg px-2 py-1 text-xs font-mono focus:outline-none focus:ring-0 cursor-text"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSaveEdit(task.id);
                if (e.key === "Escape") setEditingTaskId(null);
              }}
            />
            <button
              type="button"
              onClick={() => handleSaveEdit(task.id)}
              className="px-2 py-1 rounded bg-cyber-green/20 hover:bg-cyber-green text-cyber-green hover:text-black border border-cyber-green/40 text-[10px] font-bold tracking-wider transition-all uppercase shrink-0"
            >
              OK
            </button>
            <button
              type="button"
              onClick={() => setEditingTaskId(null)}
              className="px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-gray-400 text-[10px] font-bold tracking-wider transition-all uppercase shrink-0"
            >
              Отмена
            </button>
          </div>
        ) : (
          <>
            <div className={`flex items-start gap-2.5 min-w-0 flex-1 ${isExpanded ? "pt-0.5" : ""}`}>
              <button
                type="button"
                onClick={() => handleToggleTask(task.id)}
                className={`w-4 h-4 mt-0.5 rounded border flex items-center justify-center transition-all shrink-0 cursor-pointer ${
                  task.completed
                    ? "bg-cyber-yellow/20 border-cyber-yellow text-cyber-yellow"
                    : "border-white/20 bg-black/40 hover:border-cyber-yellow/60 text-transparent hover:text-cyber-yellow/40"
                }`}
              >
                <Check className="w-3 h-3 stroke-[3]" />
              </button>
              <span
                onClick={() => isLongText && toggleExpand(task.id)}
                className={`text-xs font-mono leading-relaxed transition-colors flex-1 ${
                  isLongText ? "cursor-pointer" : ""
                } ${
                  isExpanded ? "whitespace-pre-wrap break-words select-text" : "truncate"
                } ${
                  task.completed ? "line-through text-gray-500" : "text-gray-200 hover:text-white"
                }`}
                title={isLongText ? (isExpanded ? "Свернуть задачу" : "Развернуть полностью") : undefined}
              >
                {task.text}
              </span>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {isLongText && (
                <button
                  type="button"
                  onClick={() => toggleExpand(task.id)}
                  className="text-cyber-yellow/80 hover:text-cyber-yellow p-1 rounded hover:bg-cyber-yellow/10 transition-colors"
                  title={isExpanded ? "Свернуть" : "Развернуть полностью"}
                >
                  <motion.div
                    animate={{ rotate: isExpanded ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
                  </motion.div>
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setEditingTaskId(task.id);
                  setEditingTaskText(task.text);
                }}
                className="text-cyber-yellow/75 hover:text-cyber-yellow p-1 rounded hover:bg-cyber-yellow/10 transition-colors"
                title="Редактировать задачу"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => handleDeleteTask(task.id)}
                className="text-red-500 hover:text-red-400 p-1 rounded hover:bg-red-500/10 transition-colors"
                title="Удалить задачу"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </>
        )}
      </motion.div>
    );
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/85 backdrop-blur-md z-[99999] flex items-center justify-center p-4 sm:p-6 select-none font-mono"
      >
        <motion.div
          initial={{ scale: 0.95, y: 15 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.95, y: 15 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-xl bg-cyber-sidebar/95 border border-cyber-yellow/40 rounded-2xl p-5 sm:p-6 shadow-[0_15px_45px_rgba(0,0,0,0.85)] relative text-left flex flex-col max-h-[85vh] overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4 shrink-0">
            <div className="flex items-center gap-2.5 text-cyber-yellow">
              <div className="p-2 rounded-xl bg-cyber-yellow/10 border border-cyber-yellow/30">
                <CheckSquare className="w-5 h-5 text-cyber-yellow" />
              </div>
              <div>
                <span className="text-xs font-black uppercase tracking-widest block">
                  ОБЩИЕ ЗАМЕТКИ // ЗАДАЧИ
                </span>
                <span className="text-[10px] text-gray-500 font-mono block">
                  Единые для всех пространств и режимов
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Completed counter in top right */}
              <div
                className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyber-yellow/10 border border-cyber-yellow/30 text-cyber-yellow text-xs font-bold"
                title="Количество выполненных задач"
              >
                <Check className="w-3.5 h-3.5" />
                <span>
                  Выполнено: <span className="font-mono text-white">{completedTasks.length}</span>
                  {tasks.length > 0 && (
                    <span className="text-gray-400 font-normal ml-1">/ {tasks.length}</span>
                  )}
                </span>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="text-gray-400 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/5 cursor-pointer"
                title="Закрыть"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Form to add a new task */}
          <form onSubmit={handleAddTask} className="flex gap-2 mb-4 shrink-0">
            <input
              type="text"
              placeholder="Добавить общую задачу или заметку..."
              value={newTaskText}
              onChange={(e) => setNewTaskText(e.target.value)}
              className="flex-1 bg-black/50 border border-white/15 focus:border-cyber-yellow/60 text-white placeholder-gray-500 rounded-xl px-3.5 py-2 text-xs font-mono focus:ring-0 focus:outline-none transition-all cursor-text"
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-cyber-yellow/15 hover:bg-cyber-yellow hover:text-black border border-cyber-yellow/40 hover:border-cyber-yellow text-cyber-yellow text-xs font-bold tracking-wider transition-all uppercase flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Добавить</span>
            </button>
          </form>

          {/* Tasks Container */}
          <div className="flex-1 overflow-y-auto pr-1 space-y-4 scrollbar-thin">
            {/* Active (Uncompleted) Tasks */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] uppercase tracking-wider text-gray-400 font-bold px-1">
                <span>Текущие задачи ({activeTasks.length})</span>
              </div>

              {activeTasks.length === 0 ? (
                <div className="text-center py-6 border border-dashed border-white/10 rounded-xl bg-black/20">
                  <p className="text-xs text-gray-500 font-mono">
                    Нет активных задач. Отличная работа или добавьте новую выше!
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {activeTasks.map(renderTaskItem)}
                </div>
              )}
            </div>

            {/* Completed Tasks Collapsible Section */}
            {completedTasks.length > 0 && (
              <div className="pt-2 border-t border-white/10 space-y-2">
                <button
                  type="button"
                  onClick={() => setIsCompletedSectionOpen(!isCompletedSectionOpen)}
                  className="w-full flex items-center justify-between p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-gray-400 hover:text-white transition-all text-xs font-mono font-bold cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    {isCompletedSectionOpen ? (
                      <ChevronDown className="w-4 h-4 text-cyber-yellow" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-cyber-yellow" />
                    )}
                    <span>Выполненные задачи</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-cyber-yellow/15 text-cyber-yellow border border-cyber-yellow/30 font-mono">
                      {completedTasks.length}
                    </span>
                  </div>
                  <span className="text-[10px] text-gray-500 font-normal">
                    {isCompletedSectionOpen ? "Свернуть" : "Развернуть"}
                  </span>
                </button>

                <AnimatePresence>
                  {isCompletedSectionOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-2 overflow-hidden"
                    >
                      {completedTasks.map(renderTaskItem)}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="mt-4 pt-3 border-t border-white/10 flex justify-between items-center shrink-0">
            <span className="text-[10px] text-gray-500 font-mono">
              Синхронизировано между всеми пространствами
            </span>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl border border-white/10 hover:bg-white/5 text-gray-400 hover:text-white text-xs uppercase font-bold transition-all cursor-pointer"
            >
              Закрыть
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
