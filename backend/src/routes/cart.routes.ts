import express from "express";
import { loginUser } from "../../src/middlewares/loginUser.js";
import { getCart, removeCart, updateCart } from "../../src/controllers/cartCn.js";
import { validate } from "../../src/middlewares/validation.middleware.js";
import { updateCartSchema } from "../../src/validation/cart.validation.js";

const router = express.Router();

// آپدیت سبد خرید
router.post("/update", loginUser, validate(updateCartSchema), updateCart);

// حذف سبد خرید
router.post("/remove", loginUser, removeCart);

// دریافت سبد خرید
router.get("/get", loginUser, getCart);

export default router;
