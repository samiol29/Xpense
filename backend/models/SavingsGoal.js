import mongoose from 'mongoose';

const savingsGoalSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    targetAmount: { type: Number, required: true, min: 0 },
    currentAmount: { type: Number, default: 0, min: 0 },
    targetDate: { type: Date },
    description: { type: String }
  },
  { timestamps: true }
);

export default mongoose.model('SavingsGoal', savingsGoalSchema);

