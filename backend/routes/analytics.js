import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import Transaction from '../models/Transaction.js';

const router = express.Router();
router.use(requireAuth);

// Get spending trends
router.get('/trends', async (req, res) => {
  try {
    const { days = 90 } = req.query;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - parseInt(days));

    const transactions = await Transaction.find({
      userId: req.userId,
      type: 'expense',
      date: { $gte: cutoffDate }
    });

    // Analyze by day of week
    const dayOfWeekSpending = {};
    transactions.forEach(t => {
      const day = new Date(t.date).getDay();
      const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][day];
      if (!dayOfWeekSpending[dayName]) {
        dayOfWeekSpending[dayName] = { total: 0, count: 0 };
      }
      dayOfWeekSpending[dayName].total += t.amount;
      dayOfWeekSpending[dayName].count += 1;
    });

    const dayTrends = Object.entries(dayOfWeekSpending).map(([day, data]) => ({
      day,
      total: data.total,
      average: data.total / data.count,
      count: data.count
    }));

    // Find highest spending day
    const highestDay = dayTrends.reduce((max, day) => 
      day.total > max.total ? day : max, dayTrends[0] || { day: 'N/A', total: 0 }
    );

    // Calculate percentage difference
    const avgSpending = dayTrends.reduce((sum, d) => sum + d.total, 0) / (dayTrends.length || 1);
    const highestDayPercent = avgSpending > 0 
      ? ((highestDay.total - avgSpending) / avgSpending) * 100 
      : 0;

    res.json({
      dayOfWeek: dayTrends,
      insights: {
        highestSpendingDay: highestDay.day,
        percentDifference: highestDayPercent.toFixed(1),
        message: `You spend ${Math.abs(highestDayPercent).toFixed(1)}% ${highestDayPercent > 0 ? 'more' : 'less'} on ${highestDay.day}s`
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Predictive analytics - forecast next month
router.get('/forecast', async (req, res) => {
  try {
    const now = new Date();
    const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);
    
    const transactions = await Transaction.find({
      userId: req.userId,
      type: 'expense',
      date: { $gte: threeMonthsAgo }
    });

    // Group by month
    const monthlySpending = {};
    transactions.forEach(t => {
      const monthKey = `${new Date(t.date).getFullYear()}-${new Date(t.date).getMonth()}`;
      if (!monthlySpending[monthKey]) {
        monthlySpending[monthKey] = 0;
      }
      monthlySpending[monthKey] += t.amount;
    });

    const monthlyValues = Object.values(monthlySpending);
    if (monthlyValues.length === 0) {
      return res.json({ forecast: 0, trend: 'stable', confidence: 0 });
    }

    // Simple linear regression for trend
    const avgSpending = monthlyValues.reduce((a, b) => a + b, 0) / monthlyValues.length;
    const recentAvg = monthlyValues.slice(-2).reduce((a, b) => a + b, 0) / Math.min(2, monthlyValues.length);

    // Forecast based on trend
    const trend = recentAvg > avgSpending ? 'increasing' : recentAvg < avgSpending ? 'decreasing' : 'stable';
    const forecast = recentAvg * 1.05; // Slight upward adjustment

    res.json({
      forecast: Math.round(forecast),
      trend,
      confidence: Math.min(85, monthlyValues.length * 20),
      previousMonths: monthlyValues,
      average: Math.round(avgSpending)
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Spending velocity
router.get('/velocity', async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const transactions = await Transaction.find({
      userId: req.userId,
      type: 'expense',
      date: { $gte: startOfMonth }
    });

    const totalSpent = transactions.reduce((sum, t) => sum + t.amount, 0);
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const daysElapsed = now.getDate();
    
    const dailyRate = totalSpent / daysElapsed;
    const projectedMonthly = dailyRate * daysInMonth;
    const weeklyRate = dailyRate * 7;

    res.json({
      dailyRate: Math.round(dailyRate),
      weeklyRate: Math.round(weeklyRate),
      projectedMonthly: Math.round(projectedMonthly),
      currentSpending: Math.round(totalSpent),
      daysElapsed,
      daysRemaining: daysInMonth - daysElapsed
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Category comparisons
router.get('/category-comparison', async (req, res) => {
  try {
    const { period = 'month' } = req.query;
    const now = new Date();
    let startDate, endDate, previousStart, previousEnd;

    if (period === 'month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      previousStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      previousEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
    } else {
      startDate = new Date(now.getFullYear(), 0, 1);
      endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
      previousStart = new Date(now.getFullYear() - 1, 0, 1);
      previousEnd = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999);
    }

    const [current, previous] = await Promise.all([
      Transaction.aggregate([
        { $match: { userId: req.userId, type: 'expense', date: { $gte: startDate, $lte: endDate } } },
        { $group: { _id: '$category', total: { $sum: '$amount' } } }
      ]),
      Transaction.aggregate([
        { $match: { userId: req.userId, type: 'expense', date: { $gte: previousStart, $lte: previousEnd } } },
        { $group: { _id: '$category', total: { $sum: '$amount' } } }
      ])
    ]);

    const currentMap = {};
    current.forEach(item => {
      currentMap[item._id] = item.total;
    });

    const previousMap = {};
    previous.forEach(item => {
      previousMap[item._id] = item.total;
    });

    const allCategories = new Set([...Object.keys(currentMap), ...Object.keys(previousMap)]);
    const comparisons = Array.from(allCategories).map(category => {
      const currentAmount = currentMap[category] || 0;
      const previousAmount = previousMap[category] || 0;
      const change = previousAmount > 0 
        ? ((currentAmount - previousAmount) / previousAmount) * 100 
        : currentAmount > 0 ? 100 : 0;

      return {
        category,
        current: currentAmount,
        previous: previousAmount,
        change: Math.round(change * 10) / 10,
        trend: change > 0 ? 'up' : change < 0 ? 'down' : 'stable'
      };
    });

    res.json(comparisons);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Spending heatmap
router.get('/heatmap', async (req, res) => {
  try {
    const { year = new Date().getFullYear() } = req.query;
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31, 23, 59, 59, 999);

    const transactions = await Transaction.find({
      userId: req.userId,
      type: 'expense',
      date: { $gte: startDate, $lte: endDate }
    });

    // Group by date
    const dailySpending = {};
    transactions.forEach(t => {
      const dateKey = new Date(t.date).toISOString().split('T')[0];
      if (!dailySpending[dateKey]) {
        dailySpending[dateKey] = 0;
      }
      dailySpending[dateKey] += t.amount;
    });

    // Find max for intensity calculation
    const maxSpending = Math.max(...Object.values(dailySpending), 1);

    const heatmapData = Object.entries(dailySpending).map(([date, amount]) => ({
      date,
      amount,
      intensity: Math.min(100, (amount / maxSpending) * 100)
    }));

    res.json({
      year: parseInt(year),
      data: heatmapData,
      maxSpending,
      totalDays: heatmapData.length
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// AI insights
router.get('/insights', async (req, res) => {
  try {
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [lastMonthTx, currentMonthTx] = await Promise.all([
      Transaction.find({
        userId: req.userId,
        type: 'expense',
        date: { $gte: lastMonth, $lte: endOfLastMonth }
      }),
      Transaction.find({
        userId: req.userId,
        type: 'expense',
        date: { $gte: startOfMonth }
      })
    ]);

    // Category analysis
    const lastMonthByCategory = {};
    lastMonthTx.forEach(t => {
      lastMonthByCategory[t.category] = (lastMonthByCategory[t.category] || 0) + t.amount;
    });

    const currentMonthByCategory = {};
    currentMonthTx.forEach(t => {
      currentMonthByCategory[t.category] = (currentMonthByCategory[t.category] || 0) + t.amount;
    });

    const insights = [];

    // Find categories with significant increases
    Object.keys(currentMonthByCategory).forEach(category => {
      const current = currentMonthByCategory[category];
      const previous = lastMonthByCategory[category] || 0;
      if (previous > 0 && current > previous * 1.2) {
        const increase = ((current - previous) / previous) * 100;
        insights.push({
          type: 'warning',
          category,
          message: `Your spending on ${category} has increased by ${increase.toFixed(0)}% compared to last month. Consider reviewing these expenses.`,
          current,
          previous
        });
      }
    });

    // Find top spending category
    const topCategory = Object.entries(currentMonthByCategory)
      .sort((a, b) => b[1] - a[1])[0];
    
    if (topCategory) {
      const total = Object.values(currentMonthByCategory).reduce((a, b) => a + b, 0);
      const percentage = (topCategory[1] / total) * 100;
      if (percentage > 40) {
        insights.push({
          type: 'info',
          category: topCategory[0],
          message: `${topCategory[0]} accounts for ${percentage.toFixed(0)}% of your spending this month. Consider if this aligns with your priorities.`,
          amount: topCategory[1],
          percentage
        });
      }
    }

    // Check for unusual patterns
    const avgDailySpending = currentMonthTx.reduce((sum, t) => sum + t.amount, 0) / now.getDate();
    const highSpendingDays = currentMonthTx.filter(t => {
      const dayTotal = currentMonthTx
        .filter(t2 => new Date(t2.date).toDateString() === new Date(t.date).toDateString())
        .reduce((sum, t2) => sum + t2.amount, 0);
      return dayTotal > avgDailySpending * 3;
    });

    if (highSpendingDays.length > 0) {
      insights.push({
        type: 'warning',
        message: `You have ${highSpendingDays.length} day(s) with unusually high spending. Review these transactions.`,
        days: highSpendingDays.length
      });
    }

    res.json(insights);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;

