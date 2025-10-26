import mongoose, { Schema, Document } from "mongoose";

export interface PaymentDocument extends Document {
  userId: mongoose.Types.ObjectId;
  amount: number;
  authority?: string;
  refId?: string;
  status: "pending" | "success" | "failed";
}

const PaymentSchema = new Schema<PaymentDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    amount: { type: Number, required: true },
    authority: String,
    refId: String,
    status: { type: String, enum: ["pending", "success", "failed"], default: "pending" },
  },
  { timestamps: true }
);

export default mongoose.model<PaymentDocument>("Payment", PaymentSchema);
