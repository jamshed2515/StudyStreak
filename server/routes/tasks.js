const express = require('express');
const Task = require('../models/Task');
const Challenge = require('../models/Challenge');
const { protect } = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/tasks
// @desc    Create a new task
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { challengeId, title, category, priority, date, estimatedMinutes } = req.body;

    const challenge = await Challenge.findById(challengeId);
    if (!challenge) {
      return res.status(404).json({ message: 'Challenge not found' });
    }

    const task = await Task.create({
      user: req.user._id,
      challenge: challengeId,
      title,
      category: category || 'Other',
      subtopic: req.body.subtopic || '',
      priority: priority || 'Medium',
      date: date || new Date(),
      estimatedMinutes: estimatedMinutes || 60
    });

    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/tasks
// @desc    Get all tasks for user
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { challengeId, date, completed } = req.query;
    
    let query = { user: req.user._id };
    
    if (challengeId) {
      query.challenge = challengeId;
    }
    
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      query.date = { $gte: startOfDay, $lte: endOfDay };
    }
    
    if (completed !== undefined) {
      query.isCompleted = completed === 'true';
    }

    const tasks = await Task.find(query)
      .populate('challenge', 'title')
      .sort({ date: -1, priority: -1 });
      
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/tasks/today
// @desc    Get today's tasks
// @access  Private
router.get('/today', protect, async (req, res) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const tasks = await Task.find({
      user: req.user._id,
      date: { $gte: startOfDay, $lte: endOfDay }
    })
      .populate('challenge', 'title')
      .sort({ priority: -1, createdAt: 1 });

    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/tasks/:id
// @desc    Get single task
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id).populate('challenge', 'title');

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    if (task.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    res.json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   PUT /api/tasks/:id
// @desc    Update task
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    let task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    if (task.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    task = await Task.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    ).populate('challenge', 'title');

    res.json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   PUT /api/tasks/:id/toggle
// @desc    Toggle task completion
// @access  Private
router.put('/:id/toggle', protect, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    if (task.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    task.isCompleted = !task.isCompleted;
    task.completedAt = task.isCompleted ? new Date() : null;

    await task.save();

    // Check if all tasks for today are completed to update challenge streak
    if (task.isCompleted) {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);

      const todaysTasks = await Task.find({
        user: req.user._id,
        challenge: task.challenge,
        date: { $gte: startOfDay, $lte: endOfDay }
      });

      const allCompleted = todaysTasks.every(t => t.isCompleted);

      if (allCompleted && todaysTasks.length > 0) {
        const challenge = await Challenge.findById(task.challenge);
        if (challenge) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          const alreadyCompleted = challenge.completedDays.some(
            date => new Date(date).setHours(0, 0, 0, 0) === today.getTime()
          );

          if (!alreadyCompleted) {
            challenge.completedDays.push(today);

            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);

            const completedYesterday = challenge.completedDays.some(
              date => new Date(date).setHours(0, 0, 0, 0) === yesterday.getTime()
            );

            if (completedYesterday) {
              challenge.currentStreak += 1;
            } else {
              challenge.currentStreak = 1;
            }

            if (challenge.currentStreak > challenge.longestStreak) {
              challenge.longestStreak = challenge.currentStreak;
            }

            await challenge.save();
          }
        }
      }
    }

    const updatedTask = await Task.findById(req.params.id).populate('challenge', 'title');
    res.json(updatedTask);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   DELETE /api/tasks/:id
// @desc    Delete task
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    if (task.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    await Task.findByIdAndDelete(req.params.id);

    res.json({ message: 'Task removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/tasks/stats/summary
// @desc    Get task statistics
// @access  Private
router.get('/stats/summary', protect, async (req, res) => {
  try {
    const tasks = await Task.find({ user: req.user._id });
    const completedTasks = tasks.filter(t => t.isCompleted);

    // Category breakdown
    const categoryStats = {};
    tasks.forEach(task => {
      if (!categoryStats[task.category]) {
        categoryStats[task.category] = { total: 0, completed: 0 };
      }
      categoryStats[task.category].total += 1;
      if (task.isCompleted) {
        categoryStats[task.category].completed += 1;
      }
    });

    const stats = {
      totalTasks: tasks.length,
      completedTasks: completedTasks.length,
      completionRate: tasks.length > 0 
        ? Math.round((completedTasks.length / tasks.length) * 100) 
        : 0,
      categoryStats
    };

    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
