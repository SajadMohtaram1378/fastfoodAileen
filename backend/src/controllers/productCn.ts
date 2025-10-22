import { Request, Response } from "express";
import { Category } from "../../src/models/Category";
import { s3 } from "../../src/config/s3";
import { Product } from "../../src/models/Product";

export const createProduct = async (req: Request, res: Response) => {
  try {
    const { name, description, category, price, isActive } = req?.body;

    if (!name || !category || !price) {
      return res
        .status(400)
        .json({ message: "نام، دسته‌بندی و قیمت محصول الزامی است" });
    }

    const categoryExists = await Category.findById(category);
    if (!categoryExists) {
      return res
        .status(404)
        .json({ message: "دسته‌بندی انتخاب شده وجود ندارد" });
    }

    const images: string[] = [];
    if (req.files && Array.isArray(req.files)) {
      for (const file of req.files as Express.Multer.File[]) {
        const fileName = `${Date.now()}-${file.originalname}`;
        const uploadResult = await s3
          .upload({
            Bucket: process.env.ARVAN_BUCKET_NAME!,
            Key: fileName,
            Body: file.buffer,
            ContentType: file.mimetype,
            ACL: "public-read",
          })
          .promise();

        images.push(uploadResult.Location);
      }
    }

    const product = await Product.create({
      name,
      description,
      category,
      price,
      images,
      isActive: isActive ?? true,
    });

    res.status(201).json({
      ok: true,
      message: "محصول با موفقیت ایجاد شد",
      data: product,
    });
  } catch (error: any) {
    console.error("Error in createProduct:", error);
    res
      .status(500)
      .json({ message: "خطا در ایجاد محصول", error: error.message });
  }
};

export const getAllProducts = async (req: Request, res: Response) => {
  try {
    const { category } = req?.query;

    const filter: any = {};
    if (category) {
      filter.category = category;
    }

    const products = await Product.find(filter).sort({ createdAt: -1 });

    res.status(200).json({
      ok: true,
      message: "لیست محصولات با موفقیت دریافت شد",
      data: products,
    });
  } catch (error: any) {
    console.error("Error in getAllProducts:", error);
    res.status(500).json({
      ok: false,
      message: "خطا در دریافت محصولات",
      error: error.message,
    });
  }
};

export const getOneProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ message: "شناسه محصول الزامی است" });
    }
    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({ message: "محصول یافت نشد" });
    }
    res.status(200).json({
      ok: true,
      message: "جزئیات محصول با موفقیت دریافت شد",
      data: product,
    });
  } catch (error) {
    console.error("Error in getOneProduct:", error);
    res.status(500).json({
      ok: false,
      message: "خطا در دریافت محصول",
      error: error,
    });
  }
};

export const deleteOneProduct = async (req: Request, res: Response) => {};

export const updateOneProduct = async (req: Request, res: Response) => {};
