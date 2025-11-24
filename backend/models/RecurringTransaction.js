import mongoose from 'mongoose';

const recurringTransactionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['income', 'expense'], required: true },
    description: { type: String, required: true },
    amount: { type: Number, required: true, min: 0 },
    category: { type: String, required: true },
    frequency: { 
      type: String, 
      enum: ['daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'yearly'],
      required: true 
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date },
    nextDueDate: { type: Date, required: true },
    isActive: { type: Boolean, default: true },
    autoCreate: { type: Boolean, default: false },
    budgetId: { type: mongoose.Schema.Types.ObjectId, ref: 'Budget' }
  },
  { timestamps: true }
);

recurringTransactionSchema.index({ userId: 1, isActive: 1, nextDueDate: 1 });

export default mongoose.model('RecurringTransaction', recurringTransactionSchema);

