import { Request, Response } from "express";
import mongoose from "mongoose";
import Cart from "../../src/models/Cart.js";
import Payment from "../../src/models/Payment.js";
import axios from "axios";
import Order from "../../src/models/Order.js";
import Address from "../../src/models/Address.js";
import { calculateShippingPrice } from "../../src/service/shipping.service.js";
import { printReceipt } from "../../src/utils/printerSetting.js";

type AuthRequest = Request & {
  user?: {
    id: string;
    role: "admin" | "user";
  };
};
const RESTAURANT_COORDS = {
  lat: parseFloat(process.env.RESTAURANT_COORDS_LAT || "36.31032912288117"),
  lng: parseFloat(process.env.RESTAURANT_COORDS_LNG || "59.592356277150266"),
};

export const createPayment = async (req: AuthRequest, res: Response) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const userId = req.user?.id;
    if (!userId) throw new Error("User not authenticated");

    // 1️⃣ بررسی سبد خرید
    const cart = await Cart.findOne({ userId });
    if (!cart || cart.items.length === 0)
      return res.status(404).json({ message: "سبد خرید خالی است" });

    // 2️⃣ گرفتن آدرس پیش‌فرض مشتری
    const userAddress = await Address.findOne({ userId, isDefault: true });
    if (!userAddress) throw new Error("آدرس پیش‌فرض مشتری پیدا نشد");
    if (!userAddress.coordinates) throw new Error("مختصات مشتری موجود نیست");

    // 3️⃣ محاسبه هزینه ارسال لحظه‌ای از Snapp API
    const shippingPrice = await calculateShippingPrice(
      RESTAURANT_COORDS,
      userAddress.coordinates
    );

    // 4️⃣ محاسبه totalPrice شامل آیتم‌ها + هزینه ارسال
    const itemsTotal = cart.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    const totalPrice = itemsTotal + shippingPrice;

    // 5️⃣ ذخیره قیمت به Address (اختیاری ولی خوب است)
    userAddress.price = shippingPrice;
    await userAddress.save({ session });

    // 6️⃣ ایجاد رکورد Payment
    const payment = await Payment.create(
      [{ userId, amount: totalPrice * 10 }], // تومان → ریال
      { session }
    );

    // 7️⃣ ارسال درخواست به Zarinpal
    const response = await axios.post(
      "https://sandbox.zarinpal.com/pg/rest/WebGate/PaymentRequest.json",
      {
        MerchantID: process.env.ZARINPAL_MERCHANT_ID,
        Amount: totalPrice * 10,
        CallbackURL: `http://localhost:5000/api/payment/verify/${payment[0]._id}`,
        Description: "پرداخت سفارش فروشگاه",
      }
    );

    payment[0].authority = response.data.Authority;
    await payment[0].save({ session });

    await session.commitTransaction();
    session.endSession();

    res.json({
      url: `https://sandbox.zarinpal.com/pg/StartPay/${response.data.Authority}`,
      totalPrice,
      shippingPrice,
    });
  } catch (err: any) {
    await session.abortTransaction();
    session.endSession();
    console.error(err);
    res.status(500).json({ message: err.message || "خطا در ایجاد پرداخت" });
  }
};


export const verifyPayment = async (req: AuthRequest, res: Response) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { Authority, Status } = req.query;
    const paymentId = req.params.id;

    const payment = await Payment.findById(paymentId);
    if (!payment) return res.status(404).json({ message: "پرداخت یافت نشد" });

    if (Status !== "OK") {
      payment.status = "failed";
      await payment.save({ session });
      return res.status(400).json({ message: "پرداخت لغو شد" });
    }

    // بررسی صحت پرداخت در زرین‌پال
    const response = await axios.post(
      "https://sandbox.zarinpal.com/pg/rest/WebGate/PaymentVerification.json",
      {
        MerchantID: process.env.ZARINPAL_MERCHANT_ID,
        Authority,
        Amount: payment.amount,
      }
    );

    if (response.data.Status === 100) {
      payment.status = "success";
      payment.refId = response.data.RefID;
      await payment.save({ session });

      // پیدا کردن سبد خرید
      const cart = await Cart.findOne({ userId: payment.userId });
      if (!cart) throw new Error("سبد خرید یافت نشد");

      // پیدا کردن آدرس پیش‌فرض
      const userAddress = await Address.findOne({ userId: payment.userId, isDefault: true });
      if (!userAddress) throw new Error("آدرس پیش‌فرض مشتری یافت نشد");

      // ایجاد سفارش جدید با شماره فیش خودکار
      const order = await Order.create(
        [
          {
            userId: payment.userId,
            items: cart.items,
            totalPrice: cart.totalPrice,
            status: "paid",
            paymentId: payment._id,
          },
        ],
        { session }
      );

      const receiptNumber = order[0].receiptNumber;

      // چاپ فیش آشپزخانه
      await printReceipt({
        type: "kitchen",
        receiptNumber,
        items: cart.items,
        totalPrice: cart.totalPrice,
        userName: "Customer", // اگر نام کاربر دارید می‌توانید اضافه کنید
        printerIp: process.env.DEVICE_PRINTER_IP!, // IP پرینتر شبکه آشپزخانه
      });

      // چاپ فیش پیک با آدرس و هزینه ارسال
      await printReceipt({
        type: "delivery",
        receiptNumber,
        items: cart.items,
        totalPrice: cart.totalPrice + (userAddress.price || 0),
        shippingPrice: userAddress.price,
        address: userAddress.address,
        userName: "Customer",
        printerIp: process.env.DEVICE_PRINTER_IP!, // IP پرینتر پیک
      });

      // خالی کردن سبد خرید
      cart.items = [];
      cart.totalPrice = 0;
      await cart.save({ session });

      await session.commitTransaction();
      session.endSession();

      return res.json({
        message: "پرداخت موفق بود 🎉 و فیش‌ها چاپ شدند",
        refId: response.data.RefID,
        orderId: order[0]._id,
        receiptNumber,
      });
    } else {
      payment.status = "failed";
      await payment.save({ session });
      await session.abortTransaction();
      session.endSession();
      res.status(400).json({ message: "پرداخت ناموفق بود" });
    }
  } catch (err: any) {
    await session.abortTransaction();
    session.endSession();
    console.error(err);
    res.status(500).json({ message: err.message || "خطا در تایید پرداخت" });
  }
};
