import mongoose from "mongoose";
import { Request, Response } from "express";
import Address from "../../src/models/Address.js";
import redis from "../../src/config/redis.js";

export const addAddress = async (req: Request, res: Response) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const userId = req.user?.id;
    if (!userId) throw new Error("User not authenticated");

    const { address, coordinates } = req.body;
    if (!address) throw new Error("Address is required");

    // 1️⃣ حذف isDefault قبلی
    await Address.updateMany(
      { userId, isDefault: true },
      { $set: { isDefault: false } },
      { session }
    );

    // 2️⃣ اضافه کردن آدرس جدید و پیش‌فرض
    const newAddress = await Address.create(
      [
        {
          userId,
          address,
          coordinates,
          isDefault: true,
        },
      ],
      { session }
    );

    // 3️⃣ بروزرسانی Redis
    const addresses = await Address.find({ userId }).lean();
    await redis.set(`user:${userId}:addresses`, JSON.stringify(addresses));

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({ ok: true, address: newAddress[0] });
  } catch (error: any) {
    await session.abortTransaction();
    session.endSession();
    res.status(500).json({ error: error.message });
  }
};

export const setDefaultAddress = async (req: Request, res: Response) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const userId = req.user?.id;
    const { addressId } = req.body;
    if (!addressId) throw new Error("addressId is required");

    // 1️⃣ همه آدرس‌ها false شوند
    await Address.updateMany(
      { userId, isDefault: true },
      { $set: { isDefault: false } },
      { session }
    );

    // 2️⃣ آدرس انتخاب شده پیش‌فرض شود
    const updated = await Address.findByIdAndUpdate(
      addressId,
      { isDefault: true },
      { new: true, session }
    );
    if (!updated) throw new Error("Address not found");

    // 3️⃣ Redis بروزرسانی شود
    const addresses = await Address.find({ userId }).lean();
    await redis.set(`user:${userId}:addresses`, JSON.stringify(addresses));

    await session.commitTransaction();
    session.endSession();

    res.json({ ok: true, address: updated });
  } catch (error: any) {
    await session.abortTransaction();
    session.endSession();
    res.status(500).json({ error: error.message });
  }
};

export const deleteAddress = async (req: Request, res: Response) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const userId = req.user?.id;
    const { addressId } = req.params;
    if (!addressId) throw new Error("addressId is required");

    const deleted = await Address.findOneAndDelete({
      _id: addressId,
      userId,
    }).session(session);
    if (!deleted) throw new Error("Address not found");

    // اگر آدرس حذف شده پیش‌فرض بود، یکی از باقی‌مانده‌ها پیش‌فرض شود
    if (deleted.isDefault) {
      const nextAddress = await Address.findOne({ userId })
        .sort({ createdAt: -1 })
        .session(session);
      if (nextAddress) {
        nextAddress.isDefault = true;
        await nextAddress.save({ session });
      }
    }

    // Redis بروزرسانی شود
    const addresses = await Address.find({ userId }).lean();
    await redis.set(`user:${userId}:addresses`, JSON.stringify(addresses));

    await session.commitTransaction();
    session.endSession();

    res.json({ ok: true, message: "Address deleted" });
  } catch (error: any) {
    await session.abortTransaction();
    session.endSession();
    res.status(500).json({ error: error.message });
  }
};

export const deleteAllAddresses = async (req: Request, res: Response) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const userId = req.user?.id;

    await Address.deleteMany({ userId }).session(session);

    // Redis پاک شود
    await redis.del(`user:${userId}:addresses`);

    await session.commitTransaction();
    session.endSession();

    res.json({ ok: true, message: "All addresses deleted" });
  } catch (error: any) {
    await session.abortTransaction();
    session.endSession();
    res.status(500).json({ error: error.message });
  }
};
