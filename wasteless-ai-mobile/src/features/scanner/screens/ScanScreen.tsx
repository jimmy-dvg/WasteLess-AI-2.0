import { useState } from 'react';
import { Alert, Modal, StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/ui/Screen';
import { Colors } from '@/constants/theme';
import { CameraCapture } from '@/features/scanner/components/CameraCapture';
import { ImagePreview } from '@/features/scanner/components/ImagePreview';
import { ScanModeSelector } from '@/features/scanner/components/ScanModeSelector';
import { ScannerEmptyState } from '@/features/scanner/components/ScannerEmptyState';
import { ScannerErrorState } from '@/features/scanner/components/ScannerErrorState';
import { ScannerResultReview } from '@/features/scanner/components/ScannerResultReview';
import { createInventoryItem } from '@/features/inventory/api';
import { useInventory } from '@/features/inventory/hooks/useInventory';
import type {
  CreateInventoryItemPayload,
  InventoryCategory,
  QuantityUnit,
  StorageZone,
} from '@/features/inventory/types';
import { getApiErrorMessage } from '@/services/api/client';
import { useAuth } from '@/store/authStore';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { scanImage } from '@/features/scanner/api';
import { useImagePicker } from '@/features/scanner/hooks/useImagePicker';
import type {
  RecognizedInventoryItem,
  ScannerImage,
  ScannerImageSource,
  ScannerState,
  ScanMode,
} from '@/features/scanner/types';

const INITIAL_SCANNER_STATE: ScannerState = {
  mode: 'product',
  image: null,
  result: null,
  isCameraOpen: false,
  isProcessing: false,
  error: null,
  successMessage: null,
};

function normalizeText(value: string) {
  return value.trim().toLocaleLowerCase();
}

function findCategoryId(categoryName: string | undefined, categories: InventoryCategory[]) {
  if (!categoryName) return null;

  const normalizedName = normalizeText(categoryName);
  return categories.find((category) => normalizeText(category.name) === normalizedName)?.id ?? null;
}

function toInventoryPayload(
  item: RecognizedInventoryItem,
  categories: InventoryCategory[],
  purchaseDate?: string | null,
): CreateInventoryItemPayload {
  const categoryId = findCategoryId(item.category, categories);
  const unmatchedCategoryNote = item.category && !categoryId ? `Recognized category: ${item.category}` : null;

  return {
    name: item.name,
    quantity: String(item.quantity ?? 1),
    unit: (item.unit ?? '') as QuantityUnit,
    categoryId,
    purchaseDate: purchaseDate ?? null,
    expirationDate: item.expirationDate ?? null,
    storageLocation: (item.storageZone ?? 'pantry') as StorageZone,
    notes: unmatchedCategoryNote,
  };
}

export function ScanScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [scanner, setScanner] = useState<ScannerState>(INITIAL_SCANNER_STATE);
  const [imageSource, setImageSource] = useState<ScannerImageSource>('camera');
  const [isSaving, setIsSaving] = useState(false);
  const { token } = useAuth();
  const inventory = useInventory();
  const { isPicking, pickImage } = useImagePicker();

  function updateMode(mode: ScanMode) {
    setScanner((current) => ({
      ...current,
      mode,
      error: null,
      result: null,
      successMessage: null,
    }));
  }

  function openCamera() {
    setScanner((current) => ({
      ...current,
      error: null,
      image: null,
      isCameraOpen: true,
      isProcessing: false,
      result: null,
      successMessage: null,
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
      result: null,
      successMessage: null,
    }));
  }

  async function handlePickImage() {
    setScanner((current) => ({
      ...current,
      error: null,
      image: null,
      isProcessing: false,
      result: null,
      successMessage: null,
    }));

    const result = await pickImage();

    if (result.image) {
      setImageSource('gallery');
      setScanner((current) => ({
        ...current,
        error: null,
        image: result.image,
        result: null,
        successMessage: null,
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

  async function handleUseImage() {
    if (!scanner.image) return;

    if (!token) {
      setScanner((current) => ({
        ...current,
        error: 'Sign in to analyze images.',
      }));
      return;
    }

    setScanner((current) => ({
      ...current,
      error: null,
      isProcessing: true,
      result: null,
      successMessage: null,
    }));

    try {
      const result = await scanImage(token, {
        mode: scanner.mode,
        image: scanner.image,
      });

      setScanner((current) => ({
        ...current,
        image: null,
        isProcessing: false,
        mode: result.mode,
        result,
      }));
    } catch (requestError) {
      setScanner((current) => ({
        ...current,
        error: getApiErrorMessage(requestError, 'Unable to analyze image.'),
        isProcessing: false,
      }));
    }
  }

  function resetImage() {
    setScanner((current) => ({
      ...INITIAL_SCANNER_STATE,
      mode: current.mode,
      error: null,
    }));
  }

  async function handleSaveItems(items: RecognizedInventoryItem[]) {
    if (!token) {
      setScanner((current) => ({ ...current, error: 'Sign in to add inventory items.' }));
      return;
    }

    setIsSaving(true);
    setScanner((current) => ({ ...current, error: null, successMessage: null }));

    let addedCount = 0;
    const failures: string[] = [];

    for (const item of items) {
      try {
        await createInventoryItem(
          token,
          toInventoryPayload(item, inventory.categories, scanner.result?.purchaseDate),
        );
        addedCount += 1;
      } catch (requestError) {
        failures.push(`${item.name}: ${getApiErrorMessage(requestError, 'Unable to add item.')}`);
      }
    }

    if (addedCount > 0) {
      await inventory.refresh();
    }

    setIsSaving(false);

    if (failures.length === 0) {
      Alert.alert(
        'Inventory updated',
        addedCount === 1 ? '1 item was added to inventory.' : `${addedCount} items were added to inventory.`,
      );
      resetImage();
      return;
    }

    setScanner((current) => ({
      ...current,
      error:
        addedCount > 0
          ? `${addedCount} item${addedCount === 1 ? '' : 's'} added. ${failures.length} failed.`
          : failures[0] ?? 'Unable to add selected items.',
      successMessage:
        addedCount > 0
          ? `${addedCount} item${addedCount === 1 ? '' : 's'} added to inventory.`
          : null,
    }));
  }

  const secondaryPreviewActionTitle = imageSource === 'camera' ? 'Retake' : 'Choose another';
  const secondaryPreviewAction = imageSource === 'camera' ? openCamera : handlePickImage;

  return (
    <Screen
      title="Scan"
      subtitle="Capture a product or receipt image, review recognized items, and add them to inventory.">
      <View style={styles.content}>
        {scanner.successMessage && !scanner.result ? (
          <Text accessibilityLiveRegion="polite" style={[styles.feedback, { color: colors.tint }]}>
            {scanner.successMessage}
          </Text>
        ) : null}

        {scanner.result ? (
          <ScannerResultReview
            categories={inventory.categories}
            errorMessage={scanner.error}
            feedbackMessage={scanner.successMessage}
            isSaving={isSaving}
            locations={inventory.locations}
            result={scanner.result}
            onReset={resetImage}
            onSave={handleSaveItems}
          />
        ) : scanner.image ? (
          <>
            {scanner.error ? (
              <ScannerErrorState
                actionTitle="Try again"
                message={scanner.error}
                onAction={() => {
                  setScanner((current) => ({ ...current, error: null }));
                  void handleUseImage();
                }}
                title="Image analysis failed"
              />
            ) : null}
            <ImagePreview
              image={scanner.image}
              isProcessing={scanner.isProcessing}
              mode={scanner.mode}
              onCancel={resetImage}
              onSecondaryAction={secondaryPreviewAction}
              onUseImage={handleUseImage}
              placeholderMessage={null}
              secondaryActionTitle={secondaryPreviewActionTitle}
            />
          </>
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
  feedback: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
  },
});
