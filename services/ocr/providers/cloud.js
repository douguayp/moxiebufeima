const { createOcrError } = require("../shared");

const CLOUD_OCR_FUNCTION_NAME = "ocr";

function mapCloudCallError(error) {
  const errMsg = error?.errMsg || error?.message || "";

  if (/FunctionName parameter could not be found/i.test(errMsg) || /找不到函数/i.test(errMsg)) {
    return createOcrError("FUNCTION_NOT_FOUND", "找不到 ocr 云函数，请先上传并部署", { cause: error });
  }

  if (/cloudbase is not initialized/i.test(errMsg) || /Cloud API isn't enabled/i.test(errMsg)) {
    return createOcrError("CLOUD_UNAVAILABLE", "当前项目还没有启用云开发", { cause: error });
  }

  return createOcrError("OCR_REQUEST_FAILED", "云函数 OCR 调用失败", { cause: error });
}

async function callCloudOcr(payload) {
  if (!wx.cloud || !wx.cloud.callFunction) {
    throw createOcrError("CLOUD_UNAVAILABLE", "当前环境未启用云开发");
  }

  let callResult;

  try {
    callResult = await wx.cloud.callFunction({
      name: CLOUD_OCR_FUNCTION_NAME,
      data: payload,
    });
  } catch (error) {
    throw mapCloudCallError(error);
  }

  const result = callResult?.result || {};

  if (!result.ok) {
    throw createOcrError(
      result.code || "OCR_REQUEST_FAILED",
      result.message || "云函数 OCR 调用失败",
      { detail: result }
    );
  }

  return {
    provider: "cloud",
    result: result.recognition || result.data || result,
  };
}

async function recognizePhotoDictation({ imagePath }) {
  return callCloudOcr({
    scene: "photo-dictation",
    imagePath,
  });
}

async function recognizeCorrection({ imagePath, expectedItems }) {
  return callCloudOcr({
    scene: "correction",
    imagePath,
    expectedItems,
  });
}

module.exports = {
  recognizeCorrection,
  recognizePhotoDictation,
};
