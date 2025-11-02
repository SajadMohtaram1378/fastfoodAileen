import { Router } from "express";
import { adminUser } from "@/middlewares/adminUser";
import { loginUser } from "@/middlewares/loginUser";
import { printReceiptAgain } from "@/controllers/printerCn";
import { validate } from "@/middlewares/validation.middleware";
import { printReceiptAgainSchema } from "@/validation/print.validation";

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
