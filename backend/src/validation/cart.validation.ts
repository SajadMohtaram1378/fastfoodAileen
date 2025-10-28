import Joi from "joi";

// Validation برای updateCart
export const updateCartSchema = Joi.object({
  productId: Joi.string().length(24).required().messages({
    "string.empty": "productId الزامی است",
    "string.length": "productId نامعتبر است",
    "any.required": "productId الزامی است",
  }),
  quantity: Joi.number().integer().required().messages({
    "number.base": "quantity باید عدد باشد",
    "any.required": "quantity الزامی است",
  }),
});
