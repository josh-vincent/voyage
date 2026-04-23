import { useMemo, useState } from 'react';
import { Platform, View } from 'react-native';
import Constants from 'expo-constants';
import * as LocalAuthentication from 'expo-local-authentication';
import { AppleMaps, requestPermissionsAsync as requestMapPermissionsAsync } from 'expo-maps';
import * as Notifications from 'expo-notifications';
import Header from '@/components/Header';
import ThemedScroller from '@/components/ThemeScroller';
import Section from '@/components/layout/Section';
import ThemedText from '@/components/ThemedText';
import { Button } from '@/components/Button';
import TripStatusWidget from '@/widgets/TripStatusWidget';

const TOKYO = { latitude: 35.6764, longitude: 139.65 };

function formatBiometricTypes(types: LocalAuthentication.AuthenticationType[]) {
  if (types.length === 0) return 'none';
  return types
    .map((type) => {
      if (type === LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION) return 'Face ID';
      if (type === LocalAuthentication.AuthenticationType.FINGERPRINT) return 'Touch ID';
      if (type === LocalAuthentication.AuthenticationType.IRIS) return 'Iris';
      return 'Unknown';
    })
    .join(', ');
}

export default function NativeFeaturesScreen() {
  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId ?? null;

  const [pushStatus, setPushStatus] = useState('Not requested yet');
  const [pushToken, setPushToken] = useState<string | null>(null);
  const [biometricsStatus, setBiometricsStatus] = useState('Not checked yet');
  const [mapStatus, setMapStatus] = useState('Not requested yet');
  const [widgetStatus, setWidgetStatus] = useState('Not updated yet');

  const mapMarkers = useMemo<AppleMaps.Marker[]>(
    () => [
      {
        id: 'tokyo',
        coordinates: TOKYO,
        title: 'Tokyo',
        systemImage: 'airplane.departure',
      },
    ],
    []
  );

  const handlePushRegistration = async () => {
    try {
      const current = await Notifications.getPermissionsAsync();
      let finalStatus = current.status;
      if (finalStatus !== 'granted') {
        const requested = await Notifications.requestPermissionsAsync();
        finalStatus = requested.status;
      }

      setPushStatus(finalStatus);
      if (finalStatus !== 'granted') {
        setPushToken(null);
        return;
      }

      if (!projectId) {
        throw new Error('EAS project ID is missing from app config.');
      }

      const token = await Notifications.getExpoPushTokenAsync({ projectId });
      setPushToken(token.data);
    } catch (error: any) {
      setPushStatus(error?.message ?? 'Failed to register for push notifications');
      setPushToken(null);
    }
  };

  const handleBiometricCheck = async () => {
    try {
      const [hasHardware, isEnrolled, supportedTypes] = await Promise.all([
        LocalAuthentication.hasHardwareAsync(),
        LocalAuthentication.isEnrolledAsync(),
        LocalAuthentication.supportedAuthenticationTypesAsync(),
      ]);

      setBiometricsStatus(
        `hardware: ${hasHardware ? 'yes' : 'no'} · enrolled: ${isEnrolled ? 'yes' : 'no'} · types: ${formatBiometricTypes(supportedTypes)}`
      );
    } catch (error: any) {
      setBiometricsStatus(error?.message ?? 'Biometric check failed');
    }
  };

  const handleBiometricAuth = async () => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Unlock Voyage',
        cancelLabel: 'Cancel',
      });

      setBiometricsStatus(result.success ? 'Biometric authentication succeeded' : `Authentication failed: ${result.error ?? 'unknown'}`);
    } catch (error: any) {
      setBiometricsStatus(error?.message ?? 'Biometric authentication failed');
    }
  };

  const handleMapPermission = async () => {
    try {
      const result = await requestMapPermissionsAsync();
      setMapStatus(result.status);
    } catch (error: any) {
      setMapStatus(error?.message ?? 'Map permission request failed');
    }
  };

  const handleWidgetUpdate = () => {
    TripStatusWidget.updateSnapshot({
      eyebrow: 'Next trip',
      title: 'Tokyo escape',
      subtitle: 'Boarding in 2 hours',
      footer: `Updated ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
    });
    setWidgetStatus('Trip Status widget snapshot updated');
  };

  return (
    <View className="flex-1 bg-light-primary dark:bg-dark-primary">
      <Header showBackButton />
      <ThemedScroller>
        <Section
          title="Native features"
          subtitle="These controls validate the native modules we want included before the first App Store build."
          titleSize="3xl"
          className="px-4 pt-4 pb-8"
        />

        <View className="px-4 gap-8">
          <View className="gap-3">
            <ThemedText className="text-lg font-semibold">Notifications</ThemedText>
            <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext">
              Status: {pushStatus}
            </ThemedText>
            <ThemedText className="text-xs text-light-subtext dark:text-dark-subtext">
              Token: {pushToken ?? 'Not available yet'}
            </ThemedText>
            <Button title="Register for push notifications" onPress={handlePushRegistration} />
          </View>

          <View className="gap-3">
            <ThemedText className="text-lg font-semibold">Biometrics</ThemedText>
            <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext">
              {biometricsStatus}
            </ThemedText>
            <View className="flex-row gap-3">
              <View className="flex-1">
                <Button title="Check availability" variant="secondary" onPress={handleBiometricCheck} />
              </View>
              <View className="flex-1">
                <Button title="Authenticate" onPress={handleBiometricAuth} />
              </View>
            </View>
          </View>

          <View className="gap-3">
            <ThemedText className="text-lg font-semibold">Maps</ThemedText>
            <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext">
              Location permission: {mapStatus}
            </ThemedText>
            <Button title="Request map location access" variant="secondary" onPress={handleMapPermission} />
            <AppleMaps.View
              style={{ height: 240, borderRadius: 24, overflow: 'hidden' }}
              cameraPosition={{ coordinates: TOKYO, zoom: 11 }}
              markers={mapMarkers}
              properties={{ selectionEnabled: true }}
              uiSettings={{ compassEnabled: true, scaleBarEnabled: true, myLocationButtonEnabled: true }}
            />
          </View>

          <View className="gap-3">
            <ThemedText className="text-lg font-semibold">Widgets</ThemedText>
            <ThemedText className="text-sm text-light-subtext dark:text-dark-subtext">
              {widgetStatus}
            </ThemedText>
            <ThemedText className="text-xs text-light-subtext dark:text-dark-subtext">
              On iOS, add the Trip Status widget from the Home Screen widget gallery after installing the app.
            </ThemedText>
            <Button title="Update widget snapshot" variant="secondary" onPress={handleWidgetUpdate} />
          </View>

          <ThemedText className="text-xs text-light-subtext dark:text-dark-subtext">
            Running on {Platform.OS} with project ID {projectId ?? 'missing'}.
          </ThemedText>
        </View>
      </ThemedScroller>
    </View>
  );
}
