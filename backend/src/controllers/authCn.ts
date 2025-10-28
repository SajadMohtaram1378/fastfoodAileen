import { Request, Response } from "express";
import { authService } from "../service/auth.service.js";
import { logger } from "../config/logger.js";
import { registerSchema, registerStep2Schema, loginSchema } from "../validation/auth.validation.js";

export const registerStep1 = async (req: Request, res: Response) => {
  try {
    const { error, value } = registerSchema.validate(req.body, { abortEarly: false });
    if (error) {
      const msg = error.details.map(d => d.message).join(", ");
      logger.warn(`Validation failed registerStep1: ${msg}`);
      return res.status(400).json({ ok: false, message: msg });
    }

    const result = await authService.registerStep1(value);
    return res.status(200).json({ ok: true, ...result });
  } catch (err: any) {
    logger.error(`registerStep1Controller: ${err.message}`);
    return res.status(500).json({ ok: false, message: "خطای سرور" });
  }
};

export const registerStep2 = async (req: Request, res: Response) => {
  try {
    const { error, value } = registerStep2Schema.validate(req.body, { abortEarly: false });
    if (error) {
      const msg = error.details.map(d => d.message).join(", ");
      logger.warn(`Validation failed registerStep2: ${msg}`);
      return res.status(400).json({ ok: false, message: msg });
    }

    const result = await authService.registerStep2(value);
    return res.status(201).json({ ok: true, ...result });
  } catch (err: any) {
    logger.error(`registerStep2Controller: ${err.message}`);
    return res.status(500).json({ ok: false, message: "خطای سرور" });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { error, value } = loginSchema.validate(req.body, { abortEarly: false });
    if (error) {
      const msg = error.details.map(d => d.message).join(", ");
      logger.warn(`Validation failed login: ${msg}`);
      return res.status(400).json({ ok: false, message: msg });
    }

    const result = await authService.login(value.numberPhone, value.password);
    return res.status(200).json({ ok: true, ...result });
  } catch (err: any) {
    logger.error(`loginController: ${err.message}`);
    return res.status(500).json({ ok: false, message: "خطای سرور" });
  }
};

export const forgetPasswordstep1 = async (req: Request, res: Response) => {
  try {
    const { numberPhone } = req.body;
    const result = await authService.forgetPasswordStep1(numberPhone);
    return res.status(200).json({ ok: true, ...result });
  } catch (err: any) {
    logger.error(`forgetPasswordStep1Controller: ${err.message}`);
    return res.status(500).json({ ok: false, message: "خطای سرور" });
  }
};

export const forgetPasswordstep2 = async (req: Request, res: Response) => {
  try {
    const { otp } = req.body;
    const result = await authService.forgetPasswordStep2(otp);
    return res.status(200).json({ ok: true, ...result });
  } catch (err: any) {
    logger.error(`forgetPasswordStep2Controller: ${err.message}`);
    return res.status(500).json({ ok: false, message: "خطای سرور" });
  }
};

export const forgetPasswordstep3 = async (req: Request, res: Response) => {
  try {
    const { numberPhone, newPassword } = req.body;
    const result = await authService.forgetPasswordStep3(numberPhone, newPassword);
    return res.status(200).json({ ok: true, ...result });
  } catch (err: any) {
    logger.error(`forgetPasswordStep3Controller: ${err.message}`);
    return res.status(500).json({ ok: false, message: "خطای سرور" });
  }
};

export const changePassword = async (req: Request, res: Response) => {
  try {
    const { numberPhone, currentPassword, newPassword } = req.body;
    const result = await authService.changePassword(numberPhone, currentPassword, newPassword);
    return res.status(200).json({ ok: true, ...result });
  } catch (err: any) {
    logger.error(`changePasswordController: ${err.message}`);
    return res.status(500).json({ ok: false, message: "خطای سرور" });
  }
};

export const getAllUsers = async (_req: Request, res: Response) => {
  try {
    const users = await authService.getAllUsers();
    return res.status(200).json({ ok: true, count: users.length, users });
  } catch (err: any) {
    logger.error(`getAllUsersController: ${err.message}`);
    return res.status(500).json({ ok: false, message: "خطای سرور" });
  }
};

export const logOut = async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) throw new Error("توکن یافت نشد");

    const result = await authService.logout(token);

    // پاک کردن Cookie در صورت استفاده از HttpOnly Cookie
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    return res.status(200).json({ ok: true, ...result });
  } catch (err: any) {
    logger.error(`logOutController: ${err.message}`);
    return res.status(500).json({ ok: false, message: err.message || "خطای سرور" });
  }
};
