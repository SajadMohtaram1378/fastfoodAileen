import express from "express";
import { login, registerStep1Controller, registerStep2Controller } from "../controllers/authCn.js";

const router = express.Router();


router.post("/register/step1",registerStep1Controller)
router.post("/register/step2",registerStep2Controller)
router.post("/login",login)

export default router;
