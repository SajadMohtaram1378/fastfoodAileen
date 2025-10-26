import express from "express";
import { verifyPayment ,createPayment } from "../../src/controllers/paymentCn.js";
import { loginUser } from "../../src/middlewares/loginUser.js";

const router = express.Router();

router.post("/create", loginUser, createPayment);
router.get("/verify/:id", verifyPayment);

export default router;
