import Product from "../../src/models/Product.ts";
import { Category } from "../../src/models/Category.js";
import s3 from "../../src/config/arvans3.ts";

export const productService = {
  async createProduct(data: any, files?: Express.Multer.File[]) {
    const { name, description, category, price, isActive } = data;

    const categoryExists = await Category.findById(category);
    if (!categoryExists) throw new Error("دسته‌بندی انتخاب شده وجود ندارد");

    const images: string[] = [];
    if (files && files.length > 0) {
      for (const file of files) {
        const fileName = `${Date.now()}-${file.originalname}`;
        const uploadResult = await s3.upload({
          Bucket: process.env.ARVAN_BUCKET_NAME!,
          Key: fileName,
          Body: file.buffer,
          ContentType: file.mimetype,
          ACL: "public-read",
        }).promise();
        images.push(uploadResult.Location);
      }
    }

    return await Product.create({
      name,
      description,
      category,
      price,
      images,
      isActive: isActive ?? true,
    });
  },

  async updateProduct(id: string, data: any, files?: Express.Multer.File[]) {
    const product = await Product.findById(id);
    if (!product) throw new Error("محصول یافت نشد");

    const { name, description, category, price, isActive, removeOldImages } = data;

    if (category) {
      const categoryExists = await Category.findById(category);
      if (!categoryExists) throw new Error("دسته‌بندی انتخاب شده وجود ندارد");
      product.category = category;
    }

    if (name) product.name = name;
    if (description) product.description = description;
    if (price) product.price = price;
    if (isActive !== undefined) product.isActive = isActive;

    const newImages: string[] = [];

    if (files && files.length > 0) {
      for (const file of files) {
        const fileName = `${Date.now()}-${file.originalname}`;
        const uploadResult = await s3.upload({
          Bucket: process.env.ARVAN_BUCKET_NAME!,
          Key: fileName,
          Body: file.buffer,
          ContentType: file.mimetype,
          ACL: "public-read",
        }).promise();
        newImages.push(uploadResult.Location);
      }
    }

    if (removeOldImages && Array.isArray(removeOldImages)) {
      for (const oldUrl of removeOldImages) {
        const fileKey = oldUrl.split("/").pop();
        if (fileKey) {
          try {
            await s3.deleteObject({
              Bucket: process.env.ARVAN_BUCKET_NAME!,
              Key: fileKey,
            }).promise();
          } catch {}
        }
        product.images = product.images?.filter(img => img !== oldUrl) || [];
      }
    }

    if (newImages.length > 0) {
      product.images = [...(product.images || []), ...newImages];
    }

    return await product.save();
  },

  async deleteProduct(id: string) {
    const product = await Product.findById(id);
    if (!product) throw new Error("محصول یافت نشد");

    if (product.images && product.images.length > 0) {
      for (const imageUrl of product.images) {
        const fileKey = imageUrl.split("/").pop();
        if (fileKey) {
          try {
            await s3.deleteObject({
              Bucket: process.env.ARVAN_BUCKET_NAME!,
              Key: fileKey,
            }).promise();
          } catch {}
        }
      }
    }

    await Product.findByIdAndDelete(id);
    return product;
  },

  async getAllProducts(filter: any = {}) {
    return await Product.find(filter).sort({ createdAt: -1 });
  },

  async getOneProduct(id: string) {
    const product = await Product.findById(id);
    if (!product) throw new Error("محصول یافت نشد");
    return product;
  }
};
