import { useState } from 'react';
import { format } from 'date-fns';
import { FiCheck, FiTrash2, FiClock, FiChevronDown, FiChevronRight, FiBook, FiPlus, FiEdit2, FiX } from 'react-icons/fi';
import AddSubtopicModal from './AddSubtopicModal';
import AddTaskModal from './AddTaskModal';

const categoryColors = {
  Physics: { bg: 'bg-blue-500', light: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500' },
  Chemistry: { bg: 'bg-green-500', light: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500' },
  Mathematics: { bg: 'bg-purple-500', light: 'bg-purple-500/20', text: 'text-purple-400', border: 'border-purple-500' },
  DSA: { bg: 'bg-orange-500', light: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-500' },
  Coding: { bg: 'bg-cyan-500', light: 'bg-cyan-500/20', text: 'text-cyan-400', border: 'border-cyan-500' },
  English: { bg: 'bg-pink-500', light: 'bg-pink-500/20', text: 'text-pink-400', border: 'border-pink-500' },
  Other: { bg: 'bg-slate-500', light: 'bg-slate-500/20', text: 'text-slate-400', border: 'border-slate-500' }
};

const categoryOrder = ['Physics', 'Chemistry', 'Mathematics', 'DSA', 'Coding', 'English', 'Other'];

const AllTasksList = ({ tasks, categories = [], onToggle, onDelete, onAddTask, onUpdateTask, onDeleteCategory, onDeleteMultiple }) => {
  const [expandedCategories, setExpandedCategories] = useState({});
  const [expandedSubtopics, setExpandedSubtopics] = useState({});
  
  // Modal states
  const [addSubtopicModal, setAddSubtopicModal] = useState({ open: false, category: '' });
  const [addTaskModal, setAddTaskModal] = useState({ open: false, category: '', subtopic: '' });
  
  // Edit states
  const [editingSubtopic, setEditingSubtopic] = useState({ key: '', newName: '' });
  
  // Confirm delete states
  const [confirmDelete, setConfirmDelete] = useState({ type: '', category: '', subtopic: '' });

  if (tasks.length === 0 && (!categories || categories.length === 0)) {
    return (
      <div className="text-center py-8 text-slate-400">
        <FiBook className="w-12 h-12 mx-auto mb-3 text-slate-600" />
        <p>No tasks found</p>
      </div>
    );
  }

  // Group tasks by category, then by subtopic (skip empty subtopics - show directly)
  const groupedData = tasks.reduce((acc, task) => {
    const category = task.category || 'Other';
    const subtopic = task.subtopic || '';
    
    if (!acc[category]) {
      acc[category] = { withSubtopic: {}, withoutSubtopic: [] };
    }
    
    if (subtopic) {
      if (!acc[category].withSubtopic[subtopic]) {
        acc[category].withSubtopic[subtopic] = [];
      }
      acc[category].withSubtopic[subtopic].push(task);
    } else {
      acc[category].withoutSubtopic.push(task);
    }
    return acc;
  }, {});

  const categoryNamesFromTasks = Object.keys(groupedData);
  const allCategoryNames = [...new Set([...(categories || []), ...categoryNamesFromTasks])];
  const sortedCategories = allCategoryNames.sort((a, b) => 
    categoryOrder.indexOf(a) - categoryOrder.indexOf(b)
  );

  const toggleCategory = (category) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const toggleSubtopic = (key) => {
    setExpandedSubtopics(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const getCategoryStats = (category) => {
    const data = groupedData[category] || { withSubtopic: {}, withoutSubtopic: [] };
    let total = data.withoutSubtopic.length;
    let completed = data.withoutSubtopic.filter(t => t.isCompleted).length;
    
    Object.values(data.withSubtopic).forEach(taskList => {
      total += taskList.length;
      completed += taskList.filter(t => t.isCompleted).length;
    });
    return { total, completed };
  };

  const getSubtopicStats = (taskList) => {
    const completed = taskList.filter(t => t.isCompleted).length;
    return { total: taskList.length, completed };
  };

  const handleAddSubtopic = async (taskData) => {
    await onAddTask(taskData);
    setAddSubtopicModal({ open: false, category: '' });
  };

  const handleAddTaskToSubtopic = async (taskData) => {
    await onAddTask(taskData);
    setAddTaskModal({ open: false, category: '', subtopic: '' });
  };

  const handleRenameSubtopic = async (category, oldName, newName) => {
    if (!newName.trim() || newName === oldName) {
      setEditingSubtopic({ key: '', newName: '' });
      return;
    }
    
    // Update all tasks with this subtopic
    const tasksToUpdate = groupedData[category].withSubtopic[oldName] || [];
    for (const task of tasksToUpdate) {
      await onUpdateTask(task._id, { subtopic: newName.trim() });
    }
    setEditingSubtopic({ key: '', newName: '' });
  };

  const handleDeleteCategory = async (category) => {
    if (onDeleteCategory) {
      await onDeleteCategory(category);
    } else {
      const data = groupedData[category] || { withSubtopic: {}, withoutSubtopic: [] };
      const allTasks = [
        ...data.withoutSubtopic,
        ...Object.values(data.withSubtopic).flat()
      ];
      for (const task of allTasks) {
        await onDelete(task._id);
      }
    }
    setConfirmDelete({ type: '', category: '', subtopic: '' });
  };

  const handleDeleteSubtopic = async (category, subtopic) => {
    const tasksToDelete = groupedData[category].withSubtopic[subtopic] || [];
    
    for (const task of tasksToDelete) {
      await onDelete(task._id);
    }
    setConfirmDelete({ type: '', category: '', subtopic: '' });
  };

  return (
    <>
      <div className="space-y-3">
        {sortedCategories.map((category) => {
          const colors = categoryColors[category] || categoryColors.Other;
          const isExpanded = expandedCategories[category];
          const stats = getCategoryStats(category);
          const data = groupedData[category] || { withSubtopic: {}, withoutSubtopic: [] };
          const subtopics = Object.keys(data.withSubtopic).sort();
          const hasDirectTasks = data.withoutSubtopic.length > 0;
          const allCompleted = stats.completed === stats.total;
          const isConfirmingCategoryDelete = confirmDelete.type === 'category' && confirmDelete.category === category;

          return (
            <div key={category} className={`rounded-xl border ${colors.border} overflow-hidden`}>
              {/* Category Header */}
              <div className={`flex items-center justify-between p-4 ${colors.light}`}>
                <button
                  onClick={() => toggleCategory(category)}
                  className="flex items-center gap-3 flex-1"
                >
                  {isExpanded ? (
                    <FiChevronDown className={`w-5 h-5 ${colors.text}`} />
                  ) : (
                    <FiChevronRight className={`w-5 h-5 ${colors.text}`} />
                  )}
                  <div className={`w-3 h-3 rounded-full ${colors.bg}`}></div>
                  <span className={`font-semibold ${colors.text} text-lg`}>{category}</span>
                  {subtopics.length > 0 && (
                    <span className="text-slate-400 text-sm">({subtopics.length} subtopic{subtopics.length > 1 ? 's' : ''})</span>
                  )}
                </button>
                
                <div className="flex items-center gap-2">
                  {/* Add Subtopic Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setAddSubtopicModal({ open: true, category });
                    }}
                    className="p-1.5 rounded-lg hover:bg-slate-600/50 transition-colors"
                    title="Add Subtopic"
                  >
                    <FiPlus className={`w-4 h-4 ${colors.text}`} />
                  </button>
                  
                  {/* Delete Category Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setConfirmDelete({ type: 'category', category, subtopic: '' });
                    }}
                    className="p-1.5 rounded-lg hover:bg-red-500/20 transition-colors"
                    title="Delete all tasks in this subject"
                  >
                    <FiTrash2 className="w-4 h-4 text-slate-400 hover:text-red-400" />
                  </button>
                  
                  {allCompleted && stats.total > 0 && (
                    <span className="px-2 py-1 bg-green-500/30 text-green-400 text-xs rounded-full flex items-center gap-1">
                      <FiCheck className="w-3 h-3" /> All Done
                    </span>
                  )}
                  <span className={`px-3 py-1 rounded-full text-sm ${
                    allCompleted ? 'bg-green-500/20 text-green-400' : 'bg-slate-700 text-slate-300'
                  }`}>
                    {stats.completed}/{stats.total}
                  </span>
                </div>
              </div>

              {/* Confirm Delete Category */}
              {isConfirmingCategoryDelete && (
                <div className="p-3 bg-red-500/10 border-t border-red-500/30">
                  <p className="text-red-400 text-sm mb-2">Delete all {stats.total} tasks in {category}?</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleDeleteCategory(category)}
                      className="px-3 py-1 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600"
                    >
                      Delete All
                    </button>
                    <button
                      onClick={() => setConfirmDelete({ type: '', category: '', subtopic: '' })}
                      className="px-3 py-1 bg-slate-600 text-white text-sm rounded-lg hover:bg-slate-500"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Content */}
              {isExpanded && (
                <div className="bg-slate-800/50">
                  {/* Direct tasks (no subtopic) */}
                  {hasDirectTasks && (
                    <div className="p-4 space-y-2 border-t border-slate-700">
                      {data.withoutSubtopic.map((task) => (
                        <TaskCard 
                          key={task._id} 
                          task={task} 
                          onToggle={onToggle} 
                          onDelete={onDelete} 
                        />
                      ))}
                    </div>
                  )}

                  {/* Subtopics */}
                  {subtopics.map((subtopic) => {
                    const subtopicKey = `${category}-${subtopic}`;
                    const isSubtopicExpanded = expandedSubtopics[subtopicKey];
                    const subtopicTasks = data.withSubtopic[subtopic];
                    const subtopicStats = getSubtopicStats(subtopicTasks);
                    const subtopicAllCompleted = subtopicStats.completed === subtopicStats.total;
                    const isEditing = editingSubtopic.key === subtopicKey;
                    const isConfirmingDelete = confirmDelete.type === 'subtopic' && 
                      confirmDelete.category === category && confirmDelete.subtopic === subtopic;

                    return (
                      <div key={subtopicKey} className="border-t border-slate-700">
                        {/* Subtopic Header */}
                        <div className="flex items-center justify-between p-3 pl-8 hover:bg-slate-700/50 transition-colors">
                          <button
                            onClick={() => toggleSubtopic(subtopicKey)}
                            className="flex items-center gap-3 flex-1"
                          >
                            {isSubtopicExpanded ? (
                              <FiChevronDown className="w-4 h-4 text-slate-400" />
                            ) : (
                              <FiChevronRight className="w-4 h-4 text-slate-400" />
                            )}
                            
                            {isEditing ? (
                              <input
                                type="text"
                                value={editingSubtopic.newName}
                                onChange={(e) => setEditingSubtopic({ ...editingSubtopic, newName: e.target.value })}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleRenameSubtopic(category, subtopic, editingSubtopic.newName);
                                  if (e.key === 'Escape') setEditingSubtopic({ key: '', newName: '' });
                                }}
                                onClick={(e) => e.stopPropagation()}
                                className="bg-slate-700 border border-primary-500 rounded px-2 py-1 text-white text-sm focus:outline-none"
                                autoFocus
                              />
                            ) : (
                              <span className="text-white font-medium">{subtopic}</span>
                            )}
                          </button>
                          
                          <div className="flex items-center gap-2">
                            {/* Edit Subtopic Name */}
                            {!isEditing ? (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingSubtopic({ key: subtopicKey, newName: subtopic });
                                }}
                                className="p-1 rounded hover:bg-slate-600 transition-colors"
                                title="Edit Name"
                              >
                                <FiEdit2 className="w-3.5 h-3.5 text-slate-400 hover:text-white" />
                              </button>
                            ) : (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRenameSubtopic(category, subtopic, editingSubtopic.newName);
                                }}
                                className="p-1 rounded hover:bg-green-600 bg-green-500/20 transition-colors"
                                title="Save"
                              >
                                <FiCheck className="w-3.5 h-3.5 text-green-400" />
                              </button>
                            )}
                            
                            {/* Add Task Button */}
                            <button
                              onClick={() => setAddTaskModal({ open: true, category, subtopic })}
                              className="p-1 rounded hover:bg-slate-600 transition-colors"
                              title="Add Task"
                            >
                              <FiPlus className="w-4 h-4 text-slate-400 hover:text-white" />
                            </button>
                            
                            {/* Delete Subtopic */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setConfirmDelete({ type: 'subtopic', category, subtopic });
                              }}
                              className="p-1 rounded hover:bg-red-500/20 transition-colors"
                              title="Delete Subtopic"
                            >
                              <FiTrash2 className="w-3.5 h-3.5 text-slate-400 hover:text-red-400" />
                            </button>
                            
                            {subtopicAllCompleted && subtopicStats.total > 0 ? (
                              <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full flex items-center gap-1">
                                <FiCheck className="w-3 h-3" /> Done
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs rounded-full">
                                {subtopicStats.total - subtopicStats.completed} pending
                              </span>
                            )}
                            <span className="text-slate-500 text-sm">
                              {subtopicStats.completed}/{subtopicStats.total}
                            </span>
                          </div>
                        </div>

                        {/* Confirm Delete Subtopic */}
                        {isConfirmingDelete && (
                          <div className="mx-8 mb-2 p-2 bg-red-500/10 border border-red-500/30 rounded-lg">
                            <p className="text-red-400 text-xs mb-2">Delete "{subtopic}" and all its tasks?</p>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleDeleteSubtopic(category, subtopic)}
                                className="px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
                              >
                                Delete
                              </button>
                              <button
                                onClick={() => setConfirmDelete({ type: '', category: '', subtopic: '' })}
                                className="px-2 py-1 bg-slate-600 text-white text-xs rounded hover:bg-slate-500"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Tasks */}
                        {isSubtopicExpanded && (
                          <div className="pl-12 pr-4 pb-3 space-y-2">
                            {subtopicTasks.map((task) => (
                              <TaskCard 
                                key={task._id} 
                                task={task} 
                                onToggle={onToggle} 
                                onDelete={onDelete}
                                showDate 
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add Subtopic Modal */}
      {addSubtopicModal.open && (
        <AddSubtopicModal
          category={addSubtopicModal.category}
          onClose={() => setAddSubtopicModal({ open: false, category: '' })}
          onAdd={handleAddSubtopic}
        />
      )}

      {/* Add Task to Subtopic Modal */}
      {addTaskModal.open && (
        <AddTaskModal
          defaultCategory={addTaskModal.category}
          defaultSubtopic={addTaskModal.subtopic}
          onClose={() => setAddTaskModal({ open: false, category: '', subtopic: '' })}
          onAdd={handleAddTaskToSubtopic}
        />
      )}
    </>
  );
};

// Task Card Component
const TaskCard = ({ task, onToggle, onDelete, showDate = false }) => (
  <div
    className={`flex items-center gap-3 p-3 rounded-lg bg-slate-700/50 ${
      task.isCompleted ? 'opacity-70' : ''
    }`}
  >
    <button
      onClick={() => onToggle(task._id)}
      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0 ${
        task.isCompleted
          ? 'bg-green-500 border-green-500'
          : 'border-slate-500 hover:border-primary-500'
      }`}
    >
      {task.isCompleted && <FiCheck className="w-3 h-3 text-white" />}
    </button>

    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2 flex-wrap">
        <span className={`text-sm ${task.isCompleted ? 'text-slate-400' : 'text-white'}`}>
          {task.title}
        </span>
        <span className={`px-1.5 py-0.5 rounded text-xs ${
          task.priority === 'High' ? 'bg-red-500/20 text-red-400' :
          task.priority === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' :
          'bg-green-500/20 text-green-400'
        }`}>
          {task.priority}
        </span>
      </div>
      <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
        <span className="flex items-center gap-1">
          <FiClock className="w-3 h-3" />
          {task.estimatedMinutes}m
        </span>
        {showDate && (
          <>
            <span>•</span>
            <span>{format(new Date(task.date), 'MMM d')}</span>
          </>
        )}
        {task.isCompleted && task.completedAt && (
          <>
            <span>•</span>
            <span className="text-green-500">
              Completed {format(new Date(task.completedAt), 'h:mm a')}
            </span>
          </>
        )}
      </div>
    </div>

    <button
      onClick={() => onDelete(task._id)}
      className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
    >
      <FiTrash2 className="w-4 h-4" />
    </button>
  </div>
);

export default AllTasksList;
