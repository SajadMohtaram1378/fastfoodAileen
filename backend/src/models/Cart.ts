import mongoose, { Schema, Document } from "mongoose";

interface CartItem {
  productId: mongoose.Types.ObjectId;
  name: string;
  price: number;
  quantity: number;
}

export interface CartDocument extends Document {
  userId: mongoose.Types.ObjectId;
  items: CartItem[];
  totalPrice: number;
}

const CartSchema = new Schema<CartDocument>({
  userId: { type: Schema.Types.ObjectId, ref: "User", unique: true },
  items: [
    {
      productId: { type: Schema.Types.ObjectId, ref: "Product" },
      name: String,
      price: Number,
      quantity: Number,
    },
  ],
  totalPrice: { type: Number, default: 0 },
});

export default mongoose.model<CartDocument>("Cart", CartSchema);
