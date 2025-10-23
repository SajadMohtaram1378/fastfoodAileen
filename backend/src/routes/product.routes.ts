import express from "express";
import {
  createProduct,
  deleteOneProduct,
  getAllProducts,
  getOneProduct,
  updateOneProduct,
} from "../../src/controllers/productCn.js";
import { loginUser } from "../../src/middlewares/loginUser.js";
import { adminUser } from "../../src/middlewares/adminUser.js";
const router = express.Router();

router.post("/create-product", loginUser, adminUser, createProduct);
router.post("/all-product", getAllProducts);
router.post("/delete-product", loginUser, adminUser, deleteOneProduct);
router.post("/update-product", loginUser, adminUser, updateOneProduct);
router.post("/get-product", getOneProduct);

export default router;
