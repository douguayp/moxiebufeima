const { createOcrError } = require("../shared");
const { prepareImageForOcr } = require("../preprocess");

const CLOUD_OCR_FUNCTION_NAME = "ocr";

function createCloudPath(filePath) {
  const extension = /\.png$/i.test(filePath) ? "png" : /\.webp$/i.test(filePath) ? "webp" : "jpg";
  return `ocr/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extension}`;
}

function mapCloudCallError(error) {
  const errMsg = error?.errMsg || error?.message || "";

  if (/FunctionName parameter could not be found/i.test(errMsg) || /找不到函数/i.test(errMsg)) {
    return createOcrError("FUNCTION_NOT_FOUND", "找不到 ocr 云函数，请先上传并部署", { cause: error });
  }

  if (/cloudbase is not initialized/i.test(errMsg) || /Cloud API isn't enabled/i.test(errMsg)) {
    return createOcrError("CLOUD_UNAVAILABLE", "当前项目还没有启用云开发", { cause: error });
  }

  return createOcrError("OCR_REQUEST_FAILED", "微信官方 OCR 调用失败", { cause: error });
}

function mapUploadError(error) {
  return createOcrError("IMAGE_UPLOAD_FAILED", "OCR 图片上传失败，请稍后重试", { cause: error });
}

async function callWechatCommocr(payload) {
  if (!wx.cloud || !wx.cloud.callFunction) {
    throw createOcrError("CLOUD_UNAVAILABLE", "当前环境未启用云开发");
  }

  const preparedImage = await prepareImageForOcr(payload.imagePath);
  let uploadResult;

  try {
    uploadResult = await wx.cloud.uploadFile({
      cloudPath: createCloudPath(preparedImage.filePath),
      filePath: preparedImage.filePath,
    });
  } catch (error) {
    throw mapUploadError(error);
  }

  let callResult;

  try {
    callResult = await wx.cloud.callFunction({
      name: CLOUD_OCR_FUNCTION_NAME,
      data: {
        provider: "wechatCommocr",
        scene: payload.scene,
        fileID: uploadResult.fileID,
        originalBytes: preparedImage.originalBytes,
        imageBytes: preparedImage.bytes,
      },
    });
  } catch (error) {
    throw mapCloudCallError(error);
  }

  const result = callResult?.result || {};

  if (!result.ok) {
    throw createOcrError(
      result.code || "OCR_REQUEST_FAILED",
      result.message || "微信官方 OCR 调用失败",
      { detail: result }
    );
  }

  return {
    provider: "wechatCommocr",
    meta: {
      preparedImage,
      fileID: uploadResult.fileID,
      requestId: result.requestId || "",
    },
    result: result.recognition || result.data || result,
  };
}

async function recognizePhotoDictation({ imagePath }) {
  return callWechatCommocr({
    scene: "photo-dictation",
    imagePath,
  });
}

async function recognizeCorrection({ imagePath, expectedItems }) {
  return callWechatCommocr({
    scene: "correction",
    imagePath,
    expectedItems,
  });
}

module.exports = {
  recognizeCorrection,
  recognizePhotoDictation,
};
