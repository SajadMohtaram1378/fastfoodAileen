import express from "express";
const router = express.Router();

import { loginUser } from "@/middlewares/loginUser";
import {
  addAddress,
  deleteAddress,
  deleteAllAddresses,
  setDefaultAddress,
} from "@/controllers/addressCn";

router.post("/add-address", loginUser, addAddress);
router.post("/set-default", loginUser, setDefaultAddress);
router.post("/delete", loginUser, deleteAddress);
router.post("/delete-all",loginUser,deleteAllAddresses)


export default router;
