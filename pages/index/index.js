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

const SUBJECT_OPTIONS = [
  { key: "zh", label: "语文" },
  { key: "en", label: "英语" },
];

const MODE_DEFINITIONS = [
  {
    key: "phrase",
    label: "词语",
    desc: "语文词语",
    supportsZh: true,
    supportsEn: false,
  },
  {
    key: "word",
    label: "单词",
    desc: "英语单词",
    supportsZh: false,
    supportsEn: true,
  },
  {
    key: "sentence",
    label: "短句",
    desc: "英语短句",
    supportsZh: false,
    supportsEn: true,
  },
];

const TASK_CONFIGS = {
  zh: {
    phrase: {
      placeholder: "例如：\n蜿蜒\n环境\n春意盎然",
      sampleInput: "蜿蜒 环境\n春意盎然\n专心致志",
      generatedInput: "犹豫不决\n蜿蜒曲折\n春意盎然\n专心致志\n不知所措",
      playerLabel: "当前听写词语",
    },
  },
  en: {
    word: {
      placeholder: "例如：\nApple\nBanana\nEnvironment",
      sampleInput: "Apple Banana\nEnvironment\nBeautiful",
      generatedInput: "Vocabulary\nEnvironment\nBeautiful\nAwkward\nHesitate",
      playerLabel: "当前听写单词",
    },
    sentence: {
      placeholder: "例如：\nI go to school.\nShe reads every day.\nThe sun is warm.",
      sampleInput: "I go to school.\nShe reads every day.\nThe sun is warm.",
      generatedInput: "I can finish my dictation.\nShe reads English every night.\nWe practice after dinner.",
      playerLabel: "当前听写短句",
    },
  },
};

const ANALYSIS_PRESETS = {
  zh: {
    generic: {
      title: "语文薄弱点分析",
      subtitle: "Mock 结果：最近更容易在字形辨认和偏旁位置上出错。",
      actionText: "继续生成语文词语任务",
      items: [
        {
          title: "形近字混淆",
          desc: "“蜿蜒 / 碗延”这类字形接近的词，仍然是当前高频错误点。",
        },
        {
          title: "偏旁定位不稳",
          desc: "虫字旁、言字旁这类细节容易漏写，建议优先复习高频偏旁。",
        },
        {
          title: "长词连续书写易断",
          desc: "四字词语在听写时容易漏掉中间字，建议分节奏重复播报。",
        },
      ],
    },
  },
  en: {
    generic: {
      title: "英语薄弱点分析",
      subtitle: "Mock 结果：当前主要问题集中在拼写细节和句子停顿节奏。",
      actionText: "继续生成英语任务",
      items: [
        {
          title: "元音字母易混",
          desc: "environment、beautiful 这类词的元音组合仍然最容易写错。",
        },
        {
          title: "词尾细节缺失",
          desc: "复数、过去式和第三人称单数的词尾遗漏比较常见。",
        },
        {
          title: "短句标点与大小写不稳",
          desc: "句首大写和句尾句号容易漏掉，短句模式要单独提醒。",
        },
      ],
    },
    word: {
      title: "英语单词薄弱点分析",
      subtitle: "Mock 结果：单词听写更容易卡在拼写顺序和词尾变化。",
      actionText: "继续生成英语单词任务",
      items: [
        {
          title: "长单词顺序混乱",
          desc: "environment、vocabulary 这类词在中间字母顺序上最容易出错。",
        },
        {
          title: "词尾书写不完整",
          desc: "beautiful、careful 这类词常漏写 -ful、-tion 等结尾结构。",
        },
        {
          title: "重复听写后正确率提升明显",
          desc: "单词模式适合开启自动播放，控制稳定节奏后表现更好。",
        },
      ],
    },
    sentence: {
      title: "英语短句薄弱点分析",
      subtitle: "Mock 结果：短句整体能跟上，但句首大小写和停顿记忆还不稳定。",
      actionText: "继续生成英语短句任务",
      items: [
        {
          title: "句首大写容易漏掉",
          desc: "进入书写阶段后，常把句首字母直接写成小写。",
        },
        {
          title: "按空格记忆优于整句记忆",
          desc: "建议保持“每行一条”的短句模式，不要再拆成单词模式。",
        },
        {
          title: "句尾标点感知偏弱",
          desc: "短句结束后补句号的意识还不够，需要在复习时重复提醒。",
        },
      ],
    },
  },
};

function getSubjectLabel(subject) {
  const target = SUBJECT_OPTIONS.find((item) => item.key === subject);
  return target ? target.label : "语文";
}

function getModeLabel(mode) {
  const target = MODE_DEFINITIONS.find((item) => item.key === mode);
  return target ? target.label : "";
}

function isModeSupported(subject, mode) {
  const target = MODE_DEFINITIONS.find((item) => item.key === mode);

  if (!target) {
    return false;
  }

  return subject === "zh" ? target.supportsZh : target.supportsEn;
}

function buildSubjectOptions(currentSubject) {
  return SUBJECT_OPTIONS.map((item) => ({
    ...item,
    active: item.key === currentSubject,
  }));
}

function buildModeOptions(currentSubject, selectedMode) {
  return MODE_DEFINITIONS.map((item) => {
    const disabled = !isModeSupported(currentSubject, item.key);

    return {
      ...item,
      disabled,
      active: !disabled && item.key === selectedMode,
    };
  });
}

function getTaskConfig(subject, mode) {
  return TASK_CONFIGS[subject] && TASK_CONFIGS[subject][mode] ? TASK_CONFIGS[subject][mode] : null;
}

function getSplitRuleText(subject, mode) {
  if (!mode) {
    return `请先选择${getSubjectLabel(subject)}任务模式，再粘贴需要听写的内容。`;
  }

  if (mode === "sentence") {
    return "短句模式按每行一条拆分，不按空格拆。";
  }

  return `${getModeLabel(mode)}模式按空格或换行拆分。`;
}

function splitInputByMode(input, mode) {
  if (!input.trim()) {
    return [];
  }

  if (mode === "sentence") {
    return input
      .split(/\n+/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return input
    .split(/[\s,，]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function getAnalysisPreset(subject, mode) {
  const subjectPreset = ANALYSIS_PRESETS[subject];

  if (!subjectPreset) {
    return ANALYSIS_PRESETS.zh.generic;
  }

  if (mode && subjectPreset[mode]) {
    return subjectPreset[mode];
  }

  return subjectPreset.generic;
}

Page({
  data: {
    icons: ICONS,
    statusBarHeight: 20,
    subjectOptions: buildSubjectOptions("zh"),
    modeOptions: buildModeOptions("zh", ""),
    activeView: "dictate",
    currentSubject: "zh",
    currentSubjectLabel: "语文",
    selectedMode: "",
    selectedModeLabel: "请选择模式",
    taskSummaryText: "语文 · 请选择模式",
    showPasteModal: false,
    showAiModal: false,
    showAnalysisSheet: false,
    showToast: false,
    toastMessage: "提示",
    pasteInput: "",
    pastePlaceholder: "请先选择语文任务模式，再粘贴需要听写的内容。",
    splitRuleText: "请先选择语文任务模式，再粘贴需要听写的内容。",
    playerWords: [],
    playerWord: "",
    currentPlayerIndex: 0,
    currentPlayerDisplay: 0,
    playerTotalCount: 0,
    playerCardLabel: "当前听写内容",
    playerTaskMeta: "请选择学科与模式",
    revealed: false,
    autoPlayEnabled: false,
    intervalOptions: ["3秒", "5秒", "8秒", "10秒"],
    selectedIntervalIndex: 1,
    reviewTarget: 8,
    analysisTitle: "",
    analysisSubtitle: "",
    analysisActionText: "",
    analysisItems: [],
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

  syncSelectionState(subject = this.data.currentSubject, selectedMode = this.data.selectedMode, extraData = {}) {
    const safeMode = isModeSupported(subject, selectedMode) ? selectedMode : "";
    const subjectLabel = getSubjectLabel(subject);
    const modeLabel = safeMode ? getModeLabel(safeMode) : "请选择模式";
    const taskConfig = getTaskConfig(subject, safeMode);

    this.setData({
      currentSubject: subject,
      currentSubjectLabel: subjectLabel,
      selectedMode: safeMode,
      selectedModeLabel: modeLabel,
      taskSummaryText: `${subjectLabel} · ${modeLabel}`,
      pastePlaceholder: taskConfig
        ? taskConfig.placeholder
        : `请先选择${subjectLabel}任务模式，再粘贴需要听写的内容。`,
      splitRuleText: getSplitRuleText(subject, safeMode),
      subjectOptions: buildSubjectOptions(subject),
      modeOptions: buildModeOptions(subject, safeMode),
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

  setSubject(event) {
    const { subject } = event.currentTarget.dataset;
    const keepMode = isModeSupported(subject, this.data.selectedMode) ? this.data.selectedMode : "";
    const taskConfig = getTaskConfig(subject, keepMode);
    const nextInput = keepMode
      ? this.data.pasteInput || taskConfig.sampleInput
      : "";

    this.syncSelectionState(subject, keepMode, {
      pasteInput: nextInput,
    });
    this.showToastMessage(
      keepMode ? `已切换为 ${getSubjectLabel(subject)}` : `已切换为 ${getSubjectLabel(subject)}，请继续选择模式`
    );
  },

  selectMode(event) {
    const { mode } = event.currentTarget.dataset;

    if (!isModeSupported(this.data.currentSubject, mode)) {
      this.showToastMessage("当前学科暂不支持这个模式");
      return;
    }

    const taskConfig = getTaskConfig(this.data.currentSubject, mode);

    this.syncSelectionState(this.data.currentSubject, mode, {
      pasteInput: this.data.pasteInput || taskConfig.sampleInput,
    });
    this.showToastMessage(`已选择 ${getModeLabel(mode)} 模式`);
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
    const taskConfig = getTaskConfig(this.data.currentSubject, this.data.selectedMode);

    this.syncSelectionState(this.data.currentSubject, this.data.selectedMode, {
      showPasteModal: true,
      pasteInput: this.data.pasteInput || (taskConfig ? taskConfig.sampleInput : ""),
    });
  },

  closePasteModal() {
    this.setData({ showPasteModal: false });
  },

  handlePasteInput(event) {
    this.setData({ pasteInput: event.detail.value });
  },

  startDictation() {
    if (!this.data.selectedMode) {
      this.showToastMessage("开始前请先明确选择任务模式");
      return;
    }

    const words = splitInputByMode(this.data.pasteInput, this.data.selectedMode);

    if (!words.length) {
      this.showToastMessage("请先输入至少一条可拆分的听写内容");
      return;
    }

    const taskConfig = getTaskConfig(this.data.currentSubject, this.data.selectedMode);

    this.clearAutoPlayTimer();

    this.setData({
      activeView: "player",
      showPasteModal: false,
      playerWords: words,
      playerWord: words[0],
      currentPlayerIndex: 0,
      currentPlayerDisplay: 1,
      playerTotalCount: words.length,
      playerCardLabel: taskConfig.playerLabel,
      playerTaskMeta: `${this.data.currentSubjectLabel} · ${this.data.selectedModeLabel}`,
      revealed: false,
      autoPlayEnabled: false,
      selectedIntervalIndex: 1,
    });

    this.showToastMessage(`已创建 ${this.data.currentSubjectLabel}${this.data.selectedModeLabel}任务`);
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
    const words = this.data.playerWords;
    const safeIndex = Math.max(0, Math.min(index, words.length - 1));

    this.setData({
      currentPlayerIndex: safeIndex,
      currentPlayerDisplay: safeIndex + 1,
      playerWord: words[safeIndex],
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
    if (this.data.currentPlayerIndex >= this.data.playerWords.length - 1) {
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
    if (!this.data.playerWord) {
      this.showToastMessage("当前还没有可播放的内容");
      return;
    }

    this.clearAutoPlayTimer();
    this.showToastMessage(`Mock 播报：${this.data.playerWord}`);

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
      if (this.data.currentPlayerIndex >= this.data.playerWords.length - 1) {
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
      if (!this.data.selectedMode) {
        this.setData({
          showAiModal: false,
          showPasteModal: true,
        });
        this.showToastMessage("请先明确选择学科和模式，再生成 mock 内容");
        return;
      }

      const taskConfig = getTaskConfig(this.data.currentSubject, this.data.selectedMode);

      this.syncSelectionState(this.data.currentSubject, this.data.selectedMode, {
        showAiModal: false,
        showPasteModal: true,
        pasteInput: taskConfig.generatedInput,
      });
      this.showToastMessage(`已生成 ${this.data.currentSubjectLabel}${this.data.selectedModeLabel} mock 内容`);
      return;
    }

    const analysisPreset = getAnalysisPreset(this.data.currentSubject, this.data.selectedMode);

    this.setData({
      showAiModal: false,
      showAnalysisSheet: true,
      analysisTitle: analysisPreset.title,
      analysisSubtitle: analysisPreset.subtitle,
      analysisActionText: analysisPreset.actionText,
      analysisItems: analysisPreset.items,
    });
  },

  closeAnalysisSheet() {
    this.setData({ showAnalysisSheet: false });
  },

  handleReviewPlay() {
    this.showToastMessage("阶段 2 先保留复习入口 UI");
  },
});
