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

const PASTE_PLACEHOLDER = "例如：\n苹果 Apple 蜿蜒 Environment\nI go to school.\n春意盎然";
const DEFAULT_PASTE_INPUT = "苹果 Apple 蜿蜒 Environment\nI go to school.\n春意盎然";
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

Page({
  data: {
    icons: ICONS,
    statusBarHeight: 20,
    activeView: "dictate",
    showPasteModal: false,
    showAiModal: false,
    showAnalysisSheet: false,
    showToast: false,
    toastMessage: "提示",
    pasteInput: "",
    pastePlaceholder: PASTE_PLACEHOLDER,
    playerItems: [],
    playerWord: "",
    currentPlayerIndex: 0,
    currentPlayerDisplay: 0,
    playerTotalCount: 0,
    playerCardLabel: "当前听写内容",
    revealed: false,
    autoPlayEnabled: false,
    intervalOptions: ["3秒", "5秒", "8秒", "10秒"],
    selectedIntervalIndex: 1,
    reviewTarget: 8,
    analysisTitle: "",
    analysisSubtitle: "",
    analysisActionText: "",
    analysisItems: [],
    recentCorrection: RECENT_CORRECTION,
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
  },

  onUnload() {
    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
    }

    this.clearAutoPlayTimer();
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

  switchTab(event) {
    const { view } = event.currentTarget.dataset;
    this.clearAutoPlayTimer();
    this.setData({
      activeView: view,
      autoPlayEnabled: false,
      revealed: false,
    });
  },

  goToReview() {
    this.clearAutoPlayTimer();
    this.setData({ activeView: "review" });
  },

  handleToolTap(event) {
    const { action } = event.currentTarget.dataset;

    if (action === "camera") {
      this.showToastMessage("阶段 2 仍仅保留拍教材入口 UI");
      return;
    }

    if (action === "paste") {
      this.openPasteModal();
      return;
    }

    this.showToastMessage("阶段 2 先保留词句库入口 UI");
  },

  openPasteModal() {
    this.setData({
      showPasteModal: true,
      pasteInput: this.data.pasteInput || DEFAULT_PASTE_INPUT,
    });
  },

  closePasteModal() {
    this.setData({ showPasteModal: false });
  },

  handlePasteInput(event) {
    this.setData({ pasteInput: event.detail.value });
  },

  startDictation() {
    const playerItems = splitDictationInput(this.data.pasteInput);

    if (!playerItems.length) {
      this.showToastMessage("请先输入至少一条可拆分的听写内容");
      return;
    }
    const firstItem = playerItems[0];

    this.clearAutoPlayTimer();

    this.setData({
      activeView: "player",
      showPasteModal: false,
      playerItems,
      playerWord: firstItem.text,
      currentPlayerIndex: 0,
      currentPlayerDisplay: 1,
      playerTotalCount: playerItems.length,
      playerCardLabel: getPlayerCardLabel(firstItem.language),
      revealed: false,
      autoPlayEnabled: false,
      selectedIntervalIndex: 1,
    });

    this.showToastMessage(`已创建 ${playerItems.length} 条自动识别任务`);
  },

  exitPlayer() {
    this.clearAutoPlayTimer();
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
    this.showToastMessage(`Mock ${currentItem.languageLabel}播报：${currentItem.text}`);

    if (this.data.autoPlayEnabled) {
      this.scheduleAutoPlay();
    }
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
        this.showToastMessage("Mock 自动播放已完成");
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
      this.showToastMessage(`已开启 Mock 自动播放（${INTERVAL_SECONDS[this.data.selectedIntervalIndex]} 秒）`);
      this.playCurrentWord();
      return;
    }

    this.clearAutoPlayTimer();
    this.showToastMessage("已关闭自动播放");
  },

  handleSaveProgress() {
    this.showToastMessage("阶段 2 先保留保存进度入口 UI");
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

    const analysisPreset = buildAnalysisPreset(splitDictationInput(this.data.pasteInput || DEFAULT_PASTE_INPUT));

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
