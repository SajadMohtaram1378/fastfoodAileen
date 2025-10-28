import { Router } from "express";
import { adminUser } from "../middlewares/adminUser.js";
import { printReceiptAgain } from "../controllers/printerCn.js";

const router = Router();

/**
 * @route GET /api/receipt/print-again
 * @query receiptNumber=101&type=kitchen|delivery
 * @access کاربر یا مدیر
 */
router.get("/print-again", adminUser, printReceiptAgain);

export default router;
