import Joi from "joi";

export const createPaymentSchema = Joi.object({
  // اگر اطلاعات اضافی نیاز باشد، اضافه کنید
});

export const verifyPaymentSchema = Joi.object({
  Authority: Joi.string().required(),
  Status: Joi.string().required(),
});
