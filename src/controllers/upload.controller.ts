import { Response } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { AuthRequest } from "../types/AuthRequest";
import { uploadImage, deleteImage, UploadFolder } from "../services/cloudinary.service";

const UPLOAD_DIR = path.join(__dirname, "..", "..", "uploads");
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`);
  },
});

const fileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowed = ["image/jpeg", "image/png", "image/webp", "image/svg+xml"];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Solo se permiten imágenes (JPEG, PNG, WebP, SVG)"));
  }
};

export const uploadMiddleware = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
}).single("file");

export async function uploadFile(req: AuthRequest, res: Response) {
  if (!req.file) {
    res.status(400).json({ message: "No se envió ningún archivo" });
    return;
  }

  const folder = (req.body.folder as UploadFolder) || "general";

  try {
    const result = await uploadImage(req.file.path, folder);

    // Clean up local temp file
    fs.unlink(req.file.path, () => {});

    res.json({
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format,
    });
  } catch (err: any) {
    // Clean up on failure too
    fs.unlink(req.file.path, () => {});
    res.status(500).json({ message: "Error al subir imagen", error: err.message });
  }
}

export async function deleteFile(req: AuthRequest, res: Response) {
  const { publicId } = req.body;
  if (!publicId) {
    res.status(400).json({ message: "publicId es requerido" });
    return;
  }

  try {
    await deleteImage(publicId);
    res.json({ message: "Imagen eliminada correctamente" });
  } catch (err: any) {
    res.status(500).json({ message: "Error al eliminar imagen", error: err.message });
  }
}
