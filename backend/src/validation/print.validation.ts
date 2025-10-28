import Joi from "joi";

export const printReceiptAgainSchema = Joi.object({
  receiptNumber: Joi.string().required().messages({
    "any.required": "شماره فیش لازم است",
    "string.empty": "شماره فیش نمی‌تواند خالی باشد",
  }),
  type: Joi.string().valid("kitchen", "delivery").required().messages({
    "any.required": "نوع فیش لازم است",
    "any.only": "نوع فیش باید kitchen یا delivery باشد",
  }),
});
