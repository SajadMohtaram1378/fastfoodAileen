import { Category } from "@/models/Category";
import s3 from "@/config/arvans3";

interface CategoryPayload {
  name?: string;
  isActive?: boolean;
  removeOldImage?: string;
  file?: Express.Multer.File;
}

export const categoryService = {
  async createCategory(data: CategoryPayload) {
    const { name, isActive, file } = data;
    if (!file) throw new Error("Category image is required");

    const fileName = `${Date.now()}-${file.originalname}`;
    const uploadResult = await s3.upload({
      Bucket: process.env.ARVAN_BUCKET_NAME!,
      Key: fileName,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: "public-read",
    }).promise();

    const category = await Category.create({
      name,
      image: uploadResult.Location,
      isActive: isActive ?? true,
    });

    return category;
  },

  async updateCategory(id: string, data: CategoryPayload) {
    const category = await Category.findById(id);
    if (!category) throw new Error("Category not found");

    if (data.name) category.name = data.name;
    if (data.isActive !== undefined) category.isActive = data.isActive;

    if (data.file) {
      const fileName = `${Date.now()}-${data.file.originalname}`;
      const uploadResult = await s3.upload({
        Bucket: process.env.ARVAN_BUCKET_NAME!,
        Key: fileName,
        Body: data.file.buffer,
        ContentType: data.file.mimetype,
        ACL: "public-read",
      }).promise();

      category.image = uploadResult.Location;

      if (data.removeOldImage) {
        const fileKey = data.removeOldImage.split("/").pop();
        if (fileKey) {
          try {
            await s3.deleteObject({
              Bucket: process.env.ARVAN_BUCKET_NAME!,
              Key: fileKey,
            }).promise();
          } catch (err) {
            console.warn(`Failed to delete old image ${fileKey} from S3`, err);
          }
        }
      }
    }

    await category.save();
    return category;
  },

  async getAllCategories() {
    return Category.find().sort({ createdAt: -1 });
  },
};
