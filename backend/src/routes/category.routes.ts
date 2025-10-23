import express from "express";
import { createCategory, getAllCategories, updateCategory } from "../../src/controllers/categoryCn.js";
import { loginUser } from "../../src/middlewares/loginUser.js";
import { adminUser } from "../../src/middlewares/adminUser.js";
const router = express.Router();

router.post("/create-category",loginUser,adminUser,createCategory)
router.post("/update-category",loginUser,adminUser,updateCategory)
router.post("/get-all-category",getAllCategories)




export default router;
