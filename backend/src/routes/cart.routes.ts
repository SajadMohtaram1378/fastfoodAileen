import express from "express";
import { loginUser } from "@/middlewares/loginUser";
import { getCart, removeCart, updateCart } from "@/controllers/cartCn";
import { validate } from "@/middlewares/validation.middleware";
import { updateCartSchema } from "@/validation/cart.validation";

const router = express.Router();

// آپدیت سبد خرید
router.post("/update", loginUser, validate(updateCartSchema), updateCart);

// حذف سبد خرید
router.post("/remove", loginUser, removeCart);

// دریافت سبد خرید
router.get("/get", loginUser, getCart);

export default router;
