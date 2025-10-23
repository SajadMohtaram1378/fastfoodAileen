import express from "express";
import {
  createProduct,
  deleteOneProduct,
  getAllProducts,
  updateOneProduct,
} from "../../src/controllers/productCn.js";
const router = express.Router();

router.post("/create-product", createProduct);
router.post("/get-product", getAllProducts);
router.post("/delete-product", deleteOneProduct);
router.post("/update-product", updateOneProduct);

export default router;
