import { Router } from "express";
import { adminUser } from "../middlewares/adminUser.js";
import { loginUser } from "../middlewares/loginUser.js";
import { printReceiptAgain } from "../controllers/printerCn.js";
import { validate } from "../middlewares/validation.middleware.js";
import { printReceiptAgainSchema } from "../validation/print.validation.js";

const router = Router();

/**
 * @route GET /api/receipt/print-again
 * @query receiptNumber=101&type=kitchen|delivery
 * @access کاربر یا مدیر
 */
router.get(
  "/print-again",
  loginUser,
  adminUser,
  validate(printReceiptAgainSchema),
  printReceiptAgain
);

export default router;
