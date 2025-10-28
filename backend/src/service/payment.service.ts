import mongoose from "mongoose";
import Cart from "../models/Cart.js";
import Payment from "../models/Payment.js";
import Address from "../models/Address.js";
import Order from "../models/Order.js";
import { calculateShippingPrice } from "./shipping.service.js";
import { printReceipt } from "../utils/printerSetting.js";
import axios from "axios";

const RESTAURANT_COORDS = {
  lat: parseFloat(process.env.RESTAURANT_COORDS_LAT || "36.31032912288117"),
  lng: parseFloat(process.env.RESTAURANT_COORDS_LNG || "59.592356277150266"),
};

export const createPaymentService = async (userId: string) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const cart = await Cart.findOne({ userId });
    if (!cart || cart.items.length === 0) throw new Error("سبد خرید خالی است");

    const userAddress = await Address.findOne({ userId, isDefault: true });
    if (!userAddress) throw new Error("آدرس پیش‌فرض پیدا نشد");
    if (!userAddress.coordinates) throw new Error("مختصات مشتری موجود نیست");

    const shippingPrice = await calculateShippingPrice(RESTAURANT_COORDS, userAddress.coordinates);

    const itemsTotal = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const totalPrice = itemsTotal + shippingPrice;

    userAddress.price = shippingPrice;
    await userAddress.save({ session });

    const payment = await Payment.create([{ userId, amount: totalPrice * 10 }], { session });

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

    return { url: `https://sandbox.zarinpal.com/pg/StartPay/${response.data.Authority}`, totalPrice, shippingPrice };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

export const verifyPaymentService = async (paymentId: string, authority: string, status: string) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const payment = await Payment.findById(paymentId);
    if (!payment) throw new Error("پرداخت یافت نشد");

    if (status !== "OK") {
      payment.status = "failed";
      await payment.save({ session });
      return { success: false, message: "پرداخت لغو شد" };
    }

    const response = await axios.post(
      "https://sandbox.zarinpal.com/pg/rest/WebGate/PaymentVerification.json",
      {
        MerchantID: process.env.ZARINPAL_MERCHANT_ID,
        Authority: authority,
        Amount: payment.amount,
      }
    );

    if (response.data.Status !== 100) {
      payment.status = "failed";
      await payment.save({ session });
      throw new Error("پرداخت ناموفق بود");
    }

    payment.status = "success";
    payment.refId = response.data.RefID;
    await payment.save({ session });

    const cart = await Cart.findOne({ userId: payment.userId });
    if (!cart) throw new Error("سبد خرید یافت نشد");

    const userAddress = await Address.findOne({ userId: payment.userId, isDefault: true });
    if (!userAddress) throw new Error("آدرس پیش‌فرض مشتری یافت نشد");

    const order = await Order.create([{ userId: payment.userId, items: cart.items, totalPrice: cart.totalPrice, status: "paid", paymentId: payment._id }], { session });
    const receiptNumber = order[0].receiptNumber;

    await printReceipt({
      type: "kitchen",
      receiptNumber,
      items: cart.items,
      totalPrice: cart.totalPrice,
      userName: "Customer",
      printerIp: process.env.DEVICE_PRINTER_IP!,
    });

    await printReceipt({
      type: "delivery",
      receiptNumber,
      items: cart.items,
      totalPrice: cart.totalPrice + (userAddress.price || 0),
      shippingPrice: userAddress.price,
      address: userAddress.address,
      userName: "Customer",
      printerIp: process.env.DEVICE_PRINTER_IP!,
    });

    cart.items = [];
    cart.totalPrice = 0;
    await cart.save({ session });

    await session.commitTransaction();
    session.endSession();

    return { success: true, refId: response.data.RefID, orderId: order[0]._id, receiptNumber };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};
