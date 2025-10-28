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
} from "../../src/controllers/authCn.ts"; 
import { loginUser } from "../../src/middlewares/loginUser.ts";
import { adminUser } from "../../src/middlewares/adminUser.ts";
import { validate } from "../../src/middlewares/validation.middleware.ts"; 
import { logger } from "../../src/config/logger.ts";
import { loginSchema ,registerSchema, registerStep2Schema  } from "../../src/validation/auth.validation.ts";

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
router.post("/change-password", loginUser, changePassword);

// خروج کاربر
router.post("/logOut", loginUser, logOut);

// گرفتن تمام کاربران (فقط admin)
router.post("/get-users", loginUser, adminUser, getAllUsers);

export default router;
