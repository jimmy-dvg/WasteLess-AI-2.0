export type ScanMode = 'product' | 'receipt';

export type ScannerImage = {
  uri: string;
  width: number;
  height: number;
  fileName?: string;
  mimeType?: string;
};

export type ScannerImageSource = 'camera' | 'gallery';

export type ScannerState = {
  mode: ScanMode;
  image: ScannerImage | null;
  isCameraOpen: boolean;
  isProcessing: boolean;
  error: string | null;
  placeholderMessage: string | null;
};
