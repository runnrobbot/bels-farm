/**
 * Minimal ambient typings for the native Barcode Detection API, which isn't yet
 * in TS's DOM lib. Available in Chromium/Android (primary devices for field
 * staff). We feature-detect at runtime and fall back to manual entry elsewhere.
 */
interface DetectedBarcode {
  rawValue: string;
  format: string;
}

interface BarcodeDetectorInstance {
  detect(source: CanvasImageSource | ImageBitmapSource): Promise<DetectedBarcode[]>;
}

interface BarcodeDetectorConstructor {
  new (options?: { formats?: string[] }): BarcodeDetectorInstance;
  getSupportedFormats?: () => Promise<string[]>;
}

interface Window {
  BarcodeDetector?: BarcodeDetectorConstructor;
}
