import { Request, Response } from "express";
import { categoryService } from "@/service/category.service";
import { logger } from "@/config/logger";
import { createCategorySchema, updateCategorySchema } from "@/validation/category.validation";

// ------------------ Create Category ------------------
export const createCategory = async (req: Request, res: Response) => {
  try {
    const { error, value } = createCategorySchema.validate(req.body);
    if (error) return res.status(400).json({ ok: false, details: error.details });

    const category = await categoryService.createCategory({ ...value, file: req.file });
    return res.status(201).json({ ok: true, message: "Category created", data: category });
  } catch (err: any) {
    logger.error(`createCategoryController: ${err.message}`);
    return res.status(500).json({ ok: false, message: err.message });
  }
};

// ------------------ Update Category ------------------
export const updateCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ ok: false, message: "Category ID required" });

    const { error, value } = updateCategorySchema.validate(req.body);
    if (error) return res.status(400).json({ ok: false, details: error.details });

    const updatedCategory = await categoryService.updateCategory(id, { ...value, file: req.file });
    return res.status(200).json({ ok: true, message: "Category updated", data: updatedCategory });
  } catch (err: any) {
    logger.error(`updateCategoryController: ${err.message}`);
    return res.status(500).json({ ok: false, message: err.message });
  }
};

// ------------------ Get All Categories ------------------
export const getAllCategories = async (req: Request, res: Response) => {
  try {
    const categories = await categoryService.getAllCategories();
    return res.status(200).json({ ok: true, data: categories });
  } catch (err: any) {
    logger.error(`getAllCategoriesController: ${err.message}`);
    return res.status(500).json({ ok: false, message: err.message });
  }
};
