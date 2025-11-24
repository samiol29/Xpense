import mongoose from 'mongoose';

const subscriptionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    amount: { type: Number, required: true, min: 0 },
    category: { type: String, default: 'Subscriptions' },
    billingCycle: { 
      type: String, 
      enum: ['monthly', 'quarterly', 'yearly'],
      default: 'monthly'
    },
    startDate: { type: Date, required: true },
    nextBillingDate: { type: Date, required: true },
    isActive: { type: Boolean, default: true },
    isTrial: { type: Boolean, default: false },
    trialEndDate: { type: Date },
    cancelReminderDays: { type: Number, default: 3 },
    description: { type: String }
  },
  { timestamps: true }
);

subscriptionSchema.index({ userId: 1, isActive: 1, nextBillingDate: 1 });

export default mongoose.model('Subscription', subscriptionSchema);

