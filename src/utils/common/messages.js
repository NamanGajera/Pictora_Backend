const Messages = {
  // Authentication & Authorization
  NOT_AUTHORIZED: "You are not authorized",
  ACCESS_DENIED: "Access denied",
  INVALID_TOKEN: "Invalid or expired token",
  LOGIN_REQUIRED: "Login required to access this resource",
  INSUFFICIENT_PERMISSIONS: "Insufficient permissions to perform this action",
  LOGIN_SUCCESS: "Login Successful",
  USER_REGISTERED: "User registered successful",

  // Common Data Messages
  DATA_NOT_FOUND: "Data not found",
  NO_DATA_FOUND: "No data found",
  RECORD_NOT_FOUND: "Record not found",
  INVALID_ID: "Invalid ID provided",

  // Validation Messages
  REQUIRED_FIELD: (field) => `${field} is required`,
  REQUIRED_BODY: "Request body is required",
  INVALID_FORMAT: (field) => `${field} format is invalid`,
  INVALID_EMAIL: "Invalid email format",
  INVALID_PHONE: "Invalid phone number",
  INVALID_DATE: "Invalid date format",

  // Server & Database
  SOMETHING_WRONG: "Something went wrong, please try again later",
  SERVER_ERROR: "Internal server error",
  DATABASE_ERROR: "Database connection error",
  SERVICE_UNAVAILABLE: "Service temporarily unavailable",

  // CRUD Operations
  CREATED_SUCCESS: "Record created successfully",
  UPDATED_SUCCESS: "Record updated successfully",
  DELETED_SUCCESS: "Record deleted successfully",
  OPERATION_SUCCESS: "Operation completed successfully",
  OPERATION_FAILED: "Operation failed",

  // Duplicate & Conflict
  ALREADY_EXISTS: (entity) => `${entity} already exists`,
  DUPLICATE_ENTRY: "Duplicate entry found",
  CONFLICT_ERROR: "Conflict with existing data",

  // Pagination & Limits
  INVALID_PAGE: "Invalid page number",
  INVALID_LIMIT: "Invalid limit value",
  LIMIT_EXCEEDED: "Request limit exceeded",

  // File Operations
  FILE_NOT_FOUND: "File not found",
  FILE_UPLOAD_ERROR: "File upload failed",
  INVALID_FILE_TYPE: "Invalid file type",
  FILE_TOO_LARGE: "File size exceeds limit",

  // Status Messages
  ACTIVE: "Active",
  INACTIVE: "Inactive",
  PENDING: "Pending",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  CANCELLED: "Cancelled",

  // Common API Messages
  INVALID_REQUEST: "Invalid request",
  MISSING_PARAMETERS: "Missing required parameters",
  INVALID_PARAMETERS: "Invalid parameters provided",
  REQUEST_TIMEOUT: "Request timeout",
  TOO_MANY_REQUESTS: "Too many requests, please try again later",

  USER_NOT_FOUND: "User not found",
  INVALID_CREDENTIAL: "Invalid credentials",

  POST_NOT_FOUND: "Post not found",
  ALREADY_LIKED: "You have already liked this post",
  ALREADY_SAVED: "You have already saved this post",
  ALREADY_ARCHIVED: "You have already archived this post",
  UNAUTHORIZED: "You are not authorized to perform this action",
};

module.exports = Messages;
