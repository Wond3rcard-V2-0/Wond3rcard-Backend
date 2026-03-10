import { Document } from "mongoose";
import { OrganizationMember } from "../organization/organization.protocol";
import { Types } from "mongoose";

enum UserStatus {
  Active = "active",
  Suspended = "suspended",
  Banned = "banned",
}

enum UserRole {
  Admin = "admin",
  Staff = "staff",
  Customer = "customer",
}

enum UserTiers {
  Basic = "basic",
  Premium = "premium",
  Business = "business",
}

interface User extends Document {
  username: string;
  email: string;
  password: string;
  fcmToken: string;
  userRole: UserRole;
  is2FAEnabled: boolean;
  mfaEnabled: boolean;
  mfaSecret: string;
  userStatus: UserStatus;
  isSoftDeleted: boolean;
  isVerified: boolean;
  failedLoginAttempts: number;
  lockUntil: Date | null;
  refreshToken: string;
  userTier: {
    plan: UserTiers;
    status: "active" | "inactive";
    transactionId: string | null;
    subscriptionCode: string | null;
    expiresAt: Date | null;
  };
  activeSubscription?: {
    provider: "stripe" | "paystack" | "manual" | null;
    subscriptionId: string | null;
    expiryDate: Date | null;
  };
  organizations: OrganizationMember[];
  paystackCustomerId: string;
  stripeCustomerId: string;

  // OAuth Tokens for Integrations
  zoomAccessToken?: string;
  googleMeetAccessToken?: string;
  microsoftTeamsAccessToken?: string;
  tokenExpiry?: Date;

  connections: Types.ObjectId[];

  isValidPassword(password: string): Promise<Error | boolean>;
}

export { User, UserRole, UserStatus, UserTiers };
