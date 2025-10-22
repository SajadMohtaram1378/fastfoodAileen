import { Request, Response } from "express";
import { s3 } from "../../src/config/s3";
import { Category } from "../../src/models/Category";

export const createCategory = async (req: Request, res: Response) => {
  try {
    const { name, isActive } = req?.body;

    if (!name) {
      return res.status(400).json({ message: "نام دسته‌بندی الزامی است" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "عکس دسته‌بندی الزامی است" });
    }

    const file = req.file as Express.Multer.File;
    const fileName = `${Date.now()}-${file.originalname}`;

    // آپلود عکس روی Arvan
    const uploadResult = await s3
      .upload({
        Bucket: process.env.ARVAN_BUCKET_NAME!,
        Key: fileName,
        Body: file.buffer,
        ContentType: file.mimetype,
        ACL: "public-read",
      })
      .promise();

    // ایجاد دسته‌بندی در MongoDB
    const category = await Category.create({
      name,
      image: uploadResult.Location,
      isActive: isActive ?? true,
    });

    res.status(201).json({
      ok: true,
      message: "دسته‌بندی ایجاد شد",
      data: category,
    });
  } catch (error: any) {
    console.error("Error at create category:", error);
    res
      .status(500)
      .json({ message: "خطا در ایجاد دسته‌بندی", error: error.message });
  }
};

export const getAllCategories = async (req: Request, res: Response) => {
     try {
        const Categories = await Category.find().sort({ createdAt: -1 });
        res.status(200).json({
          ok: true,
          message: " دسته بندی ها با موفقیت دریافت شد",
          data: Categories, 
        });
      } catch (error) {
        console.error("Error in createProduct:", error);
        res.status(500).json({ message: "خطا در ایجاد محصول", error: error });
      }
};

export const updateCategory = async (req: Request, res: Response) => {};
