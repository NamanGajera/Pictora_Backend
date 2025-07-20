const cloudinary = require("../config/cloudinary");
const { ErrorResponse, Enums } = require("../utils/common");
const AppError = require("../utils/errors/app-error");
const { STATUS_CODES } = Enums;
const stream = require("stream");

class CloudinaryService {
  async uploadBuffer(fileBuffer, folder = "uploads", options = {}) {
    try {
      if (!fileBuffer) {
        throw new AppError("File is required", STATUS_CODES.BAD_REQUEST);
      }

      const uploadOptions = {
        folder: `Pictora/${folder}`,
        ...options,
      };

      return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          uploadOptions,
          (error, result) => {
            if (error) return reject(error);
            resolve(result);
          }
        );
        stream.Readable.from(fileBuffer).pipe(uploadStream);
      });
    } catch (error) {
      console.error("Cloudinary upload error:", error);
      throw error;
    }
  }

  async deleteFile(publicId) {
    try {
      if (!publicId) {
        throw new ErrorResponse(
          "Public ID is required",
          STATUS_CODES.BAD_REQUEST
        );
      }
      return await cloudinary.uploader.destroy(publicId);
    } catch (error) {
      console.error("Cloudinary delete error:", error);
      throw error;
    }
  }

  async uploadMultiple(files, folder) {
    try {
      const results = {};
      for (const [key, file] of Object.entries(files)) {
        if (file?.buffer) {
          const uploaded = await this.uploadBuffer(file.buffer, folder);
          results[key] = uploaded.secure_url;
        }
      }
      return results;
    } catch (error) {
      console.error("Cloudinary multiple upload error:", error);
      throw error;
    }
  }
}

module.exports = new CloudinaryService();
