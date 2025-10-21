import redis from "../config/redis.js";

export class OtpError extends Error {
  public code: string;
  constructor(message: string, code: string) {
    super(message);
    this.name = "OtpError";
    this.code = code;
  }
}

export const generateAndSaveOtp = async (phone: string, ttl = 1200): Promise<string> => {
  try {
    const otp = Math.floor(Math.random() * 1000000).toString().padStart(6, "0");
    const result = await redis.set(`otp:${phone}`, otp, "EX", ttl);
    if (result !== "OK") throw new OtpError("خطا در ذخیره کد تایید در Redis", "REDIS_ERROR");
    await redis.set(`otpLookup:${otp}`, phone, "EX", ttl);
    console.log(`✅ OTP تولید شد: ${otp} برای شماره ${phone}`);
    return otp;
  } catch (err: any) {
    console.error("❌ generateAndSaveOtp error:", { message: err.message, stack: err.stack });
    throw new OtpError("خطای داخلی Redis هنگام تولید OTP", "REDIS_ERROR");
  }
};

export const verifyOtp = async (phone: string, otp: string): Promise<boolean> => {
  try {
    const cachedOtp = await redis.get(`otp:${phone}`);
    if (!cachedOtp) throw new OtpError("کد تایید منقضی شده یا وجود ندارد.", "OTP_EXPIRED");
    if (cachedOtp !== otp) throw new OtpError("کد تایید اشتباه است.", "OTP_INVALID");
    await redis.del(`otp:${phone}`);
    console.log(`✅ OTP برای شماره ${phone} تایید شد`);
    return true;
  } catch (err: any) {
    console.error("❌ verifyOtp error:", { message: err.message, code: err.code, stack: err.stack });
    throw err;
  }
};
