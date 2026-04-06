const { createOcrError } = require("../shared");

const OCR_WECHAT_PLUGIN_ALIAS_STORAGE_KEY = "ocr_wechat_plugin_alias";
const OCR_WECHAT_PLUGIN_METHOD_STORAGE_KEY = "ocr_wechat_plugin_method";
const DEFAULT_PLUGIN_ALIASES = [
  "ocrPlugin",
  "wechatOcr",
  "WechatOCR",
  "WechatOcr",
  "OCRPlugin",
];
const DEFAULT_PLUGIN_METHODS = [
  "recognizePrintedText",
  "recognizeText",
  "recognize",
  "ocr",
  "detectText",
  "detect",
];
const REQUEST_TIMEOUT_MS = 15000;

function readStorage(key) {
  try {
    return wx.getStorageSync(key) || "";
  } catch (error) {
    console.warn(`read ${key} failed`, error);
    return "";
  }
}

function buildAliasCandidates() {
  const customAlias = readStorage(OCR_WECHAT_PLUGIN_ALIAS_STORAGE_KEY);
  const aliasSet = new Set();

  if (customAlias) {
    aliasSet.add(customAlias);
  }

  DEFAULT_PLUGIN_ALIASES.forEach((alias) => {
    aliasSet.add(alias);
  });

  return Array.from(aliasSet);
}

function buildMethodCandidates() {
  const customMethod = readStorage(OCR_WECHAT_PLUGIN_METHOD_STORAGE_KEY);
  const methodSet = new Set();

  if (customMethod) {
    methodSet.add(customMethod);
  }

  DEFAULT_PLUGIN_METHODS.forEach((methodName) => {
    methodSet.add(methodName);
  });

  return Array.from(methodSet);
}

function loadPlugin() {
  const aliases = buildAliasCandidates();
  let lastError = null;

  for (let index = 0; index < aliases.length; index += 1) {
    const alias = aliases[index];

    try {
      return {
        alias,
        plugin: requirePlugin(alias),
      };
    } catch (error) {
      lastError = error;
    }
  }

  throw createOcrError("PLUGIN_NOT_AVAILABLE", "当前没有可用的微信 OCR 插件声明", {
    cause: lastError,
  });
}

function getTargets(plugin) {
  const targets = [{ label: "plugin", value: plugin }];
  const managerFactories = ["getOcrManager", "getManager", "createOcrManager"];

  managerFactories.forEach((factoryName) => {
    if (typeof plugin[factoryName] !== "function") {
      return;
    }

    try {
      const manager = plugin[factoryName]();

      if (manager && typeof manager === "object") {
        targets.push({
          label: factoryName,
          value: manager,
        });
      }
    } catch (error) {
      console.warn(`create ${factoryName} failed`, error);
    }
  });

  return targets;
}

function callPluginMethod(target, methodName, payload) {
  return new Promise((resolve, reject) => {
    let finished = false;
    const timeoutId = setTimeout(() => {
      if (finished) {
        return;
      }

      finished = true;
      reject(createOcrError("PLUGIN_TIMEOUT", "微信 OCR 插件识别超时"));
    }, REQUEST_TIMEOUT_MS);

    const safeResolve = (value) => {
      if (finished) {
        return;
      }

      finished = true;
      clearTimeout(timeoutId);
      resolve(value);
    };

    const safeReject = (error) => {
      if (finished) {
        return;
      }

      finished = true;
      clearTimeout(timeoutId);
      reject(error);
    };

    try {
      const result = target[methodName]({
        ...payload,
        success: safeResolve,
        fail: (error) => safeReject(createOcrError("PLUGIN_REQUEST_FAILED", "微信 OCR 插件识别失败", { cause: error })),
      });

      if (result && typeof result.then === "function") {
        result.then(safeResolve).catch((error) => {
          safeReject(createOcrError("PLUGIN_REQUEST_FAILED", "微信 OCR 插件识别失败", { cause: error }));
        });
        return;
      }

      if (typeof result !== "undefined") {
        safeResolve(result);
      }
    } catch (error) {
      safeReject(createOcrError("PLUGIN_REQUEST_FAILED", "微信 OCR 插件识别失败", { cause: error }));
    }
  });
}

async function invokePlugin(payload) {
  const { alias, plugin } = loadPlugin();
  const targets = getTargets(plugin);
  const methodCandidates = buildMethodCandidates();
  let lastError = null;

  for (let targetIndex = 0; targetIndex < targets.length; targetIndex += 1) {
    const target = targets[targetIndex];

    for (let methodIndex = 0; methodIndex < methodCandidates.length; methodIndex += 1) {
      const methodName = methodCandidates[methodIndex];

      if (typeof target.value[methodName] !== "function") {
        continue;
      }

      try {
        const result = await callPluginMethod(target.value, methodName, payload);

        return {
          alias,
          methodName,
          target: target.label,
          result,
        };
      } catch (error) {
        lastError = error;
      }
    }
  }

  if (lastError) {
    throw lastError;
  }

  throw createOcrError("PLUGIN_METHOD_NOT_FOUND", "当前微信 OCR 插件没有找到可调用的识别方法");
}

function buildPayload({ imagePath, scene, expectedItems }) {
  return {
    imagePath,
    filePath: imagePath,
    tempFilePath: imagePath,
    path: imagePath,
    scene,
    mode: scene,
    expectedItems,
  };
}

async function recognizeWithPlugin(scene, payload) {
  const invocation = await invokePlugin(buildPayload({
    imagePath: payload.imagePath,
    scene,
    expectedItems: payload.expectedItems,
  }));

  return {
    provider: "wechat-plugin",
    meta: {
      alias: invocation.alias,
      methodName: invocation.methodName,
      target: invocation.target,
    },
    result: invocation.result,
  };
}

async function recognizePhotoDictation({ imagePath }) {
  return recognizeWithPlugin("photo-dictation", { imagePath });
}

async function recognizeCorrection({ imagePath, expectedItems }) {
  return recognizeWithPlugin("correction", { imagePath, expectedItems });
}

module.exports = {
  OCR_WECHAT_PLUGIN_ALIAS_STORAGE_KEY,
  OCR_WECHAT_PLUGIN_METHOD_STORAGE_KEY,
  recognizeCorrection,
  recognizePhotoDictation,
};
