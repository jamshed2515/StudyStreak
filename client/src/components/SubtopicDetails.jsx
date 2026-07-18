import { useState } from 'react';
import { FiArrowLeft, FiCheck, FiTrash2, FiPlus, FiEdit2, FiX } from 'react-icons/fi';

const SubtopicDetails = ({
  subtopic,
  onBack,
  onAddMilestone,
  onToggleMilestone,
  onDeleteMilestone,
  onEditMilestone,
  onCompleteSubtopic,
  onResetMilestones
}) => {
  const [newMilestoneText, setNewMilestoneText] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingText, setEditingText] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  const milestones = subtopic.milestones || [];
  const completedCount = milestones.filter(m => m.isCompleted).length;
  const totalCount = milestones.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const isAllMilestonesCompleted = totalCount > 0 && completedCount === totalCount;

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!newMilestoneText.trim()) return;

    await onAddMilestone(subtopic._id, newMilestoneText.trim());
    setNewMilestoneText('');
    setShowAddForm(false);
  };

  const handleStartEdit = (milestone) => {
    setEditingId(milestone._id);
    setEditingText(milestone.text);
  };

  const handleSaveEdit = async (milestoneId) => {
    if (!editingText.trim()) return;
    await onEditMilestone(subtopic._id, milestoneId, editingText.trim());
    setEditingId(null);
  };

  const handleKeyPress = (e, milestoneId) => {
    if (e.key === 'Enter') {
      handleSaveEdit(milestoneId);
    } else if (e.key === 'Escape') {
      setEditingId(null);
    }
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
            <div className="flex items-center gap-2.5">
              <span className="px-2.5 py-1 bg-primary-600/10 text-primary-400 text-xs font-semibold rounded-full uppercase tracking-wider">
                {subtopic.category}
              </span>
              {subtopic.isCompleted && (
                <span className="px-2.5 py-1 bg-green-500/10 text-green-400 text-xs font-semibold rounded-full flex items-center gap-1">
                  <FiCheck className="w-3 h-3" /> Completed
                </span>
              )}
            </div>
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
              <span className="text-slate-400 font-medium">Roadmap Progress</span>
              <span className="text-primary-400 font-bold">{progressPercent}%</span>
            </div>
            <div className="h-2 bg-slate-700 rounded-full overflow-hidden mb-2">
              <div
                className="h-full bg-gradient-to-r from-primary-500 to-primary-400 rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
            <span className="text-xs text-slate-500">
              {completedCount} of {totalCount} milestones completed
            </span>
          </div>
        </div>

        {/* Milestones Checklist Section */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-white">Learning Milestones</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (window.confirm('Do you want to reset this subtopic to the default milestone roadmap? This will overwrite existing milestones.')) {
                    onResetMilestones(subtopic._id);
                  }
                }}
                className="px-3 py-1.5 bg-slate-700/50 hover:bg-slate-700 text-slate-300 rounded-xl text-xs transition-colors font-semibold border border-slate-650"
              >
                Load Template
              </button>
              {!showAddForm && (
                <button
                  onClick={() => setShowAddForm(true)}
                  className="btn-primary py-1.5 px-3 text-xs flex items-center gap-1"
                >
                  <FiPlus className="w-4 h-4" /> Add Milestone
                </button>
              )}
            </div>
          </div>

          {/* Quick Milestone Add Form */}
          {showAddForm && (
            <form onSubmit={handleAddSubmit} className="p-4 bg-slate-900/40 border border-slate-700/60 rounded-xl flex gap-3 items-center">
              <input
                type="text"
                value={newMilestoneText}
                onChange={(e) => setNewMilestoneText(e.target.value)}
                placeholder="Enter milestone description (e.g., Two Pointers practice)..."
                className="input-field flex-1"
                required
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-3 py-2 text-xs text-slate-400 hover:text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3 py-2 text-xs bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
              >
                Add
              </button>
            </form>
          )}

          {/* Checklist Items */}
          {milestones.length === 0 ? (
            <div className="text-center py-12 bg-slate-900/20 rounded-2xl border border-dashed border-slate-700/50 space-y-4">
              <p className="text-slate-500 text-sm font-medium">No milestones created yet. Add standard roadmap steps!</p>
              <div className="flex justify-center gap-4">
                <button
                  onClick={() => setShowAddForm(true)}
                  className="text-primary-400 hover:text-primary-300 text-sm font-medium inline-flex items-center gap-1"
                >
                  <FiPlus className="w-4 h-4" /> Add Custom
                </button>
                <span className="text-slate-700">|</span>
                <button
                  type="button"
                  onClick={() => onResetMilestones(subtopic._id)}
                  className="text-green-400 hover:text-green-300 text-sm font-medium"
                >
                  Load Default Template
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {milestones.map((milestone) => {
                const isEditing = editingId === milestone._id;

                return (
                  <div
                    key={milestone._id}
                    className={`flex items-center gap-3 p-3.5 rounded-xl bg-slate-900/20 hover:bg-slate-900/40 transition-all border border-slate-700/30 group ${
                      milestone.isCompleted ? 'bg-slate-900/10 border-slate-700/10' : ''
                    }`}
                  >
                    {/* Toggle Checkbox */}
                    <button
                      onClick={() => onToggleMilestone(subtopic._id, milestone._id, !milestone.isCompleted)}
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0 ${
                        milestone.isCompleted
                          ? 'bg-green-500 border-green-500'
                          : 'border-slate-600 hover:border-primary-500'
                      }`}
                    >
                      {milestone.isCompleted && <FiCheck className="w-3 h-3 text-white" />}
                    </button>

                    {/* Milestone Text (Input or Span) */}
                    <div className="flex-1 min-w-0">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editingText}
                          onChange={(e) => setEditingText(e.target.value)}
                          onKeyDown={(e) => handleKeyPress(e, milestone._id)}
                          onBlur={() => handleSaveEdit(milestone._id)}
                          className="bg-slate-800 text-slate-200 text-sm font-medium px-2 py-1 rounded w-full border border-primary-500 focus:outline-none"
                          autoFocus
                        />
                      ) : (
                        <span
                          className={`text-sm ${
                            milestone.isCompleted ? 'line-through text-slate-500 font-normal' : 'text-slate-200 font-medium'
                          }`}
                        >
                          {milestone.text}
                        </span>
                      )}
                    </div>

                    {/* Inline Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      {!isEditing ? (
                        <>
                          <button
                            onClick={() => handleStartEdit(milestone)}
                            className="p-1 text-slate-500 hover:text-white rounded transition-colors"
                            title="Edit milestone"
                          >
                            <FiEdit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDeleteMilestone(subtopic._id, milestone._id)}
                            className="p-1 text-slate-500 hover:text-red-400 rounded transition-colors"
                            title="Delete milestone"
                          >
                            <FiTrash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => handleSaveEdit(milestone._id)}
                            className="p-1 text-green-400 hover:text-green-300 rounded transition-colors font-medium text-xs"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="p-1 text-slate-500 hover:text-white rounded transition-colors"
                          >
                            <FiX className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Mark Topic Complete Section */}
        <div className="mt-8 pt-6 border-t border-slate-700/50 flex justify-end">
          {subtopic.isCompleted ? (
            <button
              onClick={() => onCompleteSubtopic(subtopic._id, false)}
              className="px-6 py-3 bg-red-600/20 text-red-400 hover:bg-red-600/30 hover:text-red-300 rounded-xl transition-all font-semibold flex items-center gap-2 border border-red-500/20"
            >
              Mark Incomplete
            </button>
          ) : (
            <button
              onClick={() => onCompleteSubtopic(subtopic._id, true)}
              disabled={!isAllMilestonesCompleted}
              className={`px-6 py-3 rounded-xl transition-all font-semibold flex items-center gap-2 ${
                isAllMilestonesCompleted
                  ? 'bg-green-600 text-white hover:bg-green-700 shadow-lg shadow-green-600/20'
                  : 'bg-slate-700 text-slate-400 cursor-not-allowed border border-slate-650'
              }`}
            >
              <FiCheck className="w-4 h-4" /> Mark Topic Complete
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubtopicDetails;
