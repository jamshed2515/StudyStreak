import { useState } from 'react';
import { FiX, FiTarget } from 'react-icons/fi';

const CreateChallengeModal = ({ onClose, onCreate }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    targetDays: 30
  });
  const [loading, setLoading] = useState(false);

  const presetChallenges = [
    { days: 21, name: '21-Day Habit Builder' },
    { days: 30, name: '30-Day Challenge' },
    { days: 45, name: '45-Day Intensive' },
    { days: 60, name: '60-Day Marathon' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    await onCreate(formData);
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-2xl w-full max-w-md border border-slate-700">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-600/20 rounded-xl flex items-center justify-center">
              <FiTarget className="w-5 h-5 text-primary-400" />
            </div>
            <h2 className="text-xl font-semibold text-white">New Challenge</h2>
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
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Challenge Name
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="input-field"
              placeholder="e.g., JEE Final Sprint"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Description (optional)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input-field resize-none"
              placeholder="What do you want to achieve?"
              rows={2}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-3">
              Duration
            </label>
            <div className="grid grid-cols-2 gap-2">
              {presetChallenges.map((preset) => (
                <button
                  key={preset.days}
                  type="button"
                  onClick={() => setFormData({ 
                    ...formData, 
                    targetDays: preset.days,
                    title: formData.title || preset.name
                  })}
                  className={`p-3 rounded-lg border text-sm transition-colors ${
                    formData.targetDays === preset.days
                      ? 'border-primary-500 bg-primary-500/20 text-primary-400'
                      : 'border-slate-600 bg-slate-700/50 text-slate-300 hover:border-slate-500'
                  }`}
                >
                  {preset.days} Days
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Custom Days
            </label>
            <input
              type="number"
              value={formData.targetDays}
              onChange={(e) => setFormData({ ...formData, targetDays: parseInt(e.target.value) || 30 })}
              className="input-field"
              min={1}
              max={365}
            />
          </div>

          <button
            type="submit"
            disabled={loading || !formData.title}
            className="w-full btn-primary py-3 flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
            ) : (
              <>
                <FiTarget /> Start Challenge
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateChallengeModal;
