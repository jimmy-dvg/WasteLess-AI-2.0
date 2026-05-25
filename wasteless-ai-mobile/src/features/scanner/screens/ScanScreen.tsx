import { useEffect, useRef, useState } from 'react';
import { Modal, StyleSheet, View } from 'react-native';

import { Screen } from '@/components/ui/Screen';
import { CameraCapture } from '@/features/scanner/components/CameraCapture';
import { ImagePreview } from '@/features/scanner/components/ImagePreview';
import { ScanModeSelector } from '@/features/scanner/components/ScanModeSelector';
import { ScannerEmptyState } from '@/features/scanner/components/ScannerEmptyState';
import { ScannerErrorState } from '@/features/scanner/components/ScannerErrorState';
import { useImagePicker } from '@/features/scanner/hooks/useImagePicker';
import type {
  ScannerImage,
  ScannerImageSource,
  ScannerState,
  ScanMode,
} from '@/features/scanner/types';

const INITIAL_SCANNER_STATE: ScannerState = {
  mode: 'product',
  image: null,
  isCameraOpen: false,
  isProcessing: false,
  error: null,
  placeholderMessage: null,
};

function getPlaceholderMessage(mode: ScanMode) {
  return mode === 'product'
    ? 'Product recognition will be implemented in the next step. No image was uploaded or saved.'
    : 'Receipt OCR and parsing will be implemented in the next step. No image was uploaded or saved.';
}

export function ScanScreen() {
  const [scanner, setScanner] = useState<ScannerState>(INITIAL_SCANNER_STATE);
  const [imageSource, setImageSource] = useState<ScannerImageSource>('camera');
  const processingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { isPicking, pickImage } = useImagePicker();

  useEffect(() => {
    return () => {
      if (processingTimer.current) {
        clearTimeout(processingTimer.current);
      }
    };
  }, []);

  function clearProcessingTimer() {
    if (!processingTimer.current) return;

    clearTimeout(processingTimer.current);
    processingTimer.current = null;
  }

  function updateMode(mode: ScanMode) {
    setScanner((current) => ({
      ...current,
      mode,
      error: null,
      placeholderMessage: null,
    }));
  }

  function openCamera() {
    clearProcessingTimer();
    setScanner((current) => ({
      ...current,
      error: null,
      image: null,
      isCameraOpen: true,
      isProcessing: false,
      placeholderMessage: null,
    }));
  }

  function closeCamera() {
    setScanner((current) => ({
      ...current,
      isCameraOpen: false,
    }));
  }

  function handleCameraCapture(image: ScannerImage) {
    setImageSource('camera');
    setScanner((current) => ({
      ...current,
      error: null,
      image,
      isCameraOpen: false,
      isProcessing: false,
      placeholderMessage: null,
    }));
  }

  async function handlePickImage() {
    clearProcessingTimer();
    setScanner((current) => ({
      ...current,
      error: null,
      image: null,
      isProcessing: false,
      placeholderMessage: null,
    }));

    const result = await pickImage();

    if (result.image) {
      setImageSource('gallery');
      setScanner((current) => ({
        ...current,
        error: null,
        image: result.image,
      }));
      return;
    }

    if (result.error) {
      setScanner((current) => ({
        ...current,
        error: result.error,
      }));
    }
  }

  function handleUseImage() {
    if (!scanner.image) return;

    clearProcessingTimer();
    setScanner((current) => ({
      ...current,
      error: null,
      isProcessing: true,
      placeholderMessage: null,
    }));

    processingTimer.current = setTimeout(() => {
      setScanner((current) => ({
        ...current,
        isProcessing: false,
        placeholderMessage: getPlaceholderMessage(current.mode),
      }));
      processingTimer.current = null;
    }, 350);
  }

  function resetImage() {
    clearProcessingTimer();
    setScanner((current) => ({
      ...current,
      error: null,
      image: null,
      isCameraOpen: false,
      isProcessing: false,
      placeholderMessage: null,
    }));
  }

  const secondaryPreviewActionTitle = imageSource === 'camera' ? 'Retake' : 'Choose another';
  const secondaryPreviewAction = imageSource === 'camera' ? openCamera : handlePickImage;

  return (
    <Screen
      title="Scan"
      subtitle="Capture a product or receipt image now; AI recognition will plug into this flow later.">
      <View style={styles.content}>
        {scanner.image ? (
          <ImagePreview
            image={scanner.image}
            isProcessing={scanner.isProcessing}
            mode={scanner.mode}
            onCancel={resetImage}
            onSecondaryAction={secondaryPreviewAction}
            onUseImage={handleUseImage}
            placeholderMessage={scanner.placeholderMessage}
            secondaryActionTitle={secondaryPreviewActionTitle}
          />
        ) : (
          <>
            <ScanModeSelector disabled={isPicking} mode={scanner.mode} onChange={updateMode} />
            {scanner.error ? (
              <ScannerErrorState
                actionTitle="Dismiss"
                message={scanner.error}
                onAction={() => {
                  setScanner((current) => ({ ...current, error: null }));
                }}
                title="Scanner action unavailable"
              />
            ) : null}
            <ScannerEmptyState
              isGalleryBusy={isPicking}
              mode={scanner.mode}
              onOpenCamera={openCamera}
              onPickImage={handlePickImage}
            />
          </>
        )}
      </View>

      <Modal
        animationType="slide"
        onRequestClose={closeCamera}
        presentationStyle="fullScreen"
        visible={scanner.isCameraOpen}>
        {scanner.isCameraOpen ? (
          <CameraCapture
            mode={scanner.mode}
            onCapture={handleCameraCapture}
            onClose={closeCamera}
          />
        ) : null}
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 16,
  },
});
