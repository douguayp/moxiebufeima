const mockProvider = require("./providers/mock");
const wechatCommocrProvider = require("./providers/wechat-commocr");
const { createOcrError, normalizeRecognizedItems } = require("./shared");

const OCR_RUNTIME_PROVIDER_STORAGE_KEYS = {
  correction: "ocr_correction_runtime_provider",
  photoDictation: "ocr_photo_runtime_provider",
};
const OCR_RUNTIME_PROVIDER_DEFAULTS = {
  correction: "mock",
  photoDictation: "wechatCommocr",
};
const PROVIDERS = {
  mock: mockProvider,
  wechatCommocr: wechatCommocrProvider,
  cloud: wechatCommocrProvider,
};

function getStorageValue(key) {
  try {
    return wx.getStorageSync(key) || "";
  } catch (error) {
    console.warn(`read ${key} failed`, error);
    return "";
  }
}

function resolveRuntimeProvider(scene, overrideProvider) {
  if (overrideProvider && PROVIDERS[overrideProvider]) {
    return overrideProvider;
  }

  const storageKey = OCR_RUNTIME_PROVIDER_STORAGE_KEYS[scene];
  const storedProvider = storageKey ? getStorageValue(storageKey) : "";

  if (storedProvider && PROVIDERS[storedProvider]) {
    return storedProvider;
  }

  return OCR_RUNTIME_PROVIDER_DEFAULTS[scene] || "mock";
}

function getProviderLabel(provider) {
  if (provider === "wechatCommocr" || provider === "cloud") {
    return "微信官方 OCR";
  }

  return "OCR";
}

function buildFallbackWarning(provider) {
  return `${getProviderLabel(provider)} 当前不可用，已自动切换为 mock 识别`;
}

async function callProvider(scene, providerName, payload) {
  const provider = PROVIDERS[providerName];

  if (!provider) {
    throw createOcrError("OCR_PROVIDER_NOT_FOUND", `未找到 OCR provider: ${providerName}`);
  }

  if (scene === "photoDictation") {
    return provider.recognizePhotoDictation(payload);
  }

  if (scene === "correction") {
    return provider.recognizeCorrection(payload);
  }

  throw createOcrError("OCR_SCENE_INVALID", `未知 OCR 场景: ${scene}`);
}

async function buildRecognitionResponse(scene, providerName, payload) {
  const providerResponse = await callProvider(scene, providerName, payload);
  const items = normalizeRecognizedItems(providerResponse?.result);

  return {
    items,
    meta: providerResponse?.meta || {},
    provider: providerName,
    rawResult: providerResponse?.result || null,
    warningMessage: providerResponse?.warningMessage || "",
  };
}

async function recognize(scene, payload = {}) {
  const runtimeProvider = resolveRuntimeProvider(scene, payload.provider);

  try {
    return await buildRecognitionResponse(scene, runtimeProvider, payload);
  } catch (error) {
    if (runtimeProvider === "mock") {
      throw error;
    }

    const fallbackResponse = await buildRecognitionResponse(scene, "mock", payload);

    return {
      ...fallbackResponse,
      requestedProvider: runtimeProvider,
      warningMessage: buildFallbackWarning(runtimeProvider),
      fallbackReasonCode: error?.code || "",
      fallbackReasonMessage: error?.message || "",
    };
  }
}

async function recognizePhotoDictation(payload) {
  return recognize("photoDictation", payload);
}

async function recognizeCorrection(payload) {
  return recognize("correction", payload);
}

module.exports = {
  OCR_RUNTIME_PROVIDER_DEFAULTS,
  OCR_RUNTIME_PROVIDER_STORAGE_KEYS,
  recognizeCorrection,
  recognizePhotoDictation,
};
