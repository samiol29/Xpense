import mongoose from 'mongoose';

const budgetSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    category: { type: String, required: true },
    amount: { type: Number, required: true, min: 0 },
    period: { type: String, enum: ['monthly', 'yearly'], default: 'monthly' },
    year: { type: Number },
    month: { type: Number },
    rollover: { type: Boolean, default: false },
    alertThresholds: {
      type: [Number],
      default: [50, 75, 90, 100]
    },
    alertsSent: {
      type: Map,
      of: [Date],
      default: {}
    }
  },
  { timestamps: true }
);

budgetSchema.index({ userId: 1, category: 1, period: 1, year: 1, month: 1 });

export default mongoose.model('Budget', budgetSchema);

