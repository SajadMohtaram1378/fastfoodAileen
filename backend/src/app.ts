import express, { Request, Response, Application } from "express";
import dotenv from "dotenv";
import { connectToDataBase } from "./config/dbConnection.js";
import authRoutes from "./routes/auth.routes.js"; 
import productRoutes from "./routes/product.routes.js"
import categoryRoutes from "./routes/category.routes.js"
import cartRoutes from "./routes/cart.routes.js"
dotenv.config({ path: "./.env" });

export const createApp = async () => {
  await connectToDataBase();

const app: Application = express();
  app.use(express.json());


  // Routes
  app.use("/api/auth", authRoutes);
  app.use("/api/product",productRoutes);
  app.use("/api/category",categoryRoutes);
  app.use("/api/cart",cartRoutes);


  // Default route
  app.get("/", (req: Request, res: Response) => {
    res.send("Server is running...");
  });

  // 404

  // Global Error Handler

  return app;
};
