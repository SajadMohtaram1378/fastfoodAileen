import { Request, Response } from "express";
import { productService } from "@/service/product.service";
import { logger } from "@/config/logger";
type AuthRequest = Request & {
  user?: { id: string; role: "admin" | "user" };
};

export const createProduct = async (req: AuthRequest, res: Response) => {
  try {
    const product = await productService.createProduct(req.body, req.files as Express.Multer.File[]);
    res.status(201).json({ ok: true, message: "محصول ایجاد شد", data: product });
  } catch (err: any) {
    logger.error(`createProductController: ${err.message}`);
    res.status(500).json({ ok: false, message: err.message });
  }
};

export const updateOneProduct = async (req: AuthRequest, res: Response) => {
  try {
    const product = await productService.updateProduct(req.params.id, req.body, req.files as Express.Multer.File[]);
    res.status(200).json({ ok: true, message: "محصول بروزرسانی شد", data: product });
  } catch (err: any) {
    logger.error(`updateProductController: ${err.message}`);
    res.status(500).json({ ok: false, message: err.message });
  }
};

export const deleteOneProduct = async (req: AuthRequest, res: Response) => {
  try {
    await productService.deleteProduct(req.params.id);
    res.status(200).json({ ok: true, message: "محصول حذف شد" });
  } catch (err: any) {
    logger.error(`deleteProductController: ${err.message}`);
    res.status(500).json({ ok: false, message: err.message });
  }
};

export const getAllProducts = async (req: Request, res: Response) => {
  try {
    const filter: any = {};
    if (req.query.category) filter.category = req.query.category;
    const products = await productService.getAllProducts(filter);
    res.status(200).json({ ok: true, message: "لیست محصولات", data: products });
  } catch (err: any) {
    logger.error(`getAllProductsController: ${err.message}`);
    res.status(500).json({ ok: false, message: err.message });
  }
};

export const getOneProduct = async (req: Request, res: Response) => {
  try {
    const product = await productService.getOneProduct(req.params.id);
    res.status(200).json({ ok: true, message: "جزئیات محصول", data: product });
  } catch (err: any) {
    logger.error(`getOneProductController: ${err.message}`);
    res.status(500).json({ ok: false, message: err.message });
  }
};
