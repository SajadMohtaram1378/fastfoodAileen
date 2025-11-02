import mongoose from "mongoose";
import Cart from "@/models/Cart";
import Product from "@/models/Product";
import redis from "@/config/redis";
import { logger } from "@/config/logger";

interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

export const cartService = {
  updateCart: async (userId: string, productId: string, quantity: number) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const product = await Product.findById(productId);
      if (!product) throw new Error("Product not found");

      const cart = await Cart.findOneAndUpdate(
        { userId },
        { $setOnInsert: { userId, items: [], totalPrice: 0 } },
        { new: true, upsert: true, session }
      );

      const existingItem = cart.items.find(
        (item) => item.productId.toString() === productId
      );

      if (quantity <= 0) {
        cart.items = cart.items.filter(
          (item) => item.productId.toString() !== productId
        );
      } else if (existingItem) {
        existingItem.quantity = quantity;
      } else {
        cart.items.push({
          productId: new mongoose.Types.ObjectId(productId),
          name: product.name,
          price: product.price,
          quantity,
        });
      }

      cart.totalPrice = cart.items.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );

      await cart.save({ session });
      await session.commitTransaction();

      const redisKey = `cart:${userId}`;
      if (cart.items.length > 0) {
        await redis.set(redisKey, JSON.stringify(cart));
      } else {
        await redis.del(redisKey);
      }

      session.endSession();
      return cart;
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      logger.error(`CartService.updateCart: ${err}`);
      throw err;
    }
  },

  getCart: async (userId: string) => {
    const redisKey = `cart:${userId}`;
    const cachedCart = await redis.get(redisKey);
    if (cachedCart) return JSON.parse(cachedCart);

    const cart = await Cart.findOne({ userId }).lean();
    if (cart) await redis.set(redisKey, JSON.stringify(cart));
    return cart || { items: [], totalPrice: 0 };
  },

  removeCart: async (userId: string) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const redisKey = `cart:${userId}`;
      const deletedCart = await Cart.findOneAndDelete({ userId }, { session });
      await redis.del(redisKey);

      await session.commitTransaction();
      session.endSession();

      return deletedCart;
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      logger.error(`CartService.removeCart: ${err}`);
      throw err;
    }
  },
};
