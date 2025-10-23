import multer from "multer";
import path from "path";

const storage = multer.memoryStorage();

const fileFilter = (req: any, file: Express.Multer.File, cb: Function) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if ([".png", ".jpg", ".jpeg", ".webp"].includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error("Only images are allowed"));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 }, 
});
