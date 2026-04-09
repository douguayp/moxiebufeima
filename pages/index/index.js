const ICONS = {
  apertureWhite: "/assets/icons/aperture-white.svg",
  arrowRightWhite: "/assets/icons/arrow-right-white.svg",
  barChartDark: "/assets/icons/bar-chart-2-dark.svg",
  barChartHorizontalGreen: "/assets/icons/bar-chart-horizontal-green.svg",
  batteryDark: "/assets/icons/battery-full-dark.svg",
  bellYellow: "/assets/icons/bell-yellow.svg",
  bookXDark: "/assets/icons/book-x-dark.svg",
  bookXMuted: "/assets/icons/book-x-muted.svg",
  botDark: "/assets/icons/bot-dark.svg",
  botGreen: "/assets/icons/bot-green.svg",
  calendarDark: "/assets/icons/calendar-dark.svg",
  calendarHeartDark: "/assets/icons/calendar-heart-dark.svg",
  calendarMuted: "/assets/icons/calendar-muted.svg",
  cameraDark: "/assets/icons/camera-dark.svg",
  checkSquareDark: "/assets/icons/check-square-dark.svg",
  checkSquareMuted: "/assets/icons/check-square-muted.svg",
  chevronLeftDark: "/assets/icons/chevron-left-dark.svg",
  chevronRightMuted: "/assets/icons/chevron-right-muted.svg",
  clipboardDark: "/assets/icons/clipboard-paste-dark.svg",
  eyeDark: "/assets/icons/eye-dark.svg",
  eyeOffDark: "/assets/icons/eye-off-dark.svg",
  homeDark: "/assets/icons/home-dark.svg",
  homeMuted: "/assets/icons/home-muted.svg",
  leafDark: "/assets/icons/leaf-dark.svg",
  libraryDark: "/assets/icons/library-dark.svg",
  playCircleWhite: "/assets/icons/play-circle-white.svg",
  playSquareDark: "/assets/icons/play-square-dark.svg",
  playWhite: "/assets/icons/play-white.svg",
  saveDark: "/assets/icons/save-dark.svg",
  scanLineWhite: "/assets/icons/scan-line-white.svg",
  skipBackWhite: "/assets/icons/skip-back-white.svg",
  skipForwardWhite: "/assets/icons/skip-forward-white.svg",
  sparklesDark: "/assets/icons/sparkles-dark.svg",
  sparklesGreen: "/assets/icons/sparkles-green.svg",
  sparklesPink: "/assets/icons/sparkles-pink.svg",
  starGreen: "/assets/icons/star-green.svg",
  targetDark: "/assets/icons/target-dark.svg",
  timerDark: "/assets/icons/timer-dark.svg",
  volumeDark: "/assets/icons/volume-2-dark.svg",
  wifiDark: "/assets/icons/wifi-dark.svg",
  xMuted: "/assets/icons/x-muted.svg",
};

const INTERVAL_SECONDS = [3, 5, 8, 10];
const SPEECH_RATE_OPTIONS = [
  { label: "慢速", value: 0.85 },
  { label: "标准", value: 1 },
  { label: "稍快", value: 1.15 },
];
const MAX_TTS_CONTENT_LENGTH = 48;
const PHOTO_CROP_STAGE_WIDTH_RPX = 606;
const PHOTO_CROP_STAGE_HEIGHT_RPX = 760;
const PHOTO_CROP_MIN_SIZE_PX = 72;
const PHOTO_CROP_FRAME_MS = 16;
const {
  buildCorrectionHistoryRecord,
  buildWrongBookEntries,
  compareWithExpected,
  getFallbackTaskItems,
} = require("../../services/correction/mock");
const {
  OCR_RUNTIME_PROVIDER_DEFAULTS,
  OCR_RUNTIME_PROVIDER_STORAGE_KEYS,
  recognizeCorrection,
  recognizePhotoDictation,
} = require("../../services/ocr/index");
const { synthesizeSpeechToFile } = require("../../services/tts/index");

const PASTE_PLACEHOLDER = "例如：\n苹果 Apple 蜿蜒 Environment\nI go to school.\n春意盎然";
const GENERATED_PASTE_INPUT = "苹果 Apple 蜿蜒 Environment\nbeautiful awkward\nWe practice after dinner.";

const RECENT_CORRECTION = {
  score: "100",
  title: "英语 三年级上册",
  meta: "刚刚 · 全对！",
};

const MISTAKE_ITEMS = [
  {
    id: "mistake-zh-1",
    subject: "zh",
    badge: "复错 1 次",
    word: "蜿蜒",
    phonetic: "wān yán",
    wrong: "碗延",
    tip: "注意是“虫”字旁哦",
  },
  {
    id: "mistake-en-1",
    subject: "en",
    badge: "",
    word: "environment",
    phonetic: "",
    wrong: "enviroment",
    tip: "漏掉了中间的字母 n",
  },
];

const REVIEW_TIMELINE = [
  {
    id: "review-today",
    label: "Today",
    title: "语文一单元",
    subtitle: "艾宾浩斯 第 2 天",
    status: "待复习",
    active: true,
    dimmed: false,
  },
  {
    id: "review-tomorrow",
    label: "Tomorrow",
    title: "英语 Module 1",
    subtitle: "艾宾浩斯 第 3 天",
    status: "",
    active: false,
    dimmed: true,
  },
];

function detectItemLanguage(text) {
  const hasZh = /[\u4e00-\u9fff]/.test(text);
  const hasEn = /[A-Za-z]/.test(text);

  if (hasZh && hasEn) {
    return "mixed";
  }

  if (hasZh) {
    return "zh";
  }

  if (hasEn) {
    return "en";
  }

  return "unknown";
}

function getLanguageLabel(language) {
  if (language === "zh") return "中文";
  if (language === "en") return "English";
  if (language === "mixed") return "中英混合";
  return "未识别";
}

function getPlayerCardLabel(language) {
  if (language === "zh") return "当前听写内容 · 中文";
  if (language === "en") return "当前听写内容 · English";
  if (language === "mixed") return "当前听写内容 · 中英混合";
  return "当前听写内容";
}

function getSpeechLangCode(language) {
  if (language === "en") {
    return "en";
  }

  return "zh";
}

function forceSplitSpeechText(text, maxLength = MAX_TTS_CONTENT_LENGTH) {
  const segments = [];

  for (let start = 0; start < text.length; start += maxLength) {
    segments.push(text.slice(start, start + maxLength));
  }

  return segments;
}

function packSpeechSegments(units, maxLength = MAX_TTS_CONTENT_LENGTH) {
  const segments = [];
  let current = "";

  units.forEach((unit) => {
    const piece = unit.trim();

    if (!piece) {
      return;
    }

    if (!current) {
      if (piece.length <= maxLength) {
        current = piece;
      } else {
        segments.push(...forceSplitSpeechText(piece, maxLength));
      }
      return;
    }

    const candidate = `${current} ${piece}`.trim();

    if (candidate.length <= maxLength) {
      current = candidate;
      return;
    }

    segments.push(current);

    if (piece.length <= maxLength) {
      current = piece;
      return;
    }

    segments.push(...forceSplitSpeechText(piece, maxLength));
    current = "";
  });

  if (current) {
    segments.push(current);
  }

  return segments;
}

function splitSpeechContent(text, language) {
  const normalized = text.trim().replace(/\s+/g, " ");

  if (!normalized) {
    return [];
  }

  if (normalized.length <= MAX_TTS_CONTENT_LENGTH) {
    return [normalized];
  }

  if (language === "en") {
    return packSpeechSegments(normalized.split(/\s+/), MAX_TTS_CONTENT_LENGTH);
  }

  const punctuationSegments = normalized
    .match(/[^，。！？；,.!?;]+[，。！？；,.!?;]*/g)
    ?.map((item) => item.trim())
    .filter(Boolean);

  if (punctuationSegments && punctuationSegments.length > 1) {
    return packSpeechSegments(punctuationSegments, MAX_TTS_CONTENT_LENGTH);
  }

  return forceSplitSpeechText(normalized, MAX_TTS_CONTENT_LENGTH);
}

function getSpeechErrorMessage(error) {
  if (!error?.code) {
    return error?.message || "朗读失败，请稍后再试";
  }

  if (error.code === "CLOUD_UNAVAILABLE") {
    return "当前项目还没有启用云开发，请先开通并初始化云环境";
  }

  if (error.code === "TTS_CONFIG_MISSING") {
    return "请先配置腾讯云 TTS 密钥，然后重新部署 tts 云函数";
  }

  if (error.code === "FUNCTION_NOT_FOUND") {
    return "找不到 tts 云函数，请先上传并部署云函数";
  }

  if (error.code === "AUDIO_EMPTY") {
    return "TTS 没有返回音频数据，请稍后重试";
  }

  if (error.code === "FILE_WRITE_FAILED") {
    return "本地音频写入失败，请检查存储权限";
  }

  return error.message || "朗读失败，请稍后再试";
}

function shouldSplitInline(line) {
  const tokens = line.split(/[\s,，;；]+/).map((item) => item.trim()).filter(Boolean);

  if (tokens.length <= 1) {
    return false;
  }

  if (/[。！？.!?]/.test(line)) {
    return false;
  }

  const hasZh = /[\u4e00-\u9fff]/.test(line);
  const hasEn = /[A-Za-z]/.test(line);

  if (hasZh && hasEn) {
    return true;
  }

  if (!hasZh && hasEn) {
    const allAlphaTokens = tokens.every((token) => /^[A-Za-z'-]+$/.test(token));
    const allCapitalized = tokens.every((token) => /^[A-Z]/.test(token));

    if (allAlphaTokens && (tokens.length <= 2 || allCapitalized)) {
      return true;
    }

    if (tokens.length > 2) {
      return false;
    }
  }

  return true;
}

function splitDictationInput(input) {
  if (!input.trim()) {
    return [];
  }

  const items = [];

  input
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .forEach((line) => {
      if (shouldSplitInline(line)) {
        line
          .split(/[\s,，;；]+/)
          .map((item) => item.trim())
          .filter(Boolean)
          .forEach((text) => {
            items.push(text);
          });
        return;
      }

      items.push(line);
    });

  return items.map((text, index) => {
    const language = detectItemLanguage(text);

    return {
      id: `item-${index}`,
      text,
      language,
      languageLabel: getLanguageLabel(language),
    };
  });
}

function cleanPhotoDictationText(text) {
  return String(text || "")
    .replace(/\r/g, "\n")
    .replace(/\n+/g, " ")
    .replace(/[ \t]+/g, " ")
    .trim();
}

function shouldKeepPhotoDictationText(text) {
  return Boolean(text);
}

function sanitizePhotoDictationItems(items = []) {
  return items.reduce((result, item, index) => {
    const text = cleanPhotoDictationText(item?.text);

    if (!shouldKeepPhotoDictationText(text)) {
      return result;
    }

    const language = detectItemLanguage(text);

    result.push({
      id: item?.id || `photo-dictation-${index}`,
      text,
      language,
      languageLabel: getLanguageLabel(language),
    });

    return result;
  }, []);
}

function buildDictationEditorText(items = []) {
  return items
    .map((item) => item.text)
    .filter(Boolean)
    .join("\n");
}

function countDictationItems(input) {
  return splitDictationInput(input).length;
}

function getSpeechRateValue(selectedSpeechRateIndex) {
  return SPEECH_RATE_OPTIONS[selectedSpeechRateIndex]?.value || 1;
}

function getSpeechRateLabel(selectedSpeechRateIndex) {
  return SPEECH_RATE_OPTIONS[selectedSpeechRateIndex]?.label || "标准";
}

function getPhotoSetupOcrStatusLabel(status) {
  if (status === "loading") {
    return "识别中";
  }

  if (status === "success") {
    return "识别成功";
  }

  if (status === "empty") {
    return "识别为空";
  }

  if (status === "error") {
    return "识别失败";
  }

  return "未识别";
}

function getStorageSyncSafe(key) {
  try {
    return wx.getStorageSync(key) || "";
  } catch (error) {
    return "";
  }
}

function getPhotoDictationProviderName() {
  return (
    getStorageSyncSafe(OCR_RUNTIME_PROVIDER_STORAGE_KEYS.photoDictation) ||
    OCR_RUNTIME_PROVIDER_DEFAULTS.photoDictation
  );
}

function isDebugRuntime() {
  try {
    const envVersion = wx.getAccountInfoSync?.().miniProgram?.envVersion;
    return envVersion !== "release";
  } catch (error) {
    return true;
  }
}

function logOcrDebug(stage, payload) {
  if (!isDebugRuntime()) {
    return;
  }

  console.info(`[OCR DEBUG] ${stage}`, payload);
}

function buildAnalysisPreset(playerItems) {
  const counts = playerItems.reduce(
    (result, item) => {
      result[item.language] = (result[item.language] || 0) + 1;
      return result;
    },
    { zh: 0, en: 0, mixed: 0, unknown: 0 }
  );

  if ((counts.zh > 0 && counts.en > 0) || counts.mixed > 0) {
    return {
      title: "混合语言内容分析",
      subtitle: "Mock 结果：检测到中英文混合内容，建议保持自动语言识别播报。",
      actionText: "继续生成混合默写任务",
      items: [
        {
          title: "中英文条目已自动拆开",
          desc: "像“苹果 Apple 蜿蜒 Environment”这类输入会优先拆成独立条目，再分别识别语言。",
        },
        {
          title: "英文内容更适合慢速播报",
          desc: "后续接入真实 TTS 时，英文单词和短句建议保持更慢语速，减少拼写误听。",
        },
        {
          title: "中文内容继续保持规范字形",
          desc: "当前学习界面会优先使用清晰标准字体，避免影响识字和默写训练。",
        },
      ],
    };
  }

  if (counts.en > 0) {
    return {
      title: "英语内容分析",
      subtitle: "Mock 结果：当前任务以英文内容为主，建议重点关注拼写与停顿节奏。",
      actionText: "继续生成英语默写任务",
      items: [
        {
          title: "长单词建议单独拆条",
          desc: "environment、beautiful 这类词单独成条时，更利于跟随播报逐个书写。",
        },
        {
          title: "英文短句建议整行保留",
          desc: "带空格的完整英文句子会优先按整行处理，避免被错误切碎。",
        },
        {
          title: "后续可接真实英文语音",
          desc: "当前阶段先保留语言识别和 mock 播报链路，后续再替换成真实英语 TTS。",
        },
      ],
    };
  }

  return {
    title: "中文内容分析",
    subtitle: "Mock 结果：当前任务以中文内容为主，建议重点复习字形和偏旁细节。",
    actionText: "继续生成中文默写任务",
    items: [
      {
        title: "形近字仍是高频问题",
        desc: "“蜿蜒 / 碗延”这类字形相近内容，依然适合作为重点复习对象。",
      },
      {
        title: "中文词语适合逐条播报",
        desc: "短词和四字词优先拆成单条，可明显降低听写时的遗漏概率。",
      },
      {
        title: "界面继续使用标准字体",
        desc: "学习内容默认保持清晰规范字形，避免影响孩子对生字结构的判断。",
      },
    ],
  };
}

function buildMistakeFilters(activeFilter) {
  return [
    { key: "all", label: "全部 (6)", active: activeFilter === "all" },
    { key: "zh", label: "语文 (4)", active: activeFilter === "zh" },
    { key: "en", label: "英语 (2)", active: activeFilter === "en" },
  ];
}

function getDisplayedMistakes(activeFilter) {
  if (activeFilter === "all") {
    return MISTAKE_ITEMS;
  }

  return MISTAKE_ITEMS.filter((item) => item.subject === activeFilter);
}

function getCorrectionBaseItems(taskItems = []) {
  if (taskItems.length) {
    return taskItems.map((item, index) => ({
      id: item.id || `task-${index}`,
      text: item.text,
      language: item.language,
    }));
  }

  return getFallbackTaskItems();
}

function getCorrectionSourceTitle(hasTaskItems) {
  return hasTaskItems ? "标准答案来源：最近一次听写任务" : "标准答案来源：内置 mock 任务";
}

function getCorrectionSourcePreview(taskItems = []) {
  const baseItems = getCorrectionBaseItems(taskItems);
  return baseItems.slice(0, 4).map((item) => item.text).join(" / ");
}

function buildCorrectionSummaryData(taskItems = []) {
  return {
    correctionExpectedItems: getCorrectionBaseItems(taskItems),
    correctionSourceTitle: getCorrectionSourceTitle(taskItems.length > 0),
    correctionSourcePreview: getCorrectionSourcePreview(taskItems),
  };
}

function isCancelError(error) {
  return Boolean(error?.errMsg && error.errMsg.includes("cancel"));
}

function chooseImageSourceType() {
  return new Promise((resolve, reject) => {
    wx.showActionSheet({
      itemList: ["拍照", "从相册选择"],
      success: (result) => {
        resolve(result.tapIndex === 0 ? "camera" : "album");
      },
      fail: reject,
    });
  });
}

function chooseSingleImage(sourceType) {
  return new Promise((resolve, reject) => {
    wx.chooseImage({
      count: 1,
      sizeType: ["compressed"],
      sourceType: [sourceType],
      success: (result) => {
        const imagePath = result?.tempFilePaths?.[0];

        if (!imagePath) {
          reject(new Error("没有读取到图片，请重试"));
          return;
        }

        resolve(imagePath);
      },
      fail: reject,
    });
  });
}

function getImageInfo(src) {
  return new Promise((resolve, reject) => {
    wx.getImageInfo({
      src,
      success: resolve,
      fail: reject,
    });
  });
}

function buildPhotoCropMetrics(imageInfo, windowWidth, windowHeight) {
  const pxPerRpx = windowWidth / 750;
  const stageWidthPx = Math.round(windowWidth);
  const reservedHeightPx = Math.round(220 * pxPerRpx);
  const stageHeightPx = Math.max(
    Math.round(PHOTO_CROP_STAGE_HEIGHT_RPX * pxPerRpx),
    Math.round((windowHeight || stageWidthPx) - reservedHeightPx)
  );
  const imageWidth = imageInfo?.width || 1;
  const imageHeight = imageInfo?.height || 1;
  const imageRatio = imageWidth / imageHeight;
  const stageRatio = stageWidthPx / stageHeightPx;
  let renderWidthPx = stageWidthPx;
  let renderHeightPx = stageHeightPx;
  let renderOffsetXPx = 0;
  let renderOffsetYPx = 0;

  if (imageRatio > stageRatio) {
    renderWidthPx = stageWidthPx;
    renderHeightPx = renderWidthPx / imageRatio;
    renderOffsetYPx = Math.round((stageHeightPx - renderHeightPx) / 2);
  } else {
    renderHeightPx = stageHeightPx;
    renderWidthPx = renderHeightPx * imageRatio;
    renderOffsetXPx = Math.round((stageWidthPx - renderWidthPx) / 2);
  }

  const insetX = Math.round(renderWidthPx * 0.1);
  const insetY = Math.round(renderHeightPx * 0.1);

  return {
    photoCropImagePath: imageInfo.path,
    photoCropImageWidth: imageWidth,
    photoCropImageHeight: imageHeight,
    photoCropStageWidthPx: stageWidthPx,
    photoCropStageHeightPx: stageHeightPx,
    photoCropRenderWidthPx: Math.round(renderWidthPx),
    photoCropRenderHeightPx: Math.round(renderHeightPx),
    photoCropRenderOffsetXPx: renderOffsetXPx,
    photoCropRenderOffsetYPx: renderOffsetYPx,
    photoCropRectLeftPx: renderOffsetXPx + insetX,
    photoCropRectTopPx: renderOffsetYPx + insetY,
    photoCropRectWidthPx: Math.round(renderWidthPx - insetX * 2),
    photoCropRectHeightPx: Math.round(renderHeightPx - insetY * 2),
  };
}

Page({
  data: {
    icons: ICONS,
    statusBarHeight: 20,
    activeView: "dictate",
    showPasteModal: false,
    showPhotoConfirmSheet: false,
    showPhotoCropSheet: false,
    showAiModal: false,
    showAnalysisSheet: false,
    showToast: false,
    toastMessage: "提示",
    photoConfirmImagePath: "",
    photoConfirmSourceType: "",
    photoCropImagePath: "",
    photoCropImageWidth: 0,
    photoCropImageHeight: 0,
    photoCropStageWidthPx: 0,
    photoCropStageHeightPx: 0,
    photoCropRenderWidthPx: 0,
    photoCropRenderHeightPx: 0,
    photoCropRenderOffsetXPx: 0,
    photoCropRenderOffsetYPx: 0,
    photoCropRectLeftPx: 0,
    photoCropRectTopPx: 0,
    photoCropRectWidthPx: 0,
    photoCropRectHeightPx: 0,
    photoCropCanvasWidthPx: 1200,
    photoCropCanvasHeightPx: 1600,
    photoSetupImagePath: "",
    photoSetupInput: "",
    photoSetupDetectedCount: 0,
    photoSetupAutoPlay: false,
    photoSetupOcrStatus: "idle",
    photoSetupOcrStatusLabel: getPhotoSetupOcrStatusLabel("idle"),
    photoSetupOcrMessage: "裁剪后的教材内容会先进行 OCR 识别，再写入下方可编辑文本框。",
    photoSetupOcrProvider: "",
    photoSetupCanStart: false,
    pasteInput: "",
    pastePlaceholder: PASTE_PLACEHOLDER,
    playerItems: [],
    lastTaskItems: [],
    playerWord: "",
    currentPlayerIndex: 0,
    currentPlayerDisplay: 0,
    playerTotalCount: 0,
    playerCardLabel: "当前听写内容",
    revealed: false,
    autoPlayEnabled: false,
    speechRateOptions: SPEECH_RATE_OPTIONS,
    speechRateLabels: SPEECH_RATE_OPTIONS.map((item) => item.label),
    selectedSpeechRateIndex: 1,
    intervalOptions: ["3秒", "5秒", "8秒", "10秒"],
    selectedIntervalIndex: 1,
    reviewTarget: 8,
    analysisTitle: "",
    analysisSubtitle: "",
    analysisActionText: "",
    analysisItems: [],
    recentCorrection: RECENT_CORRECTION,
    correctionImagePath: "",
    correctionExpectedItems: getFallbackTaskItems(),
    correctionSourceTitle: getCorrectionSourceTitle(false),
    correctionSourcePreview: getCorrectionSourcePreview([]),
    correctionRecognizedItems: [],
    correctionResult: null,
    correctionBusy: false,
    correctionWrongItemsAdded: false,
    activeMistakeFilter: "all",
    mistakeFilters: buildMistakeFilters("all"),
    displayMistakes: getDisplayedMistakes("all"),
    reviewTimeline: REVIEW_TIMELINE,
  },

  onLoad() {
    let statusBarHeight = 20;

    if (wx.getWindowInfo) {
      statusBarHeight = wx.getWindowInfo().statusBarHeight || statusBarHeight;
    } else {
      statusBarHeight = wx.getSystemInfoSync().statusBarHeight || statusBarHeight;
    }

    this.setData({
      statusBarHeight,
    });

    if (wx.getWindowInfo) {
      const windowInfo = wx.getWindowInfo();
      this.viewportWidth = windowInfo.windowWidth;
      this.viewportHeight = windowInfo.windowHeight;
    } else {
      const systemInfo = wx.getSystemInfoSync();
      this.viewportWidth = systemInfo.windowWidth;
      this.viewportHeight = systemInfo.windowHeight;
    }

    this.speechCache = {};
    this.activeSpeechSession = 0;
    this.currentSpeechSegments = [];
    this.currentSpeechSegmentIndex = -1;
    this.currentSpeechLangCode = "zh";
    this.currentSpeechCacheKey = "";
    this.currentSpeechWarningSession = -1;
    this.photoCropGesture = null;
    this.photoCropPendingRect = null;
    this.photoCropFrameTimer = null;
  },

  onHide() {
    this.clearAutoPlayTimer();
    this.stopSpeechPlayback();
    this.setData({ autoPlayEnabled: false });
  },

  onUnload() {
    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
    }

    this.clearAutoPlayTimer();

    this.stopSpeechPlayback();

    if (this.photoCropFrameTimer) {
      clearTimeout(this.photoCropFrameTimer);
      this.photoCropFrameTimer = null;
    }

    if (this.audioContext) {
      this.audioContext.destroy();
      this.audioContext = null;
    }
  },

  noop() {},

  clearAutoPlayTimer() {
    if (this.autoPlayTimer) {
      clearTimeout(this.autoPlayTimer);
      this.autoPlayTimer = null;
    }
  },

  syncMistakeFilter(activeMistakeFilter, extraData = {}) {
    this.setData({
      activeMistakeFilter,
      mistakeFilters: buildMistakeFilters(activeMistakeFilter),
      displayMistakes: getDisplayedMistakes(activeMistakeFilter),
      ...extraData,
    });
  },

  showToastMessage(message) {
    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
    }

    this.setData({
      showToast: true,
      toastMessage: message,
    });

    this.toastTimer = setTimeout(() => {
      this.setData({ showToast: false });
    }, 2200);
  },

  setPhotoSetupState(partialData = {}) {
    const nextInput =
      Object.prototype.hasOwnProperty.call(partialData, "photoSetupInput")
        ? partialData.photoSetupInput
        : this.data.photoSetupInput;
    const nextStatus =
      Object.prototype.hasOwnProperty.call(partialData, "photoSetupOcrStatus")
        ? partialData.photoSetupOcrStatus
        : this.data.photoSetupOcrStatus;
    const nextDetectedCount = countDictationItems(nextInput);

    this.setData({
      ...partialData,
      photoSetupDetectedCount: nextDetectedCount,
      photoSetupCanStart: nextStatus !== "loading" && nextDetectedCount > 0,
      photoSetupOcrStatusLabel: getPhotoSetupOcrStatusLabel(nextStatus),
    });
  },

  openPhotoRecognitionSetup(imagePath) {
    this.setPhotoSetupState({
      activeView: "photoSetup",
      showPhotoConfirmSheet: false,
      photoConfirmImagePath: "",
      photoConfirmSourceType: "",
      photoSetupImagePath: imagePath,
      photoSetupInput: "",
      photoSetupAutoPlay: false,
      photoSetupOcrStatus: "idle",
      photoSetupOcrMessage: "裁剪后的教材内容会先进行 OCR 识别，再写入下方可编辑文本框。",
      photoSetupOcrProvider: "",
    });
  },

  async performPhotoSetupOcr(imagePath, options = {}) {
    if (!imagePath) {
      this.setPhotoSetupState({
        photoSetupOcrStatus: "error",
        photoSetupOcrMessage: "当前没有可识别的图片，请重新拍照后再试",
      });
      return;
    }

    const requestedProvider = getPhotoDictationProviderName();

    this.setPhotoSetupState({
      photoSetupImagePath: imagePath,
      photoSetupOcrStatus: "loading",
      photoSetupOcrMessage: "正在识别教材页印刷体内容，请稍候…",
      photoSetupOcrProvider: requestedProvider,
      photoSetupInput: "",
    });

    if (options.showLoading !== false) {
      wx.showLoading({
        title: "识别中",
        mask: true,
      });
    }

    try {
      const ocrResult = await recognizePhotoDictation({
        imagePath,
      });
      const playerItems = sanitizePhotoDictationItems(ocrResult.items || []);
      const cleanedText = buildDictationEditorText(playerItems);
      const success = playerItems.length > 0;
      const provider = ocrResult.provider || requestedProvider;

      logOcrDebug("photo-dictation-recognition", {
        provider,
        requestedProvider,
        rawResult: ocrResult.rawResult,
        cleanedText,
        success,
        count: playerItems.length,
        rawCount: (ocrResult.items || []).length,
        warningMessage: ocrResult.warningMessage || "",
      });

      if (!success) {
        this.setPhotoSetupState({
          photoSetupOcrStatus: "empty",
          photoSetupOcrProvider: provider,
          photoSetupOcrMessage: "没有识别到可默写内容，请重新拍照，或裁剪更聚焦的教材区域后重试。",
          photoSetupInput: "",
        });
        this.showToastMessage("当前图片没有识别到可默写内容");
        return;
      }

      this.setPhotoSetupState({
        photoSetupOcrStatus: "success",
        photoSetupOcrProvider: provider,
        photoSetupOcrMessage:
          ocrResult.warningMessage || `已识别 ${playerItems.length} 条内容，可直接修改后开始默写。`,
        photoSetupInput: cleanedText,
      });

      this.showToastMessage(
        ocrResult.warningMessage || `OCR 已识别 ${playerItems.length} 条内容，请确认后开始默写`
      );
    } catch (error) {
      logOcrDebug("photo-dictation-recognition-failed", {
        provider: requestedProvider,
        success: false,
        errorCode: error?.code || "",
        errorMessage: error?.message || "",
      });

      this.setPhotoSetupState({
        photoSetupOcrStatus: "error",
        photoSetupOcrProvider: requestedProvider,
        photoSetupOcrMessage:
          error?.message || "OCR 识别失败，请重试；若仍失败，请重新拍照或裁剪更清晰的区域。",
      });
      this.showToastMessage(error?.message || "OCR 识别失败，请稍后再试");
    } finally {
      if (options.showLoading !== false) {
        wx.hideLoading();
      }
    }
  },

  retryPhotoSetupOcr() {
    this.performPhotoSetupOcr(this.data.photoSetupImagePath);
  },

  openPhotoConfirm(imagePath, sourceType = "") {
    if (!imagePath) {
      this.showToastMessage("没有读取到图片，请重试");
      return;
    }

    this.setData({
      activeView: "dictate",
      showPhotoConfirmSheet: true,
      photoConfirmImagePath: imagePath,
      photoConfirmSourceType: sourceType,
    });
  },

  enterPlayerWithItems(playerItems, options = {}) {
    if (!playerItems.length) {
      this.showToastMessage("当前没有可开始默写的内容");
      return false;
    }

    const firstItem = playerItems[0];
    const autoPlayEnabled = Boolean(options.autoPlay);
    const successMessage = options.successMessage || "";

    this.clearAutoPlayTimer();
    this.stopSpeechPlayback();

    this.setData({
      activeView: "player",
      showPasteModal: false,
      showPhotoConfirmSheet: false,
      showPhotoCropSheet: false,
      photoConfirmImagePath: "",
      photoConfirmSourceType: "",
      photoSetupImagePath: "",
      photoSetupInput: "",
      photoSetupDetectedCount: 0,
      playerItems,
      lastTaskItems: playerItems,
      playerWord: firstItem.text,
      currentPlayerIndex: 0,
      currentPlayerDisplay: 1,
      playerTotalCount: playerItems.length,
      playerCardLabel: getPlayerCardLabel(firstItem.language),
      revealed: false,
      autoPlayEnabled,
    });

    if (successMessage) {
      this.showToastMessage(successMessage);
    }

    if (autoPlayEnabled) {
      setTimeout(() => {
        if (this.data.activeView === "player" && this.data.autoPlayEnabled) {
          this.playCurrentWord();
        }
      }, 80);
    }

    return true;
  },

  switchTab(event) {
    const { view } = event.currentTarget.dataset;
    this.clearAutoPlayTimer();
    this.stopSpeechPlayback();
    const nextState = {
      activeView: view,
      autoPlayEnabled: false,
      revealed: false,
    };

    if (view === "grade") {
      Object.assign(nextState, buildCorrectionSummaryData(this.data.lastTaskItems));
    }

    this.setData(nextState);
  },

  goToReview() {
    this.clearAutoPlayTimer();
    this.stopSpeechPlayback();
    this.setData({ activeView: "review" });
  },

  ensureAudioContext() {
    if (this.audioContext) {
      return this.audioContext;
    }

    const audioContext = wx.createInnerAudioContext();
    audioContext.obeyMuteSwitch = false;
    audioContext.autoplay = false;

    audioContext.onEnded(() => {
      this.handleSpeechEnded();
    });

    audioContext.onError((error) => {
      this.handleSpeechError(error);
    });

    this.audioContext = audioContext;
    return audioContext;
  },

  stopSpeechPlayback() {
    this.activeSpeechSession = (this.activeSpeechSession || 0) + 1;
    this.currentSpeechSegments = [];
    this.currentSpeechSegmentIndex = -1;
    this.currentSpeechLangCode = "zh";
    this.currentSpeechCacheKey = "";
    this.currentSpeechWarningSession = -1;

    if (this.audioContext) {
      try {
        this.audioContext.stop();
      } catch (error) {
        console.warn("audio stop failed", error);
      }
    }
  },

  async resolveSpeechUrl(content, langCode) {
    const cacheKey = `${langCode}::${content}`;
    const cachedSpeech = this.speechCache?.[cacheKey];

    if (cachedSpeech && cachedSpeech.expiresAt > Date.now() + 60 * 1000) {
      return {
        url: cachedSpeech.url,
        cacheKey,
        warningMessage: cachedSpeech.warningMessage || "",
      };
    }

    const speechResult = await synthesizeSpeechToFile({
      text: content,
      language: langCode,
    });

    this.speechCache[cacheKey] = {
      url: speechResult.filePath,
      expiresAt: speechResult.expiresAt,
      warningMessage: speechResult.warningMessage || "",
    };

    return {
      url: speechResult.filePath,
      cacheKey,
      warningMessage: speechResult.warningMessage || "",
    };
  },

  async playSpeechSegment(segments, langCode, speechSession, segmentIndex = 0) {
    const segment = segments[segmentIndex];

    if (!segment || speechSession !== this.activeSpeechSession) {
      return;
    }

    try {
      const { url, cacheKey, warningMessage } = await this.resolveSpeechUrl(segment, langCode);

      if (speechSession !== this.activeSpeechSession) {
        return;
      }

      if (warningMessage && this.currentSpeechWarningSession !== speechSession) {
        this.currentSpeechWarningSession = speechSession;
        this.showToastMessage(warningMessage);
      }

      const audioContext = this.ensureAudioContext();
      this.currentSpeechSegments = segments;
      this.currentSpeechSegmentIndex = segmentIndex;
      this.currentSpeechLangCode = langCode;
      this.currentSpeechCacheKey = cacheKey;
      try {
        audioContext.playbackRate = getSpeechRateValue(this.data.selectedSpeechRateIndex);
      } catch (error) {
        console.warn("set playbackRate failed", error);
      }
      audioContext.src = url;
      audioContext.play();
    } catch (error) {
      if (speechSession !== this.activeSpeechSession) {
        return;
      }

      this.handleSpeechFailure(error);
    }
  },

  handleSpeechEnded() {
    if (!this.currentSpeechSegments.length) {
      return;
    }

    if (this.currentSpeechSegmentIndex < this.currentSpeechSegments.length - 1) {
      this.playSpeechSegment(
        this.currentSpeechSegments,
        this.currentSpeechLangCode,
        this.activeSpeechSession,
        this.currentSpeechSegmentIndex + 1
      );
      return;
    }

    this.currentSpeechSegments = [];
    this.currentSpeechSegmentIndex = -1;
    this.currentSpeechCacheKey = "";

    if (this.data.autoPlayEnabled) {
      this.scheduleAutoPlay();
    }
  },

  handleSpeechFailure(error) {
    if (this.currentSpeechCacheKey) {
      delete this.speechCache[this.currentSpeechCacheKey];
    }

    this.currentSpeechSegments = [];
    this.currentSpeechSegmentIndex = -1;
    this.currentSpeechCacheKey = "";
    this.clearAutoPlayTimer();

    if (this.data.autoPlayEnabled) {
      this.setData({ autoPlayEnabled: false });
    }

    this.showToastMessage(getSpeechErrorMessage(error));
  },

  handleSpeechError(error) {
    if (!this.currentSpeechSegments.length) {
      return;
    }

    console.warn("audio playback failed", error);
    this.handleSpeechFailure(error);
  },

  handleToolTap(event) {
    const { action } = event.currentTarget.dataset;

    if (action === "camera") {
      this.chooseCorrectionImage();
      return;
    }

    if (action === "photo-dictation") {
      this.startPhotoDictationFlow();
      return;
    }

    this.showToastMessage("阶段 2 先保留词句库入口 UI");
  },

  async startPhotoDictationFlow() {
    let sourceType = "";

    try {
      sourceType = await chooseImageSourceType();
    } catch (error) {
      if (!isCancelError(error)) {
        this.showToastMessage("未能打开照片来源选择");
      }
      return;
    }

    if (sourceType === "camera") {
      this.setData({
        activeView: "photoCapture",
      });
      return;
    }

    try {
      const imagePath = await chooseSingleImage("album");
      this.openPhotoConfirm(imagePath, "album");
    } catch (error) {
      if (!isCancelError(error)) {
        this.showToastMessage(error?.message || "选图失败，请检查相册权限");
      }
    }
  },

  closePhotoCaptureView() {
    this.setData({
      activeView: "dictate",
    });
  },

  takePhotoForDictation() {
    const cameraContext = wx.createCameraContext();

    cameraContext.takePhoto({
      quality: "high",
      success: (result) => {
        const imagePath = result?.tempImagePath;

        this.openPhotoConfirm(imagePath, "camera");
      },
      fail: (error) => {
        if (isCancelError(error)) {
          return;
        }

        this.showToastMessage("拍照失败，请重试");
      },
    });
  },

  handlePhotoCameraError() {
    this.showToastMessage("相机打开失败，请检查相机权限");
  },

  closePhotoConfirmSheet() {
    this.setData({
      showPhotoConfirmSheet: false,
      photoConfirmImagePath: "",
      photoConfirmSourceType: "",
    });
  },

  async retakePhotoConfirm() {
    const sourceType = this.data.photoConfirmSourceType || "camera";

    this.setData({
      showPhotoCropSheet: false,
      showPhotoConfirmSheet: false,
      photoConfirmImagePath: "",
    });

    if (sourceType === "camera") {
      this.setData({
        activeView: "photoCapture",
      });
      return;
    }

    try {
      const imagePath = await chooseSingleImage("album");
      this.openPhotoConfirm(imagePath, "album");
    } catch (error) {
      if (!isCancelError(error)) {
        this.showToastMessage(error?.message || "重新选图失败，请重试");
      }
    }
  },

  async applyPhotoConfirmCrop() {
    const imagePath = this.data.photoConfirmImagePath;

    if (!imagePath) {
      this.showToastMessage("当前没有可裁剪的照片");
      return;
    }

    try {
      const imageInfo = await getImageInfo(imagePath);

      this.setData({
        showPhotoCropSheet: true,
        ...buildPhotoCropMetrics(imageInfo, this.viewportWidth || 375, this.viewportHeight || 667),
      });
    } catch (error) {
      this.showToastMessage("裁剪失败，请重试");
    }
  },

  closePhotoCropSheet() {
    this.photoCropGesture = null;
    this.photoCropPendingRect = null;
    if (this.photoCropFrameTimer) {
      clearTimeout(this.photoCropFrameTimer);
      this.photoCropFrameTimer = null;
    }
    this.setData({ showPhotoCropSheet: false });
  },

  commitPhotoCropRect(nextRect) {
    this.setData({
      photoCropRectLeftPx: Math.round(nextRect.left),
      photoCropRectTopPx: Math.round(nextRect.top),
      photoCropRectWidthPx: Math.round(nextRect.width),
      photoCropRectHeightPx: Math.round(nextRect.height),
    });
  },

  queuePhotoCropRect(nextRect) {
    this.photoCropPendingRect = nextRect;

    if (this.photoCropFrameTimer) {
      return;
    }

    this.photoCropFrameTimer = setTimeout(() => {
      this.photoCropFrameTimer = null;

      if (!this.photoCropPendingRect) {
        return;
      }

      const pendingRect = this.photoCropPendingRect;
      this.photoCropPendingRect = null;
      this.commitPhotoCropRect(pendingRect);
    }, PHOTO_CROP_FRAME_MS);
  },

  startPhotoCropGesture(event) {
    const { handle } = event.currentTarget.dataset;
    const touch = event.touches?.[0];

    if (!handle || !touch) {
      return;
    }

    this.photoCropGesture = {
      handle,
      startX: touch.clientX,
      startY: touch.clientY,
      startRect: {
        left: this.data.photoCropRectLeftPx,
        top: this.data.photoCropRectTopPx,
        width: this.data.photoCropRectWidthPx,
        height: this.data.photoCropRectHeightPx,
      },
    };
  },

  movePhotoCropGesture(event) {
    if (!this.photoCropGesture) {
      return;
    }

    const touch = event.touches?.[0];

    if (!touch) {
      return;
    }

    const dx = touch.clientX - this.photoCropGesture.startX;
    const dy = touch.clientY - this.photoCropGesture.startY;
    const startRect = this.photoCropGesture.startRect;
    const bounds = {
      left: this.data.photoCropRenderOffsetXPx,
      top: this.data.photoCropRenderOffsetYPx,
      right: this.data.photoCropRenderOffsetXPx + this.data.photoCropRenderWidthPx,
      bottom: this.data.photoCropRenderOffsetYPx + this.data.photoCropRenderHeightPx,
    };

    let left = startRect.left;
    let top = startRect.top;
    let width = startRect.width;
    let height = startRect.height;

    switch (this.photoCropGesture.handle) {
      case "move":
        left = Math.min(Math.max(startRect.left + dx, bounds.left), bounds.right - startRect.width);
        top = Math.min(Math.max(startRect.top + dy, bounds.top), bounds.bottom - startRect.height);
        break;
      case "tm":
        top = Math.min(Math.max(startRect.top + dy, bounds.top), startRect.top + startRect.height - PHOTO_CROP_MIN_SIZE_PX);
        height = startRect.height + (startRect.top - top);
        break;
      case "tl":
        left = Math.min(Math.max(startRect.left + dx, bounds.left), startRect.left + startRect.width - PHOTO_CROP_MIN_SIZE_PX);
        top = Math.min(Math.max(startRect.top + dy, bounds.top), startRect.top + startRect.height - PHOTO_CROP_MIN_SIZE_PX);
        width = startRect.width + (startRect.left - left);
        height = startRect.height + (startRect.top - top);
        break;
      case "tr":
        top = Math.min(Math.max(startRect.top + dy, bounds.top), startRect.top + startRect.height - PHOTO_CROP_MIN_SIZE_PX);
        width = Math.min(Math.max(startRect.width + dx, PHOTO_CROP_MIN_SIZE_PX), bounds.right - startRect.left);
        height = startRect.height + (startRect.top - top);
        break;
      case "rm":
        width = Math.min(Math.max(startRect.width + dx, PHOTO_CROP_MIN_SIZE_PX), bounds.right - startRect.left);
        break;
      case "bl":
        left = Math.min(Math.max(startRect.left + dx, bounds.left), startRect.left + startRect.width - PHOTO_CROP_MIN_SIZE_PX);
        width = startRect.width + (startRect.left - left);
        height = Math.min(Math.max(startRect.height + dy, PHOTO_CROP_MIN_SIZE_PX), bounds.bottom - startRect.top);
        break;
      case "bm":
        height = Math.min(Math.max(startRect.height + dy, PHOTO_CROP_MIN_SIZE_PX), bounds.bottom - startRect.top);
        break;
      case "br":
        width = Math.min(Math.max(startRect.width + dx, PHOTO_CROP_MIN_SIZE_PX), bounds.right - startRect.left);
        height = Math.min(Math.max(startRect.height + dy, PHOTO_CROP_MIN_SIZE_PX), bounds.bottom - startRect.top);
        break;
      case "lm":
        left = Math.min(Math.max(startRect.left + dx, bounds.left), startRect.left + startRect.width - PHOTO_CROP_MIN_SIZE_PX);
        width = startRect.width + (startRect.left - left);
        break;
      default:
        break;
    }

    this.queuePhotoCropRect({
      left,
      top,
      width,
      height,
    });
  },

  endPhotoCropGesture() {
    this.photoCropGesture = null;

    if (this.photoCropPendingRect) {
      const pendingRect = this.photoCropPendingRect;
      this.photoCropPendingRect = null;

      if (this.photoCropFrameTimer) {
        clearTimeout(this.photoCropFrameTimer);
        this.photoCropFrameTimer = null;
      }

      this.commitPhotoCropRect(pendingRect);
    }
  },

  async confirmPhotoCrop() {
    const {
      photoCropImagePath,
      photoCropImageWidth,
      photoCropImageHeight,
      photoCropRenderWidthPx,
      photoCropRenderHeightPx,
      photoCropRenderOffsetXPx,
      photoCropRenderOffsetYPx,
      photoCropRectLeftPx,
      photoCropRectTopPx,
      photoCropRectWidthPx,
      photoCropRectHeightPx,
    } = this.data;

    if (!photoCropImagePath) {
      this.showToastMessage("当前没有可裁剪的照片");
      return;
    }

    const sourceX = ((photoCropRectLeftPx - photoCropRenderOffsetXPx) / photoCropRenderWidthPx) * photoCropImageWidth;
    const sourceY = ((photoCropRectTopPx - photoCropRenderOffsetYPx) / photoCropRenderHeightPx) * photoCropImageHeight;
    const sourceWidth = (photoCropRectWidthPx / photoCropRenderWidthPx) * photoCropImageWidth;
    const sourceHeight = (photoCropRectHeightPx / photoCropRenderHeightPx) * photoCropImageHeight;
    const safeSourceWidth = Math.max(1, Math.round(sourceWidth));
    const safeSourceHeight = Math.max(1, Math.round(sourceHeight));
    const outputWidth = Math.min(1600, Math.max(1200, safeSourceWidth));
    const outputHeight = Math.max(120, Math.round((safeSourceHeight / safeSourceWidth) * outputWidth));

    this.setData(
      {
        photoCropCanvasWidthPx: outputWidth,
        photoCropCanvasHeightPx: outputHeight,
      },
      () => {
        wx.nextTick(() => {
          const ctx = wx.createCanvasContext("photoCropCanvas", this);

          ctx.clearRect(0, 0, outputWidth, outputHeight);
          ctx.drawImage(
            photoCropImagePath,
            sourceX,
            sourceY,
            sourceWidth,
            sourceHeight,
            0,
            0,
            outputWidth,
            outputHeight
          );

          ctx.draw(false, () => {
            wx.canvasToTempFilePath(
              {
                canvasId: "photoCropCanvas",
                fileType: "jpg",
                quality: 1,
                x: 0,
                y: 0,
                width: outputWidth,
                height: outputHeight,
                destWidth: outputWidth,
                destHeight: outputHeight,
                success: (result) => {
                  this.setData({
                    photoConfirmImagePath: result.tempFilePath,
                    showPhotoCropSheet: false,
                  });
                  this.showToastMessage("已完成自由裁剪");
                },
                fail: () => {
                  this.showToastMessage("裁剪生成失败，请重试");
                },
              },
              this
            );
          });
        });
      }
    );
  },

  closePhotoRecognitionSetup() {
    this.clearAutoPlayTimer();
    this.stopSpeechPlayback();
    this.setPhotoSetupState({
      activeView: "dictate",
      photoSetupImagePath: "",
      photoSetupInput: "",
      photoSetupAutoPlay: false,
      photoSetupOcrStatus: "idle",
      photoSetupOcrMessage: "裁剪后的教材内容会先进行 OCR 识别，再写入下方可编辑文本框。",
      photoSetupOcrProvider: "",
    });
  },

  handlePhotoSetupInput(event) {
    const photoSetupInput = event.detail.value;

    this.setPhotoSetupState({
      photoSetupInput,
    });
  },

  handleSpeechRateChange(event) {
    const selectedSpeechRateIndex = Number(event.detail.value);

    this.setData({ selectedSpeechRateIndex });
    this.showToastMessage(`语速已设为${getSpeechRateLabel(selectedSpeechRateIndex)}`);
  },

  handlePhotoSetupAutoPlayChange(event) {
    this.setData({
      photoSetupAutoPlay: Boolean(event.detail.value),
    });
  },

  async restartPhotoDictationFromSetup() {
    this.setPhotoSetupState({
      activeView: "dictate",
      photoSetupImagePath: "",
      photoSetupInput: "",
      photoSetupAutoPlay: false,
      photoSetupOcrStatus: "idle",
      photoSetupOcrMessage: "裁剪后的教材内容会先进行 OCR 识别，再写入下方可编辑文本框。",
      photoSetupOcrProvider: "",
    });

    await this.startPhotoDictationFlow();
  },

  startPhotoDictationFromSetup() {
    if (this.data.photoSetupOcrStatus === "loading") {
      this.showToastMessage("OCR 识别中，请稍候");
      return;
    }

    const playerItems = splitDictationInput(this.data.photoSetupInput || "");

    if (!playerItems.length) {
      this.showToastMessage("请先确认至少一条可默写内容");
      return;
    }

    logOcrDebug("photo-dictation-user-confirmed", {
      provider: this.data.photoSetupOcrProvider || getPhotoDictationProviderName(),
      finalText: this.data.photoSetupInput,
      success: true,
      count: playerItems.length,
    });

    this.enterPlayerWithItems(playerItems, {
      autoPlay: this.data.photoSetupAutoPlay,
      successMessage: `已确认 ${playerItems.length} 条内容，开始默写`,
    });
  },

  async finishPhotoDictation() {
    const imagePath = this.data.photoConfirmImagePath;

    if (!imagePath) {
      this.showToastMessage("当前没有可用的照片");
      return;
    }

    this.openPhotoRecognitionSetup(imagePath);
    await this.performPhotoSetupOcr(imagePath);
  },

  openPasteModal() {
    this.setData({
      showPasteModal: true,
      pasteInput: this.data.pasteInput,
    });
  },

  closePasteModal() {
    this.setData({ showPasteModal: false });
  },

  handlePasteInput(event) {
    this.setData({ pasteInput: event.detail.value });
  },

  chooseCorrectionImage() {
    wx.chooseImage({
      count: 1,
      sizeType: ["compressed"],
      sourceType: ["camera", "album"],
      success: (result) => {
        const imagePath = result?.tempFilePaths?.[0];

        if (!imagePath) {
          this.showToastMessage("没有读取到图片，请重试");
          return;
        }

        const correctionSummary = buildCorrectionSummaryData(this.data.lastTaskItems);

        this.setData({
          activeView: "grade",
          correctionImagePath: imagePath,
          correctionRecognizedItems: [],
          correctionResult: null,
          correctionBusy: false,
          correctionWrongItemsAdded: false,
          ...correctionSummary,
        });
      },
      fail: (error) => {
        if (error?.errMsg?.includes("cancel")) {
          return;
        }

        this.showToastMessage("选图失败，请检查相册或相机权限");
      },
    });
  },

  async runCorrection() {
    if (!this.data.correctionImagePath) {
      this.showToastMessage("请先上传一张默写照片");
      return;
    }

    const correctionExpectedItems = getCorrectionBaseItems(this.data.lastTaskItems);

    this.setData({
      correctionBusy: true,
      correctionExpectedItems,
      correctionSourceTitle: getCorrectionSourceTitle(this.data.lastTaskItems.length > 0),
      correctionSourcePreview: getCorrectionSourcePreview(this.data.lastTaskItems),
    });

    wx.showLoading({
      title: "AI 批改中",
      mask: true,
    });

    try {
      const ocrResult = await recognizeCorrection({
        imagePath: this.data.correctionImagePath,
        expectedItems: correctionExpectedItems,
      });
      const correctionRecognizedItems = ocrResult.items || [];
      const correctionResult = compareWithExpected({
        expectedItems: correctionExpectedItems,
        recognizedItems: correctionRecognizedItems,
      });
      const recentCorrection = buildCorrectionHistoryRecord(correctionResult);

      this.setData({
        activeView: "result",
        correctionBusy: false,
        correctionRecognizedItems,
        correctionResult,
        correctionWrongItemsAdded: false,
        recentCorrection,
      });

      if (ocrResult.warningMessage) {
        this.showToastMessage(ocrResult.warningMessage);
      } else {
        this.showToastMessage(`批改完成：${correctionResult.correctCount} 对 ${correctionResult.totalCount} 题`);
      }
    } catch (error) {
      this.setData({ correctionBusy: false });
      this.showToastMessage(error?.message || "批改失败，请稍后再试");
    } finally {
      wx.hideLoading();
    }
  },

  startDictation() {
    const playerItems = splitDictationInput(this.data.pasteInput);

    if (!playerItems.length) {
      this.showToastMessage("请先输入至少一条可拆分的听写内容");
      return;
    }

    this.enterPlayerWithItems(playerItems, {
      autoPlay: false,
      successMessage: `已创建 ${playerItems.length} 条自动识别任务`,
    });
  },

  exitPlayer() {
    this.clearAutoPlayTimer();
    this.stopSpeechPlayback();
    this.setData({
      activeView: "dictate",
      revealed: false,
      autoPlayEnabled: false,
    });
  },

  updatePlayerWord(index) {
    const playerItems = this.data.playerItems;
    const safeIndex = Math.max(0, Math.min(index, playerItems.length - 1));
    const currentItem = playerItems[safeIndex];

    this.setData({
      currentPlayerIndex: safeIndex,
      currentPlayerDisplay: safeIndex + 1,
      playerWord: currentItem.text,
      playerCardLabel: getPlayerCardLabel(currentItem.language),
      revealed: false,
    });
  },

  prevWord() {
    this.stopSpeechPlayback();

    if (this.data.currentPlayerIndex === 0) {
      this.showToastMessage("这是第一个词哦！");
      return;
    }

    this.updatePlayerWord(this.data.currentPlayerIndex - 1);

    if (this.data.autoPlayEnabled) {
      this.playCurrentWord();
    }
  },

  nextWord() {
    this.stopSpeechPlayback();

    if (this.data.currentPlayerIndex >= this.data.playerItems.length - 1) {
      this.setData({ autoPlayEnabled: false });
      this.clearAutoPlayTimer();
      this.showToastMessage("已经是当前任务的最后一条了");
      return;
    }

    this.updatePlayerWord(this.data.currentPlayerIndex + 1);

    if (this.data.autoPlayEnabled) {
      this.playCurrentWord();
    }
  },

  toggleReveal() {
    this.setData({ revealed: !this.data.revealed });
  },

  playCurrentWord() {
    const currentItem = this.data.playerItems[this.data.currentPlayerIndex];

    if (!currentItem) {
      this.showToastMessage("当前还没有可播放的内容");
      return;
    }

    this.clearAutoPlayTimer();
    this.stopSpeechPlayback();

    const speechSegments = splitSpeechContent(currentItem.text, currentItem.language);

    if (!speechSegments.length) {
      this.showToastMessage("当前内容暂时无法朗读");
      return;
    }

    const speechSession = this.activeSpeechSession;
    this.playSpeechSegment(speechSegments, getSpeechLangCode(currentItem.language), speechSession, 0);
  },

  scheduleAutoPlay() {
    this.clearAutoPlayTimer();

    if (!this.data.autoPlayEnabled) {
      return;
    }

    const interval = INTERVAL_SECONDS[this.data.selectedIntervalIndex] * 1000;

    this.autoPlayTimer = setTimeout(() => {
      if (this.data.currentPlayerIndex >= this.data.playerItems.length - 1) {
        this.setData({ autoPlayEnabled: false });
        this.showToastMessage("自动播放已完成");
        return;
      }

      this.updatePlayerWord(this.data.currentPlayerIndex + 1);
      this.playCurrentWord();
    }, interval);
  },

  handleIntervalChange(event) {
    const selectedIntervalIndex = Number(event.detail.value);
    this.setData({ selectedIntervalIndex });
    this.showToastMessage(`播放间隔已设为 ${this.data.intervalOptions[selectedIntervalIndex]}`);

    if (this.data.autoPlayEnabled) {
      this.playCurrentWord();
    }
  },

  toggleAutoPlay() {
    const autoPlayEnabled = !this.data.autoPlayEnabled;
    this.setData({ autoPlayEnabled });

    if (autoPlayEnabled) {
      this.showToastMessage(`已开启自动播放（${INTERVAL_SECONDS[this.data.selectedIntervalIndex]} 秒）`);
      this.playCurrentWord();
      return;
    }

    this.clearAutoPlayTimer();
    this.stopSpeechPlayback();
    this.showToastMessage("已关闭自动播放");
  },

  handleSaveProgress() {
    this.showToastMessage("阶段 2 先保留保存进度入口 UI");
  },

  addWrongItemsToBook() {
    const correctionResult = this.data.correctionResult;

    if (!correctionResult || !correctionResult.wrongCount) {
      this.showToastMessage("当前没有可加入错题本的错误项");
      return;
    }

    if (this.data.correctionWrongItemsAdded) {
      this.showToastMessage("本次错误项已经加入错题本");
      return;
    }

    const wrongBookEntries = buildWrongBookEntries(correctionResult);

    if (!wrongBookEntries.length) {
      this.showToastMessage("当前没有新的错误项");
      return;
    }

    MISTAKE_ITEMS.unshift(...wrongBookEntries);

    this.syncMistakeFilter(this.data.activeMistakeFilter, {
      correctionWrongItemsAdded: true,
    });

    this.showToastMessage(`已加入 ${wrongBookEntries.length} 条错题`);
  },

  openMistakeBook() {
    this.syncMistakeFilter(this.data.activeMistakeFilter, {
      activeView: "mistakes",
    });
  },

  restartCorrection() {
    this.setData({
      activeView: "grade",
      correctionResult: null,
      correctionRecognizedItems: [],
      correctionWrongItemsAdded: false,
    });
  },

  openAiModal() {
    this.setData({ showAiModal: true });
  },

  closeAiModal() {
    this.setData({ showAiModal: false });
  },

  handleAiAction(event) {
    const { action } = event.currentTarget.dataset;

    if (action === "generate") {
      this.setData({
        showAiModal: false,
        showPasteModal: true,
        pasteInput: GENERATED_PASTE_INPUT,
      });
      this.showToastMessage("已生成自动识别的混合语言 mock 内容");
      return;
    }

    const analysisPreset = buildAnalysisPreset(splitDictationInput(this.data.pasteInput || PASTE_PLACEHOLDER));

    this.setData({
      showAiModal: false,
      showAnalysisSheet: true,
      analysisTitle: analysisPreset.title,
      analysisSubtitle: analysisPreset.subtitle,
      analysisActionText: analysisPreset.actionText,
      analysisItems: analysisPreset.items,
    });
  },

  setMistakeFilter(event) {
    const { filter } = event.currentTarget.dataset;
    this.syncMistakeFilter(filter);
  },

  closeAnalysisSheet() {
    this.setData({ showAnalysisSheet: false });
  },

  handleReviewPlay() {
    this.showToastMessage("阶段 2 先保留复习入口 UI");
  },
});
