import { Schema, model, Document } from "mongoose";

export interface ICategory extends Document {
  name: string;
  image: string;
  isActive: Boolean;
  createdAt: Date;
  updatedAt: Date;
}

const categorySchema = new Schema<ICategory>(
  {
    name: {
      type: String,
      required: [true, "Category name is required"],
      trim: true,
      minlength: [2, "Category name must be at least 2 characters"],
      maxlength: [50, "Category name must be less than 50 characters"],
    },
    image: {
      type: String,
      required: [true, "Category image is required"],
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Category = model<ICategory>("Category", categorySchema);
