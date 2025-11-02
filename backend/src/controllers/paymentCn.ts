
import { Request, Response } from "express";
import { createPaymentService, verifyPaymentService } from "@/service/payment.service";
import { logger } from "@/config/logger";

type AuthRequest = Request & { user?: { id: string; role: "admin" | "user" } };

export const createPayment = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new Error("کاربر لاگین نکرده است");

    const result = await createPaymentService(userId);
    res.json({ ok: true, ...result });
  } catch (err: any) {
    logger.error(`createPaymentController: ${err.message}`);
    res.status(500).json({ ok: false, message: err.message });
  }
};

export const verifyPayment = async (req: AuthRequest, res: Response) => {
  try {
    const { Authority, Status } = req.query;
    const paymentId = req.params.id;

    if (!Authority || !Status) throw new Error("پارامترهای الزامی ارسال نشده");

    const result = await verifyPaymentService(paymentId, Authority.toString(), Status.toString());
    res.json({ ok: true, ...result });
  } catch (err: any) {
    logger.error(`verifyPaymentController: ${err.message}`);
    res.status(500).json({ ok: false, message: err.message });
  }
};
