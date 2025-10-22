import { Schema, model, Document, Types } from "mongoose";

export interface IProduct extends Document {
  name: string;
  description?: string;
  category: Types.ObjectId;
  price: number;
  images?: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const productSchema = new Schema<IProduct>(
  {
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
      minlength: [2, "Product name must be at least 2 characters"],
      maxlength: [100, "Product name must be less than 100 characters"],
      unique: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [2000, "Description too long"],
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "Category is required"],
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price cannot be negative"],
    },
    images: {
      type: [String],
      default: [],
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

export const Product = model<IProduct>("Product", productSchema);
