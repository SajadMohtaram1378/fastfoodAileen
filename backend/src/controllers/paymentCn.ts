import { Request, Response } from "express";
import Cart from "../../src/models/Cart.js";
import Payment from "../../src/models/Payment.js";
import axios from "axios";
import Order from "../../src/models/Order.js";

type AuthRequest = Request & {
  user?: {
    id: string;
    role: "admin" | "user";
  };
};

export const createPayment = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const cart = await Cart.findOne({ userId });
    if (!cart || cart.items.length === 0)
      return res.status(404).json({ message: "سبد خرید خالی است" });
    const amount = cart.totalPrice * 10; // تومان → ریال
    // ساخت رکورد Payment
    const payment = await Payment.create({ userId, amount });
    const response = await axios.post(
      "https://sandbox.zarinpal.com/pg/rest/WebGate/PaymentRequest.json",
      {
        MerchantID: process.env.ZARINPAL_MERCHANT_ID,
        Amount: amount,
        CallbackURL: `http://localhost:5000/api/payment/verify/${payment._id}`,
        Description: "پرداخت سفارش فروشگاه",
      }
    );
    payment.authority = response.data.Authority;
    await payment.save();
    res.json({
      url: `https://sandbox.zarinpal.com/pg/StartPay/${response.data.Authority}`,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "خطا در ایجاد پرداخت" });
  }
};

export const verifyPayment = async (req:AuthRequest, res:Response) => {
  try {
    const { Authority, Status } = req.query;
    const paymentId = req.params.id;

    const payment = await Payment.findById(paymentId);
    if (!payment) return res.status(404).json({ message: "پرداخت یافت نشد" });

    if (Status !== "OK") {
      payment.status = "failed";
      await payment.save();
      return res.status(400).json({ message: "پرداخت لغو شد" });
    }

    // بررسی صحت پرداخت در زرین‌پال
    const response = await axios.post(
      "https://sandbox.zarinpal.com/pg/rest/WebGate/PaymentVerification.json",
      {
        MerchantID: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
        Authority,
        Amount: payment.amount,
      }
    );

    // اگر موفق بود:
    if (response.data.Status === 100) {
      payment.status = "success";
      payment.refId = response.data.RefID;
      await payment.save();

      // پیدا کردن سبد خرید
      const cart = await Cart.findOne({ userId: payment.userId });

      // ایجاد سفارش جدید
      const order = await Order.create({
        userId: payment.userId,
        items: cart?.items,
        totalPrice: cart?.totalPrice,
        status: "paid",
        paymentId: payment._id,
      });

      // خالی کردن سبد خرید
      cart!.items = [];
      cart!.totalPrice = 0;
      await cart!.save();

      return res.json({
        message: "پرداخت موفق بود 🎉",
        refId: response.data.RefID,
        orderId: order._id,
      });
    } else {
      payment.status = "failed";
      await payment.save();
      res.status(400).json({ message: "پرداخت ناموفق بود" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "خطا در تایید پرداخت" });
  }
};

