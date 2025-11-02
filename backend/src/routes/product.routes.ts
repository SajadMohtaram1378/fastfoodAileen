import express from "express";
import {
  createProduct,
  deleteOneProduct,
  getAllProducts,
  getOneProduct,
  updateOneProduct,
} from "@/controllers/productCn";
import { loginUser } from "@/middlewares/loginUser";
import { adminUser } from "@/middlewares/adminUser";
const router = express.Router();

router.post("/create-product", loginUser, adminUser, createProduct);
router.post("/all-product", getAllProducts);
router.post("/delete-product", loginUser, adminUser, deleteOneProduct);
router.post("/update-product", loginUser, adminUser, updateOneProduct);
router.post("/get-product", getOneProduct);

export default router;
