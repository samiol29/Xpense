import mongoose from 'mongoose';

const sharedExpenseSchema = new mongoose.Schema(
  {
    groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'Group' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    description: { type: String, required: true },
    totalAmount: { type: Number, required: true, min: 0 },
    category: { type: String, required: true },
    date: { type: Date, required: true },
    splits: [{
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
      amount: { type: Number, required: true, min: 0 },
      percentage: { type: Number }
    }],
    isSettled: { type: Boolean, default: false }
  },
  { timestamps: true }
);

export default mongoose.model('SharedExpense', sharedExpenseSchema);

