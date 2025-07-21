const cloudinary = require("../config/cloudinary");
const { ErrorResponse, Enums } = require("../utils/common");
const AppError = require("../utils/errors/app-error");
const { STATUS_CODES } = Enums;
const stream = require("stream");
const { default: PQueue } = require("p-queue");

class CloudinaryService {
  constructor() {
    this.concurrencyLimit = 5;
    this.uploadQueue = new PQueue({ concurrency: this.concurrencyLimit });
  }

  async uploadBuffer(fileBuffer, folder = "uploads", options = {}) {
    if (!fileBuffer) {
      throw new AppError("File is required", STATUS_CODES.BAD_REQUEST);
    }

    const uploadOptions = {
      folder: `Pictora/${folder}`,
      resource_type: "auto",
      chunk_size: 20 * 1024 * 1024,
      ...options,
    };

    try {
      return await this.uploadQueue.add(
        () =>
          new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
              uploadOptions,
              (error, result) => {
                if (error) return reject(error);
                resolve(result);
              }
            );

            const bufferStream = new stream.PassThrough();
            bufferStream.on("error", reject);
            bufferStream.end(fileBuffer);
            bufferStream.pipe(uploadStream);
          })
      );
    } catch (error) {
      console.error("Cloudinary upload error:", error);
      throw new AppError(
        `Upload failed: ${error.message}`,
        STATUS_CODES.INTERNAL_SERVER_ERROR
      );
    }
  }

  async deleteFile(publicId) {
    if (!publicId) {
      throw new AppError("Public ID is required", STATUS_CODES.BAD_REQUEST);
    }

    try {
      return await cloudinary.uploader.destroy(publicId, {
        invalidate: true, // CDN invalidation
      });
    } catch (error) {
      console.error("Cloudinary delete error:", error);
      throw new AppError(
        `Failed to delete file: ${error.message}`,
        STATUS_CODES.INTERNAL_SERVER_ERROR
      );
    }
  }

  async uploadMultiple(files, folder) {
    try {
      const results = {};
      const uploadPromises = [];

      for (const [key, file] of Object.entries(files)) {
        if (file?.buffer) {
          uploadPromises.push(
            this.uploadBuffer(file.buffer, folder)
              .then((uploaded) => {
                results[key] = uploaded.secure_url;
              })
              .catch((error) => {
                console.error(`Failed to upload ${key}:`, error);
                results[key] = null;
              })
          );
        }
      }

      await Promise.all(uploadPromises);
      return results;
    } catch (error) {
      console.error("Cloudinary multiple upload error:", error);
      throw error;
    }
  }

  // Batch delete for cleanup
  async deleteFiles(publicIds) {
    if (!publicIds || !publicIds.length) return;

    try {
      return await Promise.all(
        publicIds.map((id) =>
          this.deleteFile(id).catch((e) =>
            console.error(`Failed to delete ${id}:`, e)
          )
        )
      );
    } catch (error) {
      console.error("Batch delete error:", error);
      throw error;
    }
  }
}

module.exports = new CloudinaryService();
