import mongoose, { Schema, Document } from "mongoose";

export interface ITier extends Document {
  name: string;
  billingCycle: {
    monthly: {
      priceUSD: number;
      priceNGN: number;
      durationInDays: number;
      stripePlanCode: string;
      paystackPlanCode: string;
    };
    yearly: {
      priceUSD: number;
      priceNGN: number;
      durationInDays: number;
      stripePlanCode: string;
      paystackPlanCode: string;
    };
  };
  description: string;
  trialPeriod: number;
  autoRenew: boolean;
  features: string[];
  maxCards: number;
}

const BillingCycleSchema = new Schema({
  monthly: {
    priceUSD: { type: Number, required: true },
    priceNGN: { type: Number, required: true },
    durationInDays: { type: Number, default: 30 },
    stripePlanCode: { type: String, required: true },
    paystackPlanCode: { type: String, required: true },
  },
  yearly: {
    priceUSD: { type: Number, required: true },
    priceNGN: { type: Number, required: true },
    durationInDays: { type: Number, default: 365 },
    stripePlanCode: { type: String, required: true },
    paystackPlanCode: { type: String, required: true },
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
    maxCards: { type: Number, required: true, default: 3 },
  },
  { timestamps: true }
);

export default mongoose.model<ITier>("Tier", TierSchema);
