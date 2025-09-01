const { POST_TYPE } = require("../common").Enums;

function getFileType(mimeType) {
  if (mimeType.startsWith("image/")) {
    return POST_TYPE.IMAGE;
  } else if (mimeType.startsWith("video/")) {
    return POST_TYPE.VIDEO;
  } else {
    throw new Error("Unsupported media type");
  }
}

module.exports = { getFileType };
