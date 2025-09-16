import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import User from '../models/User.js';
import Transaction from '../models/Transaction.js';

const router = express.Router();
router.use(requireAuth);

// Get current month's budget status
router.get('/', async (req, res) => {
  const user = await User.findById(req.userId).select('monthlyBudget');
  const budget = user?.monthlyBudget || 0;

  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  const expensesAgg = await Transaction.aggregate([
    { $match: { userId: user._id, type: 'expense', date: { $gte: start, $lte: end } } },
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ]);
  const spent = expensesAgg[0]?.total || 0;

  const percent = budget > 0 ? (spent / budget) * 100 : 0;
  let alert = null;
  if (budget > 0) {
    if (percent >= 100) alert = 'over';
    else if (percent >= 100) alert = 'at_100';
    else if (percent >= 70) alert = 'at_70';
  }

  res.json({ budget, spent, remaining: Math.max(budget - spent, 0), percent, alert });
});

// Update monthly budget
router.put('/', async (req, res) => {
  const { monthlyBudget } = req.body;
  if (monthlyBudget == null || monthlyBudget < 0) {
    return res.status(400).json({ message: 'Invalid budget' });
  }
  const user = await User.findByIdAndUpdate(
    req.userId,
    { monthlyBudget },
    { new: true, select: '_id name email monthlyBudget' }
  );
  res.json({ user });
});

export default router;


