import { FiPlus, FiTrash2, FiFolder, FiCheck, FiBookOpen } from 'react-icons/fi';

const categoryColors = {
  Physics: { bg: 'bg-blue-500', light: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30' },
  Chemistry: { bg: 'bg-green-500', light: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/30' },
  Mathematics: { bg: 'bg-purple-500', light: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/30' },
  DSA: { bg: 'bg-orange-500', light: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/30' },
  Coding: { bg: 'bg-cyan-500', light: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/30' },
  English: { bg: 'bg-pink-500', light: 'bg-pink-500/10', text: 'text-pink-400', border: 'border-pink-500/30' },
  Other: { bg: 'bg-slate-500', light: 'bg-slate-500/10', text: 'text-slate-400', border: 'border-slate-500/30' }
};

const categoryOrder = ['Physics', 'Chemistry', 'Mathematics', 'DSA', 'Coding', 'English', 'Other'];

const MainTopicList = ({
  categories = [],
  subtopics = [],
  tasks = [],
  onSelectSubtopic,
  onOpenAddSubtopicModal,
  onDeleteSubtopic,
  onDeleteCategory
}) => {
  // Sort categories
  const sortedCategories = [...categories].sort((a, b) => {
    let indexA = categoryOrder.indexOf(a);
    let indexB = categoryOrder.indexOf(b);
    if (indexA === -1) indexA = 999;
    if (indexB === -1) indexB = 999;
    return indexA - indexB;
  });

  const getSubtopicProgress = (subtopic) => {
    const milestones = subtopic.milestones || [];
    const completed = milestones.filter(m => m.isCompleted).length;
    const total = milestones.length;
    return {
      percent: total > 0 ? Math.round((completed / total) * 100) : 0,
      completed,
      total
    };
  };

  if (categories.length === 0) {
    return (
      <div className="text-center py-12 bg-slate-800/30 border border-dashed border-slate-700 rounded-2xl">
        <FiBookOpen className="w-12 h-12 mx-auto mb-4 text-slate-500" />
        <h3 className="text-lg font-semibold text-white mb-1">No subjects added yet</h3>
        <p className="text-slate-400 text-sm mb-4">Add a main topic (subject) to your challenge to start tracking subtopics and tasks</p>
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {sortedCategories.map((category) => {
        const colors = categoryColors[category] || categoryColors.Other;
        const categorySubtopics = subtopics.filter((s) => s.category === category);

        return (
          <div key={category} className={`card border-l-4 ${colors.border} flex flex-col justify-between`}>
            <div>
              {/* Category Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-700/50 mb-4">
                <div className="flex items-center gap-2.5">
                  <div className={`w-3.5 h-3.5 rounded-full ${colors.bg}`} />
                  <h3 className="text-xl font-bold text-white">{category}</h3>
                </div>
                <button
                  onClick={() => {
                    if (window.confirm(`Are you sure you want to delete "${category}" and all of its subtopics/tasks?`)) {
                      onDeleteCategory(category);
                    }
                  }}
                  className="p-1 text-slate-500 hover:text-red-455 hover:text-red-400 rounded transition-colors"
                  title={`Delete all ${category}`}
                >
                  <FiTrash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Subtopics list */}
              {categorySubtopics.length === 0 ? (
                <div className="text-center py-6 text-slate-500 text-sm italic">
                  No subtopics yet. Click below to add one!
                </div>
              ) : (
                <div className="space-y-2 mb-4">
                  {categorySubtopics.map((subtopic) => {
                    const progress = getSubtopicProgress(subtopic);
                    return (
                      <div
                        key={subtopic._id}
                        className={`flex items-center justify-between p-3 rounded-xl bg-slate-900/30 border border-slate-700/30 hover:border-slate-650 hover:bg-slate-900/50 transition-all cursor-pointer group ${
                          subtopic.isCompleted ? 'bg-green-950/10 border-green-500/20 hover:bg-green-950/20' : ''
                        }`}
                        onClick={() => onSelectSubtopic(subtopic)}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {subtopic.isCompleted ? (
                            <FiCheck className="w-4 h-4 text-green-400 flex-shrink-0 bg-green-500/10 border border-green-500/30 rounded-full p-0.5" />
                          ) : (
                            <FiFolder className={`w-4 h-4 ${colors.text} flex-shrink-0`} />
                          )}
                          <div className="min-w-0">
                            <span className={`text-sm font-medium group-hover:text-white transition-colors block truncate ${
                              subtopic.isCompleted ? 'text-green-300 line-through' : 'text-slate-200'
                            }`}>
                              {subtopic.name}
                            </span>
                            {subtopic.description && (
                              <span className="text-[11px] text-slate-500 block truncate max-w-[200px]">
                                {subtopic.description}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-3 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                          {/* Progress Badge */}
                          <div className="flex items-center gap-1.5">
                            {subtopic.isCompleted ? (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-500/25 text-green-300 border border-green-500/20">
                                Completed
                              </span>
                            ) : (
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                progress.total === 0 
                                  ? 'bg-slate-800 text-slate-500'
                                  : progress.percent === 100
                                    ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                                    : 'bg-primary-500/10 text-primary-400 border border-primary-500/20'
                              }`}>
                                {progress.total === 0 ? '0 milestones' : `${progress.percent}%`}
                              </span>
                            )}
                          </div>

                          {/* Delete Subtopic Icon */}
                          <button
                            onClick={() => {
                              if (window.confirm(`Are you sure you want to delete "${subtopic.name}" and all of its tasks?`)) {
                                onDeleteSubtopic(subtopic._id);
                              }
                            }}
                            className="p-1 text-slate-500 hover:text-red-400 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Delete subtopic"
                          >
                            <FiTrash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Add Subtopic Button */}
            <button
              onClick={() => onOpenAddSubtopicModal(category)}
              className={`w-full py-2 border border-dashed ${colors.border} rounded-xl text-slate-400 hover:text-white hover:bg-slate-700/20 transition-all flex items-center justify-center gap-2 text-sm font-medium`}
            >
              <FiPlus className="w-4 h-4" /> Add Subtopic
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default MainTopicList;
