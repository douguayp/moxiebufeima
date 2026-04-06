const cloud = require("wx-server-sdk");

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
});

function buildResponse(ok, payload = {}) {
  return {
    ok,
    ...payload,
  };
}

function buildUrlPayloads(tempUrl) {
  return [
    { img_url: tempUrl },
    { imgUrl: tempUrl },
    { type: "photo", img_url: tempUrl },
    { type: "photo", imgUrl: tempUrl },
  ];
}

async function callPrintedText(tempUrl) {
  const payloadCandidates = buildUrlPayloads(tempUrl);
  let lastError = null;

  for (let index = 0; index < payloadCandidates.length; index += 1) {
    try {
      return await cloud.openapi.ocr.printedText(payloadCandidates[index]);
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError;
}

async function getTempFileURL(fileID) {
  const urlResult = await cloud.getTempFileURL({
    fileList: [fileID],
  });
  const fileInfo = urlResult?.fileList?.[0] || {};

  return fileInfo.tempFileURL || fileInfo.tempFileUrl || "";
}

exports.main = async (event) => {
  const provider = event?.provider || "wechatCommocr";
  const fileID = event?.fileID || "";

  if (provider !== "wechatCommocr") {
    return buildResponse(false, {
      code: "OCR_PROVIDER_NOT_SUPPORTED",
      message: `当前 OCR 云函数暂不支持 provider: ${provider}`,
      scene: event?.scene || "",
    });
  }

  if (!fileID) {
    return buildResponse(false, {
      code: "FILE_ID_REQUIRED",
      message: "OCR 云函数未收到图片文件标识",
      scene: event?.scene || "",
    });
  }

  try {
    const tempUrl = await getTempFileURL(fileID);

    if (!tempUrl) {
      return buildResponse(false, {
        code: "TEMP_URL_EMPTY",
        message: "未能获取 OCR 图片的临时访问地址",
        scene: event?.scene || "",
      });
    }

    const result = await callPrintedText(tempUrl);

    if (result?.errcode && result.errcode !== 0) {
      return buildResponse(false, {
        code: String(result.errcode),
        message: result.errmsg || "微信官方 OCR 调用失败",
        scene: event?.scene || "",
      });
    }

    return buildResponse(true, {
      recognition: result,
      requestId: result?.requestId || result?.request_id || "",
      scene: event?.scene || "",
    });
  } catch (error) {
    return buildResponse(false, {
      code: error?.errCode || error?.code || "OCR_CALL_FAILED",
      message: error?.errMsg || error?.message || "微信官方 OCR 调用失败",
      scene: event?.scene || "",
    });
  } finally {
    if (fileID) {
      try {
        await cloud.deleteFile({
          fileList: [fileID],
        });
      } catch (error) {
        console.warn("delete temp ocr file failed", error);
      }
    }
  }
};
