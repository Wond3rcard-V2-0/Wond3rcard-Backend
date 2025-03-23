import "dotenv/config";
import App from "./app";
import AdminController from "./resources/admin/admin.controller";
import AppInfoController from "./resources/app-info/app-info.controller";
import AuthController from "./resources/auth/auth.controller";
import CardController from "./resources/card/card.controller";
import FAQController from "./resources/faq/faq.controller";
import FeatureFlagsController from "./resources/feature-flag/feature-flag.controller";
import FontsController from "./resources/fonts/font.controller";
import InteractionController from "./resources/interactions/interaction.controller";
import OrganizationController from "./resources/organization/organization.controller";
import ProfileController from "./resources/profile/profile.controller";
import SocialMediaController from "./resources/social-media/social-media.controller";
import UserController from "./resources/user/user.controller";
import validateEnv from "./utils/validate-env";
import PaystackController from "./resources/payments/paystack/paystack.controller";
import StripeController from "./resources/payments/stripe/stripe.controller";
import ManualPaymentController from "./resources/payments/manual/manual.controller";
import TransactionsController from "./resources/payments/transactions.controller";
import GoogleMeetController from "./resources/cloud-meeting/google-meet/meet.controller";
import ZoomController from "./resources/cloud-meeting/zoom/zoom.controller";
import TeamController from "./resources/organization/team/team.controller";

validateEnv();

const app = new App(
  [
    new AppInfoController(),
    new AdminController(),
    new AuthController(),
    new CardController(),
    new FAQController(),
    new FeatureFlagsController(),
    new FontsController(),
    new InteractionController(),
    new OrganizationController(),
    new ProfileController(),
    new SocialMediaController(),
    new UserController(),
    new PaystackController(),
    new StripeController(),
    new ManualPaymentController(),
    new TransactionsController(),
    new GoogleMeetController(),
    new ZoomController(),
    new TeamController(),
  ],
  Number(process.env.PORT)
);

app.listen();
