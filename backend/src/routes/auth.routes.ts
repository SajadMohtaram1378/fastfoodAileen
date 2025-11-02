// src/routes/auth.routes.ts
import express from "express";
import {
  changePassword,
  forgetPasswordstep1,
  forgetPasswordstep2,
  forgetPasswordstep3,
  getAllUsers,
  login,
  logOut,
  registerStep1,
  registerStep2,
} from "@/controllers/authCn"; 
import { loginUser } from "@/middlewares/loginUser";
import { adminUser } from "@/middlewares/adminUser";
import { validate } from "@/middlewares/validation.middleware"; 
import { logger } from "@/config/logger";
import { loginSchema ,registerSchema, registerStep2Schema  } from "@/validation/auth.validation";

const router = express.Router();

// =================== Logging هر درخواست ===================
router.use((req, _res, next) => {
  logger.info(`Request: ${req.method} ${req.originalUrl}`);
  next();
});

// =================== Auth Routes ===================

// ثبت‌نام مرحله 1
router.post("/register/step1", validate(registerSchema), registerStep1);

// ثبت‌نام مرحله 2
router.post("/register/step2", validate(registerStep2Schema), registerStep2);

// ورود
router.post("/login", validate(loginSchema), login);

// فراموشی رمز عبور
router.post("/forget-password/step1", forgetPasswordstep1);
router.post("/forget-password/step2", forgetPasswordstep2);
router.post("/forget-password/step3", forgetPasswordstep3);

// تغییر رمز عبور (فقط کاربر لاگین شده)
router.patch("/change-password", loginUser, changePassword);

// خروج کاربر
router.post("/logout", loginUser, logOut);

// گرفتن تمام کاربران (فقط admin)
router.get("/users", loginUser, adminUser, getAllUsers);

export default router;
