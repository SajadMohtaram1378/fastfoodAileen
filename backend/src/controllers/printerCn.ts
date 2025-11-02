import { Request, Response } from "express";
import path from "path";
import fs from "fs";
import escposPkg from "escpos";
import { logger } from "@/config/logger";
const { Network, Printer } = escposPkg;

type AuthRequest = Request & {
  user?: { id: string; role: "admin" | "user" };
};

export const printReceiptAgain = async (req: AuthRequest, res: Response) => {
  try {
    const { receiptNumber, type } = req.query as { receiptNumber: string; type: "kitchen" | "delivery" };

    const filePath = path.join(process.cwd(), "receipts", type, `${type}_${receiptNumber}.txt`);
    if (!fs.existsSync(filePath)) {
      logger.warn(`فیش آرشیو پیدا نشد: ${filePath}`);
      return res.status(404).json({ ok: false, message: "فیش آرشیو پیدا نشد" });
    }

    const content = fs.readFileSync(filePath, "utf-8");

    const printerIp = process.env.DEVICE_PRINTER_IP!;
    if (!printerIp) throw new Error("IP پرینتر تنظیم نشده است");

    const device = new Network(printerIp);
    const printer = new Printer(device);

    device.open(() => {
      (printer as any)
        .align("lt")
        .text(content)
        .cut()
        .close();
    });

    logger.info(`فیش ${type} شماره ${receiptNumber} دوباره چاپ شد`);
    return res.json({ ok: true, message: `فیش ${type} با شماره ${receiptNumber} دوباره چاپ شد` });
  } catch (err: any) {
    logger.error(`printReceiptAgainController: ${err.message}`);
    return res.status(500).json({ ok: false, message: err.message || "خطا در چاپ فیش آرشیو" });
  }
};
