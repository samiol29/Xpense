import mongoose from 'mongoose';

const budgetTemplateSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String },
    lifestyle: { type: String, enum: ['student', 'professional', 'family', 'retired', 'custom'] },
    budgets: [{
      category: { type: String, required: true },
      amount: { type: Number, required: true },
      percentage: { type: Number }
    }],
    isDefault: { type: Boolean, default: false }
  },
  { timestamps: true }
);

export default mongoose.model('BudgetTemplate', budgetTemplateSchema);

