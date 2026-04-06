function createOcrError(code, message, extra = {}) {
  const error = new Error(message);
  error.code = code;
  return Object.assign(error, extra);
}

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

function pickLineText(line) {
  if (!line && line !== 0) {
    return "";
  }

  if (typeof line === "string") {
    return line;
  }

  if (typeof line === "number") {
    return String(line);
  }

  return (
    line.text ||
    line.ocr_text ||
    line.words ||
    line.word ||
    line.content ||
    line.label ||
    line.value ||
    line.result ||
    line.recognizedText ||
    ""
  );
}

function pickLinePosition(line) {
  const position = line?.pos || line?.position || line?.location || {};
  const leftTop =
    position.left_top ||
    position.leftTop ||
    position.lt || {
      x: position.left || position.x || 0,
      y: position.top || position.y || 0,
    };
  const rightBottom =
    position.right_bottom ||
    position.rightBottom ||
    position.rb || {
      x: position.right || leftTop.x,
      y: position.bottom || leftTop.y,
    };

  return {
    left: Number(leftTop.x || 0),
    top: Number(leftTop.y || 0),
    height: Math.max(0, Number(rightBottom.y || 0) - Number(leftTop.y || 0)),
  };
}

function cleanRecognizedText(text) {
  return String(text || "")
    .replace(/\r/g, "\n")
    .split(/\n+/)
    .map((item) => item.replace(/[ \t]+/g, " ").trim())
    .filter(Boolean);
}

function collectLineCandidates(result) {
  if (!result) {
    return [];
  }

  if (Array.isArray(result)) {
    return result;
  }

  const directKeys = [
    "lines",
    "items",
    "words_result",
    "wordsResult",
    "result",
    "data",
    "recognition",
    "ocrResult",
    "payload",
  ];

  for (let index = 0; index < directKeys.length; index += 1) {
    const candidate = result[directKeys[index]];

    if (!candidate) {
      continue;
    }

    if (Array.isArray(candidate)) {
      return candidate;
    }

    if (typeof candidate === "object") {
      const nested = collectLineCandidates(candidate);

      if (nested.length) {
        return nested;
      }
    }
  }

  const textCandidate =
    result.text ||
    result.content ||
    result.resultText ||
    result.ocrText ||
    result.result;

  if (typeof textCandidate === "string") {
    return textCandidate
      .split(/\n+/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function normalizeRecognizedItems(result) {
  const lineCandidates = collectLineCandidates(result);
  const normalizedItems = [];

  lineCandidates.forEach((line, index) => {
    const textLines = cleanRecognizedText(pickLineText(line));

    if (!textLines.length) {
      return;
    }

    const position = pickLinePosition(line);

    textLines.forEach((text, lineIndex) => {
      normalizedItems.push({
        id: line?.id || `recognized-${index}-${lineIndex}`,
        text,
        language: line?.language || detectLanguage(text),
        _sortTop: position.top + lineIndex * Math.max(position.height || 24, 24),
        _sortLeft: position.left,
        _sortHeight: position.height,
      });
    });
  });

  normalizedItems.sort((leftItem, rightItem) => {
    const rowThreshold = Math.max(
      18,
      Math.min(leftItem._sortHeight || 24, rightItem._sortHeight || 24) * 0.55
    );

    if (Math.abs(leftItem._sortTop - rightItem._sortTop) <= rowThreshold) {
      return leftItem._sortLeft - rightItem._sortLeft;
    }

    return leftItem._sortTop - rightItem._sortTop;
  });

  return normalizedItems.map((item) => ({
    id: item.id,
    text: item.text,
    language: item.language,
  }));
}

module.exports = {
  createOcrError,
  detectLanguage,
  normalizeRecognizedItems,
};
