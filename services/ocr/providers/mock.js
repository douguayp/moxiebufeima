const { runMockOcr, runMockPhotoDictationOcr } = require("../../correction/mock");

async function recognizePhotoDictation({ imagePath }) {
  const result = await runMockPhotoDictationOcr({ imagePath });

  return {
    provider: "mock",
    result,
  };
}

async function recognizeCorrection({ imagePath, expectedItems }) {
  const result = await runMockOcr({
    imagePath,
    expectedItems,
  });

  return {
    provider: "mock",
    result,
  };
}

module.exports = {
  recognizeCorrection,
  recognizePhotoDictation,
};
