import Kavenegar from "kavenegar";
import dotenv from "dotenv";
dotenv.config();

const api = Kavenegar.KavenegarApi({ apikey: process.env.KAVEHNEGAR_API_KEY! });

interface SmsError { status: number; message: string; code?: number; raw?: any }

export const sendSMS = async (receptor: string, message: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    try {
      api.Send({ sender: "2000660110", message: `${message} — فست فود ایلین`, receptor },
        (response: any, status: number) => {
          if (status === 200 && response?.[0]?.status <= 5) {
            console.log("✅ پیامک ارسال شد:", { receptor, message, messageId: response[0].messageid });
            resolve();
          } else {
            const error: SmsError = { status, message: response?.[0]?.statustext || "خطای ارسال پیامک", code: response?.[0]?.status, raw: response };
            console.error("❌ sendSMS error:", error);
            reject(new Error(JSON.stringify(error)));
          }
        }
      );
    } catch (err) {
      console.error("🚨 sendSMS exception:", err);
      reject(new Error("خطای داخلی در ارسال پیامک"));
    }
  });
};
