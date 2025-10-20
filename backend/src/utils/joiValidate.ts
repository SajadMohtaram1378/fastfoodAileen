import Joi from "joi";

export const registerSchema = Joi.object({
  name: Joi.string()
    .pattern(/^[A-Za-z\s]{2,50}$/)
    .required()
    .messages({
      "string.empty": "نام الزامی است",
      "string.pattern.base":
        "نام باید فقط شامل حروف و فاصله باشد و حداقل 2 کاراکتر",
    }),
  numberPhone: Joi.string()
    .pattern(/^09\d{9}$/)
    .required()
    .messages({
      "string.empty": "شماره موبایل الزامی است",
      "string.pattern.base":
        "شماره موبایل معتبر نیست. باید با 09 شروع شود و 11 رقم باشد",
    }),
  password: Joi.string()
    .pattern(/^(?=.*[a-zA-Z])(?=.*\d).{6,}$/)
    .required()
    .messages({
      "string.empty": "رمز عبور الزامی است",
      "string.pattern.base":
        "رمز عبور حداقل 6 کاراکتر و شامل حداقل یک حرف و یک عدد باشد",
    }),
  address: Joi.alternatives()
    .try(
      Joi.string().trim().min(3),
      Joi.array().items(Joi.string().trim().min(3))
    )
    .required()
    .messages({
      "alternatives.match": "آدرس باید رشته یا آرایه‌ای از رشته‌ها باشد",
    }),
});

export const registerStep2Schema = Joi.object({
  otp: Joi.string()
    .pattern(/^\d{4,6}$/)
    .required()
    .messages({
      "string.pattern.base": "OTP باید عددی 4 تا 6 رقمی باشد",
      "string.empty": "OTP الزامی است",
    }),
  name: registerSchema.extract("name"),
  numberPhone: registerSchema.extract("numberPhone"),
  password: registerSchema.extract("password"),
  address: registerSchema.extract("address"),
});

export const loginSchema = Joi.object({
  numberPhone: registerSchema.extract("numberPhone"),
  password: registerSchema.extract("password"),
});
