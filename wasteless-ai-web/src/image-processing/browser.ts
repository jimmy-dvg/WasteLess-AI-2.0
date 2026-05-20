"use client";

export type ClientImageProcessingResult = {
  file: File;
  previewUrl: string;
  blurScore: number;
  cropApplied: boolean;
  originalSize: { width: number; height: number };
  processedSize: { width: number; height: number };
  warnings: string[];
};

const MAX_CANVAS_SIDE = 1800;
const JPEG_QUALITY = 0.82;
const CONTENT_PADDING_RATIO = 0.045;

function loadImageFromFile(file: File) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Unable to read image"));
    };
    image.src = url;
  });
}

function getScaledSize(width: number, height: number) {
  const scale = Math.min(1, MAX_CANVAS_SIDE / Math.max(width, height));
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

function estimateBlurScore(imageData: ImageData) {
  const { data, width, height } = imageData;
  const step = 4;
  let total = 0;
  let count = 0;

  for (let y = step; y < height - step; y += step) {
    for (let x = step; x < width - step; x += step) {
      const index = (y * width + x) * 4;
      const left = (y * width + (x - step)) * 4;
      const right = (y * width + (x + step)) * 4;
      const top = ((y - step) * width + x) * 4;
      const bottom = ((y + step) * width + x) * 4;
      const gray = 0.299 * data[index] + 0.587 * data[index + 1] + 0.114 * data[index + 2];
      const laplacian =
        Math.abs(4 * gray - data[left] - data[right] - data[top] - data[bottom]) / 255;
      total += laplacian;
      count += 1;
    }
  }

  return count ? Number((total / count).toFixed(4)) : 0;
}

function getLuminance(data: Uint8ClampedArray, index: number) {
  return 0.299 * data[index] + 0.587 * data[index + 1] + 0.114 * data[index + 2];
}

function estimateBorderLuminance(imageData: ImageData) {
  const { data, width, height } = imageData;
  const step = Math.max(2, Math.floor(Math.min(width, height) / 80));
  let total = 0;
  let count = 0;

  for (let x = 0; x < width; x += step) {
    total += getLuminance(data, x * 4);
    total += getLuminance(data, ((height - 1) * width + x) * 4);
    count += 2;
  }

  for (let y = 0; y < height; y += step) {
    total += getLuminance(data, (y * width) * 4);
    total += getLuminance(data, (y * width + width - 1) * 4);
    count += 2;
  }

  return count ? total / count : 128;
}

function findContentBounds(imageData: ImageData) {
  const { data, width, height } = imageData;
  const border = estimateBorderLuminance(imageData);
  const step = Math.max(3, Math.floor(Math.min(width, height) / 220));
  let minX = width;
  let minY = height;
  let maxX = 0;
  let maxY = 0;
  let hits = 0;

  for (let y = step; y < height - step; y += step) {
    for (let x = step; x < width - step; x += step) {
      const index = (y * width + x) * 4;
      const luminance = getLuminance(data, index);
      const right = getLuminance(data, (y * width + x + step) * 4);
      const bottom = getLuminance(data, ((y + step) * width + x) * 4);
      const gradient = Math.abs(luminance - right) + Math.abs(luminance - bottom);
      const differsFromBorder = Math.abs(luminance - border) > 28;

      if (differsFromBorder || gradient > 42) {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
        hits += 1;
      }
    }
  }

  const imageArea = width * height;
  const contentArea = Math.max(0, maxX - minX) * Math.max(0, maxY - minY);
  const contentRatio = contentArea / imageArea;

  if (hits < 80 || contentRatio < 0.16 || contentRatio > 0.96) {
    return null;
  }

  const padding = Math.round(Math.min(width, height) * CONTENT_PADDING_RATIO);
  return {
    x: Math.max(0, minX - padding),
    y: Math.max(0, minY - padding),
    width: Math.min(width - Math.max(0, minX - padding), maxX - minX + padding * 2),
    height: Math.min(height - Math.max(0, minY - padding), maxY - minY + padding * 2),
  };
}

function enhanceBrightness(imageData: ImageData) {
  const { data } = imageData;
  let total = 0;
  const pixels = data.length / 4;

  for (let index = 0; index < data.length; index += 4) {
    total += 0.299 * data[index] + 0.587 * data[index + 1] + 0.114 * data[index + 2];
  }

  const average = total / pixels;
  const lift = average < 120 ? 28 : average < 155 ? 14 : 0;
  const contrast = average < 130 ? 1.12 : 1.04;

  for (let index = 0; index < data.length; index += 4) {
    data[index] = Math.max(0, Math.min(255, (data[index] - 128) * contrast + 128 + lift));
    data[index + 1] = Math.max(0, Math.min(255, (data[index + 1] - 128) * contrast + 128 + lift));
    data[index + 2] = Math.max(0, Math.min(255, (data[index + 2] - 128) * contrast + 128 + lift));
  }

  return imageData;
}

function canvasToBlob(canvas: HTMLCanvasElement) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Unable to compress image"));
          return;
        }
        resolve(blob);
      },
      "image/jpeg",
      JPEG_QUALITY
    );
  });
}

export async function preprocessReceiptImage(file: File): Promise<ClientImageProcessingResult> {
  const image = await loadImageFromFile(file);
  const size = getScaledSize(image.naturalWidth, image.naturalHeight);
  const sourceCanvas = document.createElement("canvas");
  sourceCanvas.width = size.width;
  sourceCanvas.height = size.height;

  const sourceContext = sourceCanvas.getContext("2d", { willReadFrequently: true });
  if (!sourceContext) throw new Error("Canvas is not available in this browser");

  sourceContext.drawImage(image, 0, 0, size.width, size.height);
  const sourceImageData = sourceContext.getImageData(0, 0, size.width, size.height);
  const bounds = findContentBounds(sourceImageData);
  const canvas = document.createElement("canvas");
  canvas.width = bounds?.width ?? size.width;
  canvas.height = bounds?.height ?? size.height;

  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("Canvas is not available in this browser");

  if (bounds) {
    context.drawImage(
      sourceCanvas,
      bounds.x,
      bounds.y,
      bounds.width,
      bounds.height,
      0,
      0,
      bounds.width,
      bounds.height
    );
  } else {
    context.drawImage(sourceCanvas, 0, 0);
  }

  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  const blurScore = estimateBlurScore(imageData);
  context.putImageData(enhanceBrightness(imageData), 0, 0);
  const blob = await canvasToBlob(canvas);
  const processedFile = new File([blob], file.name.replace(/\.[a-z0-9]+$/i, ".jpg"), {
    type: "image/jpeg",
    lastModified: Date.now(),
  });

  const warnings: string[] = [];
  if (blurScore < 0.018) {
    warnings.push("The image appears blurry. OCR may miss short item names or prices.");
  }

  if (file.size > processedFile.size * 1.4) {
    warnings.push("The image was compressed before upload.");
  }

  if (bounds) {
    warnings.push("The image was auto-cropped around the detected document or product area.");
  }

  return {
    file: processedFile,
    previewUrl: canvas.toDataURL("image/jpeg", 0.8),
    blurScore,
    cropApplied: Boolean(bounds),
    originalSize: {
      width: image.naturalWidth,
      height: image.naturalHeight,
    },
    processedSize: {
      width: canvas.width,
      height: canvas.height,
    },
    warnings,
  };
}

export const preprocessScanImage = preprocessReceiptImage;
