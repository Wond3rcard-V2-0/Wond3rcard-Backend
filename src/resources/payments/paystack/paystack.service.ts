import axios from "axios";
import HttpException from "../../../exceptions/http.exception";
import tierModel from "../../admin/subscriptionTier/tier.model";
import userModel from "../../user/user.model";
import profileModel from "../../profile/profile.model";
import TransactionModel from "../transactions.model";
import MailTemplates from "../../mails/mail.templates";
import NodeMailerService from "../../mails/nodemailer.service";
import { generateTransactionId } from "../../../utils/generateTransactionId";
import { UserTiers } from "../../user/user.protocol";

type CancelSubscriptionParams = {
  targetUserId: string;
  subscriptionId: string;
};

type ChangeSubscriptionParams = {
  targetUserId: string;
  newPlan: UserTiers;
  billingCycle: "monthly" | "yearly";
};

class PaystackSubscriptionService {
  private secretKey = process.env.PAYSTACK_SECRET_KEY;
  private baseUrl = "https://api.paystack.co";
  private mailer = new NodeMailerService();

  public async initializePayment(
    userId: string,
    plan: string,
    billingCycle: "monthly" | "yearly"
  ) {
    try {
      // Validate input parameters
      if (!userId || !plan || !billingCycle) {
        throw new HttpException(
          400,
          "invalid_request",
          "Missing required parameters: userId, plan, and billingCycle are required"
        );
      }

      if (!["monthly", "yearly"].includes(billingCycle)) {
        throw new HttpException(
          400,
          "invalid_billing_cycle",
          "Invalid billing cycle. Must be either 'monthly' or 'yearly'"
        );
      }

      const user = await userModel.findById(userId);
      if (!user) {
        throw new HttpException(
          404,
          "user_not_found",
          "User account not found for payment initialization"
        );
      }

      const profile = await profileModel.findOne({ uid: userId });
      if (!profile) {
        throw new HttpException(
          404,
          "profile_not_found",
          "User profile not found. Please complete your profile first."
        );
      }

      const tier = await tierModel.findOne({ name: plan.toLowerCase() });
      if (!tier) {
        throw new HttpException(
          404,
          "tier_not_found",
          `Subscription tier '${plan}' not found. Available tiers: basic, premium, business`
        );
      }

      const { durationInDays, paystackPlanCode } =
        tier.billingCycle[billingCycle];

      if (!paystackPlanCode) {
        throw new HttpException(
          500,
          "payment_configuration_error",
          `Paystack PlanCode not configured for ${plan} ${billingCycle} tier. Please contact administrator.`
        );
      }

      let planDetails;
      try {
        const response = await axios.get(
          `${this.baseUrl}/plan/${paystackPlanCode}`,
          {
            headers: { Authorization: `Bearer ${this.secretKey}` },
          }
        );
        planDetails = response.data;
      } catch (error) {
        if (error.response?.status === 404) {
          throw new HttpException(
            500,
            "payment_configuration_error",
            "Paystack plan not found. Please contact administrator."
          );
        }
        if (error.response?.status === 401) {
          throw new HttpException(
            500,
            "payment_configuration_error",
            "Paystack authentication failed. Please contact administrator."
          );
        }
        throw new HttpException(
          503,
          "payment_gateway_unavailable",
          "Unable to connect to Paystack service. Please try again later."
        );
      }

      if (!planDetails.status || !planDetails.data) {
        throw new HttpException(
          500,
          "payment_gateway_error",
          "Invalid response from Paystack plan service"
        );
      }

      const amount = planDetails.data.amount;

      // Ensure customer exists
      let customerCode = user.paystackCustomerId;

      if (!customerCode) {
        try {
          const customerResponse = await axios.post(
            `${this.baseUrl}/customer`,
            {
              email: user.email,
              first_name: profile.firstname,
              last_name: profile.lastname,
            },
            {
              headers: { Authorization: `Bearer ${this.secretKey}` },
            }
          );

          if (!customerResponse.data.status) {
            throw new HttpException(
              500,
              "customer_creation_failed",
              "Failed to create customer account with Paystack"
            );
          }

          customerCode = customerResponse.data.data.customer_code;
          user.paystackCustomerId = customerCode;
          await user.save();
        } catch (error) {
          if (error instanceof HttpException) {
            throw error;
          }
          throw new HttpException(
            500,
            "customer_creation_failed",
            "Failed to create Paystack customer account"
          );
        }
      }

      // Fetch customer's authorization history
      let customerDetails;
      try {
        const response = await axios.get(
          `${this.baseUrl}/customer/${customerCode}`,
          {
            headers: { Authorization: `Bearer ${this.secretKey}` },
          }
        );
        customerDetails = response.data;
      } catch (error) {
        throw new HttpException(
          503,
          "payment_gateway_unavailable",
          "Unable to fetch customer details from Paystack"
        );
      }

      // Paystack customer lookup returns: { status, message, data: { ..., authorizations: [...] } }
      const customerData = customerDetails?.data;
      const authorizations = customerData?.authorizations || [];
      const savedAuthorization = authorizations[0]?.authorization_code;

      if (savedAuthorization) {
        // User already has a saved card: Check for existing subscriptions first
        try {
          const treatAsActiveStatuses = ["active", "non-renewing"];
          // Check if customer already has active subscriptions on Paystack
          // Try multiple query approaches to find subscriptions
          const subscriptionsResponse = await axios.get(
            `${this.baseUrl}/subscription`,
            {
              headers: { Authorization: `Bearer ${this.secretKey}` },
              params: {
                customer: customerCode,
                perPage: 100,
              },
            }
          );

          console.log("Paystack raw subscription response:", {
            status: subscriptionsResponse.data?.status,
            message: subscriptionsResponse.data?.message,
            dataLength: subscriptionsResponse.data?.data?.length,
            meta: subscriptionsResponse.data?.meta,
          });

          // Get ALL subscriptions (any status) to understand what exists
          const allSubscriptions = subscriptionsResponse.data?.data || [];

          // Filter for active/non-renewing
          const allActiveSubscriptions = allSubscriptions.filter((sub: any) =>
            treatAsActiveStatuses.includes(sub.status)
          );

          // Filter for this specific plan (any status that could block)
          const subscriptionsForThisPlan = allSubscriptions.filter(
            (sub: any) => sub.plan?.plan_code === paystackPlanCode
          );

          // Active subscriptions for this plan
          const activeSubscriptions = subscriptionsForThisPlan.filter(
            (sub: any) => treatAsActiveStatuses.includes(sub.status)
          );

          // Log for debugging - show ALL subscriptions
          console.log("Paystack subscriptions check:", {
            customerCode,
            paystackPlanCode,
            totalSubscriptions: allSubscriptions.length,
            allActiveCount: allActiveSubscriptions.length,
            forThisPlanCount: subscriptionsForThisPlan.length,
            matchingActiveCount: activeSubscriptions.length,
            allSubs: allSubscriptions.map((s: any) => ({
              code: s.subscription_code,
              status: s.status,
              planCode: s.plan?.plan_code,
            })),
          });

          if (activeSubscriptions && activeSubscriptions.length > 0) {
            const existingSub = activeSubscriptions[0];
            const nextPaymentDate = existingSub.next_payment_date
              ? new Date(existingSub.next_payment_date)
              : null;
            const isActiveStatus = treatAsActiveStatuses.includes(
              existingSub.status
            );

            user.userTier = {
              plan: plan as UserTiers,
              status: isActiveStatus ? "active" : "inactive",
              transactionId: existingSub.subscription_code,
              subscriptionCode: existingSub.subscription_code,
              expiresAt: nextPaymentDate,
            };

            user.activeSubscription = {
              provider: "paystack",
              subscriptionId: existingSub.subscription_code,
              expiryDate: nextPaymentDate,
            };

            await user.save();

            if (profile) {
              profile.plan = plan;
              await profile.save();
            }

            return {
              type: "subscription" as const,
              subscriptionData: {
                subscription_code: existingSub.subscription_code,
                status: existingSub.status,
                plan: existingSub.plan,
                next_payment_date: existingSub.next_payment_date,
                customer: existingSub.customer,
                callback_url: `https://wonder-card-web-app-react.vercel.app/paystack/subscription/success?reference=${existingSub.subscription_code}`,
              },
            };
          }

          // No active subscription found, create a new one
          const subscriptionResponse = await axios.post(
            `${this.baseUrl}/subscription`,
            {
              customer: customerCode,
              plan: paystackPlanCode,
              authorization: savedAuthorization,
              callback_url: `https://wonder-card-web-app-react.vercel.app/paystack/subscription/success`,
              metadata: {
                userId,
                plan,
                billingCycle,
                durationInDays,
                amount,
                transactionType: "subscription",
              },
            },
            {
              headers: { Authorization: `Bearer ${this.secretKey}` },
            }
          );

          if (!subscriptionResponse.data.status) {
            throw new HttpException(
              500,
              "subscription_creation_failed",
              "Failed to create subscription with saved card"
            );
          }

          const newSub = subscriptionResponse.data.data;
          const nextPaymentDate = newSub.next_payment_date
            ? new Date(newSub.next_payment_date)
            : null;

          // Save subscription to user's DB record
          user.userTier = {
            plan: plan as UserTiers,
            status: "active",
            transactionId: newSub.subscription_code,
            subscriptionCode: newSub.subscription_code,
            expiresAt: nextPaymentDate,
          };

          user.activeSubscription = {
            provider: "paystack",
            subscriptionId: newSub.subscription_code,
            expiryDate: nextPaymentDate,
          };

          await user.save();

          if (profile) {
            profile.plan = plan;
            await profile.save();
          }

          // Update callback URL with subscription code after getting response
          newSub.callback_url = `https://wonder-card-web-app-react.vercel.app/paystack/subscription/success?reference=${newSub.subscription_code}`;

          return {
            type: "subscription" as const,
            subscriptionData: newSub,
          };
        } catch (error: any) {
          if (error instanceof HttpException) {
            throw error;
          }
          console.error("Paystack subscription creation error:", {
            message: error?.message,
            response: error?.response?.data,
            status: error?.response?.status,
          });
          const paystackMessage =
            error?.response?.data?.message ||
            "Failed to create subscription with saved payment method";

          // Handle duplicate subscription error
          if (
            paystackMessage
              .toLowerCase()
              .includes("subscription is already in place")
          ) {
            // Paystack says subscription exists but our API query didn't find it
            // Try to find it by querying all subscriptions for this plan
            console.log(
              "Attempting to find hidden subscription via plan query..."
            );

            try {
              const planSubsResponse = await axios.get(
                `${this.baseUrl}/subscription?plan=${paystackPlanCode}&perPage=100`,
                {
                  headers: { Authorization: `Bearer ${this.secretKey}` },
                }
              );

              const allPlanSubs = planSubsResponse.data?.data || [];
              const userSub = allPlanSubs.find(
                (sub: any) =>
                  sub.customer?.email === user.email ||
                  sub.customer?.customer_code === customerCode
              );

              console.log("Plan subscriptions search result:", {
                totalForPlan: allPlanSubs.length,
                foundUserSub: !!userSub,
                userSubDetails: userSub
                  ? {
                    code: userSub.subscription_code,
                    status: userSub.status,
                    customerCode: userSub.customer?.customer_code,
                    email: userSub.customer?.email,
                  }
                  : null,
              });

              if (userSub) {
                // Found it! Update user records and return
                const nextPaymentDate = userSub.next_payment_date
                  ? new Date(userSub.next_payment_date)
                  : null;

                user.userTier = {
                  plan: plan as UserTiers,
                  status: ["active", "non-renewing"].includes(userSub.status)
                    ? "active"
                    : "inactive",
                  transactionId: userSub.subscription_code,
                  subscriptionCode: userSub.subscription_code,
                  expiresAt: nextPaymentDate,
                };

                user.activeSubscription = {
                  provider: "paystack",
                  subscriptionId: userSub.subscription_code,
                  expiryDate: nextPaymentDate,
                };

                // Update paystackCustomerId if it was different
                if (
                  userSub.customer?.customer_code &&
                  userSub.customer.customer_code !== user.paystackCustomerId
                ) {
                  user.paystackCustomerId = userSub.customer.customer_code;
                }

                await user.save();

                if (profile) {
                  profile.plan = plan;
                  await profile.save();
                }

                return {
                  type: "subscription" as const,
                  subscriptionData: {
                    subscription_code: userSub.subscription_code,
                    status: userSub.status,
                    plan: userSub.plan,
                    next_payment_date: userSub.next_payment_date,
                    customer: userSub.customer,
                    callback_url: `https://wonder-card-web-app-react.vercel.app/paystack/subscription/success?reference=${userSub.subscription_code}`,
                  },
                };
              }
            } catch (searchError) {
              console.error(
                "Failed to search for subscription by plan:",
                searchError
              );
            }

            throw new HttpException(
              400,
              "subscription_already_exists",
              `A subscription already exists for this plan on Paystack but could not be found via API. Please check your Paystack dashboard for customer ${customerCode} or contact support.`
            );
          }

          throw new HttpException(
            500,
            "subscription_creation_failed",
            paystackMessage
          );
        }
      }

      // No saved authorization: Initialize payment
      try {
        const transactionResponse = await axios.post(
          `${this.baseUrl}/transaction/initialize`,
          {
            email: user.email,
            amount: amount,
            callback_url: `https://wonder-card-web-app-react.vercel.app/paystack/subscription/success`,
            metadata: {
              userId,
              plan,
              billingCycle,
              durationInDays,
              amount,
              transactionType: "subscription",
            },
          },
          {
            headers: { Authorization: `Bearer ${this.secretKey}` },
          }
        );

        if (!transactionResponse.data.status) {
          throw new HttpException(
            500,
            "payment_initialization_failed",
            "Failed to initialize payment with Paystack"
          );
        }

        // Update callback URL with reference after getting response
        transactionResponse.data.data.callback_url = `https://wonder-card-web-app-react.vercel.app/paystack/subscription/success?reference=${transactionResponse.data.data.reference}`;

        return {
          type: "payment" as const,
          checkoutUrl: transactionResponse.data.data.authorization_url,
          reference: transactionResponse.data.data.reference,
        };
      } catch (error) {
        if (error instanceof HttpException) {
          throw error;
        }
        throw new HttpException(
          500,
          "payment_initialization_failed",
          "Failed to initialize payment. Please try again or use a different payment method."
        );
      }
    } catch (error) {
      console.error("Error in Paystack initializePayment:", error);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        500,
        "payment_initialization_failed",
        "An unexpected error occurred while initializing payment. Please try again or contact support."
      );
    }
  }

  private async disablePaystackSubscription(
    subscriptionCode: string,
    emailToken?: string
  ): Promise<void> {
    try {
      // Paystack disable endpoint requires code and token in request body
      await axios.post(
        `${this.baseUrl}/subscription/disable`,
        {
          code: subscriptionCode,
          token: emailToken || subscriptionCode, // Use email_token if available, fallback to code
        },
        {
          headers: {
            Authorization: `Bearer ${this.secretKey}`,
            "Content-Type": "application/json",
          },
        }
      );
    } catch (error: any) {
      console.error("Paystack disable subscription error:", {
        subscriptionCode,
        emailToken,
        message: error?.message,
        response: error?.response?.data,
        status: error?.response?.status,
      });
      const message =
        error?.response?.data?.message ||
        "Unable to disable Paystack subscription";
      throw new HttpException(502, "error", message);
    }
  }

  public async verifyTransaction(reference: string) {
    const response = await axios.get(
      `${this.baseUrl}/transaction/verify/${reference}`,
      {
        headers: { Authorization: `Bearer ${this.secretKey}` },
      }
    );

    return response.data;
  }

  public async handleSuccessfulSubscription(data: any) {
    const { userId, plan, billingCycle, durationInDays, amount } =
      data.metadata;

    const user = await userModel.findById(userId);
    const profile =
      (await profileModel.findOne({ uid: userId })) ||
      (await profileModel.findById(userId));

    if (!user) throw new HttpException(404, "error", "User not found");

    // Prevent duplicate transactions
    const existingTransaction = await TransactionModel.findOne({
      transactionId: data.id,
    });
    if (existingTransaction) {
      return { message: "Transaction already processed" };
    }

    const transactionId = data.id;
    const referenceId = generateTransactionId("subscription", "paystack");
    const paymentMethod = data.channel;
    const paidAt = new Date(data.paid_at);
    const expiresAt = new Date(
      paidAt.getTime() + durationInDays * 24 * 60 * 60 * 1000
    );

    let subscriptionCode = data.subscription?.subscription_code;

    if (data.authorization?.authorization_code) {
      const tier = await tierModel.findOne({ name: plan.toLowerCase() });
      const paystackPlanCode = tier.billingCycle[billingCycle].paystackPlanCode;

      const subscriptionResponse = await axios.post(
        `${this.baseUrl}/subscription`,
        {
          customer: data.customer.customer_code,
          plan: paystackPlanCode,
          authorization: data.authorization.authorization_code,
          callback_url: `https://wonder-card-web-app-react.vercel.app/paystack/subscription/success?reference=${data.reference}`,
          metadata: {
            userId,
            plan,
            billingCycle,
            durationInDays,
            amount,
            transactionType: "subscription",
          },
        },
        {
          headers: { Authorization: `Bearer ${this.secretKey}` },
        }
      );

      subscriptionCode = subscriptionResponse.data.data.subscription_code;
    }

    // Update user subscription
    user.userTier = {
      plan,
      status: "active",
      transactionId,
      subscriptionCode,
      expiresAt,
    };

    await user.save();

    // Save transaction log
    await TransactionModel.create({
      userId,
      userName: user.username,
      email: user.email,
      plan,
      billingCycle,
      amount,
      referenceId,
      transactionId,
      transactionType: "subscription",
      subscriptionCode,
      status: "success",
      paymentProvider: "paystack",
      paymentMethod,
      paidAt,
      expiresAt,
    });

    const template = MailTemplates.subscriptionConfirmation;
    const email = user.email;
    const dashboardBase =
      process.env.FRONTEND_BASE_URL?.replace(/\/$/, "") ||
      "https://dashboard.wond3rcard.com";
    const formattedAmount = new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(amount / 100);
    const emailData = {
      name: profile?.firstname || user.username,
      plan: plan.charAt(0).toUpperCase() + plan.slice(1),
      billingCycle:
        billingCycle.charAt(0).toUpperCase() + billingCycle.slice(1),
      startDate: paidAt.toDateString(),
      expiresAt: expiresAt.toDateString(),
      paymentMethod:
        paymentMethod.charAt(0).toUpperCase() + paymentMethod.slice(1),
      amount: formattedAmount,
      dashboardLink: `${dashboardBase}`,
    };

    await this.mailer.sendMail(
      email,
      "Subscription Confirmed - WOND3R CARD",
      template,
      "Subscription",
      emailData
    );

    return { message: "Subscription activated" };
  }

  public async cancelSubscription({
    targetUserId,
    subscriptionId,
  }: CancelSubscriptionParams) {
    const user = await userModel.findById(targetUserId);
    if (!user) {
      throw new HttpException(404, "error", "User not found");
    }

    let activeSubscriptionCode =
      user.userTier.subscriptionCode ||
      user.activeSubscription?.subscriptionId ||
      null;
    let emailToken: string | undefined;

    // Always check Paystack for the actual subscription state
    const treatAsActiveStatuses = ["active", "non-renewing"];
    if (user.paystackCustomerId) {
      try {
        const subscriptionsResponse = await axios.get(
          `${this.baseUrl}/subscription?customer=${user.paystackCustomerId}`,
          {
            headers: { Authorization: `Bearer ${this.secretKey}` },
          }
        );

        const activeSubscriptions = subscriptionsResponse.data?.data?.filter(
          (sub: any) => treatAsActiveStatuses.includes(sub.status)
        );

        // Log for debugging
        console.log("Cancel - Paystack subscriptions check:", {
          paystackCustomerId: user.paystackCustomerId,
          dbSubscriptionCode: user.userTier.subscriptionCode,
          dbStatus: user.userTier.status,
          paystackActiveCount: activeSubscriptions?.length || 0,
          paystackActiveSubs: activeSubscriptions?.map((s: any) => ({
            code: s.subscription_code,
            status: s.status,
            planCode: s.plan?.plan_code,
          })),
        });

        if (activeSubscriptions && activeSubscriptions.length > 0) {
          const existingSub = activeSubscriptions[0];
          const nextPaymentDate = existingSub.next_payment_date
            ? new Date(existingSub.next_payment_date)
            : null;

          activeSubscriptionCode = existingSub.subscription_code;
          emailToken = existingSub.email_token;

          user.userTier.subscriptionCode = activeSubscriptionCode;
          user.userTier.status = treatAsActiveStatuses.includes(
            existingSub.status
          )
            ? "active"
            : "inactive";

          user.activeSubscription = {
            provider: "paystack",
            subscriptionId: activeSubscriptionCode,
            expiryDate: nextPaymentDate,
          } as any;

          await user.save();
        } else {
          // Paystack customer query returned 0 - try searching by email across all subscriptions
          console.log(
            "Customer query returned 0, trying to find subscription by email..."
          );

          const allSubsResponse = await axios.get(
            `${this.baseUrl}/subscription`,
            {
              headers: { Authorization: `Bearer ${this.secretKey}` },
              params: { perPage: 100 },
            }
          );

          const allSubs = allSubsResponse.data?.data || [];
          const userSub = allSubs.find(
            (sub: any) =>
              treatAsActiveStatuses.includes(sub.status) &&
              (sub.customer?.email === user.email ||
                sub.customer?.customer_code === user.paystackCustomerId)
          );

          console.log("All subscriptions search result:", {
            totalSubs: allSubs.length,
            foundUserSub: !!userSub,
            userSubDetails: userSub
              ? {
                code: userSub.subscription_code,
                status: userSub.status,
                email: userSub.customer?.email,
              }
              : null,
          });

          if (userSub) {
            const nextPaymentDate = userSub.next_payment_date
              ? new Date(userSub.next_payment_date)
              : null;

            activeSubscriptionCode = userSub.subscription_code;
            emailToken = userSub.email_token;

            user.userTier.subscriptionCode = activeSubscriptionCode;
            user.userTier.status = "active";

            user.activeSubscription = {
              provider: "paystack",
              subscriptionId: activeSubscriptionCode,
              expiryDate: nextPaymentDate,
            } as any;

            // Update customer ID if different
            if (
              userSub.customer?.customer_code &&
              userSub.customer.customer_code !== user.paystackCustomerId
            ) {
              user.paystackCustomerId = userSub.customer.customer_code;
            }

            await user.save();
          }
        }
      } catch (error: any) {
        console.error(
          "Failed to reconcile Paystack subscription before cancel:",
          {
            message: error?.message,
            response: error?.response?.data,
            status: error?.response?.status,
          }
        );
      }
    }

    if (!activeSubscriptionCode || user.userTier.status !== "active") {
      throw new HttpException(
        400,
        "error",
        "User does not have an active Paystack subscription"
      );
    }

    if (subscriptionId && subscriptionId !== activeSubscriptionCode) {
      throw new HttpException(
        400,
        "error",
        "Provided subscription ID does not match the active subscription"
      );
    }

    await this.disablePaystackSubscription(activeSubscriptionCode, emailToken);

    user.userTier.status = "inactive";
    user.userTier.subscriptionCode = null;
    user.userTier.transactionId = null;
    user.userTier.expiresAt = null;

    if (user.activeSubscription?.provider === "paystack") {
      user.activeSubscription.provider = null;
      user.activeSubscription.subscriptionId = null;
      user.activeSubscription.expiryDate = null;
    }

    await user.save();

    const profile =
      (await profileModel.findOne({ uid: targetUserId })) ||
      (await profileModel.findById(targetUserId));

    const dashboardBase =
      process.env.FRONTEND_BASE_URL?.replace(/\/$/, "") ||
      "https://dashboard.wond3rcard.com";
    const planName = user.userTier.plan || "Premium";
    const emailData = {
      name: profile?.firstname || user.username,
      plan: planName.charAt(0).toUpperCase() + planName.slice(1),
      cancelledDate: new Date().toDateString(),
      accessUntil: "End of billing period",
      dashboardLink: `${dashboardBase}`,
    };

    await this.mailer.sendMail(
      user.email,
      "Subscription Cancelled - WOND3R CARD",
      MailTemplates.subscriptionCancelled,
      "Subscription",
      emailData
    );

    return {
      message: "Subscription canceled successfully",
      subscriptionId: activeSubscriptionCode,
    };
  }

  public async changeSubscription({
    targetUserId,
    newPlan,
    billingCycle,
  }: ChangeSubscriptionParams) {
    const user = await userModel.findById(targetUserId);
    if (!user) throw new HttpException(404, "error", "User not found");

    const normalizedPlan = newPlan.toLowerCase();
    const newTier = await tierModel.findOne({ name: normalizedPlan });
    if (!newTier)
      throw new HttpException(404, "error", "New subscription plan not found");

    let activeSubscriptionCode =
      user.userTier.subscriptionCode ||
      user.activeSubscription?.subscriptionId ||
      null;
    let emailToken: string | undefined;

    const treatAsActiveStatuses = ["active", "non-renewing"];
    if (user.paystackCustomerId) {
      try {
        const subscriptionsResponse = await axios.get(
          `${this.baseUrl}/subscription?customer=${user.paystackCustomerId}`,
          {
            headers: { Authorization: `Bearer ${this.secretKey}` },
          }
        );

        const activeSubscriptions = subscriptionsResponse.data?.data?.filter(
          (sub: any) => treatAsActiveStatuses.includes(sub.status)
        );

        console.log("Change - Paystack subscriptions check:", {
          paystackCustomerId: user.paystackCustomerId,
          dbSubscriptionCode: user.userTier.subscriptionCode,
          dbStatus: user.userTier.status,
          paystackActiveCount: activeSubscriptions?.length || 0,
          paystackActiveSubs: activeSubscriptions?.map((s: any) => ({
            code: s.subscription_code,
            status: s.status,
            planCode: s.plan?.plan_code,
          })),
        });

        if (activeSubscriptions && activeSubscriptions.length > 0) {
          const existingSub = activeSubscriptions[0];
          const nextPaymentDate = existingSub.next_payment_date
            ? new Date(existingSub.next_payment_date)
            : null;

          activeSubscriptionCode = existingSub.subscription_code;
          emailToken = existingSub.email_token;

          user.userTier.subscriptionCode = activeSubscriptionCode;
          user.userTier.status = treatAsActiveStatuses.includes(
            existingSub.status
          )
            ? "active"
            : "inactive";

          user.activeSubscription = {
            provider: "paystack",
            subscriptionId: activeSubscriptionCode,
            expiryDate: nextPaymentDate,
          } as any;

          await user.save();
        } else {
          console.log(
            "Change - customer query returned 0, trying to find subscription by email..."
          );

          const allSubsResponse = await axios.get(
            `${this.baseUrl}/subscription`,
            {
              headers: { Authorization: `Bearer ${this.secretKey}` },
              params: { perPage: 100 },
            }
          );

          const allSubs = allSubsResponse.data?.data || [];
          const userSub = allSubs.find(
            (sub: any) =>
              treatAsActiveStatuses.includes(sub.status) &&
              (sub.customer?.email === user.email ||
                sub.customer?.customer_code === user.paystackCustomerId)
          );

          console.log("Change - all subscriptions search result:", {
            totalSubs: allSubs.length,
            foundUserSub: !!userSub,
            userSubDetails: userSub
              ? {
                code: userSub.subscription_code,
                status: userSub.status,
                email: userSub.customer?.email,
              }
              : null,
          });

          if (userSub) {
            const nextPaymentDate = userSub.next_payment_date
              ? new Date(userSub.next_payment_date)
              : null;

            activeSubscriptionCode = userSub.subscription_code;
            emailToken = userSub.email_token;

            user.userTier.subscriptionCode = activeSubscriptionCode;
            user.userTier.status = "active";

            user.activeSubscription = {
              provider: "paystack",
              subscriptionId: activeSubscriptionCode,
              expiryDate: nextPaymentDate,
            } as any;

            if (
              userSub.customer?.customer_code &&
              userSub.customer.customer_code !== user.paystackCustomerId
            ) {
              user.paystackCustomerId = userSub.customer.customer_code;
            }

            await user.save();
          }
        }
      } catch (error: any) {
        console.error(
          "Failed to reconcile Paystack subscription before change:",
          {
            message: error?.message,
            response: error?.response?.data,
            status: error?.response?.status,
          }
        );
      }
    }

    if (activeSubscriptionCode) {
      await this.disablePaystackSubscription(
        activeSubscriptionCode,
        emailToken
      );
    }

    const initializationResult = await this.initializePayment(
      targetUserId,
      normalizedPlan,
      billingCycle
    );

    user.userTier.plan = newPlan;
    user.userTier.status = "inactive";
    user.userTier.transactionId = null;
    user.userTier.subscriptionCode =
      initializationResult.type === "subscription"
        ? initializationResult.subscriptionData.subscription_code
        : null;
    user.userTier.expiresAt = null;

    user.activeSubscription = {
      provider: "paystack",
      subscriptionId: user.userTier.subscriptionCode,
      expiryDate: null,
    };

    await user.save();

    return {
      message: "Subscription change initiated",
      nextAction:
        initializationResult.type === "payment"
          ? "complete_payment"
          : "await_activation",
      data: initializationResult,
    };
  }
}

export default PaystackSubscriptionService;
