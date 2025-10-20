import Kavenegar from "kavenegar";
import dotenv from "dotenv";

dotenv.config();

const api = Kavenegar.KavenegarApi({
  apikey: process.env.KAVEHNEGAR_API_KEY!,
});

interface SmsError {
  status: number;
  message: string;
  code?: number;
  raw?: any;
}

/**
 * ارسال پیامک از طریق Kavenegar با مدیریت خطای دقیق‌تر
 */
export const sendSMS = async (receptor: string, message: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    try {
      api.Send(
        {
          sender: "2000660110",
          message: `${message} — فست فود ایلین، کد اختصاصی شما`,
          receptor,
        },
        (response: any, status: number) => {
          if (status === 200 && response && response[0]?.status === 1) {
            console.log("✅ پیامک ارسال شد:", {
              receptor,
              message,
              messageId: response[0].messageid,
            });
            resolve();
          } else {
            const error: SmsError = {
              status,
              message:
                response?.[0]?.statustext ||
                "خطای نامشخص در ارسال پیامک از Kavenegar",
              code: response?.[0]?.status,
              raw: response,
            };

            console.error("❌ خطا در ارسال پیامک:", error);
            reject(new Error(JSON.stringify(error)));
          }
        }
      );
    } catch (err) {
      const error: SmsError = {
        status: 500,
        message: "❌ خطای داخلی در اجرای درخواست ارسال پیامک",
        raw: err,
      };
      console.error("🚨 Exception:", error);
      reject(new Error(JSON.stringify(error)));
    }
  });
};
