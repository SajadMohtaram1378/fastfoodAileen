import express from "express";
import { loginUser } from "../../src/middlewares/loginUser.js";
import { getCart, removeCart, updateCart } from "../../src/controllers/cartCn.js";

const router = express.Router();

router.post("/update",loginUser, updateCart);
router.post("/remove", loginUser,removeCart);
router.get("/get",loginUser, getCart);

export default router;

