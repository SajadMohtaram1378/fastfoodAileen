import express from "express";
import multer from "multer";
import { createCategory, getAllCategories, updateCategory } from "@/controllers/categoryCn";
import { loginUser } from "@/middlewares/loginUser";
import { adminUser } from "@/middlewares/adminUser";
import { validate } from "@/middlewares/validation.middleware";
import { createCategorySchema, updateCategorySchema } from "@/validation/category.validation";

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
