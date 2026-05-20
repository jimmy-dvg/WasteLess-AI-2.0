# Scanning Architecture

The scanning system is split into isolated layers so barcode, OCR, AI parsing, and inventory import can evolve independently.

- `src/scanning`: shared types, validation, scan history, shelf-life estimation, and dashboard UI.
- `src/barcode`: provider orchestration for local cache, Open Food Facts, USDA FoodData Central, and optional Barcode Lookup API.
- `src/ocr`: Tesseract.js OCR worker service for receipt images.
- `src/ai-parsing`: AI-only receipt understanding with a deterministic heuristic fallback.
- `src/image-processing`: browser compression/brightness/blur checks plus server upload validation.
- `src/storage`: Cloudinary signed server uploads for persisted receipt images.

Flow:

1. Barcode camera scan or manual code entry calls `/api/scanning/barcode`.
2. Product metadata is resolved, cached in `barcode_products`, and scan telemetry is saved to `scan_history`.
3. Receipt upload is compressed/enhanced in the browser, validated server-side, uploaded to storage when configured, OCRed, then parsed by AI.
4. Users edit OCR text or parsed items before calling `/api/scanning/import`.
5. Confirmed products are inserted into the existing `products` inventory table.

Photo recognition flow:

1. Food images are compressed, enhanced, and auto-cropped client-side.
2. `/api/scanning/photo/analyze` validates and stores the image, then sends it to the isolated vision parser.
3. The parser returns the same confirmation shape as receipts so users can edit names, quantities, storage, and dates before import.

Optional integrations:

- `OPENAI_VISION_MODEL` enables shelf/fridge object recognition.
- `USDA_FDC_API_KEY` enriches barcode lookup from USDA FoodData Central.
- `BARCODE_LOOKUP_API_KEY` adds a third barcode fallback provider.
- Cloudinary variables enable durable receipt/photo image storage.
