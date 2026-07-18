import { useState } from 'react';
import { FiX, FiPlus } from 'react-icons/fi';

const AddTaskModal = ({ onClose, onAdd, onAddMainTopic, defaultCategory = '', defaultSubtopic = '' }) => {
  const [formData, setFormData] = useState({
    title: '',
    category: defaultCategory || 'Physics',
    subtopic: defaultSubtopic,
    priority: 'Medium',
    estimatedMinutes: 60
  });
  const [loading, setLoading] = useState(false);
  const [customCategory, setCustomCategory] = useState('');

  const categories = ['Physics', 'Chemistry', 'Mathematics', 'DSA', 'Coding', 'English', 'Other'];
  const priorities = ['Low', 'Medium', 'High'];
  const timePresets = [15, 30, 45, 60, 90, 120];

  // Main topic creation = no subtopic selected (only Subject + Priority)
  const isMainTopicCreation = !defaultSubtopic;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const finalCategory = (formData.category === 'Other' && customCategory.trim())
      ? customCategory.trim()
      : formData.category;

    // Main topic: only add subject to challenge (no task created)
    if (isMainTopicCreation && onAddMainTopic) {
      await onAddMainTopic({ category: finalCategory });
      setLoading(false);
      return;
    }

    const payload = {
      ...formData,
      category: finalCategory,
      date: new Date()
    };

    // Main topic (fallback): use subject name as title, default 60 min
    if (isMainTopicCreation) {
      payload.title = finalCategory;
      payload.estimatedMinutes = 60;
    }

    await onAdd(payload);
    setLoading(false);
  };

  const isAddingToSubtopic = !!defaultSubtopic;
  const canSubmit = isAddingToSubtopic
    ? formData.title
    : (formData.category === 'Other' ? customCategory.trim() : formData.category);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-2xl w-full max-w-md border border-slate-700">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div>
            <h2 className="text-xl font-semibold text-white">
              {isMainTopicCreation ? 'Add Main Topic' : 'Add New Task'}
            </h2>
            {isAddingToSubtopic && (
              <p className="text-sm text-slate-400 mt-1">
                Adding to {defaultCategory} → {defaultSubtopic}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <FiX className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Task Title - only when adding to a subtopic */}
          {!isMainTopicCreation && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Task Title
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="input-field"
                placeholder="e.g., Complete Chapter 5"
                required
                autoFocus
              />
            </div>
          )}

          {/* Subject - only for main topic creation */}
          {isMainTopicCreation && (
            <div className="space-y-3">
              <label className="block text-sm font-medium text-slate-300">
                Subject
              </label>
              <div className="grid grid-cols-4 gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => {
                      setFormData({ ...formData, category: cat });
                      if (cat !== 'Other') {
                        setCustomCategory('');
                      }
                    }}
                    className={`p-2 rounded-lg text-xs font-medium transition-colors ${
                      formData.category === cat
                        ? 'bg-primary-500 text-white'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {formData.category === 'Other' && (
                <div className="animate-fadeIn">
                  <label className="block text-xs font-medium text-slate-400 mb-2">
                    Enter Custom Subject Name
                  </label>
                  <input
                    type="text"
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    className="input-field"
                    placeholder="e.g., Biology, History, Economics"
                    required
                    autoFocus
                  />
                </div>
              )}
            </div>
          )}

          {/* Subject - when adding to subtopic (read-only display) */}
          {isAddingToSubtopic && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Subject</label>
              <p className="text-slate-300">{defaultCategory}</p>
            </div>
          )}

          {/* Priority */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Priority
            </label>
            <div className="grid grid-cols-3 gap-2">
              {priorities.map((priority) => (
                <button
                  key={priority}
                  type="button"
                  onClick={() => setFormData({ ...formData, priority })}
                  className={`p-2 rounded-lg text-sm font-medium transition-colors ${
                    formData.priority === priority
                      ? priority === 'High'
                        ? 'bg-red-500 text-white'
                        : priority === 'Medium'
                          ? 'bg-yellow-500 text-white'
                          : 'bg-green-500 text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  {priority}
                </button>
              ))}
            </div>
          </div>

          {/* Estimated Time - only when adding to a subtopic */}
          {!isMainTopicCreation && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Estimated Time
              </label>
              <div className="grid grid-cols-6 gap-2">
                {timePresets.map((time) => (
                  <button
                    key={time}
                    type="button"
                    onClick={() => setFormData({ ...formData, estimatedMinutes: time })}
                    className={`p-2 rounded-lg text-xs font-medium transition-colors ${
                      formData.estimatedMinutes === time
                        ? 'bg-primary-500 text-white'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    {time}m
                  </button>
                ))}
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !canSubmit}
            className="w-full btn-primary py-3 flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
            ) : (
              <>
                <FiPlus /> {isMainTopicCreation ? 'Add Main Topic' : 'Add Task'}
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddTaskModal;
