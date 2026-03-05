import { useState } from 'react';
import { format, differenceInDays } from 'date-fns';
import { FiTarget, FiCalendar, FiTrendingUp, FiTrash2, FiAlertTriangle, FiEdit2, FiCheck, FiX } from 'react-icons/fi';

const ChallengeCard = ({ challenge, stats, onDelete, onUpdate }) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState(challenge.title);
  const [editDescription, setEditDescription] = useState(challenge.description || '');

  const startDate = new Date(challenge.startDate);
  const endDate = new Date(challenge.endDate);
  const today = new Date();
  
  const totalDays = differenceInDays(endDate, startDate);
  const daysPassed = Math.max(0, differenceInDays(today, startDate));
  const daysRemaining = Math.max(0, differenceInDays(endDate, today));
  const progress = Math.min(100, Math.round((daysPassed / totalDays) * 100));

  const handleDelete = async () => {
    setDeleting(true);
    await onDelete(challenge._id);
    setDeleting(false);
  };

  const handleSaveName = async () => {
    if (editName.trim() && onUpdate) {
      await onUpdate(challenge._id, { 
        title: editName.trim(),
        description: editDescription.trim()
      });
    }
    setIsEditingName(false);
  };

  const handleCancelEdit = () => {
    setEditName(challenge.title);
    setEditDescription(challenge.description || '');
    setIsEditingName(false);
  };

  return (
    <div className="card">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3 flex-1">
          <div className="w-12 h-12 bg-primary-600/20 rounded-xl flex items-center justify-center flex-shrink-0">
            <FiTarget className="w-6 h-6 text-primary-400" />
          </div>
          
          {isEditingName ? (
            <div className="flex-1 space-y-2">
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full bg-slate-700 border border-primary-500 rounded-lg px-3 py-2 text-white focus:outline-none"
                placeholder="Challenge name"
                autoFocus
              />
              <input
                type="text"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-slate-300 focus:outline-none focus:border-primary-500"
                placeholder="Description (optional)"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleSaveName}
                  className="px-3 py-1 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600 flex items-center gap-1"
                >
                  <FiCheck className="w-4 h-4" /> Save
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="px-3 py-1 bg-slate-600 text-white text-sm rounded-lg hover:bg-slate-500 flex items-center gap-1"
                >
                  <FiX className="w-4 h-4" /> Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-semibold text-white">{challenge.title}</h3>
                <button
                  onClick={() => setIsEditingName(true)}
                  className="p-1 rounded hover:bg-slate-700 transition-colors"
                  title="Edit Name"
                >
                  <FiEdit2 className="w-4 h-4 text-slate-400 hover:text-white" />
                </button>
              </div>
              <p className="text-sm text-slate-400">{challenge.description || `${challenge.targetDays}-day challenge`}</p>
            </div>
          )}
        </div>
        
        {!isEditingName && (
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-green-500/20 text-green-400 text-sm rounded-full">
              Active
            </span>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
              title="Delete Challenge"
            >
              <FiTrash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
          <div className="flex items-start gap-3">
            <FiAlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-red-400 font-medium">Delete this challenge?</p>
              <p className="text-sm text-slate-400 mt-1">
                This will permanently delete the challenge and all its tasks. This action cannot be undone.
              </p>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm rounded-lg transition-colors flex items-center gap-2"
                >
                  {deleting ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <FiTrash2 className="w-4 h-4" /> Delete
                    </>
                  )}
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-slate-400">Challenge Progress</span>
          <span className="text-primary-400 font-medium">{progress}%</span>
        </div>
        <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-primary-600 to-primary-400 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Challenge Info */}
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center p-3 bg-slate-700/50 rounded-lg">
          <div className="text-2xl font-bold text-white">{daysPassed}</div>
          <div className="text-xs text-slate-400">Days In</div>
        </div>
        <div className="text-center p-3 bg-slate-700/50 rounded-lg">
          <div className="text-2xl font-bold text-white">{daysRemaining}</div>
          <div className="text-xs text-slate-400">Days Left</div>
        </div>
        <div className="text-center p-3 bg-slate-700/50 rounded-lg">
          <div className="text-2xl font-bold text-white">{challenge.targetDays}</div>
          <div className="text-xs text-slate-400">Total Days</div>
        </div>
      </div>

      {/* Dates */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-700 text-sm text-slate-400">
        <div className="flex items-center gap-2">
          <FiCalendar className="w-4 h-4" />
          <span>Started: {format(startDate, 'MMM d, yyyy')}</span>
        </div>
        <div className="flex items-center gap-2">
          <FiTrendingUp className="w-4 h-4" />
          <span>Ends: {format(endDate, 'MMM d, yyyy')}</span>
        </div>
      </div>
    </div>
  );
};

export default ChallengeCard;
