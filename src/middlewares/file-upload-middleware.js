const multer = require("multer");
const AppError = require("../utils/errors/app-error");
const { Enums } = require("../utils/common");
const { STATUS_CODE } = Enums;

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  // Supported image formats
  const imageTypes = /jpeg|jpg|png|gif|bmp|webp|svg|tiff|heic|avif/;
  // Supported video formats
  const videoTypes = /mp4|mov|avi|wmv|flv|mkv|webm|3gp|mpeg|mpg/;

  const isImage = imageTypes.test(file.mimetype);
  const isVideo = videoTypes.test(file.mimetype);

  if (isImage || isVideo) {
    cb(null, true);
  } else {
    cb(
      new AppError(
        "Invalid file type. Only image and video formats are allowed.",
        STATUS_CODE.BAD_REQUEST
      )
    );
  }
};

const fileUpload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // Increased to 50MB to accommodate videos
    files: 10, // Maximum number of files
  },
  fileFilter,
});

module.exports = { fileUpload };
