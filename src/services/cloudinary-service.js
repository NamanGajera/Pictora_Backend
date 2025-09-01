const cloudinary = require("../config/cloudinary");
const { ErrorResponse, Enums } = require("../utils/common");
const AppError = require("../utils/errors/app-error");
const { STATUS_CODE } = Enums;
const stream = require("stream");
const { default: PQueue } = require("p-queue");
const path = require("path");

class CloudinaryService {
  constructor() {
    this.concurrencyLimit = 10;
    this.uploadQueue = new PQueue({
      concurrency: this.concurrencyLimit,
      timeout: 300000, // 5 minute timeout for large uploads
    });
    this.uploadHistory = new Map();
  }

  // Determine resource type based on file extension or MIME type
  getResourceType(filename, mimeType) {
    if (!filename && !mimeType) return "auto";

    const extension = filename ? path.extname(filename).toLowerCase() : "";
    const mime = mimeType ? mimeType.toLowerCase() : "";

    // Video formats
    const videoExtensions = [
      ".mp4",
      ".mov",
      ".avi",
      ".wmv",
      ".flv",
      ".webm",
      ".mkv",
      ".m4v",
      ".3gp",
    ];
    const videoMimes = [
      "video/mp4",
      "video/quicktime",
      "video/x-msvideo",
      "video/x-ms-wmv",
      "video/x-flv",
      "video/webm",
      "video/x-matroska",
    ];

    // Image formats
    const imageExtensions = [
      ".jpg",
      ".jpeg",
      ".png",
      ".gif",
      ".bmp",
      ".webp",
      ".svg",
      ".tiff",
      ".ico",
    ];
    const imageMimes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/bmp",
      "image/webp",
      "image/svg+xml",
      "image/tiff",
      "image/x-icon",
    ];

    // Audio formats
    const audioExtensions = [".mp3", ".wav", ".ogg", ".m4a", ".flac", ".aac"];
    const audioMimes = [
      "audio/mpeg",
      "audio/wav",
      "audio/ogg",
      "audio/mp4",
      "audio/flac",
      "audio/aac",
    ];

    // Raw files
    const rawExtensions = [".pdf", ".doc", ".docx", ".txt", ".zip", ".rar"];
    const rawMimes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
      "application/zip",
      "application/x-rar-compressed",
    ];

    if (videoExtensions.includes(extension) || videoMimes.includes(mime)) {
      return "video";
    } else if (
      imageExtensions.includes(extension) ||
      imageMimes.includes(mime)
    ) {
      return "image";
    } else if (
      audioExtensions.includes(extension) ||
      audioMimes.includes(mime)
    ) {
      return "video"; // Cloudinary treats audio as video resource type
    } else if (rawExtensions.includes(extension) || rawMimes.includes(mime)) {
      return "raw";
    }

    return "auto"; // Let Cloudinary auto-detect
  }

  // Get appropriate transformation settings based on resource type
  getTransformations(resourceType, options = {}) {
    const baseOptions = {
      quality: "auto",
      fetch_format: "auto",
    };

    switch (resourceType) {
      case "video":
        return {
          ...baseOptions,
          video_codec: "auto",
          audio_codec: "aac",
          ...options.videoOptions,
        };
      case "image":
        return {
          ...baseOptions,
          ...options.imageOptions,
        };
      case "raw":
        return {}; // No transformations for raw files
      default:
        return baseOptions;
    }
  }

  // Get eager transformations based on resource type
  getEagerTransformations(resourceType, options = {}) {
    switch (resourceType) {
      case "video":
        return [
          {
            format: "mp4",
            transformation: [{ quality: "auto" }, { fetch_format: "mp4" }],
            ...options.videoEagerOptions,
          },
        ];
      case "image":
        return [
          {
            format: "webp",
            transformation: [{ quality: "auto" }, { fetch_format: "webp" }],
            ...options.imageEagerOptions,
          },
          {
            format: "jpg",
            transformation: [{ quality: "auto" }, { fetch_format: "jpg" }],
            ...options.imageEagerOptions,
          },
        ];
      default:
        return [];
    }
  }

  async uploadBuffer(fileBuffer, folder = "uploads", options = {}) {
    if (!fileBuffer) {
      throw new AppError("File is required", STATUS_CODE.BAD_REQUEST);
    }

    const {
      filename,
      mimeType,
      resourceType: customResourceType,
      ...uploadOptions
    } = options;

    // Determine resource type
    const resourceType =
      customResourceType || this.getResourceType(filename, mimeType);

    // Base upload options
    const baseUploadOptions = {
      folder: `Pictora/${folder}`,
      resource_type: resourceType,
      use_filename: true,
      unique_filename: true,
      overwrite: false,
      context: {
        metadata: "preserved",
      },
      ...uploadOptions,
    };

    // Add transformations based on resource type
    if (resourceType !== "raw") {
      baseUploadOptions.transformation = [
        this.getTransformations(resourceType, options),
      ];

      // Add eager transformations for images and videos
      if (resourceType === "image" || resourceType === "video") {
        baseUploadOptions.eager = this.getEagerTransformations(
          resourceType,
          options
        );
        baseUploadOptions.eager_async = true;
      }
    }

    // Add chunk size for large files (videos and raw files)
    if (resourceType === "video" || resourceType === "raw") {
      baseUploadOptions.chunk_size = 20 * 1024 * 1024;
    }

    const uploadId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    try {
      const result = await this.uploadQueue.add(
        () =>
          new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
              baseUploadOptions,
              (error, result) => {
                if (error) {
                  this.uploadHistory.set(uploadId, { status: "failed", error });
                  return reject(error);
                }

                this.uploadHistory.set(uploadId, {
                  status: "completed",
                  result,
                  timestamp: new Date(),
                });

                this.cleanUploadHistory();
                resolve(result);
              }
            );

            uploadStream.on("error", (error) => {
              this.uploadHistory.set(uploadId, { status: "failed", error });
              reject(error);
            });

            const bufferStream = new stream.PassThrough();
            bufferStream.on("error", (error) => {
              this.uploadHistory.set(uploadId, { status: "failed", error });
              reject(error);
            });

            bufferStream.end(fileBuffer);
            bufferStream.pipe(uploadStream);
          })
      );

      return result;
    } catch (error) {
      console.error("Cloudinary upload error:", error);

      // Retry logic for specific errors
      if (
        error.http_code === 500 ||
        error.http_code === 502 ||
        error.http_code === 503
      ) {
        console.log(`Retrying upload ${uploadId} due to server error`);
        return this.retryUpload(fileBuffer, folder, options, uploadId);
      }

      throw new AppError(
        `Upload failed: ${error.message}`,
        STATUS_CODE.INTERNAL_SERVER_ERROR
      );
    }
  }

  async retryUpload(fileBuffer, folder, options, uploadId, retryCount = 0) {
    const maxRetries = 3;

    if (retryCount >= maxRetries) {
      throw new AppError(
        "Upload failed after multiple retries",
        STATUS_CODE.INTERNAL_SERVER_ERROR
      );
    }

    const delay = Math.pow(2, retryCount) * 1000;
    await new Promise((resolve) => setTimeout(resolve, delay));

    try {
      console.log(`Retry attempt ${retryCount + 1} for upload ${uploadId}`);
      return await this.uploadBuffer(fileBuffer, folder, options);
    } catch (error) {
      return this.retryUpload(
        fileBuffer,
        folder,
        options,
        uploadId,
        retryCount + 1
      );
    }
  }

  cleanUploadHistory() {
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    for (const [id, data] of this.uploadHistory.entries()) {
      if (data.timestamp && data.timestamp < twentyFourHoursAgo) {
        this.uploadHistory.delete(id);
      }
    }
  }

  async deleteFile(publicId, resourceType = "auto") {
    if (!publicId) {
      throw new AppError("Public ID is required", STATUS_CODE.BAD_REQUEST);
    }

    try {
      return await cloudinary.uploader.destroy(publicId, {
        resource_type: resourceType,
        invalidate: true,
      });
    } catch (error) {
      console.error("Cloudinary delete error:", error);

      if (process.env.NODE_ENV === "production") {
        console.warn(`Failed to delete file ${publicId}: ${error.message}`);
        return { result: "error", message: error.message };
      } else {
        throw new AppError(
          `Failed to delete file: ${error.message}`,
          STATUS_CODE.INTERNAL_SERVER_ERROR
        );
      }
    }
  }

  async uploadMultiple(files, folder, options = {}) {
    if (!files || Object.keys(files).length === 0) {
      return {};
    }

    try {
      const results = {};
      const uploadPromises = [];

      for (const [key, file] of Object.entries(files)) {
        if (file?.buffer) {
          const fileOptions = {
            filename: file.originalname,
            mimeType: file.mimetype,
            ...options,
          };

          uploadPromises.push(
            this.uploadBuffer(file.buffer, folder, fileOptions)
              .then((uploaded) => {
                results[key] = {
                  url: uploaded.secure_url,
                  public_id: uploaded.public_id,
                  resource_type: uploaded.resource_type,
                  format: uploaded.format,
                  duration: uploaded.duration,
                  width: uploaded.width,
                  height: uploaded.height,
                };
              })
              .catch((error) => {
                console.error(`Failed to upload ${key}:`, error);
                results[key] = {
                  error: error.message,
                  url: null,
                  public_id: null,
                };
              })
          );
        }
      }

      await Promise.allSettled(uploadPromises);
      return results;
    } catch (error) {
      console.error("Cloudinary multiple upload error:", error);

      const results = {};
      for (const key of Object.keys(files)) {
        results[key] = {
          error: "Upload failed",
          url: null,
          public_id: null,
        };
      }

      return results;
    }
  }

  async deleteFiles(publicIdsWithTypes = []) {
    if (!publicIdsWithTypes || !publicIdsWithTypes.length) return {};

    const results = {};
    const deletePromises = [];

    for (const { publicId, resourceType = "auto" } of publicIdsWithTypes) {
      deletePromises.push(
        this.deleteFile(publicId, resourceType)
          .then((result) => {
            results[publicId] = { success: true, result };
          })
          .catch((error) => {
            console.error(`Failed to delete ${publicId}:`, error);
            results[publicId] = { success: false, error: error.message };
          })
      );
    }

    await Promise.allSettled(deletePromises);
    return results;
  }

  async getResourceInfo(publicId, resourceType = "auto") {
    try {
      const result = await cloudinary.api.resource(publicId, {
        resource_type: resourceType,
        image_metadata: resourceType === "image",
        exif: resourceType === "image",
      });

      return {
        public_id: result.public_id,
        resource_type: result.resource_type,
        format: result.format,
        url: result.secure_url,
        duration: result.duration,
        width: result.width,
        height: result.height,
        bytes: result.bytes,
        created_at: result.created_at,
        metadata: result.metadata || {},
      };
    } catch (error) {
      console.error("Error fetching resource info:", error);
      throw new AppError(
        `Failed to get resource info: ${error.message}`,
        STATUS_CODE.INTERNAL_SERVER_ERROR
      );
    }
  }

  // Generate optimized URL for different use cases
  generateOptimizedUrl(publicId, resourceType = "image", options = {}) {
    const transformation = [];

    if (resourceType === "image") {
      transformation.push({ quality: "auto", fetch_format: "auto" });

      if (options.width || options.height) {
        transformation.push({
          width: options.width,
          height: options.height,
          crop: options.crop || "fill",
        });
      }
    }

    return cloudinary.url(publicId, {
      resource_type: resourceType,
      transformation,
      secure: true,
      ...options,
    });
  }
}

module.exports = new CloudinaryService();
