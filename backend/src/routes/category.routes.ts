import express from "express";
import { createCategory, getAllCategories, updateCategory } from "../../src/controllers/categoryCn.js";
const router = express.Router();

router.post("/create-category",createCategory)
router.post("/update-category",updateCategory)
router.post("/get-all-category",getAllCategories)




export default router;
