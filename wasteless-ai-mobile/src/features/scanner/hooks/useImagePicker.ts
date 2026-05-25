import * as ImagePicker from 'expo-image-picker';
import { useCallback, useState } from 'react';

import type { ScannerImage } from '@/features/scanner/types';

type PickImageResult = {
  image: ScannerImage | null;
  error: string | null;
};

export function useImagePicker() {
  const [permission, requestPermission] = ImagePicker.useMediaLibraryPermissions();
  const [isPicking, setIsPicking] = useState(false);

  const pickImage = useCallback(async (): Promise<PickImageResult> => {
    setIsPicking(true);

    try {
      const currentPermission = permission?.granted ? permission : await requestPermission();

      if (!currentPermission.granted) {
        return {
          image: null,
          error: currentPermission.canAskAgain
            ? 'Photo library access is needed to choose a product or receipt image.'
            : 'Photo library access is disabled. Enable it in Settings or use the camera.',
        };
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: false,
        allowsMultipleSelection: false,
        base64: false,
        exif: false,
        mediaTypes: ['images'],
        quality: 0.9,
        selectionLimit: 1,
      });

      if (result.canceled) {
        return { image: null, error: null };
      }

      const asset = result.assets[0];

      if (!asset?.uri) {
        return { image: null, error: 'No image was selected.' };
      }

      if (asset.type && asset.type !== 'image') {
        return { image: null, error: 'Please choose an image file.' };
      }

      return {
        image: {
          uri: asset.uri,
          width: asset.width,
          height: asset.height,
          fileName: asset.fileName ?? undefined,
          mimeType: asset.mimeType,
        },
        error: null,
      };
    } catch {
      return {
        image: null,
        error: 'Image selection failed. Please try again.',
      };
    } finally {
      setIsPicking(false);
    }
  }, [permission, requestPermission]);

  return {
    permission,
    isPicking,
    pickImage,
    isPermissionDenied: permission?.status === ImagePicker.PermissionStatus.DENIED,
    canAskAgain: permission?.canAskAgain ?? true,
  };
}
