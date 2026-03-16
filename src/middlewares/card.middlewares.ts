import { NextFunction, Request, Response } from "express";
import HttpException from "../exceptions/http.exception";
import cardModel from "../resources/card/card.model";
import { UserTiers } from "../resources/user/user.protocol";
import tierModel from "../resources/admin/subscriptionTier/tier.model";
import { CARD_LIMITS } from "../config/card-limits.config";

/**
 * Middleware that enforces per-tier card creation limits.
 *
 * Resolution order for the card limit:
 *   1. `maxCards` from the matching Tier DB record (admin-configurable)
 *   2. Fallback constant from CARD_LIMITS config
 *
 * Business tier (Infinity) skips the check entirely.
 */
export const canCreateCardMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = req.user;
    if (!user) {
      return next(new HttpException(401, "failed", "Unauthorized"));
    }

    const plan: UserTiers = user.userTier.plan as UserTiers;

    // --- Resolve the card limit for this plan ---
    let maxCards: number = CARD_LIMITS[plan] ?? CARD_LIMITS[UserTiers.Basic];

    // Try to get the admin-configured limit from the Tier collection
    try {
      const tier = await tierModel.findOne({ name: plan }).lean();
      if (tier && typeof tier.maxCards === "number") {
        maxCards = tier.maxCards;
      }
    } catch {
      // If tier lookup fails, fall back to the config constant (already set)
    }

    // Unlimited plans skip the check
    if (!isFinite(maxCards)) {
      return next();
    }

    // --- Count the user's existing cards ---
    const cardCount = await cardModel.countDocuments({ ownerId: user.id });

    if (cardCount >= maxCards) {
      const planLabel = plan.charAt(0).toUpperCase() + plan.slice(1);
      const isFreeTier = plan === UserTiers.Basic;

      const message = isFreeTier
        ? `You've reached your card limit (${maxCards}). Please upgrade your plan to create more cards.`
        : `You've reached your card limit (${maxCards}) for your ${planLabel} plan. Please upgrade or delete an existing card to create a new one.`;

      throw new HttpException(403, "card_limit_reached", message);
    }

    next();
  } catch (error) {
    if (error instanceof HttpException) {
      return next(error);
    }
    console.error("Error in canCreateCardMiddleware:", error);
    next(
      new HttpException(
        500,
        "failed",
        "An error occurred while checking card limits. Please try again."
      )
    );
  }
};
