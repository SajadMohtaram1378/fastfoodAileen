import express from "express";
import {
  changePassword,
  forgetPasswordstep1,
  forgetPasswordstep2,
  forgetPasswordstep3,
  getAllUsers,
  login,
  logOut,
  registerStep1,
  registerStep2,
} from "../controllers/authCn.js";
import { loginUser } from "../../src/middlewares/loginUser.js";
import { adminUser } from "../../src/middlewares/adminUser.js";

const router = express.Router();

router.post("/register/step1", registerStep1);
router.post("/register/step2", registerStep2);
router.post("/login", login);
router.post("/forget-password/step1", forgetPasswordstep1);
router.post("/forget-password/step2", forgetPasswordstep2);
router.post("/forget-password/step3", forgetPasswordstep3);
router.post("/change-password", loginUser, changePassword);
router.post("/logOut", loginUser, logOut);
router.post("/get-users", loginUser, adminUser, getAllUsers);

export default router;
