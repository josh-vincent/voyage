import Constants from 'expo-constants';
import { Platform } from 'react-native';

function resolveBase(): string {
  const hostUri =
    Constants.expoConfig?.hostUri ??
    (Constants as any).manifest2?.extra?.expoGo?.developer?.host ??
    (Constants as any).manifest?.debuggerHost ??
    '';
  const host = hostUri ? hostUri.split(':')[0] : Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
  return `http://${host}:8081`;
}

export const API_BASE = resolveBase();

export function api(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_BASE}${path}`;
}
