import mongoose from 'mongoose';

const groupSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    members: [{
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
      role: { type: String, enum: ['admin', 'editor', 'viewer'], default: 'viewer' },
      joinedAt: { type: Date, default: Date.now }
    }],
    budgets: [{
      category: { type: String, required: true },
      amount: { type: Number, required: true },
      period: { type: String, enum: ['monthly', 'yearly'], default: 'monthly' }
    }],
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export default mongoose.model('Group', groupSchema);

