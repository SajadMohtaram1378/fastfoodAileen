import mongoose, { Document, Schema, Types, model } from "mongoose";

export type UserRole = "user" | "admin";

export interface IUser extends Document {
  name: string;
  numberPhone: String;
  password: String;
  address: string;
  role: UserRole;
  orderHistory?: Types.ObjectId[];
  cart?: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      trim: true,
      required: [true, "Name is required"],
    },
    numberPhone: {
      type: String,
      required: [true, "Numberphone is required"],
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    address: {
      type:  String ,
      required: [true, "Address is reqired or choose one"],
    },
    cart: {
      type: Schema.Types.ObjectId,
      ref: "Cart",
    },
    orderHistory: {
      type: [{ type: Schema.Types.ObjectId, ref: "Order" }],
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
  },
  { timestamps: true }
);

export const User = mongoose.models.User || model<IUser>("User", userSchema);
