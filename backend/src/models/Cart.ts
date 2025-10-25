import mongoose, { Schema, Document, Types } from "mongoose";

export interface ICartItem extends Document {
  productId: Types.ObjectId;
  name: string;
  price: number;
  quantity: number;
}

export interface ICart extends Document {
  userId: Types.ObjectId;
  items: ICartItem[];
  totalPrice: number;
  createdAt?: Date;
  updatedAt?: Date;
}

const CartItemSchema: Schema = new Schema({
  productId: {
    type: Schema.Types.ObjectId,
    ref: "Product",
    required: [true, "ProductId is required"],
  },
  name: {
    type: String,
    required: [true, "name is required"],
  },
  price: {
    type: Number,
    required: true,
  },
  quantity: {
  type: Number,
  required: [true, "quantity is required"],
  min: [1, "quantity must be at least 1"],
},
});

const CartSchema: Schema = new Schema({
  userId: {
    type: Schema.ObjectId,
    ref: "User",
    required: true,
    unique: true,
  },
  items: {
    type: [CartItemSchema],
    default: [],
  },
  totalPrice: {
    type: Number,
    default: 0,
  },
},{timestamps:true});



export const Cart = mongoose.model<ICart>("Cart",CartSchema)
