import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import User from '../models/User.js';
import Transaction from '../models/Transaction.js';
import Budget from '../models/Budget.js';
import SavingsGoal from '../models/SavingsGoal.js';
import BudgetTemplate from '../models/BudgetTemplate.js';

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
    else if (percent >= 70) alert = 'at_70';
  }

  res.json({ monthlyBudget: budget, budget, spent, remaining: Math.max(budget - spent, 0), percent, alert });
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
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }
  
  // Calculate current month's spent amount
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  
  const expensesAgg = await Transaction.aggregate([
    { $match: { userId: user._id, type: 'expense', date: { $gte: start, $lte: end } } },
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ]);
  const spent = expensesAgg[0]?.total || 0;
  const percent = monthlyBudget > 0 ? (spent / monthlyBudget) * 100 : 0;
  
  res.json({ 
    user,
    monthlyBudget: user.monthlyBudget,
    spent,
    remaining: Math.max(monthlyBudget - spent, 0),
    percent
  });
});

// ========== Category-Specific Budgets ==========

// Get all category budgets
router.get('/categories', async (req, res) => {
  try {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    
    const budgets = await Budget.find({
      userId: req.userId,
      period: 'monthly',
      year,
      month
    });

    // Get spending for each category
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59, 999);
    
    const expensesByCategory = await Transaction.aggregate([
      { $match: { userId: req.userId, type: 'expense', date: { $gte: start, $lte: end } } },
      { $group: { _id: '$category', total: { $sum: '$amount' } } }
    ]);

    const spendingMap = {};
    expensesByCategory.forEach(item => {
      spendingMap[item._id] = item.total;
    });

    const budgetsWithSpending = budgets.map(budget => {
      const spent = spendingMap[budget.category] || 0;
      const percent = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
      return {
        ...budget.toObject(),
        spent,
        remaining: Math.max(budget.amount - spent, 0),
        percent
      };
    });

    res.json(budgetsWithSpending);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create or update category budget
router.post('/categories', async (req, res) => {
  try {
    const { category, amount, period, rollover, alertThresholds } = req.body;
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    const budget = await Budget.findOneAndUpdate(
      {
        userId: req.userId,
        category,
        period: period || 'monthly',
        year: period === 'yearly' ? year : undefined,
        month: period === 'monthly' ? month : undefined
      },
      {
        userId: req.userId,
        category,
        amount,
        period: period || 'monthly',
        year: period === 'yearly' ? year : undefined,
        month: period === 'monthly' ? month : undefined,
        rollover: rollover || false,
        alertThresholds: alertThresholds || [50, 75, 90, 100]
      },
      { upsert: true, new: true }
    );

    res.json(budget);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete category budget
router.delete('/categories/:id', async (req, res) => {
  try {
    const budget = await Budget.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId
    });
    if (!budget) {
      return res.status(404).json({ message: 'Budget not found' });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ========== Budget Templates ==========

// Get all templates
router.get('/templates', async (req, res) => {
  try {
    const templates = await BudgetTemplate.find();
    res.json(templates);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create template
router.post('/templates', async (req, res) => {
  try {
    const template = await BudgetTemplate.create(req.body);
    res.json(template);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Apply template to user
router.post('/templates/:id/apply', async (req, res) => {
  try {
    const template = await BudgetTemplate.findById(req.params.id);
    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }

    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    const budgets = await Promise.all(
      template.budgets.map(b => 
        Budget.findOneAndUpdate(
          {
            userId: req.userId,
            category: b.category,
            period: 'monthly',
            year,
            month
          },
          {
            userId: req.userId,
            category: b.category,
            amount: b.amount,
            period: 'monthly',
            year,
            month,
            rollover: false,
            alertThresholds: [50, 75, 90, 100]
          },
          { upsert: true, new: true }
        )
      )
    );

    res.json(budgets);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ========== Savings Goals ==========

// Get all savings goals
router.get('/savings-goals', async (req, res) => {
  try {
    const goals = await SavingsGoal.find({ userId: req.userId });
    res.json(goals);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create savings goal
router.post('/savings-goals', async (req, res) => {
  try {
    const goal = await SavingsGoal.create({
      ...req.body,
      userId: req.userId
    });
    res.json(goal);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update savings goal
router.put('/savings-goals/:id', async (req, res) => {
  try {
    const goal = await SavingsGoal.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      req.body,
      { new: true }
    );
    if (!goal) {
      return res.status(404).json({ message: 'Goal not found' });
    }
    res.json(goal);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete savings goal
router.delete('/savings-goals/:id', async (req, res) => {
  try {
    const goal = await SavingsGoal.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId
    });
    if (!goal) {
      return res.status(404).json({ message: 'Goal not found' });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ========== Budget Rollover ==========

// Process budget rollover
router.post('/rollover', async (req, res) => {
  try {
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastYear = lastMonth.getFullYear();
    const lastMonthNum = lastMonth.getMonth() + 1;

    const budgets = await Budget.find({
      userId: req.userId,
      period: 'monthly',
      rollover: true,
      year: lastYear,
      month: lastMonthNum
    });

    const start = new Date(lastYear, lastMonthNum - 1, 1);
    const end = new Date(lastYear, lastMonthNum, 0, 23, 59, 59, 999);

    const expensesByCategory = await Transaction.aggregate([
      { $match: { userId: req.userId, type: 'expense', date: { $gte: start, $lte: end } } },
      { $group: { _id: '$category', total: { $sum: '$amount' } } }
    ]);

    const spendingMap = {};
    expensesByCategory.forEach(item => {
      spendingMap[item._id] = item.total;
    });

    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    const rolledOverBudgets = await Promise.all(
      budgets.map(async (budget) => {
        const spent = spendingMap[budget.category] || 0;
        const remaining = Math.max(budget.amount - spent, 0);
        
        if (remaining > 0) {
          const existing = await Budget.findOne({
            userId: req.userId,
            category: budget.category,
            period: 'monthly',
            year: currentYear,
            month: currentMonth
          });

          if (existing) {
            existing.amount += remaining;
            await existing.save();
            return existing;
          } else {
            return await Budget.create({
              userId: req.userId,
              category: budget.category,
              amount: remaining,
              period: 'monthly',
              year: currentYear,
              month: currentMonth,
              rollover: budget.rollover,
              alertThresholds: budget.alertThresholds
            });
          }
        }
        return null;
      })
    );

    res.json({ rolledOver: rolledOverBudgets.filter(b => b !== null) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ========== Budget Alerts ==========

// Get budget alerts
router.get('/alerts', async (req, res) => {
  try {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    
    const budgets = await Budget.find({
      userId: req.userId,
      period: 'monthly',
      year,
      month
    });

    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59, 999);

    const expensesByCategory = await Transaction.aggregate([
      { $match: { userId: req.userId, type: 'expense', date: { $gte: start, $lte: end } } },
      { $group: { _id: '$category', total: { $sum: '$amount' } } }
    ]);

    const spendingMap = {};
    expensesByCategory.forEach(item => {
      spendingMap[item._id] = item.total;
    });

    const alerts = [];
    budgets.forEach(budget => {
      const spent = spendingMap[budget.category] || 0;
      const percent = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
      
      budget.alertThresholds.forEach(threshold => {
        if (percent >= threshold) {
          const alertsSent = budget.alertsSent?.get(threshold.toString()) || [];
          const lastAlert = alertsSent[alertsSent.length - 1];
          const daysSinceLastAlert = lastAlert 
            ? (now - new Date(lastAlert)) / (1000 * 60 * 60 * 24)
            : Infinity;

          // Only alert if not alerted in last 24 hours
          if (daysSinceLastAlert >= 1) {
            alerts.push({
              budgetId: budget._id,
              category: budget.category,
              threshold,
              percent: percent.toFixed(1),
              spent,
              budget: budget.amount,
              message: `Budget alert: ${budget.category} has reached ${percent.toFixed(1)}% (${threshold}% threshold)`
            });
          }
        }
      });
    });

    res.json(alerts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Mark alert as sent
router.post('/alerts/:budgetId/mark-sent', async (req, res) => {
  try {
    const { threshold } = req.body;
    const budget = await Budget.findOne({
      _id: req.params.budgetId,
      userId: req.userId
    });

    if (!budget) {
      return res.status(404).json({ message: 'Budget not found' });
    }

    if (!budget.alertsSent) {
      budget.alertsSent = new Map();
    }

    const thresholdKey = threshold.toString();
    const alertsSent = budget.alertsSent.get(thresholdKey) || [];
    alertsSent.push(new Date());
    budget.alertsSent.set(thresholdKey, alertsSent);
    await budget.save();

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;


