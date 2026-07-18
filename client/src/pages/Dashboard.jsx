import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { format, differenceInDays, differenceInHours, differenceInMinutes } from 'date-fns';
import { 
  FiPlus, FiCheck, FiTrash2, FiCalendar, FiTarget, 
  FiTrendingUp, FiClock, FiZap, FiAward, FiChevronDown, FiList, FiFilter
} from 'react-icons/fi';
import AddSubtopicModal from '../components/AddSubtopicModal';
import SubtopicDetails from '../components/SubtopicDetails';
import MainTopicList from '../components/MainTopicList';
import ChallengeCard from '../components/ChallengeCard';
import CreateChallengeModal from '../components/CreateChallengeModal';
import AddTaskModal from '../components/AddTaskModal';
import CalendarView from '../components/CalendarView';

const Dashboard = () => {
  const { user } = useAuth();
  const [challenges, setChallenges] = useState([]);
  const [selectedChallenge, setSelectedChallenge] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreateChallenge, setShowCreateChallenge] = useState(false);
  const [showAddTask, setShowAddTask] = useState(false);
  const [showChallengeSelector, setShowChallengeSelector] = useState(false);
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [selectedSubtopic, setSelectedSubtopic] = useState(null);
  const [showAddSubtopic, setShowAddSubtopic] = useState({ open: false, category: '' });

  // Fetch data
  useEffect(() => {
    fetchData();
  }, []);

  // Fetch stats when selected challenge changes
  useEffect(() => {
    if (selectedChallenge) {
      fetchStats();
    }
  }, [selectedChallenge?._id]);

  // Countdown timer
  useEffect(() => {
    const examDate = new Date(user?.examDate || '2026-04-02');
    
    const updateCountdown = () => {
      const now = new Date();
      const diff = examDate - now;
      
      if (diff > 0) {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setCountdown({ days, hours, minutes, seconds });
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [user?.examDate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch all challenges
      const challengeRes = await api.get('/challenges');
      setChallenges(challengeRes.data);
      
      // Select first active challenge or first challenge
      const activeChallenge = challengeRes.data.find(c => c.isActive) || challengeRes.data[0];
      if (activeChallenge) {
        setSelectedChallenge(activeChallenge);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // fetchTasks removed since progress is driven by challenge subtopics/milestones

  const fetchStats = async () => {
    try {
      const statsRes = await api.get(`/challenges/${selectedChallenge._id}/stats`);
      setStats(statsRes.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const refreshSelectedChallenge = async () => {
    try {
      const response = await api.get(`/challenges/${selectedChallenge._id}`);
      setSelectedChallenge(response.data);
      // Also update in challenges list
      setChallenges(prev => prev.map(c => 
        c._id === response.data._id ? response.data : c
      ));
      if (selectedSubtopic) {
        const updatedSub = response.data.subtopics.find(s => s._id === selectedSubtopic._id);
        if (updatedSub) {
          setSelectedSubtopic(updatedSub);
        } else {
          setSelectedSubtopic(null);
        }
      }
    } catch (error) {
      console.error('Error refreshing challenge:', error);
    }
  };

  const handleCreateSubtopic = async (subtopicData) => {
    try {
      const response = await api.post(`/challenges/${selectedChallenge._id}/subtopics`, subtopicData);
      setSelectedChallenge(response.data);
      setChallenges(prev => prev.map(c => 
        c._id === response.data._id ? response.data : c
      ));
      setShowAddSubtopic({ open: false, category: '' });
      toast.success('Subtopic created!');
      
      // Auto-redirect to the new subtopic details page
      const newSub = response.data.subtopics.find(
        s => s.name === subtopicData.name && s.category === subtopicData.category
      );
      if (newSub) {
        setSelectedSubtopic(newSub);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create subtopic');
    }
  };

  const handleDeleteSubtopic = async (subtopicId) => {
    const originalChallenge = selectedChallenge;

    setSelectedChallenge((prevChallenge) => {
      if (!prevChallenge) return prevChallenge;
      const filtered = prevChallenge.subtopics.filter(s => s._id !== subtopicId);
      return { ...prevChallenge, subtopics: filtered };
    });

    if (selectedSubtopic && selectedSubtopic._id === subtopicId) {
      setSelectedSubtopic(null);
    }

    try {
      const response = await api.delete(`/challenges/${selectedChallenge._id}/subtopics/${subtopicId}`);
      setSelectedChallenge(response.data);
      setChallenges(prev => prev.map(c => 
        c._id === response.data._id ? response.data : c
      ));
      toast.success('Subtopic deleted');
    } catch (error) {
      setSelectedChallenge(originalChallenge);
      if (selectedSubtopic === null) {
        const found = originalChallenge.subtopics.find(s => s._id === subtopicId);
        if (found) setSelectedSubtopic(found);
      }
      toast.error('Failed to delete subtopic');
    }
  };

  const handleCreateChallenge = async (challengeData) => {
    try {
      const response = await api.post('/challenges', challengeData);
      setChallenges([response.data, ...challenges]);
      setSelectedChallenge(response.data);
      setShowCreateChallenge(false);
      toast.success('Challenge created!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create challenge');
    }
  };

  const handleAddMainTopic = async ({ category }) => {
    try {
      await api.post(`/challenges/${selectedChallenge._id}/categories`, { category });
      setShowAddTask(false);
      toast.success('Subject added! Add subtopics and track progress.');
      refreshSelectedChallenge();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add subject');
    }
  };

  const handleDeleteCategory = async (category) => {
    try {
      await api.delete(`/challenges/${selectedChallenge._id}/categories`, { data: { category } });
      toast.success('Subject and its subtopics removed');
      refreshSelectedChallenge();
    } catch (error) {
      toast.error('Failed to delete subject');
    }
  };

  const handleAddMilestone = async (subtopicId, text) => {
    const originalChallenge = selectedChallenge;
    const tempId = `temp-${Date.now()}`;
    const newMilestone = { _id: tempId, text, isCompleted: false };

    // Update local challenge
    setSelectedChallenge((prevChallenge) => {
      if (!prevChallenge) return prevChallenge;
      const updatedSubtopics = prevChallenge.subtopics.map((sub) => {
        if (sub._id === subtopicId) {
          return { ...sub, milestones: [...(sub.milestones || []), newMilestone] };
        }
        return sub;
      });
      return { ...prevChallenge, subtopics: updatedSubtopics };
    });

    // Update local selectedSubtopic
    if (selectedSubtopic && selectedSubtopic._id === subtopicId) {
      setSelectedSubtopic((prevSub) => {
        if (!prevSub) return prevSub;
        return { ...prevSub, milestones: [...(prevSub.milestones || []), newMilestone] };
      });
    }

    try {
      const response = await api.post(`/challenges/${selectedChallenge._id}/subtopics/${subtopicId}/milestones`, { text });
      setSelectedChallenge(response.data);
      setChallenges(prev => prev.map(c => 
        c._id === response.data._id ? response.data : c
      ));
      
      const updatedSub = response.data.subtopics.find(s => s._id === subtopicId);
      if (updatedSub) {
        setSelectedSubtopic(updatedSub);
      }
      fetchStats();
    } catch (error) {
      setSelectedChallenge(originalChallenge);
      if (selectedSubtopic && selectedSubtopic._id === subtopicId) {
        const found = originalChallenge.subtopics.find(s => s._id === subtopicId);
        if (found) setSelectedSubtopic(found);
      }
      toast.error('Failed to add milestone');
    }
  };

  const handleToggleMilestone = async (subtopicId, milestoneId, isCompleted) => {
    const originalChallenge = selectedChallenge;
    const originalSelectedSubtopic = selectedSubtopic;

    // Update local challenge
    setSelectedChallenge((prevChallenge) => {
      if (!prevChallenge) return prevChallenge;
      const updatedSubtopics = prevChallenge.subtopics.map((sub) => {
        if (sub._id === subtopicId) {
          const milestones = sub.milestones || [];
          const updatedMilestones = milestones.map((m) => {
            if (m._id === milestoneId) {
              return { ...m, isCompleted };
            }
            return m;
          });
          return { ...sub, milestones: updatedMilestones };
        }
        return sub;
      });
      return { ...prevChallenge, subtopics: updatedSubtopics };
    });

    // Update local selectedSubtopic
    if (selectedSubtopic && selectedSubtopic._id === subtopicId) {
      setSelectedSubtopic((prevSub) => {
        if (!prevSub) return prevSub;
        const milestones = prevSub.milestones || [];
        const updatedMilestones = milestones.map((m) => {
          if (m._id === milestoneId) {
            return { ...m, isCompleted };
          }
          return m;
        });
        return { ...prevSub, milestones: updatedMilestones };
      });
    }

    try {
      const response = await api.put(
        `/challenges/${selectedChallenge._id}/subtopics/${subtopicId}/milestones/${milestoneId}`,
        { isCompleted }
      );
      setSelectedChallenge(response.data);
      setChallenges(prev => prev.map(c => 
        c._id === response.data._id ? response.data : c
      ));
      fetchStats();
    } catch (error) {
      setSelectedChallenge(originalChallenge);
      setSelectedSubtopic(originalSelectedSubtopic);
      toast.error('Failed to update milestone');
    }
  };

  const handleEditMilestone = async (subtopicId, milestoneId, text) => {
    const originalChallenge = selectedChallenge;
    const originalSelectedSubtopic = selectedSubtopic;

    setSelectedChallenge((prevChallenge) => {
      if (!prevChallenge) return prevChallenge;
      const updatedSubtopics = prevChallenge.subtopics.map((sub) => {
        if (sub._id === subtopicId) {
          const milestones = sub.milestones || [];
          const updated = milestones.map(m => m._id === milestoneId ? { ...m, text } : m);
          return { ...sub, milestones: updated };
        }
        return sub;
      });
      return { ...prevChallenge, subtopics: updatedSubtopics };
    });

    if (selectedSubtopic && selectedSubtopic._id === subtopicId) {
      setSelectedSubtopic((prevSub) => {
        if (!prevSub) return prevSub;
        const milestones = prevSub.milestones || [];
        const updated = milestones.map(m => m._id === milestoneId ? { ...m, text } : m);
        return { ...prevSub, milestones: updated };
      });
    }

    try {
      const response = await api.put(
        `/challenges/${selectedChallenge._id}/subtopics/${subtopicId}/milestones/${milestoneId}`,
        { text }
      );
      setSelectedChallenge(response.data);
      setChallenges(prev => prev.map(c => 
        c._id === response.data._id ? response.data : c
      ));
    } catch (error) {
      setSelectedChallenge(originalChallenge);
      setSelectedSubtopic(originalSelectedSubtopic);
      toast.error('Failed to edit milestone');
    }
  };

  const handleDeleteMilestone = async (subtopicId, milestoneId) => {
    const originalChallenge = selectedChallenge;
    const originalSelectedSubtopic = selectedSubtopic;

    setSelectedChallenge((prevChallenge) => {
      if (!prevChallenge) return prevChallenge;
      const updatedSubtopics = prevChallenge.subtopics.map((sub) => {
        if (sub._id === subtopicId) {
          const milestones = sub.milestones || [];
          const filtered = milestones.filter(m => m._id !== milestoneId);
          return { ...sub, milestones: filtered };
        }
        return sub;
      });
      return { ...prevChallenge, subtopics: updatedSubtopics };
    });

    if (selectedSubtopic && selectedSubtopic._id === subtopicId) {
      setSelectedSubtopic((prevSub) => {
        if (!prevSub) return prevSub;
        const milestones = prevSub.milestones || [];
        const filtered = milestones.filter(m => m._id !== milestoneId);
        return { ...prevSub, milestones: filtered };
      });
    }

    try {
      const response = await api.delete(
        `/challenges/${selectedChallenge._id}/subtopics/${subtopicId}/milestones/${milestoneId}`
      );
      setSelectedChallenge(response.data);
      setChallenges(prev => prev.map(c => 
        c._id === response.data._id ? response.data : c
      ));
      fetchStats();
    } catch (error) {
      setSelectedChallenge(originalChallenge);
      setSelectedSubtopic(originalSelectedSubtopic);
      toast.error('Failed to delete milestone');
    }
  };

  const handleCompleteSubtopic = async (subtopicId, isCompleted) => {
    const originalChallenge = selectedChallenge;
    const originalSelectedSubtopic = selectedSubtopic;

    // Update local challenge optimistically
    setSelectedChallenge((prevChallenge) => {
      if (!prevChallenge) return prevChallenge;
      const updatedSubtopics = prevChallenge.subtopics.map((sub) => {
        if (sub._id === subtopicId) {
          const milestones = sub.milestones || [];
          const updatedMilestones = isCompleted ? milestones.map(m => ({ ...m, isCompleted: true })) : milestones;
          return { ...sub, isCompleted, milestones: updatedMilestones };
        }
        return sub;
      });
      return { ...prevChallenge, subtopics: updatedSubtopics };
    });

    // Update local selected subtopic optimistically
    if (selectedSubtopic && selectedSubtopic._id === subtopicId) {
      setSelectedSubtopic((prevSub) => {
        if (!prevSub) return prevSub;
        const milestones = prevSub.milestones || [];
        const updatedMilestones = isCompleted ? milestones.map(m => ({ ...m, isCompleted: true })) : milestones;
        return { ...prevSub, isCompleted, milestones: updatedMilestones };
      });
    }

    // Auto-redirect to the next incomplete subtopic in state immediately
    if (isCompleted) {
      const nextIncomplete = selectedChallenge.subtopics.find(s => s._id !== subtopicId && !s.isCompleted);
      if (nextIncomplete) {
        setSelectedSubtopic(nextIncomplete);
      } else {
        setSelectedSubtopic(null); // Return to dashboard
        toast.success('Congratulations! You completed all topics in this challenge! 🎉');
      }
    }

    try {
      const response = await api.put(
        `/challenges/${selectedChallenge._id}/subtopics/${subtopicId}/complete`,
        { isCompleted }
      );
      setSelectedChallenge(response.data);
      setChallenges(prev => prev.map(c => 
        c._id === response.data._id ? response.data : c
      ));
      fetchStats();
      toast.success(isCompleted ? 'Topic marked complete!' : 'Topic marked incomplete');
    } catch (error) {
      // Revert states
      setSelectedChallenge(originalChallenge);
      setSelectedSubtopic(originalSelectedSubtopic);
      toast.error('Failed to update topic status');
    }
  };

  const handleSelectChallenge = (challenge) => {
    setSelectedChallenge(challenge);
    setShowChallengeSelector(false);
  };

  const handleDeleteChallenge = async (challengeId) => {
    try {
      await api.delete(`/challenges/${challengeId}`);
      toast.success('Challenge deleted');
      
      // Remove from challenges list
      const updatedChallenges = challenges.filter(c => c._id !== challengeId);
      setChallenges(updatedChallenges);
      
      // Select another challenge or set to null
      if (updatedChallenges.length > 0) {
        setSelectedChallenge(updatedChallenges[0]);
      } else {
        setSelectedChallenge(null);
        setStats(null);
      }
    } catch (error) {
      toast.error('Failed to delete challenge');
    }
  };

  const handleUpdateChallenge = async (challengeId, updates) => {
    try {
      const response = await api.put(`/challenges/${challengeId}`, updates);
      setSelectedChallenge(response.data);
      setChallenges(prev => prev.map(c => 
        c._id === challengeId ? response.data : c
      ));
      toast.success('Challenge updated');
    } catch (error) {
      toast.error('Failed to update challenge');
    }
  };

  // (completedToday calculations removed)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Exam Countdown */}
      <div className="card bg-gradient-to-r from-primary-900/50 to-purple-900/50 border-primary-700/50">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-medium text-slate-300">Time until {user?.examType || 'JEE'} Exam</h2>
            <p className="text-sm text-slate-400">
              {format(new Date(user?.examDate || '2026-04-02'), 'MMMM d, yyyy')}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-4xl font-bold text-white">{countdown.days}</div>
              <div className="text-xs text-slate-400 uppercase">Days</div>
            </div>
            <div className="text-2xl text-slate-500">:</div>
            <div className="text-center">
              <div className="text-4xl font-bold text-white">{countdown.hours}</div>
              <div className="text-xs text-slate-400 uppercase">Hours</div>
            </div>
            <div className="text-2xl text-slate-500">:</div>
            <div className="text-center">
              <div className="text-4xl font-bold text-white">{countdown.minutes}</div>
              <div className="text-xs text-slate-400 uppercase">Mins</div>
            </div>
            <div className="text-2xl text-slate-500">:</div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary-400">{countdown.seconds}</div>
              <div className="text-xs text-slate-400 uppercase">Secs</div>
            </div>
          </div>
        </div>
      </div>

      {/* Challenge Selector */}
      {challenges.length > 0 && (
        <div className="relative">
          <button
            onClick={() => setShowChallengeSelector(!showChallengeSelector)}
            className="flex items-center gap-3 px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl hover:bg-slate-700 transition-colors w-full md:w-auto"
          >
            <FiTarget className="w-5 h-5 text-primary-400" />
            <span className="text-white font-medium">{selectedChallenge?.title || 'Select Challenge'}</span>
            <FiChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${showChallengeSelector ? 'rotate-180' : ''}`} />
            <span className="ml-auto text-sm text-slate-400">{challenges.length} challenge{challenges.length > 1 ? 's' : ''}</span>
          </button>
          
          {showChallengeSelector && (
            <div className="absolute top-full left-0 right-0 md:right-auto mt-2 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-20 overflow-hidden min-w-[300px]">
              {challenges.map((challenge) => (
                <button
                  key={challenge._id}
                  onClick={() => handleSelectChallenge(challenge)}
                  className={`w-full px-4 py-3 flex items-center gap-3 hover:bg-slate-700 transition-colors ${
                    selectedChallenge?._id === challenge._id ? 'bg-primary-600/20 border-l-2 border-primary-500' : ''
                  }`}
                >
                  <FiTarget className={`w-4 h-4 ${challenge.isActive ? 'text-green-400' : 'text-slate-400'}`} />
                  <div className="text-left flex-1">
                    <div className="text-white font-medium">{challenge.title}</div>
                    <div className="text-xs text-slate-400">{challenge.targetDays} days • {challenge.completedDays?.length || 0} completed</div>
                  </div>
                  {challenge.isActive && (
                    <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full">Active</span>
                  )}
                </button>
              ))}
              <button
                onClick={() => {
                  setShowChallengeSelector(false);
                  setShowCreateChallenge(true);
                }}
                className="w-full px-4 py-3 flex items-center gap-3 hover:bg-slate-700 transition-colors border-t border-slate-700 text-primary-400"
              >
                <FiPlus className="w-4 h-4" />
                <span>Create New Challenge</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Stats Cards */}
      {selectedChallenge && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="card">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
                <FiZap className="w-5 h-5 text-orange-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{selectedChallenge?.currentStreak || 0}</div>
                <div className="text-sm text-slate-400">Current Streak</div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                <FiTrendingUp className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{selectedChallenge?.longestStreak || 0}</div>
                <div className="text-sm text-slate-400">Best Streak</div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <FiCalendar className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{selectedChallenge?.completedDays?.length || 0}</div>
                <div className="text-sm text-slate-400">Days Completed</div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <FiAward className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{stats?.completionRate || 0}%</div>
                <div className="text-sm text-slate-400">Completion Rate</div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="md:col-span-2 space-y-6">
          {/* Selected Challenge or Create New */}
          {selectedChallenge ? (
            <ChallengeCard 
              challenge={selectedChallenge} 
              stats={stats} 
              onDelete={handleDeleteChallenge}
              onUpdate={handleUpdateChallenge}
            />
          ) : (
            <div className="card text-center py-12">
              <FiTarget className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No Active Challenge</h3>
              <p className="text-slate-400 mb-6">Start a new challenge to track your study progress</p>
              <button
                onClick={() => setShowCreateChallenge(true)}
                className="btn-primary inline-flex items-center gap-2"
              >
                <FiPlus /> Create Challenge
              </button>
            </div>
          )}

          {/* Main Content Sections: Subtopic Details OR Main Topic Grid */}
          {selectedChallenge && (
            selectedSubtopic ? (
              <SubtopicDetails
                subtopic={selectedSubtopic}
                onBack={() => setSelectedSubtopic(null)}
                onAddMilestone={handleAddMilestone}
                onToggleMilestone={handleToggleMilestone}
                onDeleteMilestone={handleDeleteMilestone}
                onEditMilestone={handleEditMilestone}
                onCompleteSubtopic={handleCompleteSubtopic}
              />
            ) : (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-white">Subjects & Subtopics</h2>
                  <button
                    onClick={() => setShowAddTask(true)}
                    className="btn-primary flex items-center gap-2"
                  >
                    <FiPlus /> Add Subject
                  </button>
                </div>
                
                <MainTopicList
                  categories={selectedChallenge?.categories || []}
                  subtopics={selectedChallenge?.subtopics || []}
                  onSelectSubtopic={(sub) => setSelectedSubtopic(sub)}
                  onOpenAddSubtopicModal={(category) => setShowAddSubtopic({ open: true, category })}
                  onDeleteSubtopic={handleDeleteSubtopic}
                  onDeleteCategory={handleDeleteCategory}
                />
              </div>
            )
          )}
        </div>

        {/* Sidebar - Calendar */}
        <div className="space-y-6">
          {selectedChallenge && (
            <CalendarView 
              completedDays={selectedChallenge.completedDays || []}
              startDate={selectedChallenge.startDate}
              endDate={selectedChallenge.endDate}
            />
          )}
        </div>
      </div>

      {/* Modals */}
      {showCreateChallenge && (
        <CreateChallengeModal
          onClose={() => setShowCreateChallenge(false)}
          onCreate={handleCreateChallenge}
        />
      )}

      {showAddTask && selectedChallenge && (
        <AddTaskModal
          onClose={() => setShowAddTask(false)}
          onAdd={handleAddTask}
          onAddMainTopic={handleAddMainTopic}
        />
      )}

      {showAddSubtopic.open && (
        <AddSubtopicModal
          category={showAddSubtopic.category}
          onClose={() => setShowAddSubtopic({ open: false, category: '' })}
          onAdd={handleCreateSubtopic}
        />
      )}
    </div>
  );
};

export default Dashboard;
