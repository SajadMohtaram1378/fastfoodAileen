import { Request, Response } from "express";
import redis from "../config/redis.js";
import { generateAndSaveOtp, verifyOtp } from "../utils/otpHandler.js";
import { sendSMS } from "../utils/kavehnegarsms.js";
import { User } from "../../src/models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { loginSchema, registerSchema } from "../../src/utils/joiValidate.js";

export const registerStep1Controller = async (req: Request, res: Response) => {
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
      `register:${numberPhone}`,
      JSON.stringify({ name, password, address }),
      "EX",
      600 // 10 دقیقه اعتبار
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

export const registerStep2Controller = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { otp } = req.body;

    if (!otp || !/^\d{4,6}$/.test(otp)) {
      return res
        .status(400)
        .json({ ok: false, message: "OTP باید عددی 4 تا 6 رقمی باشد" });
    }

    // دریافت شماره موبایل از Redis
    const numberPhone = await redis.get(`otp:${otp}`);
    if (!numberPhone) {
      return res
        .status(400)
        .json({ ok: false, message: "کد تایید منقضی شده یا وجود ندارد" });
    }

    // بررسی صحت OTP
    const isValidOtp = await verifyOtp(numberPhone, otp);
    if (!isValidOtp) {
      return res
        .status(400)
        .json({ ok: false, message: "کد تایید اشتباه یا منقضی شده است" });
    }

    // بررسی وجود کاربر
    const existingUser = await User.findOne({ numberPhone });
    if (existingUser) {
      return res
        .status(400)
        .json({ ok: false, message: "کاربر قبلاً ساخته شده است" });
    }

    // دریافت اطلاعات ثبت‌نام مرحله اول از Redis
    const userDataString = await redis.get(`userData:${numberPhone}`);
    if (!userDataString) {
      return res
        .status(400)
        .json({ ok: false, message: "اطلاعات ثبت‌نام یافت نشد" });
    }
    const { name, password, address } = JSON.parse(userDataString);

    // هش کردن رمز عبور
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // ساخت کاربر
    const newUser = await User.create({
      name,
      numberPhone,
      password: hashedPassword,
      address,
      role: "user",
    });

    // حذف داده‌ها از Redis
    await redis.del(`userData:${numberPhone}`);

    // ایجاد JWT
    const token = jwt.sign(
      { id: newUser._id, role: newUser.role },
      process.env.JWT_SECRET!,
      { expiresIn: "7d" }
    );

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
  } catch (err) {
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
        message: "رمز عبور اشتباه است",
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

export const requestPasswordReset = async (req: Request, res: Response) => {};
export const verifyResetOtpAndChangePassword = async (
  req: Request,
  res: Response
) => {};
