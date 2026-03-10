import { NextFunction, Request, Response, Router } from "express";
import HttpException from "../../exceptions/http.exception";
import authenticatedMiddleware from "../../middlewares/authenticated.middleware";
import passportMiddleware from "../../middlewares/passport.middleware";
import validationMiddleware from "../../middlewares/validation.middleware";
import GeneralController from "../../protocols/global.controller";
import { uploadProfileAndCoverMiddleware } from "../../middlewares/uploaders/uploadProfileAndCover";
import AuthService from "./auth.service";
import validate from "./auth.validators";
import { signInRateLimiter, forgotPasswordRateLimiter } from "../../middlewares/authRateLimiter";

class AuthController implements GeneralController {
  public path = "/auth";
  public router = Router();
  private authService = new AuthService();

  constructor() {
    this.initializeRoute();
  }

  initializeRoute(): void {
    /**
     * @openapi
     * /api/auth/sign-up:
     *   post:
     *     tags: [auth]
     *     summary: Register a new user account
     *     requestBody:
     *       required: true
     *       content:
     *         multipart/form-data:
     *           schema:
     *             type: object
     *             required:
     *               - firstName
     *               - lastName
     *               - email
     *               - password
     *             properties:
     *               firstName:
     *                 type: string
     *               lastName:
     *                 type: string
     *               otherName:
     *                 type: string
     *               email:
     *                 type: string
     *               mobileNumber:
     *                 type: string
     *               password:
     *                 type: string
     *                 format: password
     *               fcmToken:
     *                 type: string
     *               companyName:
     *                 type: string
     *               designation:
     *                 type: string
     *               profilePhoto:
     *                 type: string
     *                 format: binary
     *               coverPhoto:
     *                 type: string
     *                 format: binary
     *     responses:
     *       201:
     *         description: User created and verification email sent
     */
    this.router.post(
      `${this.path}/sign-up`,
      uploadProfileAndCoverMiddleware,
      validationMiddleware(validate.validateSignUp),
      this.signUp
    );

    /**
     * @openapi
     * /api/auth/verify-account:
     *   post:
     *     tags: [auth]
     *     summary: Verify new account using OTP
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required: [email, otp]
     *             properties:
     *               email:
     *                 type: string
     *               otp:
     *                 type: string
     *     responses:
     *       201:
     *         description: Account verified
     */
    this.router.post(
      `${this.path}/verify-account`,
      validationMiddleware(validate.validateVerifyAccount),
      this.verifyAccount
    );

    /**
     * @openapi
     * /api/auth/request-verify-account:
     *   post:
     *     tags: [auth]
     *     summary: Request verification OTP email
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required: [email]
     *             properties:
     *               email:
     *                 type: string
     *     responses:
     *       201:
     *         description: Verification instructions sent
     */
    this.router.post(
      `${this.path}/request-verify-account`,
      validationMiddleware(validate.validateRequestVerifyAccount),
      this.requestAccountVerification
    );

    /**
     * @openapi
     * /api/auth/delete-account:
     *   delete:
     *     tags: [auth]
     *     summary: Delete authenticated user's account
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       201:
     *         description: Account deleted
     */
    this.router.delete(
      `${this.path}/delete-account`,
      [authenticatedMiddleware],
      this.deleteAccount
    );

    /**
     * @openapi
     * /api/auth/sign-in:
     *   post:
     *     tags: [auth]
     *     summary: Sign in with email and password
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required: [email, password]
     *             properties:
     *               email:
     *                 type: string
     *               password:
     *                 type: string
     *                 format: password
     *     responses:
     *       200:
     *         description: Sign-in successful
     *       429:
     *         description: Too many login attempts from this IP
     */
    this.router.post(
      `${this.path}/sign-in`,
      signInRateLimiter,
      validationMiddleware(validate.validateSignIn),
      this.signIn
    );

    /**
     * @openapi
     * /api/auth/refresh-token:
     *   post:
     *     tags: [auth]
     *     summary: Refresh access token
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required: [refreshToken]
     *             properties:
     *               refreshToken:
     *                 type: string
     *     responses:
     *       200:
     *         description: New tokens issued
     */
    this.router.post(`${this.path}/refresh-token`, this.refreshToken);

    // this.router.post(`${this.path}/logout`, [passportMiddleware], this.logout);

    /**
     * @openapi
     * /api/auth/forgot-password:
     *   post:
     *     tags: [auth]
     *     summary: Request password reset OTP
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required: [email]
     *             properties:
     *               email:
     *                 type: string
     *     responses:
     *       201:
     *         description: OTP sent
     *       429:
     *         description: Too many request attempts from this IP
     */
    this.router.post(
      `${this.path}/forgot-password`,
      forgotPasswordRateLimiter,
      validationMiddleware(validate.validateDeleteAccount),
      this.forgotPassword
    );

    /**
     * @openapi
     * /api/auth/verify-otp:
     *   post:
     *     tags: [auth]
     *     summary: Verify password reset OTP
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required: [email, code]
     *             properties:
     *               email:
     *                 type: string
     *               code:
     *                 type: string
     *     responses:
     *       201:
     *         description: OTP verified
     */
    this.router.post(
      `${this.path}/verify-otp`,
      [validationMiddleware(validate.validateOTPCode)],
      this.verifyOTP
    );

    /**
     * @openapi
     * /api/auth/change-password:
     *   post:
     *     tags: [auth]
     *     summary: Change password after OTP verification
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required: [email, newPassword]
     *             properties:
     *               email:
     *                 type: string
     *               newPassword:
     *                 type: string
     *                 format: password
     *     responses:
     *       201:
     *         description: Password changed
     */
    this.router.post(
      `${this.path}/change-password`,
      [
        authenticatedMiddleware,
        validationMiddleware(validate.validateChangePasswordReset),
      ],
      this.changePassword
    );

    // this.router.post(`${this.path}/logout`, [passportMiddleware], this.logout);

    /**
     * @openapi
     * /api/auth/setup-mfa:
     *   post:
     *     tags: [auth]
     *     summary: Initialize MFA setup
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: MFA secret generated
     */
    this.router.post(
      `${this.path}/setup-mfa`,
      [authenticatedMiddleware],
      this.setupMFA
    );

    /**
     * @openapi
     * /api/auth/verify-mfa:
     *   post:
     *     tags: [auth]
     *     summary: Verify MFA token
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               token:
     *                 type: string
     *     responses:
     *       200:
     *         description: MFA verified
     */
    this.router.post(
      `${this.path}/verify-mfa`,
      validationMiddleware(validate.validateVerifyMFA),
      [authenticatedMiddleware],
      this.verifyMFA
    );

    /**
     * @openapi
     * /api/auth/reset-mfa:
     *   post:
     *     tags: [auth]
     *     summary: Reset MFA configuration
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: MFA reset request processed
     */
    this.router.post(
      `${this.path}/reset-mfa`,
      [authenticatedMiddleware],
      this.resetMFA
    );

    /**
     * @openapi
     * /api/auth/request-2fa:
     *   post:
     *     tags: [auth]
     *     summary: Request 2FA setup instructions
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       201:
     *         description: Instructions sent
     */
    this.router.post(
      `${this.path}/request-2fa`,
      [authenticatedMiddleware],
      this.request2FA
    );

    /**
     * @openapi
     * /api/auth/enable-2fa:
     *   post:
     *     tags: [auth]
     *     summary: Enable 2FA with OTP
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required: [otpCode]
     *             properties:
     *               otpCode:
     *                 type: string
     *     responses:
     *       201:
     *         description: 2FA enabled
     */
    this.router.post(
      `${this.path}/enable-2fa`,
      [authenticatedMiddleware],
      this.enable2FA
    );
  }

  private signUp = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const {
        firstName,
        lastName,
        otherName,
        email,
        mobileNumber,
        password,
        fcmToken,
        companyName,
        designation,
      } = req.body;
      const f = req.files;
      const profilePhoto = req.files?.["profilePhoto"]?.[0];
      const coverPhoto = req.files?.["coverPhoto"]?.[0];

      const { accessToken, refreshToken } = await this.authService.signUp(
        firstName,
        lastName,
        otherName,
        email,
        mobileNumber,
        password,
        fcmToken,
        companyName,
        designation,
        profilePhoto,
        coverPhoto
      );

      res.status(201).json({
        status: "success",
        message:
          "signed up successfully. Please check your email for verification",
        payload: { accessToken, refreshToken },
      });
    } catch (error: any) {
      console.log(`${error}`);
      next(new HttpException(400, "error", error.message));
    }
  };

  private verifyAccount = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { email, otp } = req.body;
      await this.authService.verifyAccountOTP(email, otp);

      res.status(201).json({
        status: "success",
        message: "Account verified successfully",
      });
    } catch (error: any) {
      next(error);
    }
  };

  private requestAccountVerification = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { email } = req.body;
      const error = await this.authService.sendAccountVerificationOTP(email);

      if (error && error !== "" && error === undefined) {
        res
          .status(201)
          .json({ statusCode: 400, status: "error", message: error });
      } else {
        res.status(201).json({
          status: "success",
          message: "Account verification instructions successfully",
        });
      }
    } catch (error: any) {
      console.log(`requestAccountVerification### ${error}`);
      next(new HttpException(400, "error", error.message));
    }
  };

  private deleteAccount = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const user = req.user;
      await this.authService.deleteAccount(user);

      res
        .status(201)
        .json({ status: "success", message: "Account deleted successfully" });
    } catch (error: any) {
      console.log(`${error}`);
      next(new HttpException(400, "error", error.message));
    }
  };

  private signIn = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { email, password } = req.body;

      // Call the authService with just email & password
      const { accessToken, refreshToken } = await this.authService.signIn(
        email,
        password
      );

      res.status(200).json({
        status: "success",
        message: "Sign-in successful",
        payload: { accessToken, refreshToken },
      });
    } catch (error: any) {
      next(new HttpException(400, "error", error.message));
    }
  };

  private forgotPassword = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { email } = req.body;
      await this.authService.forgotPassword(email);

      res.status(201).json({
        status: "success",
        message: "OTP for resetting password sent successfully",
      });
    } catch (error) {
      next(error);
    }
  };

  private verifyOTP = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { email, code } = req.body;
      const { accessToken, refreshToken } = await this.authService.verifyOTP(
        email,
        code
      );

      res.status(201).json({
        status: "success",
        message: "Password OTP verified successfully",
        payload: {
          accessToken: accessToken,
          refreshToken: refreshToken,
        },
      });
    } catch (error: any) {
      console.log(`${error}`);
      next(new HttpException(400, "error", error.message));
    }
  };

  private changePassword = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { email, newPassword } = req.body;
      const result = await this.authService.changePassword(email, newPassword);
      if (result instanceof Error) {
        res.status(400).json({
          statusCode: 400,
          status: "error",
          message: result.message,
        });
      } else {
        const { accessToken, refreshToken } = result;
        res.status(201).json({
          status: "success",
          message: "password changed",
          payload: { accessToken, refreshToken },
        });
      }
    } catch (error: any) {
      console.log(`${error}`);
      next(new HttpException(400, "error", error.message));
    }
  };

  private refreshToken = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) {
        throw new HttpException(400, "error", "Refresh token is required");
      }
      const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
        await this.authService.refreshTokens(refreshToken);
      // todo send email notification
      res.status(200).json({
        statsu: "success",
        message: "token reset",
        payload: { newAccessToken, newRefreshToken },
      });
    } catch (error: any) {
      next(new HttpException(403, "error", error.message));
    }
  };

  private logout = (
    req: Request,
    res: Response,
    next: NextFunction
  ): Response | void => { };

  private request2FA = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const user = req.user;
      await this.authService.request2FA(user);

      res.status(201).json({
        status: "success",
        message: "2FA instructions sent for verification",
      });
    } catch (error) {
      next(error);
    }
  };

  private enable2FA = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const user = req.user;
      const { otpCode } = req.body;
      await this.authService.enable2FA(user, otpCode);

      res.status(201).json({
        status: "success",
        message: "Two Factor Authentication (2FA) Enabled",
      });
    } catch (error) {
      next(error);
    }
  };

  private setupMFA = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const user = req.user;
      if (!user) res.status(301).json({ message: "user not found" });
      const data = await this.authService.createMFA(user);
      const secret = data[0];
      const qrImageUrl = data[1];
      res.status(200).json({ secret: secret.base32, qrUrl: qrImageUrl });
    } catch (error) {
      next(error);
    }
  };

  private verifyMFA = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { code } = req.body;
      const user = req.user;

      if (!user) {
        throw new HttpException(401, "fail", "User not authenticated");
      }

      const token = await this.authService.verifyMFA(user, code);
      res
        .status(200)
        .json({ message: "2FA verified successfully", token: token });
    } catch (error) {
      next(error);
    }
  };

  private resetMFA = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const user = req.user;
      if (!user) {
        return next(new HttpException(401, "error", "User not authenticated"));
      }

      const result = await this.authService.resetMFA(user);

      if (result) {
        res.status(200).json({
          message: "Multi-Factor Authentication has been reset successfully",
        });
      } else {
        next(new HttpException(500, "error", "Failed to reset 2FA"));
      }
    } catch (error) {
      next(error);
    }
  };
}

export default AuthController;
