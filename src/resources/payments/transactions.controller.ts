import { NextFunction, Request, Response, Router } from "express";
import authenticatedMiddleware from "../../middlewares/authenticated.middleware";
import verifyRolesMiddleware from "../../middlewares/roles.middleware";
import { UserRole } from "../user/user.protocol";
import TransactionService from "./transactions.service";
import TransactionModel from "./transactions.model";

class TransactionsController {
  public path = "/payments";
  public router = Router();

  constructor() {
    this.initializeRoute();
  }

  private initializeRoute() {
    this.router.get(
      `${this.path}/transactions`,
      [authenticatedMiddleware, verifyRolesMiddleware([UserRole.Admin])],
      this.getTransactions
    );
    this.router.get(
      `${this.path}/analytics`,
      [authenticatedMiddleware, verifyRolesMiddleware([UserRole.Admin])],
      this.getAnalytics
    );
  }

  private async getTransactions(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const filter: any = {};

      // Dynamically add filters if they exist in the query params
      if (req.query.provider) filter.paymentProvider = req.query.provider;
      if (req.query.status) filter.status = req.query.status;
      if (req.query.userId) filter.userId = req.query.userId;
      if (req.query.plan) filter.plan = req.query.plan;
      if (req.query.billingCycle) filter.billingCycle = req.query.billingCycle;
      if (req.query.paymentMethod)
        filter.paymentMethod = req.query.paymentMethod;
      if (req.query.transactionId)
        filter.transactionId = req.query.transactionId;
      if (req.query.referenceId) filter.referenceId = req.query.referenceId;
      if (req.query.transactionType)
        filter.transactionType = req.query.transactionType;
      // Handle date range filtering dynamically
      if (req.query.startDate || req.query.endDate) {
        filter.createdAt = {};
        if (req.query.startDate)
          filter.createdAt.$gte = new Date(req.query.startDate as string);
        if (req.query.endDate)
          filter.createdAt.$lte = new Date(req.query.endDate as string);
      }

      // Fetch transactions with dynamic filters
      const transactions = await TransactionModel.find(filter).sort({
        createdAt: -1,
      });

      res.status(200).json({ status: "success", transactions });
    } catch (error) {
      next(error);
    }
  }

  private async getAnalytics(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const analytics = await TransactionService.getTransactionAnalytics();
      res.status(200).json(analytics);
    } catch (error) {
      next(error);
    }
  }
}

export default TransactionsController;
