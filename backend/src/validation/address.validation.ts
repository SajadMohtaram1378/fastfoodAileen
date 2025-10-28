// src/validation/address.validation.ts
import Joi from "joi";

export const addAddressSchema = Joi.object({
  address: Joi.string().trim().min(3).required().messages({
    "string.empty": "آدرس الزامی است",
    "string.min": "آدرس باید حداقل ۳ کاراکتر باشد",
  }),
  coordinates: Joi.array()
    .items(Joi.number())
    .length(2)
    .messages({
      "array.length": "مختصات باید شامل طول و عرض جغرافیایی باشد",
      "array.base": "مختصات باید آرایه‌ای از اعداد باشد",
    }),
});

export const setDefaultAddressSchema = Joi.object({
  addressId: Joi.string().required().messages({
    "string.empty": "addressId الزامی است",
  }),
});
