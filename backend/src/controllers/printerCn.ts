import { Request, Response } from "express";
import path from "path";
import fs from "fs";
import escposPkg from 'escpos';
const { Network } = escposPkg;
const escpos = escposPkg;


type AuthRequest = Request & {
  user?: {
    id: string;
    role: "admin" | "user";
  };
};

export const printReceiptAgain = async (req: AuthRequest, res: Response) => {
  try {
    const receiptNumber = req.query.receiptNumber as string;
    const type = req.query.type as "kitchen" | "delivery";

    if (!receiptNumber) return res.status(400).json({ message: "شماره فیش لازم است" });
    if (!type) return res.status(400).json({ message: "نوع فیش لازم است" });

    const filePath = path.join(process.cwd(), "receipts", type, `${type}_${receiptNumber}.txt`);

    if (!fs.existsSync(filePath))
      return res.status(404).json({ message: "فیش آرشیو پیدا نشد" });

    const content = fs.readFileSync(filePath, "utf-8");

    const printerIp = process.env.DEVICE_PRINTER_IP!;
    if (!printerIp)
      return res.status(500).json({ message: "IP پرینتر تنظیم نشده است" });

    const device = new Network(printerIp);
    const printer = new escpos.Printer(device);

    device.open(() => {
      (printer as any)
        .align("lt")
        .text(content)
        .cut()
        .close();
    });

    return res.json({
      message: `فیش ${type} با شماره ${receiptNumber} دوباره چاپ شد`,
    });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ message: err.message || "خطا در چاپ فیش آرشیو" });
  }
};
