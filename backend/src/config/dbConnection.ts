import mongoose from "mongoose";

export async function connectToDataBase() {
  const db = (await mongoose.connect(process.env.MONGO_URI as string))
    .connection;
  db.on("error", console.error.bind(console, "connection error"));
  db.once("open", function () {
    console.log("Connected to Db");
  });
  return db;
}
