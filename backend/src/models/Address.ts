import { Schema, model, Types } from "mongoose";

export interface IAddress {
  userId: Types.ObjectId;
  address: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  isDefault: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const AddressSchema = new Schema<IAddress>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    address: {
      type: String,

      required: [true, "ادرس را دقیق وارد کنید"],
    },
    coordinates: {
      lat: { type: Number },
      lng: { type: Number },
    },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true }
);
