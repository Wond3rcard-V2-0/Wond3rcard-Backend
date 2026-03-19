import { generate } from "otp-generator";
import otpModel from "./otp.model";

class OTPService {
  private opt = otpModel;

  private async generateOtp(): Promise<String | Error> {
    const otp = generate(6, {
      upperCaseAlphabets: false,
      lowerCaseAlphabets: true,
      specialChars: false,
    });
    return otp;
  }

  public async saveOtp(
    userId: string
  ): Promise<{ otp: string; isNew: boolean }> {
    const cooldownMins = 2;
    const cooldownTime = new Date(Date.now() - cooldownMins * 60 * 1000);

    // Check if a valid, unverified OTP was generated within the cooldown period
    const existingOtp = await this.opt.findOne({
      userId,
      isVerified: false,
      createdAt: { $gte: cooldownTime },
    });

    if (existingOtp) {
      return { otp: existingOtp.otp, isNew: false };
    }

    const otp = await this.generateOtp();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour expiry
    const otpDocument = await this.opt.create({ userId, otp, expiresAt });

    return { otp: otpDocument.otp, isNew: true };
  }

  public async verifyOtp(userId: string, otp: string): Promise<boolean> {
    const otpDoc = await this.opt.findOne({ userId: userId, otp: otp });

    if (!otpDoc) return false;
    if (otpDoc.isVerified) return false;
    if (otpDoc.expiresAt < new Date()) return false;

    otpDoc.isVerified = true;
    await otpDoc.save();
    return true;
  }
}

export default OTPService;
