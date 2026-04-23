import Constants from 'expo-constants';
import { Platform } from 'react-native';

function normalizeBaseUrl(value: string): string {
  return value.replace(/\/+$/, '');
}

function parseDevServer(value: string): { host: string; port?: string } | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const sanitized = trimmed
    .replace(/^[a-z]+:\/\//i, '')
    .replace(/\/.*$/, '');
  const [host, port] = sanitized.split(':');
  if (!host) return null;
  return { host, port };
}

function resolveBase(): string {
  const configuredBase = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();
  if (configuredBase) {
    return normalizeBaseUrl(configuredBase);
  }

  const hostUri =
    Constants.expoConfig?.hostUri ??
    (Constants as any).manifest2?.extra?.expoGo?.developer?.host ??
    (Constants as any).manifest?.debuggerHost ??
    '';
  const devServer = parseDevServer(hostUri);
  const host = devServer?.host ?? (Platform.OS === 'android' ? '10.0.2.2' : 'localhost');
  const port = devServer?.port ?? '8081';

  if (!hostUri && !__DEV__) {
    console.warn('EXPO_PUBLIC_API_BASE_URL is not set. Falling back to localhost:8081, which will not work in TestFlight or production builds.');
  }

  return `http://${host}:${port}`;
}

export const API_BASE = resolveBase();

export function api(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_BASE}${path}`;
}
