import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { format, differenceInDays, differenceInHours, differenceInMinutes } from 'date-fns';
import { 
  FiPlus, FiCheck, FiTrash2, FiCalendar, FiTarget, 
  FiTrendingUp, FiClock, FiZap, FiAward, FiChevronDown, FiList, FiFilter
} from 'react-icons/fi';
import TaskList from '../components/TaskList';
import AllTasksList from '../components/AllTasksList';
import ChallengeCard from '../components/ChallengeCard';
import CreateChallengeModal from '../components/CreateChallengeModal';
import AddTaskModal from '../components/AddTaskModal';
import CalendarView from '../components/CalendarView';

const Dashboard = () => {
  const { user } = useAuth();
  const [challenges, setChallenges] = useState([]);
  const [selectedChallenge, setSelectedChallenge] = useState(null);
  const [todaysTasks, setTodaysTasks] = useState([]);
  const [allTasks, setAllTasks] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreateChallenge, setShowCreateChallenge] = useState(false);
  const [showAddTask, setShowAddTask] = useState(false);
  const [showChallengeSelector, setShowChallengeSelector] = useState(false);
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [taskView, setTaskView] = useState('today'); // 'today' or 'all'
  const [taskFilter, setTaskFilter] = useState('all'); // 'all', 'completed', 'pending'

  // Fetch data
  useEffect(() => {
    fetchData();
  }, []);

  // Fetch tasks when selected challenge changes
  useEffect(() => {
    if (selectedChallenge) {
      fetchTasks();
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

  const fetchTasks = async () => {
    try {
      const tasksRes = await api.get(`/tasks?challengeId=${selectedChallenge._id}`);
      
      // Store all tasks
      setAllTasks(tasksRes.data);
      
      // Filter for today's tasks
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);
      
      const todayTasks = tasksRes.data.filter(task => {
        const taskDate = new Date(task.date);
        return taskDate >= today && taskDate <= todayEnd;
      });
      setTodaysTasks(todayTasks);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

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
    } catch (error) {
      console.error('Error refreshing challenge:', error);
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

  const handleAddTask = async (taskData) => {
    try {
      await api.post('/tasks', {
        ...taskData,
        challengeId: selectedChallenge._id
      });
      setShowAddTask(false);
      toast.success('Task added!');
      fetchTasks();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add task');
    }
  };

  const handleAddMainTopic = async ({ category }) => {
    try {
      await api.post(`/challenges/${selectedChallenge._id}/categories`, { category });
      setShowAddTask(false);
      toast.success('Subject added! Add tasks with the + button.');
      refreshSelectedChallenge();
      fetchTasks();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add subject');
    }
  };

  const handleDeleteCategory = async (category) => {
    try {
      await api.delete(`/challenges/${selectedChallenge._id}/categories`, { data: { category } });
      toast.success('Subject and its tasks removed');
      refreshSelectedChallenge();
      fetchTasks();
    } catch (error) {
      toast.error('Failed to delete subject');
    }
  };

  const handleToggleTask = async (taskId) => {
    try {
      await api.put(`/tasks/${taskId}/toggle`);
      fetchTasks();
      fetchStats();
      refreshSelectedChallenge();
    } catch (error) {
      toast.error('Failed to update task');
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      await api.delete(`/tasks/${taskId}`);
      fetchTasks();
    } catch (error) {
      toast.error('Failed to delete task');
    }
  };

  const handleUpdateTask = async (taskId, updates) => {
    try {
      await api.put(`/tasks/${taskId}`, updates);
      fetchTasks();
    } catch (error) {
      toast.error('Failed to update task');
    }
  };

  // Filter all tasks based on filter selection
  const filteredAllTasks = allTasks.filter(task => {
    if (taskFilter === 'completed') return task.isCompleted;
    if (taskFilter === 'pending') return !task.isCompleted;
    return true;
  });

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
        setTodaysTasks([]);
        setAllTasks([]);
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

  const completedToday = todaysTasks.filter(t => t.isCompleted).length;
  const totalToday = todaysTasks.length;
  const completionPercent = totalToday > 0 ? Math.round((completedToday / totalToday) * 100) : 0;

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

          {/* Tasks Section */}
          {selectedChallenge && (
            <div className="card">
              {/* Tab Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-2">
                  {/* View Toggle Tabs */}
                  <div className="flex bg-slate-700/50 rounded-lg p-1">
                    <button
                      onClick={() => setTaskView('today')}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        taskView === 'today'
                          ? 'bg-primary-600 text-white'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Today
                    </button>
                    <button
                      onClick={() => setTaskView('all')}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                        taskView === 'all'
                          ? 'bg-primary-600 text-white'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <FiList className="w-4 h-4" />
                      All Tasks
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Filter (only for All Tasks view) */}
                  {taskView === 'all' && (
                    <div className="flex items-center gap-2">
                      <FiFilter className="w-4 h-4 text-slate-400" />
                      <select
                        value={taskFilter}
                        onChange={(e) => setTaskFilter(e.target.value)}
                        className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-primary-500"
                      >
                        <option value="all">All Status</option>
                        <option value="completed">Completed</option>
                        <option value="pending">Pending</option>
                      </select>
                    </div>
                  )}

                  <button
                    onClick={() => setShowAddTask(true)}
                    className="btn-primary flex items-center gap-2"
                  >
                    <FiPlus /> Add Task
                  </button>
                </div>
              </div>

              {/* Task View Header Info */}
              {taskView === 'today' ? (
                <>
                  <div className="mb-4">
                    <p className="text-sm text-slate-400">
                      {format(new Date(), 'EEEE, MMMM d, yyyy')}
                    </p>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-slate-400">{completedToday} of {totalToday} tasks</span>
                      <span className="text-primary-400 font-medium">{completionPercent}%</span>
                    </div>
                    <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-primary-500 to-primary-400 rounded-full transition-all duration-500"
                        style={{ width: `${completionPercent}%` }}
                      />
                    </div>
                  </div>

                  <TaskList 
                    tasks={todaysTasks} 
                    categories={selectedChallenge?.categories || []}
                    onToggle={handleToggleTask}
                    onDelete={handleDeleteTask}
                    onAddTask={handleAddTask}
                    onUpdateTask={handleUpdateTask}
                    onDeleteCategory={handleDeleteCategory}
                  />
                </>
              ) : (
                <>
                  <div className="mb-4 flex items-center justify-between">
                    <p className="text-sm text-slate-400">
                      Showing {filteredAllTasks.length} task{filteredAllTasks.length !== 1 ? 's' : ''} 
                      {taskFilter !== 'all' && ` (${taskFilter})`}
                    </p>
                    <div className="flex gap-4 text-sm">
                      <span className="text-green-400">
                        {allTasks.filter(t => t.isCompleted).length} completed
                      </span>
                      <span className="text-yellow-400">
                        {allTasks.filter(t => !t.isCompleted).length} pending
                      </span>
                    </div>
                  </div>

                  <AllTasksList 
                    tasks={filteredAllTasks} 
                    categories={selectedChallenge?.categories || []}
                    onToggle={handleToggleTask}
                    onDelete={handleDeleteTask}
                    onAddTask={handleAddTask}
                    onUpdateTask={handleUpdateTask}
                    onDeleteCategory={handleDeleteCategory}
                  />
                </>
              )}
            </div>
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
    </div>
  );
};

export default Dashboard;
