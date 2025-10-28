import mongoose from "mongoose";
import Address from "../models/Address.ts";
import redis from "../config/redis.ts";

interface AddressInput {
  address: string;
  coordinates?: { lat: number; lng: number };
}

class AddressService {
  // افزودن آدرس جدید و پیش‌فرض کردن آن
  async addAddress(userId: string, data: AddressInput) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      // حذف isDefault قبلی
      await Address.updateMany(
        { userId, isDefault: true },
        { $set: { isDefault: false } },
        { session }
      );

      // اضافه کردن آدرس جدید به صورت پیش‌فرض
      const [newAddress] = await Address.create(
        [
          {
            userId,
            address: data.address,
            coordinates: data.coordinates,
            isDefault: true,
          },
        ],
        { session }
      );

      // بروزرسانی Redis
      const addresses = await Address.find({ userId }).lean();
      await redis.set(`user:${userId}:addresses`, JSON.stringify(addresses));

      await session.commitTransaction();
      session.endSession();

      return newAddress;
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      throw err;
    }
  }

  // انتخاب یک آدرس به عنوان پیش‌فرض
  async setDefaultAddress(userId: string, addressId: string) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      // همه آدرس‌ها false شوند
      await Address.updateMany(
        { userId, isDefault: true },
        { $set: { isDefault: false } },
        { session }
      );

      // آدرس انتخاب شده پیش‌فرض شود
      const updated = await Address.findByIdAndUpdate(
        addressId,
        { isDefault: true },
        { new: true, session }
      );
      if (!updated) throw new Error("Address not found");

      // Redis بروزرسانی شود
      const addresses = await Address.find({ userId }).lean();
      await redis.set(`user:${userId}:addresses`, JSON.stringify(addresses));

      await session.commitTransaction();
      session.endSession();

      return updated;
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      throw err;
    }
  }

  // حذف یک آدرس
  async deleteAddress(userId: string, addressId: string) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const deleted = await Address.findOneAndDelete({ _id: addressId, userId }).session(session);
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
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      throw err;
    }
  }

  // حذف همه آدرس‌ها
  async deleteAllAddresses(userId: string) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      await Address.deleteMany({ userId }).session(session);

      // Redis پاک شود
      await redis.del(`user:${userId}:addresses`);

      await session.commitTransaction();
      session.endSession();
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      throw err;
    }
  }

  // گرفتن همه آدرس‌ها (اختیاری برای کنترلر)
  async getAllAddresses(userId: string) {
    const addresses = await Address.find({ userId }).sort({ createdAt: -1 }).lean();
    return addresses;
  }
}

export const addressService = new AddressService();
