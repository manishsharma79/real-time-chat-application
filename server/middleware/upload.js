const multer = require("multer");
const path = require("path");
const fs = require("fs");

const uploadDir = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const ALLOWED_EXT = [
  ".jpg", ".jpeg", ".png", ".webp", ".gif",
  ".pdf", ".doc", ".docx", ".txt", ".xls", ".xlsx", ".ppt", ".pptx",
];

const DANGEROUS_EXT = [
  ".exe", ".bat", ".cmd", ".sh", ".msi", ".js", ".jar", ".com", ".scr", ".vbs", ".ps1",
];

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${unique}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();

  if (DANGEROUS_EXT.includes(ext)) {
    return cb(new Error("Executable file types are not allowed"), false);
  }

  if (!ALLOWED_EXT.includes(ext)) {
    return cb(new Error("Unsupported file type"), false);
  }

  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB max
});

module.exports = upload;
