const MOCK_STANDARD_ITEMS = [
  { id: "mock-zh-1", text: "蜿蜒", language: "zh" },
  { id: "mock-en-1", text: "Environment", language: "en" },
  { id: "mock-zh-2", text: "春意盎然", language: "zh" },
  { id: "mock-en-2", text: "beautiful", language: "en" },
];

const MOCK_PHOTO_DICTATION_ITEMS = [
  { id: "photo-ocr-1", text: "under", language: "en" },
  { id: "photo-ocr-2", text: "excited", language: "en" },
  { id: "photo-ocr-3", text: "clap my hands", language: "en" },
  { id: "photo-ocr-4", text: "find my doll", language: "en" },
];

function detectLanguage(text) {
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

function wait(duration = 650) {
  return new Promise((resolve) => {
    setTimeout(resolve, duration);
  });
}

function getFallbackTaskItems() {
  return MOCK_STANDARD_ITEMS.map((item, index) => ({
    id: item.id || `fallback-${index}`,
    text: item.text,
    language: item.language || detectLanguage(item.text),
  }));
}

function normalizeExpectedItems(expectedItems = []) {
  const safeItems = expectedItems.length ? expectedItems : getFallbackTaskItems();

  return safeItems.map((item, index) => ({
    id: item.id || `expected-${index}`,
    text: (item.text || "").trim(),
    language: item.language || detectLanguage(item.text || ""),
  }));
}

function mutateEnglishWord(text) {
  const normalized = text.trim();

  if (normalized.length <= 3) {
    return `${normalized}s`;
  }

  const removableIndex = normalized.search(/[aeiou]/i);

  if (removableIndex > 0 && removableIndex < normalized.length - 1) {
    return `${normalized.slice(0, removableIndex)}${normalized.slice(removableIndex + 1)}`;
  }

  return `${normalized.slice(0, -1)}${normalized.slice(-1).toLowerCase()}`;
}

function mutateChineseWord(text) {
  const normalized = text.trim();

  if (normalized.length <= 1) {
    return `${normalized}一`;
  }

  const chars = normalized.split("");
  const lastIndex = chars.length - 1;
  const previousIndex = chars.length - 2;
  const swapped = [...chars];
  swapped[previousIndex] = chars[lastIndex];
  swapped[lastIndex] = chars[previousIndex];
  return swapped.join("");
}

function mutateMixedText(text) {
  return text
    .trim()
    .split(/\s+/)
    .reverse()
    .join(" ");
}

function buildMockRecognizedText(item, index, totalCount) {
  const shouldBeWrong = totalCount > 1 && index % 3 === 1;

  if (!shouldBeWrong) {
    return item.text;
  }

  if (item.language === "en") {
    return mutateEnglishWord(item.text);
  }

  if (item.language === "mixed") {
    return mutateMixedText(item.text);
  }

  return mutateChineseWord(item.text);
}

async function runMockOcr({ imagePath, expectedItems }) {
  await wait();

  const normalizedItems = normalizeExpectedItems(expectedItems);

  return {
    imagePath,
    lines: normalizedItems.map((item, index) => ({
      id: item.id,
      text: buildMockRecognizedText(item, index, normalizedItems.length),
      language: item.language,
    })),
  };
}

async function runMockPhotoDictationOcr({ imagePath }) {
  await wait(520);

  const normalizedItems = MOCK_PHOTO_DICTATION_ITEMS.map((item, index) => ({
    id: item.id || `photo-dictation-${index}`,
    text: item.text,
    language: item.language || detectLanguage(item.text),
  }));

  return {
    imagePath,
    lines: normalizedItems.map((item) => ({
      id: item.id,
      text: item.text,
      language: item.language,
    })),
  };
}

function splitRecognizedContent(ocrResult) {
  const lines = ocrResult?.lines || [];

  return lines.map((line, index) => ({
    id: line.id || `recognized-${index}`,
    text: (line.text || "").trim(),
    language: line.language || detectLanguage(line.text || ""),
  }));
}

function normalizeCompareText(text, language) {
  const normalized = (text || "").trim();

  if (language === "en") {
    return normalized.toLowerCase();
  }

  return normalized;
}

function getDetailTip(language, correct) {
  if (correct) {
    return "识别结果与标准答案一致";
  }

  if (language === "en") {
    return "请再检查英文拼写和字母顺序";
  }

  if (language === "mixed") {
    return "请分别检查中文词义和英文拼写";
  }

  return "请再检查字形、偏旁和书写顺序";
}

function compareWithExpected({ expectedItems, recognizedItems }) {
  const normalizedExpected = normalizeExpectedItems(expectedItems);
  const normalizedRecognized = recognizedItems || [];

  const details = normalizedExpected.map((expectedItem, index) => {
    const recognizedItem = normalizedRecognized[index] || {
      id: `recognized-missing-${index}`,
      text: "",
      language: expectedItem.language,
    };

    const correct =
      normalizeCompareText(expectedItem.text, expectedItem.language) ===
      normalizeCompareText(recognizedItem.text, expectedItem.language);

    return {
      id: `detail-${index}`,
      index: index + 1,
      language: expectedItem.language,
      expectedText: expectedItem.text,
      recognizedText: recognizedItem.text || "未识别到内容",
      correct,
      tip: getDetailTip(expectedItem.language, correct),
    };
  });

  const correctCount = details.filter((item) => item.correct).length;
  const wrongCount = details.length - correctCount;
  const accuracy = details.length ? Math.round((correctCount / details.length) * 100) : 0;

  return {
    totalCount: details.length,
    correctCount,
    wrongCount,
    accuracy,
    details,
  };
}

function buildWrongBookEntries(comparison) {
  const wrongDetails = (comparison?.details || []).filter((item) => !item.correct);

  return wrongDetails.map((item, index) => ({
    id: `wrong-book-${Date.now()}-${index}`,
    subject: item.language === "en" ? "en" : "zh",
    badge: index === 0 ? "新增错题" : "",
    word: item.expectedText,
    phonetic: "",
    wrong: item.recognizedText,
    tip: item.tip,
  }));
}

function buildCorrectionHistoryRecord(comparison) {
  return {
    score: String(comparison.accuracy),
    title: "最近一次 AI 批改",
    meta: `${comparison.correctCount} 对 / ${comparison.totalCount} 题`,
  };
}

module.exports = {
  buildCorrectionHistoryRecord,
  buildWrongBookEntries,
  compareWithExpected,
  getFallbackTaskItems,
  runMockOcr,
  runMockPhotoDictationOcr,
  splitRecognizedContent,
};
