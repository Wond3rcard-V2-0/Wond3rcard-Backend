import bcrypt from "bcrypt";
import * as jwt from "jsonwebtoken";
import path from "path";
import qrCode from "qrcode";
import speakeasy from "speakeasy";
import HttpException from "../../exceptions/http.exception";
import logger from "../../services/logger/logger";
import { renameUploadedFile } from "../../services/multers.config";
import token from "../../utils/token";
import MailTemplates from "../mails/mail.templates";
import NodeMailerService from "../mails/nodemailer.service";
import OTPService from "../otp/otp.service";
import profileModel from "../profile/profile.model";
import userModel from "../user/user.model";
import { User } from "../user/user.protocol";

class AuthService {
  private user = userModel;
  private profile = profileModel;
  private otpService = new OTPService();
  private mailer = new NodeMailerService();

  public async signUp(
    firstName,
    lastName,
    otherName,
    email,
    mobileNumber,
    password,
    fcmToken,
    companyName,
    designation,
    profilePhoto?: Express.Multer.File,
    coverPhoto?: Express.Multer.File,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      const username = email.split("@")[0];

      const user = await this.user.create({
        username,
        email,
        password,
        fcmToken,
      });

      let profileUrl = "";
      if (profilePhoto != null && profilePhoto.destination != null) {
        const profilePhotoDestination = profilePhoto.destination;
        const profilePhotoFileame = profilePhoto.filename;
        const profileFileExt = path.extname(profilePhoto.originalname);
        const newProfilePhotoFileame = `profilePhoto_${user.id}${profileFileExt}`;
        await renameUploadedFile(
          profilePhotoFileame,
          newProfilePhotoFileame,
          profilePhotoDestination,
        );
        profileUrl = `${profilePhotoDestination}/${newProfilePhotoFileame}`;
      }

      let coverUrl = "";
      if (coverPhoto != null && coverPhoto.destination != null) {
        const coverPhotoDestination = coverPhoto.destination;
        const coverPhotoFileame = coverPhoto.filename;
        const coverFileExt = path.extname(profilePhoto.originalname);
        const newCoverPhotoFileame = `coverPhoto_${user.id}${coverFileExt}`;
        await renameUploadedFile(
          coverPhotoFileame,
          newCoverPhotoFileame,
          coverPhotoDestination,
        );
        coverUrl = `${coverPhotoDestination}/${newCoverPhotoFileame}`;
      }

      const tokenSession = token.generateSessionId();
      const refreshSession = token.generateSessionId();
      const accessToken = await token.createToken(user, tokenSession);
      const refreshToken = await token.createRefreshToken(user, refreshSession);
      user.refreshToken = refreshToken;
      await user.save();
      // ? abstract it out tp private method???
      await this.profile.create({
        uid: `${user.id}`,
        firstname: firstName,
        lastname: lastName,
        othername: otherName,
        mobileNumber: mobileNumber,
        companyName: companyName,
        email: email,
        designation: designation,
        profileUrl: profileUrl,
        coverUrl: coverUrl,
      });

      const { otp } = await this.otpService.saveOtp(user.id);

      const emailData = {
        userName: firstName,
        otpCode: otp,
      };

      const template = MailTemplates.welcomeWithOtp;

      try {
        console.log("Attempting to send welcome + OTP email...");
        await this.mailer.sendMail(
          email,
          "Welcome to Wond3rCard, Kindly Verify Your Account",
          template,
          "Welcome",
          emailData,
        );
        console.log("Welcome + OTP email sent successfully!");
      } catch (mailError) {
        console.error("Error sending welcome + OTP email:", mailError);
      }

      return { accessToken, refreshToken };
    } catch (error) {
      if (error.code === 11000) {
        const duplicateField = Object.keys(error.keyPattern)[0];
        const duplicateValue = error.keyValue[duplicateField];
        throw new HttpException(
          409,
          "error",
          `Duplicate ${duplicateField}: ${duplicateValue} is already existed.`,
        );
      } else {
        throw new HttpException(440, "error", `Unable to sign up ${error}`);
      }
    }
  }

  public async deleteAccount(u: User): Promise<void | Error> {
    const uid = u.id;
    try {
      const user = await this.user.findOne({ uid });

      if (!user) {
        throw new HttpException(400, "error", "User could not be found");
      }

      await Promise.all([this.profile.findOneAndDelete({ uid: user.id })]);

      await user.deleteOne();

      logger.info(
        `User with email ${user.email} and all related data were deleted.`,
      );
    } catch (error) {
      console.error(`Failed to delete user: ${error}`);
      throw new HttpException(
        400,
        "error",
        "Failed to delete account and related data",
      );
    }
  }

  public async signIn(
    email: string,
    password: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      const user = await this.user.findOne({ email });

      if (!user) {
        throw new HttpException(404, "not_found", "User not found");
      }

      // Check if account is locked
      if (user.lockUntil && user.lockUntil > new Date()) {
        const timeRemaining = Math.ceil(
          (user.lockUntil.getTime() - new Date().getTime()) / 60000,
        );
        throw new HttpException(
          423,
          "error",
          `Account locked due to too many failed login attempts. Try again after ${timeRemaining} minutes`,
        );
      }

      // Validate password
      if (!(await user.isValidPassword(password))) {
        // Increment failed login attempts
        user.failedLoginAttempts += 1;
        if (user.failedLoginAttempts >= 5) {
          // Lock account for 15 minutes
          user.lockUntil = new Date(Date.now() + 15 * 60 * 1000);
          await user.save();
          throw new HttpException(
            423,
            "error",
            "Account locked due to too many failed login attempts. Try again after 15 minutes",
          );
        }
        await user.save();
        throw new HttpException(400, "error", "Invalid login credentials");
      }

      // Successful login - reset tracking fields
      user.failedLoginAttempts = 0;
      user.lockUntil = null;
      await user.save();

      // Generate access & refresh tokens
      const tokenSession = token.generateSessionId();
      const refreshSession = token.generateSessionId();
      const accessToken = token.createToken(user, tokenSession);
      const refreshToken = token.createRefreshToken(user, refreshSession);

      return { accessToken, refreshToken };
    } catch (error) {
      throw new HttpException(
        400,
        "error",
        `Couldn't sign in: ${error.message}`,
      );
    }
  }

  public async refreshTokens(
    refreshToken: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      const decoded = await token.verifyRefreshToken(refreshToken);
      const user = await this.user.findById(decoded);
      if (!user) throw new HttpException(404, "error", "User not found");
      const tokenSession = token.generateSessionId();
      const refreshSession = token.generateSessionId();
      const newAccessToken = await token.createToken(user, tokenSession);
      const newRefreshToken = await token.createRefreshToken(
        user,
        refreshSession,
      );

      return { accessToken: newAccessToken, refreshToken: newRefreshToken };
    } catch (error) {
      console.error("Error refreshi ng tokens:", error);
      throw new HttpException(403, "error", "Refresh token invalid or expired");
    }
  }

  public async sendVerificationOTP(
    user: User,
    firstName: string,
  ): Promise<void | Error> {
    try {
      //
      const uid = user.id;
      const { otp, isNew } = await this.otpService.saveOtp(uid);

      if (!isNew) {
        console.log(`[sendVerificationOTP] Reusing recent OTP for ${uid}. Skipping email send.`);
        return;
      }

      const emailData = {
        userName: firstName,
        otpCode: otp,
        verifyLink: `https://yourapp.com/verify?token=${otp}`,
      };

      const template = MailTemplates.otpVerification;

      await this.mailer.sendMail(
        user.email,
        "Account Verification",
        template,
        "Verification",
        emailData,
      );
    } catch (error) {
      throw new HttpException(
        401,
        "sendVerificationOTP",
        `sendVerificationOTP: ${error}`,
      );
    }
  }

  public async sendAccountVerificationOTP(
    email: string,
  ): Promise<String | Error> {
    try {
      let error = "";
      const user = await userModel.findOne({ email });
      const uid = user.id;
      const profile = await profileModel.findOne({ uid });

      if (!user) {
        error = "User could not be found";
        return error;
      }
      if (!user) {
        logger.error(`Profile not found ${email}`);
        error = "Server error";
        return error;
      }
      //
      const { otp, isNew } = await this.otpService.saveOtp(uid);

      if (!isNew) {
        console.log(`[sendAccountVerificationOTP] Reusing recent OTP for ${email}. Skipping email send.`);
        return;
      }

      const emailData = {
        userName: profile.firstname,
        otpCode: `${otp}`,
        verifyLink: `https://yourapp.com/verify?token=${otp}`,
      };

      const template = MailTemplates.otpVerification;

      await this.mailer.sendMail(
        email,
        "Account Verification",
        template,
        "Verification",
        emailData,
      );
    } catch (error) {
      throw new HttpException(
        401,
        "sendVerificationOTP",
        `sendAccountVerificationOTP: ${error}`,
      );
    }
  }

  public async forgotPassword(email: string): Promise<void> {
    try {
      const user = await this.user.findOne({ email: email });

      if (!user) {
        throw new HttpException(404, "not_found", `User not found`);
      }

      const uid = user.id;
      const profile = await this.profile.findOne({ uid });

      if (!profile) {
        throw new HttpException(404, "not_found", `profile not found`);
      }

      const { otp, isNew } = await this.otpService.saveOtp(uid);

      if (!isNew) {
        console.log(`[forgotPassword] Reusing recent OTP for ${email}. Skipping email send.`);
        return;
      }

      const NODE_ENV = process.env.NODE_ENV;
      const liveUrl = "https://wond3rcard-backend-rgmx.onrender.com/api/";
      const live = `${liveUrl}/auth/verify-otp?code=${otp}`;
      const local = `http://localhost:3000/api/auth/verify-otp?code=${otp}`;
      const resetLink = NODE_ENV === "production" ? live : local;

      const emailData = {
        userName: profile.firstname,
        otpCode: `${otp}`,
        resetPasswordLink: resetLink,
      };

      const template = MailTemplates.passwordResetRequest;

      await this.mailer.sendMail(
        email,
        "Forgot Password Verification",
        template,
        "Verification",
        emailData,
      );
    } catch (error) {
      throw new HttpException(
        401,
        "error",
        `Could not send verification OTP ${error}`,
      );
    }
  }

  public async verifyAccountOTP(
    email: string,
    otpCode: string,
  ): Promise<string | Error> {
    try {
      const user = await userModel.findOne({ email: email });
      if (!user) {
        throw new HttpException(
          400,
          "not found",
          "User account could not be found",
        );
      }

      const uid = user.id;

      const verified = await this.otpService.verifyOtp(uid, otpCode);
      const profile = await profileModel.findOne({ uid: uid });

      if (!verified) {
        throw new HttpException(
          400,
          "otp_expired",
          "OTP Code expired or invalid",
        );
      }

      if (user.isVerified) {
        const emailData = {
          userName: profile.firstname,
          companyName: `Wond3r Card`,
          supportLink: "wond3rcard.com/support",
        };

        const template = MailTemplates.accountAlreadyVerified;

        await this.mailer.sendMail(
          email,
          "Account Already Verified",
          template,
          "Others",
          emailData,
        );

        throw new HttpException(
          400,
          "already_verified",
          "Account Already Verified",
        );
      } else {
        console.log(`User account verified: ${user.isVerified}`);

        user.isVerified = true;
        await user.save();

        const emailData = {
          userName: profile.firstname,
          companyName: `Wond3r Card`,
          supportLink: "wond3rcard.com/support",
        };

        const template = MailTemplates.accountVerified;

        await this.mailer.sendMail(
          email,
          "Account Verification",
          template,
          "Verification",
          emailData,
        );

        return "Account successfully verified";
      }
    } catch (error: any) {
      throw new HttpException(
        401,
        "error",
        error.message || "Could not verify OTP",
      );
    }
  }

  public async verifyOTP(
    email: string,
    otpCode: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      const user = await this.user.findOne({ email: email });
      if (!user) {
        throw new HttpException(
          419,
          "419",
          "419: please check your credentials",
        );
      }
      const uid = user.id;

      const verified = await this.otpService.verifyOtp(uid, otpCode);
      if (verified === false) {
        throw new HttpException(
          400,
          "otp_expired",
          "OTP Code expired or invalid",
        );
      }

      const tokenSession = token.generateSessionId();
      const refreshSession = token.generateSessionId();
      const accessToken = await token.createToken(user, tokenSession);
      const refreshToken = await token.createRefreshToken(user, refreshSession);

      return { accessToken, refreshToken };
    } catch (error) {
      throw new HttpException(401, "error", `Could not verify OTP: ${error}`);
    }
  }

  public async changePassword(
    email: string,
    password: string,
  ): Promise<{ accessToken: string; refreshToken: string } | Error> {
    try {
      const user = await this.user.findOne({ email });
      if (!user) {
        return new Error("User not found");
      }

      const hash = await bcrypt.hash(password, 10);

      const newPassword = hash;

      const tokenSession = token.generateSessionId();
      const refreshSession = token.generateSessionId();
      const accessToken = await token.createToken(user, tokenSession);
      const refreshToken = await token.createRefreshToken(user, refreshSession);

      await user.updateOne({
        password: newPassword,
        refreshToken: refreshToken,
      });
      const uid = user.id;

      const profile = await profileModel.findOne({ uid });

      const emailData = {
        userName: profile.firstname,
        companyName: `Wond3r Card`,
        supportLink: "wond3rcard.com/support",
      };

      const template = MailTemplates.passwordChangedSuccessfully;

      await this.mailer.sendMail(
        email,
        "Password Changed Successfully",
        template,
        "Success",
        emailData,
      );
      return { accessToken, refreshToken };
    } catch (error) {
      throw new HttpException(401, "error", "Could not change password");
    }
  }

  public async request2FA(user: User): Promise<void> {
    try {
      const uid = user.id;
      const profile = await profileModel.findOne({ uid });

      const { otp, isNew } = await this.otpService.saveOtp(uid);

      if (!isNew) {
        console.log(`[request2FA] Reusing recent OTP for ${user.email}. Skipping email send.`);
        return;
      }

      const emailData = {
        name: profile.firstname,
        companyName: `Wond3r Card`,
        otpCode: otp,
        supportLink: "wond3rcard.com/support",
      };

      const template = MailTemplates.request2FA;

      await this.mailer.sendMail(
        user.email,
        "Your OTP Code for Enabling Two-Factor Authentication",
        template,
        "security",
        emailData,
      );
    } catch (error) {
      throw new HttpException(400, "2fa failed", "unable to setup 2fa");
    }
  }

  public async enable2FA(user: User, optCode: string): Promise<void> {
    try {
      const uid = user.id;
      const verified = await this.otpService.verifyOtp(uid, optCode);
      if (verified === false) {
        throw new HttpException(
          400,
          "otp_expired",
          "OTP Code expired or invalid",
        );
      }

      user.is2FAEnabled = true;
      await user.save();

      const profile = await this.profile.findOne({ uid: uid });

      const emailData = {
        name: profile.firstname,
        companyName: `Wond3r Card`,
        supportLink: "wond3rcard.com/support",
      };

      const template = MailTemplates.enable2FA;

      await this.mailer.sendMail(
        user.email,
        "Two-Factor Authentication Enabled (2FA)",
        template,
        "security",
        emailData,
      );
    } catch (error) {
      throw new HttpException(
        400,
        "2fa failed",
        `unable to setup 2fa ${error}`,
      );
    }
  }

  public async createMFA(user: User): Promise<String[] | Error> {
    var secret = await speakeasy.generateSecret();
    user.mfaSecret = secret.base32;
    user.mfaEnabled = true;
    await user.save();
    const url = speakeasy.otpauthURL({
      secret: secret.base32,
      label: `${user.username}`,
      issuer: `Wond3r Card`,
      encoding: "base32",
    });
    const qrImageUrl = await qrCode.toDataURL(url);
    return [secret, qrImageUrl];
  }

  public async verifyMFA(user: User, code: string): Promise<string | Error> {
    if (!user) {
      throw new HttpException(401, "error", "User not authenticated");
    }

    if (!user.mfaSecret) {
      throw new HttpException(
        401,
        "error",
        "Multi-Factor Authentication is not enable for this user",
      );
    }

    try {
      const verified = speakeasy.totp.verify({
        secret: user.mfaSecret,
        encoding: "base32",
        token: code,
      });

      console.log(`Verification result: ${verified}`);

      if (!verified) {
        throw new HttpException(400, "fail", "Invalid 2FA code");
      }

      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        throw new HttpException(500, "error", "JWT secret is not configured");
      }

      const jwtToken = jwt.sign({ name: user.email, id: user._id }, jwtSecret, {
        expiresIn: "1h",
      });

      return jwtToken;
    } catch (error) {
      console.error("Error during 2FA verification:", error);
      throw new HttpException(500, "error", "Error during 2FA verification");
    }
  }

  public async resetMFA(user: User): Promise<boolean | Error> {
    if (!user) {
      throw new HttpException(400, "error", "User not found");
    }

    try {
      user.mfaSecret = "";
      user.mfaEnabled = false;
      await user.save();

      return true;
    } catch (error) {
      console.error("Error resetting 2FA:", error);
      throw new HttpException(500, "error", "Could not reset 2FA");
    }
  }

  async #hasEnabled2FA(uid: string, optCode: string) {
    if (!optCode) {
      const { otp, isNew } = await this.otpService.saveOtp(uid);

      if (isNew) {
        const profile = await this.profile.findOne({ uid: uid });

        const emailData = {
          userName: profile.firstname,
          otpCode: otp,
          verifyLink: `https://yourapp.com/verify?token=${otp}`,
        };

        const template = MailTemplates.otpCode;

        await this.mailer.sendMail(
          profile.email,
          "2FA OTP Code",
          template,
          "Verification",
          emailData,
        );
      }

      throw new HttpException(
        400,
        "2fa_enabled",
        "Two Factor Authentication Enabled. Please provide OTP",
      );
    }

    const verified = await this.otpService.verifyOtp(uid, optCode);
    if (verified === false) {
      throw new HttpException(
        400,
        "otp_expired",
        "OTP Code expired or invalid",
      );
    }
  }

  #hasEnabledMFA(user: User, mfaCode: string) {
    if (!mfaCode) {
      throw new HttpException(
        400,
        "hasEnabledMFA",
        "Multi-Factor Authentication Enabled. Invalid Multi Factor Authentication (MFA) code",
      );
    }
    const verified = speakeasy.totp.verify({
      secret: user.mfaSecret,
      encoding: "base32",
      token: mfaCode,
    });

    if (!verified) {
      throw new HttpException(
        400,
        "hasEnabledMFA",
        "Invalid Multi Factor Authentication (MFA) code",
      );
    }
  }
}

export default AuthService;
