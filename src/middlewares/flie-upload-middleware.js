const multer = require("multer");
const AppError = require("../utils/errors/app-error");
const { Enums } = require("../utils/common");

const { STATUS_CODE } = Enums;

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const filetypes = /jpeg|jpg|png|gif|bmp|webp|svg|tiff|heic|avif/;
  const mimetype = filetypes.test(file.mimetype);

  if (mimetype) {
    cb(null, true);
  } else {
    cb(
      new AppError(
        "Invalid file type. Only image formats are allowed.",
        STATUS_CODES.BAD_REQUEST
      )
    );
  }
};

const fileUpload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter,
});

module.exports = { fileUpload };
