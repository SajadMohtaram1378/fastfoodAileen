import { generateAndSaveOtp, verifyOtp } from "@/utils/otpHandler";
import { sendSMS } from "@/utils/kavehnegarsms";
import { User } from "@/models/User";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { logger } from "@/config/logger";
import redis from "@/config/redis";

export const authService = {
  async registerStep1(data: {
    name: string;
    numberPhone: string;
    password: string;
    address: string | string[];
  }) {
    const { name, numberPhone, password, address } = data;
    const existingUser = await User.findOne({ numberPhone });
    if (existingUser) throw new Error("این شماره قبلاً ثبت شده است");

    await redis.set(
      `userData:${numberPhone}`,
      JSON.stringify({ name, password, address }),
      "EX",
      600
    );

    const otp = await generateAndSaveOtp(numberPhone, 120);
    try {
      await sendSMS(numberPhone, `کد تایید شما: ${otp} (اعتبار: 2 دقیقه)`);
    } catch (err) {
      logger.error(`خطا در ارسال OTP: ${err}`);
      throw new Error("خطا در ارسال کد تایید");
    }
    return { message: "کد تایید ارسال شد" };
  },

  async registerStep2(otp: string) {
    const numberPhone = await redis.get(`otpLookup:${otp}`);
    if (!numberPhone) throw new Error("کد تایید منقضی شده یا نامعتبر است");

    await verifyOtp(numberPhone, otp);

    const existingUser = await User.findOne({ numberPhone });
    if (existingUser) throw new Error("کاربر قبلاً ساخته شده است");

    const userDataString = await redis.get(`userData:${numberPhone}`);
    if (!userDataString) throw new Error("اطلاعات ثبت‌نام یافت نشد");

    const { name, password, address } = JSON.parse(userDataString);
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      name,
      numberPhone,
      password: hashedPassword,
      address,
      role: "user",
    });

    await redis.del(`userData:${numberPhone}`);
    await redis.del(`otpLookup:${otp}`);

    const token = jwt.sign(
      { id: newUser._id, role: newUser.role },
      process.env.JWT_SECRET!,
      { expiresIn: "7d" }
    );

    return {
      user: {
        id: newUser._id,
        name: newUser.name,
        numberPhone: newUser.numberPhone,
        role: newUser.role,
      },
      token,
    };
  },

  async login(numberPhone: string, password: string) {
    const user = await User.findOne({ numberPhone });
    if (!user) throw new Error("کاربری وجود ندارد");

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) throw new Error("شماره تلفن یا رمز اشتباه میباشد");

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: "7d" }
    );

    return {
      user: {
        id: user._id,
        name: user.name,
        numberPhone: user.numberPhone,
        role: user.role,
      },
      token,
    };
  },

  async forgetPasswordstep1(numberPhone: string) {
    const user = await User.findOne({ numberPhone });
    if (!user) throw new Error("کاربری وجود ندارد لطفا ثبت نام کنید");

    const otp = await generateAndSaveOtp(numberPhone, 120);
    await sendSMS(numberPhone, `کد تایید شما: ${otp} (اعتبار: 2 دقیقه)`);

    return { message: "کد احراز فرستاده شد" };
  },

  async forgetPasswordstep2(otp: string) {
    const numberPhone = await redis.get(`otpLookup:${otp}`);
    if (!numberPhone) throw new Error("کد تایید منقضی شده یا نامعتبر است");

    await verifyOtp(numberPhone, otp);
    await redis.del(`otpLookup:${otp}`);

    const resetToken = jwt.sign({ numberPhone }, process.env.JWT_SECRET!, {
      expiresIn: "10m",
    });
    return { resetToken, message: "رمز عبور جدید خود را وارد نمایید" };
  },

  async forgetPasswordstep3(numberPhone: string, newPassword: string) {
    const user = await User.findOne({ numberPhone });
    if (!user) throw new Error("کاربری با این شماره یافت نشد");

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    return { message: "رمز عبور با موفقیت تغییر یافت ✅" };
  },

  async changePassword(
    numberPhone: string,
    currentPassword: string,
    newPassword: string
  ) {
    const user = await User.findOne({ numberPhone });
    if (!user) throw new Error("کاربر یافت نشد");

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) throw new Error("رمز فعلی اشتباه است");

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    return { message: "رمز عبور با موفقیت تغییر یافت ✅" };
  },

  async getAllUsers() {
    return User.find().sort({ createdAt: -1 }).exec();
  },
  async logout(token: string) {
    if (!token) throw new Error("توکن یافت نشد");

    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET!) as { id: string };
    } catch (err) {
      throw new Error("توکن نامعتبر است");
    }

    const userId = payload.id;

    // حذف Refresh Token مرتبط با کاربر از Redis
    await redis.del(`refreshToken:${userId}`);

    // اضافه کردن توکن فعلی به Blacklist در Redis
    const jwtExpiry = 7 * 24 * 60 * 60; // 7 روز
    await redis.set(`blacklistToken:${token}`, "blacklisted", "EX", jwtExpiry);

    return { message: "خروج با موفقیت انجام شد ✅" };
  },
};
