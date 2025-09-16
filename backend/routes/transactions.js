import express from 'express';
import Transaction from '../models/Transaction.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.use(requireAuth);

router.post('/', async (req, res) => {
  try {
    const { type, description, amount, category, date, isRecurring } = req.body;
    const tx = await Transaction.create({
      userId: req.userId,
      type,
      description,
      amount,
      category,
      date,
      isRecurring: Boolean(isRecurring),
    });
    res.status(201).json(tx);
  } catch (err) {
    res.status(400).json({ message: 'Invalid data' });
  }
});

router.get('/', async (req, res) => {
  const { q, type, category } = req.query;
  const filter = { userId: req.userId };
  if (type) filter.type = type;
  if (category) filter.category = category;
  if (q) filter.description = { $regex: q, $options: 'i' };
  const items = await Transaction.find(filter).sort({ date: -1 });
  res.json(items);
});

router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  const deleted = await Transaction.findOneAndDelete({ _id: id, userId: req.userId });
  if (!deleted) return res.status(404).json({ message: 'Not found' });
  res.json({ success: true });
});

router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { type, description, amount, category, date, isRecurring } = req.body;
  const updated = await Transaction.findOneAndUpdate(
    { _id: id, userId: req.userId },
    { type, description, amount, category, date, isRecurring },
    { new: true }
  );
  if (!updated) return res.status(404).json({ message: 'Not found' });
  res.json(updated);
});

export default router;


