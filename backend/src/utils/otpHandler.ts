import redis from "../../src/config/redis.js";

/**
 * کلاس خطاهای OTP
 */
export class OtpError extends Error {
  public code: string;
  constructor(message: string, code: string) {
    super(message);
    this.name = "OtpError";
    this.code = code;
  }
}

/**
 * تولید و ذخیره OTP در Redis
 * @param phone شماره تلفن
 * @param ttl زمان اعتبار به ثانیه (default: 1200 = 20 دقیقه)
 * @returns OTP تولید شده
 * @throws OtpError در صورت خطای Redis
 */
export const generateAndSaveOtp = async (phone: string, ttl = 1200): Promise<string> => {
  try {
    const otpNumber = Math.floor(Math.random() * 1000000);
    const otp = otpNumber.toString().padStart(6, "0");

    const result = await redis.set(`otp:${phone}`, otp, "EX", ttl);

    if (result !== "OK") {
      throw new OtpError("خطا در ذخیره کد تایید در Redis", "REDIS_ERROR");
    }

    console.log(`✅ OTP تولید و ذخیره شد: ${otp} برای شماره ${phone}`);
    return otp;
  } catch (err: any) {
    console.error("❌ خطا در generateAndSaveOtp:", err);
    throw new OtpError("خطای داخلی Redis هنگام تولید OTP", "REDIS_ERROR");
  }
};

/**
 * بررسی و تایید OTP
 * @param phone شماره تلفن
 * @param otp کد تایید
 * @returns true اگر OTP صحیح باشد
 * @throws OtpError در صورت اشتباه بودن OTP یا خطای Redis
 */
export const verifyOtp = async (phone: string, otp: string): Promise<boolean> => {
  try {
    const cachedOtp = await redis.get(`otp:${phone}`);

    if (!cachedOtp) {
      throw new OtpError("کد تایید منقضی شده یا وجود ندارد.", "OTP_EXPIRED");
    }

    if (cachedOtp !== otp) {
      throw new OtpError("کد تایید اشتباه است.", "OTP_INVALID");
    }

    await redis.del(`otp:${phone}`);
    console.log(`✅ OTP برای شماره ${phone} تایید شد`);
    return true;
  } catch (err: any) {
    console.error("❌ خطا در verifyOtp:", err);

    if (err.code === "ECONNREFUSED") {
      throw new OtpError("ارتباط با سرور Redis برقرار نشد.", "REDIS_ERROR");
    }

    throw err;
  }
};
