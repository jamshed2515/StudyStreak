const express = require('express');
const Challenge = require('../models/Challenge');
const Task = require('../models/Task');
const { protect } = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/challenges
// @desc    Create a new challenge
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { title, description, targetDays, startDate } = req.body;

    const start = startDate ? new Date(startDate) : new Date();
    const end = new Date(start);
    end.setDate(end.getDate() + (targetDays || 30));

    const challenge = await Challenge.create({
      user: req.user._id,
      title,
      description,
      startDate: start,
      endDate: end,
      targetDays: targetDays || 30
    });

    res.status(201).json(challenge);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/challenges
// @desc    Get all challenges for user
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const challenges = await Challenge.find({ user: req.user._id })
      .sort({ createdAt: -1 });
    res.json(challenges);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/challenges/active
// @desc    Get active challenge
// @access  Private
router.get('/active', protect, async (req, res) => {
  try {
    const challenge = await Challenge.findOne({ 
      user: req.user._id, 
      isActive: true 
    });
    res.json(challenge);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/challenges/:id
// @desc    Get single challenge
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const challenge = await Challenge.findById(req.params.id);

    if (!challenge) {
      return res.status(404).json({ message: 'Challenge not found' });
    }

    if (challenge.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    res.json(challenge);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   PUT /api/challenges/:id
// @desc    Update challenge
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    let challenge = await Challenge.findById(req.params.id);

    if (!challenge) {
      return res.status(404).json({ message: 'Challenge not found' });
    }

    if (challenge.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    challenge = await Challenge.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.json(challenge);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/challenges/:id/categories
// @desc    Add a category (main topic) to challenge - no task created
// @access  Private
router.post('/:id/categories', protect, async (req, res) => {
  try {
    const challenge = await Challenge.findById(req.params.id);

    if (!challenge) {
      return res.status(404).json({ message: 'Challenge not found' });
    }

    if (challenge.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    const { category } = req.body;
    if (!category || typeof category !== 'string' || !category.trim()) {
      return res.status(400).json({ message: 'Category name is required' });
    }

    const name = category.trim();
    if (!challenge.categories) challenge.categories = [];
    if (!challenge.categories.includes(name)) {
      challenge.categories.push(name);
      await challenge.save();
    }

    res.json(challenge);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   DELETE /api/challenges/:id/categories
// @desc    Remove category and delete all its tasks
// @access  Private
router.delete('/:id/categories', protect, async (req, res) => {
  try {
    const challenge = await Challenge.findById(req.params.id);

    if (!challenge) {
      return res.status(404).json({ message: 'Challenge not found' });
    }

    if (challenge.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    const { category } = req.body;
    if (!category || typeof category !== 'string') {
      return res.status(400).json({ message: 'Category is required' });
    }

    if (challenge.categories) {
      challenge.categories = challenge.categories.filter(c => c !== category);
      await challenge.save();
    }
    await Task.deleteMany({ challenge: req.params.id, category });

    const updated = await Challenge.findById(req.params.id);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/challenges/:id/complete-day
// @desc    Mark a day as completed
// @access  Private
router.post('/:id/complete-day', protect, async (req, res) => {
  try {
    const challenge = await Challenge.findById(req.params.id);

    if (!challenge) {
      return res.status(404).json({ message: 'Challenge not found' });
    }

    if (challenge.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const alreadyCompleted = challenge.completedDays.some(
      date => new Date(date).setHours(0, 0, 0, 0) === today.getTime()
    );

    if (!alreadyCompleted) {
      challenge.completedDays.push(today);
      
      // Calculate streak
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

    res.json(challenge);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/challenges/:id/stats
// @desc    Get challenge statistics
// @access  Private
router.get('/:id/stats', protect, async (req, res) => {
  try {
    const challenge = await Challenge.findById(req.params.id);

    if (!challenge) {
      return res.status(404).json({ message: 'Challenge not found' });
    }

    const tasks = await Task.find({ challenge: req.params.id });
    const completedTasks = tasks.filter(t => t.isCompleted);

    const totalDays = challenge.targetDays;
    const completedDays = challenge.completedDays.length;
    const completionRate = totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0;

    const stats = {
      totalDays,
      completedDays,
      completionRate,
      currentStreak: challenge.currentStreak,
      longestStreak: challenge.longestStreak,
      totalTasks: tasks.length,
      completedTasks: completedTasks.length,
      taskCompletionRate: tasks.length > 0 
        ? Math.round((completedTasks.length / tasks.length) * 100) 
        : 0
    };

    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   DELETE /api/challenges/:id
// @desc    Delete challenge
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const challenge = await Challenge.findById(req.params.id);

    if (!challenge) {
      return res.status(404).json({ message: 'Challenge not found' });
    }

    if (challenge.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    await Task.deleteMany({ challenge: req.params.id });
    await Challenge.findByIdAndDelete(req.params.id);

    res.json({ message: 'Challenge removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/challenges/:id/subtopics
// @desc    Add a subtopic to a challenge
// @access  Private
router.post('/:id/subtopics', protect, async (req, res) => {
  try {
    const challenge = await Challenge.findById(req.params.id);
    if (!challenge) return res.status(404).json({ message: 'Challenge not found' });
    if (challenge.user.toString() !== req.user._id.toString()) return res.status(401).json({ message: 'Not authorized' });

    const { name, category, description } = req.body;
    if (!name || !category) return res.status(400).json({ message: 'Name and category are required' });

    if (!challenge.subtopics) challenge.subtopics = [];
    
    // Check duplicate
    const exists = challenge.subtopics.some(
      s => s.name.toLowerCase() === name.trim().toLowerCase() && s.category === category
    );
    if (exists) return res.status(400).json({ message: 'Subtopic already exists in this subject' });

    const defaultMilestonesMap = {
      arrays: [
        'Basic Array Operations',
        'Traversal & Searching',
        'Prefix Sum',
        'Two Pointers',
        'Sliding Window',
        'Practice Interview Problems',
        'Revision & Mock Problems'
      ],
      strings: [
        'String Basics',
        'Character Arrays',
        'Frequency Counting',
        'Hashing',
        'Pattern Matching',
        'Practice Interview Problems',
        'Revision'
      ]
    };

    const genericMilestones = [
      'Basic Concepts & Operations',
      'Standard Implementations',
      'Key Patterns & Techniques',
      'Practice Interview Problems',
      'Revision & Mock Tests'
    ];

    const searchKey = name.trim().toLowerCase();
    const milestoneTexts = defaultMilestonesMap[searchKey] || genericMilestones;
    const milestones = milestoneTexts.map(text => ({ text, isCompleted: false }));

    challenge.subtopics.push({ 
      name: name.trim(), 
      category, 
      description: description || '',
      isCompleted: false,
      milestones
    });
    await challenge.save();

    res.json(challenge);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   PUT /api/challenges/:id/subtopics/:subtopicId
// @desc    Update a subtopic (name/description)
// @access  Private
router.put('/:id/subtopics/:subtopicId', protect, async (req, res) => {
  try {
    const challenge = await Challenge.findById(req.params.id);
    if (!challenge) return res.status(404).json({ message: 'Challenge not found' });
    if (challenge.user.toString() !== req.user._id.toString()) return res.status(401).json({ message: 'Not authorized' });

    const { name, description } = req.body;
    const subtopic = challenge.subtopics.id(req.params.subtopicId);
    if (!subtopic) return res.status(404).json({ message: 'Subtopic not found' });

    const oldName = subtopic.name;
    const category = subtopic.category;

    if (name) {
      subtopic.name = name.trim();
    }
    if (description !== undefined) {
      subtopic.description = description;
    }

    await challenge.save();

    // If name changed, update tasks
    if (name && oldName !== name.trim()) {
      await Task.updateMany(
        { challenge: req.params.id, category, subtopic: oldName },
        { subtopic: name.trim() }
      );
    }

    res.json(challenge);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   DELETE /api/challenges/:id/subtopics/:subtopicId
// @desc    Delete a subtopic and its tasks
// @access  Private
router.delete('/:id/subtopics/:subtopicId', protect, async (req, res) => {
  try {
    const challenge = await Challenge.findById(req.params.id);
    if (!challenge) return res.status(404).json({ message: 'Challenge not found' });
    if (challenge.user.toString() !== req.user._id.toString()) return res.status(401).json({ message: 'Not authorized' });

    const subtopic = challenge.subtopics.id(req.params.subtopicId);
    if (!subtopic) return res.status(404).json({ message: 'Subtopic not found' });

    const name = subtopic.name;
    const category = subtopic.category;

    challenge.subtopics = challenge.subtopics.filter(s => s._id.toString() !== req.params.subtopicId);
    await challenge.save();

    // Delete tasks belonging to this subtopic
    await Task.deleteMany({ challenge: req.params.id, category, subtopic: name });

    res.json(challenge);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Helper to update streak when user completes study activity today
const updateStreak = (challenge) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const alreadyCompleted = challenge.completedDays.some(
    date => new Date(date).setHours(0, 0, 0, 0) === today.getTime()
  );

  if (!alreadyCompleted) {
    challenge.completedDays.push(today);

    // Calculate streak
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
  }
};

// @route   POST /api/challenges/:id/subtopics/:subtopicId/milestones
// @desc    Add a milestone to a subtopic
// @access  Private
router.post('/:id/subtopics/:subtopicId/milestones', protect, async (req, res) => {
  try {
    const challenge = await Challenge.findById(req.params.id);
    if (!challenge) return res.status(404).json({ message: 'Challenge not found' });
    if (challenge.user.toString() !== req.user._id.toString()) return res.status(401).json({ message: 'Not authorized' });

    const subtopic = challenge.subtopics.id(req.params.subtopicId);
    if (!subtopic) return res.status(404).json({ message: 'Subtopic not found' });

    const { text } = req.body;
    if (!text || !text.trim()) return res.status(400).json({ message: 'Milestone text is required' });

    if (!subtopic.milestones) subtopic.milestones = [];
    subtopic.milestones.push({ text: text.trim(), isCompleted: false });
    
    await challenge.save();
    res.json(challenge);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   PUT /api/challenges/:id/subtopics/:subtopicId/milestones/:milestoneId
// @desc    Update a milestone (toggle completion or change text)
// @access  Private
router.put('/:id/subtopics/:subtopicId/milestones/:milestoneId', protect, async (req, res) => {
  try {
    const challenge = await Challenge.findById(req.params.id);
    if (!challenge) return res.status(404).json({ message: 'Challenge not found' });
    if (challenge.user.toString() !== req.user._id.toString()) return res.status(401).json({ message: 'Not authorized' });

    const subtopic = challenge.subtopics.id(req.params.subtopicId);
    if (!subtopic) return res.status(404).json({ message: 'Subtopic not found' });

    const milestone = subtopic.milestones.id(req.params.milestoneId);
    if (!milestone) return res.status(404).json({ message: 'Milestone not found' });

    const { text, isCompleted } = req.body;

    if (text) {
      milestone.text = text.trim();
    }
    if (isCompleted !== undefined) {
      milestone.isCompleted = isCompleted;
      
      // If a milestone is completed, update streak for today
      if (isCompleted) {
        updateStreak(challenge);
      }
    }

    await challenge.save();
    res.json(challenge);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   DELETE /api/challenges/:id/subtopics/:subtopicId/milestones/:milestoneId
// @desc    Delete a milestone
// @access  Private
router.delete('/:id/subtopics/:subtopicId/milestones/:milestoneId', protect, async (req, res) => {
  try {
    const challenge = await Challenge.findById(req.params.id);
    if (!challenge) return res.status(404).json({ message: 'Challenge not found' });
    if (challenge.user.toString() !== req.user._id.toString()) return res.status(401).json({ message: 'Not authorized' });

    const subtopic = challenge.subtopics.id(req.params.subtopicId);
    if (!subtopic) return res.status(404).json({ message: 'Subtopic not found' });

    subtopic.milestones = subtopic.milestones.filter(m => m._id.toString() !== req.params.milestoneId);

    await challenge.save();
    res.json(challenge);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   PUT /api/challenges/:id/subtopics/:subtopicId/complete
// @desc    Mark a subtopic as completed or incomplete
// @access  Private
router.put('/:id/subtopics/:subtopicId/complete', protect, async (req, res) => {
  try {
    const challenge = await Challenge.findById(req.params.id);
    if (!challenge) return res.status(404).json({ message: 'Challenge not found' });
    if (challenge.user.toString() !== req.user._id.toString()) return res.status(401).json({ message: 'Not authorized' });

    const subtopic = challenge.subtopics.id(req.params.subtopicId);
    if (!subtopic) return res.status(404).json({ message: 'Subtopic not found' });

    const { isCompleted } = req.body;
    if (isCompleted !== undefined) {
      subtopic.isCompleted = isCompleted;

      // If marked complete, auto-complete all milestones and update streak
      if (isCompleted) {
        if (subtopic.milestones) {
          subtopic.milestones.forEach(m => m.isCompleted = true);
        }
        updateStreak(challenge);
      }
    }

    await challenge.save();
    res.json(challenge);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
