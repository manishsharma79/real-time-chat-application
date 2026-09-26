// POST /api/upload  (field name: "file")
const uploadFile = (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }

  const isImage = req.file.mimetype.startsWith("image/");

  res.status(201).json({
    fileUrl: `/uploads/${req.file.filename}`,
    fileName: req.file.originalname,
    fileSize: req.file.size,
    fileType: req.file.mimetype,
    messageType: isImage ? "image" : "file",
  });
};

module.exports = { uploadFile };
