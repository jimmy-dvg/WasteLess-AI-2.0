import { Ionicons } from '@expo/vector-icons';
import { CameraView } from 'expo-camera';
import type { CameraCapturedPicture } from 'expo-camera';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { Colors } from '@/constants/theme';
import { ScannerErrorState } from '@/features/scanner/components/ScannerErrorState';
import { useCameraPermissions } from '@/features/scanner/hooks/useCameraPermissions';
import type { ScannerImage, ScanMode } from '@/features/scanner/types';
import { useColorScheme } from '@/hooks/use-color-scheme';

type CameraCaptureProps = {
  mode: ScanMode;
  onCapture: (image: ScannerImage) => void;
  onClose: () => void;
};

const MODE_LABELS = {
  product: 'Product photo',
  receipt: 'Receipt photo',
} as const;

function toScannerImage(photo: CameraCapturedPicture): ScannerImage {
  return {
    uri: photo.uri,
    width: photo.width,
    height: photo.height,
    mimeType: photo.format === 'png' ? 'image/png' : 'image/jpeg',
  };
}

export function CameraCapture({ mode, onCapture, onClose }: CameraCaptureProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const cameraRef = useRef<CameraView | null>(null);
  const didRequestPermission = useRef(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const {
    availabilityError,
    canAskAgain,
    hasPermission,
    isCameraAvailable,
    isCheckingAvailability,
    isPermissionDenied,
    permission,
    refreshCameraAvailability,
    requestCameraPermission,
  } = useCameraPermissions();

  useEffect(() => {
    if (didRequestPermission.current) return;

    didRequestPermission.current = true;
    void requestCameraPermission();
  }, [requestCameraPermission]);

  async function handleOpenSettings() {
    try {
      await Linking.openSettings();
    } catch {
      setCameraError('Settings could not be opened from the app.');
    }
  }

  async function handleTakePhoto() {
    if (!cameraRef.current || !isCameraReady) {
      setCameraError('Camera is still getting ready. Please try again in a moment.');
      return;
    }

    setIsCapturing(true);
    setCameraError(null);

    try {
      const photo = await cameraRef.current.takePictureAsync({
        base64: false,
        exif: false,
        quality: 0.85,
      });

      if (!photo?.uri) {
        setCameraError('Photo capture did not return an image. Please try again.');
        return;
      }

      onCapture(toScannerImage(photo));
    } catch {
      setCameraError('Photo capture failed. Please try again.');
    } finally {
      setIsCapturing(false);
    }
  }

  if (isCheckingAvailability || permission === null) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator color={colors.tint} />
        <Text style={styles.loadingText}>Preparing camera...</Text>
        <Button title="Close" onPress={onClose} style={styles.loadingButton} variant="secondary" />
      </SafeAreaView>
    );
  }

  if (isCameraAvailable === false) {
    return (
      <SafeAreaView style={[styles.errorContainer, { backgroundColor: colors.background }]}>
        <ScannerErrorState
          actionTitle="Check again"
          message={availabilityError ?? 'Camera is unavailable. You can still choose an image from your gallery.'}
          onAction={() => {
            void refreshCameraAvailability();
          }}
          onSecondaryAction={onClose}
          secondaryActionTitle="Close camera"
          title="Camera unavailable"
        />
      </SafeAreaView>
    );
  }

  if (isPermissionDenied || !hasPermission) {
    return (
      <SafeAreaView style={[styles.errorContainer, { backgroundColor: colors.background }]}>
        <ScannerErrorState
          actionTitle={canAskAgain ? 'Grant camera access' : 'Open settings'}
          message={
            canAskAgain
              ? 'Camera access is needed to take product and receipt photos.'
              : 'Camera access is disabled. Enable it in Settings or choose an image from your gallery.'
          }
          onAction={() => {
            if (canAskAgain) {
              void requestCameraPermission();
              return;
            }

            void handleOpenSettings();
          }}
          onSecondaryAction={onClose}
          secondaryActionTitle="Close camera"
          title="Camera permission needed"
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" onPress={onClose} style={styles.iconButton}>
          <Ionicons name="close" size={24} color="#FFFFFF" />
        </Pressable>
        <Text style={styles.headerTitle}>{MODE_LABELS[mode]}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <CameraView
        ref={cameraRef}
        animateShutter
        facing="back"
        mode="picture"
        onCameraReady={() => {
          setIsCameraReady(true);
          setCameraError(null);
        }}
        onMountError={() => {
          setCameraError('Camera preview could not start. Close the camera and try again.');
        }}
        style={styles.camera}
      />

      <View style={styles.controls}>
        <Text style={styles.instruction}>
          Keep the {mode === 'product' ? 'label or expiration date' : 'receipt text'} inside the frame.
        </Text>
        {cameraError ? (
          <Text accessibilityRole="alert" style={styles.errorText}>
            {cameraError}
          </Text>
        ) : null}
        <View style={styles.actions}>
          <Button title="Close" onPress={onClose} style={styles.actionButton} variant="secondary" />
          <Button
            disabled={!isCameraReady || isCapturing}
            title={isCapturing ? 'Taking photo...' : 'Take photo'}
            onPress={handleTakePhoto}
            style={styles.actionButton}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#000000',
    flex: 1,
  },
  loadingContainer: {
    alignItems: 'center',
    backgroundColor: '#000000',
    flex: 1,
    gap: 14,
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 15,
  },
  loadingButton: {
    alignSelf: 'stretch',
    marginTop: 8,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  iconButton: {
    alignItems: 'center',
    borderRadius: 8,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  headerSpacer: {
    width: 44,
  },
  camera: {
    flex: 1,
  },
  controls: {
    gap: 12,
    padding: 16,
  },
  instruction: {
    color: '#FFFFFF',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  errorText: {
    color: '#F97066',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    flex: 1,
  },
});
