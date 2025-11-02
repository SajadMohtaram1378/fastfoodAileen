import express, { Request, Response, Application } from "express";
import dotenv from "dotenv";
import morgan from "morgan";
import { connectToDataBase } from "./config/dbConnection";
import authRoutes from "./routes/auth.routes";
import productRoutes from "./routes/product.routes";
import categoryRoutes from "./routes/category.routes";
import cartRoutes from "./routes/cart.routes";
import adressRoutes from "./routes/address.routes";
import paymentRoutes from "./routes/payment.routes";
import printRoutes from "./routes/print.routes";
import { loggerStream } from "./config/logger";
dotenv.config({ path: "./.env" });

export const createApp = async () => {
  const app: Application = express();
  app.use(express.json());
  app.use(morgan("combined", { stream: loggerStream }));

  // Routes
  app.use("/api/auth", authRoutes);
  app.use("/api/product", productRoutes);
  app.use("/api/category", categoryRoutes);
  app.use("/api/cart", cartRoutes);
  app.use("/api/address", adressRoutes);
  app.use("/api/payment", paymentRoutes);
  app.use("/api/print", printRoutes);

  // Default route
  app.get("/", (req: Request, res: Response) => {
    res.send("Server is running...");
  });
  // فقط وقتی NODE_ENV !== "test" هست وصل شو
  if (process.env.NODE_ENV !== "test") {
    connectToDataBase();
    
  }
  // 404

  // Global Error Handler

  return app;
};

export default createApp;
