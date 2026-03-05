import { useState } from 'react';
import { FiX, FiPlus } from 'react-icons/fi';

const AddSubtopicModal = ({ category, onClose, onAdd }) => {
  const [subtopicName, setSubtopicName] = useState('');
  const [taskTitle, setTaskTitle] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [estimatedMinutes, setEstimatedMinutes] = useState(60);
  const [loading, setLoading] = useState(false);

  const priorities = ['Low', 'Medium', 'High'];
  const timePresets = [15, 30, 45, 60, 90, 120];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    await onAdd({
      title: taskTitle,
      category,
      subtopic: subtopicName,
      priority,
      estimatedMinutes,
      date: new Date()
    });
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-2xl w-full max-w-md border border-slate-700">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div>
            <h2 className="text-xl font-semibold text-white">Add Subtopic</h2>
            <p className="text-sm text-slate-400 mt-1">
              Adding to <span className="text-primary-400 font-medium">{category}</span>
            </p>
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
          {/* Subtopic Name */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Subtopic / Chapter Name
            </label>
            <input
              type="text"
              value={subtopicName}
              onChange={(e) => setSubtopicName(e.target.value)}
              className="input-field"
              placeholder="e.g., Mechanics, Organic Chemistry, Calculus"
              required
              autoFocus
            />
          </div>

          {/* First Task */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              First Task Title
            </label>
            <input
              type="text"
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              className="input-field"
              placeholder="e.g., Complete Chapter 1"
              required
            />
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Priority
            </label>
            <div className="grid grid-cols-3 gap-2">
              {priorities.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={`p-2 rounded-lg text-sm font-medium transition-colors ${
                    priority === p
                      ? p === 'High' 
                        ? 'bg-red-500 text-white' 
                        : p === 'Medium' 
                          ? 'bg-yellow-500 text-white' 
                          : 'bg-green-500 text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Time */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Estimated Time
            </label>
            <div className="grid grid-cols-6 gap-2">
              {timePresets.map((time) => (
                <button
                  key={time}
                  type="button"
                  onClick={() => setEstimatedMinutes(time)}
                  className={`p-2 rounded-lg text-xs font-medium transition-colors ${
                    estimatedMinutes === time
                      ? 'bg-primary-500 text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  {time}m
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !subtopicName || !taskTitle}
            className="w-full btn-primary py-3 flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
            ) : (
              <>
                <FiPlus /> Add Subtopic & Task
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddSubtopicModal;
