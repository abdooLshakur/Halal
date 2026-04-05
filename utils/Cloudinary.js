const cloudinary = require("cloudinary").v2;
const { Readable } = require("stream");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadBuffer = (file, options = {}) =>
  new Promise((resolve, reject) => {
    if (!file?.buffer) {
      reject(new Error("No file buffer provided"));
      return;
    }

    const uploadStream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(result);
    });

    Readable.from(file.buffer).pipe(uploadStream);
  });

module.exports = {
  cloudinary,
  uploadBuffer,
};
