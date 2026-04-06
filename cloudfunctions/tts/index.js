const crypto = require("crypto");
const cloud = require("wx-server-sdk");
const tencentCloud = require("tencentcloud-sdk-nodejs-tts");

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
});

const TtsClient = tencentCloud.tts.v20190823.Client;

function loadLocalConfig() {
  try {
    return require("./config.json");
  } catch (error) {
    return {};
  }
}

function getConfig() {
  const localConfig = loadLocalConfig();

  return {
    secretId: process.env.TENCENT_TTS_SECRET_ID || localConfig.secretId || "",
    secretKey: process.env.TENCENT_TTS_SECRET_KEY || localConfig.secretKey || "",
    region: process.env.TENCENT_TTS_REGION || localConfig.region || "ap-shanghai",
    voiceTypeZh: Number(process.env.TENCENT_TTS_VOICE_TYPE_ZH || localConfig.voiceTypeZh || 502007),
    voiceTypeEn: Number(process.env.TENCENT_TTS_VOICE_TYPE_EN || localConfig.voiceTypeEn || 502007),
    speed: Number(process.env.TENCENT_TTS_SPEED || localConfig.speed || 0),
    volume: Number(process.env.TENCENT_TTS_VOLUME || localConfig.volume || 1),
    sampleRate: Number(process.env.TENCENT_TTS_SAMPLE_RATE || localConfig.sampleRate || 16000),
  };
}

function buildResponse(ok, payload = {}) {
  return {
    ok,
    ...payload,
  };
}

function normalizeLanguage(language) {
  if (language === "en") {
    return "en";
  }

  return "zh";
}

function buildCacheKey(text, language, voiceType) {
  return crypto.createHash("md5").update(`${language}:${voiceType}:${text}`).digest("hex");
}

function buildTtsParams(text, language, config) {
  const normalizedLanguage = normalizeLanguage(language);
  const voiceType = normalizedLanguage === "en" ? config.voiceTypeEn : config.voiceTypeZh;
  const primaryLanguage = normalizedLanguage === "en" ? 2 : 1;

  return {
    params: {
      Codec: "mp3",
      ModelType: 1,
      PrimaryLanguage: primaryLanguage,
      SampleRate: config.sampleRate,
      SessionId: `moxie-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      Speed: config.speed,
      Text: text,
      VoiceType: voiceType,
      Volume: config.volume,
    },
    voiceType,
  };
}

exports.main = async (event) => {
  const text = (event?.text || "").trim();
  const language = event?.language || "zh";
  const config = getConfig();

  if (!text) {
    return buildResponse(false, {
      code: "EMPTY_TEXT",
      message: "云函数未收到可朗读文本",
    });
  }

  if (!config.secretId || !config.secretKey) {
    return buildResponse(false, {
      code: "TTS_CONFIG_MISSING",
      message: "请先在 cloudfunctions/tts/config.json 或环境变量中配置腾讯云 TTS 密钥",
    });
  }

  const client = new TtsClient({
    credential: {
      secretId: config.secretId,
      secretKey: config.secretKey,
    },
    region: config.region,
    profile: {
      httpProfile: {
        endpoint: "tts.tencentcloudapi.com",
      },
    },
  });

  try {
    const { params, voiceType } = buildTtsParams(text, language, config);
    const result = await client.TextToVoice(params);

    if (!result?.Audio) {
      return buildResponse(false, {
        code: "AUDIO_EMPTY",
        message: "腾讯云 TTS 没有返回音频数据",
      });
    }

    return buildResponse(true, {
      audioBase64: result.Audio,
      cacheKey: buildCacheKey(text, normalizeLanguage(language), voiceType),
      expiresAt: Date.now() + 2 * 60 * 60 * 1000,
      requestId: result.RequestId || "",
    });
  } catch (error) {
    return buildResponse(false, {
      code: error?.code || error?.Code || "TTS_CALL_FAILED",
      message: error?.message || error?.Message || "腾讯云 TTS 调用失败",
    });
  }
};
