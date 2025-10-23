import { Request, Response } from "express";
import redis from "../config/redis.js";
import { generateAndSaveOtp, verifyOtp } from "../utils/otpHandler.js";
import { sendSMS } from "../utils/kavehnegarsms.js";
import { User } from "../../src/models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { loginSchema, registerSchema } from "../../src/utils/joiValidate.js";

export const registerStep1 = async (req: Request, res: Response) => {
  try {
    const { error, value } = registerSchema.validate(req?.body, {
      abortEarly: false,
    });

    if (error) {
      return res.status(400).json({
        ok: false,
        message: "اطلاعات وارد شده معتبر نیست",
        details: error.details,
      });
    }

    const { name, numberPhone, password, address } = value;

    // ---- بررسی موجودیت کاربر ----
    const existingUser = await User.findOne({ numberPhone });
    if (existingUser) {
      return res
        .status(400)
        .json({ ok: false, message: "این شماره قبلاً ثبت شده است" });
    }

    // ---- ذخیره داده‌ها در Redis (مرحله اول) ----
    await redis.set(
      `userData:${numberPhone}`,
      JSON.stringify({ name, password, address }),
      "EX",
      600
    );

    // ---- تولید و ارسال OTP ----
    const otp = await generateAndSaveOtp(numberPhone, 120); // 2 دقیقه
    try {
      await sendSMS(numberPhone, `کد تایید شما: ${otp} (اعتبار: 2 دقیقه)`);
    } catch (err) {
      console.error("❌ خطا در ارسال OTP:", err);
      return res
        .status(500)
        .json({ ok: false, message: "خطا در ارسال کد تایید" });
    }

    return res.status(200).json({ ok: true, message: "کد تایید ارسال شد" });
  } catch (err) {
    console.error("❌ خطای registerStep1Controller:", err);
    return res.status(500).json({ ok: false, message: "خطای سرور" });
  }
};

export const registerStep2 = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { otp } = req.body;

    // 1️⃣ اعتبارسنجی اولیه OTP
    if (!otp || !/^\d{4,6}$/.test(otp)) {
      return res
        .status(400)
        .json({ ok: false, message: "OTP باید عددی 4 تا 6 رقمی باشد" });
    }

    // 2️⃣ دریافت شماره تلفن از Redis
    const numberPhone = await redis.get(`otpLookup:${otp}`);
    if (!numberPhone) {
      console.error("❌ Redis otpLookup missing:", `otpLookup:${otp}`);
      return res
        .status(400)
        .json({ ok: false, message: "کد تایید منقضی شده یا نامعتبر است" });
    }
    console.log("✅ شماره استخراج‌شده از Redis:", numberPhone);

    // 3️⃣ بررسی صحت OTP
    try {
      await verifyOtp(numberPhone, otp);
    } catch (err: any) {
      console.error("❌ خطا در verifyOtp:", err);
      return res.status(400).json({
        ok: false,
        message: err.message || "کد تایید اشتباه یا منقضی شده است",
      });
    }

    // 4️⃣ بررسی اینکه کاربر قبلاً ساخته نشده باشد
    const existingUser = await User.findOne({ numberPhone });
    if (existingUser) {
      return res
        .status(400)
        .json({ ok: false, message: "کاربر قبلاً ساخته شده است" });
    }

    // 5️⃣ دریافت اطلاعات ثبت‌نام مرحله اول از Redis
    const userDataString = await redis.get(`userData:${numberPhone}`);
    if (!userDataString) {
      console.error("❌ Redis userData missing:", `userData:${numberPhone}`);
      return res
        .status(400)
        .json({ ok: false, message: "اطلاعات ثبت‌نام یافت نشد" });
    }

    const { name, password, address } = JSON.parse(userDataString);

    // 6️⃣ هش کردن رمز عبور
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 7️⃣ ساخت کاربر
    const newUser = await User.create({
      name,
      numberPhone,
      password: hashedPassword,
      address,
      role: "user",
    });

    // 8️⃣ حذف داده‌های موقت از Redis
    await redis.del(`userData:${numberPhone}`);
    await redis.del(`otpLookup:${otp}`);

    // 9️⃣ ایجاد JWT
    const token = jwt.sign(
      { id: newUser._id, role: newUser.role },
      process.env.JWT_SECRET!,
      { expiresIn: "7d" }
    );

    // 10️⃣ پاسخ موفقیت
    return res.status(201).json({
      ok: true,
      message: "ثبت‌نام با موفقیت انجام شد ✅",
      user: {
        id: newUser._id,
        name: newUser.name,
        numberPhone: newUser.numberPhone,
        role: newUser.role,
      },
      token,
    });
  } catch (err: any) {
    console.error("❌ خطای registerStep2Controller:", err);
    return res.status(500).json({ ok: false, message: "خطای سرور" });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { error, value } = loginSchema.validate(req?.body, {
      abortEarly: false,
    });

    if (error) {
      return res.status(400).json({
        ok: false,
        message: "اطلاعات وارد شده معتبر نیست",
        details: error.details,
      });
    }
    const { password, numberPhone } = value;
    const user = await User.findOne({ numberPhone });
    if (!user) {
      return res
        .status(404)
        .json({ ok: false, message: "کاربری وجود ندارد لطفا ثبت نام کنید" });
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        ok: false,
        message: "شماره تلفن یا رمز اشتباه میباشد",
      });
    }
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: "7d" }
    );
    return res.status(200).json({
      ok: true,
      message: "ورود موفق ✅",
      user: {
        id: user._id,
        name: user.name,
        numberPhone: user.numberPhone,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    console.error("❌ خطای loginController:", error);
    return res.status(500).json({ ok: false, message: "خطای سرور" });
  }
};

export const forgetPasswordstep1 = async (req: Request, res: Response) => {
  const { numberPhone } = req?.body;
  const user = await User.findOne({ numberPhone });
  if (!user) {
    return res
      .status(404)
      .json({ ok: false, message: "کاربری وجود ندارد لطفا ثبت نام کنید" });
  }
  const otp = await generateAndSaveOtp(numberPhone, 120);
  try {
    await sendSMS(numberPhone, `کد تایید شما: ${otp} (اعتبار: 2 دقیقه)`);
  } catch (err) {
    console.error("❌ خطا در ارسال OTP:", err);
    return res
      .status(500)
      .json({ ok: false, message: "خطا در ارسال کد تایید" });
  }
  return res.status(200).json({
    ok: true,
    message: "کد احراز فرستاده شد",
  });
};

export const forgetPasswordstep2 = async (req: Request, res: Response) => {
  try {
    const { otp } = req.body;

    if (!otp || !/^\d{4,6}$/.test(otp)) {
      return res
        .status(400)
        .json({ ok: false, message: "OTP باید عددی 4 تا 6 رقمی باشد" });
    }
    const numberPhone = await redis.get(`otpLookup:${otp}`);
    if (!numberPhone) {
      return res
        .status(400)
        .json({ ok: false, message: "کد تایید منقضی شده یا نامعتبر است" });
    }
    const isValid = await verifyOtp(numberPhone, otp);
    if (!isValid) {
      return res
        .status(400)
        .json({ ok: false, message: "کد تایید اشتباه یا منقضی شده است" });
    }
    await redis.del(`otpLookup:${otp}`);
    const resetToken = jwt.sign({ numberPhone }, process.env.JWT_SECRET!, {
      expiresIn: "10m",
    });
    res.status(200).json({
      ok: true,
      massage: "رمز عبور جدید خود را وارد نمایید",
      resetToken,
    });
  } catch (error) {
    console.error("❌ خطای forgetPasswordstep2:", error);
    return res.status(500).json({ ok: false, message: "خطای سرور" });
  }
};

export const forgetPasswordstep3 = async (req: Request, res: Response) => {
  try {
    const { newPassword, resetToken } = req?.body;
    if (!newPassword || !resetToken) {
      return res.status(400).json({
        ok: false,
        message: "اطلاعات وارد شده ناقص است",
      });
    }
    const passwordRegex = /^(?=.*[a-zA-Z])(?=.*\d).{6,}$/;
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({
        ok: false,
        message: "رمز عبور باید حداقل ۶ کاراکتر و شامل حروف و اعداد باشد",
      });
    }
    let payload;
    try {
      payload = jwt.verify(resetToken, process.env.JWT_SECRET!) as {
        numberPhone: string;
      };
    } catch (err) {
      return res
        .status(400)
        .json({ ok: false, message: "توکن نامعتبر یا منقضی شده است" });
    }
    const { numberPhone } = payload as { numberPhone: string };
    if (!numberPhone) {
      return res
        .status(400)
        .json({ ok: false, message: "شماره موبایل در توکن یافت نشد" });
    }

    // 📱 بررسی وجود کاربر
    const user = await User.findOne({ numberPhone });
    if (!user) {
      return res
        .status(404)
        .json({ ok: false, message: "کاربری با این شماره یافت نشد" });
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    user.password = hashedPassword;
    await user.save();

    return res.status(200).json({
      ok: true,
      message: "رمز عبور با موفقیت تغییر یافت ✅",
    });
  } catch (error) {
    console.error("❌ خطای forgetPasswordStep3:", error);
    return res.status(500).json({ ok: false, message: "خطای داخلی سرور" });
  }
};

export const changePassword = async (req: Request, res: Response) => {
  try {
    const { numberPhone, currentPassword, newPassword } = req.body;

    if (!numberPhone || !currentPassword || !newPassword) {
      return res
        .status(400)
        .json({ ok: false, message: "تمام فیلدها الزامی است" });
    }

    const user = await User.findOne({ numberPhone: numberPhone.trim() });
    if (!user) {
      return res.status(404).json({ ok: false, message: "کاربر یافت نشد" });
    }
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res
        .status(400)
        .json({ ok: false, message: "رمز فعلی اشتباه است" });
    }
    const passwordRegex = /^(?=.*[a-zA-Z])(?=.*\d).{6,}$/;
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({
        ok: false,
        message: "رمز عبور باید حداقل ۶ کاراکتر و شامل حروف و اعداد باشد",
      });
    }
    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      return res.status(400).json({
        ok: false,
        message: "رمز جدید نمی‌تواند همان رمز قبلی باشد",
      });
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    user.password = hashedPassword;
    await user.save();
    return res
      .status(200)
      .json({ ok: true, message: "رمز عبور با موفقیت تغییر یافت ✅" });
  } catch (error) {
    console.error("❌ خطای changePassword:", error);
    return res.status(500).json({ ok: false, message: "خطای سرور" });
  }
};

export const logOut = async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(400).json({
        ok: false,
        message: "توکن یافت نشد",
      });
    }

    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET!) as { id: string };
    } catch (err) {
      return res.status(401).json({ ok: false, message: "توکن نامعتبر است" });
    }

    const userId = payload.id;

    // حذف Refresh Token مرتبط با کاربر از Redis
    await redis.del(`refreshToken:${userId}`);

    // اضافه کردن توکن فعلی به Blacklist در Redis
    const jwtExpiry = 7 * 24 * 60 * 60; // 7 روز به ثانیه
    await redis.set(`blacklistToken:${token}`, "blacklisted", "EX", jwtExpiry);

    // پاک کردن Cookie در صورت استفاده از HttpOnly Cookie
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    return res.status(200).json({
      ok: true,
      message: "خروج با موفقیت انجام شد ✅",
    });
  } catch (error) {
    console.error("❌ خطای logOutController:", error);
    return res.status(500).json({ ok: false, message: "خطای سرور" });
  }
};

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await User.find().sort({ createdAt: -1 }).exec();
    res.status(200).json({
      ok: true,
      count: users.length,
      users: users,
    });
  } catch (error: any) {
    console.error("❌ خطا در دریافت کاربران:", error);
    res.status(500).json({
      ok: false,
      message: "خطایی در دریافت کاربران رخ داد",
      error: error.message,
    });
  }
};
