import { CameraView, useCameraPermissions as useExpoCameraPermissions } from 'expo-camera';
import type { PermissionResponse } from 'expo-camera';
import { useCallback, useEffect, useState } from 'react';

type CameraPermissionState = {
  permission: PermissionResponse | null;
  hasPermission: boolean;
  isPermissionDenied: boolean;
  canAskAgain: boolean;
  isCameraAvailable: boolean | null;
  isCheckingAvailability: boolean;
  availabilityError: string | null;
  refreshCameraAvailability: () => Promise<boolean>;
  requestCameraPermission: () => Promise<boolean>;
};

export function useCameraPermissions(): CameraPermissionState {
  const [permission, requestPermission, getPermission] = useExpoCameraPermissions();
  const [isCameraAvailable, setIsCameraAvailable] = useState<boolean | null>(null);
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(true);
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);

  const refreshCameraAvailability = useCallback(async () => {
    setIsCheckingAvailability(true);
    setAvailabilityError(null);

    try {
      const available = await CameraView.isAvailableAsync();
      setIsCameraAvailable(available);

      if (!available) {
        setAvailabilityError('Camera is not available on this device or simulator.');
      }

      return available;
    } catch {
      setIsCameraAvailable(false);
      setAvailabilityError('Camera availability could not be checked.');
      return false;
    } finally {
      setIsCheckingAvailability(false);
    }
  }, []);

  useEffect(() => {
    void refreshCameraAvailability();
  }, [refreshCameraAvailability]);

  const requestCameraPermission = useCallback(async () => {
    const available = isCameraAvailable ?? (await refreshCameraAvailability());

    if (!available) return false;

    const currentPermission = permission ?? (await getPermission());

    if (currentPermission.granted) return true;

    const nextPermission = await requestPermission();
    return nextPermission.granted;
  }, [getPermission, isCameraAvailable, permission, refreshCameraAvailability, requestPermission]);

  return {
    permission,
    hasPermission: permission?.granted ?? false,
    isPermissionDenied: permission?.status === 'denied' && !permission.granted,
    canAskAgain: permission?.canAskAgain ?? true,
    isCameraAvailable,
    isCheckingAvailability,
    availabilityError,
    refreshCameraAvailability,
    requestCameraPermission,
  };
}
