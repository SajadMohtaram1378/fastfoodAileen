import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import redis from "../../src/config/redis.js";

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

export const loginUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token =
      req.headers.authorization?.split(" ")[1] ||
      req?.token ||
      req.cookies?.token;

    if (!token) {
      return res.status(401).json({ ok: false, message: "توکن یافت نشد" });
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
    const isBlacklisted = await redis.get(`blacklistToken:${token}`);
    if (isBlacklisted)
      return res
        .status(401)
        .json({ ok: false, message: "توکن منقضی یا لغو شده است" });

    req.user = { id: payload.id, role: payload.role };
    next();
  } catch (error: any) {
    console.error("❌ خطای authenticateMiddleware:", error.stack || error);

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ ok: false, message: "توکن منقضی شده است" });
    } else if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ ok: false, message: "توکن نامعتبر است" });
    }

    return res.status(500).json({ ok: false, message: "خطای سرور" });
  }
};
