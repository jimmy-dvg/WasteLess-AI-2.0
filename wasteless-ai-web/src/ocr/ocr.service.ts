import "server-only";

import Tesseract from "tesseract.js";
import type { OCRLine, OCRResult } from "@/scanning/types";

let workerPromise: Promise<Tesseract.Worker> | null = null;
let ocrQueue = Promise.resolve();

async function getWorker() {
  if (!workerPromise) {
    workerPromise = Tesseract.createWorker("eng", Tesseract.OEM.LSTM_ONLY).then(async (worker) => {
      await worker.setParameters({
        tessedit_pageseg_mode: Tesseract.PSM.SPARSE_TEXT,
        preserve_interword_spaces: "1",
        user_defined_dpi: "300",
      });
      return worker;
    });
  }

  return workerPromise;
}

function runExclusive<T>(task: () => Promise<T>) {
  const result = ocrQueue.then(task, task);
  ocrQueue = result.then(
    () => undefined,
    () => undefined
  );
  return result;
}

function extractLines(data: Tesseract.Page): OCRLine[] {
  const blocks = data.blocks ?? [];
  return blocks.flatMap((block) =>
    block.paragraphs.flatMap((paragraph) =>
      paragraph.lines
        .map((line) => ({
          text: line.text.trim(),
          confidence: Math.max(0, Math.min(100, line.confidence)) / 100,
          bbox: line.bbox ?? null,
        }))
        .filter((line) => line.text.length > 0)
    )
  );
}

export async function extractTextFromImage(buffer: Buffer): Promise<OCRResult> {
  return runExclusive(async () => {
    const worker = await getWorker();
    const result = await worker.recognize(buffer);
    const rawText = result.data.text.trim();
    const lines = extractLines(result.data);
    const warnings: string[] = [];

    if (!rawText) {
      warnings.push("OCR did not detect readable text.");
    }

    if (result.data.confidence < 45) {
      warnings.push("OCR confidence is low. Review the preview before importing.");
    }

    return {
      rawText,
      confidence: Math.max(0, Math.min(100, result.data.confidence)) / 100,
      lines,
      engine: "tesseract.js",
      processedAt: new Date().toISOString(),
      warnings,
    };
  });
}
