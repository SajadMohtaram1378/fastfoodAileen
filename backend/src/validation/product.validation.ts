import Joi from "joi";

export const createProductSchema = Joi.object({
  name: Joi.string().required().messages({
    "any.required": "نام محصول الزامی است",
    "string.empty": "نام محصول نمی‌تواند خالی باشد",
  }),
  category: Joi.string().required().messages({
    "any.required": "دسته‌بندی محصول الزامی است",
  }),
  price: Joi.number().required().messages({
    "any.required": "قیمت محصول الزامی است",
  }),
  description: Joi.string().allow("").optional(),
  isActive: Joi.boolean().optional(),
});

export const updateProductSchema = Joi.object({
  id: Joi.string().required(),
  name: Joi.string().optional(),
  category: Joi.string().optional(),
  price: Joi.number().optional(),
  description: Joi.string().allow("").optional(),
  isActive: Joi.boolean().optional(),
  removeOldImages: Joi.array().items(Joi.string()).optional(),
});
