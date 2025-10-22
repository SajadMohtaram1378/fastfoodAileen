import mongoose, { model, Schema, Types } from "mongoose";

export interface IOrder extends Document {
  userId: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
  boughtCart?: string[];
}

const orderHistory = new Schema<IOrder>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    boughtCart: { type: [Object], default: [] },
  },
  { timestamps: true }
);

export const OrderHistory =
  mongoose.models.OrderHistory || model<IOrder>("OrderHistory", orderHistory);
