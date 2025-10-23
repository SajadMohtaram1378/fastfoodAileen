import { Request, Response } from "express";
import { Category } from "../../src/models/Category.js";
import  s3  from "../config/arvans3.js";
import { Product } from "../../src/models/Product.js";

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
    const { id } = req?.params;
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

export const deleteOneProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req?.params;

    // بررسی وجود ID
    if (!id) {
      return res.status(400).json({ message: "شناسه محصول الزامی است" });
    }

    // پیدا کردن محصول قبل از حذف (برای حذف عکس از Arvan)
    const product = await Product.findById(id).exec();

    if (!product) {
      return res.status(404).json({ message: "محصول یافت نشد" });
    }

    if (product.images && product.images.length > 0) {
      for (const imageUrl of product.images) {
        const fileKey = imageUrl.split("/").pop();
        if (fileKey) {
          try {
            await s3
              .deleteObject({
                Bucket: process.env.ARVAN_BUCKET_NAME!,
                Key: fileKey,
              })
              .promise();
          } catch (err) {
            console.warn(`❗ حذف فایل ${fileKey} در Arvan ناموفق بود`, err);
          }
        }
      }
    }

    await Product.findByIdAndDelete(id).exec();

    res.status(200).json({
      ok: true,
      message: "محصول با موفقیت حذف شد",
    });
  } catch (error: any) {
    console.error("❌ خطا در حذف محصول:", error);
    res.status(500).json({
      ok: false,
      message: "خطایی در حذف محصول رخ داد",
      error: error.message,
    });
  }
};

export const updateOneProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, category, price, isActive, removeOldImages } =
      req.body;

    if (!id) {
      return res.status(400).json({ message: "شناسه محصول الزامی است" });
    }

    const product = await Product.findById(id).exec();
    if (!product) {
      return res.status(404).json({ message: "محصول یافت نشد" });
    }

    if (category) {
      const categoryExists = await Category.findById(category);
      if (!categoryExists) {
        return res
          .status(404)
          .json({ message: "دسته‌بندی انتخاب‌شده وجود ندارد" });
      }
      product.category = category;
    }

    // 📦 آماده‌سازی لیست عکس‌های جدید
    let newImages: string[] = [];

    // ✅ اگر کاربر فقط یک عکس فرستاده باشد
    if (req.file) {
      const file = req.file as Express.Multer.File;
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
      newImages.push(uploadResult.Location);
    }
    // ✅ اگر کاربر چند عکس فرستاده باشد
    else if (req.files && Array.isArray(req.files)) {
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
        newImages.push(uploadResult.Location);
      }
    }

    // ✅ حذف عکس‌های قدیمی (اختیاری)
    if (removeOldImages && Array.isArray(removeOldImages)) {
      for (const oldUrl of removeOldImages) {
        const fileKey = oldUrl.split("/").pop();
        if (fileKey) {
          try {
            await s3
              .deleteObject({
                Bucket: process.env.ARVAN_BUCKET_NAME!,
                Key: fileKey,
              })
              .promise();
          } catch (err) {
            console.warn(`⚠️ حذف فایل ${fileKey} از Arvan ناموفق بود`, err);
          }
        }

        // از لیست عکس‌ها حذفش کن
        product.images = product.images?.filter((img) => img !== oldUrl) || [];
      }
    }

    // ✅ به‌روزرسانی سایر فیلدها
    if (name) product.name = name;
    if (description) product.description = description;
    if (price) product.price = price;
    if (isActive !== undefined) product.isActive = isActive;

    // ✅ افزودن عکس‌های جدید
    if (newImages.length > 0) {
      product.images = [...(product.images || []), ...newImages];
    }

    await product.save();

    res.status(200).json({
      ok: true,
      message: "محصول با موفقیت بروزرسانی شد ✅",
      product,
    });
  } catch (error: any) {
    console.error("❌ خطا در بروزرسانی محصول:", error);
    res.status(500).json({
      ok: false,
      message: "خطایی در بروزرسانی محصول رخ داد",
      error: error.message,
    });
  }
};
