import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import RecurringTransaction from '../models/RecurringTransaction.js';
import Transaction from '../models/Transaction.js';

const router = express.Router();
router.use(requireAuth);

// Get all recurring transactions
router.get('/', async (req, res) => {
  try {
    const recurring = await RecurringTransaction.find({ userId: req.userId })
      .sort({ nextDueDate: 1 });
    res.json(recurring);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create recurring transaction
router.post('/', async (req, res) => {
  try {
    const recurring = await RecurringTransaction.create({
      ...req.body,
      userId: req.userId
    });
    res.json(recurring);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update recurring transaction
router.put('/:id', async (req, res) => {
  try {
    const recurring = await RecurringTransaction.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      req.body,
      { new: true }
    );
    if (!recurring) {
      return res.status(404).json({ message: 'Recurring transaction not found' });
    }
    res.json(recurring);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete recurring transaction
router.delete('/:id', async (req, res) => {
  try {
    const recurring = await RecurringTransaction.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId
    });
    if (!recurring) {
      return res.status(404).json({ message: 'Recurring transaction not found' });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Smart detection - analyze transactions to find recurring patterns
router.post('/detect', async (req, res) => {
  try {
    const { days = 90 } = req.body;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const transactions = await Transaction.find({
      userId: req.userId,
      date: { $gte: cutoffDate }
    }).sort({ date: 1 });

    // Group by description and amount
    const patterns = {};
    transactions.forEach(t => {
      const key = `${t.description.toLowerCase()}_${t.amount}`;
      if (!patterns[key]) {
        patterns[key] = {
          description: t.description,
          amount: t.amount,
          category: t.category,
          type: t.type,
          dates: []
        };
      }
      patterns[key].dates.push(new Date(t.date));
    });

    // Find patterns that occur regularly
    const detected = [];
    Object.values(patterns).forEach(pattern => {
      if (pattern.dates.length >= 3) {
        // Calculate average interval
        const intervals = [];
        for (let i = 1; i < pattern.dates.length; i++) {
          const diff = pattern.dates[i] - pattern.dates[i - 1];
          intervals.push(diff / (1000 * 60 * 60 * 24)); // days
        }
        const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;

        // Determine frequency
        let frequency = 'monthly';
        if (avgInterval <= 1) frequency = 'daily';
        else if (avgInterval <= 7) frequency = 'weekly';
        else if (avgInterval <= 14) frequency = 'biweekly';
        else if (avgInterval <= 31) frequency = 'monthly';
        else if (avgInterval <= 93) frequency = 'quarterly';
        else frequency = 'yearly';

        const lastDate = pattern.dates[pattern.dates.length - 1];
        const nextDueDate = new Date(lastDate);
        nextDueDate.setDate(nextDueDate.getDate() + avgInterval);

        detected.push({
          description: pattern.description,
          amount: pattern.amount,
          category: pattern.category,
          type: pattern.type,
          frequency,
          startDate: pattern.dates[0],
          nextDueDate,
          occurrences: pattern.dates.length,
          confidence: Math.min(100, (pattern.dates.length / 3) * 30)
        });
      }
    });

    res.json(detected);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create transaction from recurring
router.post('/:id/create-transaction', async (req, res) => {
  try {
    const recurring = await RecurringTransaction.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!recurring) {
      return res.status(404).json({ message: 'Recurring transaction not found' });
    }

    const transaction = await Transaction.create({
      userId: req.userId,
      type: recurring.type,
      description: recurring.description,
      amount: recurring.amount,
      category: recurring.category,
      date: recurring.nextDueDate,
      isRecurring: true
    });

    // Update next due date
    const nextDate = new Date(recurring.nextDueDate);
    switch (recurring.frequency) {
      case 'daily':
        nextDate.setDate(nextDate.getDate() + 1);
        break;
      case 'weekly':
        nextDate.setDate(nextDate.getDate() + 7);
        break;
      case 'biweekly':
        nextDate.setDate(nextDate.getDate() + 14);
        break;
      case 'monthly':
        nextDate.setMonth(nextDate.getMonth() + 1);
        break;
      case 'quarterly':
        nextDate.setMonth(nextDate.getMonth() + 3);
        break;
      case 'yearly':
        nextDate.setFullYear(nextDate.getFullYear() + 1);
        break;
    }

    recurring.nextDueDate = nextDate;
    if (recurring.endDate && nextDate > recurring.endDate) {
      recurring.isActive = false;
    }
    await recurring.save();

    res.json(transaction);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;

