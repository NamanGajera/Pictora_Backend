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
  FETCHED_SUCCESS: "Data fetched successfully",

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
  MEDIA_UPLOAD_SUCCESS: "Media uploaded successfully",
  MEDIA_UPLOAD_FAILED: "Media upload failed",

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

  // User Related
  USER_NOT_FOUND: "User not found",
  INVALID_CREDENTIAL: "Invalid credentials",
  PROFILE_UPDATED: "Profile updated successfully",

  // Post Related
  POST_NOT_FOUND: "Post not found",
  POST_CREATED: "Post created successfully",
  POST_UPDATED: "Post updated successfully",
  POST_DELETED: "Post deleted successfully",
  POST_LIKED: "Post liked successfully",
  POST_UNLIKED: "Post unliked successfully",
  POST_SAVED: "Post saved successfully",
  POST_UNSAVED: "Post unsaved successfully",
  POST_ARCHIVED: "Post archived successfully",
  POST_UNARCHIVED: "Post unarchived successfully",
  REPOST_SUCCESS: "Post reposted successfully",
  REPOST_UNDO_SUCCESS: "Post unreposted successfully",
  REPOST_ALREADY_EXISTS: "You have already reposted this post",
  REPOST_NOT_FOUND: "Repost not found",
  CANNOT_REPOST_OWN_POST: "You cannot repost your own post",
  POST_FETCHED: "Post fetched successfully",
  POSTS_FETCHED: "Posts fetched successfully",
  POST_SHARED: "Post shared successfully",
  POST_VIEWED: "Post viewed successfully",
  POST_COMMENTED: "Comment added successfully",
  POST_COMMENT_DELETED: "Comment deleted successfully",
  POST_COMMENT_UPDATED: "Comment updated successfully",
  ALREADY_LIKED: "You have already liked this post",
  ALREADY_SAVED: "You have already saved this post",
  ALREADY_ARCHIVED: "You have already archived this post",
  NOT_LIKED: "You haven't liked this post yet",
  NOT_SAVED: "You haven't saved this post yet",
  NOT_ARCHIVED: "You haven't archived this post yet",
  UNAUTHORIZED_POST_ACCESS: "You are not authorized to access this post",
  UNAUTHORIZED_POST_ACTION:
    "You are not authorized to perform this action on the post",

  // Media Related
  MEDIA_ADDED: "Media added to post successfully",
  MEDIA_REMOVED: "Media removed from post successfully",
  MEDIA_NOT_FOUND: "Media not found",
  MEDIA_LIMIT_EXCEEDED: "Maximum media limit exceeded for this post",

  // Transaction Related
  TRANSACTION_FAILED: "Transaction failed",
  TRANSACTION_SUCCESS: "Transaction completed successfully",

  /// Comment Related
  COMMENT_CREATED: "Comment created successfully",
  COMMENT_DELETED: "Comment deleted successfully",
  COMMENT_NOT_FOUND: "Comment not found",
  COMMENT_LIKED: "Comment liked successfully",
  COMMENT_UNLIKED: "Comment unliked successfully",
  COMMENT_ALREADY_LIKED: "Comment already like",
  COMMENT_NOT_PINNED: "Comment not pinned",
  COMMENT_ALREADY_PINNED: "Comment already pinned",

  /// Follow/Unfollow
  ALREADY_FOLLOW: "You are already following this user",
  FOLLOW_REQUEST_PENDING: "Follow request already pending",
  FOLLOW_REQUEST_SENT: "Follow request sent successfully",
  USER_FOLLOWED: "User followed successfully",
  USER_UNFOLLOWED: "User unfollowed successfully",
  NOT_FOLLOWING_USER: "You are not following this user",
  REQUEST_ACCEPTED: "Follow request accepted",
  REQUEST_REJECTED: "Follow request rejected",
  REQUEST_NOT_FOUND: "Follow request not found",
  REQUEST_CANCELED: "Follow request canceled.",


  /// Conversation Related
  CONVERSATION_CREATED: "Conversation created successfully",
  CONVERSATION_NOT_FOUND: "Conversation not found",
  MESSAGE_SENT: "Message sent successfully",
  MESSAGE_DELETED: "Message deleted successfully",
  NO_CONVERSATIONS: "No conversations found",
  NO_MESSAGES: "No messages found",
  CONVERSATION_EXISTS: "Conversation between these users already exists",
};

module.exports = Messages;
