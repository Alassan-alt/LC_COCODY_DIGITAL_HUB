import multer from "multer";
import { AppError } from "../utils/AppError";

const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024; // 20 Mo — limite raisonnable par défaut, TO_CONFIRM

const BLOCKED_EXTENSIONS = [".exe", ".bat", ".cmd", ".sh", ".msi", ".com", ".scr"];

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
  fileFilter: (_req, file, callback) => {
    const lower = file.originalname.toLowerCase();
    if (BLOCKED_EXTENSIONS.some((ext) => lower.endsWith(ext))) {
      callback(new AppError("Type de fichier non autorisé", 400));
      return;
    }
    callback(null, true);
  },
});
