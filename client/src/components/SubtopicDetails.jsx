import { useState } from 'react';
import { FiArrowLeft, FiCheck, FiTrash2, FiPlus, FiClock } from 'react-icons/fi';

const SubtopicDetails = ({ subtopic, tasks, onBack, onAddTask, onToggleTask, onDeleteTask }) => {
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [estimatedMinutes, setEstimatedMinutes] = useState(60);
  const [showAddForm, setShowAddForm] = useState(false);

  // Filter tasks for this subtopic and category
  const subtopicTasks = tasks.filter(
    (t) => t.category === subtopic.category && t.subtopic === subtopic.name
  );

  const completedTasks = subtopicTasks.filter((t) => t.isCompleted).length;
  const totalTasks = subtopicTasks.length;
  const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    await onAddTask({
      title: newTaskTitle.trim(),
      category: subtopic.category,
      subtopic: subtopic.name,
      priority,
      estimatedMinutes
    });

    setNewTaskTitle('');
    setShowAddForm(false);
  };

  return (
    <div className="space-y-6">
      {/* Back Link */}
      <div>
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors group"
        >
          <FiArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="font-medium">Back to Dashboard</span>
        </button>
      </div>

      <div className="card">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 border-b border-slate-700/50 pb-6 mb-6">
          <div className="space-y-2">
            <span className="px-2.5 py-1 bg-primary-600/10 text-primary-400 text-xs font-semibold rounded-full uppercase tracking-wider">
              {subtopic.category}
            </span>
            <h1 className="text-3xl font-bold text-white mt-2">{subtopic.name}</h1>
            {subtopic.description ? (
              <p className="text-slate-400 text-sm max-w-xl leading-relaxed">{subtopic.description}</p>
            ) : (
              <p className="text-slate-500 text-sm italic leading-relaxed">No description provided.</p>
            )}
          </div>
          
          {/* Progress Card */}
          <div className="bg-slate-900/50 border border-slate-700/50 rounded-2xl p-4 min-w-[240px]">
            <div className="flex justify-between items-center text-sm mb-2">
              <span className="text-slate-400 font-medium">Subtopic Progress</span>
              <span className="text-primary-400 font-bold">{progressPercent}%</span>
            </div>
            <div className="h-2 bg-slate-700 rounded-full overflow-hidden mb-2">
              <div
                className="h-full bg-gradient-to-r from-primary-500 to-primary-400 rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
            <span className="text-xs text-slate-500">
              {completedTasks} of {totalTasks} tasks completed
            </span>
          </div>
        </div>

        {/* Tasks Section */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-white">Task Checklist</h2>
            {!showAddForm && (
              <button
                onClick={() => setShowAddForm(true)}
                className="btn-primary py-1.5 px-3 text-xs flex items-center gap-1"
              >
                <FiPlus className="w-4 h-4" /> Add Task
              </button>
            )}
          </div>

          {/* Quick Task Add Form */}
          {showAddForm && (
            <form onSubmit={handleSubmit} className="p-4 bg-slate-900/40 border border-slate-700/60 rounded-xl space-y-3">
              <input
                type="text"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="Enter task description (e.g., Learn Basic Operations, Solve 10 questions)..."
                className="input-field w-full"
                required
                autoFocus
              />
              <div className="flex justify-between items-center gap-4 flex-wrap">
                <div className="flex gap-4 items-center">
                  <div>
                    <span className="block text-xs text-slate-500 mb-1">Priority</span>
                    <div className="flex bg-slate-800 rounded-lg p-0.5 border border-slate-700">
                      {['Low', 'Medium', 'High'].map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setPriority(p)}
                          className={`px-2.5 py-1 rounded text-[10px] font-semibold transition-colors ${
                            priority === p ? 'bg-primary-600 text-white' : 'text-slate-400 hover:text-slate-300'
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <span className="block text-xs text-slate-500 mb-1">Estimated Time</span>
                    <select
                      value={estimatedMinutes}
                      onChange={(e) => setEstimatedMinutes(parseInt(e.target.value))}
                      className="bg-slate-800 border border-slate-700 rounded-lg text-xs px-2 py-1 text-slate-300 focus:outline-none focus:border-primary-500"
                    >
                      {[15, 30, 45, 60, 90, 120, 180].map((t) => (
                        <option key={t} value={t}>{t} mins</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="px-3 py-1.5 text-xs text-slate-400 hover:text-white rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1.5 text-xs bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
                  >
                    Create Task
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Checklist Items */}
          {subtopicTasks.length === 0 ? (
            <div className="text-center py-12 bg-slate-900/20 rounded-2xl border border-dashed border-slate-700/50">
              <p className="text-slate-500 text-sm">No tasks created yet for this subtopic.</p>
              <button
                onClick={() => setShowAddForm(true)}
                className="text-primary-400 hover:text-primary-300 text-sm font-medium mt-3 inline-flex items-center gap-1"
              >
                <FiPlus className="w-4 h-4" /> Add your first task
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {subtopicTasks.map((task) => (
                <div
                  key={task._id}
                  className={`flex items-center gap-3 p-3.5 rounded-xl bg-slate-900/20 hover:bg-slate-900/40 transition-all border border-slate-700/30 ${
                    task.isCompleted ? 'bg-slate-900/10 border-slate-700/10' : ''
                  }`}
                >
                  <button
                    onClick={() => onToggleTask(task._id)}
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0 ${
                      task.isCompleted
                        ? 'bg-green-500 border-green-500'
                        : 'border-slate-600 hover:border-primary-500'
                    }`}
                  >
                    {task.isCompleted && <FiCheck className="w-3 h-3 text-white" />}
                  </button>

                  <div className="flex-1 min-w-0">
                    <span
                      className={`text-sm ${
                        task.isCompleted ? 'line-through text-slate-500 font-normal' : 'text-slate-200 font-medium'
                      }`}
                    >
                      {task.title}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    {/* Priority Badge */}
                    <span
                      className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                        task.priority === 'High'
                          ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                          : task.priority === 'Medium'
                            ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                            : 'bg-green-500/10 text-green-400 border border-green-500/20'
                      }`}
                    >
                      {task.priority}
                    </span>

                    {/* Time Badge */}
                    <span className="text-slate-500 text-xs flex items-center gap-1">
                      <FiClock className="w-3 h-3" /> {task.estimatedMinutes}m
                    </span>

                    {/* Delete Task */}
                    <button
                      onClick={() => onDeleteTask(task._id)}
                      className="p-1 text-slate-500 hover:text-red-400 rounded transition-colors"
                      title="Delete task"
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubtopicDetails;
