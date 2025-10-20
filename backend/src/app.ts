import express, { Request, Response, Application } from "express";
import dotenv from "dotenv";
import { connectToDataBase } from "./config/dbConnection.js";
import authRoutes from "./routes/auth.routes.js"; // ← اینجا .js اضافه شد
dotenv.config({ path: "./.env" });

export const createApp = async () => {
  await connectToDataBase();

const app: Application = express();
  app.use(express.json());


  // Routes
  app.use("/api/auth", authRoutes);


  // Default route
  app.get("/", (req: Request, res: Response) => {
    res.send("Server is running...");
  });

  // 404

  // Global Error Handler

  return app;
};
