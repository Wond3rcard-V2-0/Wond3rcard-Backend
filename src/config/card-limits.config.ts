import { UserTiers } from "../resources/user/user.protocol";

/**
 * Default card limits per subscription tier.
 * Used as a fallback when the Tier DB record doesn't have a `maxCards` value.
 *
 * Free (Basic): 3 cards
 * Premium:      5 cards
 * Business:     Unlimited
 */
export const CARD_LIMITS: Record<UserTiers, number> = {
  [UserTiers.Basic]: 3,
  [UserTiers.Premium]: 5,
  [UserTiers.Business]: Infinity, // Unlimited
};
