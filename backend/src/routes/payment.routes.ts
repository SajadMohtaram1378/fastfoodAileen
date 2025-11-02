import express from "express";
import { createPayment, verifyPayment } from "@/controllers/paymentCn";
import { loginUser } from "@/middlewares/loginUser.ts";
import { validate } from "@/middlewares/validation.middleware";
import { createPaymentSchema, verifyPaymentSchema } from "@/validation/payment.validation";

const router = express.Router();

// ایجاد پرداخت → فقط کاربر لاگین‌شده
router.post("/create", loginUser, validate(createPaymentSchema), createPayment);

// تایید پرداخت → اگر میخوای فقط کاربر خودش بررسی کنه
router.get("/verify/:id", loginUser, validate(verifyPaymentSchema), verifyPayment);

export default router;
