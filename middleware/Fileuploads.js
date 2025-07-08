const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../utils/Cloudinary");
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "halal_uploads", // Optional folder in Cloudinary
    allowed_formats: ["jpg", "jpeg", "png", "webp", "avif"],
    transformation: [{ width: 500, height: 500, crop: "limit" }],
  },
});

const uploads = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "image/png",
      "image/jpg",
      "image/jpeg",
      "image/webp",
      "image/avif",
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("File type not supported"), false);
    }
  },
});

module.exports = uploads;
