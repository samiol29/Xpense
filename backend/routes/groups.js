import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import Group from '../models/Group.js';
import SharedExpense from '../models/SharedExpense.js';
import User from '../models/User.js';

const router = express.Router();
router.use(requireAuth);

// Get all groups user is member of
router.get('/', async (req, res) => {
  try {
    const groups = await Group.find({
      $or: [
        { createdBy: req.userId },
        { 'members.userId': req.userId }
      ]
    }).populate('createdBy', 'name email');
    res.json(groups);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create group
router.post('/', async (req, res) => {
  try {
    const group = await Group.create({
      ...req.body,
      createdBy: req.userId,
      members: [{
        userId: req.userId,
        role: 'admin',
        joinedAt: new Date()
      }]
    });
    res.json(group);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Get group details
router.get('/:id', async (req, res) => {
  try {
    const group = await Group.findOne({
      _id: req.params.id,
      $or: [
        { createdBy: req.userId },
        { 'members.userId': req.userId }
      ]
    }).populate('createdBy', 'name email')
      .populate('members.userId', 'name email');
    
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }
    res.json(group);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Add member to group
router.post('/:id/members', async (req, res) => {
  try {
    const { email, role = 'viewer' } = req.body;
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const group = await Group.findOne({
      _id: req.params.id,
      $or: [
        { createdBy: req.userId },
        { 'members.userId': req.userId, 'members.role': { $in: ['admin', 'editor'] } }
      ]
    });

    if (!group) {
      return res.status(404).json({ message: 'Group not found or insufficient permissions' });
    }

    // Check if user is already a member
    if (group.members.some(m => m.userId.toString() === user._id.toString())) {
      return res.status(400).json({ message: 'User is already a member' });
    }

    group.members.push({
      userId: user._id,
      role,
      joinedAt: new Date()
    });

    await group.save();
    res.json(group);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update member role
router.put('/:id/members/:memberId', async (req, res) => {
  try {
    const { role } = req.body;
    const group = await Group.findOne({
      _id: req.params.id,
      createdBy: req.userId
    });

    if (!group) {
      return res.status(404).json({ message: 'Group not found or insufficient permissions' });
    }

    const member = group.members.id(req.params.memberId);
    if (!member) {
      return res.status(404).json({ message: 'Member not found' });
    }

    member.role = role;
    await group.save();
    res.json(group);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Remove member
router.delete('/:id/members/:memberId', async (req, res) => {
  try {
    const group = await Group.findOne({
      _id: req.params.id,
      $or: [
        { createdBy: req.userId },
        { 'members.userId': req.userId, 'members.role': { $in: ['admin', 'editor'] } }
      ]
    });

    if (!group) {
      return res.status(404).json({ message: 'Group not found or insufficient permissions' });
    }

    group.members = group.members.filter(m => m._id.toString() !== req.params.memberId);
    await group.save();
    res.json(group);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ========== Shared Expenses ==========

// Get shared expenses for group
router.get('/:id/expenses', async (req, res) => {
  try {
    const group = await Group.findOne({
      _id: req.params.id,
      $or: [
        { createdBy: req.userId },
        { 'members.userId': req.userId }
      ]
    });

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    const expenses = await SharedExpense.find({ groupId: req.params.id })
      .populate('createdBy', 'name email')
      .populate('splits.userId', 'name email')
      .sort({ date: -1 });

    res.json(expenses);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create shared expense
router.post('/:id/expenses', async (req, res) => {
  try {
    const group = await Group.findOne({
      _id: req.params.id,
      $or: [
        { createdBy: req.userId },
        { 'members.userId': req.userId, 'members.role': { $in: ['admin', 'editor'] } }
      ]
    });

    if (!group) {
      return res.status(404).json({ message: 'Group not found or insufficient permissions' });
    }

    const expense = await SharedExpense.create({
      ...req.body,
      groupId: req.params.id,
      createdBy: req.userId
    });

    res.json(expense);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update shared expense
router.put('/:id/expenses/:expenseId', async (req, res) => {
  try {
    const expense = await SharedExpense.findOne({
      _id: req.params.expenseId,
      groupId: req.params.id,
      createdBy: req.userId
    });

    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    Object.assign(expense, req.body);
    await expense.save();
    res.json(expense);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete shared expense
router.delete('/:id/expenses/:expenseId', async (req, res) => {
  try {
    const expense = await SharedExpense.findOneAndDelete({
      _id: req.params.expenseId,
      groupId: req.params.id,
      createdBy: req.userId
    });

    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;

