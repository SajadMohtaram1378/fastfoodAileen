import { Request, Response, NextFunction } from "express";
import { ObjectSchema } from "joi";
import { logger } from "@/config/logger";

export const validate =
  (schema: ObjectSchema) =>
  (req: Request, res: Response, next: NextFunction) => {
    const { error } = schema.validate(req.body, { abortEarly: false });

    if (error) {
      const errors = error.details.map((err) => err.message);
      logger.warn(`Validation error: ${errors.join(", ")}`);
      return res.status(400).json({ success: false, errors });
    }

    next();
  };
