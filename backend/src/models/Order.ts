import mongoose, { Schema, Document } from "mongoose";

interface OrderItem {
  productId: mongoose.Types.ObjectId;
  name: string;
  price: number;
  quantity: number;
}

export interface OrderDocument extends Document {
  userId: mongoose.Types.ObjectId;
  items: OrderItem[];
  totalPrice: number;
  status: "pending" | "paid" | "shipped" | "delivered" | "canceled";
  paymentId?: mongoose.Types.ObjectId;
}

const OrderSchema = new Schema<OrderDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    items: [
      {
        productId: { type: Schema.Types.ObjectId, ref: "Product" },
        name: String,
        price: Number,
        quantity: Number,
      },
    ],
    totalPrice: { type: Number, required: true },
    status: {
      type: String,
      enum: ["pending", "paid", "shipped", "delivered", "canceled"],
      default: "pending",
    },
    paymentId: { type: Schema.Types.ObjectId, ref: "Payment" },
  },
  { timestamps: true }
);

export default mongoose.model<OrderDocument>("Order", OrderSchema);
