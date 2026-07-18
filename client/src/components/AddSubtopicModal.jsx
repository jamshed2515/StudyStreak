import { useState } from 'react';
import { FiX, FiPlus } from 'react-icons/fi';

const AddSubtopicModal = ({ category, onClose, onAdd }) => {
  const [subtopicName, setSubtopicName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!subtopicName.trim()) return;

    setLoading(true);
    await onAdd({
      name: subtopicName.trim(),
      category,
      description: description.trim()
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
              Subtopic Name
            </label>
            <input
              type="text"
              value={subtopicName}
              onChange={(e) => setSubtopicName(e.target.value)}
              className="input-field"
              placeholder="e.g., Arrays, Organic Chemistry, Calculus"
              required
              maxLength={50}
              autoFocus
            />
          </div>

          {/* Description */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-slate-300">
                Description (Optional)
              </label>
              <span className="text-xs text-slate-500">{description.length}/150</span>
            </div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input-field resize-none"
              placeholder="e.g., Learn basic array operations, sliding window and two pointers"
              rows={3}
              maxLength={150}
            />
          </div>

          <button
            type="submit"
            disabled={loading || !subtopicName.trim()}
            className="w-full btn-primary py-3 flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
            ) : (
              <>
                <FiPlus /> Create Subtopic
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddSubtopicModal;
