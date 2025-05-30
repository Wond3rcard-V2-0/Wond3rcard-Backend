import mongoose, { Schema, Document } from "mongoose";

export interface ITier extends Document {
  name: string;
  billingCycle: {
    monthly: { price: number; durationInDays: number; planCode: string };
    yearly: { price: number; durationInDays: number; planCode: string };
  };
  description: string;
  trialPeriod: number;
  autoRenew: boolean;
  features: string[];
}

const BillingCycleSchema = new Schema({
  monthly: {
    price: { type: Number, required: true },
    durationInDays: { type: Number, required: true, default: 30 },
    planCode: { type: String, required: true },
  },
  yearly: {
    price: { type: Number, required: true },
    durationInDays: { type: Number, required: true, default: 365 },
    planCode: { type: String, required: true },
  },
});

const TierSchema = new Schema<ITier>(
  {
    name: { type: String, required: true, unique: true, lowercase: true },
    billingCycle: { type: BillingCycleSchema, required: true },
    description: { type: String, required: true },
    trialPeriod: { type: Number, required: true },
    autoRenew: { type: Boolean, required: true },
    features: { type: [String], required: true },
  },
  { timestamps: true }
);

export default mongoose.model<ITier>("Tier", TierSchema);
