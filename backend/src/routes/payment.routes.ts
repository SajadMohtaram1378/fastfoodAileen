import express from "express";
import { createPayment, verifyPayment } from "../../src/controllers/paymentCn.js";
import { loginUser } from "../../src/middlewares/loginUser.ts";
import { validate } from "../../src/middlewares/validation.middleware.ts";
import { createPaymentSchema, verifyPaymentSchema } from "../../src/validation/payment.validation.js";

const router = express.Router();

// ایجاد پرداخت → فقط کاربر لاگین‌شده
router.post("/create", loginUser, validate(createPaymentSchema), createPayment);

// تایید پرداخت → اگر میخوای فقط کاربر خودش بررسی کنه
router.get("/verify/:id", loginUser, validate(verifyPaymentSchema), verifyPayment);

export default router;
