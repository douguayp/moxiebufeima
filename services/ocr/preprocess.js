const { createOcrError } = require("./shared");

const OCR_MAX_IMAGE_BYTES = 2 * 1024 * 1024;
const OCR_TARGET_IMAGE_BYTES = Math.floor(1.8 * 1024 * 1024);
const OCR_COMPRESS_QUALITIES = [80, 68, 56, 44, 32];

function getFileInfo(filePath) {
  return new Promise((resolve, reject) => {
    wx.getFileInfo({
      filePath,
      success: resolve,
      fail: reject,
    });
  });
}

function compressImage(src, quality) {
  return new Promise((resolve, reject) => {
    if (!wx.compressImage) {
      reject(createOcrError("COMPRESS_UNSUPPORTED", "当前环境不支持图片压缩"));
      return;
    }

    wx.compressImage({
      src,
      quality,
      success: resolve,
      fail: reject,
    });
  });
}

function inferContentType(filePath = "") {
  const normalizedPath = filePath.toLowerCase();

  if (normalizedPath.endsWith(".png")) {
    return "image/png";
  }

  if (normalizedPath.endsWith(".webp")) {
    return "image/webp";
  }

  return "image/jpeg";
}

async function compressToLimit(imagePath) {
  const originalInfo = await getFileInfo(imagePath);
  let workingPath = imagePath;
  let workingInfo = originalInfo;
  let compressed = false;

  if (workingInfo.size <= OCR_TARGET_IMAGE_BYTES) {
    return {
      originalBytes: originalInfo.size,
      bytes: workingInfo.size,
      compressed,
      filePath: workingPath,
    };
  }

  for (let index = 0; index < OCR_COMPRESS_QUALITIES.length; index += 1) {
    const quality = OCR_COMPRESS_QUALITIES[index];

    try {
      const compressResult = await compressImage(workingPath, quality);
      const nextPath = compressResult?.tempFilePath;

      if (!nextPath) {
        continue;
      }

      const nextInfo = await getFileInfo(nextPath);

      if (nextInfo.size < workingInfo.size) {
        workingPath = nextPath;
        workingInfo = nextInfo;
        compressed = true;
      }

      if (workingInfo.size <= OCR_TARGET_IMAGE_BYTES) {
        break;
      }
    } catch (error) {
      console.warn("compress image failed", error);
    }
  }

  if (workingInfo.size > OCR_MAX_IMAGE_BYTES) {
    throw createOcrError("OCR_IMAGE_TOO_LARGE", "图片压缩后仍超过 2MB，请重新裁剪后再试", {
      detail: {
        originalBytes: originalInfo.size,
        finalBytes: workingInfo.size,
      },
    });
  }

  return {
    originalBytes: originalInfo.size,
    bytes: workingInfo.size,
    compressed,
    filePath: workingPath,
  };
}

async function prepareImageForOcr(imagePath) {
  if (!imagePath) {
    throw createOcrError("IMAGE_REQUIRED", "当前没有可识别的图片");
  }

  const compressedResult = await compressToLimit(imagePath);
  return {
    ...compressedResult,
    contentType: inferContentType(compressedResult.filePath),
    originalPath: imagePath,
  };
}

module.exports = {
  OCR_MAX_IMAGE_BYTES,
  OCR_TARGET_IMAGE_BYTES,
  prepareImageForOcr,
};
