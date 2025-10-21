import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

interface JwtPayload {
  id: string;
  role: "admin" | "user";
}

declare global {
  namespace Express {
    interface Request {
      user?: { id: string; role: "admin" | "user" };
      token?: string;
    }
  }
}

export const adminUser = (req: Request, res: Response, next: NextFunction) => {
  try {
    const token =
      req.headers.authorization?.split(" ")[1] ||
      req.token ||
      req.cookies?.token;

    if (!token) {
      return res.status(401).json({ ok: false, message: "توکن یافت نشد" });
    }

    // بررسی اعتبار توکن
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;

    // ذخیره اطلاعات کاربر
    req.user = { id: payload.id, role: payload.role };

    // بررسی نقش admin
    if (req.user.role !== "admin") {
      return res.status(403).json({ ok: false, message: "دسترسی مجاز نیست" });
    }

    next();
  } catch (error: any) {
    console.error("❌ خطای adminUserMiddleware:", error.stack || error);

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ ok: false, message: "توکن منقضی شده است" });
    } else if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ ok: false, message: "توکن نامعتبر است" });
    }

    return res.status(500).json({ ok: false, message: "خطای سرور" });
  }
};
