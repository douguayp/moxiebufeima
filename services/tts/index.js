const CLOUD_TTS_FUNCTION_NAME = "tts";
const TTS_RUNTIME_MODE_STORAGE_KEY = "tts_runtime_mode";
const TTS_RUNTIME_MODE = "cloud";

function hashString(input) {
  let hash = 0;

  for (let index = 0; index < input.length; index += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(index);
    hash |= 0;
  }

  return Math.abs(hash).toString(36);
}

function createTtsError(code, message, extra = {}) {
  const error = new Error(message);
  error.code = code;
  return Object.assign(error, extra);
}

function getRuntimeMode() {
  try {
    const overrideMode = wx.getStorageSync(TTS_RUNTIME_MODE_STORAGE_KEY);

    if (overrideMode === "mock" || overrideMode === "cloud") {
      return overrideMode;
    }
  } catch (error) {
    console.warn("read tts runtime mode failed", error);
  }

  return TTS_RUNTIME_MODE;
}

function mapCloudCallError(error) {
  const errMsg = error?.errMsg || error?.message || "";

  if (/FunctionName parameter could not be found/i.test(errMsg) || /找不到函数/i.test(errMsg)) {
    return createTtsError("FUNCTION_NOT_FOUND", "找不到 tts 云函数，请先上传并部署", { cause: error });
  }

  if (/cloudbase is not initialized/i.test(errMsg) || /Cloud API isn't enabled/i.test(errMsg)) {
    return createTtsError("CLOUD_UNAVAILABLE", "当前项目还没有启用云开发", { cause: error });
  }

  return createTtsError("TTS_REQUEST_FAILED", "云函数 TTS 调用失败", { cause: error });
}

function writeBase64AudioFile(audioBase64, cacheKey) {
  return new Promise((resolve, reject) => {
    const fileSystemManager = wx.getFileSystemManager();
    const filePath = `${wx.env.USER_DATA_PATH}/tts-${cacheKey}.mp3`;

    fileSystemManager.writeFile({
      filePath,
      data: audioBase64,
      encoding: "base64",
      success: () => resolve(filePath),
      fail: (error) => reject(createTtsError("FILE_WRITE_FAILED", "音频文件写入失败", { cause: error })),
    });
  });
}

function writeArrayBufferAudioFile(arrayBuffer, cacheKey) {
  return new Promise((resolve, reject) => {
    const fileSystemManager = wx.getFileSystemManager();
    const filePath = `${wx.env.USER_DATA_PATH}/tts-mock-${cacheKey}.wav`;

    fileSystemManager.writeFile({
      filePath,
      data: arrayBuffer,
      success: () => resolve(filePath),
      fail: (error) => reject(createTtsError("FILE_WRITE_FAILED", "Mock 音频文件写入失败", { cause: error })),
    });
  });
}

function createMockWavBuffer(text, language) {
  const sampleRate = 16000;
  const normalizedText = (text || "").replace(/\s+/g, "");
  const segmentCount = Math.min(Math.max(normalizedText.length, 1), 8);
  const toneDuration = 0.11;
  const gapDuration = 0.03;
  const totalDuration = segmentCount * (toneDuration + gapDuration);
  const totalSamples = Math.max(Math.floor(totalDuration * sampleRate), sampleRate / 2);
  const pcmBuffer = new Int16Array(totalSamples);
  const baseFrequency = language === "en" ? 740 : 560;
  const hashSeed = Number.parseInt(hashString(`${language}:${text}`).slice(0, 4), 36) || 0;
  const amplitude = 0.18 * 32767;

  for (let segmentIndex = 0; segmentIndex < segmentCount; segmentIndex += 1) {
    const startSample = Math.floor(segmentIndex * (toneDuration + gapDuration) * sampleRate);
    const endSample = Math.min(startSample + Math.floor(toneDuration * sampleRate), totalSamples);
    const frequency = baseFrequency + ((hashSeed + segmentIndex * 37) % 5) * 55;

    for (let sampleIndex = startSample; sampleIndex < endSample; sampleIndex += 1) {
      const t = (sampleIndex - startSample) / sampleRate;
      const fade = Math.sin((Math.PI * (sampleIndex - startSample)) / Math.max(endSample - startSample, 1));
      pcmBuffer[sampleIndex] = Math.round(amplitude * fade * Math.sin(2 * Math.PI * frequency * t));
    }
  }

  const dataSize = pcmBuffer.length * 2;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  function writeString(offset, value) {
    for (let index = 0; index < value.length; index += 1) {
      view.setUint8(offset + index, value.charCodeAt(index));
    }
  }

  writeString(0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, "data");
  view.setUint32(40, dataSize, true);

  pcmBuffer.forEach((sample, index) => {
    view.setInt16(44 + index * 2, sample, true);
  });

  return buffer;
}

async function synthesizeMockSpeechToFile({ text, language, reason }) {
  const normalizedText = (text || "").trim();

  if (!normalizedText) {
    throw createTtsError("EMPTY_TEXT", "当前内容为空，无法朗读");
  }

  const cacheKey = hashString(`mock:${language}:${normalizedText}`);
  const arrayBuffer = createMockWavBuffer(normalizedText, language);
  const filePath = await writeArrayBufferAudioFile(arrayBuffer, cacheKey);
  const warningMessage = reason
    ? `云端朗读暂不可用，已自动切换为 mock 朗读`
    : "当前使用 mock 朗读";

  return {
    cacheKey,
    expiresAt: Date.now() + 24 * 60 * 60 * 1000,
    filePath,
    source: "mock",
    warningMessage,
    fallbackReason: reason?.code || "",
  };
}

async function synthesizeSpeechToFile({ text, language }) {
  const runtimeMode = getRuntimeMode();

  if (runtimeMode === "mock") {
    return synthesizeMockSpeechToFile({ text, language });
  }

  if (!wx.cloud || !wx.cloud.callFunction) {
    return synthesizeMockSpeechToFile({
      text,
      language,
      reason: createTtsError("CLOUD_UNAVAILABLE", "当前环境未启用云开发"),
    });
  }

  const normalizedText = (text || "").trim();

  if (!normalizedText) {
    throw createTtsError("EMPTY_TEXT", "当前内容为空，无法朗读");
  }

  let callResult;

  try {
    callResult = await wx.cloud.callFunction({
      name: CLOUD_TTS_FUNCTION_NAME,
      data: {
        text: normalizedText,
        language,
      },
    });
  } catch (error) {
    return synthesizeMockSpeechToFile({
      text: normalizedText,
      language,
      reason: mapCloudCallError(error),
    });
  }

  const result = callResult?.result || {};

  if (!result.ok) {
    return synthesizeMockSpeechToFile({
      text: normalizedText,
      language,
      reason: createTtsError(
        result.code || "TTS_REQUEST_FAILED",
        result.message || "云函数 TTS 调用失败",
        { detail: result }
      ),
    });
  }

  if (!result.audioBase64) {
    return synthesizeMockSpeechToFile({
      text: normalizedText,
      language,
      reason: createTtsError("AUDIO_EMPTY", "云函数没有返回音频数据", { detail: result }),
    });
  }

  const cacheKey = result.cacheKey || hashString(`${language}-${normalizedText}`);
  const filePath = await writeBase64AudioFile(result.audioBase64, cacheKey);

  return {
    cacheKey,
    expiresAt: result.expiresAt || Date.now() + 2 * 60 * 60 * 1000,
    filePath,
    source: "cloud",
    warningMessage: "",
  };
}

module.exports = {
  TTS_RUNTIME_MODE,
  TTS_RUNTIME_MODE_STORAGE_KEY,
  synthesizeSpeechToFile,
};
