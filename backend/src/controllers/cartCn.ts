import { Request, Response, NextFunction } from "express";
import { cartService } from "../service/cart.service.ts";
import { logger } from "../config/logger.js";
import { updateCartSchema } from "../validation/cart.validation.ts";

// تایپ برای Request که user داره
interface AuthRequest extends Request {
  user?: { id: string; role: "admin" | "user" };
}

export const updateCart = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new Error("User not authenticated");

    const { error, value } = updateCartSchema.validate(req.body, { abortEarly: false });
    if (error) throw new Error(error.details.map(d => d.message).join(", "));

    const cart = await cartService.updateCart(userId, value.productId, value.quantity);

    res.status(200).json({ ok: true, cart });
  } catch (err: any) {
    logger.error(`CartController.updateCart: ${err.message}`);
    res.status(400).json({ ok: false, message: err.message });
  }
};

export const getCart = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new Error("User not authenticated");

    const cart = await cartService.getCart(userId);
    const totalItems = cart.items.reduce((sum: number, item: any) => sum + item.quantity, 0);

    res.status(200).json({ ok: true, cart, totalItems });
  } catch (err: any) {
    logger.error(`CartController.getCart: ${err.message}`);
    res.status(500).json({ ok: false, message: err.message });
  }
};

export const removeCart = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new Error("User not authenticated");

    const deletedCart = await cartService.removeCart(userId);
    res.status(200).json({ ok: true, removedCart: deletedCart || null });
  } catch (err: any) {
    logger.error(`CartController.removeCart: ${err.message}`);
    res.status(500).json({ ok: false, message: err.message });
  }
};
