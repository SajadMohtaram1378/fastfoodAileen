import { Request, Response } from "express";
import mongoose from "mongoose";
import Cart from "../../src/models/Cart.js";
import Product from "../../src/models/Product.js";
import redis from "../../src/config/redis.js";

// تعریف یک تایپ محلی برای Request که user داره
type AuthRequest = Request & {
  user?: {
    id: string;
    role: "admin" | "user";
  };
};

export const updateCart = async (req: AuthRequest, res: Response) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const userId = req.user?.id;
    const { productId, quantity } = req.body;

    if (!userId) throw new Error("User not authenticated");
    if (!productId || quantity === undefined)
      throw new Error("ProductId or quantity missing");

    const product = await Product.findById(productId);
    if (!product) throw new Error("Product not found");

    // پیدا یا ساخت سبد
    const cart = await Cart.findOneAndUpdate(
      { userId },
      { $setOnInsert: { userId, items: [], totalPrice: 0 } },
      { new: true, upsert: true, session }
    );

    const existingItem = cart.items.find(
      (item) => item.productId.toString() === productId
    );

    if (quantity <= 0) {
      // 🔻 حذف آیتم از سبد
      cart.items = cart.items.filter(
        (item) => item.productId.toString() !== productId
      );
    } else if (existingItem) {
      // 🔄 بروزرسانی تعداد
      existingItem.quantity = quantity;
    } else {
      // 🟢 افزودن آیتم جدید
      cart.items.push({
        productId,
        name: product.name,
        price: product.price,
        quantity,
      });
    }

    // محاسبه مجموع جدید
    cart.totalPrice = cart.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    await cart.save({ session });
    await session.commitTransaction();
    session.endSession();

    const redisKey = `cart:${userId}`;

    if (cart.items.length > 0) {
      // ✅ بروزرسانی داده جدید در Redis
      await redis.set(redisKey, JSON.stringify(cart));
    } else {
      // 🗑 اگر سبد خالی شد، کش حذف بشه
      await redis.del(redisKey);
    }

    res.status(200).json({
      message: "Cart updated successfully",
      cart,
      redisUpdated: true,
    });
  } catch (error: any) {
    await session.abortTransaction();
    session.endSession();
    console.error("❌ updateCart error:", error);
    res.status(500).json({ error: error.message || "Server Error" });
  }
};



export const getCart = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new Error("User not authenticated");

    const redisKey = `cart:${userId}`;

    // 🧠 تلاش برای خواندن از Redis
    const cachedCart = await redis.get(redisKey);

    if (cachedCart) {
      const parsedCart = JSON.parse(cachedCart);
      const totalItems = parsedCart.items.reduce(
        (sum: number, item: any) => sum + item.quantity,
        0
      );

      return res.status(200).json({
        ok: true,
        source: "redis",
        cart: parsedCart,
        totalItems,
      });
    }

    // 🗄️ اگر در Redis نبود → از MongoDB بخوان
    const cart = await Cart.findOne({ userId }).lean();

    if (!cart) {
      return res.status(200).json({
        ok: true,
        message: "Cart is empty",
        cart: { items: [], totalPrice: 0 },
        totalItems: 0,
      });
    }

    // 💾 ذخیره در Redis برای دفعات بعد
    await redis.set(redisKey, JSON.stringify(cart));

    const totalItems = cart.items.reduce(
      (sum, item) => sum + item.quantity,
      0
    );

    // ✅ پاسخ نهایی از MongoDB
    return res.status(200).json({
      ok: true,
      source: "mongo",
      cart,
      totalItems,
    });
  } catch (error: any) {
    console.error("❌ getCart error:", error);
    return res.status(500).json({
      ok: false,
      error: error.message || "Internal Server Error",
    });
  }
};

export const removeCart = async (req: AuthRequest, res: Response) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const userId = req.user?.id;
    if (!userId) throw new Error("User not authenticated");

    const redisKey = `cart:${userId}`;

    // 🗑️ 1️⃣ حذف از MongoDB
    const deletedCart = await Cart.findOneAndDelete({ userId }, { session });

    // 🧠 2️⃣ حذف از Redis (حتی اگر در Mongo نبود)
    await redis.del(redisKey);

    await session.commitTransaction();
    session.endSession();

    if (!deletedCart) {
      return res.status(200).json({
        ok: true,
        message: "No cart found to delete",
      });
    }

    // ✅ 3️⃣ پاسخ موفقیت‌آمیز
    return res.status(200).json({
      ok: true,
      message: "Cart successfully removed",
      removedCart: deletedCart,
    });
  } catch (error: any) {
    await session.abortTransaction();
    session.endSession();
    console.error("❌ removeCart error:", error);

    return res.status(500).json({
      ok: false,
      error: error.message || "Internal Server Error",
    });
  }
};
