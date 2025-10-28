import express from "express";
import multer from "multer";
import { createCategory, getAllCategories, updateCategory } from "../../src/controllers/categoryCn.ts";
import { loginUser } from "../../src/middlewares/loginUser.js";
import { adminUser } from "../../src/middlewares/adminUser.js";
import { validate } from "../../src/middlewares/validation.middleware.js";
import { createCategorySchema, updateCategorySchema } from "../../src/validation/category.validation.js";

const router = express.Router();
const upload = multer(); // memory storage

// ایجاد دسته‌بندی
router.post(
  "/categories",
  loginUser,
  adminUser,
  upload.single("image"),
  validate(createCategorySchema),
  createCategory
);

// آپدیت دسته‌بندی
router.patch(
  "/categories/:id",
  loginUser,
  adminUser,
  upload.single("image"),
  validate(updateCategorySchema),
  updateCategory
);

// دریافت همه دسته‌بندی‌ها
router.get("/categories", getAllCategories);

export default router;
