import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import * as Localization from 'expo-localization';

const API_BASE = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:3000';

/**
 * Ensure Android notification channel is created
 */
export async function ensureAndroidChannel() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#6E7A8A',
    });
  }
}

/**
 * Register device for push notifications
 */
export async function registerForPush(jwt: string) {
  if (!Device.isDevice) {
    console.warn('Push notifications require a physical device');
    return;
  }

  await ensureAndroidChannel();

  const { status: existing } = await Notifications.getPermissionsAsync();
  let status = existing;
  
  if (status !== 'granted') {
    const { status: requested } = await Notifications.requestPermissionsAsync();
    status = requested;
  }
  
  if (status !== 'granted') {
    console.warn('Push notification permissions not granted');
    return;
  }

  // Get native device push token (APNs on iOS, FCM on Android)
  const deviceToken = await Notifications.getDevicePushTokenAsync();
  
  const platform = Platform.OS; // 'ios' | 'android'
  const provider = platform === 'ios' ? 'APNS' : 'FCM';

  // Install-scoped random device id (not hardware fingerprint)
  let deviceId = await SecureStore.getItemAsync('device_id');
  if (!deviceId) {
    deviceId = crypto.randomUUID();
    await SecureStore.setItemAsync('device_id', deviceId);
  }

    const locales = Localization.getLocales();
    const payload = {
      provider,
      token: deviceToken.data,
      platform,
      device_id: deviceId,
      app_version: '1.0.0', 
      locale: locales[0]?.languageCode || 'en',
      apns_environment: platform === 'ios' ? (__DEV__ ? 'sandbox' : 'production') : null,
    };


  try {
    const response = await fetch(`${API_BASE}/me/push-tokens`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${jwt}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error('Failed to register push token', await response.text());
    }
  } catch (error) {
    console.error('Error registering push token', error);
  }
}

/**
 * Configure notification handler
 */
export function configureNotifications() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}
