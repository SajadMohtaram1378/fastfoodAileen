import Joi from "joi";

export const createCategorySchema = Joi.object({
  name: Joi.string().min(2).max(50).required(),
  isActive: Joi.boolean().optional(),
});

export const updateCategorySchema = Joi.object({
  name: Joi.string().min(2).max(50).optional(),
  isActive: Joi.boolean().optional(),
  removeOldImage: Joi.string().uri().optional(),
});
