import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import Subscription from '../models/Subscription.js';

const router = express.Router();
router.use(requireAuth);

// Get all subscriptions
router.get('/', async (req, res) => {
  try {
    const subscriptions = await Subscription.find({ userId: req.userId })
      .sort({ nextBillingDate: 1 });
    res.json(subscriptions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create subscription
router.post('/', async (req, res) => {
  try {
    const subscription = await Subscription.create({
      ...req.body,
      userId: req.userId
    });
    res.json(subscription);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update subscription
router.put('/:id', async (req, res) => {
  try {
    const subscription = await Subscription.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      req.body,
      { new: true }
    );
    if (!subscription) {
      return res.status(404).json({ message: 'Subscription not found' });
    }
    res.json(subscription);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete subscription
router.delete('/:id', async (req, res) => {
  try {
    const subscription = await Subscription.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId
    });
    if (!subscription) {
      return res.status(404).json({ message: 'Subscription not found' });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get subscription insights
router.get('/insights', async (req, res) => {
  try {
    const subscriptions = await Subscription.find({ 
      userId: req.userId,
      isActive: true 
    });

    const monthlyTotal = subscriptions
      .filter(s => s.billingCycle === 'monthly')
      .reduce((sum, s) => sum + s.amount, 0);

    const quarterlyTotal = subscriptions
      .filter(s => s.billingCycle === 'quarterly')
      .reduce((sum, s) => sum + s.amount, 0);

    const yearlyTotal = subscriptions
      .filter(s => s.billingCycle === 'yearly')
      .reduce((sum, s) => sum + s.amount, 0);

    const monthlyEquivalent = monthlyTotal + (quarterlyTotal / 3) + (yearlyTotal / 12);
    const yearlyEquivalent = (monthlyTotal * 12) + (quarterlyTotal * 4) + yearlyTotal;

    // Upcoming renewals (next 7 days)
    const now = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);

    const upcomingRenewals = subscriptions.filter(s => {
      const billingDate = new Date(s.nextBillingDate);
      return billingDate >= now && billingDate <= nextWeek;
    });

    // Trial ending soon
    const trialEnding = subscriptions.filter(s => {
      if (!s.isTrial || !s.trialEndDate) return false;
      const trialDate = new Date(s.trialEndDate);
      return trialDate >= now && trialDate <= nextWeek;
    });

    res.json({
      total: subscriptions.length,
      monthlyTotal,
      monthlyEquivalent,
      yearlyEquivalent,
      upcomingRenewals: upcomingRenewals.length,
      trialEnding: trialEnding.length,
      subscriptions: subscriptions.map(s => ({
        ...s.toObject(),
        daysUntilRenewal: Math.ceil((new Date(s.nextBillingDate) - now) / (1000 * 60 * 60 * 24))
      }))
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get cancellation reminders
router.get('/reminders', async (req, res) => {
  try {
    const now = new Date();
    const subscriptions = await Subscription.find({ 
      userId: req.userId,
      isActive: true 
    });

    const reminders = subscriptions
      .map(sub => {
        const billingDate = new Date(sub.nextBillingDate);
        const daysUntil = Math.ceil((billingDate - now) / (1000 * 60 * 60 * 24));
        
        if (daysUntil <= sub.cancelReminderDays && daysUntil > 0) {
          return {
            subscription: sub,
            daysUntil,
            message: `${sub.name} will renew in ${daysUntil} day${daysUntil !== 1 ? 's' : ''}`
          };
        }
        return null;
      })
      .filter(r => r !== null);

    res.json(reminders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;

