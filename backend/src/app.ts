import express, { Request, Response, NextFunction } from "express";
import dotenv from "dotenv";
import { connectToDataBase } from "./config/dbConnection.js";

dotenv.config({ path: "./.env" });

export const createApp = async () => {
  await connectToDataBase();

  const app = express();
  app.use(express.json());

  // Routes

  // Default route
  app.get("/", (req: Request, res: Response) => {
    res.send("Server is running...");
  });

  // 404

  // Global Error Handler

  return app;
};
